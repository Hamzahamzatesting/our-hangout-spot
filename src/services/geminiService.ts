import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface VibeData {
  content: string;
  type: 'text' | 'image';
}

export async function synthesizeVibes(vibes: VibeData[]) {
  const vibeList = vibes.map(v => v.content).join(", ");
  
  const prompt = `
    You are Echo, a mystical vibe oracle. 
    Review these diverse vibes from a group of friends wanting to go out:
    [${vibeList}]

    Based on these, find ONE specific physical location (could be a type of place like 'A speakeasy hidden behind a laundromat' or a conceptual one if you don't have geo data, but prioritize specific vibes).
    
    Return a JSON object:
    {
      "name": "The Title of the Destination",
      "reasoning": "A poetic, short explanation of how you merged everyone's vibes",
      "vibeMatch": 98,
      "location": "A description of where to find this feeling or a type of venue",
      "imagePrompt": "A detailed DALL-E style prompt to generate a visual for this vibe"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    
    const text = response.text || "";
    // Clear out markdown code blocks if any
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Synthesis Error:", error);
    return null;
  }
}
