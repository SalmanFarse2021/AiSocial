'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const VoiceMessage = ({ audioUrl, duration, isPlayed, onPlay, isSentByMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onPlay) onPlay();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlay]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      if (onPlay && !isPlayed) onPlay();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioDuration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl ${
      isSentByMe 
        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
        : 'bg-gray-800'
    } min-w-[250px] max-w-[350px]`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className={`p-3 rounded-full transition-all ${
          isSentByMe
            ? 'bg-white/20 hover:bg-white/30'
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-white" fill="white" />
        ) : (
          <Play className="w-5 h-5 text-white" fill="white" />
        )}
      </button>

      {/* Waveform / Progress Bar */}
      <div className="flex-1">
        {/* Progress Bar */}
        <div
          onClick={handleSeek}
          className="relative h-8 cursor-pointer group"
        >
          {/* Background waveform effect */}
          <div className="absolute inset-0 flex items-center gap-0.5">
            {[...Array(30)].map((_, i) => {
              const height = Math.sin(i * 0.5) * 20 + 30;
              const isFilled = (i / 30) * 100 < progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all ${
                    isFilled
                      ? 'bg-white'
                      : isSentByMe
                      ? 'bg-white/30'
                      : 'bg-white/20'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Hover effect */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded transition-all" />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-xs text-white/70 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>

      {/* Played indicator */}
      {!isSentByMe && isPlayed && (
        <div className="text-xs text-white/50">
          ✓ Played
        </div>
      )}
    </div>
  );
};

export default VoiceMessage;
