let socket;

document.addEventListener("DOMContentLoaded", function() {
  socket = io('http://localhost:3000');

  console.log("Connection etablie");

  // Écouter les messages du serveur
  socket.on('message', (msg) => {
    console.log('Message reçu:', msg);
    // document.getElementById('chat-page').innerHTML += `<p>${msg}</p>`; 
  });

  const newChan = document.getElementById('new-chan');
  let chatVisible = false;
  newChan.addEventListener('click', () => {
    if (chatVisible) {
      reversePopCenterChat();
      newChan.textContent = '+';
    }
    else {
      popCenterChat();
      newChan.textContent = '➙';
    }
    chatVisible = !chatVisible;
  });
});

// Main monitor for the center column and message listener
function popCenterChat() {
  const page = document.querySelector('.page');
  const friends = document.querySelector('.friends');
  const channels = document.querySelector('.channels');

  page.style.gridTemplateColumns = '1fr 3fr 1fr';

  if (!document.querySelector('.center')) {
    const center = createChatPage();
    page.insertBefore(center, channels);

    addMessageListener();

    setTimeout(() => {
      center.style.visibility = 'visible';
      center.style.opacity = '1';
      center.style.transform = 'scaleX(1)';
    }, 0);
  }
}

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
function createChatPage() {
  const center = document.createElement('div');
  center.classList.add('center');

  center.innerHTML = `
    <h2>Actual Chan</h2>
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