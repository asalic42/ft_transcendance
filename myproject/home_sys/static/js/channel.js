/* INFOS
- les fonctions 'socket sont celles qui communiquent avec le serveur (server.js)'
- socket.on = fonction qui agit directement sur le site
- socket.emit = fonction qui communique avec celle du cote client
*/

let chatVisible = false;
let currentChan;
let lastMessageId = 0;
let liveChat;

// Recup l'user courant
const userElement = document.getElementById('current-username');
const username = userElement.getAttribute('data-username');
console.log(`Current username is ${username}`);

//////////////////////////////////////////////////////////////////////////////////////////
/* MONITORING CHANNELS */
  document.addEventListener("DOMContentLoaded", function() {

	  loadChannels();

    const newChan = document.getElementById('new-chan');
    // const inviteButton = document.getElementById('add-friend-chan');
    newChan.addEventListener('click', () => {
      
      // Disparition du chat en cours
      if (chatVisible) {
        reversePopCenterChat();
        currentChan = null;
        newChan.textContent = '+';
        // inviteButton.style.display = "none";
        chatVisible = !chatVisible;
        clearInterval(liveChat);
      }
      else {
        // Creation de chan + ouverture
        setChannelName(async function(nameChan) {
          popCenterChat(nameChan);
          newChan.textContent = '➙';
          chatVisible = !chatVisible;
          currentChan = nameChan;
        
          addChannelToDb(currentChan);
          // inviteFriendInChan(inviteButton);

          lastMessageId = await getLastMessageId(nameChan);
          liveChat = setInterval(() => {
            liveChatFetch();
          }, 1000);

        });
      }
    });

  });

// let chatSocket;

//   function connectWebSocket(channelName) {
//     // Ferme la connexion précédente si elle existe
//     if (chatSocket) {
//       chatSocket.close();
//     }

//     // Crée une nouvelle connexion WebSocket
//     chatSocket = new WebSocket(
//       'ws://' + window.location.host + '/ws/channels/'
//     );

//     chatSocket.onmessage = function(e) {
//       const data = JSON.parse(e.data);
//       addMessage(data.message, data.sender);
//     };

//     chatSocket.onclose = function(e) {
//       console.error('Chat socket closed unexpectedly');
//     };
//   }

