# Re.Mind: Your Digital Sanctuary

Re.Mind is an emotionally intelligent, AI-supported web application designed as an antidote to digital noise. Instead of endless scrolling, complicated journaling, or clinical therapy interfaces, Re.Mind offers a deliberately slow, quiet space to help users lower their cortisol, foster self-awareness, and process their emotional landscape without judgment.

Built primarily for Gen Z and young adults, Re.Mind blends modern psychology, deep emotional tracking, and the subtle, timeless wisdom of the Bhagavad Gita into a beautifully minimalist aesthetic.

---

## The Four Pathways

Re.Mind offers four distinct pathways to support your mental wellness journey:

### 1. Arjuna Mode (The 2 AM Friend)
Arjuna Mode is a text-based, highly empathetic journaling companion. It acts like a grounded friend who listens first, analyzes your emotional state using a custom **5-Level Emotional Intensity Framework**, and helps you untangle your thoughts. It does not rush to "fix" you; instead, it holds space for your feelings and naturally weaves in subtle ancient wisdom when the moment is right.

### 2. Saarthi AI (The Vocal Guide)
Sometimes, typing takes too much effort when your mind is racing. Saarthi is an advanced conversational AI designed for real-time emotional processing through voice. You can speak your mind aloud, and Saarthi responds with a comforting, synthesized voice—guiding you through anxiety, overthinking, or loneliness through organic, human-like conversation.

### 3. Inner Atlas (The Emotional Map)
Inner Atlas is a rich daily tracker that connects your sleep, habits, daily events, and emotions. As you log your days, the Re.Mind AI engine works in the background to discover hidden patterns (e.g., how a lack of sleep affects your specific anxieties). Inner Atlas provides actionable insights and generates a poetic, comforting Weekly Reflection Letter summarizing your emotional seasons.

### 4. The Sanctuary (Calm Space)
A dedicated, distraction-free environment for mindfulness. The Sanctuary offers ambient nature soundscapes (Rainfall, Deep Forest, Soft Wind) and a serene meditation timer. When you complete a meditation session, it safely and automatically syncs your peaceful minutes directly into your Inner Atlas log for the day.

---

## Design & UI Philosophy

Re.Mind completely strips away the "corporate SaaS" aesthetic. You will not find heavy borders, cluttered dashboards, or clinical textbook paragraphs. 

- **Aesthetics**: Ultra-minimalist, typography-focused layouts.
- **Color Palette**: Calming, earthy tones (`brand-forest`, `brand-sage`, `brand-peach`, soft cream backgrounds).
- **Interactions**: Smooth, slow animations using Framer Motion that respect the user's nervous system.
- **Tone**: Socially human, naturally curious, warm, and poetic.

---

## Tech Stack

**Frontend:**
- React 18 / Next.js (App Router)
- Tailwind CSS (Custom thematic design system)
- Framer Motion (Fluid UI transitions)
- Lucide React (Minimalist iconography)

**Backend:**
- Node.js & Express
- MongoDB / Mongoose (Storing emotional logs, insights, and Bhagavad Gita verses)
- Google Gemini AI (`gemini-3.1-flash-lite` for conversational and poetic generation, `gemini-2.5-flash` for complex pattern synthesis)

---

## Getting Started

To run the project locally, you will need to start both the backend and frontend servers.

### 1. Backend Setup
1. Navigate to the `backend/` directory.
2. Ensure you have your `.env` file set up with your MongoDB URI and Gemini API Key:
   ```env
   MONGO_URI=your_mongo_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   PORT=5000
   ```
3. Run `npm install`
4. Run `npm run dev`

### 2. Frontend Setup
1. Navigate to the `frontend/` directory.
2. Ensure you have your `.env.local` set up to point to the backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
3. Run `npm install`
4. Run `npm run dev`

Navigate to `http://localhost:3000` to enter the sanctuary.