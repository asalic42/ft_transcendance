/* INFOS
- les fonctions 'socket sont celles qui communiquent avec le serveur (server.js)'
- socket.on = fonction qui agit directement sur le site
- socket.emit = fonction qui communique avec celle du cote client
*/

let socket;
let chatVisible = false;
let currentChan;

// Recup l'user courant
const userElement = document.getElementById('current-username');
const username = userElement.getAttribute('data-username');
console.log(`Current username is ${username}`);

//////////////////////////////////////////////////////////////////////////////////////////
/* MONITORING CHANNELS */
  document.addEventListener("DOMContentLoaded", function() {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log("Connection etablie");
    })

    loadChannels();

    socket.emit('load-channels');
    socket.on('all-channels', (channels) => {
      channels.forEach(currentChan => {
        addChannelToList(currentChan);
      });
    });

    socket.on('channel-messages', (messages) => {
      const chatContainer = document.getElementById('chat-page');
      chatContainer.innerHTML = '';
      
      console.log("Je tente de recup les messages !");
      messages.forEach(message => addMessage(message.message));
    });

    const newChan = document.getElementById('new-chan');
    const inviteButton = document.getElementById('add-friend-chan');
    newChan.addEventListener('click', () => {

      // Disparition du chat en cours
      if (chatVisible) {
        reversePopCenterChat();
        currentChan = null;
        newChan.textContent = '+';
        inviteButton.style.display = "none";
        chatVisible = !chatVisible;
      }
      else {
        // Creation de chan + ouverture
        setChannelName(function(nameChan) {
          popCenterChat(nameChan);
          newChan.textContent = '➙';
          chatVisible = !chatVisible;
          currentChan = nameChan;
          socket.emit('create-channel', currentChan);
          addChannelToList(currentChan);
          inviteFriendInChan(inviteButton);
        });
      }
    });

  });

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
      inviteFriendInChan(document.getElementById('add-friend-chan'));
      if (!chatVisible)
        chatVisible = !chatVisible;
      currentChan = nameChan;
      
      const h2content = document.getElementById('chat-name');
      h2content.textContent = currentChan;

      socket.emit('get-messages', currentChan);
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
        const name = inputChannel.value;
        const pattern = /^[a-zA-Z0-9_-]+$/;

        if (name !== '' && pattern.test(name)) {
          overlay.style.display = 'none';
          inputContainer.classList.remove('show');
          document.getElementById('channel-name').value = '';
          inputChannel.removeEventListener('keydown', handleInputName);
          callback(name);
        }
        else {
          alert(`Enter a name !`);
        }
      }
    }
    inputChannel.addEventListener('keydown', handleInputName);
  }

  function inviteFriendInChan(inviteButton)
  {
    console.log("JE SUIS LAAAA");

    inviteButton.style.display = "inline";
    inviteButton.addEventListener('click', () => {
      const inputContainer = document.getElementById('input-chat-add');
      const inputFriend = document.getElementById('input-add-friend-chan');
      const overlay = document.getElementById('overlay');

      overlay.style.display = 'block';
      inputContainer.classList.add('show');

      inputFriend.addEventListener('input', function() {
          const userList = document.getElementById('users-list').getAttribute('data-users').split(', ');
          if (!userList.includes(this.value)) {
            alert(`User doesn't exist`);
          }
          else {
            alert(`Invitation envoyee :)`);
          }
      });
    });
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
        socket.emit('new-message', {channelName: currentChan, sender: username, message: msg});
    
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

    console.log("message is ", mess);
    const message = document.createElement('div');
    message.classList.add('message');

    const usernameElement = document.createElement('span');
    usernameElement.classList.add('username');
    usernameElement.textContent = username;

    const messElement = document.createElement('p');
    messElement.textContent = mess;

    message.appendChild(usernameElement);
    message.appendChild(messElement);

    chatPage.appendChild(message);

    // socket.emit('send-message', currentChan, message);

    chatPage.scrollTop = chatPage.scrollHeight;
  }