// voiceChat.ts - WebRTC Voice Chat Service
// Handles peer-to-peer audio connections between players

import { logger } from "../utils/logger";

// WebRTC signaling message types
export interface WebRTCOffer {
  senderId: string;
  offer: RTCSessionDescriptionInit;
}

export interface WebRTCAnswer {
  senderId: string;
  answer: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidate {
  senderId: string;
  candidate: RTCIceCandidateInit;
}

// Callback types for sending messages through Nakama
export type SendSignalCallback = (
  type: "offer" | "answer" | "ice",
  data: any
) => void;

// Callback for voice activity detection
export type VoiceActivityCallback = (isSpeaking: boolean, isLocal: boolean) => void;

class VoiceChatService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private sendSignalCallback: SendSignalCallback | null = null;
  private isInitiator: boolean = false;
  private isMuted: boolean = false;
  private currentUserId: string | null = null;

  // ICE servers for NAT traversal (using public STUN servers)
  private iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  // Audio element for remote audio (created dynamically)
  private remoteAudio: HTMLAudioElement | null = null;

  // Voice activity detection
  private audioContext: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private remoteAnalyser: AnalyserNode | null = null;
  private voiceActivityCallback: VoiceActivityCallback | null = null;
  private vadInterval: ReturnType<typeof setInterval> | null = null;
  private isLocalSpeaking: boolean = false;
  private isRemoteSpeaking: boolean = false;

  constructor() {
    logger.log("[VOICE] VoiceChatService initialized");
  }

