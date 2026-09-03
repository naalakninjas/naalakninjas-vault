# 💰 Contributions Management Test Suite

## TC_CONT_001 - Contributions Page Load
**Module**: Contributions  
**Test Scenario**: Navigate to contributions page and verify layout  
**Priority**: Critical  
**Preconditions**: Logged in as any ninja  
**Test Steps**:
1. Click "Contributions" in sidebar navigation
2. Wait for page to load completely
3. Verify all page sections display

**Expected UI**:
- Page header "Vault Contributions"
- Current month contribution progress bar
- Monthly status cards for all 4 ninjas
- Contribution history table (if data exists)
- "Add Contribution" button visible

**Expected API**: 
- GET /rest/v1/contributions
- GET /rest/v1/v_contribution_status
- Both return 200 status

**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_002 - Add New Contribution Flow
**Module**: Contributions  
**Test Scenario**: Add a standard monthly contribution  
**Priority**: Critical  
**Preconditions**: Contributions page loaded, current ninja has not contributed this month  
**Test Steps**:
1. Click "Add Contribution" button
2. Verify form opens with correct defaults
3. Enter amount: 5000
4. Select current month and year
5. Select payment date (today)
6. Click Submit

**Expected UI**:
- Contribution form modal opens
- Current ninja pre-selected
- Default amount shows ₹5,000
- Current month/year pre-selected
- Calendar date picker works
- Success message after submission

**Expected API**: 
- POST /rest/v1/contributions
- Status: 201 Created
- Response includes new contribution ID

**Expected DB**: 
- New row in contributions table
- Fields: member_id, amount, month, year, payment_date, created_at

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_003 - Contribution Amount Validation
**Module**: Contributions  
**Test Scenario**: Test contribution amount field validation  
**Priority**: High  
**Preconditions**: Contribution form open  
**Test Steps**:
1. Try to submit with amount = 0
2. Try negative amount: -1000
3. Try extremely large amount: 999999999
4. Try non-numeric input: "abc"
5. Verify validation messages

**Expected UI**:
- Error: "Amount must be greater than 0"
- Error for negative amounts
- Error or warning for unrealistic amounts
- Input field accepts only numbers
- Form submission blocked until valid

**Expected API**: No API call for invalid data  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_004 - Calendar Date Selection
**Module**: Contributions  
**Test Scenario**: Payment date selection using calendar picker  
**Priority**: Medium  
**Preconditions**: Contribution form open  
**Test Steps**:
1. Click on payment date field
2. Verify calendar picker opens
3. Select a date from current month
4. Select a date from previous month
5. Verify selected date appears in field

**Expected UI**:
- Calendar picker opens on field click
- Current date highlighted by default
- Selected date updates field value
- Calendar shows proper month navigation
- Date format: YYYY-MM-DD or localized format

**Expected API**: No API call for date selection  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_005 - Multiple Contributions Same Month
**Module**: Contributions  
**Test Scenario**: Add second contribution in same month (after unique constraint removal)  
**Priority**: High  
**Preconditions**: One contribution already exists for current month/ninja  
**Test Steps**:
1. Add first contribution for current month
2. Attempt to add second contribution same month
3. Verify both contributions are accepted

**Expected UI**:
- Second contribution form accepts submission
- Both contributions appear in history
- Monthly total shows sum of both contributions
- No duplicate error messages

**Expected API**: 
- POST /rest/v1/contributions (succeeds)
- Status: 201 Created

**Expected DB**: 
- Two separate rows for same ninja/month
- Both contributions counted in totals

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_006 - Monthly Progress Calculation
**Module**: Contributions  
**Test Scenario**: Verify monthly progress bar updates correctly  
**Priority**: High  
**Preconditions**: Some contributions exist for current month  
**Test Steps**:
1. Note current monthly total
2. Add new contribution
3. Verify progress bar updates
4. Check percentage calculation

