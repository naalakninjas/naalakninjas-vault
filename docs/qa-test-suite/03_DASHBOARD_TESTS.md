# 📊 Dashboard & Analytics Test Suite

## TC_DASH_001 - Dashboard Load and Layout
**Module**: Dashboard  
**Test Scenario**: Verify dashboard loads correctly after login  
**Priority**: Critical  
**Preconditions**: Successful ninja login (any ninja)  
**Test Steps**:
1. Complete login process
2. Verify automatic redirect to dashboard
3. Check all dashboard sections load

**Expected UI**:
- Dashboard displays within 3 seconds
- All sections visible: Vault Treasury, Quick Actions, Vault Overview, Ninja Scroll, Pending Actions, Ninja Squad
- No loading errors or broken layouts
- Proper ninja-specific theming applied

**Expected API**: 
- GET /rest/v1/contributions
- GET /rest/v1/missions  
- GET /rest/v1/activity
- All return 200 status

**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_002 - Vault Balance Display
**Module**: Dashboard  
**Test Scenario**: Verify vault balance shows correct calculated amount  
**Priority**: Critical  
**Preconditions**: Database has known contribution data  
**Test Steps**:
1. Navigate to dashboard
2. Check "Vault Balance" in Treasury section
3. Verify amount matches expected calculation

**Expected UI**:
- Vault balance shows as ₹X,XXX format
- Amount updates dynamically
- Proper currency formatting
- Green/positive styling for balance

**Expected API**: 
- Supabase function: get_vault_balance()
- Returns calculated balance based on contributions - loans + repayments

**Expected DB**: 
- Query: `SELECT get_vault_balance()`
- Should match UI display

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_003 - Available Balance Calculation
**Module**: Dashboard  
**Test Scenario**: Available balance shows vault minus minimum reserve  
**Priority**: High  
**Preconditions**: Vault has funds, minimum balance setting configured  
**Test Steps**:
1. Check "Available" amount in Treasury
2. Verify calculation: Available = Vault Balance - Minimum Reserve
3. Compare with database function result

**Expected UI**:
- Available balance = Vault Balance - ₹50,000 (default minimum)
- Shows ₹0 if vault balance < minimum reserve
- Blue styling for available amount

**Expected API**: 
- Supabase function: get_available_balance()
- Returns vault balance minus minimum reserve

**Expected DB**: 
- Query: `SELECT get_available_balance()`
- Should equal vault balance - minimum setting

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_004 - Outstanding Amount Display
**Module**: Dashboard  
**Test Scenario**: Outstanding shows approved missions minus repayments  
**Priority**: High  
**Preconditions**: Database has missions and repayments data  
**Test Steps**:
1. Check "Outstanding" amount in Treasury
2. Verify calculation matches approved missions - repayments
3. Compare with manual calculation

**Expected UI**:
- Outstanding = Sum of approved missions - Sum of repayments
- Red/orange styling for outstanding debt
- Shows ₹0 if no outstanding loans

**Expected API**: 
- Data from missions and repayments tables
- Status filtering for approved missions

**Expected DB**: 
```sql
SELECT 
  COALESCE(SUM(amount), 0) as outstanding
FROM missions 
WHERE status = 'approved'
MINUS total repayments
```

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_005 - Ninja Squad Individual Stats
**Module**: Dashboard  
**Test Scenario**: Each ninja shows correct contribution amounts  
**Priority**: High  
**Preconditions**: Contribution data exists for multiple ninjas  
**Test Steps**:
1. Scroll to "Ninja Squad" section
2. Verify each ninja shows their total contributions
3. Check contribution amounts match database

**Expected UI**:
- Each ninja card shows total contributed amount
- Ninja-specific color theming (borders, text)
- "Active" status for contributing ninjas
- "Pending" status for non-contributing ninjas

**Expected API**: 
- Contribution totals calculated per member
- Member data with names and colors

**Expected DB**: 
```sql
SELECT member_id, SUM(amount) as total
FROM contributions 
GROUP BY member_id
```

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_006 - Quick Actions Navigation
**Module**: Dashboard  
**Test Scenario**: Quick action buttons navigate to correct pages  
**Priority**: Medium  
**Preconditions**: Dashboard loaded  
**Test Steps**:
1. Click "Deposit" button
2. Click "Launch Mission" button  
3. Click "Return Funds" button
4. Click "Activity" button
5. Verify each navigates correctly

