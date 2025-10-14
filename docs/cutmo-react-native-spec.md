# Cutmo Application Specification (React Native Rebuild)

This document captures the full scope of the existing Cutmo web application so it can be rebuilt with React Native (Expo). It consolidates application behavior, data contracts, user flows, and platform dependencies extracted from the current codebase.

---

## 1. Product Overview
- **Purpose**: Match beauty salon assistants in need of hair models with university students who can participate as models.
- **Value proposition**:
  - Students experience professional services for free or with rewards.
  - Salons secure models for training and portfolio creation.
- **Core interactions**: Recruitment posts, reservation requests, confirmation/cancellation workflows, and direct chat between students and salons.

---

## 2. User Roles & Access

| Role | Description | Capabilities |
| --- | --- | --- |
| `student` | University student authenticated via `.ac.jp` email | Browse recruitments, request reservations, chat after approval, manage own reservations, edit profile, delete account |
| `salon` | Salon representative or assistant | Publish and manage recruitments, manage incoming reservations, chat with confirmed students, edit profile, delete account |

There is no separate admin UI in the current build; Supabase policies enforce row-level security.

---

## 3. Platform & Architecture Overview
- **Frontend**: React 18 + Vite + TypeScript, CSS Modules.
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions).
  - Supabase Auth for email/password login.
  - Database triggers, RPC functions, and RLS policies defined in `database_schema.sql`.
  - Edge Function `reservation-notification` is invoked for transactional emails.
- **State management**: Local React state + hooks (`useAuth`, `useRecruitments`, `useReservations`).
- **Realtime**: Supabase channels used for recruitment list refresh and live chat updates.
- **Forms & validation**: In-component validation rules with user feedback via inline errors and alerts.

For the React Native rebuild, preserve this architecture or provide equivalent services.

---

## 4. Environment & Configuration

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key used by the client |

Additional configuration implied by code:
- Supabase Edge Function named `reservation-notification` (expects `{ reservationId, event }` payload).
- Supabase Service Role key (or an alternative secure mechanism) is effectively required to call `supabase.auth.admin.deleteUser()` during account deletion. The current client uses the anon key, so this needs server-side mediation in production.

---

## 5. Domain Model

### 5.1 Enumerations
- `UserType`: `student` | `salon`
- `RecruitmentStatus`: `active` | `closed`
- `ReservationStatus`: `pending` | `confirmed` | `cancelled_by_salon` | `cancelled_by_student`
- `MenuType`: `cut` | `color` | `perm` | `treatment` | `straight` | `hair_set` | `head_spa` | `hair_straightening` | `extensions` | `other`
- `GenderRequirement`: `male` | `female` | `any`
- `HairLengthRequirement`: `short` | `bob` | `medium` | `long` | `any`
- `PhotoShootRequirement`: `required` | `optional` | `none`
- `ModelExperienceRequirement`: `any` | `experienced` | `beginner`

### 5.2 Students (`students`)
| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Matches `auth.users.id`; PK |
| `email` | text | Unique |
| `name` | text | |
| `school_name` | text | Optional |
| `instagram_url` | text | Optional |
| `phone_number` | text | Stored but not added in schema (front-end collects, but schema currently lacks column) |
| `avatar_url` | text | Optional |
| `created_at` / `updated_at` | timestamptz | Auto-managed |

> **Note**: The schema file lacks `phone_number`, but the TypeScript types expect it. Align database before RN rebuild.

### 5.3 Salons (`salons`)
| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | References `auth.users`; PK |
| `email` | text | Unique |
| `salon_name` | text | |
| `description` | text | Optional |
| `address` | text | Optional |
| `phone_number` | text | Optional |
| `website_url` | text | Optional |
| `photo_url` | text | Optional |
| `created_at` / `updated_at` | timestamptz | Auto-managed |

### 5.4 Recruitments (`recruitments`)
| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | PK |
| `salon_id` | UUID | FK -> `salons.id` |
| `title` | text | Required |
| `description` | text | Optional |
| `menus` | text[] | Maps to `MenuType` |
| `gender_requirement` | text | Enum |
| `hair_length_requirement` | text | Enum |
| `treatment_duration` | text | Optional |
| `status` | text | `active` or `closed`; front-end toggles |
| `photo_shoot_requirement` | text | Enum |
| `model_experience_requirement` | text | Enum |
| `has_reward` | boolean | |
| `reward_details` | text | Optional |
| `available_dates` | JSONB | Array of `{ datetime: ISO8601, is_booked: boolean }` |
| `flexible_schedule_text` | text | Optional free-form availability description |
| `is_fully_booked` | boolean | Updated via trigger/RPC |
| `created_at` / `updated_at` | timestamptz | Auto-managed |