  /**
   * Initialize voice chat for a match
   * @param userId - Current user's ID
   * @param isInitiator - Is this user the one initiating the connection?
   * @param sendCallback - Function to send signaling messages through Nakama
   */
  async init(
    userId: string,
    isInitiator: boolean,
    sendCallback: SendSignalCallback
  ): Promise<boolean> {
    logger.log(
      `[VOICE] Initializing voice chat - userId: ${userId}, isInitiator: ${isInitiator}`
    );

    this.currentUserId = userId;
    this.isInitiator = isInitiator;
    this.sendSignalCallback = sendCallback;

    try {
      // Step 1: Get microphone access
      await this.getMicrophoneAccess();

      // Step 2: Create peer connection
      this.createPeerConnection();

      // Step 3: Add local audio tracks to connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
            logger.log("[VOICE] Added local audio track to peer connection");
          }
        });
      }

      // Step 4: If initiator, create and send offer
      if (this.isInitiator) {
        await this.createOffer();
      }

      logger.log("[VOICE] ✓ Voice chat initialized successfully");
      return true;
    } catch (error) {
      logger.error("[VOICE] ✗ Failed to initialize voice chat:", error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Request microphone access from browser
   */
  private async getMicrophoneAccess(): Promise<void> {
    try {
      logger.log("[VOICE] Requesting microphone access...");
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      logger.log("[VOICE] ✓ Microphone access granted");
    } catch (error) {
      logger.error("[VOICE] ✗ Failed to get microphone access:", error);
      throw new Error(
        "Microphone access denied. Please enable microphone permissions."
      );
    }
  }

  /**
   * Create WebRTC peer connection
   */
  private createPeerConnection(): void {
    logger.log("[VOICE] Creating peer connection...");

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.sendSignalCallback) {
        logger.log("[VOICE] Sending ICE candidate");
        this.sendSignalCallback("ice", {
          senderId: this.currentUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle incoming remote audio stream
    this.peerConnection.ontrack = (event) => {
      logger.log("[VOICE] Received remote audio track");
      this.remoteStream = event.streams[0];
      this.playRemoteAudio();
    };

    // Connection state logging
    this.peerConnection.onconnectionstatechange = () => {
      logger.log(
        `[VOICE] Connection state: ${this.peerConnection?.connectionState}`
      );
      if (this.peerConnection?.connectionState === "connected") {
        logger.log("[VOICE] ✓ Voice chat connected!");
      }
    };

    logger.log("[VOICE] ✓ Peer connection created");
  }

  /**
   * Create and send WebRTC offer (initiator only)
   */
  private async createOffer(): Promise<void> {
    if (!this.peerConnection || !this.sendSignalCallback) {
      logger.error("[VOICE] Cannot create offer - missing peer connection");
      return;
    }

    try {
      logger.log("[VOICE] Creating offer...");
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      logger.log("[VOICE] Sending offer to peer");
      this.sendSignalCallback("offer", {
        senderId: this.currentUserId,
        offer: offer,
      });
    } catch (error) {
      logger.error("[VOICE] Failed to create offer:", error);
    }
  }

  /**
   * Handle incoming WebRTC offer (non-initiator)
   */
  async handleOffer(data: WebRTCOffer): Promise<void> {
    if (!this.peerConnection || !this.sendSignalCallback) {
      logger.error("[VOICE] Cannot handle offer - not initialized");
      return;
    }

    try {
      logger.log("[VOICE] Received offer from peer");
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );

      logger.log("[VOICE] Creating answer...");
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      logger.log("[VOICE] Sending answer to peer");
      this.sendSignalCallback("answer", {
        senderId: this.currentUserId,
        answer: answer,
      });
    } catch (error) {
      logger.error("[VOICE] Failed to handle offer:", error);
    }
  }

  /**
   * Handle incoming WebRTC answer (initiator only)
   */
  async handleAnswer(data: WebRTCAnswer): Promise<void> {
    if (!this.peerConnection) {
      logger.error("[VOICE] Cannot handle answer - no peer connection");
      return;
    }

    try {
      logger.log("[VOICE] Received answer from peer");
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
      logger.log("[VOICE] ✓ Answer processed");
    } catch (error) {
      logger.error("[VOICE] Failed to handle answer:", error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(data: WebRTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      logger.error("[VOICE] Cannot handle ICE candidate - no peer connection");
      return;
    }

    try {
      logger.log("[VOICE] Received ICE candidate from peer");
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
      logger.log("[VOICE] ✓ ICE candidate added");
    } catch (error) {
      logger.error("[VOICE] Failed to add ICE candidate:", error);
    }
  }

  /**
   * Play remote audio through speakers
   */
  private playRemoteAudio(): void {
    if (!this.remoteStream) {
      logger.error("[VOICE] No remote stream to play");
      return;
    }

    // Create or reuse audio element
    if (!this.remoteAudio) {
      this.remoteAudio = new Audio();
      this.remoteAudio.autoplay = true;
      this.remoteAudio.volume = 1.0; // Max volume
      logger.log("[VOICE] Created remote audio element");
    }

    this.remoteAudio.srcObject = this.remoteStream;

    // Force play (in case autoplay is blocked)
    this.remoteAudio.play()
      .then(() => {
        logger.log("[VOICE] ✓ Playing remote audio successfully");
      })
      .catch((error) => {
        logger.error("[VOICE] Failed to play remote audio:", error);
        logger.error("[VOICE] This might be browser autoplay policy - try clicking anywhere on the page");
      });

    // Set up voice activity detection for remote audio
    this.setupVoiceActivityDetection();
  }

  /**
   * Set up voice activity detection (VAD) for both local and remote audio
   */
  private setupVoiceActivityDetection(): void {
    try {
      // Create audio context
      this.audioContext = new AudioContext();

      // Set up local audio analysis
      if (this.localStream) {
        const localSource = this.audioContext.createMediaStreamSource(
          this.localStream
        );
        this.localAnalyser = this.audioContext.createAnalyser();
        this.localAnalyser.fftSize = 256;
        this.localAnalyser.smoothingTimeConstant = 0.8;
        localSource.connect(this.localAnalyser);
        logger.log("[VAD] Local audio analyser set up");
      }

      // Set up remote audio analysis
      if (this.remoteStream) {
        const remoteSource = this.audioContext.createMediaStreamSource(
          this.remoteStream
        );
        this.remoteAnalyser = this.audioContext.createAnalyser();
        this.remoteAnalyser.fftSize = 256;
        this.remoteAnalyser.smoothingTimeConstant = 0.8;
        remoteSource.connect(this.remoteAnalyser);
        logger.log("[VAD] Remote audio analyser set up");
      }

      // Start monitoring audio levels
      this.startVoiceActivityMonitoring();
    } catch (error) {
      logger.error("[VAD] Failed to set up voice activity detection:", error);
    }
  }

  /**
   * Start monitoring audio levels and detect speech
   */
  private startVoiceActivityMonitoring(): void {
    if (!this.localAnalyser && !this.remoteAnalyser) {
      return;
    }

    // Check audio levels every 100ms
    this.vadInterval = setInterval(() => {
      // Check local audio (my microphone)
      if (this.localAnalyser && !this.isMuted) {
        const localLevel = this.getAudioLevel(this.localAnalyser);
        const isLocalSpeaking = localLevel > 0.02; // Threshold for speech

        if (isLocalSpeaking !== this.isLocalSpeaking) {
          this.isLocalSpeaking = isLocalSpeaking;
          this.voiceActivityCallback?.(isLocalSpeaking, true);
        }
      }

      // Check remote audio (opponent's microphone)
      if (this.remoteAnalyser) {
        const remoteLevel = this.getAudioLevel(this.remoteAnalyser);
        const isRemoteSpeaking = remoteLevel > 0.02; // Threshold for speech

        if (isRemoteSpeaking !== this.isRemoteSpeaking) {
          this.isRemoteSpeaking = isRemoteSpeaking;
          this.voiceActivityCallback?.(isRemoteSpeaking, false);
        }
      }
    }, 100);

    logger.log("[VAD] Voice activity monitoring started");
  }

  /**
   * Get current audio level (0.0 to 1.0)
   */
  private getAudioLevel(analyser: AnalyserNode): number {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    // Normalize to 0.0 - 1.0
    return average / 255;
  }

  /**
   * Set callback for voice activity changes
   */
  setVoiceActivityCallback(callback: VoiceActivityCallback): void {
    this.voiceActivityCallback = callback;
  }

  /**
   * Mute/unmute local microphone
   */
  toggleMute(): boolean {
    if (!this.localStream) {
      logger.error("[VOICE] Cannot toggle mute - no local stream");
      return false;
    }

    this.isMuted = !this.isMuted;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });

    logger.log(`[VOICE] Microphone ${this.isMuted ? "muted" : "unmuted"}`);
    return this.isMuted;
  }

  /**
   * Get current mute state
   */
  getMuteState(): boolean {
    return this.isMuted;
  }

  /**
   * Check if voice chat is connected
   */
  isConnected(): boolean {
    return this.peerConnection?.connectionState === "connected";
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    logger.log("[VOICE] Cleaning up voice chat...");

    // Stop voice activity monitoring
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
      logger.log("[VAD] Stopped monitoring");
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      logger.log("[VAD] Closed audio context");
    }

    // Stop local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
      logger.log("[VOICE] Stopped local stream");
    }

    // Stop remote audio
    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
      this.remoteAudio = null;
      logger.log("[VOICE] Stopped remote audio");
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      logger.log("[VOICE] Closed peer connection");
    }

    // Reset state
    this.remoteStream = null;
    this.sendSignalCallback = null;
    this.isInitiator = false;
    this.isMuted = false;
    this.currentUserId = null;
    this.localAnalyser = null;
    this.remoteAnalyser = null;
    this.voiceActivityCallback = null;
    this.isLocalSpeaking = false;
    this.isRemoteSpeaking = false;

    logger.log("[VOICE] ✓ Voice chat cleanup complete");
  }
}

// Export singleton instance
export const voiceChatService = new VoiceChatService();