**Expected UI**:
- Deposit → Contributions page
- Launch Mission → Missions page with add form
- Return Funds → Repayments page
- Activity → Activity page
- Proper routing and page loads

**Expected API**: Page-specific data loading for target pages  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_007 - Vault Overview Statistics
**Module**: Dashboard  
**Test Scenario**: Vault overview section shows accurate metrics  
**Priority**: High  
**Preconditions**: Mixed data (contributions, missions, activity)  
**Test Steps**:
1. Check "Available Funds" amount
2. Check "Total Contributions" sum
3. Check "Active Missions" count
4. Check "Pending Votes" count
5. Verify all match database

**Expected UI**:
- Available Funds = get_available_balance()
- Total Contributions = sum of all contributions
- Active Missions = count of approved missions
- Pending Votes = count of pending missions

**Expected API**: 
- Dashboard summary endpoint
- Aggregated statistics

**Expected DB**: 
```sql
SELECT 
  COUNT(*) as active_missions
FROM missions 
WHERE status = 'approved'
```

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_008 - Ninja Scroll Activity Feed
**Module**: Dashboard  
**Test Scenario**: Recent activity displays in chronological order  
**Priority**: Medium  
**Preconditions**: Activity data exists in database  
**Test Steps**:
1. Check "Ninja Scroll" section
2. Verify activities show in reverse chronological order
3. Check activity formatting and icons

**Expected UI**:
- Most recent activities at top
- Proper ninja avatars and names
- Activity type icons (money, mission, etc.)
- Relative timestamps ("5m ago", "2h ago")

**Expected API**: 
- GET /rest/v1/activity with limit and order
- Most recent activities first

**Expected DB**: 
```sql
SELECT * FROM activity 
ORDER BY created_at DESC 
LIMIT 5
```

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_009 - Pending Actions Section
**Module**: Dashboard  
**Test Scenario**: Pending actions show items requiring attention  
**Priority**: High  
**Preconditions**: Pending missions and due items exist  
**Test Steps**:
1. Check "Pending Actions" section
2. Verify shows missions awaiting votes
3. Check shows due repayments
4. Check shows monthly deposits due

**Expected UI**:
- "2 missions awaiting votes" (if applicable)
- "1 repayment due" (if applicable)
- "Monthly deposits due" (if applicable)
- Action items are clickable and navigate appropriately

**Expected API**: 
- Missions with status = 'pending'
- Repayments past due date
- Monthly contribution status

**Expected DB**: 
```sql
SELECT COUNT(*) FROM missions WHERE status = 'pending'
```

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_010 - Live Status Indicator
**Module**: Dashboard  
**Test Scenario**: Live status shows real-time vault health  
**Priority**: Medium  
**Preconditions**: Dashboard loaded  
**Test Steps**:
1. Check "Live Status" indicator in header
2. Verify shows current vault operational status
3. Check color coding and messaging

**Expected UI**:
- Green dot + "Live Status" for healthy vault
- Appropriate color coding for different states
- Clear status messaging

**Expected API**: No specific API for status  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_011 - Mobile Dashboard Layout
**Module**: Dashboard  
**Test Scenario**: Dashboard displays correctly on mobile devices  
**Priority**: High  
**Preconditions**: Mobile device or mobile browser emulation  
**Test Steps**:
1. Load dashboard on mobile viewport
2. Verify responsive layout adaptation
3. Check all sections remain accessible
4. Verify mobile navigation works

**Expected UI**:
- Mobile-first responsive design
- All sections stack vertically appropriately
- Touch-friendly interface elements
- Mobile navigation header visible
- No horizontal scrolling required

**Expected API**: Same API calls as desktop  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_012 - Dashboard Auto-Refresh
**Module**: Dashboard  
**Test Scenario**: Dashboard updates when data changes in other sessions  
**Priority**: Medium  
**Preconditions**: Multiple browser sessions or tabs open  
**Test Steps**:
1. Open dashboard in Tab 1
2. Make contribution in Tab 2
3. Return to Tab 1 and verify auto-update or manual refresh

