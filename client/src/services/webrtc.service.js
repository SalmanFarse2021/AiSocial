// WebRTC Configuration
const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
    // Add TURN servers here if needed for production
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password',
    // },
  ],
  iceCandidatePoolSize: 10,
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.onIceCandidate = null;
    this.onTrack = null;
    this.onConnectionStateChange = null;
  }

  // Initialize peer connection
  createPeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.onIceCandidate) {
          this.onIceCandidate(event.candidate);
        }
      };

      // Handle remote tracks
      this.peerConnection.ontrack = (event) => {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream.addTrack(track);
        });
        
        if (this.onTrack) {
          this.onTrack(this.remoteStream);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', this.peerConnection.connectionState);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(this.peerConnection.connectionState);
        }
      };

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      };

      return this.peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  }

  // Get user media (audio/video stream)
  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  // Add local stream to peer connection
  addLocalStreamToPeer() {
    if (!this.peerConnection || !this.localStream) {
      throw new Error('Peer connection or local stream not initialized');
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });
  }

  // Create offer (caller)
  async createOffer() {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  // Create answer (callee)
  async createAnswer() {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  // Set remote description
  async setRemoteDescription(description) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      );
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  }

  // Add ICE candidate
  async addIceCandidate(candidate) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }

  // Toggle audio
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      return enabled;
    }
    return false;
  }

  // Toggle video
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      return enabled;
    }
    return false;
  }

  // Switch to audio only
  async switchToAudioOnly() {
    if (this.localStream) {
      // Stop video tracks
      this.localStream.getVideoTracks().forEach((track) => {
        track.stop();
        this.localStream.removeTrack(track);
      });

      // Get new audio-only stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Replace tracks in peer connection
      const audioTrack = audioStream.getAudioTracks()[0];
      const sender = this.peerConnection
        .getSenders()
        .find((s) => s.track && s.track.kind === 'audio');
      
      if (sender) {
        sender.replaceTrack(audioTrack);
      }

      this.localStream = audioStream;
      return audioStream;
    }
  }

  // Switch to video
  async switchToVideo() {
    if (this.localStream) {
      // Get new video stream
      const videoStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Replace tracks in peer connection
      const videoTrack = videoStream.getVideoTracks()[0];
      const audioTrack = videoStream.getAudioTracks()[0];

      const videoSender = this.peerConnection
        .getSenders()
        .find((s) => s.track && s.track.kind === 'video');
      const audioSender = this.peerConnection
        .getSenders()
        .find((s) => s.track && s.track.kind === 'audio');

      if (videoSender) {
        videoSender.replaceTrack(videoTrack);
      } else {
        this.peerConnection.addTrack(videoTrack, videoStream);
      }

      if (audioSender) {
        audioSender.replaceTrack(audioTrack);
      }

      // Stop old tracks
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = videoStream;
      return videoStream;
    }
  }

  // Get connection stats
  async getStats() {
    if (this.peerConnection) {
      return await this.peerConnection.getStats();
    }
    return null;
  }

  // Close connection and cleanup
  closeConnection() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear callbacks
    this.onIceCandidate = null;
    this.onTrack = null;
    this.onConnectionStateChange = null;
  }

  // Check if browser supports WebRTC
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  }

  // Get available devices
  static async getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter((d) => d.kind === 'audioinput'),
        videoInputs: devices.filter((d) => d.kind === 'videoinput'),
        audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      };
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }
}

export default WebRTCService;
