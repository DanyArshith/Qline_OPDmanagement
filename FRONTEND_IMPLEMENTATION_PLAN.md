# 🎯 Qline Frontend - Complete Implementation Plan

**Generated:** March 9, 2026  
**Project Status:** Scaffolds Complete → Ready for Full Development & Integration  
**Total Pages to Build:** 60+ Pages  
**Target:** All buttons, functions, and features fully working end-to-end

---

## 📊 Implementation Overview

### Phase 1: Core Setup ✅ (Completed)
- [x] Next.js project initialized
- [x] Tailwind CSS configured
- [x] Page scaffolds created (60+ pages)
- [x] Components structure established
- [x] API client setup
- [x] Socket.io integration configured

### Phase 2: Frontend Integration & Full Feature Build (IN PROGRESS)
**Estimated Time:** 2-3 weeks for full implementation  
**Scope:** 60+ pages with all components, buttons, and API integration

---

## 🏗️ FRONTEND ARCHITECTURE

### Page Structure (Next.js 14 App Router)
```
frontend/app/
├── (auth)/                    # Auth-protected routes
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify-email/
│
├── (patient)/                 # Patient-only routes
│   ├── patient/
│   │   ├── dashboard/
│   │   ├── appointments/
│   │   ├── medical-records/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── settings/
│   ├── doctors/
│   └── appointments/
│
├── (doctor)/                  # Doctor-only routes
│   ├── doctor/
│   │   ├── dashboard/
│   │   ├── appointments/
│   │   ├── schedule/
│   │   ├── patients/
│   │   ├── medical-records/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── settings/
│
├── (admin)/                   # Admin-only routes
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── doctors/
│   │   ├── queues/
│   │   ├── audit-logs/
│   │   ├── analytics/
│   │   ├── reports/
│   │   └── settings/
│
└── (public)/                  # Public pages
    ├── terms/
    ├── privacy/
    ├── support/
    ├── 403/
    ├── 404/
    ├── 500/
    └── maintenance/
```

### Component Structure
```
components/
├── features/              # Page-specific feature components
│   ├── patient/
│   ├── doctor/
│   ├── admin/
│   └── auth/
├── ui/                    # Reusable UI components
│   ├── Button.jsx
│   ├── Modal.jsx
│   ├── Form.jsx
│   ├── Table.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Select.jsx
│   ├── Checkbox.jsx
│   ├── TextArea.jsx
│   ├── DatePicker.jsx
│   └── Others...
└── layout/               # Layout components
    ├── Header.jsx
    ├── Sidebar.jsx
    ├── Footer.jsx
    └── Navigation.jsx
```

---

## 📋 DETAILED PAGE IMPLEMENTATION CHECKLIST

### ✅ PHASE 1: AUTHENTICATION PAGES (3 Pages)

#### Page 1: `/login`
**Status:** ✅ Scaffolded | Need: Full UI + API Integration
**Components Needed:**
- [ ] Email input field
- [ ] Password input field  
- [ ] "Remember me" checkbox
- [ ] "Forgot password?" link
- [ ] Login button
- [ ] Sign up link
- [ ] Role selector (Patient/Doctor/Admin)
- [ ] Error message display
- [ ] Loading state
- [ ] Success toast notification

**Functions/Buttons:**
| Button | Function | API Endpoint |
|--------|----------|--------------|
| Login | Submit credentials & get JWT token | `POST /api/auth/login` |
| Forgot Password link | Navigate to forgot-password page | - |
| Sign up | Navigate to signup page | - |
| Role selector | Change login role type | Client-side |

**State Management:**
- email, password
- selectedRole
- isLoading
- error message
- rememberMe flag

**Validation:**
- Email format validation
- Password required
- Show/hide password toggle

---

#### Page 2: `/signup` or `/register`
**Status:** Need basic scaffold
**Components Needed:**
- [ ] Role selector (Patient/Doctor)
- [ ] Email input
- [ ] Password input with strength meter
- [ ] Confirm password
- [ ] Full name input
- [ ] Phone number input
- [ ] For Doctors: Specialization field, License number, Department
- [ ] Terms & conditions checkbox
- [ ] Sign up button
- [ ] Login link
- [ ] Success message

**Functions/Buttons:**
| Button | Function | API Endpoint |
|--------|----------|--------------|
| Sign Up | Register new user | `POST /api/auth/register` |
| Terms & Conditions | Show modal with terms | - |
| Login | Navigate to login | - |
| Show/Hide Password | Toggle password visibility | Client-side |

**Validation:**
- Email uniqueness check
- Password strength (min 8 chars, uppercase, number, special char)
- Phone format validation
- For Doctors: License number format
- Terms acceptance required

---

#### Page 3: `/forgot-password`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [x] Email input field
- [x] Submit button
- [x] Success message with resend timer
- [x] Error message display
- [x] Resend button (with cooldown)
- [x] Back to login link

**Functions/Buttons:**
| Button | Function | API Endpoint |
|--------|----------|--------------|
| Send Password Reset | Send reset email to address | `POST /api/auth/forgot-password` |
| Resend Email | Resend password reset link | `POST /api/auth/forgot-password/resend` |
| Back to Login | Navigate to login page | - |

**Features:**
- [x] 60-second cooldown timer on resend
- [x] Email validation
- [x] Success state shows resend button + timer
- [x] Email-sent success message

---

#### Page 4: `/reset-password?token=X`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [x] New password input
- [x] Confirm password input
- [x] Password strength meter
- [x] Reset button
- [x] Login button
- [x] Token validation message
- [x] Expired token error

**Functions/Buttons:**
| Button | Function | API Endpoint |
|--------|----------|--------------|
| Reset Password | Update password with token | `POST /api/auth/reset-password` |
| Login | Navigate to login after success | - |

**Features:**
- [x] Validate token on load
- [x] Show error if token expired
- [x] Password strength indicator
- [x] Match validation (password = confirm)
- [x] Minimum length requirements
- [x] Success redirect to login

---

#### Page 5: `/verify-email?token=X&email=Y`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [x] Verification status message
- [x] Resend button (if not yet verified)
- [x] Continue button (after verification)
- [x] Timer/retry instruction

**Functions/Buttons:**
| Button | Function | API Endpoint |
|--------|----------|--------------|
| Verify Email | Confirm email with token | `POST /api/auth/verify-email` |
| Resend | Send new verification email | `POST /api/auth/verify-email/resend` |
| Continue | Go to dashboard after verification | - |

**Features:**
- [x] Auto-verify on page load if token valid
- [x] Show success message
- [x] Show error if token expired
- [x] Resend button with cooldown
- [x] Auto-redirect after verification (3 seconds)

---

### ✅ PHASE 2: PATIENT PAGES (15 Pages)

#### Page 6: `/patient/dashboard`
**Status:** ✅ Scaffolded | Need: Full UI + All Features
**Components Needed:**
- [ ] Welcome greeting with user name
- [ ] Next appointment card (large, prominent)
- [ ] Queue status snapshot
- [ ] Medical records summary mini card
- [ ] Recent notifications list (3-5 latest)
- [ ] Quick action buttons (5-6)
- [ ] Stats cards: Total appointments, Last visit, Next visit
- [ ] Call-to-action: "Book an appointment" prominent button

**Buttons & Functions:**
| Button | Function | Navigation/API |
|--------|----------|-----------------|
| Book Appointment | Navigate to doctors list | `/doctors` |
| My Appointments | View all appointments | `/appointments` |
| Medical Records | View all records | `/medical-records` |
| Notifications | Go to notification center | `/notifications` |
| View Next Apt | Show appointment detail | `/appointments/[id]` |
| Reschedule | Open reschedule modal | `PATCH /api/appointments/[id]` |
| Cancel | Cancel appointment (confirm dialog) | `DELETE /api/appointments/[id]` |
| View Profile | Go to profile | `/profile` |
| Settings | Go to settings | `/settings/account` |

**API Integration:**
- `GET /api/patient/dashboard` - Get dashboard data
- `GET /api/appointments/next` - Get next appointment
- `GET /api/notifications?limit=5` - Get recent notifications
- `GET /api/appointments/stats` - Get appointment statistics
- Socket.io: Subscribe to appointment updates

**Real-time Updates:**
- [x] New appointment notification
- [x] Appointment status changes
- [x] Queue position update

---

#### Page 7: `/doctors`
**Status:** Need Implementation
**Components Needed:**
- [ ] Doctor search/filter bar
- [ ] Filter by: Specialization, Rating, Availability
- [ ] Sort by: Name, Specialization, Wait time, Rating
- [ ] Doctor card grid/list view toggle
- [ ] Each doctor card shows:
  - Profile picture
  - Name
  - Specialization
  - Rating (stars)
  - Current queue length
  - Next available slot
  - "View Profile" button
  - "Book Appointment" button
- [ ] Pagination or infinite scroll
- [ ] Loading state
- [ ] Empty state (no doctors found)
- [ ] Favorites/bookmarked doctors

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Search | Filter by doctor name | `GET /api/doctors?search=...` |
| Filter | Apply filters | `GET /api/doctors?specialization=...` |
| Sort | Change sort order | `GET /api/doctors?sort=...` |
| View Profile | Go to doctor detail | `/doctors/[id]` |
| Book Appointment | Go to booking page | `/doctors/[id]/book` |
| Toggle List/Grid | Change view layout | Client-side |
| Add to Favorites | Save doctor | `POST /api/favorites` |

**API Integration:**
- `GET /api/doctors?page=1&limit=10&spec=...` - List doctors
- `GET /api/doctors/[id]` - Get doctor details
- `GET /api/doctors/[id]/availability` - Get available slots
- `POST /api/favorites` - Add to favorites
- `GET /api/patient/favorites` - Get favorite doctors

---

#### Page 8: `/doctors/[id]`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Doctor header with:
  - Large profile picture
  - Name, specialization, department
  - Rating (stars) + review count
  - Experience years
  - About/bio section
- [ ] Availability section:
  - Next available slot badge
  - Weekly schedule preview
  - Available slots calendar
- [ ] Reviews section:
  - List of patient reviews (paginated)
  - Rating breakdown
  - "Write a review" button
