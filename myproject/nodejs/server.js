const { Client } = require('pg');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { channel } = require('diagnostics_channel');

console.log('DATABASE_URL:', process.env.DATABASE_URL);
let client;

async function connectToDb(retries = 5, delay = 3000) {
  client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  client.connect((err) => {
    if (err) {
      if (retries == 0) {
        console.error('ERROR: mauvaise connexion a la BDD', err.stack);
        process.exit(1); }
        else {
          console.log(`Tentative de reco dans ${delay / 1000} secondes...`);
          setTimeout(() => connectToDb(retries - 1, delay), delay);
        }
      }
    else {
      console.log('Connecte a la BDD');
      createChatTable(client)
        .then(() => startServer(client))
        .catch(error => {
          console.error('Erreur lors de la creation de la table: ', error);
          process.exit(1);
        });
    }
  });
}

// Creer une table pour sauvegarder les messages de chaque channel
async function  createChatTable(client) {
  const chanQuery = `
    CREATE TABLE IF NOT EXISTS channels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const tableQuery = `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      channel_name VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      sender VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await client.query(chanQuery);
    await client.query(tableQuery);
    // await client.query(usersChannelsQuery);
    console.log('Table "messages", "user_channels" et "channels"creees avec succes !');
  } catch (error) {
    console.error('Erreur lors de la creation de la table "messages": ', error);
    throw error;
  }
}

// Creer le serveur pour gerer les channels
function startServer() {

  // Creation du server HTTP
  const app = express();
  const server = http.createServer(app);

  // Systeme CORS
  const io = socketIo(server, {
    cors: {
      origin: "*",  // Autoriser l'origine spécifique
      methods: ["GET", "POST"],
    }
  });

  // Connexion au Socket du serveur
  io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté avec l\'ID: ', socket.id);

    socket.on('join-channel', (chan) => {
      socket.join(chan);
      console.log(`Utilisateur rejoint le canal: ${chan}`);
    });

    // Creation d'un channel dans la bdd
    socket.on('create-channel', async (channelName) => {

      try {

        if (channelName) {
          const checkQuery = 'SELECT * FROM channels WHERE name = $1';
          const checkResult = await client.query(checkQuery, [channelName]);

          if (checkResult.rows.length === 0) {
            const insertQuery = 'INSERT INTO channels(name) VALUES($1) RETURNING *'
            const insertResult = await client.query(insertQuery, [channelName]);
            
            console.log('Canal cree avec succes: ', insertResult.rows[0]);

            io.emit('new-channel', channelName);
            console.log(`Nouveau canal cree: ${channelName}`);
          }
          else {
            socket.emit('error', 'Le canal existe deja');
          }
        }
        else {
          socket.emit('error', 'Nom du canal invalide');
        }
      }

      catch (error) {
        console.error('Erreur lors de l\'insertion du canal', error);
        socket.emit('error', 'Erreur interne');
      }
    });

    // Recupere tous les messages d'une conv
    socket.on('get-messages', async (channelName) => {

      try {
        const result = await client.query(
          'SELECT * FROM messages WHERE channel_name = $1 ORDER BY created_at ASC',
          [channelName]
        );

        if (result.rows.length === 0) {
          console.log('Aucun message trouve');
        }

        console.log('Messages récupérés:', result.rows);
        socket.emit('channel-messages', result.rows);
      } catch (error) {
          console.log('Erreur lors de la recuperation des messages du channel: ', error);
        }
    });

    // Save les nouveaux messages entrants (dans la bdd)
    socket.on('new-message', async (data) => {

      const { channelName, sender, message } = data;
      console.log("Try to save the message");

      try {
        const result = await client.query(
          'INSERT INTO messages (channel_name, sender, message) VALUES ($1, $2, $3) RETURNING *',
          [channelName, sender, message]
        );

        // Envoie dans le canal
        io.to(channelName).emit('new-message', {
          message: result.rows[0].message,
          sender: result.rows[0].sender,
        });
        console.log('Message envoye au canal ', channelName);

      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du message: ', error);
        socket.emit('error', 'Erreur interne du serveur');
      }
    });

    // Charge les channels
    socket.on('load-channels', async () => {
      try {
        const result = await client.query('SELECT name FROM channels');
        if (result.rows && Array.isArray(result.rows)) {
          socket.emit('all-channels', result.rows.map(channel => channel.name));
        } else {
          socket.emit('all-channels', []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des canaux: ', error);
        socket.emit('all-channels', []);
      }
    });

    // Deconnexion d'un user
    socket.on('disconnect', async () => {
      console.log('Utilisateur déconnecté');
      try {
        // await client.query('DELETE FROM channels');
        // await client.query ('DELETE FROM messages');
        // console.log('tous les channels et messages ont ete supprimes');
      } catch (error) {
        console.error('Erreur lors de la suppresions des channels et des messages', error);
      }
    });
  });

  server.listen(3000, () => {
    console.log('Serveur en cours d\'exécution sur http://localhost:3000');
  });
}

console.log('Tentative de connexion à la base de données...');
connectToDb();