import { Request, Response } from 'express';
import { getVisionModel, fetchImageAsBase64, getImageMimeType } from '../utils/geminiClient.js';

interface CaptionResponse {
  shortCaption: string;
  longCaption: string;
  funnyCaption: string;
  emotionalCaption: string;
  hashtags: string;
}

const CAPTION_PROMPT = `Analyze this image carefully and generate the following in JSON format:

1. shortCaption: A caption with 4-8 words that describes the image
2. longCaption: A creative caption (1-2 sentences) that could be engaging on social media
3. funnyCaption: A humorous or witty caption about the image
4. emotionalCaption: A deep, emotional, or thoughtful caption that connects with viewers
5. hashtags: 15 highly relevant hashtags (comma-separated, starting with #)

IMPORTANT:
- Make captions specific to what you see in the image
- Avoid generic or clichéd captions
- Ensure all content is appropriate and positive
- For hashtags, include mix of popular and niche tags related to the image content

Respond ONLY with valid JSON, no markdown or additional text:
{
  "shortCaption": "...",
  "longCaption": "...",
  "funnyCaption": "...",
  "emotionalCaption": "...",
  "hashtags": "..."
}`;

export const generateCaption = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageUrl } = req.body;

    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({ 
        error: 'imageUrl is required and must be a string' 
      });
      return;
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      res.status(400).json({ 
        error: 'Invalid image URL format' 
      });
      return;
    }

    // Fetch and convert image to base64
    const imageBase64 = await fetchImageAsBase64(imageUrl);
    const mimeType = getImageMimeType(imageUrl);

    // Get the Vision model
    const model = getVisionModel();

    // Generate captions using Gemini Vision
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
      CAPTION_PROMPT,
    ]);

    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    let captions: CaptionResponse;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      captions = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      res.status(500).json({ 
        error: 'Failed to parse AI response. Please try again.' 
      });
      return;
    }

    // Validate response structure
    if (!captions.shortCaption || !captions.longCaption || !captions.funnyCaption || 
        !captions.emotionalCaption || !captions.hashtags) {
      res.status(500).json({ 
        error: 'Invalid response format from AI model' 
      });
      return;
    }

    // Return captions
    res.json({
      success: true,
      captions: {
        shortCaption: captions.shortCaption.trim(),
        longCaption: captions.longCaption.trim(),
        funnyCaption: captions.funnyCaption.trim(),
        emotionalCaption: captions.emotionalCaption.trim(),
        hashtags: captions.hashtags.trim(),
      },
    });

  } catch (error) {
    console.error('Caption generation error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        res.status(500).json({ 
          error: 'AI service not configured. Please contact support.' 
        });
        return;
      }
      if (error.message.includes('fetch image')) {
        res.status(400).json({ 
          error: 'Could not access the image. Please check the URL.' 
        });
        return;
      }
      if (error.message.includes('rate limit')) {
        res.status(429).json({ 
          error: 'Too many requests. Please try again later.' 
        });
        return;
      }
    }

    res.status(500).json({ 
      error: 'Failed to generate captions. Please try again.' 
    });
  }
};

export default {
  generateCaption,
};
