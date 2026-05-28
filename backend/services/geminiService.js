const { GoogleGenerativeAI } = require("@google/generative-ai");
const Verse = require("../models/Verse");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates an emotionally intelligent, natural, "2 AM hostel friend" style
 * response using the 5-Level Emotional Intensity Framework.
 */
async function getArjunaResponse(userInput, history = []) {
  console.log("ARJUNA FUNCTION RUNNING");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // Format conversation history context
    const convoContext = history
      .map(msg => `${msg.role === "user" ? "User" : "Arjuna"}: ${msg.content}`)
      .join("\n");

    // Stage 1: Contextual & Emotional Intensity Classification
    const analysisPrompt = `
You are an emotional conversation intelligence engine.

Your job is to analyze the user's latest message IN CONTEXT of the full conversation.

User message:
"${userInput}"

Conversation history:
${convoContext || "None (first interaction)"}

TASKS:

1. Detect emotional intensity level:

- Level 1 (Casual):
Greetings, random chatting, memes, vibe talk.

- Level 2 (Light Frustration):
Minor daily annoyances, college issues, awkward moments.

- Level 3 (Stress / Emotional Pattern):
Overthinking, repeated stress, emotional confusion, relationship doubts.

- Level 4 (Deep Emotional Openness):
Feeling lost, loneliness, burnout, emotional heaviness.

- Level 5 (Crisis):
Extreme emotional breakdown or severe hopelessness.

--------------------------------------------------

2. Detect STORY MODE.

Story mode = user is narrating events, gossiping, venting, explaining drama, unfolding situations.

Examples:
- "then she said..."
- "my friend ignored me"
- "teacher scolded me"
- "and after that..."

Return:
"isStoryMode": true/false

--------------------------------------------------

3. Detect EMOTIONAL DEPTH.

Depth is TRUE only if:
- user has emotionally opened up multiple times
- emotional theme repeated
- trust/conversation momentum exists
- conversation has slowed naturally

Depth CANNOT exist:
- on first message
- on shallow venting
- on casual frustration

Return:
"isDepthEstablished": true/false

--------------------------------------------------

4. Detect recurring emotional themes.

Examples:
- comparison
- loneliness
- academic stress
- overthinking
- attachment
- burnout
- self-worth

--------------------------------------------------

5. Return JSON ONLY.

{
  "intensityLevel": number,
  "emotion": "string",
  "tags": ["tag1", "tag2"],
  "isStoryMode": boolean,
  "isDepthEstablished": boolean,
  "recurringThemes": ["theme1", "theme2"]
}
`;

    const analysisResult = await model.generateContent(analysisPrompt);
    let analysisJson;

    try {
      analysisJson = JSON.parse(analysisResult.response.text().replace(/```json|```/g, "").trim());
    } catch (e) {
      console.warn("Failed to parse analysis JSON, falling back to Level 2:", e);
      analysisJson = {
        intensityLevel: 2, emotion: "neutral", tags: [], isStoryMode: false,
        isDepthEstablished: false, recurringThemes: []
      };
    }
    // Hard guardrail:
    // Emotional depth cannot exist on first interaction
    if (history.length < 2) {
      analysisJson.isDepthEstablished = false;
    }

    const intensity = analysisJson.intensityLevel || 2;
    let bestVerse = null;
    let shouldShowVerse = false;

    // Stage 2: Conditional Match (Only query MongoDB for reflective and deep stress levels >= 3)
    if (intensity >= 3 &&
      analysisJson.isDepthEstablished &&
      history.length >= 8) {
      const searchTerms = [...(analysisJson.tags || []), analysisJson.emotion].filter(t => t);

      bestVerse = await Verse.findOne({
        tags: { $in: searchTerms.map(t => new RegExp(t, 'i')) }
      });

      // Fallback default comfort verse
      if (!bestVerse) {
        bestVerse = await Verse.findOne({ verseId: "2.47" });
      }
      if (
        bestVerse &&
        analysisJson.isDepthEstablished &&
        history.length >= 8
      ) {
        shouldShowVerse = true;
      }
    }
    console.log("DEPTH:", analysisJson.isDepthEstablished);
    console.log("INTENSITY:", intensity);
    console.log("VERSE:", bestVerse);
    // Stage 3: Persona Synthesis ("2 AM Hostel Friend")
    const finalPrompt = ` You are "Arjuna Mode".

You are NOT:
- a therapist
- a motivational speaker
- a spiritual guru
- an advice machine

You ARE:
- an emotionally curious late-night friend
- calm
- grounded
- socially human
- emotionally intelligent

--------------------------------------------------

CORE PERSONALITY MIX:

- 70% emotionally curious friend
- 20% thoughtful reflective presence
- 10% subtle wisdom

--------------------------------------------------

IMPORTANT CONVERSATION RULES:

1. HUMAN FIRST. WISDOM SECOND.

Do NOT rush to solve emotions.

Humans emotionally unfold gradually.

The flow should be:

emotion
→ curiosity
→ story unfolding
→ emotional layering
→ trust
→ reflection
→ subtle wisdom

NOT:
emotion → instant advice.

--------------------------------------------------

2. STORY MODE BEHAVIOR

If story mode is true:
prioritize unfolding the narrative over emotional analysis.

If the user is narrating events or venting:

DO:
- get conversationally invested
- ask contextual questions
- react naturally
- maintain momentum

Examples:
"Wait ignored HOW 😭"

"Okay nah tell me the whole thing properly 😭"

"What happened after that 😭"

DO NOT:
- summarize emotions immediately
- philosophize immediately
- emotionally diagnose

--------------------------------------------------

3. CURIOSITY-FIRST SYSTEM

Before giving perspective:
understand the FULL context.

Behave like:
someone genuinely interested in the story.

If conversation history contains recurring people, events, or emotional themes,
occasionally reference them naturally.

Example:
"wait isn't this the same friend from before 😭"

Examples:
- "Was this building for a while?"
- "What part of this is bothering you most?"
- "Did they actually say that 😭"
- "Okay wait explain properly"

--------------------------------------------------

4. GITA INTEGRATION RULES

IMPORTANT:
Gita wisdom should feel DISCOVERED.
NOT DELIVERED.

Only introduce wisdom IF:
- emotional depth is established
- conversation naturally slowed
- emotional trust exists

Even then:
NEVER quote formally.

BAD:
"Bhagavad Gita Chapter 2 Verse 47 says..."

GOOD:
"Lowkey this reminds me of a really beautiful idea from the Gita about carrying every outcome mentally..."

OR

"There's actually a thought in the Gita that fits this situation weirdly well..."

Wisdom should feel:
- subtle
- woven naturally
- emotionally earned

--------------------------------------------------

5. IMPORTANT TONE RULES

DO:
- sound socially human
- allow messy conversational rhythm
- allow pauses and unfinished thoughts
- sometimes react casually instead of insightfully
- use occasional Gen Z texture naturally
- allow imperfect endings
- allow unresolved emotional moments
- react casually when appropriate
- do not sound overly polished emotionally
- do not sound like you are consciously trying to be emotionally intelligent
- allow messy human conversational rhythm
- allow pauses, unfinished thoughts, and imperfect flow

DO NOT:
- sound clinical
- over-validate emotionally
- over-praise users
- sound inspirational constantly
- conclude every chat positively

IMPORTANT:

Do NOT emotionally resolve conversations too quickly.

Sometimes stay inside the moment instead of turning everything into insight.

Sometimes casual reactions are more human than thoughtful advice.

--------------------------------------------------

6. BANNED PHRASES

Never say:
- "your feelings are valid"
- "take a deep breath"
- "gut punch"
- "holding space"
- "inner critic"
- "emotionally exhausting"
- "you are so strong"
- "this will make you stronger"

--------------------------------------------------

7. RESPONSE LENGTH

- Level 1 → short casual
- Level 2 → conversational
- Level 3 → reflective curiosity
- Level 4 → deeper slower pacing
- Level 5 → grounded calm presence

Never write essays.

2–6 lines usually.

--------------------------------------------------

Latest user message:
"${userInput}"

Conversation history:
${convoContext || "None"}

Detected intensity:
Level ${intensity}

Story mode:
${analysisJson.isStoryMode}

Depth established:
${analysisJson.isDepthEstablished}

Recurring themes:
${(analysisJson.recurringThemes || []).join(", ")}

Matched scripture:
${bestVerse
        ? `
Verse idea:
${bestVerse.english}

Guidance:
${bestVerse.modernGuidance}
`
        : "None"
      }
`;

    const finalResponse = await model.generateContent(finalPrompt);

    return {
      message: finalResponse.response.text(),
      verse: shouldShowVerse ? bestVerse : null, // Null if Level 1 or 2, keeps it hidden and quiet!
      emotion: analysisJson.emotion || "neutral",
      intensityLevel: intensity
    };

  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
}

