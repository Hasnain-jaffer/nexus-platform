/**
 * chatSocket.js — Real-time socket handler
 *
 * Handles:
 *  1. Chat  — new_message delivery, typing indicators, online/offline
 *  2. WebRTC signalling — video & voice calls (offer / answer / ice / end)
 *
 * WebRTC works peer-to-peer: the server only relays small signalling messages.
 * The actual audio/video stream never passes through the server.
 */
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const initSockets = (io) => {

  // ── Auth middleware ────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌  Connected: ${socket.user.name} (${userId})`);

    socket.join(userId);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user_online', { userId });

    // ── Chat ─────────────────────────────────────────────────────────────

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('typing_start', ({ receiverId }) => {
      socket.to(receiverId).emit('typing_start', { senderId: userId });
    });

    socket.on('typing_stop', ({ receiverId }) => {
      socket.to(receiverId).emit('typing_stop', { senderId: userId });
    });

    // ── WebRTC Signalling ─────────────────────────────────────────────────
    //
    // Caller flow:
    //   1. Caller  → emit('call:initiate',  { to, callType, offer })
    //   2. Callee  → emit('call:answer',    { to, answer })     OR
    //      Callee  → emit('call:reject',    { to })
    //   3. Either  → emit('call:ice',       { to, candidate })  (multiple times)
    //   4. Either  → emit('call:end',       { to })

    socket.on('call:initiate', ({ to, callType, offer }) => {
      socket.to(to).emit('call:incoming', {
        from:       userId,
        fromName:   socket.user.name,
        fromAvatar: socket.user.avatarUrl || '',
        callType,
        offer,
      });
    });

    socket.on('call:answer', ({ to, answer }) => {
      socket.to(to).emit('call:answered', { from: userId, answer });
    });

    socket.on('call:reject', ({ to }) => {
      socket.to(to).emit('call:rejected', { from: userId });
    });

    socket.on('call:ice', ({ to, candidate }) => {
      socket.to(to).emit('call:ice', { from: userId, candidate });
    });

    socket.on('call:end', ({ to }) => {
      socket.to(to).emit('call:ended', { from: userId });
    });

    // ── Disconnect ────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      console.log(`🔌  Disconnected: ${socket.user.name}`);
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit('user_offline', { userId });
    });
  });
};

module.exports = initSockets;
