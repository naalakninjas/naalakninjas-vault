# 🥷 Naalak Ninjas Vault - QA Test Suite Master Document

## Test Suite Overview
- **Total Test Cases**: 200
- **Test Execution Environment**: React (Vite) + Supabase
- **Test Data**: 4 Ninjas (Shilpha, Suhas, Sudeep, Aneesh)
- **Browser Support**: Chrome, Firefox, Safari, Edge
- **Device Support**: Mobile (iOS/Android), Tablet, Desktop

## Test Categories
1. **Authentication & Authorization** (25 test cases)
2. **Ninja Selection & PIN Management** (20 test cases) 
3. **Dashboard & Analytics** (25 test cases)
4. **Contributions Management** (30 test cases)
5. **Mission Management** (35 test cases)
6. **Voting System** (20 test cases)
7. **Repayments Management** (25 test cases)
8. **Activity Timeline** (15 test cases)
9. **Settings & Configuration** (15 test cases)
10. **UI/UX & Responsive Design** (30 test cases)

## Test Environment Setup
- **Frontend**: http://localhost:5173
- **Backend**: Supabase Project `qgsblkftgykqqlmwvvlh`
- **Database**: PostgreSQL with test data
- **Test Users**: 4 Ninja accounts with known PINs

## Test Data Requirements
```sql
-- Test Members Data
INSERT INTO members (id, name, color) VALUES 
(1, 'Shilpha', 'ninja-emerald'),
(2, 'Suhas', 'ninja-crimson'),
(3, 'Sudeep', 'ninja-azure'),
(4, 'Aneesh', 'ninja-gold');

```

> **PINs**: there are no default PINs any more. A ninja with no PIN is prompted
> to choose one, so tests should set a PIN as their first step rather than
> expecting a known value. PINs are bcrypt hashes in `members.pin_hash`, so
> they survive clearing `localStorage` and apply on every device. Use
> `UPDATE members SET pin_hash = NULL;` to return the squad to first-run setup.

## Test Execution Guidelines
1. **Reset database** before each test run
2. **Clear local storage** between test sessions
3. **Use fresh browser session** for each major test category
4. **Document screenshots** for UI validation
5. **Verify API responses** using browser dev tools
6. **Check database state** after each transaction

## Defect Tracking
- **Critical**: App crashes, data loss, security issues
- **Major**: Feature not working, incorrect calculations
- **Minor**: UI inconsistencies, minor visual bugs
- **Enhancement**: Improvement suggestions

---

## Test Case Template
```
Test ID: TC_XXX_001
Module: [Module Name]
Test Scenario: [Brief description]
Priority: [Critical/High/Medium/Low]
Preconditions: [Setup requirements]
Test Steps: 
1. Step one
2. Step two
3. Step three
Expected UI: [Visual behavior]
Expected API: [API response structure]
Expected DB: [Database changes]
Pass/Fail: [Result]
Actual Result: [What happened]
Screenshots: [Evidence files]
Defect ID: [If applicable]
```

This master document references individual test suite modules that follow.