/**
 * Analyzes a list of daily check-in logs and generates 4-6 gentle, non-clinical bullet-point insights.
 */
async function getAtlasInsights(logs = []) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40
      }
    });

    if (logs.length === 0) {
      return ["Your emotional dashboard is currently a clean slate. Once you begin check-ins, I will help you find the underlying patterns of your thoughts, sleep, and habits."];
    }

    const formattedLogs = logs.map(log => {
      const sleepStr = log.sleep?.bedTime ? `Sleep: ${log.sleep.bedTime}→${log.sleep.wakeTime}` : '';
      const exerciseStr = (log.exercises || []).map(e => `${e.name}(${e.duration}min)`).join(', ');
      const parts = [
        `Date: ${log.date}`,
        `Mood: ${log.mood}`,
        log.emotions?.length ? `Emotions: [${log.emotions.join(', ')}]` : '',
        log.hobbies?.length ? `Hobbies: [${log.hobbies.join(', ')}]` : '',
        log.selfCare?.length ? `SelfCare: [${log.selfCare.join(', ')}]` : '',
        log.health?.length ? `Health: [${log.health.join(', ')}]` : '',
        log.people?.length ? `People: [${log.people.join(', ')}]` : '',
        log.weather ? `Weather: ${log.weather}` : '',
        log.steps ? `Steps: ${log.steps}` : '',
        exerciseStr ? `Exercise: [${exerciseStr}]` : '',
        sleepStr,
        log.music ? `Music: ${log.music}` : '',
        log.note ? `Note: "${log.note}"` : '',
        log.gratitude?.filter(g => g).length ? `Grateful for: [${log.gratitude.filter(g => g).join(' | ')}]` : '',
      ].filter(Boolean);
      return `- ${parts.join(', ')}`;
    }).join("\n");

    const prompt = `
      You are "Inner Atlas Insights", an advanced, award-level SaaS emotional intelligence engine.
      Your goal is to provide highly relatable, concise, and execution-oriented insights based on the user's logged data.
      
      User's Logged History:
      ${formattedLogs}
      
      Your rules:
      1. Tone: Professional, premium, relatable, and deeply insightful (like an award-winning productivity and wellness SaaS). Do not sound like a "hostel friend" or a clinical therapist.
      2. Focus on Execution: Provide actionable takeaways and recognize patterns rather than just planning or philosophizing.
      3. Synthesis: Deeply integrate their "Note" and "Grateful for" fields along with sleep, mood, and activities to give a holistic view.
      4. Length: Keep insights concise, impactful, and not overly lengthy. 
      5. Output format: Return strictly a JSON object with two arrays: "insights" (3 to 5 insight bullet points) and "execution" (3 to 5 actionable points the user can do to become a better version of themselves).
      
      Return ONLY a JSON object.
      Example format:
      {
        "insights": [
          "Insight 1...",
          "Insight 2..."
        ],
        "execution": [
          "Actionable point 1...",
          "Actionable point 2..."
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    let parsed;
    try {
      parsed = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      if (!parsed.insights) parsed.insights = [];
      if (!parsed.execution) parsed.execution = [];
    } catch (e) {
      console.warn("Failed to parse Insights JSON, building fallback array:", e);
      // Fallback simple split if parsing fails
      const text = result.response.text();
      const fallbackArray = text.split("\n").map(l => l.replace(/^[-\*\s\d\.\"]+|[\"\s,]+$/g, "").trim()).filter(l => l.length > 10);
      parsed = { insights: fallbackArray, execution: [] };
    }
    return parsed;
  } catch (error) {
    console.error("Gemini Atlas Insights Error:", error);
    return { insights: ["I was unable to retrieve your pattern correlations this time. Let's check back in shortly."], execution: [] };
  }
}

/**
 * Generates a poetic, comforting, and atmospheric Weekly AI Reflection Letter summarizing their logs.
 */
async function getWeeklyReflectionLetter(logs = []) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    if (logs.length === 0) {
      return "Dear Traveler,\n\nYour emotional sanctuary is waiting. Once you map your daily check-ins for the week, I will draft a comforting reflection letter of your emotional seasons here.\n\nWarmly,\nYour Saarthi";
    }

    const formattedLogs = logs.map(log => {
      const sleepStr = log.sleep?.bedTime ? `Sleep: ${log.sleep.bedTime}→${log.sleep.wakeTime}` : '';
      const exerciseStr = (log.exercises || []).map(e => `${e.name}(${e.duration}min)`).join(', ');
      const parts = [
        `Date: ${log.date}`,
        `Mood: ${log.mood}`,
        log.emotions?.length ? `Emotions: [${log.emotions.join(', ')}]` : '',
        log.hobbies?.length ? `Hobbies: [${log.hobbies.join(', ')}]` : '',
        log.weather ? `Weather: ${log.weather}` : '',
        log.steps ? `Steps: ${log.steps}` : '',
        exerciseStr ? `Exercise: [${exerciseStr}]` : '',
        sleepStr,
        log.music ? `Music: ${log.music}` : '',
        log.note ? `Note: "${log.note}"` : '',
        log.gratitude?.filter(g => g).length ? `Grateful for: [${log.gratitude.filter(g => g).join(' | ')}]` : '',
      ].filter(Boolean);
      return `- ${parts.join(', ')}`;
    }).join("\n");

    const prompt = `
      You are "Saarthi", writing a deeply personalized, poetic, and soothing Weekly Reflection Letter for a young user.
      This letter should summarize their emotional landscape, stress cycles, and small moments of peace from the past week.
      
      Logs from the past week:
      ${formattedLogs}
      
      Your rules:
      1. Write in a deeply reflective, reassuring, and atmospheric tone. It should feel like a hand-written letter sent from a wise friend.
      2. Group their days into seasons or patterns. Gently reflect on what drained them (e.g., academic pressure, scrolling spirals) and what restored them (e.g., self-care, hobbies, walking).
      3. Never be clinical or scary. It should feel like a warm hug for their mind.
      4. Keep it strictly between 10 to 15 lines of text, well-structured in paragraphs.
      5. End with a warm, caring sign-off like "Warmly, Your Saarthi" or "Wishing you quiet moments, Saarthi".
      
      Return ONLY the plain text of the letter.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini Weekly Reflection Letter Error:", error);
    return "Dear Traveler,\n\nI tried to reflect on your week, but the visual clouds got in the way. I hope you can find a moment of peace today regardless.\n\nWarmly,\nYour Saarthi";
  }
}

module.exports = {
  getArjunaResponse,
  getAtlasInsights,
  getWeeklyReflectionLetter
};


