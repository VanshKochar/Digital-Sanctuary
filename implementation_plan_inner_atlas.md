# Implementation Plan: Inner Atlas (AI-Powered Emotional Reflection & Pattern Intelligence)

This implementation plan details the architectural and functional steps to build **Inner Atlas**, a completely separate premium ecosystem inside Digital Sanctuary. It is a visual, low-friction, AI-powered emotional self-awareness system inspired by visual journaling but elevated with deep emotional pattern insights, weekly reflection letters, and atmospheric visualizations.

## User Review Required

> [!IMPORTANT]
> **Core Architectural Alignment:**
> 1. **MongoDB Connection:** All daily check-ins and logs will be stored in a new Mongoose collection (`atlas_logs`) in the connected MongoDB instance.
> 2. **AI Engine integration:** The pattern detection and weekly letters will be powered by the `gemini-3.1-flash-lite` model, using a custom-tailored persona that is gentle, observational, and completely non-clinical.
> 3. **Design Framework:** We will build this page in React/Next.js using standard HSL design values (lotus pink, foggy blue, muted lavender) and Framer Motion transitions.

---

## Proposed Changes

### 1. Database Layer (Mongoose)

#### [NEW] [AtlasLog.js](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/backend/models/AtlasLog.js)
Define a new mongoose schema for logging daily emotional and activity logs.
- `userId` / `sessionId`: String (for session continuity/memory alignment)
- `date`: String (format `YYYY-MM-DD` for unique daily logging)
- `mood`: String (one of the 12 custom emotional states, e.g., `mentally crowded`, `peaceful`, `drifting`, etc.)
- `activities`: [String] (quick-tap tags list)
- `note`: String (optional tiny journal text)
- `timestamp`: Date

---

### 2. Backend API Services & Routes (Express)

#### [NEW] [atlasRoutes.js](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/backend/routes/atlasRoutes.js)
Define Express endpoints for logging and fetching.
- `POST /api/inner-atlas/log`: Save or overwrite a user's daily check-in.
- `GET /api/inner-atlas/logs`: Retrieve all history records for emotional visualizations.
- `GET /api/inner-atlas/insights`: Connect to Gemini AI. Read the entire log history, analyze correlations (e.g., late-night scrolling vs. heavy mood, sleep vs. calmness), and compile gentle, observational, and reflective bullet-points.
- `GET /api/inner-atlas/weekly`: Connect to Gemini AI. Read logs from the last 7 days and generate a beautiful, poetic, and atmospheric reflection letter summarizing their emotional landscape.

#### [MODIFY] [index.js](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/backend/index.js)
- Import and mount the `atlasRoutes` router at path `/api/inner-atlas`.

---

### 3. Frontend Pages & Navigation (React/Next.js)

#### [NEW] [inner-atlas/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/app/inner-atlas/page.tsx)
Build a visually stunning, premium dashboard for Inner Atlas:
1. **Daily Check-in Section:**
   - Visual emotional grid displaying the 12 custom states: `mentally crowded`, `drifting`, `peaceful`, `emotionally heavy`, `socially drained`, `hopeful`, `grounded`, `numb`, `overwhelmed`, `refreshed`, `calm waters`, `overthinking`.
2. **Quick Tap Logging Panel:**
   - Grid of 18 life categories (hobbies, relationships, sleep, weather, etc.) with soft hover feedback and micro-animations.
3. **Optional Journal Note:**
   - Expandable minimalist input area for entering short reflections.
4. **Visual Report Universe:**
   - Atmospheric glowing calendar heatmap of previous moods.
   - Dynamic **Mood River / Weather Timeline** showing the transitions of emotional energy over time using CSS gradients and smooth SVG timelines.
5. **AI Insight Panel:**
   - Floating glassmorphic panel presenting live-fetched emotional correlations and patterns.
6. **Weekly Reflection Letter:**
   - Highly aesthetic letter overlay that reveals the generated poetic AI letter with soft-reveal transitions.

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/components/Sidebar.tsx)
- Reconfigure the Navigation block to support three main sections: **Arjuna Chat**, **Saarthi Voice**, and **Inner Atlas** in a clean grid.

#### [MODIFY] [page.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/app/page.tsx)
- Add a secondary navigation button for `🗺️ Inner Atlas` side-by-side with `🎙️ Saarthi AI (Voice)`.

---

## Verification Plan

### Automated & Manual Verification
1. **Daily Log Saving:** Verify that posting a check-in writes a clean record into MongoDB and instantly updates the visual timeline.
2. **Gemini Pattern Analysis:** Verify that requesting insights correctly parses the entire history, outputs the 5-Level non-clinical persona, and detects correlations like sleep patterns or activity effects.
3. **Weekly Letters:** Verify that the weekly summary generates a poetic, reassuring letter when 7 days of logs are present.
4. **Visual Responsiveness:** Test responsive layouts, interactive quick-taps, and animations on both desktop and simulated mobile screens.
5. **Reduced Motion:** Ensure all visual timeline or orb animations fall back gracefully if the user prefers reduced motion.