**Expected UI**:
- Data updates reflect across sessions
- No stale data displayed
- Proper refresh mechanisms in place

**Expected API**: 
- Fresh data fetching on focus/visibility change
- Real-time updates (if implemented)

**Expected DB**: Consistent data across sessions  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_013 - Empty State Handling
**Module**: Dashboard  
**Test Scenario**: Dashboard displays appropriately with no data  
**Priority**: Medium  
**Preconditions**: Fresh database with no contributions/missions  
**Test Steps**:
1. Clear all test data from database
2. Load dashboard
3. Verify empty state messaging and layout

**Expected UI**:
- Vault Balance: ₹0
- All ninja contributions: ₹0
- Empty state messages for sections with no data
- Encouraging call-to-action messages
- No broken layouts or errors

**Expected API**: 
- API calls return empty arrays/zero values
- No 404 or error responses

**Expected DB**: Empty tables return appropriate defaults  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_014 - Dashboard Performance
**Module**: Dashboard  
**Test Scenario**: Dashboard loads within performance benchmarks  
**Priority**: Medium  
**Preconditions**: Standard test data set loaded  
**Test Steps**:
1. Measure dashboard initial load time
2. Measure time to interactive
3. Verify no performance bottlenecks

**Expected UI**:
- Initial load < 2 seconds
- Time to interactive < 3 seconds
- Smooth animations and interactions
- No visible lag or delays

**Expected API**: 
- API response times < 500ms each
- Parallel data loading where possible

**Expected DB**: 
- Database queries execute < 100ms
- Proper indexing for performance

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_015 - Error State Handling
**Module**: Dashboard  
**Test Scenario**: Dashboard handles API errors gracefully  
**Priority**: High  
**Preconditions**: Simulated API failures  
**Test Steps**:
1. Simulate network failure during dashboard load
2. Simulate Supabase service unavailable
3. Verify error handling and user messaging

**Expected UI**:
- Graceful error messages
- Fallback UI content where possible
- Retry mechanisms available
- No white screen of death or crashes

**Expected API**: 
- Proper error response handling
- Fallback data mechanisms

**Expected DB**: No corruption from failed operations  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_016 - Currency Formatting Consistency
**Module**: Dashboard  
**Test Scenario**: All monetary values formatted consistently  
**Priority**: Medium  
**Preconditions**: Dashboard with various amounts displayed  
**Test Steps**:
1. Check all currency displays on dashboard
2. Verify consistent formatting (₹ symbol, commas, decimals)
3. Check negative number handling

**Expected UI**:
- Consistent ₹ symbol placement
- Proper comma separation for thousands
- Appropriate decimal handling
- Negative numbers styled appropriately (red, parentheses)

**Expected API**: Raw numbers from API  
**Expected DB**: Decimal amounts stored correctly  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_017 - Ninja Avatar and Theming
**Module**: Dashboard  
**Test Scenario**: Ninja-specific theming applied correctly throughout  
**Priority**: High  
**Preconditions**: Logged in as specific ninja (e.g., Shilpha)  
**Test Steps**:
1. Verify ninja-specific colors in card borders
2. Check profile avatar displays correctly
3. Verify theming consistency across all sections

**Expected UI**:
- Cards show ninja-specific border colors
- Profile avatar matches ninja identity
- Consistent color scheme throughout dashboard
- Proper ninja branding elements

**Expected API**: Ninja profile data correctly loaded  
**Expected DB**: Ninja data matches UI display  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_018 - Dashboard Navigation Integration
**Module**: Dashboard  
**Test Scenario**: Dashboard integrates properly with app navigation  
**Priority**: Medium  
**Preconditions**: Dashboard loaded  
**Test Steps**:
1. Use sidebar navigation to leave dashboard
2. Return to dashboard via navigation
3. Use browser back/forward buttons
4. Verify proper routing behavior

**Expected UI**:
- Smooth navigation transitions
- Dashboard state preserved appropriately
- Proper URL routing
- Navigation highlights current page

