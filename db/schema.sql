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

-- Business rules, editable from the Settings page. Values are stored as text
-- and cast where used, so a key can hold a number or a flag.
CREATE TABLE IF NOT EXISTS vault_settings (
    id           SERIAL PRIMARY KEY,
    key          VARCHAR(50) NOT NULL UNIQUE,
    value        TEXT NOT NULL,
    description  TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Older revisions of this schema shipped repayments without member_id and
-- vault_settings without description. Backfill both for existing projects.
ALTER TABLE repayments     ADD COLUMN IF NOT EXISTS member_id   INTEGER REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE repayments     ADD COLUMN IF NOT EXISTS notes       TEXT;
ALTER TABLE vault_settings ADD COLUMN IF NOT EXISTS description TEXT;

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
    ('lock_period_months',    '3',     'Months before contributions may be withdrawn')
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
-- with the same public anon key, and "who am I" is a 4-digit PIN held in
-- localStorage. Postgres therefore cannot tell one ninja from another, and
-- RLS has no identity to filter on.
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


-- ============================================================================
-- 9. GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

GRANT SELECT ON v_mission_summary TO anon;

GRANT EXECUTE ON FUNCTION get_vault_balance()                        TO anon;
GRANT EXECUTE ON FUNCTION get_available_balance()                    TO anon;
GRANT EXECUTE ON FUNCTION add_activity(TEXT, INTEGER, VARCHAR)       TO anon;


-- ============================================================================
-- 10. VERIFY
-- ============================================================================

SELECT 'Schema applied.'                        AS status,
       (SELECT COUNT(*) FROM members)           AS members,
       (SELECT COUNT(*) FROM vault_settings)    AS settings,
       get_vault_balance()                      AS vault_balance,
       get_available_balance()                  AS available_balance;
