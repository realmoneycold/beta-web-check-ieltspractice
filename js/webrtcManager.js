/**
 * WebRTC Manager for Live Hub
 * Handles voice/video calls, peer connections, and media streaming
 * Discord-like functionality for IELTS Practice rooms
 */

class WebRTCManager {
    constructor() {
        this.socket = null;
        this.localStream = null;
        this.screenStream = null;
        this.peers = new Map(); // socketId -> RTCPeerConnection
        this.remoteStreams = new Map(); // socketId -> MediaStream
        this.roomId = null;
        this.isMuted = false;
        this.isVideoOn = false;
        this.isDeafened = false;
        this.isScreenSharing = false;
        this.onParticipantJoined = null;
        this.onParticipantLeft = null;
        this.onRemoteStream = null;
        this.onLocalStream = null;
        this.onVoiceActivity = null;
        this.onMessage = null;
        this.onScreenShare = null;
        this.audioAnalyser = null;
        this.voiceActivityInterval = null;
        
        // STUN/TURN servers configuration
        this.iceServers = [
            // Public STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            // Coturn server (when configured)
            {
                urls: process.env.COTURN_URL || 'turn:your-server.com:3478',
                username: process.env.COTURN_USER || 'user',
                credential: process.env.COTURN_PASS || 'pass'
            }
        ];
    }

