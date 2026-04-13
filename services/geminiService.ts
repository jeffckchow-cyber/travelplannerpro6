
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Always use named parameter for apiKey and direct process.env.API_KEY access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateItinerarySuggestions = async (destination: string, days: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a ${days}-day travel itinerary for ${destination}, Japan. Focus on high-quality experiences.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    location: { type: Type.STRING },
                    type: { type: Type.STRING, description: "Food, Sightseeing, Transport, Hotel, Shopping" },
                    note: { type: Type.STRING },
                    cost: { type: Type.NUMBER }
                  },
                  required: ["time", "location", "type", "cost"]
                }
              }
            },
            required: ["day", "activities"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      console.error("Gemini returned an empty response.");
      return null;
    }

    const jsonStr = text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
