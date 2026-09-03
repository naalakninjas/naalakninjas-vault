# 🎯 QA Execution Framework & Test Runner

## Test Execution Overview
This framework provides a systematic approach to executing the complete test suite with proper documentation, evidence collection, and defect tracking.

## Pre-Execution Setup

### 1. Environment Preparation
```bash
# 1. Start fresh development environment
npm run dev

# 2. Reset database to clean state
# Run in Supabase SQL Editor:
DELETE FROM repayments;
DELETE FROM votes;
DELETE FROM missions;
DELETE FROM contributions;
DELETE FROM activity;

# 3. Restore base test data
INSERT INTO members (id, name, color) VALUES 
(1, 'Shilpha', 'ninja-emerald'),
(2, 'Suhas', 'ninja-crimson'),
(3, 'Sudeep', 'ninja-azure'),
(4, 'Aneesh', 'ninja-gold');

# 4. Clear browser data
# - Clear localStorage
# - Clear session storage
# - Start fresh browser session
```

### 2. Test Data Configuration
```javascript
// PINs are chosen at first sign-in, not shipped as defaults. Pick any four
// digits per ninja at the start of a run and reuse them for that run. They are
// stored (hashed) in the database, so clearing localStorage does not reset
// them — run `UPDATE members SET pin_hash = NULL;` for that.
const TEST_PINS = {
  'Shilpha': '<choose at setup>',
  'Suhas': '<choose at setup>',
  'Sudeep': '<choose at setup>',
  'Aneesh': '<choose at setup>'
};

// Standard test amounts
const TEST_AMOUNTS = {
  'standardContribution': 5000,
  'largeContribution': 15000,
  'missionRequest': 25000,
  'repayment': 10000
};
```

## Test Execution Process

### Phase 1: Authentication & Core Setup (25 tests)
**Execution Time**: ~45 minutes  
**Files**: `01_AUTHENTICATION_TESTS.md`, `02_PIN_MANAGEMENT_TESTS.md`

```bash
# Test Sequence:
1. TC_AUTH_001 → TC_AUTH_025
2. TC_PIN_001 → TC_PIN_020
3. Document all authentication flows
4. Verify session management
5. Test PIN security features
```

### Phase 2: Dashboard & Data Display (25 tests)  
**Execution Time**: ~30 minutes  
**Files**: `03_DASHBOARD_TESTS.md`

```bash
# Test Sequence:
1. TC_DASH_001 → TC_DASH_025
2. Verify all dashboard calculations
3. Test responsive layouts
4. Validate ninja-specific theming
```

### Phase 3: Core Financial Operations (85 tests)
**Execution Time**: ~2 hours  
**Files**: `04_CONTRIBUTIONS_TESTS.md`, `05_MISSIONS_TESTS.md`, `06_VOTING_TESTS.md`, `07_REPAYMENTS_TESTS.md`

```bash
# Test Sequence:
1. TC_CONT_001 → TC_CONT_030 (30 tests)
2. TC_MISS_001 → TC_MISS_035 (35 tests) 
3. TC_VOTE_001 → TC_VOTE_020 (20 tests)
4. TC_REPAY_001 → TC_REPAY_025 (25 tests)
```

### Phase 4: Activity & Settings (30 tests)
**Execution Time**: ~45 minutes  
**Files**: `08_ACTIVITY_TESTS.md`, `09_SETTINGS_TESTS.md`

### Phase 5: UI/UX & Integration (35 tests)
**Execution Time**: ~1 hour  
**Files**: `10_RESPONSIVE_TESTS.md`, `11_INTEGRATION_TESTS.md`

## Evidence Collection Standards

### Screenshot Requirements
```bash
# Naming Convention: TC_[MODULE]_[NUMBER]_[STATE].png
# Examples:
TC_AUTH_001_ninja_selection.png
TC_AUTH_002_pin_entry_success.png
TC_CONT_003_validation_error.png
TC_DASH_005_ninja_stats_updated.png
```

### Test Data Documentation
```json
{
  "testId": "TC_CONT_002",
  "executionTime": "2026-07-15T12:30:00Z",
  "testData": {
    "ninja": "Shilpha",
    "amount": 5000,
    "month": 7,
    "year": 2026,
    "paymentDate": "2026-07-15"
  },
  "apiResponse": {
    "status": 201,
    "responseTime": "145ms",
    "payload": "{ id: 123, member_id: 1, amount: 5000 }"
  },
  "databaseState": {
    "before": "0 contributions for Shilpha",
    "after": "1 contribution, amount=5000"
  }
}
```

### Database Verification Queries
```sql
-- Standard verification queries for each test module

-- Contributions Tests
SELECT COUNT(*) as contribution_count, 
       SUM(amount) as total_amount 
FROM contributions 
WHERE member_id = ? AND month = ? AND year = ?;

-- Missions Tests  
SELECT id, status, amount, 
       (SELECT COUNT(*) FROM votes WHERE mission_id = missions.id) as vote_count
FROM missions 
WHERE id = ?;

-- Activity Tests
SELECT COUNT(*) as activity_count 
FROM activity 
WHERE action_type = ? AND created_at > ?;

-- Dashboard Tests
SELECT get_vault_balance() as vault_balance,
       get_available_balance() as available_balance;
```

