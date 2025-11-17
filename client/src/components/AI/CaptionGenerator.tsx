'use client';

import { useState } from 'react';
import { generateCaptions, CaptionSuggestions } from '@/services/aiService';

interface CaptionGeneratorProps {
  imageUrl: string | null;
  onSelectCaption: (caption: string) => void;
}

export default function CaptionGenerator({ imageUrl, onSelectCaption }: CaptionGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState<CaptionSuggestions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'short' | 'long' | 'funny' | 'emotional' | 'hashtags'>('short');

  const handleGenerateCaption = async () => {
    if (!imageUrl) {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setCaptions(null);

    try {
      const generatedCaptions = await generateCaptions(imageUrl);
      setCaptions(generatedCaptions);
      setSelectedTab('short');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate captions');
      console.error('Caption generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCaption = (): string => {
    if (!captions) return '';
    switch (selectedTab) {
      case 'short':
        return captions.shortCaption;
      case 'long':
        return captions.longCaption;
      case 'funny':
        return captions.funnyCaption;
      case 'emotional':
        return captions.emotionalCaption;
      case 'hashtags':
        return captions.hashtags;
      default:
        return '';
    }
  };

  const handleSelectCaption = () => {
    const caption = getCurrentCaption();
    if (caption) {
      onSelectCaption(caption);
      setCaptions(null);
      setSelectedTab('short');
    }
  };

  return (
    <div className="space-y-3">
      {/* Generate Button */}
      <button
        onClick={handleGenerateCaption}
        disabled={!imageUrl || loading}
        className={`w-full px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
          !imageUrl || loading
            ? 'bg-gray-600/50 text-white/50 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
        }`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            ✨ AI Caption
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Caption Suggestions Box */}
      {captions && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['short', 'long', 'funny', 'emotional', 'hashtags'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  selectedTab === tab
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {tab === 'short' && '📝 Short'}
                {tab === 'long' && '📖 Long'}
                {tab === 'funny' && '😂 Funny'}
                {tab === 'emotional' && '💭 Emotional'}
                {tab === 'hashtags' && '#️⃣ Tags'}
              </button>
            ))}
          </div>

          {/* Caption Display */}
          <div className="p-3 bg-black/30 rounded-lg min-h-16 flex items-center">
            <p className="text-white/90 text-sm whitespace-pre-wrap break-words">
              {getCurrentCaption()}
            </p>
          </div>

          {/* Select Button */}
          <button
            onClick={handleSelectCaption}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition text-sm"
          >
            Use this caption
          </button>
        </div>
      )}
    </div>
  );
}
