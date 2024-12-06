document.addEventListener("DOMContentLoaded", function() {
  const socket = io('http://localhost:3000');

  console.log("Connection etablie");

  // Écouter les messages du serveur
  socket.on('message', (msg) => {
    console.log('Message reçu:', msg);
    // Afficher le message dans l'interface utilisateur (par exemple)
    document.getElementById('chat-page').innerHTML += `<p>${msg}</p>`; 
  });
});
  
function addMessage(mess) {
  const chatPage = document.getElementById('chat-page');

  const message = document.createElement('div');
  message.classList.add('message');
  message.textContent = mess;

  chatPage.appendChild(message);
  chatPage.scrollTop = chatPage.scrollHeight;
}

// Envoyer un message au serveur
document.getElementById('send-button').addEventListener('click', () => {

  const msg = document.getElementById('message-input').value;
  if (msg != "") {
    addMessage(msg);
    document.getElementById('message-input').value = '';  // Vide le champ de saisie
  }

  socket.emit('message', msg);  // Envoyer le message au serveur
  console.log("MESSAGE ENVOYE !");
});

document.getElementById('message-input').addEventListener('keydown', (event) => {

  if (event.key === 'Enter') {
    event.preventDefault();  //Empeche le retour a la ligne !
    document.getElementById('send-button').click();
  }
});