//////////////////////////////////////////////////////////////////////////////////////////
/* RIGHT CHANNELS PART */
  // Add channel to the right channel's list
  function  addChannelToList(nameChan)
  {
    console.log("Name chan: ", nameChan);
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

  async function getLastMessageId(channelName) {
    try {
      const response = await fetch(`/account/api/live_chat/?channel_name=${encodeURIComponent(channelName)}`);
      const data = await response.json();
      if (data.new_message) {
        return data.new_message.id; // Dernier message existant
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du dernier message :', error);
    }
    return 0; // Aucun message dans le canal
  }

  // Cliquer sur un channel deja creer
  function  clickToChannel(chanItem, nameChan) {
    chanItem.addEventListener('click', async () => {
      popCenterChat(nameChan);
      document.getElementById('new-chan').textContent = '➙';
      // inviteFriendInChan(document.getElementById('add-friend-chan'));
      if (!chatVisible)
        chatVisible = !chatVisible;
      currentChan = nameChan;

      const h2content = document.getElementById('chat-name');
      h2content.textContent = currentChan;
      await getMessages(currentChan);

      // connectWebSocket(currentChan);
      // lastMessageId = await getLastMessageId(nameChan);

      if (liveChat) clearInterval(liveChat);

      liveChat = setInterval(() => {
        liveChatFetch();
      }, 1000);

    });
  }

  // Save new channel
  function  saveChannel() {
	const channelList = document.querySelectorAll('.channel-item');
	const channelArray = Array.from(channelList).map(channel => channel.textContent);
	localStorage.setItem('channels', JSON.stringify(channelArray));
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

  // function inviteFriendInChan(inviteButton)
  // {
  //   console.log("JE SUIS LAAAA");

  //   inviteButton.style.display = "inline";
  //   inviteButton.addEventListener('click', () => {
  //     const inputContainer = document.getElementById('input-chat-add');
  //     const inputFriend = document.getElementById('input-add-friend-chan');
  //     const overlay = document.getElementById('overlay');

  //     overlay.style.display = 'block';
  //     inputContainer.classList.add('show');

  //     inputFriend.addEventListener('input', function() {
  //         const userList = document.getElementById('users-list').getAttribute('data-users').split(', ');
  //         if (!userList.includes(this.value)) {
  //           alert(`User doesn't exist`);
  //         }
  //         else {
  //           alert(`Invitation envoyee :)`);
  //         }
  //     });
  //   });
  // }

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
      postMessage(currentChan, msg);
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
  function addMessage(mess, sender) {
	const chatPage = document.getElementById('chat-page')

  // const messageContainer = createElement('div');
  // messageContainer.id = 'message-container';
  const message = document.createElement('div');
  message.classList.add('message');
  // console.log(`Username: ${username} et Sender: ${sender}`);
  if (sender === username)
    message.classList.add('sent');
  else
    message.classList.add('received');

	const usernameElement = document.createElement('span');
	usernameElement.classList.add('username');
	usernameElement.textContent = sender;

	const messElement = document.createElement('p');
	messElement.textContent = mess;

	message.appendChild(usernameElement);
	message.appendChild(messElement);

  // messageContainer.message()
	chatPage.appendChild(message);

	chatPage.scrollTop = chatPage.scrollHeight;
  }

////////////////////////////////////////////////
        /* Function API fetch */
///////////////////////////////////////////////

// Live chat with AJAX system
async function liveChatFetch() {
  
  console.log("my last id saved: ", lastMessageId);

  try {
    const response = await fetch(`/account/api/live_chat/?channel_name=${encodeURIComponent(currentChan)}}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log("Erreur de fetch");
    }

    const data = await response.json();
    
    if (data.new_message) {

      const message = data.new_message;
      console.log("Nouveau message recu !");

      addMessage(message.message, message.sender);
      lastMessageId = message.id;
      
      data.new_message.forEach(message => {
        console.log("id: ", data.new_message[data.new_message.length -1].id);
      if (data.new_message[data.new_message.length -1].id > lastMessageId && lastMessageId > 0) {
        console.log("dernier mess: ", data.new_message[data.new_message.length -1].message);
        console.log(`id: ${data.new_message[data.new_message.length -1].id} | lastId: ${lastMessageId}`);
        addMessage(data.new_message[data.new_message.length -1].message, data.new_message[data.new_message.length -1].sender);
        lastMessageId = data.new_message[data.new_message.length -1].id;
        }
      });

    }
  } catch (error) {
    console.error('Erreur: ', error);
  }
}

// Add a new channel to the db
async function addChannelToDb(currentChan) {
  try {
    const response = await fetch('/accounts/api/post_chan/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: currentChan
        // invite_link: null
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'ajout du chan');
    }

    console.log("nouveau chan ADD a la bdd");
    addChannelToList(currentChan);
  } catch (error) {
      console.error('Erreur: ', error);
  }
}

// Load channels that already exists and get them from db
// When UserChan table created, use it
  async function  loadChannels() {
  
    try {
      const response = await fetch('/accounts/api/get_chans/', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      if (result.status == 'success' && Array.isArray(result.channels)) {
        console.log("Canaux: ", result.channels);
        result.channels.forEach(nameChan => {
          addChannelToList(nameChan);
        });
      }
      else {
        console.log("Aucun canaux trouves...");
      }
    } catch(error) {
      console.error('Erreur: ', error);
    }
  }

// Load messages when the chan appear
  async function getMessages(currentChan) {
    const chatContainer = document.getElementById('chat-page');
    chatContainer.innerHTML = '';

    try {
      const response = await fetch(`/accounts/api/get_messages/?channel_name=${encodeURIComponent(currentChan)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.messages)) {
        console.log(`message du channel ${currentChan}: `, result.messages);
        result.messages.forEach(message => addMessage(message.message, message.sender));

        // if (result.messages.length != lastMessageId) {
        //   lastMessageId = result.messages.length;
        //   console.log("last id mess: ", lastMessageId);
        // }
      }
    } catch (error) {
      console.error('Erreur: ', error);
    }
  }

async function postMessage(currentChan, mess) {
  try {
    const response = await fetch('/accounts/api/post_message/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel_name: currentChan,
        sender: username,
        message: mess,
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'ajout d\'un nouveau message dans le channel');
    }

     // Envoie via WebSocket
    // chatSocket.send(JSON.stringify({
    //   'message': mess,
    //   'sender': username
    // }));
		addMessage(mess, username);
    lastMessageId = await getLastMessageId(currentChan);

  } catch(error) {
      console.error('Erreur: ', error);
  }
}
