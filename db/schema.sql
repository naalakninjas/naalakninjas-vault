-- ============================================================================
-- Naalak Ninjas Vault — canonical database schema
--
-- This is the single source of truth for the Supabase/PostgreSQL side of the
-- app. It replaces the ~20 one-off migration, patch and debug scripts that
-- previously lived in the repo root.
--
-- Run it in the Supabase SQL editor. It is idempotent: every statement uses
-- IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS, so re-running it on
-- an existing project is safe and will not touch your data.
--
-- To clear transactional data for a clean test run, use db/reset-data.sql.
-- ============================================================================


-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- Needed for crypt() and gen_salt(): login PINs are stored as bcrypt hashes,
-- never in plaintext. Supabase ships pgcrypto in the `extensions` schema, so
-- this is normally a no-op — it is here so a plain Postgres project works too.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- The squad. `id` is referenced by every other table and by the `ninjas`
-- array in src/contexts/AuthContext.jsx, so these ids must stay stable.
CREATE TABLE IF NOT EXISTS members (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    color       VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly deposits into the vault.
--
-- Deliberately NOT UNIQUE on (member_id, month, year): a ninja may pay in
-- more than one instalment for the same month, and the UI sums them.
CREATE TABLE IF NOT EXISTS contributions (
    id            SERIAL PRIMARY KEY,
    member_id     INTEGER REFERENCES members(id) ON DELETE CASCADE,
    amount        DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
    month         INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year          INTEGER NOT NULL CHECK (year >= 2020),
    payment_date  DATE,
    utr_number    VARCHAR(50),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency fund requests. Money leaves the vault when status becomes
-- 'approved', and is considered settled when it becomes 'repaid'.
CREATE TABLE IF NOT EXISTS missions (
    id           SERIAL PRIMARY KEY,
    member_id    INTEGER REFERENCES members(id) ON DELETE CASCADE,
    amount       DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    reason       TEXT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected', 'repaid')),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at  TIMESTAMP WITH TIME ZONE,
    rejected_at  TIMESTAMP WITH TIME ZONE
);

-- One vote per member per mission. The app upserts on (mission_id, member_id),
-- so this unique constraint is load-bearing.
CREATE TABLE IF NOT EXISTS votes (
    id          SERIAL PRIMARY KEY,
    mission_id  INTEGER REFERENCES missions(id) ON DELETE CASCADE,
    member_id   INTEGER REFERENCES members(id) ON DELETE CASCADE,
    vote        VARCHAR(10) NOT NULL CHECK (vote IN ('approve', 'reject')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (mission_id, member_id)
);

-- Repayments against a mission. `member_id` is required: a trigger checks it
-- matches the mission's owner so nobody can repay on someone else's behalf.
CREATE TABLE IF NOT EXISTS repayments (
    id            SERIAL PRIMARY KEY,
    mission_id    INTEGER REFERENCES missions(id) ON DELETE CASCADE,
    member_id     INTEGER REFERENCES members(id) ON DELETE CASCADE,
    amount        DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_date  DATE NOT NULL,
    notes         TEXT,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Append-only audit log. Written by triggers, never by the app directly.
CREATE TABLE IF NOT EXISTS activity (
    id           SERIAL PRIMARY KEY,
    message      TEXT NOT NULL,
    member_id    INTEGER REFERENCES members(id) ON DELETE SET NULL,
    action_type  VARCHAR(50),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Every sign-in attempt, successful or not. Written by verify_member_pin()
-- rather than by the browser, so the record cannot be skipped and a wrong PIN
-- is visible too. Shown in the Vault Status panel.
CREATE TABLE IF NOT EXISTS login_events (
    id          SERIAL PRIMARY KEY,
    member_id   INTEGER REFERENCES members(id) ON DELETE CASCADE,
    succeeded   BOOLEAN NOT NULL,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- One row per keep-alive cron run, written by api/keep-alive.js. The point of
-- the cron job is to keep Supabase from pausing the project, and until now the
-- only evidence it ran was in Vercel's logs; this puts it in the app.
--
-- Recording the run is itself a write, so it doubles as the activity that
-- keeps the project awake.
-- `source` is 'cron' for Vercel's scheduled run and 'manual' for the Run now
-- button in Vault Status. The calendar draws them differently: a manual ping
-- keeps Postgres awake just as well, but a day that only ever saw a manual
-- ping is not evidence that the cron fired, and must not look like it is.
CREATE TABLE IF NOT EXISTS keep_alive_runs (
    id      SERIAL PRIMARY KEY,
    ran_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ok      BOOLEAN NOT NULL,
    detail  TEXT,
    source  VARCHAR(10) NOT NULL DEFAULT 'cron'
);

-- Business rules, editable from the Settings page. Values are stored as text
-- and cast where used, so a key can hold a number or a flag.
CREATE TABLE IF NOT EXISTS vault_settings (
    id           SERIAL PRIMARY KEY,
    key          VARCHAR(50) NOT NULL UNIQUE,
    value        TEXT NOT NULL,
    description  TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login PINs. These belong to the member, not to a browser: an earlier version
-- kept them in each device's localStorage, which meant a ninja who had set a
-- PIN on their phone was still offered first-run setup on everyone else's
-- device — and that device could then set a different PIN for them.
--
-- `pin_hash` is bcrypt. The anon role has no column privilege to read it (see
-- section 9) and every comparison happens inside the SECURITY DEFINER
-- functions in section 4.
ALTER TABLE members ADD COLUMN IF NOT EXISTS pin_hash   TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMP WITH TIME ZONE;

-- Older revisions of this schema shipped repayments without member_id and
-- vault_settings without description. Backfill both for existing projects.
ALTER TABLE repayments     ADD COLUMN IF NOT EXISTS member_id   INTEGER REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE repayments     ADD COLUMN IF NOT EXISTS notes       TEXT;
ALTER TABLE vault_settings ADD COLUMN IF NOT EXISTS description TEXT;

-- Runs recorded before the Run now button existed were all cron runs, which
-- is exactly what the default backfills them as.
ALTER TABLE keep_alive_runs ADD COLUMN IF NOT EXISTS source VARCHAR(10) NOT NULL DEFAULT 'cron';

-- An early revision made (member_id, month, year) unique on contributions,
-- which blocked split payments. Drop it if this project still has it.
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_member_id_month_year_key;


-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contributions_member_date ON contributions (member_id, year, month);
CREATE INDEX IF NOT EXISTS idx_missions_status           ON missions (status);
CREATE INDEX IF NOT EXISTS idx_votes_mission             ON votes (mission_id);
CREATE INDEX IF NOT EXISTS idx_repayments_mission        ON repayments (mission_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at       ON activity (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at   ON login_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keep_alive_runs_ran_at    ON keep_alive_runs (ran_at DESC);


-- ============================================================================
-- 3. REFERENCE DATA
--
-- The four members and the default business rules. Both use ON CONFLICT
-- DO NOTHING, so existing rows and edited settings are never overwritten.
-- ============================================================================

INSERT INTO members (id, name, color) VALUES
    (1, 'Shilpha', 'ninja-emerald'),
    (2, 'Suhas',   'ninja-crimson'),
    (3, 'Sudeep',  'ninja-azure'),
    (4, 'Aneesh',  'ninja-gold')
ON CONFLICT (id) DO NOTHING;

-- Keep the sequence ahead of the explicit ids above.
SELECT setval('members_id_seq', GREATEST((SELECT MAX(id) FROM members), 1));

INSERT INTO vault_settings (key, value, description) VALUES
    ('monthly_contribution',  '5000',  'Monthly contribution amount per member'),
    ('minimum_balance',       '50000', 'Reserve that must always remain in the vault'),
    ('withdrawal_percentage', '50',    'Maximum share of the available balance one mission may request'),
    ('required_approvals',    '3',     'Approvals needed before a mission is approved'),
    ('lock_period_months',    '3',     'Months before contributions may be withdrawn'),
    ('edit_window_hours',     '24',    'Hours a ninja may still edit or delete their own entry')
ON CONFLICT (key) DO NOTHING;


-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Cash currently held by the vault.
--
--   contributions
--   - money disbursed  (every mission that was ever approved, including ones
--                       later marked 'repaid')
--   + money paid back  (all repayments)
--
-- Counting 'repaid' missions in the disbursed total is what makes repayments
-- net out correctly. Two earlier versions of this function got this wrong:
-- one omitted repayments entirely, so a partial repayment never showed up in
-- the balance; the other added repayments but only subtracted missions still
-- in 'approved', so a fully repaid mission counted its repayment twice and
-- inflated the balance.
CREATE OR REPLACE FUNCTION get_vault_balance()
RETURNS DECIMAL(10,2) AS $$
DECLARE
    contributed DECIMAL(10,2);
    disbursed   DECIMAL(10,2);
    repaid      DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO contributed FROM contributions;

    SELECT COALESCE(SUM(amount), 0) INTO disbursed
    FROM missions
    WHERE status IN ('approved', 'repaid');

    SELECT COALESCE(SUM(amount), 0) INTO repaid FROM repayments;

    RETURN contributed - disbursed + repaid;
END;
$$ LANGUAGE plpgsql;

-- Balance that may actually be spent: the vault balance less the reserve,
-- floored at zero. Callers must not subtract the reserve again.
CREATE OR REPLACE FUNCTION get_available_balance()
RETURNS DECIMAL(10,2) AS $$
DECLARE
    vault_bal   DECIMAL(10,2);
    min_balance DECIMAL(10,2);
BEGIN
    vault_bal := get_vault_balance();

    SELECT value::DECIMAL INTO min_balance
    FROM vault_settings
    WHERE key = 'minimum_balance';

    min_balance := COALESCE(min_balance, 50000);

    RETURN GREATEST(vault_bal - min_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- How long a ninja may still change something they entered.
--
-- Read from vault_settings so the window can be tuned without editing this
-- file, and tolerant of a missing or non-numeric value: a broken setting must
-- not make the ledger permanently uneditable, nor permanently editable.
CREATE OR REPLACE FUNCTION edit_window_hours()
RETURNS INTEGER AS $$
DECLARE
    configured INTEGER;
BEGIN
    BEGIN
        SELECT NULLIF(value, '')::INTEGER INTO configured
        FROM vault_settings
        WHERE key = 'edit_window_hours';
    EXCEPTION WHEN OTHERS THEN
        configured := NULL;
    END;

    RETURN COALESCE(configured, 24);
END;
$$ LANGUAGE plpgsql;

-- Single entry point for the audit log, so trigger bodies stay readable.
CREATE OR REPLACE FUNCTION add_activity(
    p_message      TEXT,
    p_member_id    INTEGER DEFAULT NULL,
    p_action_type  VARCHAR(50) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO activity (message, member_id, action_type)
    VALUES (p_message, p_member_id, p_action_type);
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- PIN handling
--
-- All three run SECURITY DEFINER with a pinned search_path, and they are the
-- only route to members.pin_hash: the anon role cannot select or update that
-- column at all. So a caller can ask "is this PIN correct?" but cannot read
-- the hash back out to attack it offline.
--
-- Keep the limit in view: four digits is a 10,000-value space, and anyone with
-- the public anon key can still call verify_member_pin() in a loop. bcrypt
-- makes that slow, not impossible. This is a gate that tells four friends
-- apart, not authentication. Supabase Auth is the real fix — see the RLS note
-- in section 8.
-- ----------------------------------------------------------------------------

-- Who has completed first-run setup. Safe to expose because it returns one
-- boolean per member and never the hash. This is what lets every device agree
-- on whether a ninja should be asked to choose a PIN or enter one.
CREATE OR REPLACE FUNCTION member_pin_status()
RETURNS TABLE (member_id INTEGER, has_pin BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT id, pin_hash IS NOT NULL FROM members ORDER BY id;
$$;

-- A missing hash returns false rather than raising: "nobody has claimed this
-- ninja yet" is a normal state, and the caller routes to setup instead.
--
-- Every attempt is recorded in login_events, successes and failures alike.
-- Doing it here rather than in the browser means the record cannot be skipped,
-- and it is the only place that knows whether the PIN was right.
CREATE OR REPLACE FUNCTION verify_member_pin(p_member_id INTEGER, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    stored  TEXT;
    matched BOOLEAN;
    agent   TEXT;
BEGIN
    SELECT pin_hash INTO stored FROM members WHERE id = p_member_id;

    matched := stored IS NOT NULL AND stored = crypt(p_pin, stored);

    -- PostgREST exposes the request headers as a setting. Absent when the
    -- function is called straight from SQL, and malformed if something else
    -- has set it, so neither case is allowed to fail the sign-in.
    BEGIN
        agent := NULLIF(current_setting('request.headers', true), '')::json ->> 'user-agent';
    EXCEPTION WHEN OTHERS THEN
        agent := NULL;
    END;

    INSERT INTO login_events (member_id, succeeded, user_agent)
    VALUES (p_member_id, matched, agent);

    RETURN matched;
END;
$$;

-- Sets or changes a PIN.
--
-- The first PIN needs no proof, because there is nothing yet to prove against.
-- Every later change must present the current one, which is what stops a
-- browser that is merely sitting on the Settings page from overwriting a PIN
-- and taking the account over.
CREATE OR REPLACE FUNCTION set_member_pin(
    p_member_id   INTEGER,
    p_new_pin     TEXT,
    p_current_pin TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    stored      TEXT;
    member_name TEXT;
BEGIN
    IF p_new_pin IS NULL OR p_new_pin !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'A PIN must be exactly four digits';
    END IF;

    SELECT pin_hash, name INTO stored, member_name
    FROM members
    WHERE id = p_member_id;

    IF member_name IS NULL THEN
        RAISE EXCEPTION 'No such member: %', p_member_id;
    END IF;

    IF stored IS NOT NULL
       AND (p_current_pin IS NULL OR stored <> crypt(p_current_pin, stored)) THEN
        RAISE EXCEPTION 'Current PIN is incorrect';
    END IF;

    UPDATE members
    SET pin_hash   = crypt(p_new_pin, gen_salt('bf', 8)),
        pin_set_at = NOW()
    WHERE id = p_member_id;

    PERFORM add_activity(
        member_name || CASE WHEN stored IS NULL THEN ' set their PIN' ELSE ' changed their PIN' END,
        p_member_id,
        'pin_updated'
    );
END;
$$;


-- ============================================================================
-- 5. VIEWS
--
-- Only the one view the app reads. Earlier revisions also defined
-- v_contribution_status, v_member_totals and v_current_month_status; none of
-- them are queried any more. See the drop list in section 7.
-- ============================================================================

-- Missions with vote tallies and repayment progress folded in, so the
-- Emergency page can render a card from one row. Read by dbService.getMissions.
CREATE OR REPLACE VIEW v_mission_summary AS
SELECT
    m.id,
    m.member_id,
    m.amount,
    m.reason,
    m.status,
    m.created_at,
    mb.name  AS member_name,
    mb.color AS member_color,
    (SELECT COUNT(*) FROM votes v WHERE v.mission_id = m.id AND v.vote = 'approve') AS approval_count,
    (SELECT COUNT(*) FROM votes v WHERE v.mission_id = m.id AND v.vote = 'reject')  AS rejection_count,
    COALESCE((SELECT SUM(r.amount) FROM repayments r WHERE r.mission_id = m.id), 0) AS total_repaid,
    m.amount - COALESCE((SELECT SUM(r.amount) FROM repayments r WHERE r.mission_id = m.id), 0) AS remaining_amount
FROM missions m
JOIN members mb ON mb.id = m.member_id;


-- ============================================================================
-- 6. TRIGGER FUNCTIONS
--
-- One validation trigger and one logging trigger per table. Earlier revisions
-- had overlapping pairs (validate_mission_amount + validate_mission_business_rules,
-- and validate_repayment_authorization + validate_repayment_business_rules)
-- which validated twice and logged mission creation twice.
-- ============================================================================

-- Cap a request at the configured share of the available balance.
--
-- get_available_balance() has already removed the reserve, so this must not
-- subtract it again — that double-count is why an earlier version rejected
-- almost every request. Matches the client-side check in MissionForm.jsx.
CREATE OR REPLACE FUNCTION validate_mission()
RETURNS TRIGGER AS $$
DECLARE
    available_bal  DECIMAL(10,2);
    withdrawal_pct DECIMAL(5,2);
    max_allowed    DECIMAL(10,2);
BEGIN
    available_bal := get_available_balance();

    SELECT value::DECIMAL INTO withdrawal_pct
    FROM vault_settings
    WHERE key = 'withdrawal_percentage';

    withdrawal_pct := COALESCE(withdrawal_pct, 50);
    max_allowed    := available_bal * (withdrawal_pct / 100);

    IF NEW.amount > max_allowed THEN
        RAISE EXCEPTION 'Requested amount (%) exceeds the maximum allowed withdrawal (%)',
            NEW.amount, max_allowed;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_mission_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM add_activity(
        (SELECT name FROM members WHERE id = NEW.member_id) ||
            ' requested ₹' || NEW.amount || ' for: ' || NEW.reason,
        NEW.member_id,
        'mission_created'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Withdrawing a request is only safe while no money has moved, so deletion is
-- limited to 'pending' and 'rejected'.
--
-- An 'approved' or 'repaid' mission is part of get_vault_balance(), and
-- repayments reference it with ON DELETE CASCADE: deleting one would take the
-- repayment history with it and make the balance jump. That is enforced here
-- rather than only in the UI, because every browser shares the same anon key.
-- Withdrawal is also time-limited, on the same window as contributions: a
-- request that has been sitting in front of the council for a day should be
-- decided, not quietly removed.
CREATE OR REPLACE FUNCTION guard_mission_deletion()
RETURNS TRIGGER AS $$
DECLARE
    window_hours INTEGER := edit_window_hours();
BEGIN
    IF OLD.status IN ('approved', 'repaid') THEN
        RAISE EXCEPTION
            'Cannot delete a request that was already %; the money has left the vault',
            OLD.status;
    END IF;

    IF OLD.created_at < NOW() - (window_hours || ' hours')::INTERVAL THEN
        RAISE EXCEPTION
            'This request is older than % hours and can no longer be withdrawn',
            window_hours;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_mission_deletion()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM add_activity(
        (SELECT name FROM members WHERE id = OLD.member_id) ||
            ' withdrew their ₹' || OLD.amount || ' request',
        OLD.member_id,
        'mission_deleted'
    );

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- A ninja cannot vote on their own request.
CREATE OR REPLACE FUNCTION prevent_self_vote()
RETURNS TRIGGER AS $$
DECLARE
    mission_owner INTEGER;
BEGIN
    SELECT member_id INTO mission_owner FROM missions WHERE id = NEW.mission_id;

    IF mission_owner = NEW.member_id THEN
        RAISE EXCEPTION 'Members cannot vote on their own missions';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Promote a mission once the vote threshold is reached.
CREATE OR REPLACE FUNCTION update_mission_status()
RETURNS TRIGGER AS $$
DECLARE
    approvals          INTEGER;
    rejections         INTEGER;
    required_approvals INTEGER;
BEGIN
    SELECT value::INTEGER INTO required_approvals
    FROM vault_settings
    WHERE key = 'required_approvals';

    required_approvals := COALESCE(required_approvals, 3);

    SELECT COUNT(CASE WHEN vote = 'approve' THEN 1 END),
           COUNT(CASE WHEN vote = 'reject'  THEN 1 END)
      INTO approvals, rejections
    FROM votes
    WHERE mission_id = NEW.mission_id;

    IF approvals >= required_approvals THEN
        UPDATE missions
           SET status = 'approved', approved_at = NOW()
         WHERE id = NEW.mission_id AND status = 'pending';

        PERFORM add_activity(
            'Mission #' || NEW.mission_id || ' approved with ' || approvals || ' votes',
            NULL,
            'mission_approved'
        );
    END IF;

    -- With four members and three approvals needed, two rejections make
    -- approval unreachable.
    IF rejections > 1 THEN
        UPDATE missions
           SET status = 'rejected', rejected_at = NOW()
         WHERE id = NEW.mission_id AND status = 'pending';

        PERFORM add_activity(
            'Mission #' || NEW.mission_id || ' rejected with ' || rejections || ' votes',
            NULL,
            'mission_rejected'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_contribution()
RETURNS TRIGGER AS $$
DECLARE
    member_name TEXT;
BEGIN
    SELECT name INTO member_name FROM members WHERE id = NEW.member_id;

    PERFORM add_activity(
        COALESCE(member_name, 'A ninja') || ' contributed ₹' || NEW.amount || ' for ' ||
            to_char(to_date(NEW.year || '-' || NEW.month || '-01', 'YYYY-MM-DD'), 'FMMonth YYYY'),
        NEW.member_id,
        'contribution_added'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Deletions are logged as their own entry rather than removing the original,
-- so the feed stays a full ledger. Without this the feed kept advertising
-- contributions that no longer existed.
CREATE OR REPLACE FUNCTION log_contribution_deletion()
RETURNS TRIGGER AS $$
DECLARE
    member_name TEXT;
BEGIN
    SELECT name INTO member_name FROM members WHERE id = OLD.member_id;

    PERFORM add_activity(
        COALESCE(member_name, 'A ninja') || ' removed a ₹' || OLD.amount || ' contribution for ' ||
            to_char(to_date(OLD.year || '-' || OLD.month || '-01', 'YYYY-MM-DD'), 'FMMonth YYYY'),
        OLD.member_id,
        'contribution_deleted'
    );

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- A ninja may correct their own entry for a while after making it, and then
-- the ledger settles: past the window a contribution is read-only for
-- everyone. Mistakes older than that are fixed with a new entry, not by
-- rewriting history that the others have already seen and reconciled.
--
-- Covers UPDATE and DELETE in one function, so TG_OP decides what to return —
-- returning OLD from a BEFORE UPDATE would write the old values straight back
-- and silently discard the edit.
CREATE OR REPLACE FUNCTION guard_contribution_change()
RETURNS TRIGGER AS $$
DECLARE
    window_hours INTEGER := edit_window_hours();
BEGIN
    IF OLD.created_at < NOW() - (window_hours || ' hours')::INTERVAL THEN
        RAISE EXCEPTION
            'This contribution is older than % hours and can no longer be changed',
            window_hours;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only the borrower may repay, and never more than they still owe.
CREATE OR REPLACE FUNCTION validate_repayment()
RETURNS TRIGGER AS $$
DECLARE
    mission_owner  INTEGER;
    mission_amount DECIMAL(10,2);
    already_repaid DECIMAL(10,2);
    remaining      DECIMAL(10,2);
BEGIN
    SELECT member_id, amount
      INTO mission_owner, mission_amount
    FROM missions
    WHERE id = NEW.mission_id;

    IF mission_owner IS NULL THEN
        RAISE EXCEPTION 'Mission % does not exist', NEW.mission_id;
    END IF;

    IF mission_owner <> NEW.member_id THEN
        RAISE EXCEPTION 'Only the mission creator can make repayments for mission %', NEW.mission_id;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO already_repaid
    FROM repayments
    WHERE mission_id = NEW.mission_id
      AND id IS DISTINCT FROM NEW.id;

    remaining := mission_amount - already_repaid;

    IF NEW.amount > remaining THEN
        RAISE EXCEPTION 'Repayment amount (%) exceeds the remaining balance (%)',
            NEW.amount, remaining;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log the repayment and close the mission out once it is fully settled.
CREATE OR REPLACE FUNCTION process_repayment()
RETURNS TRIGGER AS $$
DECLARE
    mission_amount DECIMAL(10,2);
    member_name    TEXT;
    total_repaid   DECIMAL(10,2);
BEGIN
    SELECT m.amount, mb.name
      INTO mission_amount, member_name
    FROM missions m
    JOIN members mb ON mb.id = m.member_id
    WHERE m.id = NEW.mission_id;

    SELECT COALESCE(SUM(amount), 0) INTO total_repaid
    FROM repayments
    WHERE mission_id = NEW.mission_id;

    PERFORM add_activity(
        member_name || ' repaid ₹' || NEW.amount ||
            ' (total ₹' || total_repaid || ' of ₹' || mission_amount || ')',
        NEW.member_id,
        'repayment_added'
    );

    IF total_repaid >= mission_amount THEN
        UPDATE missions SET status = 'repaid' WHERE id = NEW.mission_id;

        PERFORM add_activity(
            'Mission #' || NEW.mission_id || ' fully repaid by ' || member_name,
            NEW.member_id,
            'mission_repaid'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_validate_mission ON missions;
CREATE TRIGGER trigger_validate_mission
    BEFORE INSERT ON missions
    FOR EACH ROW EXECUTE FUNCTION validate_mission();

DROP TRIGGER IF EXISTS trigger_log_mission_created ON missions;
CREATE TRIGGER trigger_log_mission_created
    AFTER INSERT ON missions
    FOR EACH ROW EXECUTE FUNCTION log_mission_created();

DROP TRIGGER IF EXISTS trigger_guard_mission_deletion ON missions;
CREATE TRIGGER trigger_guard_mission_deletion
    BEFORE DELETE ON missions
    FOR EACH ROW EXECUTE FUNCTION guard_mission_deletion();

DROP TRIGGER IF EXISTS trigger_log_mission_deletion ON missions;
CREATE TRIGGER trigger_log_mission_deletion
    AFTER DELETE ON missions
    FOR EACH ROW EXECUTE FUNCTION log_mission_deletion();

DROP TRIGGER IF EXISTS trigger_prevent_self_vote ON votes;
CREATE TRIGGER trigger_prevent_self_vote
    BEFORE INSERT OR UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION prevent_self_vote();

DROP TRIGGER IF EXISTS trigger_update_mission_status ON votes;
CREATE TRIGGER trigger_update_mission_status
    AFTER INSERT OR UPDATE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_mission_status();

DROP TRIGGER IF EXISTS trigger_log_contribution ON contributions;
CREATE TRIGGER trigger_log_contribution
    AFTER INSERT ON contributions
    FOR EACH ROW EXECUTE FUNCTION log_contribution();

DROP TRIGGER IF EXISTS trigger_log_contribution_deletion ON contributions;
CREATE TRIGGER trigger_log_contribution_deletion
    AFTER DELETE ON contributions
    FOR EACH ROW EXECUTE FUNCTION log_contribution_deletion();

-- BEFORE, so it can refuse the change rather than log one that never happened.
-- db/reset-data.sql disables this to wipe the vault; nothing else should.
DROP TRIGGER IF EXISTS trigger_guard_contribution_change ON contributions;
CREATE TRIGGER trigger_guard_contribution_change
    BEFORE UPDATE OR DELETE ON contributions
    FOR EACH ROW EXECUTE FUNCTION guard_contribution_change();

DROP TRIGGER IF EXISTS trigger_validate_repayment ON repayments;
CREATE TRIGGER trigger_validate_repayment
    BEFORE INSERT ON repayments
    FOR EACH ROW EXECUTE FUNCTION validate_repayment();

DROP TRIGGER IF EXISTS trigger_process_repayment ON repayments;
CREATE TRIGGER trigger_process_repayment
    AFTER INSERT ON repayments
    FOR EACH ROW EXECUTE FUNCTION process_repayment();

-- Superseded trigger names and no-op functions from earlier revisions.
DROP TRIGGER  IF EXISTS trigger_validate_mission_amount    ON missions;
DROP TRIGGER  IF EXISTS validate_mission_business_trigger   ON missions;
DROP TRIGGER  IF EXISTS trigger_log_mission_creation        ON missions;
DROP TRIGGER  IF EXISTS prevent_self_vote_trigger           ON votes;
DROP TRIGGER  IF EXISTS validate_contribution_trigger       ON contributions;
DROP TRIGGER  IF EXISTS log_contribution_trigger            ON contributions;
DROP TRIGGER  IF EXISTS log_contribution_deletion_trigger   ON contributions;
DROP TRIGGER  IF EXISTS validate_repayment_trigger          ON repayments;
DROP TRIGGER  IF EXISTS validate_repayment_business_trigger ON repayments;
DROP FUNCTION IF EXISTS validate_mission_amount();
DROP FUNCTION IF EXISTS validate_mission_business_rules();
DROP FUNCTION IF EXISTS log_mission_creation();
DROP FUNCTION IF EXISTS validate_contribution_amount();
DROP FUNCTION IF EXISTS validate_repayment_authorization();
DROP FUNCTION IF EXISTS validate_repayment_business_rules();

-- Never called by the app (dbService.getDashboardSummary composes the
-- dashboard client-side) and it hardcoded the ₹5,000 target instead of
-- reading vault_settings.
DROP FUNCTION IF EXISTS get_dashboard_summary();

-- Unused views.
--
-- v_contribution_status showed who had paid this month, but the Pay In page
-- computes that from the contributions it already has. It was also wrong once
-- split payments were allowed: it joined contributions without aggregating, so
-- a ninja paying in two instalments appeared as two rows rather than one row
-- with their total. Rather than fix a view nothing reads, it is dropped.
--
-- v_member_totals and v_current_month_status came from an old patch script and
-- were never queried at all.
DROP VIEW IF EXISTS v_contribution_status;
DROP VIEW IF EXISTS v_member_totals;
DROP VIEW IF EXISTS v_current_month_status;


-- ============================================================================
-- 8. ROW LEVEL SECURITY
--
-- IMPORTANT — read before changing:
--
-- The app has no server-side authentication. Every browser talks to Supabase
-- with the same public anon key, and "who am I" is a 4-digit PIN checked by
-- verify_member_pin(). That check is server-side and shared by all devices,
-- but it still produces no database session: Postgres cannot tell one ninja
-- from another on a later request, so RLS has no identity to filter on.
--
-- So these policies are permissive by design: they exist to keep RLS enabled
-- (Supabase warns loudly otherwise) while leaving enforcement to the app and
-- to the validation triggers above. Ownership rules that actually matter —
-- no self-voting, only the borrower may repay, only your own contributions
-- are editable — are enforced by triggers and by the UI, not by RLS.
--
-- A previous secure-rls-policies.sql tried to lock these down by hardcoding
-- member ids. It could not work: it blocked INSERT on `activity`, which the
-- audit-log trigger needs, so every contribution and vote would have failed.
-- It also blocked all writes to vault_settings, breaking the Settings page.
-- Do not reintroduce it. Real per-member rules need real auth first
-- (Supabase Auth with a users table), at which point these policies should be
-- rewritten against auth.uid().
-- ============================================================================

ALTER TABLE members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE keep_alive_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on members" ON members;
CREATE POLICY "Allow all operations on members" ON members
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on contributions" ON contributions;
CREATE POLICY "Allow all operations on contributions" ON contributions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on missions" ON missions;
CREATE POLICY "Allow all operations on missions" ON missions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on votes" ON votes;
CREATE POLICY "Allow all operations on votes" ON votes
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on repayments" ON repayments;
CREATE POLICY "Allow all operations on repayments" ON repayments
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on activity" ON activity;
CREATE POLICY "Allow all operations on activity" ON activity
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on vault_settings" ON vault_settings;
CREATE POLICY "Allow all operations on vault_settings" ON vault_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Read-only from the browser. Rows are written by verify_member_pin(), which
-- runs as the definer and is not subject to this policy, so there is no reason
-- to let a client insert or edit its own sign-in history.
DROP POLICY IF EXISTS "Read sign-in history" ON login_events;
CREATE POLICY "Read sign-in history" ON login_events
    FOR SELECT USING (true);

-- Insert is allowed because api/keep-alive.js writes with the anon key, the
-- same key the browser holds. A forged row is possible and not worth guarding
-- against here; the calendar is a status display, not an audit.
DROP POLICY IF EXISTS "Read keep-alive runs" ON keep_alive_runs;
CREATE POLICY "Read keep-alive runs" ON keep_alive_runs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Record keep-alive runs" ON keep_alive_runs;
CREATE POLICY "Record keep-alive runs" ON keep_alive_runs
    FOR INSERT WITH CHECK (true);


-- ============================================================================
-- 9. GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

GRANT SELECT ON v_mission_summary TO anon;

GRANT EXECUTE ON FUNCTION get_vault_balance()                        TO anon;
GRANT EXECUTE ON FUNCTION get_available_balance()                    TO anon;
GRANT EXECUTE ON FUNCTION edit_window_hours()                        TO anon;
GRANT EXECUTE ON FUNCTION add_activity(TEXT, INTEGER, VARCHAR)       TO anon;

GRANT EXECUTE ON FUNCTION member_pin_status()                        TO anon;
GRANT EXECUTE ON FUNCTION verify_member_pin(INTEGER, TEXT)           TO anon;
GRANT EXECUTE ON FUNCTION set_member_pin(INTEGER, TEXT, TEXT)        TO anon;

-- members.pin_hash must stay unreadable from the browser, and the blanket
-- table grant above would hand it over. RLS cannot help here: policies filter
-- rows, not columns. Column-level grants are the mechanism, so the grant on
-- `members` is narrowed to the columns the app actually displays.
--
-- Two consequences worth knowing before editing:
--   * dbService.getMembers() must name its columns. `select('*')` expands to
--     include pin_hash and Postgres refuses the whole query.
--   * Nothing may write to `members` directly any more. set_member_pin() does
--     it as SECURITY DEFINER, which is the point.
--
-- Applied to `authenticated` as well, since Supabase grants that role the same
-- defaults and it would otherwise be a way around this.
DO $$
DECLARE
    target TEXT;
BEGIN
    FOREACH target IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target) THEN
            EXECUTE format('REVOKE ALL ON members FROM %I', target);
            EXECUTE format(
                'GRANT SELECT (id, name, color, created_at) ON members TO %I', target
            );

            -- Sign-in history is read-only to clients. The rows come from
            -- verify_member_pin(), which runs as the definer and is not bound
            -- by this grant, so nothing needs to insert here directly.
            EXECUTE format('REVOKE ALL ON login_events FROM %I', target);
            EXECUTE format('GRANT SELECT ON login_events TO %I', target);

            -- Insert stays open for api/keep-alive.js, which writes with the
            -- anon key. Nothing should ever edit or remove a past run.
            EXECUTE format('REVOKE ALL ON keep_alive_runs FROM %I', target);
            EXECUTE format('GRANT SELECT, INSERT ON keep_alive_runs TO %I', target);
        END IF;
    END LOOP;
END $$;


-- ============================================================================
-- 10. VERIFY
-- ============================================================================

SELECT 'Schema applied.'                        AS status,
       (SELECT COUNT(*) FROM members)           AS members,
       (SELECT COUNT(*) FROM members
         WHERE pin_hash IS NOT NULL)            AS pins_set,
       (SELECT COUNT(*) FROM vault_settings)    AS settings,
       get_vault_balance()                      AS vault_balance,
       get_available_balance()                  AS available_balance;
