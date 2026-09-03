# 🔐 Authentication & Authorization Test Suite

## TC_AUTH_001 - Ninja Selection Screen Load
**Module**: Authentication  
**Test Scenario**: Verify ninja selection screen displays correctly on app launch  
**Priority**: Critical  
**Preconditions**: Fresh browser session, no localStorage data  
**Test Steps**:
1. Open http://localhost:5173
2. Wait for app to load
3. Verify ninja selection screen appears

**Expected UI**: 
- "The Council Awaits" header visible
- 4 ninja cards displayed with correct avatars
- Each ninja shows: name, title, avatar, ninja type
- No PIN input visible initially

**Expected API**: 
- GET request to Supabase for members data
- Response: 200 status, array of 4 members

**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_002 - Valid PIN Entry
**Module**: Authentication  
**Test Scenario**: Login with the correct PIN  
**Priority**: Critical  
**Preconditions**: Shilpha has already completed first-run PIN setup on this
browser (see TC_AUTH_002a), and the chosen PIN is known to the tester  
**Test Steps**:
1. Click on "Shilpha" ninja card
2. PIN input dialog appears
3. Enter the PIN chosen during setup
4. Click Submit

**Expected UI**:
- PIN input shows 4 dots
- Success feedback (green checkmark or similar)
- Navigate to Dashboard
- Sidebar shows Shilpha's profile

**Expected API**: No API call (PIN validated locally)  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_003 - Invalid PIN Entry
**Module**: Authentication  
**Test Scenario**: Login with incorrect PIN  
**Priority**: High  
**Preconditions**: Ninja selection screen loaded, any ninja selected  
**Test Steps**:
1. Click on ninja card
2. Enter wrong PIN: 0000
3. Click Submit

**Expected UI**:
- Error message: "Invalid PIN. Please try again."
- PIN input clears
- Shake animation on PIN input
- Attempt counter shows (if applicable)
- Stay on PIN entry screen

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_004 - PIN Attempt Lockout
**Module**: Authentication  
**Test Scenario**: Exceed maximum PIN attempts  
**Priority**: High  
**Preconditions**: Ninja selected, ready for PIN entry  
**Test Steps**:
1. Enter wrong PIN: 1111
2. Enter wrong PIN: 2222  
3. Enter wrong PIN: 3333
4. Verify lockout behavior

**Expected UI**:
- After 3 attempts: temporary lockout message
- PIN input disabled for specified time
- "Back" button remains enabled
- Timer showing remaining lockout time (if implemented)

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_005 - Back Button During PIN Entry
**Module**: Authentication  
**Test Scenario**: Return to ninja selection from PIN entry  
**Priority**: Medium  
**Preconditions**: PIN entry screen displayed  
**Test Steps**:
1. Click ninja card to show PIN entry
2. Click "Back" button
3. Verify return to ninja selection

**Expected UI**:
- Return to ninja selection screen
- All 4 ninja cards visible again
- No PIN entry dialog
- Page state reset properly

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_006 - Session Persistence
**Module**: Authentication  
**Test Scenario**: Verify login session persists across browser refresh  
**Priority**: High  
**Preconditions**: Successfully logged in as any ninja  
**Test Steps**:
1. Login successfully (complete authentication)
2. Navigate to any internal page
3. Refresh browser (F5)
4. Verify session maintained

**Expected UI**:
- Remain on same page after refresh
- User identity preserved in sidebar
- No redirect to ninja selection
- All data loads correctly

**Expected API**: Standard data fetching APIs  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_007 - Logout Functionality
**Module**: Authentication  
**Test Scenario**: Logout and return to ninja selection  
**Priority**: High  
**Preconditions**: Logged in as any ninja, on dashboard  
**Test Steps**:
1. Access user menu/profile
2. Click logout option
3. Verify logout behavior

**Expected UI**:
- Redirect to ninja selection screen
- Clear all user-specific data from UI
- Remove session indicators
- Fresh ninja selection state

**Expected API**: No API call for logout  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_008 - Direct URL Access (Unauthorized)
**Module**: Authentication  
**Test Scenario**: Access protected routes without login  
**Priority**: Critical  
**Preconditions**: Fresh browser, no authentication  
**Test Steps**:
1. Clear all localStorage
2. Directly access: http://localhost:5173/dashboard
3. Verify redirect behavior

**Expected UI**:
- Automatic redirect to ninja selection screen
- No access to protected content
- Proper navigation guard behavior

