import { apiPost } from './api';

export interface CaptionSuggestions {
  shortCaption: string;
  longCaption: string;
  funnyCaption: string;
  emotionalCaption: string;
  hashtags: string;
}

export interface GenerateCaptionResponse {
  success: boolean;
  captions: CaptionSuggestions;
}

/**
 * Generate AI captions for an image using Gemini Vision API
 * @param imageUrl - URL of the image to analyze
 * @returns Caption suggestions object
 */
export const generateCaptions = async (imageUrl: string): Promise<CaptionSuggestions> => {
  try {
    const response = await apiPost('/api/ai/generate-caption', { imageUrl });
    
    if (!response.success || !response.captions) {
      throw new Error('Invalid response format');
    }
    
    return response.captions;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate captions'
    );
  }
};

export default {
  generateCaptions,
};
