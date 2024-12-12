let socket;

document.addEventListener("DOMContentLoaded", function() {
  socket = io('http://localhost:3000');

  console.log("Connection etablie");

  // Écouter les messages du serveur
  socket.on('message', (msg) => {
    console.log('Message reçu:', msg);
    // Afficher le message dans l'interface utilisateur (par exemple)
    document.getElementById('chat-page').innerHTML += `<p>${msg}</p>`; 
  });
});

// Creation d'un nouveau channel en appuyant sur le bouton "+"
document.getElementById('new-chan').addEventListener('click', function() {
  const page = document.querySelector('.page');
  const friends = document.querySelector('.friends');
  const channels = document.querySelector('.channels');

  
  page.style.gridTemplateColumns = '1fr 3fr 1fr';

  if (!document.querySelector('.center')) {
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
    page.insertBefore(center, channels);

    setTimeout(() => {
      center.style.display = 'block';
      center.style.opacity = '1';
      center.style.transform = 'scaleX(1)';
    }, 100);
  }

  friends.style.flex = '1';
  channels.style.flex = '1';

});


// Envoyer un message au serveur
document.getElementById('send-button').addEventListener('click', () => {

  const msg = document.getElementById('message-input').value;
  if (msg != "") {
    addMessage(msg);
    document.getElementById('message-input').value = '';  // Vide le champ de saisie
    socket.emit('message', msg);  // Envoyer le message au serveur
    console.log("MESSAGE ENVOYE !");  
  }

});

document.getElementById('message-input').addEventListener('keydown', (event) => {

  if (event.key === 'Enter') {
    event.preventDefault();  //Empeche le retour a la ligne !
    document.getElementById('send-button').click();
  }
});

function addMessage(mess) {
  const chatPage = document.getElementById('chat-page')

  const message = document.createElement('div');
  message.classList.add('message');
  message.textContent = mess;

  chatPage.appendChild(message);
  chatPage.scrollTop = chatPage.scrollHeight;

}