**Expected API**: No unauthorized API calls  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_009 - Multiple Tab Behavior
**Module**: Authentication  
**Test Scenario**: Login consistency across multiple browser tabs  
**Priority**: Medium  
**Preconditions**: One tab with successful login  
**Test Steps**:
1. Login in Tab 1
2. Open new Tab 2 to same app
3. Verify authentication state

**Expected UI**:
- Tab 2 shows same authenticated state
- User identity consistent across tabs
- Navigation works in both tabs

**Expected API**: Same data access in both tabs  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_010 - Custom PIN After Change
**Module**: Authentication  
**Test Scenario**: Login with custom PIN after changing default  
**Priority**: High  
**Preconditions**: PIN has been changed from default to custom PIN  
**Test Steps**:
1. Logout from authenticated session
2. Select same ninja
3. Enter custom PIN (not default)
4. Verify successful login

**Expected UI**:
- Custom PIN accepted for login
- No "Default PIN" hint shown
- Successful authentication and navigation

**Expected API**: No API call for PIN verification  
**Expected DB**: No changes (PIN stored in localStorage)  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_011 - PIN Input Masking
**Module**: Authentication  
**Test Scenario**: Verify PIN digits are masked during entry  
**Priority**: Medium  
**Preconditions**: PIN entry screen displayed  
**Test Steps**:
1. Click ninja to show PIN entry
2. Enter digits one by one: 1, 2, 3, 4
3. Verify each digit is masked

**Expected UI**:
- Each digit shows as bullet point (•) or asterisk (*)
- No actual numbers visible
- PIN length indicator shows progress
- Proper cursor behavior

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_012 - PIN Auto-Submit
**Module**: Authentication  
**Test Scenario**: PIN automatically submits after 4 digits  
**Priority**: Low  
**Preconditions**: PIN entry screen displayed  
**Test Steps**:
1. Enter 4-digit PIN without clicking submit
2. Verify automatic submission behavior

**Expected UI**:
- Automatic submission after 4th digit
- No need to click submit button
- Immediate feedback (success/error)

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_013 - Keyboard Navigation
**Module**: Authentication  
**Test Scenario**: Navigate PIN entry using keyboard  
**Priority**: Low  
**Preconditions**: PIN entry screen displayed  
**Test Steps**:
1. Use Tab to navigate between PIN digits
2. Use number keys to enter PIN
3. Use Enter to submit
4. Use Escape to go back

**Expected UI**:
- Proper focus management
- Visual focus indicators
- Keyboard shortcuts work correctly
- Accessible navigation

**Expected API**: No API call for navigation  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_014 - Mobile Touch Interface
**Module**: Authentication  
**Test Scenario**: PIN entry on mobile/touch devices  
**Priority**: High  
**Preconditions**: App loaded on mobile device or mobile emulation  
**Test Steps**:
1. Select ninja on mobile interface
2. Enter PIN using touch/virtual keyboard
3. Verify mobile-optimized experience

**Expected UI**:
- Mobile-friendly PIN entry interface
- Appropriate touch targets
- Virtual keyboard interaction
- Responsive layout on small screens

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_015 - Ninja Avatar Display
**Module**: Authentication  
**Test Scenario**: Verify ninja avatars display correctly on selection screen  
**Priority**: Medium  
**Preconditions**: Ninja selection screen loaded  
**Test Steps**:
1. Verify each ninja has correct avatar image
2. Check avatar quality and formatting
3. Verify ninja-specific color borders

**Expected UI**:
- Shilpha: Green-bordered avatar
- Suhas: Red-bordered avatar  
- Sudeep: Blue-bordered avatar
- Aneesh: Gold-bordered avatar
- High-quality, properly sized images

**Expected API**: Image assets loaded correctly  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_016 - Error Message Display
**Module**: Authentication  
**Test Scenario**: Verify error messages are user-friendly and clear  
**Priority**: Medium  
**Preconditions**: PIN entry screen  
**Test Steps**:
1. Enter invalid PIN
2. Verify error message content and styling
3. Check error message disappears appropriately

**Expected UI**:
- Clear, non-technical error message
- Appropriate styling (red text, error icon)
- Message clears on next attempt
- No console errors visible to user

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_017 - PIN Hint Display Logic
**Module**: Authentication  
**Test Scenario**: Verify PIN hint displays only for default PINs  
**Priority**: Medium  
**Preconditions**: Fresh app state  
**Test Steps**:
1. Select ninja with default PIN
2. Verify hint displays
3. Change PIN, logout, login again
4. Verify hint no longer displays

