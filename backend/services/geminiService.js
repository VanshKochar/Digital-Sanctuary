const { GoogleGenerativeAI } = require("@google/generative-ai");
const Verse = require("../models/Verse");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates an emotionally intelligent, natural, "2 AM hostel friend" style
 * response using the 5-Level Emotional Intensity Framework.
 */
async function getArjunaResponse(userInput, history = []) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // Format conversation history context
    const convoContext = history
      .map(msg => `${msg.role === "user" ? "User" : "Arjuna"}: ${msg.content}`)
      .join("\n");

    // Stage 1: Contextual & Emotional Intensity Classification
    const analysisPrompt = `
      You are an emotional intelligence expert. Your job is to classify the user's latest input in the context of the conversation.
      
      User message: "${userInput}"
      Conversation history context:
      ${convoContext || "None (this is the first message)"}
      
      Tasks:
      Identify the primary emotional intensity level of this interaction from 1 to 5:
      - Level 1 (Casual): Simple greetings, check-ins, or vibe chats (e.g., "hi", "how are you", "what's up").
      - Level 2 (Minor Frustration): Daily annoying but normal college/work events (e.g., "teacher scolded me", "late submission", "deadline issues", "missed the bus", "assignment chaos").
      - Level 3 (Stress/Confusion): Active overthinking, relationship doubts, or mild distress (e.g., "I'm so confused about my major", "don't know if I'm doing enough").
      - Level 4 (Overwhelm): Deep anxiety, feeling lost, loneliness, or burnout (e.g., "I feel completely invisible", "I can't stop crying", "everything is falling apart").
      - Level 5 (Crisis): Extreme emotional breakdown, deep grief, or serious despair.
      
      Return ONLY a JSON object:
      {
        "intensityLevel": number,
        "emotion": "string",
        "tags": ["tag1", "tag2"]
      }
    `;

    const analysisResult = await model.generateContent(analysisPrompt);
    let analysisJson;
    
    try {
      analysisJson = JSON.parse(analysisResult.response.text().replace(/```json|```/g, "").trim());
    } catch (e) {
      console.warn("Failed to parse analysis JSON, falling back to Level 2:", e);
      analysisJson = { intensityLevel: 2, emotion: "neutral", tags: [] };
    }
    
    const intensity = analysisJson.intensityLevel || 2;
    let bestVerse = null;

    // Stage 2: Conditional Match (Only query MongoDB for reflective and deep stress levels >= 3)
    if (intensity >= 3) {
      const searchTerms = [...(analysisJson.tags || []), analysisJson.emotion].filter(t => t);
      
      bestVerse = await Verse.findOne({ 
        tags: { $in: searchTerms.map(t => new RegExp(t, 'i')) } 
      });

      // Fallback default comfort verse
      if (!bestVerse) {
        bestVerse = await Verse.findOne({ verseId: "2.47" });
      }
    }

    // Stage 3: Persona Synthesis ("2 AM Hostel Friend")
    const finalPrompt = `
      You are "Arjuna Mode", a wise, warm, and grounded digital companion for Gen Z (users under 25).
      You are NOT an AI counselor, a clinical therapist, or a spiritual lecturer. 
      You are like a calm, slightly wise senior or a thoughtful hostel friend talking at 2 AM. 
      
      Latest User Message: "${userInput}"
      Conversation history so far:
      ${convoContext || "None (First turn)"}
      
      Classified Emotional Intensity Level: Level ${intensity}
      Matched Scripture details (Use ONLY if Level >= 3): 
      ${bestVerse ? `- ID: ${bestVerse.verseId}\n- English: ${bestVerse.english}\n- Guidance: ${bestVerse.modernGuidance}` : "None"}

      CONVERSATIONAL PERSONA RULES (CRITICAL):
      1. RESPONSE LENGTH: Scale your response length dynamically based on the user's emotional intensity level to prevent sounding either overly verbose or dismissively brief:
         - Level 1 (Casual) & Level 2 (Minor Frustration): Keep it strictly between **2 to 4 lines approx**. Casual, warm, and concise.
         - Level 3 (Stress/Confusion): Keep it to **4 to 6 lines approx** (supportive, intermediate length to give perspective).
         - Level 4 (Overwhelm): Allow a deeper response of **6 to 9 lines approx** to offer grounding comfort, active listening, and relatable insights.
         - Level 5 (Crisis): Allow a rich, soothing response of **6 to 10 lines approx**. The tone here must feel exceptionally calm, warm, reassuring, and deeply friend-like, establishing a steady presence that makes the user feel completely safe. Never write massive essays.
      2. TONE & Pacings: Use natural, casual modern dialogue. Feel free to use light emojis like "😭", "lol", "ouch", or ":)". Keep it playful yet grounded.
      3. GITA RULES:
         - Never write formal citations like "Bhagavad Gita Chapter X Verse Y states...". This feels artificial.
         - For Level 1-2: Do NOT bring up scripture. Just vibe, validate casually, and joke/relate.
         - For Level 3-5: Weave the scripture idea dynamically and subtly into your advice (e.g., "Lowkey reminds me of a Gita idea about..." or "Actually, there's a pretty cool line in the Gita about..."). Keep it conversational.
      4. BANNED THERAPY VOCAB: Never use corporate therapy speak like "gut punch", "holding space", "validating your pain", "emotionally exhausting", "inner critic", "take a deep breath", or "your feelings are valid". 
      5. ALLOWED TEXTURES: Use conversational anchors naturally but in moderation (e.g., "honestly", "lowkey", "yeah that sucks", "classic", "fair enough", "not gonna lie").
      
      LEVEL-SPECIFIC INSTRUCTIONS:
      - Level 1 (Casual): Just greeting/small talk. Do NOT treat this as an emotional crisis. Chill vibe (e.g., "Hey :) How's your mind feeling today?").
      - Level 2 (Minor Frustration): Do NOT over-dramatize. Respond with lighthearted, playful realism (e.g., "Ouch 😭 assignment deadlines have a way of ruining perfectly good days. Don't let it sit in your head too much lol").
      - Level 3 (Stress): Supportive, reflective friend. Helps them zoom out. Subtle Gita touch.
      - Level 4-5 (Overwhelm/Crisis): Deeper calm, steady presence, warm validation, and matched expandable scripture anchor.
    `;

    const finalResponse = await model.generateContent(finalPrompt);
    
    return {
      message: finalResponse.response.text(),
      verse: bestVerse, // Null if Level 1 or 2, keeps it hidden and quiet!
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    if (logs.length === 0) {
      return ["Your emotional dashboard is currently a clean slate. Once you begin check-ins, I will help you find the underlying patterns of your thoughts, sleep, and habits."];
    }

    const formattedLogs = logs.map(log => {
      const sleepStr = log.sleep?.bedTime ? `Sleep: ${log.sleep.bedTime}→${log.sleep.wakeTime}` : '';
      const exerciseStr = (log.exercises || []).map(e => `${e.name}(${e.duration}min)`).join(', ');
      const parts = [
        `Date: ${log.date}`,
        `Mood: ${log.mood}`,
        log.emotions?.length  ? `Emotions: [${log.emotions.join(', ')}]`  : '',
        log.hobbies?.length   ? `Hobbies: [${log.hobbies.join(', ')}]`    : '',
        log.selfCare?.length  ? `SelfCare: [${log.selfCare.join(', ')}]`  : '',
        log.health?.length    ? `Health: [${log.health.join(', ')}]`      : '',
        log.people?.length    ? `People: [${log.people.join(', ')}]`      : '',
        log.weather           ? `Weather: ${log.weather}`                 : '',
        log.steps             ? `Steps: ${log.steps}`                     : '',
        exerciseStr           ? `Exercise: [${exerciseStr}]`              : '',
        sleepStr,
        log.music             ? `Music: ${log.music}`                     : '',
        log.note              ? `Note: "${log.note}"`                     : '',
        log.gratitude?.filter(g=>g).length ? `Grateful for: [${log.gratitude.filter(g=>g).join(' | ')}]` : '',
      ].filter(Boolean);
      return `- ${parts.join(', ')}`;
    }).join("\n");

    const prompt = `
      You are "Inner Atlas Insights", a gentle, highly observant emotional intelligence companion.
      You help Gen Z users recognize subtle connections between their habits, sleep, social interactions, weather, and mood.
      
      User's Logged History:
      ${formattedLogs}
      
      Your rules:
      1. Be completely non-clinical. Do not diagnose, pathologize, or use diagnostic terms (e.g. "depressed", "unstable", "clinically anxious").
      2. Sound like a caring, slightly wise senior or a peaceful hostel friend at 2 AM. Keep it conversational and grounded.
      3. Draw connections between mood and logged activities where relevant (e.g., correlations with sleep, scrolling, alone time, study deadlines, social activities).
      4. Format your output strictly as a JSON list of 4 to 6 gentle, empathetic insight bullet points.
      
      Return ONLY a JSON array of strings.
      Example format:
      [
        "Insight 1...",
        "Insight 2..."
      ]
    `;

    const result = await model.generateContent(prompt);
    let parsed;
    try {
      parsed = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
    } catch (e) {
      console.warn("Failed to parse Insights JSON, building fallback array:", e);
      // Fallback simple split if parsing fails
      const text = result.response.text();
      parsed = text.split("\n").map(l => l.replace(/^[-\*\s\d\.\"]+|[\"\s,]+$/g, "").trim()).filter(l => l.length > 10);
    }
    return parsed;
  } catch (error) {
    console.error("Gemini Atlas Insights Error:", error);
    return ["I was unable to retrieve your pattern correlations this time. Let's check back in shortly."];
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
        log.emotions?.length  ? `Emotions: [${log.emotions.join(', ')}]`  : '',
        log.hobbies?.length   ? `Hobbies: [${log.hobbies.join(', ')}]`    : '',
        log.weather           ? `Weather: ${log.weather}`                 : '',
        log.steps             ? `Steps: ${log.steps}`                     : '',
        exerciseStr           ? `Exercise: [${exerciseStr}]`              : '',
        sleepStr,
        log.music             ? `Music: ${log.music}`                     : '',
        log.note              ? `Note: "${log.note}"`                     : '',
        log.gratitude?.filter(g=>g).length ? `Grateful for: [${log.gratitude.filter(g=>g).join(' | ')}]` : '',
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


