# 🔢 PIN Management Test Suite

## TC_PIN_001 - Access PIN Change Settings
**Module**: PIN Management  
**Test Scenario**: Navigate to PIN change functionality in Settings  
**Priority**: High  
**Preconditions**: Logged in as any ninja, on Dashboard  
**Test Steps**:
1. Navigate to Settings page
2. Locate "Change PIN" option
3. Click "Change PIN" button
4. Verify PIN change modal opens

**Expected UI**:
- Settings page loads correctly
- "Change PIN" button is visible and clickable
- Modal opens with PIN change form
- Current PIN display in modal

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_002 - Display Current PIN in Modal
**Module**: PIN Management  
**Test Scenario**: Verify current PIN is shown in change PIN modal  
**Priority**: Medium  
**Preconditions**: PIN change modal open  
**Test Steps**:
1. Open PIN change modal
2. Verify current PIN is displayed
3. Check PIN format and masking

**Expected UI**:
- Current PIN shown (masked or unmasked as per design)
- Clear labeling "Current PIN: XXXX"
- Proper formatting and styling

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_003 - Valid PIN Change
**Module**: PIN Management  
**Test Scenario**: Change an existing PIN to a new one  
**Priority**: Critical  
**Preconditions**: Signed in as Shilpha, PIN change modal open  
**Test Steps**:
1. Enter current PIN: the PIN chosen at first-run setup
2. Enter new PIN: 9999
3. Confirm new PIN: 9999
4. Click "Update PIN"

**Expected UI**:
- Success message displayed
- Modal closes automatically
- Settings page updates to show custom PIN status

**Expected API**: No API call (PIN stored locally)  
**Expected DB**: No changes  
**LocalStorage**: PIN updated in `ninjaPins` object  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_004 - Invalid Current PIN
**Module**: PIN Management  
**Test Scenario**: Attempt PIN change with wrong current PIN  
**Priority**: High  
**Preconditions**: PIN change modal open  
**Test Steps**:
1. Enter incorrect current PIN: 0000
2. Enter new PIN: 5555
3. Confirm new PIN: 5555
4. Click "Update PIN"

**Expected UI**:
- Error message: "Current PIN is incorrect"
- Form remains open for correction
- Input fields highlight error state
- No PIN change occurs

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_005 - PIN Confirmation Mismatch
**Module**: PIN Management  
**Test Scenario**: New PIN and confirm PIN don't match  
**Priority**: High  
**Preconditions**: PIN change modal open  
**Test Steps**:
1. Enter correct current PIN
2. Enter new PIN: 1111
3. Enter confirm PIN: 2222
4. Click "Update PIN"

**Expected UI**:
- Error message: "New PIN and confirmation don't match"
- Highlight mismatched fields
- Form validation prevents submission
- Clear guidance for correction

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_006 - PIN Length Validation
**Module**: PIN Management  
**Test Scenario**: Validate PIN must be exactly 4 digits  
**Priority**: High  
**Preconditions**: PIN change modal open  
**Test Steps**:
1. Try new PIN with 3 digits: 123
2. Try new PIN with 5 digits: 12345
3. Try non-numeric PIN: ABCD
4. Verify validation behavior

**Expected UI**:
- Error messages for invalid lengths
- Input field limits to 4 digits
- Numeric-only input enforcement
- Real-time validation feedback

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_007 - Cancel PIN Change
**Module**: PIN Management  
**Test Scenario**: Cancel PIN change operation  
**Priority**: Medium  
**Preconditions**: PIN change modal open with data entered  
**Test Steps**:
1. Enter some data in PIN fields
2. Click "Cancel" button
3. Verify modal closes without saving

**Expected UI**:
- Modal closes immediately
- No changes saved
- Return to Settings page
- No error messages

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_008 - Modal Overlay Click to Close
**Module**: PIN Management  
**Test Scenario**: Close PIN modal by clicking overlay  
**Priority**: Low  
**Preconditions**: PIN change modal open  
**Test Steps**:
1. Click outside modal on overlay/backdrop
2. Verify modal closes properly