**Expected UI**:
- Default PIN hint shows for unchanged PINs
- "Custom PIN set" message for changed PINs
- Hint provides helpful guidance
- No hint for empty/error states

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_018 - Browser Back Button Behavior
**Module**: Authentication  
**Test Scenario**: Browser back button during authentication flow  
**Priority**: Medium  
**Preconditions**: In PIN entry screen  
**Test Steps**:
1. Navigate to PIN entry
2. Use browser back button
3. Verify proper navigation

**Expected UI**:
- Returns to ninja selection screen
- No broken navigation state
- Proper URL routing
- Clean UI state reset

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_019 - Loading States
**Module**: Authentication  
**Test Scenario**: Verify loading indicators during authentication  
**Priority**: Low  
**Preconditions**: Ninja selection screen  
**Test Steps**:
1. Click ninja card
2. Observe loading behavior
3. Enter PIN and submit
4. Verify loading during processing

**Expected UI**:
- Loading spinner/indicator during transitions
- Disabled inputs during processing
- Clear visual feedback
- No frozen/unresponsive states

**Expected API**: Proper loading states for API calls  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_020 - Ninja Card Hover Effects
**Module**: Authentication  
**Test Scenario**: Interactive hover effects on ninja selection cards  
**Priority**: Low  
**Preconditions**: Ninja selection screen on desktop  
**Test Steps**:
1. Hover over each ninja card
2. Verify hover animations and effects
3. Click and verify active states

**Expected UI**:
- Smooth hover animations
- Color-appropriate glow effects
- Card elevation/shadow changes
- Cursor changes to pointer
- Ninja-specific color themes

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_021 - Network Error Handling
**Module**: Authentication  
**Test Scenario**: Authentication behavior during network issues  
**Priority**: High  
**Preconditions**: Simulated network issues  
**Test Steps**:
1. Disconnect network
2. Attempt to load ninja selection
3. Verify graceful error handling

**Expected UI**:
- User-friendly network error message
- Retry mechanism available
- No app crashes or white screens
- Fallback UI content

**Expected API**: Failed network requests handled gracefully  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_022 - Security Headers Validation
**Module**: Authentication  
**Test Scenario**: Verify proper security headers in authentication requests  
**Priority**: Medium  
**Preconditions**: Browser dev tools open  
**Test Steps**:
1. Monitor network requests during login
2. Verify security headers present
3. Check for sensitive data exposure

**Expected UI**: No change  
**Expected API**: 
- Proper CORS headers
- No sensitive data in URLs/headers
- HTTPS enforcement
- Appropriate cache headers

**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_023 - Concurrent Login Attempts
**Module**: Authentication  
**Test Scenario**: Multiple simultaneous login attempts  
**Priority**: Low  
**Preconditions**: Multiple browser instances  
**Test Steps**:
1. Open multiple browser windows
2. Attempt login in multiple windows simultaneously
3. Verify behavior consistency

**Expected UI**:
- Consistent authentication state across windows
- No race conditions or conflicts
- Proper session management

**Expected API**: Consistent API behavior  
**Expected DB**: No data corruption  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_024 - Accessibility Compliance
**Module**: Authentication  
**Test Scenario**: Screen reader and accessibility support  
**Priority**: Medium  
**Preconditions**: Screen reader software available  
**Test Steps**:
1. Navigate ninja selection with screen reader
2. Complete PIN entry using accessibility tools
3. Verify ARIA labels and descriptions

**Expected UI**:
- Proper ARIA labels on all interactive elements
- Screen reader friendly navigation
- Focus management for accessibility
- High contrast mode support

**Expected API**: No API changes  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_AUTH_025 - Performance Benchmarks
**Module**: Authentication  
**Test Scenario**: Authentication performance under load  
**Priority**: Low  
**Preconditions**: Performance monitoring tools  
**Test Steps**:
1. Measure ninja selection screen load time
2. Measure PIN verification response time
3. Verify performance meets benchmarks

**Expected UI**:
- Screen loads within 2 seconds
- PIN verification < 500ms
- No noticeable lag or delays
- Smooth animations

**Expected API**: Response times within acceptable limits  
**Expected DB**: Query performance within benchmarks  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___