**Expected UI**:
- Progress bar shows: (current total / monthly target) * 100
- Target typically ₹20,000 (4 ninjas × ₹5,000)
- Progress bar color changes based on completion
- Percentage text updates to match bar

**Expected API**: Fresh data after contribution submission  
**Expected DB**: 
```sql
SELECT SUM(amount) FROM contributions 
WHERE month = CURRENT_MONTH AND year = CURRENT_YEAR
```

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_007 - Ninja Status Card Updates
**Module**: Contributions  
**Test Scenario**: Individual ninja status cards update after contribution  
**Priority**: High  
**Preconditions**: Contributions page loaded  
**Test Steps**:
1. Identify ninja with "Pending" status
2. Add contribution for that ninja
3. Verify status card updates to "Paid"
4. Check amount and date display

**Expected UI**:
- Ninja status changes from "Pending" to "Paid"
- Contribution amount displays correctly
- Payment date shows correctly
- Ninja-specific color theming applied

**Expected API**: Updated contribution status data  
**Expected DB**: 
- Contribution record for ninja exists
- Status derived from contribution presence

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_008 - Over-Goal Confirmation Dialog
**Module**: Contributions  
**Test Scenario**: Warning when contribution exceeds monthly goal  
**Priority**: Medium  
**Preconditions**: Current month contributions near or at goal  
**Test Steps**:
1. Add contribution that would exceed monthly goal
2. Verify confirmation dialog appears
3. Choose to proceed with over-goal contribution
4. Verify contribution is accepted

**Expected UI**:
- Warning dialog: "This contribution will exceed the monthly goal"
- Options to "Continue" or "Cancel"
- Clear explanation of impact
- Contribution proceeds if confirmed

**Expected API**: POST /rest/v1/contributions after confirmation  
**Expected DB**: Contribution saved even if over goal  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_009 - Edit Existing Contribution
**Module**: Contributions  
**Test Scenario**: Modify an existing contribution record  
**Priority**: Medium  
**Preconditions**: Contribution history exists with editable entries  
**Test Steps**:
1. Find existing contribution in history
2. Click edit button/action
3. Modify amount from ₹5,000 to ₹7,500
4. Update payment date
5. Save changes

**Expected UI**:
- Edit form pre-populated with existing data
- Changes reflected in contribution list
- Updated totals and progress calculations
- Edit success confirmation

**Expected API**: 
- PUT /rest/v1/contributions/{id}
- Status: 200 OK

**Expected DB**: 
- Updated row with new amount and date
- Same ID, updated timestamp

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_010 - Delete Contribution
**Module**: Contributions  
**Test Scenario**: Remove a contribution from history  
**Priority**: Medium  
**Preconditions**: Contribution exists in history  
**Test Steps**:
1. Locate contribution to delete
2. Click delete button
3. Confirm deletion in confirmation dialog
4. Verify contribution removed from list

**Expected UI**:
- Delete confirmation dialog
- Contribution removed from history
- Monthly totals recalculated
- Progress bar updates accordingly

**Expected API**: 
- DELETE /rest/v1/contributions/{id}
- Status: 204 No Content

**Expected DB**: 
- Row deleted from contributions table
- Related calculations update

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_011 - Contribution History Sorting
**Module**: Contributions  
**Test Scenario**: Contribution history displays in correct order  
**Priority**: Low  
**Preconditions**: Multiple contributions exist  
**Test Steps**:
1. View contribution history table
2. Verify default sort order (newest first)
3. Test column header sorting (if available)

**Expected UI**:
- Most recent contributions at top
- Consistent date/time formatting
- Sortable columns (if implemented)
- Clear chronological order

**Expected API**: 
- Contributions ordered by created_at DESC
- Proper sorting in API response