    /**
     * Initialize Socket.io connection and set up event handlers
     */
    async initialize() {
        const token = localStorage.getItem('token') || localStorage.getItem('ielts_token');
        const serverUrl = window.location.origin;
        
        this.socket = io(serverUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.setupSocketHandlers();
        
        return new Promise((resolve, reject) => {
            this.socket.on('connect', () => {
                console.log('✅ Connected to signaling server');
                resolve();
            });
            
            this.socket.on('connect_error', (err) => {
                console.error('❌ Signaling server connection error:', err);
                reject(err);
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!this.socket.connected) {
                    reject(new Error('Connection timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Set up all Socket.io event handlers
     */
    setupSocketHandlers() {
        // Room events
        this.socket.on('user-joined', (participant) => this.handleUserJoined(participant));
        this.socket.on('user-left', ({ socketId }) => this.handleUserLeft(socketId));
        this.socket.on('existing-participants', (participants) => this.handleExistingParticipants(participants));
        
        // WebRTC signaling
        this.socket.on('offer', ({ senderId, offer }) => this.handleOffer(senderId, offer));
        this.socket.on('answer', ({ senderId, answer }) => this.handleAnswer(senderId, answer));
        this.socket.on('ice-candidate', ({ senderId, candidate }) => this.handleIceCandidate(senderId, candidate));
        
        // Media state
        this.socket.on('media-state-change', (data) => this.handleRemoteMediaStateChange(data));
        this.socket.on('voice-activity', (data) => this.handleRemoteVoiceActivity(data));
        
        // Chat
        this.socket.on('new-message', (message) => {
            if (this.onMessage) this.onMessage(message);
        });
        this.socket.on('message-history', (messages) => {
            messages.forEach(msg => {
                if (this.onMessage) this.onMessage(msg);
            });
        });
        this.socket.on('user-typing', (data) => {
            // Handle typing indicator
        });
        
        // Screen sharing
        this.socket.on('screen-share-started', (data) => {
            if (this.onScreenShare) this.onScreenShare('started', data);
        });
        this.socket.on('screen-share-stopped', (data) => {
            if (this.onScreenShare) this.onScreenShare('stopped', data);
        });
        this.socket.on('screen-share-active', ({ userId }) => {
            console.log('Screen share active by:', userId);
        });
        
        // Errors
        this.socket.on('room-error', ({ message }) => {
            console.error('Room error:', message);
            alert(message);
        });
        
        this.socket.on('screen-share-error', ({ message }) => {
            console.error('Screen share error:', message);
            alert(message);
        });
    }

    /**
     * Join a voice/video room with enhanced permission handling
     */
    async joinRoom(roomId, roomType, userName, avatar, isHost = false, onPermissionError = null) {
        this.roomId = roomId;

        // Get user media before joining with error handling
        let mediaError = null;

        try {
            // Try audio + video first
            await this.getLocalStream(true, true, (error) => {
                mediaError = error;
                if (onPermissionError) onPermissionError(error);
            });
            console.log('✅ Got camera and microphone access');
        } catch (err) {
            console.warn('⚠️ Could not get camera/mic:', err.name, err.message);

            if (!mediaError) {
                mediaError = err;
                if (onPermissionError) onPermissionError(err);
            }

            // Try audio only as fallback
            try {
                await this.getLocalStream(true, false, (error) => {
                    if (!mediaError) {
                        mediaError = error;
                        if (onPermissionError) onPermissionError(error);
                    }
                });
                console.log('✅ Got microphone access (audio only)');
            } catch (err2) {
                console.error('❌ Could not get any media:', err2);

                // Still join the room but notify about media issue
                if (this.onMessage) {
                    this.onMessage({
                        id: Date.now(),
                        userName: 'System',
                        avatar: null,
                        text: '⚠️ Unable to access camera or microphone. You can still participate via chat.',
                        type: 'system',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }

        this.socket.emit('join-room', {
            roomId,
            roomType,
            userName,
            avatar,
            isHost
        });

        // Start voice activity detection if we have audio
        if (this.localStream && this.localStream.getAudioTracks().length > 0) {
            this.startVoiceActivityDetection();
        }
    }

    /**
     * Leave the current room
     */
    leaveRoom() {
        this.stopVoiceActivityDetection();
        
        // Close all peer connections
        this.peers.forEach((peer, socketId) => {
            peer.close();
        });
        this.peers.clear();
        this.remoteStreams.clear();
        
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        // Stop screen share if active
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
        
        if (this.roomId) {
            this.socket.emit('leave-room', { roomId: this.roomId });
            this.roomId = null;
        }
    }

    /**
     * Get local media stream (camera/mic) with comprehensive permission handling
     * @param {boolean} audio - Request microphone access
     * @param {boolean} video - Request camera access
     * @param {Function} onPermissionError - Callback for permission errors with user-friendly message
     * @returns {Promise<MediaStream>} Local media stream
     */
    async getLocalStream(audio = true, video = true, onPermissionError = null) {
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const error = new Error('Your browser does not support video calling. Please use Chrome, Firefox, or Safari.');
            error.name = 'NotSupportedError';
            if (onPermissionError) onPermissionError(error);
            throw error;
        }

        try {
            const constraints = {
                audio: audio ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                } : false,
                video: video ? {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 30, min: 15 }
                } : false
            };

            // Request permissions with timeout
            const permissionPromise = navigator.mediaDevices.getUserMedia(constraints);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Permission request timed out')), 15000);
            });

            this.localStream = await Promise.race([permissionPromise, timeoutPromise]);

            // Verify we got the requested tracks
            const audioTracks = this.localStream.getAudioTracks();
            const videoTracks = this.localStream.getVideoTracks();

            if (audio && audioTracks.length === 0) {
                console.warn('⚠️ No audio tracks received despite requesting audio');
            }
            if (video && videoTracks.length === 0) {
                console.warn('⚠️ No video tracks received despite requesting video');
            }

            // Set up track ended handlers (e.g., user disables camera in OS)
            audioTracks.forEach(track => {
                track.onended = () => {
                    console.log('🎤 Audio track ended (user may have disabled mic)');
                    this.isMuted = true;
                };
            });

            videoTracks.forEach(track => {
                track.onended = () => {
                    console.log('📹 Video track ended (user may have disabled camera)');
                    this.isVideoOn = false;
                };
            });

            if (this.onLocalStream) {
                this.onLocalStream(this.localStream);
            }

            this.isMuted = !audio || audioTracks.length === 0;
            this.isVideoOn = video && videoTracks.length > 0;

            return this.localStream;

        } catch (err) {
            console.error('❌ getUserMedia error:', err.name, err.message);

            // Provide user-friendly error messages
            const enhancedError = this.enhancePermissionError(err);

            if (onPermissionError) {
                onPermissionError(enhancedError);
            }

            throw enhancedError;
        }
    }

    /**
     * Enhance permission errors with user-friendly messages and recovery suggestions
     */
    enhancePermissionError(err) {
        const enhanced = new Error(err.message);
        enhanced.name = err.name;
        enhanced.originalError = err;

        switch (err.name) {
            case 'NotAllowedError':
            case 'PermissionDeniedError':
                enhanced.userMessage = '🚫 Camera/Microphone Access Denied';
                enhanced.description = 'Please allow camera and microphone access in your browser settings to join the video call.';
                enhanced.recoverySteps = [
                    'Click the lock/site info icon in your browser address bar',
                    'Find "Camera" and "Microphone" permissions',
                    'Change from "Block" to "Allow"',
                    'Refresh the page and try again'
                ];
                enhanced.isRecoverable = true;
                break;

            case 'NotFoundError':
            case 'DevicesNotFoundError':
                enhanced.userMessage = '📷 No Camera or Microphone Found';
                enhanced.description = 'We could not detect a camera or microphone on your device.';
                enhanced.recoverySteps = [
                    'Connect a webcam or headset with microphone',
                    'Ensure your devices are not being used by another application',
                    'Check that your devices are properly connected'
                ];
                enhanced.isRecoverable = true;
                break;

            case 'NotReadableError':
            case 'TrackStartError':
                enhanced.userMessage = '🔌 Device is Busy';
                enhanced.description = 'Your camera or microphone is being used by another application.';
                enhanced.recoverySteps = [
                    'Close other apps using your camera (Zoom, Teams, etc.)',
                    'Refresh the page',
                    'Try disconnecting and reconnecting your devices'
                ];
                enhanced.isRecoverable = true;
                break;

            case 'OverconstrainedError':
                enhanced.userMessage = '⚙️ Camera Resolution Not Supported';
                enhanced.description = 'Your camera does not support the requested resolution.';
                enhanced.recoverySteps = [
                    'Try using a different camera',
                    'Join with audio only (camera disabled)'
                ];
                enhanced.isRecoverable = true;
                break;

            case 'AbortError':
                enhanced.userMessage = '⏹️ Permission Request Cancelled';
                enhanced.description = 'You cancelled the permission request or it timed out.';
                enhanced.recoverySteps = [
                    'Click "Join Room" again',
                    'Allow permissions when prompted'
                ];
                enhanced.isRecoverable = true;
                break;

            case 'NotSupportedError':
                enhanced.userMessage = err.message;
                enhanced.description = 'Your browser does not support WebRTC.';
                enhanced.recoverySteps = [
                    'Please use Chrome, Firefox, Safari, or Edge'
                ];
                enhanced.isRecoverable = false;
                break;

            case 'SecurityError':
                enhanced.userMessage = '🔒 Insecure Connection';
                enhanced.description = 'Camera and microphone require a secure HTTPS connection or localhost.';
                enhanced.recoverySteps = [
                    'Access the site via HTTPS',
                    'If testing locally, use http://localhost instead of http://127.0.0.1'
                ];
                enhanced.isRecoverable = true;
                break;

            default:
                enhanced.userMessage = '❌ Media Access Error';
                enhanced.description = `An unexpected error occurred: ${err.message}`;
                enhanced.recoverySteps = [
                    'Check that your devices are connected',
                    'Refresh the page and try again',
                    'Try using a different browser'
                ];
                enhanced.isRecoverable = true;
        }

        return enhanced;
    }

    /**
     * Try to get audio-only stream as fallback when video fails
     */
    async getAudioOnlyStream(onPermissionError = null) {
        try {
            return await this.getLocalStream(true, false, onPermissionError);
        } catch (err) {
            console.error('❌ Audio-only fallback also failed:', err);
            throw err;
        }
    }

    /**
     * Start screen sharing
     */
    async startScreenShare() {
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: true
            });
            
            // Replace video track in all peer connections
            const screenTrack = this.screenStream.getVideoTracks()[0];
            
            this.peers.forEach((peer) => {
                const sender = peer.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });
            
            // Handle screen share stop
            screenTrack.onended = () => {
                this.stopScreenShare();
            };
            
            this.isScreenSharing = true;
            this.socket.emit('screen-share-start', { isScreenSharing: true });
            
            return this.screenStream;
        } catch (err) {
            console.error('Error starting screen share:', err);
            throw err;
        }
    }

    /**
     * Stop screen sharing
     */
    async stopScreenShare() {
        if (!this.screenStream) return;
        
        // Stop screen stream
        this.screenStream.getTracks().forEach(track => track.stop());
        
        // Restore camera video to peer connections
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                this.peers.forEach((peer) => {
                    const sender = peer.getSenders().find(s => 
                        s.track && s.track.kind === 'video'
                    );
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                });
            }
        }
        
        this.screenStream = null;
        this.isScreenSharing = false;
        this.socket.emit('screen-share-stop', {});
    }

    /**
     * Handle new user joining room
     */
    async handleUserJoined(participant) {
        console.log('👤 User joined:', participant.name);
        
        // Create peer connection for this user
        await this.createPeerConnection(participant.socketId, true);
        
        if (this.onParticipantJoined) {
            this.onParticipantJoined(participant);
        }
    }

    /**
     * Handle user leaving room
     */
    handleUserLeft(socketId) {
        console.log('👋 User left:', socketId);
        
        // Close peer connection
        const peer = this.peers.get(socketId);
        if (peer) {
            peer.close();
            this.peers.delete(socketId);
        }
        
        // Remove remote stream
        this.remoteStreams.delete(socketId);
        
        if (this.onParticipantLeft) {
            this.onParticipantLeft(socketId);
        }
    }

    /**
     * Handle existing participants when joining
     */
    async handleExistingParticipants(participants) {
        console.log('📋 Existing participants:', participants.length);
        
        for (const participant of participants) {
            // Don't create connection to self
            if (participant.socketId === this.socket.id) continue;
            
            // Create peer connection (they will send offer)
            await this.createPeerConnection(participant.socketId, false);
            
            if (this.onParticipantJoined) {
                this.onParticipantJoined(participant);
            }
        }
    }

    /**
     * Create RTCPeerConnection
     */
    async createPeerConnection(socketId, isInitiator) {
        const peer = new RTCPeerConnection({
            iceServers: this.iceServers
        });
        
        this.peers.set(socketId, peer);
        
        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peer.addTrack(track, this.localStream);
            });
        }
        
        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    targetId: socketId,
                    candidate: event.candidate
                });
            }
        };
        
        // Handle remote stream
        peer.ontrack = (event) => {
            console.log('📺 Received remote stream from:', socketId);
            this.remoteStreams.set(socketId, event.streams[0]);
            
            if (this.onRemoteStream) {
                this.onRemoteStream(socketId, event.streams[0]);
            }
        };
        
        // Handle connection state changes
        peer.onconnectionstatechange = () => {
            console.log(`Connection state with ${socketId}:`, peer.connectionState);
        };
        
        // If initiator, create and send offer
        if (isInitiator) {
            try {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                
                this.socket.emit('offer', {
                    targetId: socketId,
                    offer: offer
                });
            } catch (err) {
                console.error('Error creating offer:', err);
            }
        }
        
        return peer;
    }

    /**
     * Handle incoming WebRTC offer
     */
    async handleOffer(senderId, offer) {
        console.log('📨 Received offer from:', senderId);
        
        let peer = this.peers.get(senderId);
        if (!peer) {
            peer = await this.createPeerConnection(senderId, false);
        }
        
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            
            this.socket.emit('answer', {
                targetId: senderId,
                answer: answer
            });
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    }

    /**
     * Handle incoming WebRTC answer
     */
    async handleAnswer(senderId, answer) {
        console.log('📨 Received answer from:', senderId);
        
        const peer = this.peers.get(senderId);
        if (peer) {
            try {
                await peer.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        }
    }

    /**
     * Handle incoming ICE candidate
     */
    async handleIceCandidate(senderId, candidate) {
        const peer = this.peers.get(senderId);
        if (peer) {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        }
    }

    /**
     * Toggle microphone mute
     */
    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isMuted = !audioTrack.enabled;
                
                this.socket.emit('media-state-change', {
                    isMuted: this.isMuted
                });
                
                return this.isMuted;
            }
        }
        return false;
    }

    /**
     * Toggle deafen (mute incoming audio)
     */
    toggleDeafen() {
        this.isDeafened = !this.isDeafened;
        
        // Mute/unmute all remote audio elements
        this.remoteStreams.forEach((stream, socketId) => {
            const audioTracks = stream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !this.isDeafened;
            });
        });
        
        this.socket.emit('media-state-change', {
            isDeafened: this.isDeafened
        });
        
        return this.isDeafened;
    }

    /**
     * Toggle video on/off
     */
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoOn = videoTrack.enabled;
                
                this.socket.emit('media-state-change', {
                    isVideoOn: this.isVideoOn
                });
                
                return this.isVideoOn;
            }
        }
        return false;
    }

    /**
     * Handle remote media state changes
     */
    handleRemoteMediaStateChange({ socketId, isMuted, isVideoOn, isDeafened }) {
        console.log(`🎤 Remote media state - ${socketId}:`, { isMuted, isVideoOn, isDeafened });
        // UI updates handled by callback
    }

    /**
     * Start voice activity detection
     */
    startVoiceActivityDetection() {
        if (!this.localStream) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(this.localStream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        let lastSpeakingState = false;
        
        this.voiceActivityInterval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            // Threshold for speaking detection
            const isSpeaking = average > 20;
            
            if (isSpeaking !== lastSpeakingState) {
                lastSpeakingState = isSpeaking;
                this.socket.emit('voice-activity', { isSpeaking });
                
                if (this.onVoiceActivity) {
                    this.onVoiceActivity(this.socket.id, isSpeaking);
                }
            }
        }, 100); // Check every 100ms
        
        this.audioAnalyser = audioContext;
    }

    /**
     * Stop voice activity detection
     */
    stopVoiceActivityDetection() {
        if (this.voiceActivityInterval) {
            clearInterval(this.voiceActivityInterval);
            this.voiceActivityInterval = null;
        }
        
        if (this.audioAnalyser) {
            this.audioAnalyser.close();
            this.audioAnalyser = null;
        }
    }

    /**
     * Handle remote voice activity
     */
    handleRemoteVoiceActivity({ socketId, isSpeaking }) {
        if (this.onVoiceActivity) {
            this.onVoiceActivity(socketId, isSpeaking);
        }
    }

    /**
     * Send chat message
     */
    sendMessage(text) {
        this.socket.emit('send-message', { text, type: 'text' });
    }

    /**
     * Send typing indicator
     */
    sendTyping(isTyping) {
        this.socket.emit('typing', { isTyping });
    }

    /**
     * Disconnect from signaling server
     */
    disconnect() {
        this.leaveRoom();
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCManager;
}
