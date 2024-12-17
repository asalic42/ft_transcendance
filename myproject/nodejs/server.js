const { Client } = require('pg');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { start } = require('repl');

console.log('DATABASE_URL:', process.env.DATABASE_URL);
let client;


function connectToDb(retries = 5, delay = 3000) {
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
  // const chanQuery = `
  //   CREATE TABLE IF NOT EXISTS channels (
  //     id SERIAL PRIMARY KEY,
  //     name VARCHAR(255) NOT NULL UNIQUE,
  //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  //   );
  // `;

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
    // await client.query(chanQuery);
    await client.query(tableQuery);
    console.log('Table "messages" et "channels"creees avec succes !');
  } catch (error) {
    console.error('Erreur lors de la creation de la table "messages": ', error);
    throw error;
  }
}


// Creer le serveur pour gerer les channels
function startServer() {

  const app = express();
  const server = http.createServer(app);

  // Systeme CORS
  const io = socketIo(server, {
    cors: {
      origin: "http://127.0.0.1:8000",  // Autoriser l'origine spécifique
      methods: ["GET", "POST"],
    }
  });

  app.use(express.json());

  // Charge les messages d'un cannal specifique
  app.get('/messages/:channelName', async (req, res) => {
    const channelName = req.params.channelName;
    try {
      const result = await client.query('SELECT * FROM messages WHERE channel_name = $1 ORDER BY created_at ASC', [channelName]);
      res.json(result.rows); // Return messages under JSON
    } catch (error) {
      console.error('Erreur lors du chargement des messages: ', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });

  // Enregistre un nouveau message dans la bdd
  app.post('/messages', async (req, res) => {
    const { channelName, sender, message } = req.body;
    try {
      const result = await client.query(
        'INSERT INTO messages (channel_name, sender, message) VALUES (1$, 2$, 3$) RETURNING *',
        [channelName, sender, message]
      );
      res.json(result.rows[0]); //Return saved message
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du message: ', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  });

  io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    // Creation d'un channel dans la bdd
    socket.on('create-channel', async (channelName) => {

      try {

        if (channelName) {
          const checkQuery = 'SELECT * FROM channels WHERE name = $1';
          const checkResult = await client.query(checkQuery, [channelName]);

          if (checkResult.rows.lenght === 0) {
            const insertQuery = 'INSERT INTO channels(name) VALUES($1) RETURNING *'
            const insertResult = await client.query(insertQuery, [channelName]);
            
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

    socket.on('get-messages', async (channelName) => {
      try {
        const result = await client.query(
          'SELECT * FROM messages WHERE channel_name = $1 ORDER BY created_at ASC',
          [channelName]
        );

        if (result.rows.lenght === 0) {
          console.log('Aucun message trouve');
        }

        socket.emit('channel-messages', result.rows);
      } catch (error) {
        console.log('Erreur lors de la recuperation des messages du channel: ', error);
      }
    });

    // Charge les channels
    socket.on('load-channels', async () => {
      try {
        const result = await client.query('SELECT name FROM channels');
        if (result.rows && Array.isArray(result.rows)) {
          socket.emit('all-channels', result.row.map(channel => channel.name));
        } else {
          socket.emit('all-channels', []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des canaux: ', error);
        socket.emit('all-channels', []);
      }
    });

    // Deconnexion d'un user
    socket.on('disconnect', () => {
      console.log('Utilisateur déconnecté');
    });
  });

  server.listen(3000, () => {
    console.log('Serveur en cours d\'exécution sur http://localhost:8000');
  });
}

console.log('Tentative de connexion à la base de données...');
connectToDb();