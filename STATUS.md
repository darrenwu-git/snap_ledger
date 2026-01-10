# Project Status: snap ledger for easy tracking expenses

## 🧠 Project Preferences
- **Unit Testing**: Prioritize implementing server-side Unit Tests (Vitest) for logic-heavy features whenever possible to reduce reliance on manual browser testing.

## 🎯 Objective
Create a simple way to track expenses, likely "snap" implies quick/easy entry (maybe photo or quick text?).

## 🐛 Bug: -

## ✅ Status: In Progress
- ✅ Initial Research
- ✅ Core Implementation
- ✅ Backend Persistence (Supabase + Google Auth)
- ⬜ Data Migration (Local -> Cloud)
- ⬜ Photo/Image Input
- 🚧 Refinement & Polish

## 🔮 Future Roadmap / To-Do
- ✅ **Conflict Resolution (Last Modified Wins)**:
  - Add `updatedAt` timestamp to `Transaction` and `Category` data models.
  - Update `importData` logic to compare timestamps: if incoming `updatedAt` > local `updatedAt`, overwrite.
  - Crucial for robust multi-device sync or guest-mode backup/restore.

## 📅 Daily Updates

### 2026-01-09

- ✅ **Improved Test Coverage (Core & UI)**:
  - **Overall**: Achieved ~50% unit test coverage across the application.
  - **Service**: Added comprehensive tests for `VoiceParser` (API, Logic, Error scenarios).
  - **Contexts**: Verified `SettingsContext` persistence and `LedgerContext` (Cloud/Local sync, Import conflict resolution).
  - **UI**: Added robust tests for `TransactionForm` (CRUD, Category Mgmt) and `MonthlySummary` (Stats, Date Navigation).
  - **Configuration**: Enabled full coverage reporting in `vite.config.ts`.
- ✅ **Implemented Telemetry & Feedback**:
  - **Supabase Backend**: Added `feedback` and `analytics_events` tables with public insert policies.
  - **Privacy**: Implemented anonymous ID generation for guest users.
  - **Metrics**: Tracking `app_opened`, `transaction_created` (Voice vs Manual), and `category_created` (AI Auto-Create).
  - **Feedback UI**: Added "Feedback" option to User Menu and a dedicated Modal for collecting user thoughts.
  - **SQL**: Created `SUPABASE_TELEMETRY.sql` for easy migration.
- ✅ **Conflict Resolution (Restored & Verified)**:
  - Implemented Conflict Resolution (Last Modified Wins) for Guest Data Import.
  - Added `updatedAt` field to Transaction and Category models.
  - 📊 **Test Coverage Verification**:
  - `src/context/LedgerContext.tsx`: 37.62% Statement Coverage (focused on Import Logic).
  - Validated Conflict Resolution (Last Modified Wins), New Data Merge, and Auto-Category Creation.
  - Integration with Cloud Persistence (Supabase) remains to be fully covered by automated tests (relies on mocks).
- ✅ **Fixed Export Filename Issue (Robustness)**:
  - Replaced JavaScript-based "fake click" with a **native `<a>` tag** link.
  - Implemented **stable Blob URL generation** (using `useRef`) to prevent "Check internet connection" errors caused by premature revocation during re-renders.
  - Ensured filename `snap_ledger_backup_YYYY-MM-DD.json` is respected by browsers (specifically Chrome/Safari on macOS) by forcing `application/octet-stream` (optional) or just using proper native behavior.
- ↺ **Revert (Previous)**:
  - (Resolved) Reverted "Last Modified Wins" earlier due to bugs, now re-implemented and verified.
- ✅ **Fixed Delete Confirmation Dialog**:
  - Replaced native `window.confirm` with a custom in-UI confirmation to prevent auto-dismissal.
  - Improved UX with clear "Confirm / Cancel" options.

### 2026-01-10
- ✅ **Released v0.2.0**

- ✅ **Telemetry & Security**:
  - Implemented rate limiting and character limits for Feedback.
  - Added missing telemetry triggers (`app_opened`, `category_created`).
  - Fixed `category_name` in `transaction_created` telemetry (was logging "unknown" for auto-created categories).
  - Created `SUPABASE_FEEDBACK_SECURITY.sql` migration.
- ✅ **Fixed AI Auto-Create Categories (Guest Mode)**:
  - Enabled AI Auto-Category creation for Guest Mode (previously restricted to logged-in users).
  - Verified via regression testing (47/47 tests passed).
