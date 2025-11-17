import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock captions database for testing/fallback
const mockCaptions = {
  default: [
    "✨ Living my best life, one moment at a time 📸",
    "Capturing moments, creating memories 💫",
    "Every day is a new adventure 🌟",
    "Finding beauty in the simple things ✨",
    "Life is what you make it 🎨"
  ],
  funny: [
    "I'm not saying I'm funny, but my therapist agrees 😂",
    "Professional photo taker, professional caption maker 🎬",
    "My life is a movie and you're watching it 🍿",
    "I'm not weird, I'm just limited edition 😜",
    "Sorry for being fabulous 💁‍♀️"
  ],
  professional: [
    "Striving for excellence in everything I do 💼",
    "Building dreams into reality 🚀",
    "Passion meets purpose 📊",
    "Success is a journey, not a destination 🎯",
    "Elevating standards, exceeding expectations 📈"
  ],
  casual: [
    "Just vibing with good energy ✌️",
    "No filter needed for this moment 📷",
    "Living for the little things 🌻",
    "Hanging with my favorites 👯",
    "Keep it simple, keep it real 💯"
  ],
  poetic: [
    "In every moment, there's a story waiting to be told 📖",
    "The soul paints its own canvas 🎨",
    "Where light meets shadow, magic is born ✨",
    "A glimpse of forever in a single frame 📸",
    "Poetry in motion, beauty in stillness 🌙"
  ]
};

// Initialize Gemini with proper error handling
const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured in .env");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

export const generateCaption = async (req, res) => {
  try {
    const { imageUrl, mood = "default" } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Log the API key status (first/last 5 chars only for security)
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log(`✅ Gemini API Key configured: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
    }

    let base64Image;
    let mimeType = "image/jpeg";

    // Check if it's a data URL (base64 encoded)
    if (imageUrl.startsWith("data:")) {
      // Parse data URL format: data:image/jpeg;base64,xxxxx
      const parts = imageUrl.split(",");
      base64Image = parts[1];
      
      // Extract mime type
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      console.log(`📸 Processing base64 image: ${mimeType}`);
    } else {
      // It's a regular URL, fetch and convert to base64
      try {
        console.log(`📥 Fetching image from URL: ${imageUrl.substring(0, 50)}...`);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return res.status(400).json({ error: "Failed to fetch image from URL" });
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        base64Image = Buffer.from(imageBuffer).toString("base64");
        mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
        console.log(`✅ Image fetched successfully: ${mimeType}, Size: ${imageBuffer.byteLength} bytes`);
      } catch (fetchErr) {
        console.error(`❌ Fetch error: ${fetchErr.message}`);
        return res.status(400).json({ 
          error: "Failed to fetch image: " + fetchErr.message 
        });
      }
    }

    try {
      // Initialize the model
      console.log(`🔄 Initializing Gemini 2.0 Flash model...`);
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Create mood-specific prompt
      let moodInstructions = "";
      switch(mood) {
        case "funny":
          moodInstructions = " Make them humorous, witty, and funny.";
          break;
        case "professional":
          moodInstructions = " Make them professional, sophisticated, and elegant.";
          break;
        case "casual":
          moodInstructions = " Make them casual, friendly, and relatable.";
          break;
        case "poetic":
          moodInstructions = " Make them poetic, artistic, and inspirational.";
          break;
        default:
          moodInstructions = "";
      }

      // Create the prompt for caption generation
      const prompt = `You are a creative Instagram caption writer. Analyze this image and generate 5 engaging and trendy Instagram captions.${moodInstructions}
      
      Each caption should:
      - Be unique and catchy
      - Be 1-3 sentences long
      - Be suitable for Instagram
      - Include relevant emojis
      - Be original and creative
      
      Return ONLY the captions, one per line, without numbering or bullet points.`;

      console.log(`📝 Generating captions with mood: ${mood}`);

      // Call the Gemini API with the image
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        prompt,
      ]);

      console.log(`✅ Gemini API response received`);
      const responseText = result.response.text();
      
      // Parse the response into individual captions
      const captions = responseText
        .split("\n")
        .map((caption) => caption.trim())
        .filter((caption) => caption.length > 0);

      console.log(`✨ Generated ${captions.length} captions successfully`);
      return res.json({ captions: captions.slice(0, 5) }); // Return max 5 captions
    } catch (apiError) {
      // If Gemini API fails, use mock captions for testing
      console.warn(`⚠️ Gemini API failed: ${apiError.message}`);
      console.log(`📌 Using mock captions for mood: ${mood}`);
      
      const moodKey = mood || "default";
      const captions = mockCaptions[moodKey] || mockCaptions.default;
      
      // Shuffle and return 5 random captions
      return res.json({ 
        captions: captions.sort(() => Math.random() - 0.5).slice(0, 5),
        mock: true,
        message: "Using demo captions - please configure valid Gemini API key"
      });
    }
  } catch (error) {
    console.error("❌ AI Caption Error:", error);
    console.error("Error Details:", {
      name: error.name,
      message: error.message,
      status: error.status,
    });
    
    // Final fallback: return mock captions
    const moodKey = req.body?.mood || "default";
    const captions = mockCaptions[moodKey] || mockCaptions.default;
    
    return res.json({ 
      captions: captions.sort(() => Math.random() - 0.5).slice(0, 5),
      mock: true,
      message: "Using demo captions - API error occurred"
    });
  }
};

// Analyze image and provide enhancement suggestions
export const analyzeImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    let base64Image;
    let mimeType = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      const parts = imageUrl.split(",");
      base64Image = parts[1];
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    } else {
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return res.status(400).json({ error: "Failed to fetch image from URL" });
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        base64Image = Buffer.from(imageBuffer).toString("base64");
        mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
      } catch (fetchErr) {
        return res.status(400).json({ error: "Failed to fetch image: " + fetchErr.message });
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this image and provide detailed suggestions for enhancement. Include:
    1. Quality assessment (lighting, composition, focus)
    2. Color balance analysis
    3. Specific enhancement recommendations (e.g., increase contrast, adjust brightness, vibrance)
    4. Suggested filters or effects
    5. Overall quality score (1-10)
    
    Format as JSON with keys: quality, lightingComposition, colorBalance, recommendations, suggestedEffects, qualityScore`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();
    let analysis;
    
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = { analysis: responseText };
      }
    } catch (parseErr) {
      analysis = { analysis: responseText };
    }

    return res.json({ analysis });
  } catch (error) {
    console.error("Image Analysis Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to analyze image",
    });
  }
};

