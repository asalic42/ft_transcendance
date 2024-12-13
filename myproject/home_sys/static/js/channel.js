let socket;

document.addEventListener("DOMContentLoaded", function() {
  socket = io('http://localhost:3000');

  console.log("Connection etablie");

  // Écouter les messages du serveur
  socket.on('message', (msg) => {
    console.log('Message reçu:', msg);
  });

  const newChan = document.getElementById('new-chan');
  let chatVisible = false;
  newChan.addEventListener('click', () => {

    // Disparition du chat en cours
    if (chatVisible) {
      reversePopCenterChat();
      newChan.textContent = '+';
    }
    else {
      // Creation de chan + ouverture
      setChannelName(function(nameChan) {
        popCenterChat(nameChan);
        newChan.textContent = '➙';
      });
    }
    chatVisible = !chatVisible;
  });
});

// Main monitor for the center column and message listener
function popCenterChat(nameChan) {
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

// Check if a message is send by a click or an ENTER, and send it
function addMessageListener() {
  const sendButton = document.getElementById('send-button');
  sendButton.addEventListener('click', () => {

    const msg = document.getElementById('message-input').value;
    if (msg != "") {
      addMessage(msg);
      document.getElementById('message-input').value = '';  // Vide le champ de saisie
      socket.emit('message', msg);  // Envoyer le message au serveur
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