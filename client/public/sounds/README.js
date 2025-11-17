// This file serves as documentation for the ringtone sounds
// 
// To add actual ringtone sounds:
// 
// Option 1: Use the generate-ringtones.html file
// - Open public/sounds/generate-ringtones.html in a browser
// - Click "Generate Outgoing Ringtone" to download outgoing-ringtone.wav
// - Click "Generate Incoming Ringtone" to download incoming-ringtone.wav
// - Convert WAV files to MP3 using an online converter or FFmpeg:
//   ffmpeg -i outgoing-ringtone.wav -codec:a libmp3lame -qscale:a 2 outgoing-ringtone.mp3
//   ffmpeg -i incoming-ringtone.wav -codec:a libmp3lame -qscale:a 2 incoming-ringtone.mp3
//
// Option 2: Use free ringtone websites
// - Download free ringtones from:
//   * https://www.zedge.net/
//   * https://www.mobile9.com/
//   * https://freesound.org/
// - Save as:
//   * outgoing-ringtone.mp3 (for caller - beeping sound)
//   * incoming-ringtone.mp3 (for receiver - ringing sound)
//
// Option 3: Use default browser notification sounds
// - The app will gracefully handle missing audio files
// - You can add your own MP3 files later

export const RINGTONE_PATHS = {
  outgoing: '/sounds/outgoing-ringtone.mp3',
  incoming: '/sounds/incoming-ringtone.mp3',
};