### 5.5 Reservations (`reservations`)
| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | PK |
| `recruitment_id` | UUID | FK |
| `student_id` | UUID | FK |
| `salon_id` | UUID | FK |
| `reservation_datetime` | timestamptz | Selected slot or chat request time |
| `status` | text | See enum |
| `message` | text | Optional applicant message |
| `is_chat_consultation` | boolean | `true` when no concrete slot exists |
| `cancellation_reason` | text | Optional |
| `created_at` / `updated_at` | timestamptz | Auto-managed |

### 5.6 Reservation Messages (`reservation_messages`)
| Field | Type | Notes |
| --- | --- | --- |
| `id` | UUID | PK |
| `reservation_id` | UUID | FK |
| `sender_id` | UUID | Either student or salon |
| `sender_type` | text | `student` or `salon` |
| `message` | text | Body |
| `created_at` | timestamptz | Timestamp |

### 5.7 Supporting Structures
- **Triggers & functions**:
  - `handle_new_user`: Populates `students`/`salons` after auth signup.
  - `update_updated_at_column`: Maintains `updated_at`.
  - `refresh_recruitment_booking_state`: Keeps `is_fully_booked` in sync with reservation activity.
  - `make_reservation`: Validates availability, marks slots booked, sets recruitment status to `closed`, and inserts reservation.
  - `cancel_reservation`: Reopens slots, potentially reactivates recruitment.
  - `delete_user_data`: Cascades user deletion across related rows.
- **Row Level Security (RLS)**:
  - Students can see/update only their profile and reservations.
  - Salons can manage own profile, recruitments, and reservations tied to them.
  - Recruitments are publicly readable when `status = 'active'`.

---

## 6. Business Rules & Validations

### Authentication & Profiles
- Student signup requires `.ac.jp` email (`isSchoolEmail` check).
- Password must be ≥ 8 characters.
- Phone numbers validated against Japanese formats (`0XXXXXXXXXX` with optional hyphens).
- Salon signup requires salon name, address, phone; website optional.
- During signup, metadata is stored in Supabase auth; profiles are inserted manually. If profile insert fails, the new auth user is deleted to avoid orphaned accounts.
- `AuthProvider` reloads profiles on auth state changes and attempts to create missing records using auth metadata.

### Recruitment Rules
- Salons must select at least one menu item.
- Either `available_dates` (one or more slots) or `flexible_schedule_text` is required.
- During edit, booked slots cannot be removed.
- Created/edited slots use local JST (`+09:00`) in UI, but stored as full ISO timestamps.
- Front-end ensures `title` is non-empty before submission.

### Reservation Rules
- Only students can initiate reservations.
- `make_reservation` rejects:
  - Requests on closed/non-existent recruitments.
  - Slots marked `is_booked`.
  - Slots within 48 hours (`Reservation deadline has passed`).
  - Chat requests when no `flexible_schedule_text` is provided.
  - Invalid datetime selections (not in `available_dates`).
- Upon student cancellation:
  - Allowed only ≥48 hours before reserved time (`isBeforeHoursBefore` check).
  - Cancellation requires a non-empty message; the reason is stored.
- Upon salon cancellation/confirmation:
  - Salons may confirm or cancel pending requests.
  - `cancel_reservation` RPC sets slots back to `is_booked = false` and reopens recruitment if no other confirmed/pending reservations remain and at least one slot/flexible note exists.
- Status transitions trigger email notifications via `reservation-notification` (events: `reservation_pending`, `reservation_confirmed`, `reservation_cancelled_by_salon`, `reservation_cancelled_by_student`).

### Chat Rules
- Chat modal is accessible only for reservations with status `confirmed`.
- Messages are loaded on demand and refreshed every 10 seconds plus Supabase realtime inserts.
- Unread indicator is shown when the latest message sender differs from the current user.

### Miscellaneous
- Top page filter may list menu label `"styling"` which does not map to any current `MenuType`. Adjust to `hair_set` during rebuild.
- `Footer` links to `/contact`, but no route exists; treat as future enhancement.
- Several flows rely on `window.alert`; replace with native toasts/dialogs in RN.

---

## 7. Screen & Feature Specifications

