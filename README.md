# EcoTrack – Personal Carbon Footprint Tracker

EcoTrack is a modern web application designed to help users monitor, analyze, and offset their daily carbon footprint. 

---

## Technical Architecture

### Frontend
- **React.js + Vite**: A lightning-fast development server running on port **5173**.
- **React Router**: For client-side routing (Dashboard, Logger, History, Suggestions, Profile, Auth).
- **Context API**: Handles global states for authentication sessions and light/dark themes.
- **Axios**: Custom configured instances with token-interceptor headers.
- **Chart.js + react-chartjs-2**: Renders responsive daily emissions lines and category stack bar graphs.
- **Canvas-Confetti**: Unlocks animations upon achievement completions.
- **Lucide Icons**: Renders beautiful UI indicators.

### Backend
- **Flask (Python)**: Serving API endpoints on port **5000**.
- **Dual Database Mode (Firestore / SQLite Fallback)**:
  - If Firebase parameters (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are present in `.env`, the backend connects to **Firebase Firestore** and validates login via the **Firebase Client Auth REST API**.
  - If they are missing, it automatically creates and targets a local database (`ecotrack_local.db`), hashes passwords locally, and issues standard JWT tokens.
- **External Integration Services**:
  - **Carbon Interface API**: Resolves vehicle calculations (with dynamic local fallback values).
  - **Groq API**: Queries `llama-3.3-70b-versatile` for recommendations (with profile-based context fallbacks).
- **ReportLab PDF Generator**: Compiles metrics, charts, and recommendations into styled PDF files.

---

## Quick Start Setup

### Step 1: Run Backend API
Navigate to the `backend` folder, install requirements, and start the Flask application:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Note: If no `.env` credentials are set, the server will output a console notification confirming it is running in local SQLite fallback mode.*

### Step 2: Run React Frontend
Open a new terminal tab, navigate to the `frontend` folder, install Node packages, and launch Vite:
```bash
cd frontend
npm install
npm run dev
```

The application will launch on **http://localhost:5173**.

---

## Key Features

1. **Daily Carbon Dashboard**: Large SVG Dial indicating emission limits, streak status, and logged checklists.
2. **Multi-Step Habit Logger**: Multi-step wizard logging travel (km, passengers, vehicle mode), food (diet types, food waste triggers), and utilities (kWh, gas, renewables).
3. **Analytics Console**: Range filters, 7-day average metrics, lowest/highest carbon records, stacked category bars, and printable PDF downloads.
4. **Activity Heatmap**: A GitHub contribution grid showing unlogged, low, medium, and high carbon days.
5. **AI Suggestions page**: Tailored tips with lifestyle swaps and estimated carbon savings.
6. **Badge Achievements**: Automatic detection and award pops for First Log, Streaks, and Green Travelers.
