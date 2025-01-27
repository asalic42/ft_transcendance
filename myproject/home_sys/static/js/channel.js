/* INFOS
- les fonctions 'socket sont celles qui communiquent avec le serveur (server.js)'
- socket.on = fonction qui agit directement sur le site
- socket.emit = fonction qui communique avec celle du cote client
*/

let chatVisible = false;
let currentChan;
let lastMessageId = 0;
let liveChat;
let blockedUsersList = null;
// let unreadMsg = {};

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
				addChannelToDb(nameChan)
				try {
					// doesChanExist(nameChan);
					const response = await fetch(`/accounts/api/chan_exist/${encodeURIComponent(nameChan)}/`);
					const data = await response.json();
					
					if (data.status === 'error') {
						throw new Error("Chan doesn't exist"); // Channel exists
					}
					openCenter(nameChan);
				}
				catch (error) {
					console.error(error);
				}
			});
		}
	});	
});

//////////////////////////////////////////////////////////////////////////////////////////
/* RIGHT CHANNELS PART */
	// Add channel to the right channel's list
function	addChannelToList(nameChan) {
	console.log("Name chan: ", nameChan);
	const chanList = document.getElementById('channels-list');

	if (!chanList.querySelector(`#channel-${nameChan}`)) {
		const chanItem = document.createElement('div');
		chanItem.id = `channel-${nameChan}`;
		chanItem.classList.add('chan-item');
	
		const titleChan = document.createElement('h2');
		titleChan.id = 'title-chan';
		titleChan.textContent = nameChan;
		chanItem.appendChild(titleChan);
			
		// const notif = document.createElement('p');
		// notif.id = 'notif';
		// notif.textContent = '1';
		// chanItem.appendChild(notif);
	
		clickToChannel(chanItem, nameChan);
	
		chanList.appendChild(chanItem);
		saveChannel();
	}
}


async function openCenter(nameChan) {
	lastMessageId = 0;
	popCenterChat(nameChan);
	document.getElementById('new-chan').textContent = '➙';
	// inviteFriendInChan(document.getElementById('add-friend-chan'));
	if (!chatVisible)
		chatVisible = !chatVisible;
	currentChan = nameChan;

	const h2content = document.getElementById('chat-name');
	h2content.textContent = currentChan;

	const chatContainer = document.getElementById('chat-page');
	chatContainer.innerHTML = '';	
	
	if (liveChat) clearInterval(liveChat);

	liveChat = setInterval(() => {
		liveChatFetch();
	}, 300);
}

	// Cliquer sur un channel deja creer
function	clickToChannel(chanItem, nameChan) {
	chanItem.addEventListener('click', async () => {
		openCenter(nameChan);
	});
}

	// Save new channel
function	saveChannel() {
	const channelList = document.querySelectorAll('.channel-item');
	const channelArray = Array.from(channelList).map(channel => channel.textContent);
	localStorage.setItem('channels', JSON.stringify(channelArray));
}


	// function plusDeNotifs(channelName) {
	//	 const chanItem = querySelector(`#channel-${channelName} #notif`);

	//	 if (chanItem.textContent)
	//	 chanItem.textContent = parseInt(chanItem.textContent) + 1;
	//	 else
	//	 chanItem.textContent = 1;
	// }


//////////////////////////////////////////////////////////////////////////////////////////
/* CENTER CHANNELS PART */
	// Main monitor for the center column and message listener
function	popCenterChat(nameChan) {
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
		<h2 id="chat-name" id="title">${nameChan}</h2>
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
	//	 console.log("JE SUIS LAAAA");

	//	 inviteButton.style.display = "inline";
	//	 inviteButton.addEventListener('click', () => {
	//	 const inputContainer = document.getElementById('input-chat-add');
	//	 const inputFriend = document.getElementById('input-add-friend-chan');
	//	 const overlay = document.getElementById('overlay');

	//	 overlay.style.display = 'block';
	//	 inputContainer.classList.add('show');

	//	 inputFriend.addEventListener('input', function() {
	//		 const userList = document.getElementById('users-list').getAttribute('data-users').split(', ');
	//		 if (!userList.includes(this.value)) {
	//			 alert(`User doesn't exist`);
	//		 }
	//		 else {
	//			 alert(`Invitation envoyee :)`);
	//		 }
	//	 });
	//	 });
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
			document.getElementById('message-input').value = '';	// Vide le champ de saisie
			console.log("MESSAGE ENVOYE !");	
		}
	});

	const messageInput = document.getElementById('message-input');
	messageInput.addEventListener('keydown', (event) => {

		if (event.key === 'Enter') {
			event.preventDefault();	//Empeche le retour a la ligne !
			sendButton.click();
		}
	});
}

	// Add the message on the chat conv
