-- ============================================================================
-- Naalak Ninjas Vault — clear all transactional data
--
-- Use this to get an empty vault for an end-to-end test run.
--
-- DELETES: contributions, missions, votes, repayments, activity
-- KEEPS:   members (the four ninjas) and vault_settings (your business rules)
--
-- This is destructive and cannot be undone. Run it in the Supabase SQL editor.
-- If you want to keep a copy first, export the tables from the Table Editor
-- (or run the SELECTs in section 1 and save the output) before continuing.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. What is about to be deleted
--
-- Run this section on its own first if you want to see the damage before
-- doing it. Everything below section 2 is what actually deletes.
-- ----------------------------------------------------------------------------

SELECT 'contributions' AS table_name, COUNT(*) AS rows, COALESCE(SUM(amount), 0) AS total_amount FROM contributions
UNION ALL
SELECT 'missions',      COUNT(*), COALESCE(SUM(amount), 0) FROM missions
UNION ALL
SELECT 'repayments',    COUNT(*), COALESCE(SUM(amount), 0) FROM repayments
UNION ALL
SELECT 'votes',         COUNT(*), NULL FROM votes
UNION ALL
SELECT 'activity',      COUNT(*), NULL FROM activity;


-- ----------------------------------------------------------------------------
-- 2. Delete
--
-- Order matters only for clarity: votes and repayments would cascade from
-- missions anyway, but deleting them explicitly keeps the intent obvious.
--
-- Contributions are deleted with the deletion-logging trigger disabled.
-- Otherwise every removed row would append a "removed a ₹X contribution"
-- entry to `activity` — which we are also clearing, but the trigger would
-- refill it as we go.
--
-- The edit-window guards are disabled for the same span. They exist to stop a
-- ninja rewriting week-old history from the app, and a deliberate full reset
-- is exactly the case they would otherwise block: any row older than
-- `edit_window_hours` would refuse to budge.
-- ----------------------------------------------------------------------------

ALTER TABLE contributions DISABLE TRIGGER trigger_log_contribution_deletion;
ALTER TABLE contributions DISABLE TRIGGER trigger_guard_contribution_change;
ALTER TABLE repayments    DISABLE TRIGGER trigger_log_repayment_deletion;
ALTER TABLE repayments    DISABLE TRIGGER trigger_guard_repayment_change;
ALTER TABLE missions      DISABLE TRIGGER trigger_guard_mission_deletion;

DELETE FROM votes;
DELETE FROM repayments;
DELETE FROM missions;
DELETE FROM contributions;
DELETE FROM activity;

ALTER TABLE contributions ENABLE TRIGGER trigger_log_contribution_deletion;
ALTER TABLE contributions ENABLE TRIGGER trigger_guard_contribution_change;
ALTER TABLE repayments    ENABLE TRIGGER trigger_log_repayment_deletion;
ALTER TABLE repayments    ENABLE TRIGGER trigger_guard_repayment_change;
ALTER TABLE missions      ENABLE TRIGGER trigger_guard_mission_deletion;


-- ----------------------------------------------------------------------------
-- 3. Restart id sequences
--
-- Not required, but it means your first test contribution is id 1 again,
-- which makes the activity feed and any manual SQL much easier to follow.
-- ----------------------------------------------------------------------------

ALTER SEQUENCE contributions_id_seq RESTART WITH 1;
ALTER SEQUENCE missions_id_seq      RESTART WITH 1;
ALTER SEQUENCE votes_id_seq         RESTART WITH 1;
ALTER SEQUENCE repayments_id_seq    RESTART WITH 1;
ALTER SEQUENCE activity_id_seq      RESTART WITH 1;


-- ----------------------------------------------------------------------------
-- 4. Confirm the vault is empty and reference data survived
-- ----------------------------------------------------------------------------

SELECT 'Reset complete.'                     AS status,
       (SELECT COUNT(*) FROM contributions)  AS contributions,
       (SELECT COUNT(*) FROM missions)       AS missions,
       (SELECT COUNT(*) FROM votes)          AS votes,
       (SELECT COUNT(*) FROM repayments)     AS repayments,
       (SELECT COUNT(*) FROM activity)       AS activity,
       (SELECT COUNT(*) FROM members)        AS members_kept,
       (SELECT COUNT(*) FROM vault_settings) AS settings_kept,
       get_vault_balance()                   AS vault_balance;
