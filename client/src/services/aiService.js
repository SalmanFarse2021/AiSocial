import { apiPost } from './api';

export const generateCaptions = async (imageUrl) => {
  try {
    const response = await apiPost('/api/ai/generate-caption', { imageUrl });
    if (!response.success || !response.captions) {
      throw new Error('Invalid response format');
    }
    return response.captions;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate captions';
    throw new Error(message);
  }
};

const aiService = {
  generateCaptions,
};

export default aiService;