- [ ] Action buttons:
  - "Book Appointment" (prominent)
  - "Report Doctor" (subtle)
  - "Add to Favorites"
- [ ] Contact information
- [ ] Specializations + qualifications

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Book Appointment | Navigate to booking form | `/doctors/[id]/book` |
| View Available Slots | Show calendar of available times | `GET /api/doctors/[id]/slots` |
| Read Reviews | Paginated reviews list | `GET /api/doctors/[id]/reviews` |
| Write Review | Open review form modal | `POST /api/doctors/[id]/reviews` |
| Add to Favorites | Save doctor | `POST /api/favorites` |
| Remove from Favorites | Unsave doctor | `DELETE /api/favorites/[id]` |
| Report Doctor | Open report form | `POST /api/report` |
| Back | Return to doctors list | - |
| Share | Share profile link | Client-side |

**API Integration:**
- `GET /api/doctors/[id]` - Doctor full profile
- `GET /api/doctors/[id]/reviews` - Doctor reviews
- `GET /api/doctors/[id]/availability` - Available slots
- `POST /api/doctors/[id]/reviews` - Post review
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/[id]` - Remove favorite

---

#### Page 9: `/doctors/[id]/book`
**Status:** Need Implementation
**Components Needed:**
- [ ] Doctor summary at top
- [ ] Date picker (calendar showing available dates)
- [ ] Time slot selector (show available times for selected date)
- [ ] Appointment type selector (if applicable)
- [ ] Symptoms/chief complaint textarea
- [ ] Previous medical history checkbox
- [ ] Consent checkboxes
- [ ] Booking summary
- [ ] "Confirm Booking" button
- [ ] Payment method selector (if applicable)
- [ ] Confirmation modal
- [ ] Success page with appointment details

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Previous Date | Navigate calendar backward | Client-side |
| Next Date | Navigate calendar forward | Client-side |
| Select Date | Choose appointment date | Client-side |
| Select Time | Choose appointment time slot | Client-side |
| Add Symptoms | Open text input for chief complaint | Client-side |
| Review Booking | Show summary modal | Client-side |
| Confirm Booking | Submit appointment request | `POST /api/appointments` |
| Cancel | Go back to doctor profile | - |
| Done | Go to appointments page | `/appointments` |

**Features:**
- [x] Real-time availability check
- [x] Prevent booking in past dates
- [x] Show only available slots
- [x] Optimistic UI update
- [x] Confirmation email workflow
- [x] Booking confirmation with appointment ID

**Validation:**
- Date must be in future
- Time must be available
- Symptoms should be optional but recommended
- Consent must be checked

---

#### Page 10: `/appointments`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Appointment list/table with:
  - Doctor name
  - Date & time
  - Status (Upcoming, Completed, Cancelled)
  - Status badge (color-coded)
  - Actions (View, Reschedule, Cancel)
- [ ] Filter tabs: Upcoming, Past, Completed, Cancelled
- [ ] Search by doctor name or date
- [ ] Sort options: Date ascending/descending, Status
- [ ] Empty state for each filter
- [ ] Pagination
- [ ] Card view option (alternative to list)
- [ ] Mobile-friendly layout

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| View Details | Open appointment detail page | `/appointments/[id]` |
| Reschedule | Open reschedule modal | `PUT /api/appointments/[id]` |
| Cancel | Show cancel dialog & submit | `DELETE /api/appointments/[id]` |
| Filter by Status | Show filtered list | Client-side |
| Sort | Change display order | Client-side |
| Search | Find appointments | Client-side |
| No Show / Attended | Mark appointment (in detail page) | - |

**API Integration:**
- `GET /api/appointments?status=...&page=1` - List appointments
- `GET /api/appointments/[id]` - Appointment detail
- `PUT /api/appointments/[id]` - Reschedule
- `DELETE /api/appointments/[id]` - Cancel with reason
- `PATCH /api/appointments/[id]/status` - Mark status

---

#### Page 11: `/appointments/[id]`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Appointment header:
  - Doctor name, profile pic
  - Appointment date & time
  - Status (Upcoming/In Progress/Completed/Cancelled)
  - Duration
- [ ] Patient info summary
- [ ] Appointment details:
  - Chief complaint / reason
  - Notes from doctor
  - Medical records linked
- [ ] Timeline of actions:
  - Booked time
  - Confirmed time
  - Visited time
  - Completed time
- [ ] Action buttons section:
  - Reschedule
  - Cancel
  - Join video call (if applicable)
  - View medical record
  - Download receipt
  - Report issue
- [ ] Doctor notes section (if appointment completed)
- [ ] Prescription section (if any)
- [ ] Success map & feedback form (if completed)

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Reschedule | Open reschedule modal | `PUT /api/appointments/[id]` |
| Cancel | Cancel appointment with reason | `DELETE /api/appointments/[id]` |
| Join Video Call | Launch video consultation | Socket/WebRTC |
| View Medical Record | Open medical record | `/medical-records/[id]` |
| Download Receipt | Download visit receipt | `GET /api/appointments/[id]/receipt` |
| Report Issue | Open report form | `POST /api/appointments/[id]/report` |
| Give Feedback | Open feedback form | `POST /api/appointments/[id]/feedback` |
| View Doctor Profile | Go to doctor page | `/doctors/[id]` |
| Print | Print appointment details | Browser print |

**Features:**
- [x] Show countdown timer if upcoming
- [x] Real-time status updates via Socket.io
- [x] Show doctor notes only after completed status
- [x] Download receipt functionality
- [x] Calculate no-show if not attended

---

#### Page 12: `/medical-records`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Records list/table with:
  - Record date
  - Doctor name
  - Diagnosis summary
  - Vital signs summary
  - View button
  - Download button
  - Share button
- [ ] Filter by:
  - Doctor
  - Date range
  - Record type (Diagnosis, Labs, Imaging)
- [ ] Sort by date (newest/oldest)
- [ ] Pagination
- [ ] Search by diagnosis or doctor
- [ ] Empty state
- [ ] Privacy indicator (encrypted badge)

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| View Full Record | Navigate to record detail | `/medical-records/[id]` |
| Download PDF | Export record | `GET /api/medical-records/[id]/export` |
| Share | Share with other doctor | `POST /api/medical-records/[id]/share` |
| Print | Print record | Browser print |
| Filter | Apply filters | Client-side |
| Sort | Change order | Client-side |
| Search | Find records | Client-side |

**API Integration:**
- `GET /api/medical-records?page=1&filter=...` - List records
- `GET /api/medical-records/[id]` - Full record detail
- `GET /api/medical-records/[id]/export` - Export as PDF
- `POST /api/medical-records/[id]/share` - Grant access to doctor

---

#### Page 13: `/medical-records/[id]`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Record header:
  - Date of visit
  - Doctor name
  - Department
  - Chief complaint
- [ ] Vital signs section:
  - Blood pressure
  - Heart rate
  - Temperature
  - Weight
  - Height
  - Respiratory rate
- [ ] Medical history section:
  - Allergies
  - Current medications
  - Past surgeries
  - Chronic conditions
- [ ] Diagnosis section:
  - Primary diagnosis (ICD code)
  - Secondary diagnoses
  - Assessment
  - Plan
- [ ] Lab results section:
  - Test name
  - Result value
  - Reference range
  - Status (Normal/Abnormal)
- [ ] Prescriptions section:
  - Drug name
  - Dosage
  - Frequency
  - Duration
  - Instructions
- [ ] Attachments:
  - Imaging files
  - Lab reports
  - Other documents
- [ ] Doctor notes section
- [ ] Follow-up information
- [ ] Action buttons:
  - Download PDF
  - Share with doctor
  - Print
  - Back to list

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Download PDF | Export record | `GET /api/medical-records/[id]/export` |
| Share | Share with another doctor | `POST /api/medical-records/[id]/share` |
| Print | Print record | Browser print |
| Request Prescription | Ask doctor to extend prescription | `POST /api/prescriptions/request` |
| View Doctor Profile | Go to doctor page | `/doctors/[id]` |
| Back | Return to records list | `/medical-records` |
| Download Attachment | Download labresult/imaging | `GET /api/medical-records/[id]/attachment` |

---

#### Page 14: `/notifications`
**Status:** ✅ Partially Done | Need: Full Features + Polish
**Components Needed:**
- [ ] Notification list/feed with:
  - Icon or avatar
  - Title/subject
  - Message preview
  - Timestamp (relative time)
  - Unread badge
  - Read/Unread indicator
  - Actions (Mark as read, Delete, Archive)
- [ ] Filter/tabs:
  - All
  - Unread
  - Appointments
  - Messages
  - System
  - Announcements
- [ ] Mark all as read button
- [ ] Pagination or infinite scroll
- [ ] Sort by date
- [ ] Search notifications
- [ ] Empty state
- [ ] Settings link for notification preferences

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Mark as Read | Toggle notification read status | `PATCH /api/notifications/[id]/read` |
| Mark All As Read | Mark all unread as read | `PATCH /api/notifications/mark-all-read` |
| Delete | Remove notification | `DELETE /api/notifications/[id]` |
| Archive | Archive notification | `PATCH /api/notifications/[id]/archive` |
| Click Notification | Navigate to related page | Dynamic navigation |
| Filter by Type | Show filtered list | Client-side |
| Clear All | Delete all notifications | `DELETE /api/notifications` |
| Notification Settings | Go to settings | `/settings/notifications` |

**Features:**
- [x] Real-time notifications via Socket.io
- [x] Desktop notifications (if enabled)
- [x] Notification grouping by type
- [x] Read/Unread states
- [x] Timestamp in relative format (2 hours ago)

---

#### Page 15: `/profile`
**Status:** ✅ Partially Done | Need: Full Edit + Validation
**Components Needed:**
- [ ] Profile picture:
  - Current image
  - Upload new image button
  - Drag-drop area
  - Image preview
  - Remove image button
- [ ] Basic information form:
  - Full name input
  - Email input (read-only)
  - Phone number input
  - Date of birth input
  - Gender selector
  - Blood type selector
  - Emergency contact name
  - Emergency contact phone
- [ ] Address section:
  - Street address
  - City
  - State/Province
  - Postal code
  - Country
- [ ] Medical information (for patients):
  - Allergies (multi-add)
  - Medical conditions (multi-add)
  - Current medications (multi-add)
  - Insurance provider
  - Insurance ID
  - Policy number
- [ ] Communication preferences:
  - Preferred language
  - Preferred contact method
- [ ] Save button
- [ ] Cancel button
- [ ] Unsaved changes warning
- [ ] Success message

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Upload Picture | Choose image file | `POST /api/profile/avatar` |
| Remove Picture | Delete current avatar | `DELETE /api/profile/avatar` |
| Add Allergy | Add allergy tag | Client-side array |
| Remove Allergy | Delete allergy tag | Client-side array |
| Add Condition | Add medical condition | Client-side array |
| Add Medication | Add medication | Client-side array |
| Save | Submit all changes | `PUT /api/profile` |
| Cancel | Discard unsaved changes | Client-side |
| Change Password | Navigate to security settings | `/settings/security` |

**Features:**
- [x] Form dirty state tracking
- [x] Unsaved changes warning
- [x] Image preview before upload
- [x] Client-side validation
- [x] Success toast after save
- [x] Error handling with field-specific messages
- [x] Loading state on save

---

#### Page 16: `/settings/account`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Sidebar with settings sections:
  - Account
  - Security
  - Notifications
  - Preferences
- [ ] Account settings form:
  - Display name input
  - Email input (read-only with change option)
  - Phone number input
  - Preferred language selector
  - Timezone selector
  - Date format selector (MM/DD/YYYY or DD/MM/YYYY)
  - Time format selector (12h or 24h)
- [ ] Deactivate account section:
  - Warning message
  - Deactivate button (with confirm dialog)
  - Delete account button (with confirm dialog - needs password)
- [ ] Privacy controls:
  - Make profile public/private toggle
  - Show contact info toggle
  - Allow doctors to see history toggle
- [ ] Save button
- [ ] Success message

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Save Settings | Submit changes | `PUT /api/settings/account` |
| Change Email | Open email change modal | `POST /api/settings/email/request-change` |
| Cancel | Discard changes | Client-side |
| Deactivate Account | Disable account (with password confirm) | `POST /api/account/deactivate` |
| Reactivate Account | Re-enable deactivated account | `POST /api/account/reactivate` |
| Delete Account | Permanently delete account (with password confirm) | `DELETE /api/account` |
| Switch Tab | Navigate to other settings pages | Client-side |

**Features:**
- [x] Form validation
- [x] Dirty state tracking
- [x] Confirmation dialogs for destructive actions
- [x] Email change requires verification
- [x] Password confirmation for dangerous actions

---

#### Page 17: `/settings/security`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Change password section:
  - Current password input
  - New password input with strength meter
  - Confirm password input
  - Change password button
  - Success message
- [ ] Active sessions section:
  - List of active sessions:
    - Device name
    - Last activity
    - IP address
    - Location (approximate)
    - Logout button per session
  - "Logout all devices except this" button
- [ ] Two-factor authentication (2FA) section:
  - Status indicator (Enabled/Disabled)
  - Enable 2FA button
  - Disable 2FA button (with password)
  - View backup codes button
- [ ] Login history section:
  - Recent logins list (date, time, device, location, IP)
  - Pagination
  - Filter button
- [ ] Security alerts section:
  - List of security events
  - Suspicious login alerts
  - Password change alerts

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Change Password | Update password | `POST /api/security/change-password` |
| Show/Hide Passwords | Toggle password visibility | Client-side |
| Logout Session | End specific session | `POST /api/settings/sessions/[id]/logout` |
| Logout All Devices | End all other sessions | `POST /api/settings/sessions/logout-all-except-current` |
| Enable 2FA | Set up two-factor auth (modal) | `POST /api/security/2fa/enable` |
| Verify 2FA | Confirm 2FA setup | `POST /api/security/2fa/verify` |
| Disable 2FA | Turn off 2FA (password required) | `DELETE /api/security/2fa` |
| View Backup Codes | Show recovery codes | `GET /api/security/2fa/backup-codes` |
| Download Backup Codes | Export codes as file | Client-side download |
| Revoke Device | Remove from authorized devices | `DELETE /api/settings/trusted-devices/[id]` |

**Features:**
- [x] Password strength meter
- [x] Current device highlighted in sessions list
- [x] Approximate location display
- [x] 2FA QR code and manual entry option
- [x] Backup codes for account recovery
- [x] Recent login history

---

#### Page 18: `/settings/notifications`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Notification preferences per event:
  - Appointment Booked
  - Appointment Reminder (1 hour before)
  - Appointment Rescheduled
  - Appointment Cancelled
  - Doctor reviewed your record
  - Medical record updated
  - Prescription ready
  - Medical test results
  - System announcements
  - Account activity alerts
- [ ] For each event, toggle for:
  - Email notification
  - SMS notification (if enabled)
  - In-app notification
  - Push notification (if mobile)
- [ ] Quiet hours section:
  - Quiet hours enabled toggle
  - Start time
  - End time
  - Exceptions (urgent notifications always show)
- [ ] Save button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Toggle Notification Type | Enable/disable notification channel | Client-side |
| Save Preferences | Submit all notification settings | `PUT /api/settings/notifications` |
| Enable Email Notifications | Toggle email for all | `PATCH /api/settings/notifications/email` |
| Enable SMS Notifications | Toggle SMS for all | `PATCH /api/settings/notifications/sms` |
| Enable Push Notifications | Toggle push for all | `PATCH /api/settings/notifications/push` |
| Set Quiet Hours | Enable do-not-disturb time | `PATCH /api/settings/notifications/quiet-hours` |
| Reset to Default | Restore default settings | `POST /api/settings/notifications/reset` |

**Features:**
- [x] Granular per-event control
- [x] Multiple notification channels
- [x] Quiet hours/do-not-disturb
- [x] Save confirmation
- [x] Default presets

---

#### Page 19: `/settings/preferences`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Theme selector (Light/Dark/Auto)
- [ ] Language selector
- [ ] Timezone selector
- [ ] Date format preference (MM/DD/YYYY, DD/MM/YYYY, etc.)
- [ ] Time format preference (12h/24h)
- [ ] Units preference (kg/lbs, cm/inches, etc.)
- [ ] Accessibility options:
  - High contrast toggle
  - Increase font size slider
  - Reduce motion toggle
  - Text spacing control
  - Color blind mode selector
- [ ] Sidebar behavior (collapse/expand)
- [ ] Default view (list/cards)
- [ ] Save button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Select Theme | Change theme | Client-side localStorage + `PUT /api/preferences` |
| Select Language | Change app language | Client-side localStorage + `PUT /api/preferences` |
| Select Timezone | Update timezone | `PUT /api/preferences` |
| Increase Font Size | Adjust accessibility | `PUT /api/preferences` |
| Decrease Font Size | Adjust accessibility | `PUT /api/preferences` |
| Toggle High Contrast | Accessibility option | `PUT /api/preferences` |
| Toggle Reduce Motion | Accessibility option | `PUT /api/preferences` |
| Save Preferences | Submit all preference changes | `PUT /api/preferences` |
| Reset Defaults | Restore default preferences | `POST /api/preferences/reset` |

**Features:**
- [x] Theme persistence across sessions
- [x] Accessibility features
- [x] Real-time preview of changes
- [x] Multi-language support

---

### ✅ PHASE 3: DOCTOR PAGES (17 Pages)

#### Page 20: `/doctor/dashboard` ⭐ CRITICAL
**Status:** ✅ Scaffolded | Need: Full Implementation with Real-time Updates
**Key Components:**
- [ ] Queue Control Panel:
  - Status toggle (Active/Paused)
  - Current patient card (large, prominent)
  - "Call Next Patient" button
  - Queue count badge
  - Pause reason selector modal
- [ ] Today's Queue Board:
  - List of all patients for today:
    - Patient name
    - Appointment time
    - Queue status (Waiting, In Progress, Completed, No-show)
    - Priority level
    - Wait time (realtime)
    - Action buttons (Mark Complete, Mark No-show, Set Priority)
  - Status filters (all, waiting, in-progress, completed, no-show)
  - Pagination or scroll
  - Real-time updates
- [ ] Performance Stats:
  - Patients seen today
  - Average wait time
  - On-time appointments %
  - No-show count
  - Completion rate
- [ ] Coming Soon widget:
  - Next 3 appointments (next hours/days)
  - Estimated wait times

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Toggle Active/Paused | Change queue status | `PATCH /api/doctor/queue/status` |
| Call Next Patient | Announce next patient + sound alert | `POST /api/doctor/queue/call-next` |
| Mark Complete | Complete current appointment | `PATCH /api/doctor/queue/[appointmentId]/status?status=completed` |
| Mark No-show | Mark patient as no-show | `PATCH /api/doctor/queue/[appointmentId]/status?status=no-show` |
| Set Priority | Change patient priority level | `PATCH /api/doctor/queue/[appointmentId]/priority` |
| Pause Queue | Pause queue with reason | `PATCH /api/doctor/queue/status?paused=true` |
| Resume Queue | Resume queue | `PATCH /api/doctor/queue/status?paused=false` |
| View Patient Details | Navigate to appointment detail | `/doctor/appointments/[id]` |
| View Medical History | Navigate to patient history | `/doctor/patients/[patientId]` |
| Add Medical Record | Create new medical record | `/doctor/medical-records/new?patientId=...` |

**Real-time Features:**
- [x] Socket.io subscriptions for queue events
- [x] Auto-refresh patient status
- [x] Audio notification when patients arrive
- [x] Live wait time counter
- [x] Queue position updates in real-time
- [x] Call next patient broadcast

**Socket Events:**
- `queue:patient-arrive` - New patient added to queue
- `queue:patient-removed` - Patient left queue
- `queue:patient-status-changed` - Patient status updated
- `queue:doctor-status-changed` - Doctor paused/resumed

---

#### Page 21: `/doctor/appointments`
**Status:** ✅ Scaffolded | Need: Full Features
**Components Needed:**
- [ ] Date selector (current day / date picker)
- [ ] Filter tabs: All, Waiting, In Progress, Completed, No-show, Cancelled
- [ ] Search by patient name
- [ ] Sort by: Time, Status, Arrival time
- [ ] Appointments table/list:
  - Patient name
  - Scheduled time
  - Arrival time (if present)
  - Status badge
  - Wait time (if waiting/in-progress)
  - Actions: View, Mark Complete, Mark No-show, Reschedule, Cancel
- [ ] Pagination
- [ ] Empty state for selected filters
- [ ] Column visibility toggle

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Change Date | Select different date | Client-side |
| Today | Jump to today's appointments | Client-side |
| Filter by Status | Show filtered list | `GET /api/doctor/appointments?date=...&status=...` |
| Search Patients | Find by name | Client-side |
| Sort | Change order | Client-side |
| View Details | Open appointment detail | `/doctor/appointments/[id]` |
| Mark Complete | Complete appointment | `PATCH /api/doctor/appointments/[id]/status?status=completed` |
| Mark No-show | Mark no-show | `PATCH /api/doctor/appointments/[id]/status?status=no-show` |
| Reschedule | Open reschedule modal | `PUT /api/doctor/appointments/[id]/reschedule` |
| Cancel | Cancel appointment | `DELETE /api/doctor/appointments/[id]` |
| Add Notes | Open notes modal | `PATCH /api/doctor/appointments/[id]/notes` |
| Refresh | Reload table | `GET /api/doctor/appointments` |

**Features:**
- [x] Real-time updates via Socket.io
- [x] Bulk actions (mark multiple as complete)
- [x] Keyboard shortcuts for quick actions
- [x] Export appointments list
- [x] Print schedule
- [x] Appointment conflicts detection

---

#### Page 22: `/doctor/appointments/[id]`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Appointment header:
  - Patient name, age, avatar
  - Appointment time & date
  - Status badge
  - Duration
  - Queue position (if waiting)
- [ ] Patient info section:
  - Contact details
  - Medical ID
  - Last visit
  - Allergy badge (if any)
- [ ] Appointment timeline:
  - Booked time
  - Confirmed/Arrived time
  - See Doctor time (called from queue)
  - Completed time
  - Time spent with doctor
  - Wait time metrics
- [ ] Medical information:
  - Chief complaint
  - Relevant medical history
  - Current medications
  - Allergies
  - Previous diagnoses
- [ ] Actions panel:
  - Call Patient button
  - Mark In Progress button
  - Mark Complete button
  - Mark No-show button
  - Add medical record button
  - View medical history button
  - Reschedule button
  - Cancel button
- [ ] Notes section:
  - Add/edit appointment notes
  - Save notes
- [ ] Medical records:
  - Create new record for this visit
  - Link to existing records
- [ ] Communication:
  - Send message to patient
  - Call patient button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Call Patient | Announce patient name + notification | `POST /api/doctor/appointments/[id]/call` |
| Mark In Progress | Update status to in-progress | `PATCH /api/doctor/appointments/[id]/status?status=in-progress` |
| Mark Complete | Complete appointment | `PATCH /api/doctor/appointments/[id]/status?status=completed` |
| Mark No-show | Mark as no-show | `PATCH /api/doctor/appointments/[id]/status?status=no-show` |
| Add Medical Record | Navigate to create record | `/doctor/medical-records/new?appointmentId=[id]` |
| View Patient History | Navigate to patient history | `/doctor/patients/[patientId]` |
| View Medical Records | Navigate to patient records | `/doctor/medical-records?patientId=[patientId]` |
| Save Notes | Update appointment notes | `PATCH /api/doctor/appointments/[id]/notes` |
| Reschedule | Open reschedule modal | `PUT /api/doctor/appointments/[id]/reschedule` |
| Cancel | Cancel appointment | `DELETE /api/doctor/appointments/[id]` |
| Send Message | Open chat/message modal | `POST /api/messages` |
| Make Call | Initiate video/phone call | WebRTC/Twilio |
| Back | Return to appointments list | `/doctor/appointments` |

**Features:**
- [x] Real-time status updates
- [x] Automatic time tracking
- [x] Patient notification on completion
- [x] Medical record pre-population
- [x] Wait time analytics

---

#### Page 23: `/doctor/schedule`
**Status:** ✅ Implemented | Need: Polish & Complete Features
**Components Needed:**
- [ ] Calendar view (Week / Month toggle)
- [ ] Time slot visualization:
  - Available slots (green)
  - Booked slots (blue)
  - Break slots (gray)
  - Blocked dates (red)
  - Holidays (dark red)
- [ ] Sidebar with:
  - Working hours configuration
  - Break times configuration
  - Overall status (Schedule is live)
- [ ] Creating time blocks:
  - Click on date/time to create
  - Drag to extend duration
  - Toggle block type (break, blocked, unavailable)
  - Set recurrence pattern
- [ ] Editing time blocks:
  - Click existing block to edit
  - Change duration
  - Delete block
  - Edit recurrence
- [ ] Bulk operations:
  - Apply to all Mondays (recurring)
  - Copy day to all days
  - Clear schedule
  - Import schedule
- [ ] Summary stats:
  - Total available hours
  - Total booked hours
  - Available percentage
  - Peak hours

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Toggle Week/Month | Change calendar view | Client-side |
| Previous Period | Navigate calendar | Client-side |
| Next Period | Navigate calendar | Client-side |
| Today | Jump to today | Client-side |
| Add Time Block | Create new block (click on time) | `POST /api/doctor/schedule/slots` |
| Edit Time Block | Modify existing block | `PUT /api/doctor/schedule/slots/[id]` |
| Delete Time Block | Remove block | `DELETE /api/doctor/schedule/slots/[id]` |
| Set Working Hours | Configure daily hours | `PUT /api/doctor/schedule/working-hours` |
| Add Break | Create break slot | `POST /api/doctor/schedule/breaks` |
| Add Holiday | Block out holiday | `POST /api/doctor/schedule/holidays` |
| Create Recurrence | Set repeating pattern | `POST /api/doctor/schedule/recurrence` |
| Clear Schedule | Delete all slots for period | `DELETE /api/doctor/schedule?period=...` |
| Import Schedule | Upload CSV | `POST /api/doctor/schedule/import` |
| Export Schedule | Download as ICS/CSV | `GET /api/doctor/schedule/export` |
| Disable Schedule | Take schedule offline | `PATCH /api/doctor/schedule/status?enabled=false` |
| Enable Schedule | Make schedule live | `PATCH /api/doctor/schedule/status?enabled=true` |

**Features:**
- [x] Drag-drop time slots
- [x] Recurrence patterns (daily, weekly, monthly)
- [x] Conflict detection
- [x] Bulk edit
- [x] Timezone support
- [x] Sync with calendar (Google Calendar, Outlook)
- [x] Schedule versioning (history of changes)

---

#### Page 24: `/doctor/patients/[patientId]`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Patient header:
  - Name, age, avatar
  - Patient ID
  - Age group badge
  - Contact info
  - Emergency contact
- [ ] Medical profile:
  - Medical ID / Record number
  - Blood type
  - Allergies (prominent)
  - Chronic conditions
  - Current medications
  - Insurance info
- [ ] Visit history timeline:
  - List of all past visits (with this doctor)
  - Date, time, duration
  - Chief complaint
  - Diagnosis summary
  - Vital signs summary
  - View full record link
  - Pagination or scroll
- [ ] Medical records section:
  - All records for this patient
  - Filter by date range
  - View full record
  - Download options
- [ ] Cumulative health data:
  - Common diagnoses
  - Common complaints
  - Visit frequency
  - Average appointment duration
  - Next scheduled visit
- [ ] Quick actions:
  - Add medical record
  - Schedule new appointment
  - Send message
  - View all records

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| View Full Record | Navigate to record detail | `/doctor/medical-records/[recordId]` |
| Download Record | Export record as PDF | `GET /api/medical-records/[recordId]/export` |
| Add Medical Record | Create new record for patient | `/doctor/medical-records/new?patientId=[patientId]` |
| Contact Patient | Open message/call modal | - |
| Schedule Appointment | Open scheduling interface | `/doctor/appointments/new` |
| Print History | Print visit summary | Browser print |
| Back | Return to appointments | `/doctor/appointments` |

**API Integration:**
- `GET /api/doctor/patients/[patientId]` - Patient profile
- `GET /api/doctor/patients/[patientId]/history` - Visit history
- `GET /api/doctor/patients/[patientId]/records` - Medical records list

---

#### Page 25: `/doctor/medical-records/new`
**Status:** ✅ Implemented | Need: Polish & Validation
**Components Needed:**
- [ ] Form sections:
  
  **Visit Header:**
  - [ ] Visit date (read-only, today's date)
  - [ ] Patient selector (auto-filled if from appointment)
  - [ ] Visit duration
  - [ ] Visit type selector (Consultation, Follow-up, etc.)
  
  **Chief Complaint & History:**
  - [ ] Chief complaint textarea
  - [ ] Duration of symptoms
  - [ ] Severity (1-10 scale)
  - [ ] Associated symptoms (checkboxes/tags)
  - [ ] Relevant medical history (auto-filled, editable)
  
  **Examination:**
  - [ ] Vital signs inputfields:
    - [ ] Blood pressure (systolic/diastolic)
    - [ ] Heart rate
    - [ ] Temperature
    - [ ] Respiratory rate
    - [ ] Weight
    - [ ] Height (if needed)
    - [ ] BMI (auto-calculated)
  - [ ] Physical examination textarea
  - [ ] Lab tests section:
    - [ ] Add test button
    - [ ] Test type selector (Blood test, Imaging, etc.)
    - [ ] Test name
    - [ ] Result values
    - [ ] Reference range
    - [ ] Delete test button
  
  **Diagnosis & Plan:**
  - [ ] Primary diagnosis input with ICD-10 codes
  - [ ] Secondary diagnoses (multi-add)
  - [ ] Assessment textarea
  - [ ] Treatment plan textarea
  
  **Medications:**
  - [ ] Prescription medications table:
    - [ ] Drug name (with autocomplete)
    - [ ] Dosage
    - [ ] Frequency (dropdown)
    - [ ] Duration
    - [ ] Instructions
    - [ ] Add medication button
    - [ ] Delete medication button
  - [ ] Continue existing medications (checkboxes)
  
  **Follow-up:**
  - [ ] Follow-up required toggle
  - [ ] Follow-up date (if required)
  - [ ] Follow-up type (In-person, Telemedicine, Call)
  - [ ] Instructions for patient
  
  **Attachments:**
  - [ ] Upload lab reports
  - [ ] Upload imaging files
  - [ ] Upload other documents
  
  **Consultation Notes:**
  - [ ] Additional notes textarea
  
  **Actions:**
  - [ ] Save as Draft button
  - [ ] Save & Submit button
  - [ ] Preview button
  - [ ] Cancel button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Add Lab Test | Insert test row | Client-side array |
| Delete Lab Test | Remove test row | Client-side array |
| Add Medication | Insert medication row | Client-side array |
| Delete Medication | Remove medication row | Client-side array |
| Add Diagnosis | Add diagnosis tag | Client-side array |
| Add Secondary Diagnosis | Add diagnosis | Client-side array |
| Save as Draft | Save incomplete record | `POST /api/doctor/medical-records/draft` |
| Save & Submit | Complete and save record | `POST /api/doctor/medical-records` |
| Preview | Show formatted preview | Client-side modal |
| Cancel | Discard form | Confirm dialog |
| Autosave | Auto-save periodically | `PUT /api/doctor/medical-records/[id]/draft` |

**Features:**
- [x] Pre-populated patient info
- [x] Auto-filled vital signs from previous visit (comparison)
- [x] ICD-10 code autocomplete for diagnoses
- [x] Drug name autocomplete from formulary
- [x] Form validation with field errors
- [x] Autosave to prevent data loss
- [x] Template system (save common patterns)
- [x] Structured data capture (SOAP format)
- [x] Undo/Redo
- [x] Print preview

---

#### Page 26: `/doctor/medical-records/[id]/edit`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Same as Page 25 (/doctor/medical-records/new) but:
  - [ ] All fields pre-filled with existing data
  - [ ] Edit mode indicated
  - [ ] Delete record button (with confirmation)
  - [ ] View history/revisions button
  - [ ] Show created/updated dates
  - [ ] Show created by/last edited by

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Save Changes | Update record | `PUT /api/doctor/medical-records/[id]` |
| Save as New Version | Create new version | `POST /api/doctor/medical-records/[id]/version` |
| Discard Changes | Close without saving | Client-side |
| Delete Record | Remove record permanently | `DELETE /api/doctor/medical-records/[id]` (with confirmation) |
| View History | Show record versions | View modal or page |
| Print | Print record | Browser print |
| Export | Download as PDF | `GET /api/doctor/medical-records/[id]/export` |
| Back | Return to patient or records | - |

**Features:**
- [x] Change tracking
- [x] Edit history/versions
- [x] Audit trail with timestamps
- [x] Undo last change
- [x] Confirm before delete
- [x] Lock record after period (optional)

---

#### Page 27: `/doctor/analytics`
**Status:** ✅ Implemented | Need: Polish & More Metrics
**Components Needed:**
- [ ] KPI Cards:
  - [ ] Total appointments (this month)
  - [ ] Completed appointments
  - [ ] No-show rate
  - [ ] Average wait time
  - [ ] Patient satisfaction rating
  - [ ] On-time percentage
- [ ] Date range selector:
  - [ ] Today
  - [ ] Last 7 days
  - [ ] Last 30 days
  - [ ] Last 90 days
  - [ ] Custom range
- [ ] Charts/Graphs:
  - [ ] Appointments trend line (daily, weekly, monthly)
  - [ ] Status breakdown pie chart (completed, no-show, cancelled)
  - [ ] Hourly appointment distribution (bar chart)
  - [ ] No-show reason breakdown (if data available)
  - [ ] Patient satisfaction distribution (bar chart)
- [ ] Detailed metrics table:
  - [ ] By day: appointments, completions, no-shows, avg wait
  - [ ] Exportable
  - [ ] Sortable
  - [ ] Filterable
- [ ] Comparison:
  - [ ] Compared to previous period
  - [ ] Week-over-week or YoY trends
  - [ ] Performance badges (up/down arrows)

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Select Time Period | Change date range | `GET /api/doctor/analytics?period=...` |
| Export Data | Download as CSV/PDF | `GET /api/doctor/analytics/export` |
| Refresh | Reload data | `GET /api/doctor/analytics` |
| View Details | Expand metric details | Toggle detail view |
| Print | Print analytics | Browser print |

---

#### Page 28: `/doctor/analytics/wait-times`
**Status:** Can merge with Analytics
**Components:**
- [ ] Hourly wait time breakdown (bar chart)
- [ ] Peak hours identification
- [ ] Average wait by appointment type
- [ ] Trend comparison
- [ ] Recommendations for optimization

---

#### Page 29: `/doctor/notifications`
**Status:** ✅ Implemented | Need: Polish
**Components Needed:**
- [ ] Same as `/notifications` (Page 14) but marked as doctor notifications

---

#### Page 30: `/doctor/profile`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Professional information:
  - [ ] Profile picture
  - [ ] Full name
  - [ ] Specialization(s)
  - [ ] Department
  - [ ] License number
  - [ ] Years of experience
  - [ ] Qualifications/Certifications
  - [ ] Bio/About
  - [ ] Office phone
  - [ ] Office address
- [ ] Professional details:
  - [ ] Medical registration number
  - [ ] Board certification status
  - [ ] Languages spoken
  - [ ] Office hours (summary)
  - [ ] Fees (if applicable)
- [ ] Contact settings:
  - [ ] Primary email
  - [ ] Phone number
  - [ ] Office address
  - [ ] Website (if applicable)
- [ ] Visibility settings:
  - [ ] Public profile toggle
  - [ ] Show email toggle
  - [ ] Show phone toggle
  - [ ] Show office address toggle
- [ ] Save button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Upload Picture | Change profile photo | `POST /api/doctor/profile/avatar` |
| Save Profile | Submit changes | `PUT /api/doctor/profile` |
| Cancel | Discard changes | Client-side |
| View Public Profile | See as patients see | Open in new tab |

---

#### Page 31: `/doctor/settings/account`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Display name input
- [ ] Email input (read-only with change option)
- [ ] Phone number input
- [ ] Preferred language selector
- [ ] Timezone selector
- [ ] Save button

**Same as Patient Account Settings (Page 16) adapted for doctor role**

---

#### Page 32: `/doctor/settings/security`
**Status:** ✅ Implemented
**Same as Patient Security Settings (Page 17)**

---

#### Page 33: `/doctor/settings/notifications`
**Status:** ✅ Implemented
**Same as Patient Notification Settings (Page 18) with doctor-specific events**

---

#### Page 34: `/doctor/settings/queue`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Queue mode selector:
  - [ ] Active (accepting patients)
  - [ ] Paused (not accepting)
  - [ ] Offline (completely offline)
- [ ] Auto-pause settings:
  - [ ] Auto-pause if wait time exceeds (minutes)
  - [ ] Auto-pause at certain time
  - [ ] Auto-pause after X patients
- [ ] Walk-in settings:
  - [ ] Allow walk-ins toggle
  - [ ] Max walk-ins per day
  - [ ] Reserved walk-in slots
- [ ] No-show handling:
  - [ ] No-show threshold (patient marked no-show after X minutes)
  - [ ] Auto-mark no-show toggle
  - [ ] Alert when patient late toggle
  - [ ] No-show cooldown (minutes before next appointment)
- [ ] Queue preferences:
  - [ ] Default queue mode (active/paused)
  - [ ] Sound notification toggle
  - [ ] Notification sound selector
  - [ ] Max patients per day
- [ ] Save button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Save Settings | Submit queue preferences | `PUT /api/doctor/settings/queue` |
| Test Sound | Play notification sound | Audio element |
| Reset Defaults | Restore default settings | `POST /api/doctor/settings/queue/reset` |

---

#### Page 35: `/doctor/settings/preferences`
**Status:** ✅ Implemented
**Same as Patient Preferences Settings (Page 19)**

---

### ✅ PHASE 4: ADMIN PAGES (17 Pages)

#### Page 36: `/admin/dashboard`
**Status:** ✅ Scaffolded | Need: Full Implementation
**Components Needed:**
- [ ] Key metrics cards:
  - [ ] Total active users
  - [ ] Total doctors
  - [ ] Total patients
  - [ ] Today's appointments
  - [ ] System uptime %
  - [ ] Active sessions
- [ ] Graphs/Charts:
  - [ ] User registration trend (line chart)
  - [ ] Daily appointments trend (area chart)
  - [ ] Doctor activity (bar chart - most active doctors)
  - [ ] Department breakdown (pie chart)
- [ ] Recent activity section:
  - [ ] Last 10 registrations
  - [ ] Last 10 appointments
  - [ ] Recent errors/issues
- [ ] System health:
  - [ ] API response time
  - [ ] Database status
  - [ ] Queue status
  - [ ] Error count (last 24h)
- [ ] Action shortcuts:
  - [ ] View all users
  - [ ] View all doctors
  - [ ] View live queues
  - [ ] View reports
  - [ ] System settings

**Buttons & Functions:**
| Button | Function | Navigation |
|--------|----------|------------|
| View All Users | Navigate to users list | `/admin/users` |
| View All Doctors | Navigate to doctors list | `/admin/doctors` |
| Live Queues | Go to queue monitoring | `/admin/queues/live` |
| View Reports | Navigate to reports | `/admin/reports` |
| System Settings | Go to settings | `/admin/settings/general` |
| Refresh Metrics | Reload dashboard data | `GET /api/admin/dashboard` |

---

#### Page 37: `/admin/users`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Filters/Search:
  - [ ] Search by name, email, phone
  - [ ] Filter by role (Patient/Doctor/Admin)
  - [ ] Filter by status (Active/Inactive/Suspended)
  - [ ] Filter by registration date range
  - [ ] Filter by last login date
- [ ] Users table with columns:
  - [ ] Checkbox for bulk actions
  - [ ] User name & avatar
  - [ ] Email
  - [ ] Role badge (Patient/Doctor/Admin)
  - [ ] Status badge (Active/Suspended/Inactive)
  - [ ] Registration date
  - [ ] Last login
  - [ ] Actions: View, Edit, Suspend/Activate, Delete
- [ ] Bulk actions:
  - [ ] Select all checkbox
  - [ ] Bulk suspend
  - [ ] Bulk activate
  - [ ] Bulk delete (with confirmation)
- [ ] Pagination
- [ ] Sort by any column
- [ ] Export list (CSV, PDF)
- [ ] Add new user button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Search | Filter users | `GET /api/admin/users?search=...` |
| Filter by Role | Show role-specific users | `GET /api/admin/users?role=...` |
| Filter by Status | Show status-specific users | `GET /api/admin/users?status=...` |
| Sort | Change table order | `GET /api/admin/users?sort=...` |
| View User | Navigate to detail page | `/admin/users/[id]` |
| Edit User | Open edit modal | Modal or edit page |
| Suspend User | Disable user account | `PATCH /api/admin/users/[id]/status?status=suspended` |
| Activate User | Re-enable user | `PATCH /api/admin/users/[id]/status?status=active` |
| Delete User | Remove user (with confirmation) | `DELETE /api/admin/users/[id]` |
| Select All | Checkbox all users on page | Client-side |
| Bulk Suspend | Suspend selected users | `PATCH /api/admin/users/bulk-suspend` |
| Bulk Delete | Delete selected users | `DELETE /api/admin/users/bulk` |
| Export | Download users list | `GET /api/admin/users/export` |
| Add New User | Navigate to create form | `/admin/users/new` |
| Refresh | Reload users list | `GET /api/admin/users` |

**Features:**
- [x] Advanced filtering
- [x] Bulk operations
- [x] Soft delete with restore option
- [x] User impersonation (for support)
- [x] Account history

---

#### Page 38: `/admin/users/[id]`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] User header:
  - [ ] Avatar
  - [ ] Name
  - [ ] Email
  - [ ] Phone
  - [ ] Role badge
  - [ ] Status badge
  - [ ] Edit button
- [ ] User information:
  - [ ] Full name
  - [ ] Email
  - [ ] Phone
  - [ ] Role
  - [ ] Status
  - [ ] Registration date
  - [ ] Last login date & time
  - [ ] IP address (last login)
- [ ] Account statistics:
  - [ ] Total appointments (for patients)
  - [ ] Total reviews (for doctors)
  - [ ] Avg appointment duration
  - [ ] No-show rate
  - [ ] Satisfaction rating
- [ ] Recent activity:
  - [ ] Last 10 actions from audit log
  - [ ] Login history
  - [ ] Device history
- [ ] Actions panel:
  - [ ] Edit user button
  - [ ] Suspend button (with reason)
  - [ ] Activate button
  - [ ] Reset password button
  - [ ] Force logout button
  - [ ] Delete button
  - [ ] Impersonate button (for support)
- [ ] If Doctor:
  - [ ] Link to doctor profile
  - [ ] Doctor statistics
  - [ ] Workload info
  - [ ] Performance metrics

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Edit User | Open edit form | Modal or edit page |
| Suspend User | Disable account (with reason) | `PATCH /api/admin/users/[id]/suspend` |
| Activate User | Re-enable account | `PATCH /api/admin/users/[id]/activate` |
| Reset Password | Reset user password | `POST /api/admin/users/[id]/reset-password` |
| Force Logout | Log out all sessions | `POST /api/admin/users/[id]/logout-all` |
| Delete User | Permanently delete | `DELETE /api/admin/users/[id]` |
| Impersonate | Login as this user (support only) | `POST /api/admin/impersonate/[id]` |
| View Doctor Profile | Go to doctor page (if doctor) | `/admin/doctors/[id]` |
| Back | Return to users list | `/admin/users` |

**Features:**
- [x] Complete user audit trail
- [x] User impersonation support
- [x] Suspend with reason
- [x] Password reset without email
- [x] Force logout capability

---

#### Page 39: `/admin/doctors`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Filters/Search:
  - [ ] Search by name, specialization, department
  - [ ] Filter by status (Active/Suspended/On-leave)
  - [ ] Filter by department
  - [ ] Filter by specialization
  - [ ] Filter by verification status (Verified/Pending)
  - [ ] Sort by: Name, Department, Appointments, Rating
- [ ] Doctors table with columns:
  - [ ] Avatar
  - [ ] Name
  - [ ] Specialization(s)
  - [ ] Department
  - [ ] Status badge
  - [ ] Verification badge
  - [ ] Number of appointments (this month)
  - [ ] Rating (avg stars)
  - [ ] Patients count
  - [ ] Actions: View, Edit, Suspend/Activate, Verify, Delete
- [ ] Bulk actions
- [ ] Pagination
- [ ] Export list

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Search | Filter doctors | `GET /api/admin/doctors?search=...` |
| Filter by Department | Show department doctors | `GET /api/admin/doctors?department=...` |
| Filter by Status | Show status doctors | `GET /api/admin/doctors?status=...` |
| Sort | Change table order | `GET /api/admin/doctors?sort=...` |
| View Doctor | Navigate to detail page | `/admin/doctors/[id]` |
| Edit Doctor | Open edit modal | Modal or edit page |
| Verify Doctor | Approve doctor profile | `PATCH /api/admin/doctors/[id]/verify` |
| Suspend Doctor | Disable doctor account | `PATCH /api/admin/doctors/[id]/suspend` |
| Activate Doctor | Re-enable doctor | `PATCH /api/admin/doctors/[id]/activate` |
| Delete Doctor | Remove doctor (with confirmation) | `DELETE /api/admin/doctors/[id]` |
| Export | Download doctors list | `GET /api/admin/doctors/export` |

---

#### Page 40: `/admin/doctors/[id]`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Doctor header with summary
- [ ] Doctor information:
  - [ ] Name, specialization, department
  - [ ] License number & status
  - [ ] Experience years
  - [ ] Qualifications
  - [ ] Rating (avg, count of reviews)
  - [ ] Status badge
- [ ] Statistics:
  - [ ] Total appointments (all time)
  - [ ] Appointments this month
  - [ ] Completed appointments
  - [ ] No-show count & rate
  - [ ] Cancelled appointments
  - [ ] Average appointment duration
  - [ ] Patient satisfaction score
  - [ ] On-time percentage
- [ ] Today's queue:
  - [ ] Current queue status
  - [ ] Patients waiting
  - [ ] Appointments scheduled
  - [ ] No-show count today
  - [ ] Link to live queue
- [ ] Performance metrics:
  - [ ] Patients seen trend (last 30 days)
  - [ ] No-show trend
  - [ ] Rating trend
  - [ ] Workload gauge
- [ ] Workload information:
  - [ ] Currently accepting patients toggle
  - [ ] Queue status
  - [ ] Schedule status
  - [ ] Appointments this week
  - [ ] Appointments next week
- [ ] Actions:
  - [ ] Edit doctor button
  - [ ] Suspend button
  - [ ] Force offline button
  - [ ] Send message button
  - [ ] View schedule button
  - [ ] View audit logs button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Edit Doctor | Open edit form | Modal or edit page |
| Suspend | Disable doctor | `PATCH /api/admin/doctors/[id]/suspend` |
| Activate | Re-enable doctor | `PATCH /api/admin/doctors/[id]/activate` |
| Force Offline | Take doctor offline | `PATCH /api/admin/doctors/[id]/offline` |
| Send Message | Message to doctor | `POST /api/messages` |
| View Schedule | Open doctor schedule | Modal or page |
| View Live Queue | Monitor today's queue | `/admin/queues/live?doctor=[id]` |
| View Audit Logs | Show doctor audit trail | `/admin/audit-logs?user=[id]` |
| View Patients | Show doctor's patients | Modal with list |
| View Reviews | Show all reviews | Modal with paginated list |
| Back | Return to doctors list | `/admin/doctors` |

---

#### Page 41: `/admin/queues/live`
**Status:** ✅ Implemented | Need: Real-time Polish
**Components Needed:**
- [ ] Auto-refresh configuration (15 seconds default)
- [ ] One card per doctor showing:
  - [ ] Doctor name & specialization
  - [ ] Current queue status (Active/Paused/Offline)
  - [ ] Total patients in queue (today)
  - [ ] Patients waiting count (real-time)
  - [ ] Patients in progress count
  - [ ] Patients completed count
  - [ ] No-show count today
  - [ ] Average wait time
  - [ ] Estimated wait for next patient
  - [ ] Doctor's current location (if applicable)
  - [ ] Color-coded status indicator
- [ ] Expand card to see:
  - [ ] Full patient list in queue
  - [ ] Each patient's:
    - Name
    - Appointment time
    - Arrived time (if present)
    - Current status
    - Wait time
  - [ ] Quick actions: View details, Force mark complete, etc.
- [ ] Filter by:
  - [ ] Status (Active/Paused/Offline)
  - [ ] Department
  - [ ] Specialization
- [ ] Summary metrics:
  - [ ] Total patients in system queue
  - [ ] Total waiting patients
  - [ ] Average system wait time
  - [ ] Doctors active count
  - [ ] Doctors paused count
  - [ ] High-wait-time alert (if any doctor has very long queue)
- [ ] Sort options:
  - [ ] By longest queue
  - [ ] By highest wait time
  - [ ] By name
- [ ] Sound alert toggle for new patients
- [ ] Auto-refresh toggle
- [ ] Manual refresh button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Expand Card | Show patient list in queue | Toggle expand |
| View Patient Details | Navigate to appointment | `/admin/appointments/[id]` |
| Force Mark Complete | Complete appointment | `PATCH /api/admin/queue/[appointmentId]/force-complete` |
| Pause Doctor Queue | Pause doctor's queue remotely | `PATCH /api/admin/doctors/[id]/queue/pause` |
| Resume Doctor Queue | Resume doctor's queue remotely | `PATCH /api/admin/doctors/[id]/queue/resume` |
| Filter by Status | Show filtered doctors | Client-side |
| Sort | Change card order | Client-side |
| Refresh | Manually refresh data | `GET /api/admin/queues/live` |
| Toggle Auto-Refresh | Enable/disable auto-refresh | Client-side |
| Sound Alert Toggle | Enable/disable audio notifications | Client-side |

**Real-time Features:**
- [x] Socket.io subscriptions for all queues
- [x] Real-time patient count updates
- [x] Real-time wait time updates
- [x] Highlight new patients
- [x] Alert on high wait times
- [x] Auto-refresh every 15 seconds
- [x] Audio notification for queue events

---

#### Page 42: `/admin/audit-logs`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Advanced filters:
  - [ ] Action type selector (login, appointment_create, user_suspend, etc.)
  - [ ] User selector (who performed action)
  - [ ] Date range picker
  - [ ] Filter by role (Patient/Doctor/Admin)
  - [ ] Filter by entity type (User, Appointment, Doctor, etc.)
  - [ ] Search by details
  - [ ] Filter by outcome (Success/Failure)
- [ ] Audit table with columns:
  - [ ] Timestamp (sortable, filterable)
  - [ ] User name (who)
  - [ ] Action (what)
  - [ ] Entity type (on what)
  - [ ] Entity details (which specific entity)
  - [ ] Status (Success/Failed)
  - [ ] IP address
  - [ ] User agent (device/browser)
  - [ ] View details icon
- [ ] Pagination
- [ ] Export logs (CSV, PDF)
- [ ] Sort by any column
- [ ] Detailed view modal:
  - [ ] Full event details
  - [ ] Before/after values (if applicable)
  - [ ] IP address map
  - [ ] Device info
  - [ ] Related actions (if any)

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Filter by Action | Show specific actions | `GET /api/admin/audit-logs?action=...` |
| Filter by Date | Show date range logs | `GET /api/admin/audit-logs?from=...&to=...` |
| Search | Find specific audit events | `GET /api/admin/audit-logs?search=...` |
| Sort | Order table | `GET /api/admin/audit-logs?sort=...` |
| View Details | Show event detail modal | Modal popup |
| Export Logs | Download as CSV/PDF | `GET /api/admin/audit-logs/export` |
| Clear Logs | Delete old logs (admin only) | `DELETE /api/admin/audit-logs/old` (with confirmation) |

**Features:**
- [x] Comprehensive audit trail
- [x] Who, what, when, where, and why tracking
- [x] Before/after value comparison
- [x] IP address tracking
- [x] Device/browser fingerprinting
- [x] Retention policy (auto-cleanup old logs)

---

#### Page 43: `/admin/reports`
**Status:** ✅ Implemented (Basic) | Need: Full Features
**Components Needed:**
- [ ] Report type selector:
  - [ ] User statistics (registrations, active, suspended)
  - [ ] Appointment statistics (total, by status, by doctor)
  - [ ] Doctor performance (appointments, no-show %, satisfaction)
  - [ ] Finance/Billing (if applicable)
  - [ ] System health (uptime, errors, performance)
  - [ ] Custom report builder
- [ ] Report configuration:
  - [ ] Date range picker
  - [ ] Filters (department, specialization, status, etc.)
  - [ ] Metrics to include (checkboxes)
  - [ ] Grouping options (by day, by doctor, by department)
  - [ ] Sort order
  - [ ] Include only active/verified entities
- [ ] Report display:
  - [ ] Tables with data
  - [ ] Charts/graphs
  - [ ] Summary statistics
  - [ ] Comparative analysis (vs previous period)
- [ ] Export options:
  - [ ] PDF report
  - [ ] CSV spreadsheet
  - [ ] Excel with formulas
  - [ ] Email report
  - [ ] Schedule recurring report
- [ ] Saved reports:
  - [ ] List of saved reports
  - [ ] Run saved report button
  - [ ] Edit saved report
  - [ ] Delete saved report
  - [ ] Schedule recurring runs

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Select Report Type | Choose report type | Client-side |
| Run Report | Generate report | `POST /api/admin/reports/generate` |
| Export PDF | Download as PDF | `GET /api/admin/reports/[id]/export?format=pdf` |
| Export CSV | Download as CSV | `GET /api/admin/reports/[id]/export?format=csv` |
| Email Report | Send report via email | `POST /api/admin/reports/[id]/email` |
| Schedule Report | Set up recurring generation | `POST /api/admin/reports/schedule` |
| Save Report | Save report template | `POST /api/admin/reports/save` |
| Load Saved | Open saved report | `GET /api/admin/reports/saved` |
| Delete Report | Remove saved report | `DELETE /api/admin/reports/[id]` |
| Print | Print report | Browser print |

---

#### Page 44: `/admin/analytics`
**Status:** ✅ Implemented | Need: Polish & More Metrics
**Components Needed:**
- [ ] System KPI cards:
  - [ ] Total users
  - [ ] Active doctors
  - [ ] Total appointments (this period)
  - [ ] System uptime %
  - [ ] Avg response time
  - [ ] Error rate %
- [ ] Date range selector (7d, 30d, 90d, custom)
- [ ] Charts:
  - [ ] User registration trend
  - [ ] Daily appointment volume
  - [ ] Appointment status breakdown
  - [ ] Department-wise appointment distribution
  - [ ] Doctor performance comparison
  - [ ] Patient satisfaction trend
- [ ] Detailed metrics:
  - [ ] By department table
  - [ ] By doctor table
  - [ ] By status breakdown
  - [ ] By time of day
  - [ ] By day of week
- [ ] Benchmarking:
  - [ ] Compare to previous period
  - [ ] KPI targets vs actual
  - [ ] Performance gauge
- [ ] Alerts/Insights:
  - [ ] High no-show doctors
  - [ ] Long wait-time periods
  - [ ] System performance issues
  - [ ] Unusual patterns
- [ ] Export options

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Select Time Period | Change date range | `GET /api/admin/analytics?period=...` |
| Select Department | Filter by department | `GET /api/admin/analytics?department=...` |
| Drill Down | View detailed metrics | Navigate to detail view |
| Export | Download analytics | `GET /api/admin/analytics/export` |
| Print | Print report | Browser print |
| Refresh | Reload data | `GET /api/admin/analytics` |

---

#### Page 45: `/admin/settings/general`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Hospital/Organization settings:
  - [ ] Organization name input
  - [ ] Logo upload
  - [ ] Support email input
  - [ ] Support phone input
  - [ ] Address input
  - [ ] Website URL
  - [ ] Timezone selector
  - [ ] Default language
- [ ] Operational settings:
  - [ ] Default time slot duration (minutes)
  - [ ] Max appointments per doctor per day
  - [ ] Cancellation deadline (hours)
  - [ ] Walk-in percentage allowed
  - [ ] Buffer time between appointments
  - [ ] Default currency (if applicable)
- [ ] System settings:
  - [ ] Session timeout (minutes)
  - [ ] Email notifications enabled
  - [ ] SMS notifications enabled
  - [ ] System maintenance mode toggle
  - [ ] Allow new user registrations toggle
  - [ ] Require email verification toggle
  - [ ] Require doctor verification toggle
- [ ] Save button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Upload Logo | Change organization logo | `POST /api/admin/settings/logo` |
| Save Settings | Submit changes | `PUT /api/admin/settings/general` |
| Test Email | Send test email | `POST /api/admin/settings/test-email` |
| Enable Email | Toggle email notifications | `PATCH /api/admin/settings/email-enabled` |
| Enable SMS | Toggle SMS notifications | `PATCH /api/admin/settings/sms-enabled` |
| Maintenance Mode | Toggle system maintenance | `PATCH /api/admin/settings/maintenance-mode` |

---

#### Page 46: `/admin/settings/scheduling`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Default scheduling rules:
  - [ ] Default slot duration (15, 30, 45, 60 min)
  - [ ] Max appointments per doctor per day
  - [ ] Advance booking limit (days doctor can be booked)
  - [ ] Cancellation deadline (hours before appointment)
  - [ ] Rescheduling allowed toggle
  - [ ] Walk-in slots percentage (0-100%)
  - [ ] Buffer time between appointments (minutes)
- [ ] Appointment settings:
  - [ ] No-show grace period (minutes)
  - [ ] Auto-mark no-show toggle
  - [ ] Allow patient reschedule toggle
  - [ ] Allow patient cancel toggle
  - [ ] Require symptoms on booking toggle
  - [ ] Allow video consultations toggle
- [ ] Break time defaults:
  - [ ] Default lunch break start/end time
  - [ ] Allow custom breaks toggle
  - [ ] Sunday working status
  - [ ] Saturday working status
- [ ] Holiday settings:
  - [ ] Add holiday button (date picker + name)
  - [ ] List of holidays
  - [ ] Delete holiday button
  - [ ] Import holidays (CSV)
- [ ] Save button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Add Holiday | Add new holiday | `POST /api/admin/settings/holidays` |
| Delete Holiday | Remove holiday | `DELETE /api/admin/settings/holidays/[id]` |
| Import Holidays | Upload CSV | `POST /api/admin/settings/holidays/import` |
| Save Settings | Submit changes | `PUT /api/admin/settings/scheduling` |
| Reset Defaults | Restore default settings | `POST /api/admin/settings/scheduling/reset` |

---

#### Page 47: `/admin/settings/security`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Session management:
  - [ ] Session timeout (minutes)
  - [ ] Require password for sensitive actions
  - [ ] Require 2FA for admin toggle
- [ ] IP whitelist management:
  - [ ] Add IP button
  - [ ] IP address input
  - [ ] Description input
  - [ ] Whitelist enabled toggle
  - [ ] List of whitelisted IPs:
    - [ ] IP address
    - [ ] Description
    - [ ] Updated date
    - [ ] Delete button
    - [ ] Toggle enable/disable
- [ ] Login security:
  - [ ] Require strong passwords toggle
  - [ ] Password expiry days (0 = no expiry)
  - [ ] Password history (number of previous passwords to check)
  - [ ] Account lockout after X failed attempts
  - [ ] Lockout duration (minutes)
- [ ] Activity logging:
  - [ ] Log all admin actions toggle
  - [ ] Log failed login attempts toggle
  - [ ] Log data exports toggle
  - [ ] Retention period for logs (days)
- [ ] API security:
  - [ ] API rate limit per minute
  - [ ] Require API keys for external access
  - [ ] API key management (list, generate, revoke)
- [ ] Save button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Add IP | Add whitelist IP | `POST /api/admin/settings/ip-whitelist` |
| Delete IP | Remove whitelist IP | `DELETE /api/admin/settings/ip-whitelist/[id]` |
| Toggle IP | Enable/disable IP | `PATCH /api/admin/settings/ip-whitelist/[id]` |
| Generate API Key | Create new API key | `POST /api/admin/settings/api-keys` |
| Revoke API Key | Delete API key | `DELETE /api/admin/settings/api-keys/[id]` |
| Copy API Key | Copy to clipboard | Client-side |
| Test IP Whitelist | Test current IP | `GET /api/admin/settings/test-ip` |
| Save Settings | Submit changes | `PUT /api/admin/settings/security` |

---

#### Page 48: `/admin/settings/notifications`
**Status:** ✅ Implemented | Need: Full Features
**Components Needed:**
- [ ] Email notification settings per event:
  - [ ] New user registered
  - [ ] Doctor approval pending
  - [ ] Appointment cancelled
  - [ ] High no-show rate alert
  - [ ] System error alert
  - [ ] Daily summary report
  - [ ] Weekly statistics report
  - [ ] Monthly statistics report
- [ ] For each event:
  - [ ] Enable/disable toggle
  - [ ] Recipients field (comma-separated emails or role-based)
  - [ ] Subject line template
  - [ ] Custom message template
- [ ] SMS notification settings (similar structure)
- [ ] Notification templates:
  - [ ] Template builder with variables
  - [ ] Preview button
  - [ ] Reset to default button
- [ ] Email configuration:
  - [ ] SMTP server
  - [ ] SMTP port
  - [ ] From email address
  - [ ] From name
  - [ ] Test send button
- [ ] Save button

**Buttons & Functions:**
| Button | Function | API |
|--------|----------|-----|
| Toggle Notification | Enable/disable notification type | Client-side |
| Edit Template | Open template editor | Modal or edit page |
| Test Send | Send test notification | `POST /api/admin/settings/notifications/test-send` |
| Preview | Preview notification | Modal |
| Reset Template | Restore default template | `POST /api/admin/settings/notifications/[event]/reset` |
| Save Settings | Submit changes | `PUT /api/admin/settings/notifications` |
| Test Email Config | Verify SMTP settings | `POST /api/admin/settings/notifications/test-smtp` |

---

### ✅ PHASE 5: SYSTEM/ERROR PAGES (7 Pages)

#### Page 49-55: Public Error & Info Pages
**Status:** ✅ Mostly Scaffolded | Need: Full Polish

- **`/login`** - Login page ✅
- **`/signup`** - Registration page ✅
- **`/terms`** - Terms of Service ✅
- **`/privacy`** - Privacy Policy ✅
- **`/support`** - FAQ + Support form ✅
- **`/403`** - Forbidden (Unauthorized) ✅
- **`/404`** - Not Found ✅
- **`/500`** - Server Error ✅
- **`/maintenance`** - Maintenance/Downtime ✅

---

## 🎯 DEVELOPMENT PHASES BREAKDOWN

### **Phase 1: Core Setup** ✅ COMPLETED
- [x] Next.js 14 project initialized
- [x] Routes scaffolded (60+ pages)
- [x] Tailwind CSS configured
- [x] Component structure setup
- [x] API client configured (axios)
- [x] Socket.io integrated
- [x] Authentication context setup

### **Phase 2: Authentication & Core Frontend** (1-2 weeks)
**Priority: HIGH**
1. [ ] Implement all 5 auth pages with full functionality
2. [ ] Create reusable UI components (Button, Form, Input, etc.)
3. [ ] Setup form validation & error handling
4. [ ] Implement auth context & JWT token management
5. [ ] Setup protected routes & role-based access control
6. [ ] API integration for all auth endpoints
7. [ ] Test all auth flows end-to-end

### **Phase 3: Patient Pages** (2-3 weeks)
**Priority: HIGH**
1. [ ] Dashboard (main landing)
2. [ ] Doctor listing & filtering
3. [ ] Doctor profile & booking flow
4. [ ] Appointments management
5. [ ] Medical records
6. [ ] Notifications
7. [ ] Profile & Settings pages
8. [ ] Real-time Socket.io integration
9. [ ] Mobile responsiveness
10. [ ] Accessibility features

### **Phase 4: Doctor Pages** (2-3 weeks)
**Priority: HIGH**
1. [ ] Dashboard with queue management
2. [ ] Real-time queue monitoring
3. [ ] Appointments management
4. [ ] Schedule builder (calendar)
5. [ ] Medical record creation & editing
6. [ ] Patient management
7. [ ] Analytics & reporting
8. [ ] Settings pages
9. [ ] Socket.io for real-time updates
10. [ ] Doctor-specific features

### **Phase 5: Admin Pages** (2-3 weeks)
**Priority: MEDIUM**
1. [ ] Dashboard with system metrics
2. [ ] User management
3. [ ] Doctor management & verification
4. [ ] Live queue monitoring
5. [ ] Audit logs & activity tracking
6. [ ] Reports & analytics
7. [ ] System settings & configuration
8. [ ] Security settings
9. [ ] Notifications configuration
10. [ ] Admin-specific features

### **Phase 6: Polish & Testing** (1-2 weeks)
**Priority: MEDIUM**
1. [ ] UI/UX polish
2. [ ] Mobile responsiveness fixes
3. [ ] Performance optimization
4. [ ] Accessibility (WCAG) improvements
5. [ ] Error handling & edge cases
6. [ ] Integration testing
7. [ ] User acceptance testing
8. [ ] Bug fixes
9. [ ] Documentation
10. [ ] Deployment preparation

---

## 🛠️ TECHNOLOGY STACK & LIBRARIES

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Styling

### UI & Forms
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Headless UI** - Unstyled accessible components
- **Shadcn/ui** - Pre-built Tailwind components

### Utilities
- **Axios** - HTTP client
- **Socket.io-client** - Real-time communication
- **date-fns** - Date manipulation
- **zustand** - State management (lightweight alternative to Redux)
- **react-query** - Data fetching & caching
- **clsx** - Conditional classname generation

### Accessibility & Performance
- **React A11y** - Accessibility helpers
- **Next/Image** - Image optimization
- **dynamic() imports** - Code splitting

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety (optional but recommended)

---

## 📊 IMPLEMENTATION CHECKLIST

Replace this checklist in your project as you implement pages:

```
✅ COMPLETED (12)
- Auth pages (5)
- System pages (7)