## Defect Tracking Template

### Defect Report Format
```markdown
# Defect ID: DEF_001
**Severity**: Critical/Major/Minor/Enhancement
**Module**: [Authentication/Dashboard/Contributions/etc]
**Test Case**: TC_XXX_001
**Summary**: Brief description of the defect

## Steps to Reproduce:
1. Step one
2. Step two  
3. Step three

## Expected Result:
What should happen

## Actual Result:
What actually happened

## Environment:
- Browser: Chrome 91.0
- OS: Windows 10
- Screen Resolution: 1920x1080
- Network: Fast 3G

## Evidence:
- Screenshot: DEF_001_screenshot.png
- Console Log: DEF_001_console.txt
- Network Log: DEF_001_network.har

## Database State:
```sql
-- Relevant database queries showing the issue
SELECT * FROM contributions WHERE id = 123;
```

## Workaround:
Temporary solution if available

## Fix Verification:
How to verify the fix works correctly
```

## Test Execution Dashboard

### Daily Test Summary Template
```markdown
# Test Execution Summary - [Date]

## Overview
- **Total Tests Executed**: X/200
- **Passed**: X
- **Failed**: X  
- **Blocked**: X
- **Execution Time**: X hours

## Test Coverage
| Module | Tests | Passed | Failed | Coverage |
|--------|-------|--------|--------|----------|
| Authentication | 25 | 23 | 2 | 92% |
| Dashboard | 25 | 25 | 0 | 100% |
| Contributions | 30 | 28 | 2 | 93% |
| Missions | 35 | 30 | 5 | 86% |
| Voting | 20 | 19 | 1 | 95% |
| Repayments | 25 | 25 | 0 | 100% |
| Activity | 15 | 15 | 0 | 100% |
| Settings | 15 | 14 | 1 | 93% |
| UI/UX | 30 | 28 | 2 | 93% |

## Critical Issues Found
1. DEF_001: Login fails with custom PIN
2. DEF_005: Vault balance calculation incorrect

## Blockers
- Supabase connection issues during TC_CONT_015-020

## Next Steps
1. Fix critical defects
2. Re-run failed test cases
3. Complete blocked test execution
```

## Automation Recommendations

### High-Priority Automation Candidates
```javascript
// Tests suitable for automation:
const AUTOMATION_PRIORITIES = {
  'High': [
    'TC_AUTH_002', // Valid PIN entry
    'TC_CONT_002', // Add contribution
    'TC_DASH_002', // Vault balance display
    'TC_MISS_003', // Create mission
    'TC_VOTE_002'  // Submit vote
  ],
  'Medium': [
    'TC_AUTH_003', // Invalid PIN
    'TC_CONT_003', // Amount validation  
    'TC_DASH_005', // Ninja stats
    'TC_MISS_008'  // Mission validation
  ],
  'Low': [
    'TC_AUTH_020', // Hover effects
    'TC_DASH_019', // Loading states
    'TC_CONT_021'  // Export functionality
  ]
};
```

### API Test Automation
```javascript
// Example automated API tests
describe('Contributions API Tests', () => {
  test('TC_CONT_002_API: Add valid contribution', async () => {
    const response = await api.post('/contributions', {
      member_id: 1,
      amount: 5000,
      month: 7,
      year: 2026,
      payment_date: '2026-07-15'
    });
    
    expect(response.status).toBe(201);
    expect(response.data.amount).toBe(5000);
    expect(response.data.member_id).toBe(1);
  });
  
  test('TC_CONT_003_API: Reject invalid amount', async () => {
    const response = await api.post('/contributions', {
      member_id: 1,
      amount: -1000,
      month: 7,
      year: 2026
    });
    
    expect(response.status).toBe(400);
    expect(response.data.error).toContain('amount');
  });
});
```

## Performance Benchmarks

### Response Time Targets
```javascript
const PERFORMANCE_TARGETS = {
  'Page Load': {
    'Dashboard': '< 2 seconds',
    'Contributions': '< 1.5 seconds', 
    'Missions': '< 2 seconds'
  },
  'API Responses': {
    'GET /contributions': '< 300ms',
    'POST /contributions': '< 500ms',
    'GET /missions': '< 400ms'
  },
  'Database Queries': {
    'get_vault_balance()': '< 100ms',
    'contribution totals': '< 150ms'
  }
};
```

## Regression Testing Schedule

### Weekly Regression
- Execute full authentication suite (25 tests)
- Execute core financial operations (85 tests)
- Execute critical path tests (30 tests)
- **Total Time**: ~2.5 hours

### Monthly Regression  
- Execute complete test suite (200 tests)
- Update test data and scenarios
- Review and update test cases
- **Total Time**: ~4 hours

### Release Regression
- Execute complete suite twice
- Cross-browser testing
- Performance validation
- Security testing
- **Total Time**: ~8 hours

This framework ensures comprehensive, repeatable, and well-documented testing of the entire Naalak Ninjas Vault application.