**Expected UI**:
- Modal closes when clicking overlay
- No data saved
- Clean return to Settings
- Proper z-index and overlay behavior

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_009 - PIN Masking in Input Fields
**Module**: PIN Management  
**Test Scenario**: Verify PIN fields are properly masked  
**Priority**: Medium  
**Preconditions**: PIN change modal open  
**Test Steps**:
1. Enter data in each PIN field
2. Verify masking behavior
3. Check for show/hide toggle (if implemented)

**Expected UI**:
- All PIN fields show masked characters (• or *)
- No plain text PIN visible
- Optional show/hide toggle functionality
- Consistent masking across all fields

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_010 - Login with Changed PIN
**Module**: PIN Management  
**Test Scenario**: Verify login works with new custom PIN  
**Priority**: Critical  
**Preconditions**: PIN successfully changed from default to custom  
**Test Steps**:
1. Logout from current session
2. Select same ninja from selection screen
3. Enter new custom PIN
4. Verify successful login

**Expected UI**:
- Custom PIN accepted for login
- No "Default PIN" hint shown
- Successful authentication
- Access to all app features

**Expected API**: No API call for PIN verification  
**Expected DB**: No changes  
**LocalStorage**: PIN retrieved from storage  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_011 - PIN Hint Status Update
**Module**: PIN Management  
**Test Scenario**: PIN hint updates after PIN change  
**Priority**: Medium  
**Preconditions**: PIN changed from default to custom  
**Test Steps**:
1. Logout and return to ninja selection
2. Select ninja with changed PIN
3. Verify hint message has changed

**Expected UI**:
- Default PIN hint no longer shows
- "Custom PIN set" message displays
- Clear indication PIN has been customized
- Consistent with PIN change status

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: PIN status checked from storage  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_012 - Multiple PIN Changes
**Module**: PIN Management  
**Test Scenario**: Change PIN multiple times in sequence  
**Priority**: Medium  
**Preconditions**: Logged in with custom PIN  
**Test Steps**:
1. Change PIN from custom (9999) to new custom (7777)
2. Change PIN again from 7777 to 3333
3. Verify each change works correctly

**Expected UI**:
- Each change updates current PIN display
- Success messages for each change
- Final PIN is the last one set
- No interference between changes

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: PIN updated for each change  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_013 - PIN Change for Different Ninjas
**Module**: PIN Management  
**Test Scenario**: Change PINs for multiple ninja accounts  
**Priority**: High  
**Preconditions**: Access to multiple ninja accounts  
**Test Steps**:
1. Login as Shilpha, change PIN to 1111
2. Logout, login as Suhas, change PIN to 2222
3. Verify PINs are ninja-specific

**Expected UI**:
- Each ninja maintains separate PIN
- No PIN interference between accounts
- Correct PIN required for each ninja
- Individual PIN status tracking

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: Separate PIN entries per ninja ID  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_014 - First-Run Setup For An Unclaimed Ninja
**Module**: PIN Management  
**Test Scenario**: A ninja whose PIN has never been set is asked to choose one  
**Priority**: Medium  
**Preconditions**: `SELECT pin_hash FROM members WHERE name = '<name>'` is NULL.
Run `UPDATE members SET pin_hash = NULL WHERE name = '<name>'` to get there  
**Test Steps**:
1. Sign out
2. Select that ninja

**Expected UI**:
- Heading reads "Welcome, <name>" rather than "Welcome back"
- Prompt reads "Choose a 4-digit PIN", button reads "Continue"
- After four digits, prompt changes to "Enter it again to confirm"
- A mismatched confirmation returns to "Choose a 4-digit PIN" with an error
- A matching confirmation signs straight in to the Dashboard
- No PIN value is displayed at any point

**Expected API**: `member_pin_status` on selecting the ninja, then
`set_member_pin` and `verify_member_pin` on a matching confirmation  
**Expected DB**: `members.pin_hash` and `pin_set_at` populated for that member;
an `activity` row reading "<name> set their PIN"  
**LocalStorage**: `currentNinja` only. No PIN is ever written to the browser  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_014a - A PIN Works On Every Device
**Module**: PIN Management  
**Test Scenario**: A PIN set on one device is required on all others  
**Priority**: Critical  
**Preconditions**: Shilpha has completed first-run setup on device A  
**Test Steps**:
1. On a second device or a fresh private window, open the app
2. Select Shilpha
3. Enter a wrong PIN, then the PIN set on device A

