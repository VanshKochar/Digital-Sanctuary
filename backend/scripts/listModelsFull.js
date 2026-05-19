const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("FULL_LIST_START");
      data.models.forEach(m => {
        // Log the short name (after models/)
        console.log(m.name.split('/').pop());
      });
      console.log("FULL_LIST_END");
    } else {
      console.log("No models found. Response:", JSON.stringify(data));
    }
  } catch (e) {
    console.error("Fetch Error:", e.message);
  }
}

listModels();