function addMessage(mess, sender, id) {
	console.log("sender id: " + id);
	
	
	const chatPage = document.getElementById('chat-page')
	
	const message = document.createElement('div');
	message.classList.add('message');

	if (sender === username) {
		message.classList.add('sent');
	}
	else {
		message.classList.add('received');
	}

	const usernameElement = document.createElement('span');
	//usernameElement.classList.add('username');
	usernameElement.innerHTML = `<img src='/static/images/basePP.png' id="caca">
								 <p class="name">${sender}</p>`;
	// usernameElement.textContent = sender;
	
	const messElement = document.createElement('p');
	messElement.classList.add('text')

	if (blockedUsersList.includes(id)) { // Then user is blocked 
		messElement.textContent = "You blocked this user";	
		messElement.style.color = "red";
	}
	else messElement.textContent = mess;

	message.appendChild(usernameElement);
	message.appendChild(messElement);
	chatPage.appendChild(message);

	const messImage = document.getElementById('caca');
	usernameElement.addEventListener('click', async function() {
		alert('Image clicked!');
		window.location.href = "/accounts/unavailable/";
	});

	chatPage.scrollTop = chatPage.scrollHeight;
}


////////////////////////////////////////////////
		/* Function API fetch */
///////////////////////////////////////////////

// Live chat with AJAX system
async function liveChatFetch() {
	try {
		const response = await fetch(`/accounts/api/live_chat/?channel_name=${encodeURIComponent(currentChan)}&last_message=${lastMessageId}`, {
			headers: {
			'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.log("Erreur du fetch " + `/accounts/api/live_chat/?channel_name=${encodeURIComponent(currentChan)}&last_message=${lastMessageId}`);
		}

		const data = await response.json();
		if (data.new_message && data.new_message.length > 0) {
			console.log(data.new_message);
			data.new_message.forEach(message => {
				console.log("Adding message with id = " + message.id);
				addMessage(message.message, message.sender, message.idSender);
				lastMessageId = message.id;
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
		return 0
	}
	return 1
}

// Load channels that already exists and get them from db
// When UserChan table created, use it
async function	loadChannels() {
	
	try {
		await getCurrentPlayerId();
		await getBlocked();

		const response = await fetch('/accounts/api/get_chans/', {
		headers: {
			'Content-Type': 'application/json',
		}
		});

		const result = await response.json();
		if (result.status == 'success' && Array.isArray(result.channels)) {
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
			idSender: cachedUserId,
			})
		});
		if (!response.ok) {
			throw new Error('Erreur lors de l\'ajout d\'un nouveau message dans le channel');
		}
		const data = await response.json();
		
		// Accéder à idSender
		const idSender = data.message.idSender;
		console.log('idSender:', idSender);

	} catch(error) {
		console.error('Erreur: ', error);
	}
}
let cachedUserId = null;

async function getCurrentPlayerId() { // à lancer au chargement de la page;
	if (cachedUserId !== null) {
		return cachedUserId;
	}
	try {
		const response = await fetch('/accounts/api/current-user/', {
			credentials: 'same-origin'
		});
		const data = await response.json();
		cachedUserId = data.userId;
		return cachedUserId;
	} catch (error) {
		console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
		return null;
	}
}

async function postblocked(idBlocked) { // idBlocked = l'id du joueur à bloquer
	try {
		const response = await fetch('/accounts/api/post_blocked/', {
			method: 'POST',
			headers: {
			'Content-Type': 'application/json',
			},
			body: JSON.stringify({
			idUser: cachedUserId, //  L'id du jouueur logged
			idBlocked: idBlocked, //  L'id de l'utilidateur qui va être bloqué 
			})
		});
		if (!response.ok) {
			throw new Error('Erreur lors de l\'ajout d\'un nouveau blocked');
		}
		const data = await response.json();
	} catch(error) {
		console.error('Erreur: ', error);
	}
}

function	getBlocked() {
	fetch(`/accounts/api/get_blocked/${cachedUserId}/`)
	.then(response => {
		if (!response.ok) {
			throw new Error('Erreur réseau');
		}
		return response.json();
	})
	.then(data => {
		console.log('IDs des utilisateurs bloqués :', data.blocked_users_ids);
		blockedUsersList = data.blocked_users_ids;
	})
	.catch(error => {
		console.error('Erreur lors de la récupération des données :', error);
	});
}

async function	post_deblock(a) {
	try {
		const response = await fetch('/accounts/api/post_deblock/', {
			method: 'POST',
			headers: {
			'Content-Type': 'application/json',
			},
			body: JSON.stringify({
			idUser: cachedUserId, //  L'id du jouueur logged
			idBlocked: a, //  L'id de l'utilidateur qui va être débloqué 
			})
		});
		if (!response.ok) {
			throw new Error('Erreur lors du retrait d\'un nouveau blocked');
		}
		const data = await response.json();
	} catch(error) {
		console.error('Erreur: ', error);
	}
}
