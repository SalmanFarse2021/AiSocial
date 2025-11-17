'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Pause, Play } from 'lucide-react';

const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [waveform, setWaveform] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);

  const MAX_DURATION = 60; // 60 seconds max

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for waveform
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Animate waveform
      animateWaveform();

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const animateWaveform = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording && !isPaused) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Take samples for waveform visualization
      const samples = [];
      for (let i = 0; i < 40; i++) {
        const index = Math.floor(i * bufferLength / 40);
        samples.push(dataArray[index] / 255); // Normalize to 0-1
      }
      
      setWaveform(samples);
      requestAnimationFrame(draw);
    };
    
    draw();
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      animateWaveform();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    onCancel();
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onSendVoice(audioBlob, recordingTime);
      onCancel();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {audioURL ? 'Voice Message' : 'Recording...'}
          </h3>
          <button
            onClick={cancelRecording}
            className="p-2 hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Waveform Visualization */}
        <div className="bg-black/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-1 h-24">
            {waveform.length > 0 ? (
              waveform.map((amplitude, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.max(amplitude * 100, 4)}%`,
                  }}
                />
              ))
            ) : (
              <div className="flex items-center gap-1">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-2 bg-gray-600 rounded-full"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="text-center mt-4">
            <span className="text-2xl font-mono text-white">
              {formatTime(recordingTime)}
            </span>
            <span className="text-white/50 text-sm ml-2">/ {formatTime(MAX_DURATION)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!audioURL ? (
            <>
              {/* Cancel */}
              <button
                onClick={cancelRecording}
                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-lg"
                title="Cancel"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Pause/Resume */}
              {isRecording && (
                <button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all shadow-lg"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? (
                    <Play className="w-6 h-6 text-white" />
                  ) : (
                    <Pause className="w-6 h-6 text-white" />
                  )}
                </button>
              )}

              {/* Stop */}
              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full transition-all shadow-lg"
                  title="Stop & Send"
                >
                  <Send className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Start (initial state) */}
              {!isRecording && (
                <button
                  onClick={startRecording}
                  className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full transition-all shadow-2xl animate-pulse"
                  title="Start Recording"
                >
                  <Mic className="w-8 h-8 text-white" />
                </button>
              )}
            </>
          ) : (
            <>
              {/* Re-record */}
              <button
                onClick={() => {
                  setAudioURL(null);
                  setAudioBlob(null);
                  setRecordingTime(0);
                  setWaveform([]);
                  startRecording();
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
              >
                Re-record
              </button>

              {/* Send */}
              <button
                onClick={sendVoiceMessage}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full transition-all text-white font-semibold shadow-lg flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </>
          )}
        </div>

        {/* Audio Preview */}
        {audioURL && (
          <div className="mt-6">
            <audio
              src={audioURL}
              controls
              className="w-full"
              style={{ height: '40px' }}
            />
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !audioURL && (
          <p className="text-center text-white/50 text-sm mt-6">
            Click the microphone to start recording
          </p>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