**Expected API**: Appropriate data loading for navigation  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_019 - Loading States and Skeletons
**Module**: Dashboard  
**Test Scenario**: Loading states provide good user experience  
**Priority**: Low  
**Preconditions**: Slow network or large dataset  
**Test Steps**:
1. Load dashboard with network throttling
2. Verify loading states and skeleton screens
3. Check loading animations and indicators

**Expected UI**:
- Skeleton screens for major sections
- Loading spinners for data-heavy areas
- Progressive loading of dashboard sections
- No jarring content shifts during load

**Expected API**: Progressive data loading  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_020 - Dashboard Security Context
**Module**: Dashboard  
**Test Scenario**: Dashboard respects user permissions and data access  
**Priority**: Critical  
**Preconditions**: Logged in as specific ninja  
**Test Steps**:
1. Verify only appropriate data is displayed
2. Check no access to other ninjas' private data
3. Verify data filtering by current user context

**Expected UI**:
- Only authorized data displayed
- User-appropriate actions available
- No data leakage between ninja accounts

**Expected API**: 
- Proper authentication headers
- Data filtered by user context

**Expected DB**: 
- Row-level security enforced
- User-specific data access only

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_021 - Responsive Breakpoints
**Module**: Dashboard  
**Test Scenario**: Dashboard adapts properly at all screen sizes  
**Priority**: Medium  
**Preconditions**: Dashboard loaded on various screen sizes  
**Test Steps**:
1. Test at mobile breakpoint (< 768px)
2. Test at tablet breakpoint (768px - 1024px)
3. Test at desktop breakpoint (> 1024px)
4. Verify layouts at each breakpoint

**Expected UI**:
- Mobile: Single column, stacked layout
- Tablet: Optimized 2-column layout
- Desktop: Full multi-column layout
- No broken layouts at any size
- Touch-friendly on mobile/tablet

**Expected API**: Same API regardless of screen size  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_022 - Data Refresh Mechanisms
**Module**: Dashboard  
**Test Scenario**: Dashboard data can be manually refreshed  
**Priority**: Low  
**Preconditions**: Dashboard with existing data  
**Test Steps**:
1. Look for refresh button or mechanism
2. Trigger manual refresh
3. Verify data reloads from server

**Expected UI**:
- Refresh button or pull-to-refresh (mobile)
- Loading indicator during refresh
- Updated data displayed after refresh
- No data loss during refresh

**Expected API**: Fresh data fetched from server  
**Expected DB**: Current data returned  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_023 - Browser Compatibility
**Module**: Dashboard  
**Test Scenario**: Dashboard works across different browsers  
**Priority**: Medium  
**Preconditions**: Access to multiple browsers  
**Test Steps**:
1. Test dashboard in Chrome
2. Test dashboard in Firefox
3. Test dashboard in Safari (if available)
4. Test dashboard in Edge
5. Verify consistent behavior

**Expected UI**:
- Consistent layout and styling across browsers
- All functionality works properly
- No browser-specific bugs
- Proper CSS compatibility

**Expected API**: Consistent API behavior across browsers  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_024 - Accessibility Compliance
**Module**: Dashboard  
**Test Scenario**: Dashboard meets accessibility standards  
**Priority**: Medium  
**Preconditions**: Screen reader or accessibility testing tools  
**Test Steps**:
1. Test with screen reader
2. Check keyboard navigation
3. Verify ARIA labels and descriptions
4. Test high contrast mode

**Expected UI**:
- Proper heading hierarchy (h1, h2, h3)
- ARIA labels on interactive elements
- Keyboard accessible navigation
- High contrast mode support
- Screen reader friendly

**Expected API**: No changes  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_DASH_025 - Dashboard Widget Interactions
**Module**: Dashboard  
**Test Scenario**: Individual dashboard sections are interactive appropriately  
**Priority**: Medium  
**Preconditions**: Dashboard fully loaded  
**Test Steps**:
1. Test interactions in each dashboard section
2. Verify hover states and click behaviors
3. Check for appropriate tooltips or help text

**Expected UI**:
- Clickable elements show hover states
- Appropriate cursor changes (pointer for clickable)
- Tooltips provide helpful information
- Interactive feedback for user actions

**Expected API**: No API calls for basic interactions  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___