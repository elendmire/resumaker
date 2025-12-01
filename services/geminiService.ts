import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const improveText = async (text: string, context: string = "resume"): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API key not found. Returning original text.");
    return text;
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert resume writer and career coach. 
      Please rewrite the following bullet point or text to be more impactful, concise, and action-oriented.
      Use strong verbs and quantify results where possible.
      Maintain the same factual meaning but sound more professional.
      
      Context: ${context}
      Original Text: "${text}"
      
      Return ONLY the improved text, no explanation or quotes.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const result = response.text;
    return result ? result.trim() : text;
  } catch (error) {
    console.error("Error improving text with Gemini:", error);
    return text;
  }
};