
import { GoogleGenAI } from "@google/genai";
import { urlToBase64 } from "../utils/imageUtils";

const MODEL_NAME = 'gemini-2.5-flash-image';

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
    // Correctly initialize GoogleGenAI with named parameter apiKey from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [{ text: `User Task: ${userPrompt}` }];

    if (currentImageUrl) {
      try {
        const base64Data = await urlToBase64(currentImageUrl);
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: base64Data
          }
        });
      } catch (e) {
        console.warn("Failed to process existing image, proceeding with text-only prompt.", e);
      }
    }

    // Call generateContent with the model and contents structure (using parts directly)
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: THUMBNAIL_SYSTEM_PROMPT,
        imageConfig: {
          aspectRatio: "16:9"
        },
        temperature: 0.7,
      }
    });

    let generatedImageUrl = '';
    
    // Direct property access for text response as per guidelines
    const responseText = response.text || "I've polished your thumbnail! Ready for the front page.";

    // Iterate through candidates and parts to find the generated image (nano banana models)
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      const imagePart = candidate.content.parts.find(p => p.inlineData);
      if (imagePart?.inlineData) {
        generatedImageUrl = `data:image/png;base64,${imagePart.inlineData.data}`;
      }
    }

    return {
      imageUrl: generatedImageUrl,
      text: responseText
    };
  }
}

export const geminiService = new GeminiService();