### 7.1 Global Layout
- `Header`: Displays brand, navigation links (`cutmoとは？`, `募集一覧`, Auth-related links). Logged-in users see `マイページ` and a profile dropdown with logout.
- `Footer`: Shows logo, service links (About, FAQ, Terms, Privacy, Contact placeholder), and copyright.
- `ScrollToTop` component resets scroll position on route changes.

### 7.2 Authentication
- **Login Screen**:
  - Inputs: email, password.
  - Basic validation (`isValidEmail`).
  - On success, navigate to dashboard.
  - Shows inline errors and generic alert on failure.
- **Signup Screen**:
  - Toggle between Student and Salon flows.
  - Collects distinct profile fields per role (see section 6).
  - Displays validation errors under each field.
  - On success, prompts user via alert to confirm email, then navigates to login.
  - For students, enforces `.ac.jp` email.

### 7.3 Top Page (Recruitment List)
- **Hero**: Displayed to unauthenticated users with service overview and features.
- **Filters**:
  - Menu (all or specific).
  - Gender requirement.
  - Checkbox to show only recruitments with available slots or flexible text.
  - Reset button clears all filters.
- **Recruitment Grid**:
  - Cards show salon image (if any), salon name, address, title, top 3 menu tags, truncated description, slot availability count or flexible text.
  - Link to recruitment detail.
- **Data Source**:
  - Supabase query filters `status = 'active'`, `is_fully_booked = false`.
  - Real-time updates subscribed via `recruitments` channel (reloads list on any change).
  - Additional front-end filtering ensures at least one unbooked slot or non-empty flexible text.

### 7.4 Recruitment Detail Screen
- **Header**: Title + status badge (`募集中` / `募集終了`).
- **Sections**:
  - Description
  - Menu tags
  - Condition list (gender, hair length, experience, photo requirement, optional duration/reward)
  - Salon information card (name, address with icon, phone, website, description, optional photo)
- **Availability**:
  - Buttons for each future, unbooked slot within reservation window. Disabled for non-student accounts.
  - CTA `仮予約する` opens modal to choose slot when multiple options exist.
  - If slots expired (within 48 hours), show warning and list of expired times.
  - If only flexible text available, show consultation section with date/time inputs to request chat.
- **Reservation Modal**:
  - For slot reservations: radio buttons of available datetimes, checklist confirming user meets conditions (dynamic list based on recruitment settings), optional message field.
  - For flexible chat: request date/time inputs before opening modal; same checklist applies.
  - Submit triggers `createReservation`, passes `is_chat_consultation` flag when needed, enforces 48-hour rule, closes modal on success.

### 7.5 Dashboard Overview
- Landing page for authenticated users (`/dashboard`), guarded by `ProtectedRoute`.
- Shared elements:
  - Title `マイページ`.
  - Action buttons: back to recruitment list, account settings menu (profile edit modal, account deletion).
  - `ProfileCard` summarizing user info (fields differ by role; websites displayed as links).
  - `ReservationChatModal` displayed modal-style when invoked.

#### Student Dashboard
- Sections:
  1. `承認待ちの予約`: Cards for `pending` reservations.
  2. `確定済みの予約`: Cards for `confirmed` reservations. Includes chat button (badge if unread), cancellation CTA (subject to 48-hour rule).
  3. `キャンセル・終了した予約`: Non-active reservations.
- Card details:
  - Summary with salon name, recruitment title, selected datetime, optional cancellation deadline, status badge.
  - Toggle to reveal details: salon contact info, timeline (creation, current status), applicant message, cancellation reasons, full recruitment details.
  - Deadline notice if within 48 hours but after cutoff (`isPastCutoffButBeforeEvent`).
- Cancel modal:
  - Requires text reason, ensures still before cutoff, calls `updateReservationStatus` with `cancelled_by_student` and triggers email.

#### Salon Dashboard
- **Reservation Management**:
  - Sections for pending, confirmed, and other reservations similar to student view.
  - Pending cards include action buttons `承認する` and `キャンセルする`.
  - Confirmed reservations allow chat.
  - Details include student contact (email, optional Instagram), message, cancellation reason, recruitment details.
- **Recruitment Management**:
  - List of existing recruitments showing title, status badge, updated timestamp, open slot count, flexible note if present.
  - Actions:
    - `編集`: opens edit modal with same fields as creation form.
    - `非公開/公開`: toggles `status`.
    - `削除`: hard delete (with warning).
- **Recruitment Creation Modal**:
  - Two-step wizard:
    1. Basic info (title, description, menu selection, gender, hair length, experience, shoot requirement, reward toggle/details, treatment duration).
    2. Availability setup (date/time picker adds slots; list with remove buttons; optional free-text schedule).
  - Cannot proceed to next step without at least one menu, cannot submit without slot or flexible text.
  - Submission calls `createRecruitment`.
