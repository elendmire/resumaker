import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const improveText = async (text: string, context: string = "resume"): Promise<string> => {
  if (!process.env.API_KEY) return text;

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are an expert resume writer. Improve this bullet point for a resume.
      Use strong action verbs, quantify achievements, and keep it concise.
      Context: ${context}
      Original: "${text}"
      Return ONLY the improved string.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Improve Error:", error);
    return text;
  }
};

export const parseProfileData = async (rawText: string): Promise<Partial<ResumeData>> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Extract professional resume information from the following text (which could be a LinkedIn profile dump or a CV).
      Return a JSON object matching this schema:
      {
        "header": { "name": string, "phone": string, "email": string, "linkedin": string, "github": string, "website": string, "address": string, "gender": string, "nationality": string, "birthdate": "YYYY-MM-DD" },
        "education": [{ "school": string, "location": string, "degree": string, "gpa": string, "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": boolean, "details": string[] }],
        "experience": [{ "company": string, "role": string, "location": string, "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": boolean, "points": string[] }],
        "projects": [{ "name": string, "techStack": string, "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": boolean, "points": string[] }],
        "skills": [{ "name": string, "items": string }],
        "references": [{ "name": string, "role": string, "company": string, "email": string }]
      }

      Text to parse:
      ${rawText}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No data returned from AI");
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};
