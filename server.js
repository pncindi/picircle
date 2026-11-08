const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// हेल्थ चेक - यह बताएगा कि सर्वर चालू है
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'PiCircle' }));

// LiveKit टोकन जनरेट करने का एंडपॉइंट
app.post('/get-livekit-token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity: participantName }
    );
    token.addGrant({ roomJoin: true, room: roomName });
    res.json({ token: token.toJwt() });
  } catch (error) {
    res.status(500).json({ error: 'टोकन बनाने में गड़बड़ी' });
  }
});

// Socket.io कनेक्शन - चैट के लिए
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-room', (roomId) => socket.join(roomId));
  socket.on('chat-message', (data) => {
    io.to(data.roomId).emit('chat-message', data);
  });
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`PiCircle backend running on port ${PORT}`));
