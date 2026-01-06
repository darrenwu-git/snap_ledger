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
