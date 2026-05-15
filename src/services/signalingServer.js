/**
 * WebRTC Signaling Server for Live Hub Voice/Video
 * Handles room management, peer connections, and real-time communication
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SignalingServer {
    constructor(httpServer, corsOptions) {
        this.io = new Server(httpServer, {
            cors: corsOptions,
            transports: ['websocket', 'polling']
        });

        // Store active rooms and their participants
        this.rooms = new Map(); // roomId -> { participants: Map(), messages: [] }

        // Global room registry for dashboard visibility (persistent across sessions)
        this.globalRooms = new Map(); // roomId -> room data

        this.setupSocketHandlers();

        // Set up periodic broadcast of room updates
        this.startRoomBroadcasts();

        console.log('✅ WebRTC Signaling Server initialized');
    }

    /**
     * Start periodic broadcasts of room updates to all connected clients
     */
    startRoomBroadcasts() {
        // Broadcast room list every 5 seconds to keep all clients in sync
        setInterval(() => {
            this.broadcastGlobalRooms();
        }, 5000);
    }

    /**
     * Broadcast global room list to all connected clients
     */
    broadcastGlobalRooms() {
        const roomsList = this.getGlobalRoomsList();
        this.io.emit('rooms-update', roomsList);
    }

    /**
     * Build a public-facing snapshot of an active room's participants.
     */
    serializeActiveParticipants(activeRoom) {
        if (!activeRoom) return [];
        return Array.from(activeRoom.participants.values()).map(p => ({
            id: p.userId,
            socketId: p.socketId,
            name: p.name,
            avatar: p.avatar,
            isHost: p.isHost,
            isMuted: p.isMuted,
            isVideoOn: p.isVideoOn,
            isScreenSharing: p.isScreenSharing,
            isSpeaking: p.isSpeaking
        }));
    }

    /**
     * Get list of all rooms (registered global rooms + any other live rooms,
     * such as the dashboard's static featured/class/drill cards) with current
     * participant counts. Clients use this to render live counts and avatars
     * on every card that shares a known room id.
     */
    getGlobalRoomsList() {
        const seen = new Set();
        const list = [];

        // 1. Registered global rooms (user-created)
        for (const room of this.globalRooms.values()) {
            const activeRoom = this.rooms.get(room.id);
            const activeParticipants = activeRoom ? activeRoom.participants.size : 0;
            list.push({
                id: room.id,
                name: room.name,
                type: room.type,
                host: room.host,
                hostId: room.hostId,
                hostAvatar: room.hostAvatar,
                maxUsers: room.maxUsers || 10,
                participantsCount: activeParticipants,
                participants: this.serializeActiveParticipants(activeRoom),
                isLive: activeParticipants > 0,
                createdAt: room.createdAt,
                tags: room.tags || []
            });
            seen.add(room.id);
        }

        // 2. Any active room not in globalRooms (e.g. featured/class/drill
        //    cards hard-coded on the dashboard) — expose their live counts
        //    so the cards stop showing stale "2/5 users" forever.
        for (const [roomId, activeRoom] of this.rooms.entries()) {
            if (seen.has(roomId)) continue;
            const activeParticipants = activeRoom.participants.size;
            list.push({
                id: roomId,
                name: activeRoom.name || roomId,
                type: activeRoom.type || 'class',
                host: null,
                hostId: null,
                hostAvatar: null,
                maxUsers: activeRoom.maxUsers || 10,
                participantsCount: activeParticipants,
                participants: this.serializeActiveParticipants(activeRoom),
                isLive: activeParticipants > 0,
                createdAt: activeRoom.createdAt || new Date(),
                tags: []
            });
        }

        return list;
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // Authenticate socket connection
            this.authenticateSocket(socket);

            // Send current room list to newly connected client
            socket.emit('rooms-update', this.getGlobalRoomsList());

            // Room management handlers
            socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
            socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));

            // Global room management (for dashboard visibility)
            socket.on('create-room', (data) => this.handleCreateRoom(socket, data));
            socket.on('get-rooms', () => this.handleGetRooms(socket));
            socket.on('delete-room', (data) => this.handleDeleteRoom(socket, data));
            socket.on('room-updated', (data) => this.handleRoomUpdated(socket, data));

            // WebRTC signaling handlers
            socket.on('offer', (data) => this.handleOffer(socket, data));
            socket.on('answer', (data) => this.handleAnswer(socket, data));
            socket.on('ice-candidate', (data) => this.handleIceCandidate(socket, data));

            // Media state handlers
            socket.on('media-state-change', (data) => this.handleMediaStateChange(socket, data));
            socket.on('voice-activity', (data) => this.handleVoiceActivity(socket, data));

            // Chat handlers
            socket.on('send-message', (data) => this.handleSendMessage(socket, data));
            socket.on('typing', (data) => this.handleTyping(socket, data));

            // Screen sharing
            socket.on('screen-share-start', (data) => this.handleScreenShareStart(socket, data));
            socket.on('screen-share-stop', (data) => this.handleScreenShareStop(socket, data));

            // Disconnection handler
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    /**
     * Handle room creation - register room globally for all users to see
     */
    handleCreateRoom(socket, { roomId, name, type, host, hostId, hostAvatar, maxUsers, tags }) {
        console.log(`🏠 Creating global room: ${name} (${roomId}) by ${host}`);

        // Register room in global registry
        this.globalRooms.set(roomId, {
            id: roomId,
            name: name || 'Unnamed Room',
            type: type || 'private',
            host: host || socket.userData.name,
            hostId: hostId || socket.userData.id,
            hostAvatar: hostAvatar || socket.userData.avatar,
            maxUsers: maxUsers || 10,
            tags: tags || [],
            createdAt: new Date(),
            createdBy: socket.id
        });

        // Also create the active room for WebRTC if not exists
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                type: type || 'private',
                participants: new Map(),
                messages: [],
                createdAt: new Date(),
                screenSharer: null
            });
        }

        // Broadcast new room to all connected clients
        this.broadcastGlobalRooms();

        socket.emit('room-created', { roomId, success: true });
        console.log(`✅ Room ${roomId} created and broadcast to all clients`);
    }

    /**
     * Handle request for room list
     */
    handleGetRooms(socket) {
        console.log(`📋 Sending room list to ${socket.userData.name}`);
        socket.emit('rooms-update', this.getGlobalRoomsList());
    }

    /**
     * Handle room deletion
     */
    handleDeleteRoom(socket, { roomId }) {
        const room = this.globalRooms.get(roomId);

        if (!room) {
            socket.emit('room-error', { message: 'Room not found' });
            return;
        }

        // Verify user is the host
        if (room.hostId !== socket.userData.id && room.createdBy !== socket.id) {
            socket.emit('room-error', { message: 'Only the host can delete this room' });
            return;
        }

        console.log(`🗑️ Deleting room: ${roomId}`);

        // Remove from global registry
        this.globalRooms.delete(roomId);

        // Remove active room and disconnect participants
        const activeRoom = this.rooms.get(roomId);
        if (activeRoom) {
            // Notify all participants
            this.io.to(roomId).emit('room-closed', { message: 'Room has been deleted by the host' });

            // Remove all participants
            activeRoom.participants.forEach((participant, socketId) => {
                const participantSocket = this.io.sockets.sockets.get(socketId);
                if (participantSocket) {
                    participantSocket.leave(roomId);
                    participantSocket.roomId = null;
                }
            });

            this.rooms.delete(roomId);
        }

        // Broadcast updated room list
        this.broadcastGlobalRooms();

        socket.emit('room-deleted', { roomId, success: true });
    }

    /**
     * Handle room metadata updates
     */
    handleRoomUpdated(socket, { roomId, updates }) {
        const room = this.globalRooms.get(roomId);

        if (!room) {
            socket.emit('room-error', { message: 'Room not found' });
            return;
        }

        // Only host can update
        if (room.hostId !== socket.userData.id) {
            socket.emit('room-error', { message: 'Only the host can update this room' });
            return;
        }

        // Update allowed fields
        if (updates.name) room.name = updates.name;
        if (updates.tags) room.tags = updates.tags;
        if (updates.maxUsers) room.maxUsers = updates.maxUsers;

        this.globalRooms.set(roomId, room);

        // Broadcast updated room list
        this.broadcastGlobalRooms();

        socket.emit('room-updated', { roomId, success: true });
    }

    authenticateSocket(socket) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) {
                console.warn(`⚠️ No token provided for socket ${socket.id}`);
                socket.userData = { id: 'anonymous', name: 'Anonymous' };
                return;
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            socket.userData = {
                id: decoded.userId || decoded.id,
                name: decoded.fullName || decoded.name || 'User',
                email: decoded.email
            };
            console.log(`✅ Socket ${socket.id} authenticated as ${socket.userData.name}`);
        } catch (err) {
            console.error(`❌ Socket authentication failed: ${err.message}`);
            socket.userData = { id: 'anonymous', name: 'Anonymous' };
        }
    }

    handleJoinRoom(socket, { roomId, roomType, userName, avatar, isHost, maxUsers }) {
        console.log(`🚪 ${socket.userData.name} joining room ${roomId}`);

        // Resolve and clamp maxUsers (absolute server ceiling = 10)
        const requestedMax = Number.isFinite(maxUsers) ? Math.max(2, Math.min(10, maxUsers)) : null;

        // Create room if doesn't exist
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                type: roomType || 'private',
                participants: new Map(),
                messages: [],
                createdAt: new Date(),
                screenSharer: null,
                maxUsers: requestedMax || 10
            });
        } else if (requestedMax) {
            // First joiner who specifies a smaller cap "locks in" that cap
            // for everyone else who joins this room id.
            const existing = this.rooms.get(roomId);
            if (!existing.maxUsers) existing.maxUsers = requestedMax;
        }

        const room = this.rooms.get(roomId);
        const cap = Math.min(room.maxUsers || 10, 10);

        // Check room capacity
        if (room.participants.size >= cap) {
            socket.emit('room-error', { message: `Room is full (max ${cap} participants)` });
            return;
        }
        
        // Join socket room
        socket.join(roomId);
        socket.roomId = roomId;
        
        // Add participant
        const participant = {
            socketId: socket.id,
            userId: socket.userData.id,
            name: userName || socket.userData.name,
            avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${socket.userData.id}`,
            isHost: isHost || false,
            isMuted: false,
            isVideoOn: false,
            isScreenSharing: false,
            isSpeaking: false,
            joinedAt: new Date()
        };
        
        room.participants.set(socket.id, participant);
        
        // Notify other participants
        socket.to(roomId).emit('user-joined', participant);
        
        // Send existing participants to new user
        const existingParticipants = Array.from(room.participants.values())
            .filter(p => p.socketId !== socket.id);
        socket.emit('existing-participants', existingParticipants);
        
        // Send message history
        socket.emit('message-history', room.messages.slice(-50)); // Last 50 messages
        
        // Notify about screen sharer if active
        if (room.screenSharer) {
            socket.emit('screen-share-active', { userId: room.screenSharer });
        }

        // Broadcast room update to all connected clients (for dashboard participant counts)
        this.broadcastGlobalRooms();

        console.log(`✅ ${participant.name} joined room ${roomId} (${room.participants.size} participants)`);
    }

    handleLeaveRoom(socket, { roomId }) {
        this.removeFromRoom(socket, roomId || socket.roomId);
    }

    handleOffer(socket, { targetId, offer }) {
        console.log(`📤 Relaying offer from ${socket.id} to ${targetId}`);
        socket.to(targetId).emit('offer', {
            senderId: socket.id,
            offer: offer
        });
    }

    handleAnswer(socket, { targetId, answer }) {
        console.log(`📤 Relaying answer from ${socket.id} to ${targetId}`);
        socket.to(targetId).emit('answer', {
            senderId: socket.id,
            answer: answer
        });
    }

    handleIceCandidate(socket, { targetId, candidate }) {
        socket.to(targetId).emit('ice-candidate', {
            senderId: socket.id,
            candidate: candidate
        });
    }

    handleMediaStateChange(socket, { isMuted, isVideoOn, isDeafened }) {
        const room = this.rooms.get(socket.roomId);
        if (!room) return;
        
        const participant = room.participants.get(socket.id);
        if (!participant) return;
        
        // Update participant state
        if (isMuted !== undefined) participant.isMuted = isMuted;
        if (isVideoOn !== undefined) participant.isVideoOn = isVideoOn;
        if (isDeafened !== undefined) participant.isDeafened = isDeafened;
        
        // Broadcast to room
        socket.to(socket.roomId).emit('media-state-change', {
            socketId: socket.id,
            isMuted: participant.isMuted,
            isVideoOn: participant.isVideoOn,
            isDeafened: participant.isDeafened
        });
    }

    handleVoiceActivity(socket, { isSpeaking }) {
        const room = this.rooms.get(socket.roomId);
        if (!room) return;
        
        const participant = room.participants.get(socket.id);
        if (!participant) return;
        
        participant.isSpeaking = isSpeaking;
        
        // Broadcast voice activity
        socket.to(socket.roomId).emit('voice-activity', {
            socketId: socket.id,
            isSpeaking: isSpeaking
        });
    }

    handleSendMessage(socket, { text, type = 'text' }) {
        const room = this.rooms.get(socket.roomId);
        if (!room) return;
        
        const participant = room.participants.get(socket.id);
        if (!participant) return;
        
        const message = {
            id: Date.now().toString(),
            socketId: socket.id,
            userId: participant.userId,
            userName: participant.name,
            avatar: participant.avatar,
            text: text,
            type: type, // 'text', 'system', 'file'
            timestamp: new Date().toISOString()
        };
        
        // Store message
        room.messages.push(message);
        
        // Keep only last 100 messages
        if (room.messages.length > 100) {
            room.messages.shift();
        }
        
        // Broadcast to all in room (including sender for consistency)
        this.io.to(socket.roomId).emit('new-message', message);
    }

    handleTyping(socket, { isTyping }) {
        const room = this.rooms.get(socket.roomId);
        if (!room) return;
        
        const participant = room.participants.get(socket.id);
        if (!participant) return;
        
        socket.to(socket.roomId).emit('user-typing', {
            socketId: socket.id,
            userName: participant.name,
            isTyping: isTyping
        });
    }

    handleScreenShareStart(socket, { isScreenSharing }) {
        const room = this.rooms.get(socket.roomId);
        if (!room) return;
        
        const participant = room.participants.get(socket.id);
        if (!participant) return;
        
        // Only one screen share at a time
        if (room.screenSharer && room.screenSharer !== socket.id) {
            socket.emit('screen-share-error', { message: 'Someone else is already screen sharing' });
            return;
        }
        
        room.screenSharer = socket.id;
        participant.isScreenSharing = true;
        
        socket.to(socket.roomId).emit('screen-share-started', {
            socketId: socket.id,
            userName: participant.name
        });
    }

    handleScreenShareStop(socket) {
        const room = this.rooms.get(socket.roomId);
        if (!room) return;
        
        const participant = room.participants.get(socket.id);
        if (!participant) return;
        
        if (room.screenSharer === socket.id) {
            room.screenSharer = null;
            participant.isScreenSharing = false;
            
            socket.to(socket.roomId).emit('screen-share-stopped', {
                socketId: socket.id
            });
        }
    }

    handleDisconnect(socket) {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        
        if (socket.roomId) {
            this.removeFromRoom(socket, socket.roomId);
        }
    }

    removeFromRoom(socket, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        const participant = room.participants.get(socket.id);
        if (!participant) return;
        
        console.log(`🚪 ${participant.name} leaving room ${roomId}`);
        
        // Clear screen share if this user was sharing
        if (room.screenSharer === socket.id) {
            room.screenSharer = null;
            socket.to(roomId).emit('screen-share-stopped', { socketId: socket.id });
        }
        
        // Remove participant
        room.participants.delete(socket.id);
        
        // Notify others
        socket.to(roomId).emit('user-left', { socketId: socket.id });

        // Clean up empty rooms
        if (room.participants.size === 0) {
            this.rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted (empty)`);
        } else {
            console.log(`✅ User left room ${roomId} (${room.participants.size} remaining)`);
        }

        // Broadcast room update to all connected clients (for dashboard participant counts)
        this.broadcastGlobalRooms();

        socket.leave(roomId);
        socket.roomId = null;
    }

    // Get room statistics (for admin/monitoring)
    getRoomStats() {
        return {
            totalRooms: this.rooms.size,
            totalParticipants: Array.from(this.rooms.values())
                .reduce((sum, room) => sum + room.participants.size, 0),
            rooms: Array.from(this.rooms.entries()).map(([id, room]) => ({
                id,
                type: room.type,
                participantCount: room.participants.size,
                screenSharer: room.screenSharer,
                createdAt: room.createdAt
            }))
        };
    }
}

module.exports = SignalingServer;
