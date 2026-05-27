Implementation Plan - Re.Mind Frontend Redesign

Complete redesign of the frontend application to match the new **Re.Mind** brand identity and the Figma mockups (`image_1.png`, `image_2.png`, `Image_3.png`), without touching the backend code.

## User Review Required

> [!IMPORTANT]
> **Key Architecture Decisions:**
> 1. **New Route `/arjuna`:** We will move the existing homepage chat interface (Arjuna Mode) to a dedicated route at `/arjuna/page.tsx`. This keeps the homepage `/` purely as the main landing page with 3 options as requested: Arjuna Mode, Saarthi AI, and Inner Atlas.
> 2. **Mascots Implementation:** We will implement a custom `Mascot` component in Next.js that extracts each of the 4 characters from `Image_3.png` using a responsive CSS sprite/sheet approach. This keeps the asset weight low while implementing the illustrations pixel-perfectly.
> 3. **The Theme Shift:** The theme will transition from the soft warm-cream "Sacred Minimalism" to the high-contrast vibrant royal-blue gradient theme (`#1C3BB6` to `#1456C4`) with neon-pink (`#EE12B3`) and yellow (`#E6E241`) elements shown in the public images.

## Open Questions

> [!NOTE]
> There are no major blockages, but we have designed fallback mappings for any old user logs in the database. When loading history in the new 5-cat scale, any previous 12-cat mood values (like "loved", "tired", "anxious") will map to the closest corresponding 5-cat level.

---

## Proposed Changes

### Global Styling and Theme Configuration

#### [MODIFY] [globals.css](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/app/globals.css)
- Replace base theme variables to implement the royal-blue color scheme.
- Define CSS custom variables for easy theme support:
  - `--color-brand-blue-deep: #1456C4`
  - `--color-brand-blue-mid: #1C3BB6`
  - `--color-brand-blue-light: #3E7BDF`
  - `--color-brand-pink: #EE12B3`
  - `--color-brand-yellow: #E6E241`
- Integrate standard 8px grid sizing variables and layouts.
- Add utility class `glass-card` for high-impact semi-transparent white boxes with crisp white borders.
- Set global font pairing: `Outfit` (or `Space Grotesk`) for headings and `Inter` for body copy.

#### [MODIFY] [layout.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/app/layout.tsx)
- Rebrand the site metadata title to `"Re.Mind | Digital Sanctuary"`.
- Import the new Google Fonts `Outfit` and `Inter` using `next/font/google`.

---

### Home Page Redesign

#### [MODIFY] [page.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/app/page.tsx)
- Rebuild the landing page as a high-impact dashboard matching the navbar and illustrations of `image_1.png`.
- Show a header with:
  - `"Re.Mind"` bold typography logo.
  - Interactive navigation links: "Arjuna Mode", "Saarthi AI", "Inner Atlas".
  - A solid white action button styled as `"Get Matched"` / `"Open Sanctuary"`.
- Render the beautiful grouped mascots and symbols from `image_1.png` floating dynamically in the background or hero block.
- Feature three prominent cards representing the modules:
  1. **Arjuna Mode** - Wise textual AI companion (Mascot 4 - prayer pose).
  2. **Saarthi AI** - Real-time AI voice sanctuary (Mascot 1 - active waving pose).
  3. **Inner Atlas** - Emotional mapping calendar & logs (Mascot 3 - traveler pose).
- Implement background with a rich radial gradient from `#3E7BDF` to `#1456C4`.

#### [NEW] [Mascot.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/components/Mascot.tsx)
- A new reusable React component that displays a single cropped character from the horizontal sheet `/Image_3.png` using percentage-based positioning.
- Handled with support for `prefers-reduced-motion` for accessibility.

---

### Arjuna Mode Route Creation

#### [NEW] [arjuna/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/app/arjuna/page.tsx)
- Create a dedicated page for the Arjuna Mode chat dialogs.
- Move the chat and sidebar logic from the old home page.
- Apply the new royal blue styling to the chat bubble, sidebars, and input field, giving it a premium glassmorphic feel.

---

### Inner Atlas Page Updates

#### [MODIFY] [inner-atlas/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/app/inner-atlas/page.tsx)
- **Mood Scale Refactoring:**
  - Change `KITTEN_MOODS` to contain exactly 5 moods (Awful 😿, Bad 😾, Okay 🐱, Good 😸, Excellent 😻).
  - Add compatibility mapper `getMoodConfig(moodId)` to map old MongoDB database entries gracefully to the new 5-cat levels.
- **Hobbies Array:**
  - Add `{ id: "meditation", label: "Meditation", emoji: "🧘" }` to `HOBBIES`.
- **Analytics Modifications:**
  - In `frequent activities`, filter out any items from the `selfCare` category and restrict the results to the top 3 items using `.slice(0, 3)`.
  - In `favourite exercises`, display the most frequent exercise.
- **Sleep Analysis Graph:**
  - Design a custom, responsive SVG-based sleep bar graph inside the analytics section that shows sleep hours for the last 7 entries with animate-up bars.
- **Dashboard Button Toggle:**
  - Add a large `"Dashboard"` button at the bottom of the page.
  - Hide the AI Insights and Patterns analytics section by default.
  - When the user clicks `"Dashboard"`, reveal the analytics drawer/panel in a beautiful slide-up glass container.
- **Visual Overhaul:**
  - Replace the background with the new royal-blue gradient, and update all card structures, buttons, and calendar cell outlines to match the mockup designs.

---

### Saarthi AI Page Updates

#### [MODIFY] [saarthi/page.tsx](file:///c:/Users/hp/OneDrive/Desktop/MENTAL%20WELLNESS/frontend/src/app/saarthi/page.tsx)
- Restyle the voice calling interface using the rich royal-blue gradient background.
- Customize the central voice indicator/halos with neon-pink and golden glowing gradient rings.
- Apply the new geometric headers, rounded border controls, and glassmorphic dialog logs.

---

## Verification Plan

### Automated & Manual Tests
1. **Compilation Check:** Proactively run `npm run build` in the `frontend` workspace directory to ensure there are no TypeScript or compilation errors.
2. **Interactive Validation:** Open the application locally (running on port 3000) and verify:
   - The homepage redirects correctly to each of the three modes.
   - The `/arjuna` chat works as expected and retrieves historical sessions.
   - The `Inner Atlas` mood check-in shows exactly 5 cat selectors, includes "Meditation", and submits logs correctly to the backend database.
   - The "Dashboard" button collapses/expands the insights and graphs section properly.
   - The custom SVG sleep analysis graph displays durations correctly.
   - All animations adapt when system-reduced-motion is enabled.
