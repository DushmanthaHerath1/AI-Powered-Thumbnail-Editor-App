
import { GoogleGenAI } from "@google/genai";
import { urlToBase64 } from "../utils/imageUtils";

const MODEL_NAME = 'gemini-2.5-flash-image';

// Store the full prompt in a constant to keep the logic clean
const THUMBNAIL_SYSTEM_PROMPT = `
You are a World-Class YouTube Thumbnail Artist. Your goal is to generate or edit images optimized for maximum visual impact and click-through rates.

### DESIGN PRINCIPLES:
1. COMPOSITION: Always follow the 'Rule of Thirds'. Leave "Negative Space" on one side for potential text overlays. Ensure the main subject is large and centered or slightly offset.
2. LIGHTING & COLOR: Use 'Rim Lighting' or 'Glow' around the subject to separate them from the background. Boost saturation and use high-contrast color palettes (e.g., Blue/Orange, Teal/Yellow).
3. SUBJECT FOCUS: The subject must be "Tack Sharp" (extremely clear). If editing an existing image, maintain facial expressions and identity with 100% fidelity.
4. BACKGROUNDS: If 'Background Removal' is requested, replace it with a 'Depth of Field' (blurred) professional studio, a vibrant gradient, or a contextually relevant high-energy scene.
5. TECH SPECS: Output must be 16:9. Avoid cluttered details; keep the visual "shouty" and readable even on small mobile screens.

### INSTRUCTION:
Transform the user's request into a detailed visual description. Do not just repeat the user; expand it into a professional prompt for a high-end image generation engine.
`;

export class GeminiService {
  async processThumbnail(userPrompt: string, currentImageUrl?: string | null) {
    // Initialize AI instance inside the method to ensure fresh context/key if needed
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const parts: any[] = [{ text: `User Task: ${userPrompt}` }];

    if (currentImageUrl) {
      const base64Data = await urlToBase64(currentImageUrl);
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: THUMBNAIL_SYSTEM_PROMPT,
        imageConfig: {
          aspectRatio: "16:9"
        },
        temperature: 0.7,
      }
    });

    let generatedImageUrl = '';
    let responseText = '';

    // Safely iterate through candidate parts to extract image data and text
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          responseText = part.text;
        }
      }
    }

    return {
      imageUrl: generatedImageUrl,
      text: responseText || "I've polished your thumbnail! Ready for the front page."
    };
  }
}

export const geminiService = new GeminiService();
