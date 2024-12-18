/* INFOS
- les fonctions 'socket sont celles qui communiquent avec le serveur (server.js)'
- socket.on = fonction qui agit directement sur le site
- socket.emit = fonction qui communique avec celle du cote client
*/

let socket;
let chatVisible = false;
let currentChan;

//////////////////////////////////////////////////////////////////////////////////////////
/* MONITORING CHANNELS */
  document.addEventListener("DOMContentLoaded", function() {
    socket = io('http://localhost:3000');

    // socket.emit('set')

   
    // Appeler la fonction pour récupérer le nom d'utilisateur
    // fetchUsername();


    socket.on('connect', () => {
      console.log("Connection etablie");
    })

    socket.on('channel-messages', (messages) => {
      const chatContainer = document.getElementById('chat-page');
      chatContainer.innerHTML = '';
      
      console.log("Je tente de recup les messages !");

      messages.forEach(message => addMessage(message.message));
    });

    const newChan = document.getElementById('new-chan');
    newChan.addEventListener('click', () => {

      // Disparition du chat en cours
      if (chatVisible) {
        reversePopCenterChat();
        currentChan = null;
        newChan.textContent = '+';
        chatVisible = !chatVisible;
      }
      else {
        // Creation de chan + ouverture
        setChannelName(function(nameChan) {
          popCenterChat(nameChan);
          newChan.textContent = '➙';
          chatVisible = !chatVisible;
          currentChan = nameChan;
          socket.emit('create-channel', nameChan);
          addChannelToList(nameChan);
        });
      }
    });

    loadChannels();
    socket.emit('load-channels');
    socket.on('all-channels', (channels) => {
      channels.forEach(nameChan => {
        addChannelToList(nameChan);
      });
    });
  });

  // Fonction pour récupérer le nom d'utilisateur depuis l'API Django
  // function fetchUsername() {
  //   const token = localStorage.getItem('jwtToken');  // Récupérer le token JWT du localStorage
  
  //   if (!token) {
  //       console.error("Aucun token JWT trouvé.");
  //       return;
  //   }
  
  //   // Faire une requête à l'API Django pour obtenir le nom de l'utilisateur
  //   fetch('http://127.0.0.1:8000/api/get-username/', {
  //       method: 'GET',
  //       headers: {
  //           'Authorization': 'Bearer ' + token  // Passer le token dans l'en-tête Authorization
  //       }
  //   })
  //   .then(response => response.json())
  //   .then(data => {
  //       if (data.username) {
  //           console.log('Nom d\'utilisateur récupéré :', data.username);
  //           // Vous pouvez maintenant utiliser ce nom d'utilisateur dans votre logique
  //           socket.emit('set-username', data.username);
  //       } else {
  //           console.error('Erreur :', data.error || 'Nom d\'utilisateur non trouvé');
  //       }
  //   })
  //   .catch(error => {
  //       console.error('Erreur lors de la récupération du nom d\'utilisateur :', error);
  //   });
  // }


//////////////////////////////////////////////////////////////////////////////////////////
/* RIGHT CHANNELS PART */
  // Add channel to the right channel's list
  function  addChannelToList(nameChan)
  {
    const chanList = document.getElementById('channels-list');

    if (!chanList.querySelector(`#channel-${nameChan}`)) {
      const chanItem = document.createElement('div');
      chanItem.id = `#channel-${nameChan}`;
      chanItem.textContent = nameChan;
      chanItem.classList.add('chan-item');

      clickToChannel(chanItem, nameChan);

      chanList.appendChild(chanItem);
      saveChannel();
    }
  }

  // Cliquer sur un channel deja creer
  function  clickToChannel(chanItem, nameChan) {
    chanItem.addEventListener('click', () => {
      popCenterChat(nameChan);
      document.getElementById('new-chan').textContent = '➙';
      if (!chatVisible)
        chatVisible = !chatVisible;
      currentChan = nameChan;

      console.log('Ca a clique !!!');
      socket.emit('get-messages', currentChan);

      alert(`Vous avez sélectionné le canal: ${nameChan}`);
    });
  }

  // Save new channel
  function  saveChannel() {
    const channelList = document.querySelectorAll('.channel-item');
    const channelArray = Array.from(channelList).map(channel => channel.textContent);
    localStorage.setItem('channels', JSON.stringify(channelArray));
  }

  // Load channel that already exists and get them from db
  function  loadChannels() {
    const savedChannels = JSON.parse(localStorage.getItem('channels')) || [];
    savedChannels.forEach(nameChan => {
      addChannelToList(nameChan);
    });
  }

