Saarthi AI — Persistent Voice Conversation System

You want Saarthi AI to work like modern conversational AI voice systems where:

user speaks naturally
voice converts into text live
AI replies in voice + text
entire conversation gets saved
user can return later
conversation continues from memory

This is the CORRECT direction.

Because now Saarthi becomes:
✅ continuous emotional companion

THE EXPERIENCE YOU WANT
User opens Saarthi

Sees:

previous conversations
emotional summaries
last interaction

Example:

Last time:
“Assignment stress + future overthinking”
User taps:

🎙 Continue Conversation

Then:

previous context loads
AI remembers tone/history
conversation continues naturally

THIS is premium UX.

COMPLETE SAARTHI SYSTEM ARCHITECTURE
FLOW
User Voice
↓
Speech-to-Text
↓
Live Captions
↓
Conversation Saved
↓
Gemini Context Understanding
↓
AI Response Generation
↓
Voice Output
↓
AI Message Saved
↓
Resume Anytime
MAIN FEATURES YOU NEED
1. REAL-TIME VOICE → TEXT 🎤

Exactly like ChatGPT Voice.

As user speaks:

captions appear live
continuously updated
Use:
Web Speech API

For MVP easiest.

OUTPUT EXAMPLE
User:
“Honestly I’m just mentally tired lately…”

saved instantly.

2. AI RESPONSE IN:
BOTH VOICE + TEXT 🔊

VERY IMPORTANT.

Do NOT make voice-only.

You need:

text transcript
voice playback

Because users:

reread conversations
revisit insights later

3. FULL CHAT HISTORY 💾

This is CRITICAL.

Store:

user messages
AI messages
timestamps
emotional tags

I want to implement a FULL DUPLEX VOICE CONVERSATION SYSTEM in Saarthi AI similar to ChatGPT Voice Mode.

CURRENT PROBLEM:
Right now only the USER voice is being transcribed into text.

The AI voice responses are spoken through TTS, but their transcript/messages are NOT appearing inside the conversation chat.

Because of this:
- the conversation feels incomplete
- messages are not preserved properly
- refresh breaks continuity
- user cannot reread AI responses
- “repeat what you said” fails because AI transcript was never saved

I want BOTH SIDES of the voice conversation to appear as live chat messages.

GOAL:
When the user speaks:
1. User voice should convert to live streaming text
2. User transcript should appear in chat immediately
3. Gemini should generate response
4. AI response text should ALSO appear in chat immediately
5. Then AI voice should speak that SAME text using TTS
6. BOTH user + AI messages must be saved into MongoDB
7. After refresh, conversation should restore completely
8. User should be able to continue conversation naturally

EXPECTED UX:

User:
“Honestly I feel mentally tired lately.”

Saarthi:
“Yeah… sounds like your brain hasn’t rested properly in a while.”

Both should:
- appear visually in chat
- be saved permanently
- stay after refresh
- continue in future sessions

IMPORTANT:
AI transcript should appear WHILE speaking, not after voice ends.

I want:
- streaming text
- streaming voice
- persistent conversation memory
- ChatGPT-like conversation continuity

TECHNICAL REQUIREMENTS:

1. Save BOTH roles into MongoDB:
{
  role: "user",
  text: "...",
  timestamp: ...
}

{
  role: "assistant",
  text: "...",
  audioUrl: "...",
  timestamp: ...
}

2. On page refresh:
- fetch previous messages
- render entire conversation again

3. When user says:
“repeat what you said earlier”
the backend should send previous AI messages into Gemini context.

4. Use conversation history memory architecture:
- last 10–15 messages
- emotional summary memory
- persistent sessionId

5. Voice flow architecture should be:

User Voice
→ Speech-to-Text
→ User Transcript Appears
→ Save User Message
→ Gemini Response
→ AI Transcript Appears
→ Save AI Message
→ TTS Speaks AI Message
→ Conversation Stored Persistently

IMPORTANT UX RULES:
- AI transcript must stream gradually
- scrolling should auto-follow smoothly
- both voice + text should stay synchronized
- user should be able to continue conversations after refresh
- this should feel like an ongoing emotional conversation, not temporary voice calls