**Expected UI**:
- Heading reads "Welcome back, Shilpha" — **not** "Choose a 4-digit PIN". This
  is the regression this test exists for: PINs were once per-browser, so a
  second device offered setup and could claim a ninja who already had a PIN
- The wrong PIN is rejected with "Invalid PIN. Please try again."
- The PIN from device A signs in

**Expected API**: `member_pin_status` returns `has_pin: true` for Shilpha  
**Expected DB**: No changes  
**LocalStorage**: `currentNinja` only  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_015 - Modal Z-Index and Positioning
**Module**: PIN Management  
**Test Scenario**: Verify modal displays properly above all content  
**Priority**: Medium  
**Preconditions**: Settings page with other content visible  
**Test Steps**:
1. Open PIN change modal
2. Verify modal appears above all other content
3. Check modal positioning and centering

**Expected UI**:
- Modal appears in center of screen
- Overlay covers all background content
- Modal is not cut off or positioned incorrectly
- Proper z-index layering

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_016 - Form Validation States
**Module**: PIN Management  
**Test Scenario**: Verify all form validation states work correctly  
**Priority**: High  
**Preconditions**: PIN change modal open  
**Test Steps**:
1. Test empty field validation
2. Test real-time validation
3. Test successful validation state
4. Test error state styling

**Expected UI**:
- Required field indicators
- Real-time validation feedback
- Error state styling (red borders, error text)
- Success state styling (green indicators)
- Clear validation messages

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_017 - Keyboard Navigation in Modal
**Module**: PIN Management  
**Test Scenario**: Navigate PIN change form using keyboard only  
**Priority**: Low  
**Preconditions**: PIN change modal open  
**Test Steps**:
1. Use Tab to move between fields
2. Use Enter to submit form
3. Use Escape to close modal
4. Verify proper focus management

**Expected UI**:
- Tab order follows logical sequence
- Visual focus indicators clear
- Enter submits form from any field
- Escape closes modal
- Focus returns to trigger element

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_018 - Mobile PIN Input Interface
**Module**: PIN Management  
**Test Scenario**: PIN change on mobile devices  
**Priority**: High  
**Preconditions**: Mobile device or mobile emulation  
**Test Steps**:
1. Open PIN change modal on mobile
2. Enter PINs using mobile keyboard
3. Verify mobile-optimized experience

**Expected UI**:
- Mobile-friendly modal size and positioning
- Numeric keyboard appears for PIN fields
- Touch-friendly button sizes
- Proper viewport handling
- No layout issues on small screens

**Expected API**: No API call  
**Expected DB**: No changes  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_019 - Concurrent PIN Changes
**Module**: PIN Management  
**Test Scenario**: Multiple PIN change attempts simultaneously  
**Priority**: Low  
**Preconditions**: Multiple browser tabs with same ninja logged in  
**Test Steps**:
1. Open PIN change modal in multiple tabs
2. Attempt PIN changes in different tabs
3. Verify data consistency

**Expected UI**:
- Consistent behavior across tabs
- No data corruption
- Proper synchronization
- Clear success/failure feedback

**Expected API**: No API call  
**Expected DB**: No changes  
**LocalStorage**: Consistent updates across tabs  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___

---

## TC_PIN_020 - PIN Security Best Practices
**Module**: PIN Management  
**Test Scenario**: Verify PIN security implementation  
**Priority**: High  
**Preconditions**: PIN change functionality available  
**Test Steps**:
1. Inspect browser dev tools during PIN entry
2. Check that no response body carries a PIN or a hash
3. Confirm no PIN is written to `localStorage`
4. Query `members` with the anon key selecting `pin_hash`
5. Test for PIN leakage in browser history

**Expected UI**: No visual changes  
**Expected API**: The PIN appears only in the request body of
`verify_member_pin`/`set_member_pin`, never in a response. A select of
`pin_hash` with the anon key is refused with a permission error  
**Expected DB**: `pin_hash` holds a bcrypt hash (a `$2a$`-prefixed string),
never the digits  
**LocalStorage**: No PIN and no hash. Only `currentNinja`  
**Pass/Fail**: ___  
**Actual Result**: ___  
**Screenshots**: ___  
**Defect ID**: ___