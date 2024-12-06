const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// Systeme CORS
const io = socketIo(server, {
  cors: {
    origin: "http://127.0.0.1:8000",  // Autoriser l'origine spécifique
    methods: ["GET", "POST"],
  }
});

io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');
  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté');
  });
});

server.listen(3000, () => {
  console.log('Serveur en cours d\'exécution sur http://localhost:3000');
});