// Generate image modification suggestions based on user prompt
export const modifyImageWithPrompt = async (req, res) => {
  try {
    const { imageUrl, prompt: userPrompt } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    if (!userPrompt) {
      return res.status(400).json({ error: "Modification prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    let base64Image;
    let mimeType = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      const parts = imageUrl.split(",");
      base64Image = parts[1];
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    } else {
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return res.status(400).json({ error: "Failed to fetch image from URL" });
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        base64Image = Buffer.from(imageBuffer).toString("base64");
        mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
      } catch (fetchErr) {
        return res.status(400).json({ error: "Failed to fetch image: " + fetchErr.message });
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `Based on this image and the user's modification request: "${userPrompt}"
    
    Provide detailed technical instructions for modifying the image. Include:
    1. Step-by-step modifications needed
    2. Tool recommendations (Photoshop, GIMP, online tools, etc.)
    3. Expected outcome description
    4. Parameters to adjust (e.g., brightness +20, contrast +15, saturation +25)
    5. Estimated difficulty level (Easy/Medium/Hard)
    6. Before/after visual description
    
    Format as a detailed guide that can be understood by both technical and non-technical users.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      fullPrompt,
    ]);

    const responseText = result.response.text();

    return res.json({ 
      modification: responseText,
      userPrompt: userPrompt 
    });
  } catch (error) {
    console.error("Image Modification Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to process modification request",
    });
  }
};

// Generate hashtags and tags for image
export const generateHashtags = async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    console.log(`🏷️ Generating hashtags...`);

    let base64Image;
    let mimeType = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      const parts = imageUrl.split(",");
      base64Image = parts[1];
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      console.log(`📸 Processing base64 image: ${mimeType}`);
    } else {
      try {
        console.log(`📥 Fetching image from URL...`);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          return res.status(400).json({ error: "Failed to fetch image from URL" });
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        base64Image = Buffer.from(imageBuffer).toString("base64");
        mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
        console.log(`✅ Image fetched successfully`);
      } catch (fetchErr) {
        console.error(`❌ Fetch error: ${fetchErr.message}`);
        return res.status(400).json({ error: "Failed to fetch image: " + fetchErr.message });
      }
    }

    try {
      console.log(`🔄 Initializing Gemini 2.0 Flash model...`);
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Analyze this image ${caption ? `and caption: "${caption}"` : ''} and generate relevant hashtags and tags.
      
      Return ONLY a JSON object with:
      - trendingTags: Array of 5-8 trending hashtags relevant to the image
      - nicherTags: Array of 5-8 niche/specific hashtags
      - brandTags: Array of 3-5 brand collaboration tags if applicable
      - contentType: Type of content (e.g., "lifestyle", "food", "fashion", etc.)
      - tags: Array of all hashtags combined
      
      Make hashtags relevant, popular, and suitable for Instagram reach. Include # symbol in each tag.
      
      Example format:
      {
        "contentType": "lifestyle",
        "trendingTags": ["#lifestyle", "#dailylife", "#instadaily", "#photooftheday", "#instagood", "#lifestyle2024", "#moments", "#vibes"],
        "nicherTags": ["#lifestyleblogger", "#mindfuliving", "#authenticity", "#dailymoments", "#lifestyledesign", "#wellnessjouney", "#personalgrowth", "#lifeisbeautiful"],
        "brandTags": ["#sponsoredpost", "#brandbambassador"],
        "tags": ["#lifestyle", "#dailylife", "#instadaily", "#photooftheday", "#instagood", "#lifestyle2024", "#moments", "#vibes", "#lifestyleblogger", "#mindfuliving", "#authenticity", "#dailymoments"]
      }`;

      console.log(`📝 Generating hashtags with caption: ${caption ? caption.substring(0, 50) : 'none'}`);

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        prompt,
      ]);

      console.log(`✅ Gemini API response received`);
      const responseText = result.response.text();
      let hashtags;
      
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          hashtags = JSON.parse(jsonMatch[0]);
          console.log(`✨ Generated hashtags successfully`);
        } else {
          console.warn(`⚠️ No JSON found in response, using fallback`);
          hashtags = { tags: responseText.split('\n').filter(t => t.trim()) };
        }
      } catch (parseErr) {
        console.error(`❌ JSON parse error: ${parseErr.message}`);
        hashtags = { tags: responseText.split('\n').filter(t => t.trim()) };
      }

      return res.json(hashtags);
    } catch (apiError) {
      // If Gemini API fails, use mock hashtags
      console.warn(`⚠️ Gemini API failed: ${apiError.message}`);
      console.log(`📌 Using mock hashtags for fallback`);
      
      const mockHashtags = {
        contentType: "general",
        trendingTags: ["#instagood", "#photooftheday", "#instadaily", "#picoftheday", "#instagram", "#insta", "#instalike", "#instamood"],
        nicherTags: ["#instaphotography", "#instamoment", "#instatherapy", "#instalove", "#instaart", "#instatravel", "#instastyle", "#instafood"],
        brandTags: ["#sponsoredcontent", "#partner"],
        tags: ["#instagood", "#photooftheday", "#instadaily", "#picoftheday", "#instagram", "#insta", "#instalike", "#instamood", "#instaphotography", "#instamoment"]
      };
      
      return res.json({
        ...mockHashtags,
        mock: true,
        message: "Using demo hashtags - please configure valid Gemini API key"
      });
    }
  } catch (error) {
    console.error("❌ Hashtag Generation Error:", error);
    console.error("Error Details:", {
      name: error.name,
      message: error.message,
      status: error.status,
    });
    
    // Final fallback: return mock hashtags
    const mockHashtags = {
      contentType: "general",
      trendingTags: ["#instagood", "#photooftheday", "#instadaily", "#picoftheday", "#instagram", "#insta", "#instalike", "#instamood"],
      nicherTags: ["#instaphotography", "#instamoment", "#instatherapy", "#instalove", "#instaart", "#instatravel", "#instastyle", "#instafood"],
      brandTags: ["#sponsoredcontent", "#partner"],
      tags: ["#instagood", "#photooftheday", "#instadaily", "#picoftheday", "#instagram", "#insta", "#instalike", "#instamood", "#instaphotography", "#instamoment"]
    };
    
    return res.json({
      ...mockHashtags,
      mock: true,
      message: "Using demo hashtags - API error occurred"
    });
  }
};

