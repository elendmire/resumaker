import { ResumeData } from "../types";

// Backend URL'nizi buraya yazın (Örn: http://localhost:5000)
const API_BASE_URL = "https://your-backend-api.com"; 

export const apiService = {
  /**
   * LinkedIn'den gelen 'code'u backend'e gönderir, 
   * backend bu kodu token ile değiştirip profil verilerini çeker.
   */
  async exchangeLinkedInCode(code: string): Promise<Partial<ResumeData>> {
    const response = await fetch(`${API_BASE_URL}/auth/linkedin/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("LinkedIn sync failed");
    }

    return await response.json();
  },

  /**
   * Kullanıcı verilerini backend'e kaydeder
   */
  async saveResume(data: ResumeData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/resume/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to save resume");
  }
};