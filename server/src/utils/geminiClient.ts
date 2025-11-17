import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Get the Gemini Vision model
export const getVisionModel = () => {
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
};

// Helper to fetch and convert image to base64
export const fetchImageAsBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper to get image MIME type from URL
export const getImageMimeType = (imageUrl: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' => {
  const url = new URL(imageUrl);
  const pathname = url.pathname.toLowerCase();
  
  if (pathname.includes('.png')) return 'image/png';
  if (pathname.includes('.gif')) return 'image/gif';
  if (pathname.includes('.webp')) return 'image/webp';
  return 'image/jpeg'; // default
};

export default genAI;