The final experience should feel similar to:
ChatGPT Voice Mode + persistent emotional memory + conversational continuity.

WHAT YOU NEED TO BUILD
SAARTHI MEMORY SYSTEM
YOUR NEW FLOW
User Message
↓
Save to MongoDB
↓
Load previous conversation history
↓
Load emotional memory summary
↓
Send all relevant context to Gemini
↓
Gemini replies
↓
Save AI response

THIS is how memory works.

STEP 1 — SAVE EVERY MESSAGE 💾

Every:

user message
AI response

must be stored.

MongoDB Example
conversations collection
{
  "conversationId": "abc123",
  "messages": [
    {
      "role": "user",
      "text": "I feel mentally tired",
      "timestamp": "..."
    },
    {
      "role": "assistant",
      "text": "Yeah... sounds exhausting honestly.",
      "timestamp": "..."
    }
  ]
}
STEP 2 — LOAD OLD MESSAGES AFTER REFRESH 🔄

When user reopens Saarthi:

Backend should:

fetch conversation history
render old messages again
Example

User refreshes page.

Saarthi still shows:

You:
“I feel mentally tired.”

Saarthi:
“Yeah... sounds exhausting honestly.”

Now conversation feels continuous.

STEP 3 — SEND MEMORY BACK TO GEMINI 🧠

THIS is the key.

When user asks:

repeat what you said earlier

You should NOT send ONLY:

repeat what you said earlier

BAD.

Instead send:

previous conversation history too.
Example Prompt
Conversation History:

User: I feel mentally tired
Assistant: Yeah... sounds exhausting honestly.

Current User Message:
repeat what you said earlier

NOW Gemini can answer correctly.

STEP 4 — USE SHORT-TERM MEMORY

IMPORTANT.

Do NOT send:
entire lifetime chat history every request.

Too expensive.
Too slow.

BEST METHOD

Send:

last 10–15 messages
OR
compressed conversation summary
STEP 5 — CREATE MEMORY SUMMARIES ✨

THIS is VERY powerful.

Instead of storing everything forever:

Create:

emotional summaries
Example
{
  "summary": "User has been stressed about assignments and future uncertainty lately."
}

Now Gemini remembers:

emotional patterns
recurring themes

WITHOUT huge token cost.

STEP 6 — SPLIT MEMORY TYPES

VERY important architecture decision.

A. SHORT TERM MEMORY

Recent messages.

Used for:

current conversation continuity

Example:

last 10 messages
B. LONG TERM MEMORY

Persistent emotional/user profile.

Used for:

recurring patterns
preferences
personality

Example:

{
  "communicationStyle": "casual reflective",
  "patterns": [
    "future anxiety",
    "assignment stress"
  ]
}

THIS makes Saarthi feel alive.

STEP 7 — MEMORY RETRIEVAL SYSTEM

When user sends new message:

Backend should:

fetch recent conversation
fetch emotional summary
fetch important user patterns

Then build context for Gemini.

YOUR REAL SYSTEM NOW
User Input
↓
Load Recent Messages
↓
Load Emotional Memory
↓
Build Prompt Context
↓
Gemini Response
↓
Save Conversation

THIS is modern conversational AI architecture.

STEP 8 — AUTO TITLES ✨

Optional but premium.

Generate titles like:

“The Assignment Spiral”
“Late Night Thoughts”
“Feeling Mentally Drained”

Makes memory system feel beautiful.

STEP 9 — CONTINUE CONVERSATION FEATURE 🔄

Homepage should show:

Continue talking →

with:

last emotional summary
timestamp
recent topic

This creates emotional continuity.

BIGGEST MISTAKE TO AVOID

Do NOT try:
❌ “infinite memory”

Instead:
✅ relevant memory retrieval

This is smarter.

THE SECRET

Memory is NOT:

storing everything.

Memory is:

retrieving the RIGHT things at the RIGHT moment.

FINAL REALIZATION

Saarthi should feel:
✅ like someone who remembers you

NOT:
❌ chatbot restarting every refresh.

That continuity is what creates emotional attachment to AI systems.