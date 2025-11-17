'use client';

import { useState, useCallback } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Monitor, MonitorOff,
  Volume2, VolumeX, SwitchCamera, Settings, MoreVertical, Maximize2,
  Minimize2, Clock
} from 'lucide-react';

export default function CallControlsPanel({
  isMuted,
  isVideoOff,
  isScreenSharing,
  callDuration,
  networkQuality,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onSwitchCamera,
  onEndCall,
  onToggleSpeaker,
  onToggleFullscreen,
  isFullscreen,
  showExtendedControls,
  onShowSettings,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  const handleToggleSpeaker = useCallback(() => {
    setSpeakerEnabled(!speakerEnabled);
    if (onToggleSpeaker) onToggleSpeaker(!speakerEnabled);
  }, [speakerEnabled, onToggleSpeaker]);

  const getNetworkQualityColor = () => {
    switch (networkQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-green-300';
      case 'poor': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getNetworkQualityLabel = () => {
    switch (networkQuality) {
      case 'excellent': return '📶 Excellent';
      case 'good': return '📶 Good';
      case 'poor': return '⚠️ Poor';
      case 'disconnected': return '🔴 Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-6 px-4">
      {/* Top Info Bar */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-4">
          {/* Call Duration */}
          <div className="flex items-center gap-2 text-white text-sm font-semibold">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>{callDuration}</span>
          </div>

          {/* Network Quality */}
          <div className={`flex items-center gap-1 text-sm font-semibold ${getNetworkQualityColor()}`}>
            {getNetworkQualityLabel()}
          </div>

          {/* Status Indicators */}
          <div className="flex gap-2">
            {isMuted && (
              <div className="px-2 py-1 bg-red-500/30 rounded text-red-300 text-xs font-semibold flex items-center gap-1">
                <MicOff className="w-3 h-3" />
                Muted
              </div>
            )}
            {isVideoOff && (
              <div className="px-2 py-1 bg-red-500/30 rounded text-red-300 text-xs font-semibold flex items-center gap-1">
                <VideoOff className="w-3 h-3" />
                Camera Off
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
          title="Settings (S)"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          className={`relative p-4 rounded-full transition-all duration-200 flex items-center justify-center group ${
            isMuted
              ? 'bg-red-500/30 border-2 border-red-500 hover:bg-red-500/50'
              : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
          }`}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6 text-red-400" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </button>

        {/* Camera Button */}
        <button
          onClick={onToggleVideo}
          title={isVideoOff ? 'Turn on camera (V)' : 'Turn off camera (V)'}
          className={`relative p-4 rounded-full transition-all duration-200 flex items-center justify-center group ${
            isVideoOff
              ? 'bg-red-500/30 border-2 border-red-500 hover:bg-red-500/50'
              : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
          }`}
        >
          {isVideoOff ? (
            <VideoOff className="w-6 h-6 text-red-400" />
          ) : (
            <Video className="w-6 h-6 text-white" />
          )}
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
            {isVideoOff ? 'Enable Camera' : 'Disable Camera'}
          </span>
        </button>

        {/* Flip Camera Button */}
        <button
          onClick={onSwitchCamera}
          title="Flip Camera (F)"
          className="relative p-4 rounded-full bg-white/10 border-2 border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center group text-white"
        >
          <SwitchCamera className="w-6 h-6" />
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
            Flip Camera
          </span>
        </button>

        {/* Screen Share Button */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing (X)' : 'Share screen (X)'}
          className={`relative p-4 rounded-full transition-all duration-200 flex items-center justify-center group ${
            isScreenSharing
              ? 'bg-blue-500/30 border-2 border-blue-500 hover:bg-blue-500/50'
              : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
          }`}
        >
          {isScreenSharing ? (
            <Monitor className="w-6 h-6 text-blue-400" />
          ) : (
            <MonitorOff className="w-6 h-6 text-white" />
          )}
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
            {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          </span>
        </button>

        {/* Speaker Button */}
        <button
          onClick={handleToggleSpeaker}
          title={speakerEnabled ? 'Disable speaker' : 'Enable speaker'}
          className={`relative p-4 rounded-full transition-all duration-200 flex items-center justify-center group ${
            speakerEnabled
              ? 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
              : 'bg-orange-500/30 border-2 border-orange-500 hover:bg-orange-500/50'
          }`}
        >
          {speakerEnabled ? (
            <Volume2 className="w-6 h-6 text-white" />
          ) : (
            <VolumeX className="w-6 h-6 text-orange-400" />
          )}
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
            {speakerEnabled ? 'Speaker On' : 'Speaker Off'}
          </span>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen (Z)' : 'Fullscreen (Z)'}
          className="relative p-4 rounded-full bg-white/10 border-2 border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center group text-white"
        >
          {isFullscreen ? (
            <Minimize2 className="w-6 h-6" />
          ) : (
            <Maximize2 className="w-6 h-6" />
          )}
          <span className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </button>

        {/* End Call Button (Spacer, then button) */}
        <div className="flex-1" />

        <button
          onClick={onEndCall}
          title="End call (ESC)"
          className="p-4 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition-all duration-200 flex items-center justify-center text-white shadow-lg shadow-red-500/50 hover:shadow-red-500/70 active:scale-95"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-900/90 border border-white/10 rounded-lg p-4 mt-4 space-y-3">
          <div className="text-white text-sm font-semibold mb-3">⚙️ Call Settings</div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
            <div>Keyboard shortcuts:</div>
            <div></div>
            <div>M - Mute/Unmute</div>
            <div>V - Toggle camera</div>
            <div>X - Share screen</div>
            <div>Z - Fullscreen</div>
            <div>F - Flip camera</div>
            <div>ESC - End call</div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Handler */}
      <style>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }
      `}</style>
    </div>
  );
}