- ✅ **Refined Category Telemetry**:
  - Implemented `category_updated` event with detailed diff tracking (old vs new values).
  - Standardized property names (using `category_id` across events).
  - Fixed a Critical Bug where editing a newly created category failed to emit telemetry under specific conditions ("Create-then-Edit" flow).
- ✅ **Enable Mutable Default Categories**:
  - Migrated hardcoded defaults to deterministic UUIDs for Cloud Sync compatibility.
  - Merged defaults into mutable state, allowing users to rename/icon-swap "Food", "Transport", etc.
  - Updated `LedgerContext` to handle migration seamlessly.

- ✅ **Unit Tests (Telemetry)**:
  - Created `src/lib/analytics.test.ts` to verify `trackEvent` and `submitFeedback`.
  - Implemented comprehensive mocks for Supabase (`insert`, `auth`) and `localStorage` to validate logic in isolation.
  - Confirmed anonymous ID generation and user metadata attachment.
- ✅ **Enhanced Test Coverage**:
  - **LedgerContext**: Added Cloud Mode tests (mocking Supabase), increasing coverage to ~57%.
  - **TransactionForm**: Created comprehensive UI tests (Rendering, Submission, Validation, Deletion), coverage at ~48%.
  - **Configuration**: Enabled full coverage reporting in `vite.config.ts`.

### 2026-01-08
- ✅ UI Improvement: Renamed "Daily Transactions" to "Recent Transactions" for better clarity.
- ✅ Implemented "AI Auto-Create Category" feature.
  - Added "Settings" modal with toggle for auto-category creation.
  - Enhanced `VoiceParser` prompting to suggest new categories (name + icon) when enabled.
  - Updated `Dashboard` to orchestrate category creation before transaction insertion.
- ✅ Implemented "Edit Category" functionality.
  - Added pencil icon ✎ to custom categories in `TransactionForm`.
  - Added `updateCategory` to `LedgerContext` (handles local + supabase).
  - Allowed users to modify name and icon of custom categories.
- ✅ Refined Visuals.
  - Removed generic emoji from Monthly Summary chart.
  - Increased Pie Chart size and moved Total Expense info to the center for a premium dashboard look.
- ✅ Implemented Version Number Management.
  - Set initial version to `v0.1.0`.
  - Added "Version" display in the User Avatar dropdown.
- ✅ Fixed UI Alignment Bug.
  - Centered User Avatar image within its container (concentric alignment).
  - Enforced circular container shape and prevented image distortion.
- ✅ Implemented Date Picker Navigation.
  - Added popover interface to `MonthlySummary` for quick Month/Year selection.
  - Clickable date header opens the picker.
  - Supports quick year jumping and direct month selection.
  - **New**: Dedicated Year Grid when in Year View (allows direct year selection).
- ✅ Implemented Category Editing Flow (UI + Logic).
- ✅ Implemented Category Filtering.
  - Tapping a category icon in the transaction list filters the view to that specific category.
  - Added "Filtering by [Category]" indicator with a clear button.
  - Streamlines bulk editing/reviewing of specific transaction types (e.g., Uncategorized).
- ✅ Fixed Bug: Edit Transaction date field alignment.
  - Sanitized `TransactionForm` date initialization to remove timestamp components from ISO strings, ensuring compatibility with `input type="date"`.
- ✅ Implemented Guest Mode Warning Banner (Data Persistence Alert).
- ✅ Added "LOCAL" badge for non-logged-in users.
- ✅ Removed Settings Gear for guest users (simplified UI).
- ✅ Disabled Auto-Category Creation for guest users (default off).
  - ✅ Implemented Distinct 'Sign Up' vs 'Log In' UI (Both use Google OAuth).
  - ✅ Removed non-functional "Cloud Sync Active" indicator from User Menu.
- ✅ Implemented 'Today' Navigation.
  - Added a dedicated "Today" button in the `MonthlySummary` header.
  - Allows one-click return to the current date and month view.
- ✅ Security: Rotated API keys and removed env files from git tracking.
- ✅ Restricted Authentication & Minimalist Landing.
  - Replaced Email Allowlist with **Invitation Code System**.
  - Invitation code managed via `.env` (`VITE_INVITE_CODE`).
  - Prevents unauthorized users from even starting the OAuth flow.
  - Hides login button behind a "Gatekeeper" modal triggered by a discreet icon.
- ✅ Implemented Manual Data Backup (Export/Import).
  - Added "Settings" access for Guest Mode users.
  - Implemented JSON Export and "Merge" Import logic (preserves local edits).
  - Added Auto-Repair for missing categories during import.
  - Updated User Menu to be universal (Guest/User).