**Expected DB**: 
```sql
SELECT * FROM contributions 
ORDER BY created_at DESC
```

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_012 - Mobile Contribution Interface
**Module**: Contributions  
**Test Scenario**: Contribution management on mobile devices  
**Priority**: High  
**Preconditions**: Mobile device or mobile viewport  
**Test Steps**:
1. Load contributions page on mobile
2. Test "Add Contribution" on mobile
3. Verify mobile-optimized layouts
4. Test form interactions on touch

**Expected UI**:
- Mobile-responsive contribution cards
- Touch-friendly form elements
- Mobile-optimized modal sizing
- Swipe gestures (if implemented)
- No horizontal scrolling required

**Expected API**: Same API calls as desktop  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_013 - Month/Year Selection
**Module**: Contributions  
**Test Scenario**: Contribute for different months and years  
**Priority**: Medium  
**Preconditions**: Contribution form open  
**Test Steps**:
1. Select previous month for contribution
2. Select future month (if allowed)
3. Select different year
4. Verify validation and acceptance

**Expected UI**:
- Month/year dropdowns or pickers
- Validation for reasonable date ranges
- Clear indication of selected period
- Proper submission for different periods

**Expected API**: Contribution data includes selected month/year  
**Expected DB**: 
- Contribution stored with selected month/year
- Proper filtering by period possible

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_014 - Contribution Form Cancellation
**Module**: Contributions  
**Test Scenario**: Cancel contribution form without saving  
**Priority**: Low  
**Preconditions**: Contribution form open with data entered  
**Test Steps**:
1. Enter contribution data (don't submit)
2. Click "Cancel" or close button
3. Verify form closes without saving
4. Check no data persisted

**Expected UI**:
- Form closes immediately
- No contribution added to list
- No success/error messages
- Return to contributions page cleanly

**Expected API**: No API call made  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_015 - Empty State Display
**Module**: Contributions  
**Test Scenario**: Contributions page with no data  
**Priority**: Medium  
**Preconditions**: Fresh database or no contributions for current ninja  
**Test Steps**:
1. Load contributions page with no existing data
2. Verify empty state messaging
3. Check call-to-action availability

**Expected UI**:
- "No contributions yet" or similar message
- Encouraging call-to-action to add first contribution
- Progress bar shows 0%
- All ninja cards show "Pending" status

**Expected API**: 
- API returns empty arrays
- No error responses

**Expected DB**: 
- Empty contributions table returns no rows

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_016 - Currency Formatting Validation
**Module**: Contributions  
**Test Scenario**: Test various currency input formats  
**Priority**: Medium  
**Preconditions**: Contribution form open  
**Test Steps**:
1. Enter amount with comma: "5,000"
2. Enter amount with currency symbol: "₹5000"
3. Enter decimal amount: "5000.50"
4. Verify parsing and display

**Expected UI**:
- Input accepts various formats
- Displays consistently formatted amounts
- Proper parsing of user input
- Clear currency symbol display (₹)

**Expected API**: Numeric amounts sent to API  
**Expected DB**: Decimal amounts stored correctly  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_017 - Contribution Search/Filter
**Module**: Contributions  
**Test Scenario**: Filter contributions by criteria (if implemented)  
**Priority**: Low  
**Preconditions**: Multiple contributions exist  
**Test Steps**:
1. Look for filter/search functionality
2. Filter by date range
3. Filter by ninja/member
4. Filter by amount range

**Expected UI**:
- Filter controls clearly labeled
- Results update based on filter criteria
- Clear filter indicators
- Reset/clear filter option

**Expected API**: 
- Filtered data requests to API
- Proper query parameters

**Expected DB**: 
- Filtered queries based on criteria
- Proper WHERE clauses applied

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_018 - Bulk Operations
**Module**: Contributions  
**Test Scenario**: Bulk actions on multiple contributions (if implemented)  
**Priority**: Low  
**Preconditions**: Multiple contributions exist  
**Test Steps**:
1. Select multiple contributions
2. Perform bulk action (delete, export, etc.)
3. Verify all selected items processed

**Expected UI**:
- Multi-select checkboxes or mechanism
- Bulk action buttons appear when items selected
- Confirmation for bulk operations
- Progress indication for bulk processing

**Expected API**: 
- Batch operations to API
- Efficient bulk processing

**Expected DB**: 
- Batch operations or transactions
- Data consistency maintained

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_019 - Contribution Validation Edge Cases
**Module**: Contributions  
**Test Scenario**: Test edge cases in contribution validation  
**Priority**: Medium  
**Preconditions**: Contribution form open  
**Test Steps**:
1. Test maximum allowed amount
2. Test minimum allowed amount (₹1)
3. Test decimal precision limits
4. Test special characters in amount field

**Expected UI**:
- Clear validation messages for limits
- Proper handling of edge cases
- No crashes or unexpected behavior
- User-friendly error messages

**Expected API**: Server-side validation alignment  
**Expected DB**: Data type constraints respected  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_020 - Performance with Large Dataset
**Module**: Contributions  
**Test Scenario**: Contributions page performance with many records  
**Priority**: Low  
**Preconditions**: Large number of contributions in database  
**Test Steps**:
1. Load contributions page with 100+ records
2. Measure load time and responsiveness
3. Test pagination or infinite scroll (if implemented)

**Expected UI**:
- Page loads within acceptable time
- Smooth scrolling and interactions
- Pagination works efficiently (if implemented)
- No browser freezing or lag

**Expected API**: 
- Paginated responses for large datasets
- Efficient query performance

**Expected DB**: 
- Proper indexing for performance
- Optimized queries for large datasets

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_021 - Contribution Export
**Module**: Contributions  
**Test Scenario**: Export contribution data (if implemented)  
**Priority**: Low  
**Preconditions**: Contributions exist  
**Test Steps**:
1. Look for export functionality
2. Export to CSV or Excel format
3. Verify exported data accuracy
4. Test different export options

**Expected UI**:
- Export button/menu option
- Format selection options
- Download progress indication
- File download completes successfully

**Expected API**: 
- Export endpoint returns proper format
- Complete data included

**Expected DB**: 
- Export queries include all necessary data
- Proper data formatting for export

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_022 - Real-time Updates
**Module**: Contributions  
**Test Scenario**: Contributions page updates when other users add contributions  
**Priority**: Low  
**Preconditions**: Multiple user sessions  
**Test Steps**:
1. Open contributions in multiple browser tabs
2. Add contribution in Tab 1
3. Check if Tab 2 shows update automatically
4. Verify real-time synchronization

**Expected UI**:
- Data updates across tabs/sessions
- Real-time or near-real-time sync
- Proper refresh mechanisms
- No stale data displayed

**Expected API**: 
- Real-time updates (if implemented)
- Fresh data on page focus/refresh

**Expected DB**: 
- Consistent data across sessions
- Proper transaction handling

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_023 - Offline Behavior
**Module**: Contributions  
**Test Scenario**: Contributions page behavior when offline  
**Priority**: Low  
**Preconditions**: Loaded contributions page  
**Test Steps**:
1. Load contributions page while online
2. Disconnect network
3. Try to add new contribution
4. Reconnect and verify behavior

**Expected UI**:
- Offline state indication
- Graceful handling of offline actions
- Queue actions for when online (if implemented)
- Clear messaging about offline state

**Expected API**: 
- Proper offline error handling
- Request queuing (if implemented)

**Expected DB**: 
- No data corruption from offline actions
- Proper sync when reconnected

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_024 - Accessibility Features
**Module**: Contributions  
**Test Scenario**: Contributions page accessibility compliance  
**Priority**: Medium  
**Preconditions**: Screen reader or accessibility testing tools  
**Test Steps**:
1. Navigate page using only keyboard
2. Test with screen reader
3. Verify ARIA labels and descriptions
4. Check color contrast compliance

**Expected UI**:
- All interactive elements keyboard accessible
- Proper focus management
- Screen reader friendly labels
- Sufficient color contrast ratios
- Logical tab order

**Expected API**: No changes  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_025 - UTR Number Handling
**Module**: Contributions  
**Test Scenario**: UTR (transaction reference) number entry and validation  
**Priority**: Low  
**Preconditions**: Contribution form open  
**Test Steps**:
1. Enter UTR number in contribution form
2. Verify format validation (if any)
3. Verify UTR appears in contribution record
4. Test duplicate UTR handling

**Expected UI**:
- UTR field accepts alphanumeric input
- Format validation (if implemented)
- UTR displays in contribution history
- Clear labeling and help text

**Expected API**: UTR included in contribution data  
**Expected DB**: 
- UTR stored in utr_number field
- Proper string handling

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_026 - Contribution Notifications
**Module**: Contributions  
**Test Scenario**: Notifications after contribution actions (if implemented)  
**Priority**: Low  
**Preconditions**: Contribution actions completed  
**Test Steps**:
1. Add new contribution
2. Edit existing contribution
3. Delete contribution
4. Check for appropriate notifications

**Expected UI**:
- Success notifications for completed actions
- Error notifications for failed actions
- Non-intrusive notification display
- Notifications auto-dismiss after time

**Expected API**: No API changes for notifications  
**Expected DB**: No changes for notifications  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_027 - Contribution Statistics
**Module**: Contributions  
**Test Scenario**: Contribution statistics and analytics display  
**Priority**: Medium  
**Preconditions**: Historical contribution data exists  
**Test Steps**:
1. View contribution statistics section
2. Check monthly averages
3. Verify ninja contribution rankings
4. Check trend calculations

**Expected UI**:
- Statistics clearly presented
- Proper calculations displayed
- Visual indicators (charts if implemented)
- Historical trend information

**Expected API**: 
- Statistics calculations from API
- Aggregated data queries

**Expected DB**: 
```sql
SELECT 
  member_id, 
  AVG(amount) as avg_contribution,
  SUM(amount) as total_contribution
FROM contributions 
GROUP BY member_id
```

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_028 - Form Auto-save
**Module**: Contributions  
**Test Scenario**: Contribution form auto-save functionality (if implemented)  
**Priority**: Low  
**Preconditions**: Contribution form open  
**Test Steps**:
1. Start entering contribution data
2. Navigate away from form
3. Return to form
4. Verify data preserved

**Expected UI**:
- Form data preserved across navigation
- Auto-save indicator (if visible)
- Draft state management
- Clear draft handling

**Expected API**: No API calls for drafts (local storage)  
**Expected DB**: No changes for drafts  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_029 - Data Validation Security
**Module**: Contributions  
**Test Scenario**: Security validation of contribution data  
**Priority**: High  
**Preconditions**: Contribution form open, dev tools access  
**Test Steps**:
1. Attempt to modify form data via browser dev tools
2. Try to submit invalid member_id
3. Test for XSS vulnerabilities in text fields
4. Verify server-side validation

**Expected UI**: No changes for invalid data attempts  
**Expected API**: 
- Server-side validation rejects invalid data
- Proper error responses for security violations

**Expected DB**: 
- No invalid data stored
- Foreign key constraints enforced
- Data sanitization applied

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_CONT_030 - Integration with Dashboard
**Module**: Contributions  
**Test Scenario**: Contributions data integration with dashboard  
**Priority**: High  
**Preconditions**: Contributions exist, dashboard accessible  
**Test Steps**:
1. Add contribution on contributions page
2. Navigate to dashboard
3. Verify dashboard reflects new contribution
4. Check vault balance updates

**Expected UI**:
- Dashboard shows updated contribution totals
- Vault balance reflects new contribution
- Ninja status updates on dashboard
- Consistent data across pages

**Expected API**: Same data sources for both pages  
**Expected DB**: 
- Consistent data queries across features
- Proper data synchronization

**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___