// Generate AI bio based on user's posts and interests
export const generateBio = async (req, res) => {
  try {
    const { posts, interests, currentBio, displayName } = req.body;

    console.log('🤖 Generating AI bio for user:', displayName);
    console.log('📝 Posts content length:', posts?.length || 0);
    console.log('🎯 Interests:', interests);

    // Mock bios for fallback
    const mockBios = [
      `${displayName || 'User'} | Living life one moment at a time ✨ | ${interests || 'Passionate about life'} 💫`,
      `✨ ${displayName || 'Creator'} | ${interests || 'Explorer of life'} 🌟 | Making memories and moments 📸`,
      `🎨 ${displayName || 'Dreamer'} | ${interests || 'Chasing dreams'} 💭 | Life is an adventure 🚀`,
      `💫 ${displayName || 'Enthusiast'} | Lover of ${interests || 'good vibes'} ✌️ | Creating my own story 📖`,
      `🌟 ${displayName || 'Wanderer'} | ${interests || 'Exploring the world'} 🌍 | Living in the moment ⏰`
    ];

    try {
      // Initialize Gemini AI
      console.log('🔄 Initializing Gemini 2.0 Flash model for bio generation...');
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Create a comprehensive prompt
      const prompt = `You are an expert social media bio writer. Create 5 unique and engaging Instagram bio suggestions for this user.

User Information:
- Name: ${displayName || 'User'}
- Current Bio: ${currentBio || 'None'}
- Interests: ${interests || 'Various interests'}
- Recent Post Content: ${posts || 'Various content'}

Bio Requirements:
- Maximum 150 characters each
- Engaging and authentic tone
- Include relevant emojis
- Reflect the user's personality based on their posts and interests
- Be creative and unique
- Make it Instagram-worthy
- Each bio should have a different style (professional, casual, fun, inspirational, creative)

Return ONLY the 5 bio suggestions, one per line, without numbering or explanations.`;

      console.log('📝 Generating bios with AI...');

      // Call the Gemini API
      const result = await model.generateContent([prompt]);

      console.log('✅ Gemini API response received for bio generation');
      const responseText = result.response.text();
      
      // Parse the response into individual bio suggestions
      const suggestions = responseText
        .split("\n")
        .map((bio) => bio.trim())
        .filter((bio) => bio.length > 0 && bio.length <= 150);

      console.log(`✨ Generated ${suggestions.length} bio suggestions successfully`);
      return res.json({ 
        suggestions: suggestions.slice(0, 5),
        success: true 
      });

    } catch (apiError) {
      // If Gemini API fails, use mock bios
      console.warn(`⚠️ Gemini API failed for bio generation: ${apiError.message}`);
      console.log(`📌 Using mock bios as fallback`);
      
      return res.json({ 
        suggestions: mockBios,
        mock: true,
        success: true,
        message: "Using demo bios - please configure valid Gemini API key"
      });
    }
  } catch (error) {
    console.error("❌ AI Bio Generation Error:", error);
    console.error("Error Details:", {
      name: error.name,
      message: error.message,
      status: error.status,
    });
    
    // Final fallback: return mock bios
    const displayName = req.body?.displayName || 'User';
    const interests = req.body?.interests || 'various interests';
    
    const mockBios = [
      `${displayName} | Living life one moment at a time ✨ | ${interests} 💫`,
      `✨ ${displayName} | ${interests} 🌟 | Making memories and moments 📸`,
      `🎨 ${displayName} | ${interests} 💭 | Life is an adventure 🚀`,
      `💫 ${displayName} | Lover of ${interests} ✌️ | Creating my own story 📖`,
      `🌟 ${displayName} | ${interests} 🌍 | Living in the moment ⏰`
    ];
    
    return res.json({ 
      suggestions: mockBios,
      mock: true,
      success: true,
      message: "Using demo bios - API error occurred"
    });
  }
};