- **Recruitment Edit Modal**:
  - Reuses form builder (without stepper UI). Booked slots flagged and not removable.

### 7.6 Profile Editing
- Accessible from dashboard action menu.
- Modal displays role-specific fields for editing.
- `updateProfile` updates Supabase `students` or `salons` tables, then reloads user profile.

### 7.7 Account Deletion
- Confirm dialog triggered from account settings.
- Calls `delete_user_data` RPC, then `supabase.auth.admin.deleteUser`, and signs out.
- Requires secure server-side logic in production; RN app should route through a protected API instead of direct admin call.

### 7.8 Chat Modal (`ReservationChatModal`)
- Triggered from dashboards for confirmed reservations.
- Shows partner name, reservation datetime, chronological messages, and a textarea for new input.
- Messages fetched initially and on interval; also listens to Supabase realtime inserts per reservation channel.
- Sending inserts into `reservation_messages` table; UI shows spinner while sending.

### 7.9 Static Content Pages
- **About**: Hero, feature tiles, and a tabbed "usage guide" for students vs salons with step-by-step instructions and tips, plus CTAs (`/signup`, `/`).
- **FAQ**: Category cards (student, salon, common) with expandable Q/A accordions and contact CTA.
- **Terms**: Structured legal sections, updated date, contact note.
- **Privacy Policy**: Similar format with privacy sections and contact info.
- **NotFound**: Simple 404 message with button back to top.

---

## 8. Supabase Interaction Map

| Operation | Hook/Component | Supabase Call | Notes |
| --- | --- | --- | --- |
| Load session & profile | `useAuth` | `auth.getSession`, `students`/`salons` select, fallback to auth metadata insert | Called on mount and on auth state change |
| Sign in | `LoginForm` | `auth.signInWithPassword` | Reloads profile |
| Sign up | `SignupForm` | `auth.signUp`, manual table insert | Stores metadata for trigger redundancy |
| Sign out | `useAuth.signOut` | `auth.signOut` | Clears local user |
| Update profile | `useAuth.updateProfile` | `students` or `salons` update | Reloads profile |
| Delete account | `useAuth.deleteAccount` | `rpc('delete_user_data')`, `auth.admin.deleteUser` | Requires elevated key |
| Fetch recruitments | `useRecruitments` | `from('recruitments').select('*, salon:salons(*)')` | Filters active/open slots |
| Fetch recruitment by id | `useRecruitments` | `.eq('id', id).single()` | Includes nested salon |
| Fetch recruitments by salon | `useRecruitments` | `.eq('salon_id', salonId)` | |
| Create recruitment | `useRecruitments` | `insert` | Ensures `is_fully_booked` default false |
| Update recruitment | `useRecruitments` | `update` | Editing restrictions enforced client-side |
| Delete recruitment | `useRecruitments` | `delete` | Cascades reservations via FK |
| Realtime recruitments | `useRecruitments` | `supabase.channel('recruitments-changes')` | Refresh list on `event=*` |
| Fetch reservations (student) | `useReservations` | `from('reservations').select('*, student:students(*), recruitment:recruitments(*, salon:salons(*)))').eq('student_id', ...)` | Sorted desc |
| Fetch reservations (salon) | `useReservations` | Same with `.eq('salon_id', ...)` | |
| Create reservation | `useReservations.createReservation` | `rpc('make_reservation', {...})` | Returns reservation id; triggers email via helper |
| Update reservation status | `useReservations.updateReservationStatus` | `update` + `rpc('cancel_reservation')` for cancellations | Sends notification events |
| Fetch chat messages | `ReservationChatModal` | `from('reservation_messages').select('*').eq('reservation_id', id).order('created_at', asc)` | |
| Send chat message | `ReservationChatModal` | `insert` | |
| Realtime chat updates | `ReservationChatModal`, `DashboardPage` | `supabase.channel('reservation-messages-...')` | Both modal and dashboard subscribe |
| Notifications | `lib/notifications` | `supabase.functions.invoke('reservation-notification')` | Body: `{ reservationId, event }` |

---

## 9. Realtime & State Synchronization
- **Recruitment list**: Refreshed automatically on any recruitment table change.
- **Dashboard message previews**: Dashboard subscribes to reservation message inserts for confirmed reservations to surface latest message and unread badges.
- **Chat modal**: Subscribes per reservation while open; also polls every 10 seconds to avoid missed updates.
- Ensure RN app handles subscription cleanup to prevent memory leaks.

