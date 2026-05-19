const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Arjuna Mode Backend is Running...');
});

// Import and use routes
app.use('/api/chat', require('./routes/chatRoutes'));

// Create HTTP Server & Initialize WebSocket Server
const http = require('http');
const server = http.createServer(app);
const { initVoiceSocket } = require('./services/voiceSocket');

initVoiceSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

