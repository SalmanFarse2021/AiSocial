import { API_BASE } from '@/lib/api';

export async function transformImage(imageUrl, prompt) {
  if (!imageUrl) {
    throw new Error('Image URL is required');
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Transformation prompt is required');
  }

  try {
    const response = await fetch(`${API_BASE}/api/ai/transform-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to transform image');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to transform image';
    throw new Error(message);
  }
}