---

## 10. Validation & Error Handling Summary
- Form-level validation performed before submitting Supabase requests with localized Japanese error strings.
- API error messages mapped to user-friendly Japanese descriptions for known Supabase RPC errors (e.g., slot booked, deadline passed).
- `Spinner` components used during loading states (full-screen for blocking operations).
- Many actions rely on `window.alert`/`confirm`; RN rebuild should provide toast/dialog equivalents (e.g., `Alert` from `react-native` or a custom modal).

---

## 11. Known Issues & Gaps
- Menu filter on Top page includes `styling`, which is not present in `MenuType`; align options with `MENU_OPTIONS`.
- `students` table schema lacks `phone_number` column while front-end expects it. Confirm actual database schema and update accordingly.
- `/contact` route is referenced but not implemented.
- `supabase.auth.admin.deleteUser` cannot succeed with an anon key. Introduce a secure backend endpoint or Supabase Edge Function to mediate account deletion.
- Alerts and confirmations are blocking browser modals; the RN version will need non-blocking UI replacements.

---

## 12. React Native (Expo) Rebuild Considerations
- **Navigation**: Use React Navigation to mirror route structure (`/`, `/about`, `/faq`, `/login`, `/signup`, `/recruitment/:id`, `/dashboard`, `/terms`, `/privacy`, 404 equivalent).
- **State management**: Port existing hooks (`useAuth`, `useRecruitments`, `useReservations`) with minimal changes; ensure Supabase JS client is compatible with Expo (use `@supabase/supabase-js` with `expo` adapter if necessary).
- **Styling**: Translate CSS modules into RN StyleSheet or utility styling system; replicate brand colors, typography, and component spacing from existing classes.
- **Forms**: Replace HTML inputs/selects with RN components (`TextInput`, `Picker`, Switches). Maintain validation logic and error messaging.
- **Modals**: Reimplement `Modal` with React Native Modal or bottom sheet components; ensure scroll locking and keyboard avoidance.
- **Date/Time Picking**: Use `@react-native-community/datetimepicker` or equivalent to replace HTML date/time inputs while preserving JST conversion logic.
- **Alerts/Confirms**: Replace `window.alert`/`confirm` with native alerts or in-app modals/snackbars.
- **Realtime**: Supabase realtime is supported in RN; ensure WebSocket support is enabled (Expo SDK ≥ 49).
- **Chat**: Implement scrollable message list with auto-scroll to newest message; handle polling fallback if realtime is unreliable.
- **Accessibility & Internationalization**: Existing copy is Japanese; maintain language and include accessible labels where possible.
- **Offline Handling**: Current app assumes connectivity; RN version should gracefully handle network loss (at least via error toasts).
- **Push Notifications**: Not currently implemented; only email notifications exist. Optionally extend with Expo push if desired.

---

## 13. Testing & QA Checklist
- Validate signup/login for both roles, including metadata-driven profile creation.
- Ensure `.ac.jp` enforcement for student registration.
- Recruitment creation/edit edge cases:
  - Attempt to submit without menu selection or availability -> blocked.
  - Edit attempt to remove booked slot -> blocked.
  - Flexible schedule only -> allowed.
- Reservation flow:
  - Student selects slot -> reservation created, recruitment marked closed.
  - Student attempts booking within 48 hours -> receives error.
  - Salon confirms -> status updates, email triggered.
  - Student cancels before deadline -> slot reopens.
  - Salon cancels -> slot reopens, statuses propagate.
  - Chat initiated only after confirmation, unread badge shown to other party.
- Realtime updates: new recruitment appears on Top page without manual refresh; chat messages stream live.
- Account deletion removes reservations, recruitments, messages, and profile; user is signed out.
- Static pages load and navigation links work (handle `/contact` gracefully until implemented).

---

## 14. Glossary
- **Recruitment**: A salon-created post offering a hair model opportunity.
- **Reservation**: A student’s application to a recruitment. Becomes active once salon confirms.
- **Flexible schedule**: Text guidance when exact slots are not published; students can request chat-based scheduling.
- **Chat consultation**: Reservation without a predefined slot; used when flexible schedule text is provided.
- **Edge Function**: Supabase serverless function (`reservation-notification`) sending transactional emails based on reservation events.

---

This specification should serve as the authoritative guide for recreating Cutmo in React Native while preserving all current behaviors and addressing known issues where possible.
