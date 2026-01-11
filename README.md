# Snap Ledger

![Version](https://img.shields.io/badge/version-v0.2.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-success)

Snap Ledger is a **premium, mobile-first expense tracking application** designed to reduce the friction of manual data entry. By leveraging AI-driven voice input and smart auto-categorization, it allows users to capture financial transactions in seconds.

The application is built with a **Hybrid Persistence** architecture, ensuring users can track expenses seamlessly whether they are offline (Local Storage) or online (Supabase Cloud Sync).

## 🚀 Key Features

*   **🎙️ AI Voice Input**: Speak your expenses naturally (e.g., "Spent 15 dollars on coffee"). The integrated Google Gemini AI parses the audio to extract the amount, category, and notes automatically.
*   **🧠 Auto-Categorization**: The AI automatically suggests icons and categories for new types of expenses, learning from your input patterns.
*   **💾 Hybrid Persistence**:
    *   **Cloud Mode**: Syncs data securely with Supabase when logged in via Google OAuth.
    *   **Guest Mode**: Fully functional offline mode using Local Storage for privacy-conscious or unauthenticated users.
    *   **Optimistic UI**: Instant feedback on actions with background synchronization and rollback protection.
*   **📊 Interactive Visualizations**:
    *   Beautiful, centered donut charts powered by Recharts.
    *   Dynamic time filtering (Recent Transactions vs. Monthly/Yearly Summaries).
*   **🎨 Premium Mobile-First Design**:
    *   Sleek Dark Mode aesthetics.
    *   Glassmorphism effects and smooth micro-interactions.
    *   Responsive layout optimized for touch devices.

## 🛠️ Technology Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Vanilla CSS (Variables, Flexbox/Grid) for a lightweight, custom design system.
*   **AI Integration**: Google Gemini 2.5 Flash Model (via AI Builder Space API / Custom Integration).
*   **Backend/Database**: Supabase (PostgreSQL) for cloud storage and real-time subscription.
*   **Authentication**: Google OAuth (via Supabase Auth).
*   **Icons**: Google Material Symbols.

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/darrenwu-git/snap_ledger.git
    cd snap_ledger
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory (based on `.env.example` if available) and add your keys:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
    VITE_BUILDER_API_KEY=your_gemini_api_key
    ```
    *(Note: `.env` files are git-ignored for security)*

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:4173` (standardized port).

## 🚀 Deployment Strategy
*   **Production**: The ONLY remote deployment is **`snap-ledger`** (Koyeb).
*   **Trigger**: Deployment is triggered via `npm run deploy` (which enforces service name).
*   **Rules**:
    *   **NEVER** deploy to `snap-ledger-production` or other aliases.
    *   **ALWAYS** use `localhost:4173` for development.

## 🛡️ Privacy & Security

*   **Data Ownership**: In Guest Mode, all data resides solely on your device's browser.
*   **Secure Cloud**: In Cloud Mode, data is protected by Supabase's Row Level Security (RLS) policies, customized to your Google User ID.
*   **API Security**: Sensitive keys are kept out of source control.

## 🤝 Contributing

This is a personal project. Concepts and patterns are based on the "Mind OS" agentic workflow documentation.

## 📝 License

[MIT](LICENSE)

