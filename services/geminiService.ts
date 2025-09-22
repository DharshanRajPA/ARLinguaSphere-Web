import { GoogleGenAI, Type } from "@google/genai";
import type { DetectedObject } from '../types';

// Gemini API for image analysis
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getLanguageName = (langCode: string): string => {
    const map: {[key: string]: string} = {
        'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian'
    };
    return map[langCode] || 'the specified language';
}

/**
 * Calls the Gemini API to detect objects in an image.
 */
export const detectObjects = async (imageDataUrl: string, langCode: string): Promise<DetectedObject[]> => {
    const languageName = getLanguageName(langCode);
    const mimeType = imageDataUrl.substring(imageDataUrl.indexOf(":") + 1, imageDataUrl.indexOf(";"));
    const base64Data = imageDataUrl.substring(imageDataUrl.indexOf(",") + 1);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType,
                            data: base64Data,
                        },
                    },
                    {
                        text: `
                          Act as an expert computer vision system. Your task is to perform high-accuracy object detection and translation.
                          Analyze the provided image and identify all salient, distinct, and clearly visible objects. Ignore minor background clutter.
                          For each identified object, you must provide:
                          1. A specific, concise name in English (label). Avoid generic terms like "person" or "building" unless they are the main subject with no other discernible features. For example, use "laptop" instead of "electronics".
                          2. Its precise and contextually appropriate translation into ${languageName} (language code: ${langCode}).
                          3. A confidence score from 0.0 to 1.0, representing your certainty in the identification.
                          4. A precise bounding box with normalized coordinates (from 0.0 to 1.0) for topLeftX, topLeftY, bottomRightX, and bottomRightY. The box must tightly enclose the object.
                          
                          Your final output must be a valid JSON array of objects, conforming to the provided schema. Do not include any explanatory text, markdown, or any characters outside of the JSON array. If you cannot identify any objects with high confidence, return an empty array [].
                        `
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING },
                            translation: { type: Type.STRING },
                            confidence: { type: Type.NUMBER },
                            boundingBox: {
                                type: Type.OBJECT,
                                properties: {
                                    topLeftX: { type: Type.NUMBER },
                                    topLeftY: { type: Type.NUMBER },
                                    bottomRightX: { type: Type.NUMBER },
                                    bottomRightY: { type: Type.NUMBER },
                                },
                                required: ["topLeftX", "topLeftY", "bottomRightX", "bottomRightY"],
                            }
                        },
                        required: ["label", "translation", "confidence", "boundingBox"],
                    }
                }
            }
        });

        const result = JSON.parse(response.text);
        if (!Array.isArray(result)) {
            console.error("Gemini API did not return a valid array:", result);
            throw new Error("AI response was not in the expected format (array).");
        }
        return result as DetectedObject[];

    } catch (error) {
        console.error("Error in Gemini API call:", error);
        throw new Error(`Failed to get a valid response from the AI. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};