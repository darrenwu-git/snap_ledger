# Project Status: snap ledger for easy tracking expenses

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

## 📅 Daily Updates

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


### 2026-01-07
- ✅ Fixed Critical Persistence Bug.
  - Diagnosed schema mismatch (Frontend `categoryId`/`note` vs Backend `category`/`description`).
  - Implemented bi-directional field mapping in `LedgerContext`.
  - Added "Rollback" logic for Optimistic Updates to prevent "Ghost Data".
  - Enhanced error handling in `Dashboard` and `TransactionForm` to notify users of sync failures.

### 2026-01-06
- ✅ Completed Backend Persistence.
  - Configured Supabase Client & Context.
  - Implemented Google OAuth (with user-provided Client ID).
  - Added "Cloud Mode" vs "Guest Mode" in `LedgerContext`.
- ✅ Fixed "stuck icon" bug in voice recording.
  - Added missing `@keyframes spin` to `index.css`.
  - Approved `gemini-2.5-flash` model.
  - Improved `VoiceInput` UX.
- ✅ Refined Auth & Dashboard UI.
  - Moved "Sign Out" to Avatar Dropdown (cleaner header).
  - Emphasized Voice Input as primary action (centered, larger).
  - De-emphasized manual Add button.

### 2026-01-05
- Created project.