//////////////////////////////////////////////////////////////////////////////////////////
/* CENTER CHANNELS PART */
  // Main monitor for the center column and message listener
  function  popCenterChat(nameChan) {
    const page = document.querySelector('.page');
    const channels = document.querySelector('.channels');

    page.style.gridTemplateColumns = '1fr 3fr 1fr';

    if (!document.querySelector('.center')) {
      const center = createChatPage(nameChan);
      page.insertBefore(center, channels);

      addMessageListener();

      setTimeout(() => {
        center.style.visibility = 'visible';
        center.style.opacity = '1';
        center.style.transform = 'scaleX(1)';
      }, 0);
    }
  }

  // Create the center column for the chat conv
  function createChatPage(nameChan) {
    const center = document.createElement('div');
    center.classList.add('center');

    center.innerHTML = `
      <h2 id="chat-name">${nameChan}</h2>
      <div class="chat-page" id="chat-page"></div>
      <div class="input-container">
        <input id="message-input" type="text" placeholder="Message...">
        <button id="send-button">Envoyer</button>
      </div>
    `;

    return center;
  }

  // Set un nom de channel a sa creation
  function setChannelName(callback) {
    const inputContainer = document.getElementById('input-channel');
    const inputChannel = document.getElementById('channel-name');
    const overlay = document.getElementById('overlay');

    overlay.style.display = 'block';
    inputContainer.classList.add('show');

    function handleInputName(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        const name = inputChannel.value.trim();

        if (name !== '') {
          alert(`Channel "${name}" created !`);
          overlay.style.display = 'none';
          inputContainer.classList.remove('show');
          document.getElementById('channel-name').value = '';
          callback(name);
          inputChannel.removeEventListener('keydown', handleInputName);
        }
        else {
          alert(`Enter a name !`);
        }
      }
    }
    inputChannel.addEventListener('keydown', handleInputName);
  }

  // Inverser la transition pour faire disparaitre le chat en cours
  function reversePopCenterChat() {
    const page = document.querySelector('.page');
    const center = document.querySelector('.center');

    page.style.gridTemplateColumns = '1fr 1fr';

    if (center) {
      center.style.transform = 'translateX(-50%) scaleX(0)';
      center.style.visibility = 'hidden';
      center.style.opacity = '0';
      center.remove();
    }
  }

  // Check if a message is send by a click or an ENTER, and send it
  function addMessageListener() {
    const sendButton = document.getElementById('send-button');
    sendButton.addEventListener('click', () => {

      const msg = document.getElementById('message-input').value;
      if (msg != "") {
        console.log({
          channelName: currentChan, sender: 'client', message: msg
        });
    
        socket.emit('new-message', {channelName: currentChan, sender: 'client', message: msg});
    
        addMessage(msg);
        document.getElementById('message-input').value = '';  // Vide le champ de saisie
        console.log("MESSAGE ENVOYE !");  
      }
    });

    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('keydown', (event) => {

      if (event.key === 'Enter') {
        event.preventDefault();  //Empeche le retour a la ligne !
        sendButton.click();
      }
    });
  }

  // Add the message on the chat conv
  function addMessage(mess) {
    const chatPage = document.getElementById('chat-page')

    const message = document.createElement('div');
    message.classList.add('message');
    message.textContent = mess;

    chatPage.appendChild(message);
    chatPage.scrollTop = chatPage.scrollHeight;
  }