const { GoogleGenAI, Modality, MediaResolution } = require('@google/genai');
const { WebSocketServer } = require('ws');
const url = require('url');

function initVoiceSocket(server) {
  const wss = new WebSocketServer({ server, path: '/api/voice' });
  
  console.log('Voice WebSocket server initialized on path /api/voice');

  wss.on('connection', async (ws, req) => {
    console.log('Client connected to Voice WebSocket');
    
    // Parse past conversation history query parameter from handshake URL
    let historyText = "";
    if (req && req.url) {
      try {
        const parsedUrl = url.parse(req.url, true);
        historyText = parsedUrl.query.history || "";
        if (historyText) {
          console.log(`Loaded ${historyText.length} characters of past conversation memory into Saarthi Voice`);
        }
      } catch (e) {
        console.error("Error parsing history query parameters during connection:", e);
      }
    }
    
    let session = null;
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const model = 'models/gemini-3.1-flash-live-preview';

    // Construct system instructions, blending default wellness persona with memory context
    const baseInstruction = "You are Saarthi, a wise, calm, and grounded mental wellness companion. You combine warm modern psychology with ancient wisdom. Keep your responses short, natural, empathetic, and conversational, ideal for real-time speech dialogue.";
    let textInstruction = baseInstruction;
    
    if (historyText) {
      textInstruction += `\n\n=== PAST SESSION CONTEXT HISTORY (MEMORY) ===\n${historyText}\n=============================================\nYou must actively remember this history. Greet the user by welcoming them back, acknowledge where you left off in your previous conversation, and continue the verbal reflection naturally.`;
    }

    const config = {
      responseModalities: [
        Modality.AUDIO,
      ],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Zephyr', // Custom premium voice name
          }
        }
      },
      systemInstruction: {
        parts: [
          {
            text: textInstruction
          }
        ]
      }
    };

    try {
      ws.send(JSON.stringify({ type: 'status', data: 'connecting', message: 'Connecting to Gemini Live...' }));
      
      session = await ai.live.connect({
        model,
        config,
        callbacks: {
          onopen: () => {
            console.log('Connected to Gemini Live API session');
            ws.send(JSON.stringify({ type: 'status', data: 'connected', message: 'Connected and listening!' }));
          },
          onmessage: (message) => {
            // Process incoming Gemini Live response and forward to React client
            if (message.serverContent?.modelTurn?.parts) {
              const parts = message.serverContent.modelTurn.parts;
              for (const part of parts) {
                if (part.inlineData) {
                  // Send raw base64 audio and mimeType back to browser
                  ws.send(JSON.stringify({
                    type: 'audio',
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000'
                  }));
                }
                if (part.text) {
                  // Send accompanying text transcript
                  ws.send(JSON.stringify({
                    type: 'text',
                    data: part.text
                  }));
                }
              }
            }
            
            // Handle complete turn if necessary
            if (message.serverContent?.turnComplete) {
              ws.send(JSON.stringify({ type: 'turnComplete' }));
            }
          },
          onerror: (err) => {
            console.error('Gemini Live session error:', err);
            ws.send(JSON.stringify({ type: 'error', data: err.message || 'Gemini Live error' }));
          },
          onclose: (e) => {
            console.log('Gemini Live session closed:', e.reason);
            ws.send(JSON.stringify({ type: 'status', data: 'disconnected', message: 'Session closed' }));
          }
        }
      });

    } catch (error) {
      console.error('Failed to establish Gemini Live connection:', error);
      ws.send(JSON.stringify({ type: 'error', data: 'Failed to connect to AI voice server. Please verify your GEMINI_API_KEY.' }));
      ws.close();
      return;
    }

    // Handle messages sent from React client
    ws.on('message', async (message) => {
      try {
        const parsed = JSON.parse(message);
        
        if (!session) {
          console.warn('Received message from client but Gemini Live session is not active.');
          return;
        }

        if (parsed.type === 'audio') {
          // Stream user voice input to Gemini Live
          session.sendRealtimeInput({
            audio: {
              data: parsed.data, // base64 encoded raw PCM audio
              mimeType: parsed.mimeType || 'audio/pcm;rate=16000'
            }
          });
        } else if (parsed.type === 'text') {
          // Stream user text input to Gemini Live if text is sent
          session.sendRealtimeInput({
            text: parsed.data
          });
        }
      } catch (error) {
        console.error('Error processing client message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client closed Voice WebSocket connection');
      if (session) {
        try {
          session.close();
        } catch (e) {
          console.error('Error closing Gemini session on client disconnect:', e);
        }
        session = null;
      }
    });
  });
}

module.exports = { initVoiceSocket };