🚧 IN PROGRESS (0)

⚠️ NOT STARTED (48)
- Patient pages (15)
- Doctor pages (17)
- Admin pages (17)
- Error pages (integrated)
```

---

## ✨ KEY IMPLEMENTATION PRINCIPLES

1. **Component Reusability**
   - Build generic forms, buttons, modals
   - Create composite components from smaller units
   - Use prop-based customization

2. **State Management**
   - Use Context API for auth/global state
   - Use Zustand for large state slices (optional)
   - Use React Query for server state
   - Component state for local UI (forms, modals)

3. **API Integration Pattern**
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

4. **Form Validation Pattern**
```javascript
// Client-side validation with Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { errors, isValid } = await validateForm(data);
```

5. **Error Handling**
   - Global error boundary
   - Try-catch for async operations
   - User-friendly error messages
   - Log errors to Sentry (optional)

6. **Performance**
   - Lazy load components
   - Code splitting per route
   - Image optimization
   - Debounce/throttle expensive operations
   - Memoize components where needed

7. **Accessibility**
   - Semantic HTML
   - ARIA labels where needed
   - Keyboard navigation support
   - Color contrast compliance
   - Focus management

8. **Testing Strategy**
   - Unit tests for utilities
   - Integration tests for API calls
   - E2E tests for user flows
   - Visual regression testing

---

## 📱 RESPONSIVE DESIGN BREAKPOINTS

```
- Mobile: < 768px (full width)
- Tablet: 768px - 1024px (sidebar collapses)
- Desktop: > 1024px (full layout)
```

---

## 🔐 SECURITY CONSIDERATIONS

1. [ ] Sanitize all user inputs
2. [ ] Validate data on client and server
3. [ ] Use HTTPS for all API calls
4. [ ] Store JWT tokens securely (httpOnly cookies if possible)
5. [ ] Implement XSS protection
6. [ ] Implement CSRF protection
7. [ ] Rate limit API calls on client
8. [ ] Never expose sensitive data in logs
9. [ ] Implement proper error messages (don't leak system info)
10. [ ] Regular security audits

---

## 📈 PERFORMANCE TARGETS

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] API response time < 500ms
- [ ] Bundle size < 300KB (gzipped)

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Build optimization
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup (Google Analytics)
- [ ] CDN configured
- [ ] Database backed up
- [ ] SSL certificates valid
- [ ] Performance monitoring enabled
- [ ] Documentation complete

---

## 📋 NEXT STEPS

1. **Immediate (This Week):**
   - [ ] Set up UI component library (Button, Form, Modal, etc.)
   - [ ] Implement authentication pages fully
   - [ ] Test all auth flows
   - [ ] Implement auth context & token management

2. **Short Term (Next 2 Weeks):**
   - [ ] Complete all patient pages
   - [ ] Implement API integration for patient features
   - [ ] Add Socket.io real-time features
   - [ ] Mobile responsiveness

3. **Medium Term (Following 2-3 Weeks):**
   - [ ] Complete doctor pages
   - [ ] Implement doctor-specific APIs
   - [ ] Queue management features
   - [ ] Analytics implementation

4. **Long Term (Final 2-3 Weeks):**
   - [ ] Admin pages
   - [ ] System settings
   - [ ] Testing & QA
   - [ ] Performance optimization
   - [ ] Documentation
   - [ ] Deployment

---

## 📚 RESOURCES & REFERENCES

- Next.js Docs: https://nextjs.org/docs
- React Docs: https://react.dev
- Tailwind CSS Docs: https://tailwindcss.com
- Socket.io Client Docs: https://socket.io/docs/v4/client-api/
- Axios Docs: https://axios-http.com

---

**Last Updated:** March 9, 2026  
**Status:** Ready for Implementation  
**Maintainer:** Your Team

