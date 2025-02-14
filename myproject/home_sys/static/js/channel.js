/* INFOS
- les fonctions 'socket sont celles qui communiquent avec le serveur (server.js)'
- socket.on = fonction qui agit directement sur le site
- socket.emit = fonction qui communique avec celle du cote client
*/

let chatVisible = false;
let currentChan;
let lastMessageId = 0;
let liveChat;
let liveChan;
let blockedUsersList = null;
// let unreadMsg = {};

// Recup l'user courant
const userElement = document.getElementById('current-username');
const username = userElement.getAttribute('data-username');
// console.log(`Current username is ${username}`);

//////////////////////////////////////////////////////////////////////////////////////////

//! MONITORING

let liveChanTimeout;

async function checkChannels() {
	await loadChannels();
		
	liveChanTimeout = setTimeout(checkChannels, 2000);
}

document.addEventListener("DOMContentLoaded", function() {

	checkChannels();

	const newChan = document.getElementById('new-chan');
	const newFren = document.getElementById('add-friend-chan');
	const sendForm = document.getElementById('sendForm');
	const friendSelect = document.getElementById('input-add-friend-chan');
	const overlay = document.getElementById('overlay');
	const inputContainerDM = document.getElementById('input-dm');

	sendForm.addEventListener('click', async function(event) {
		event.preventDefault();
		if (!currentPVCallback) return;

		const selectedFriendId = friendSelect.value;
		const channelName = "TestValue" + cachedUserId + selectedFriendId; // Générer le nom du canal

		// Validation
		if (!selectedFriendId) {
			alert('Veuillez sélectionner un ami');
			return;
		}

		// Masquer le modal
		overlay.style.display = 'none';
		inputContainerDM.classList.remove('show');

		// Appeler le callback et réinitialiser
		currentPVCallback(channelName, selectedFriendId);
		currentPVCallback = null;
	});

	newChan.addEventListener('click', () => {
		// Creation de chan + ouverture
			setChannelName(async function(nameChan) {
				addChannelToDb(nameChan, 0, "")
				try {
					const response = await fetch(`/accounts/api/chan_exist/${encodeURIComponent(nameChan)}/`);
					const data = await response.json();

					if (data.status === 'error') {
						throw new Error("Chan already exist"); // Channel exists
					}
					openCenter(nameChan, nameChan);
				}
				catch (error) {
					console.error(error);
				}
			});
	});

	newFren.addEventListener('click', () => {
		// Creation de chan pv + ouverture
			setChannelNamePV(async function(nameChan, ami) {
				const result = await addChannelToDb(nameChan, 1, ami);
				if (!result) return;
				try {
					const response = await fetch(`/accounts/api/chan_exist/${encodeURIComponent(nameChan)}/`);
					const data = await response.json();

					if (data.status === 'error') {
						throw new Error("Chan already exist"); // Channel exists
					}
					openCenter((await getNameById(ami)).name, nameChan);
				}
				catch (error) {
					console.error(error);
				}
			});
	});
});

// Cliquer sur un channel deja creer
function	clickToChannel(chanItem, printName, nameChan) {
	chanItem.addEventListener('click', async () => {
		openCenter(printName, nameChan);
	});
}

// Check if a message is send by a click or an ENTER, and send it
function addMessageListener() {
	const sendButton = document.getElementById('send-button');
	sendButton.addEventListener('click', () => {

		const msg = document.getElementById('message-input').value;
		if (msg != "") {
			postMessage(currentChan, msg, false);
			document.getElementById('message-input').value = '';	// Vide le champ de saisie
			// console.log("MESSAGE ENVOYE !");
		}
	});

	const messageInput = document.getElementById('message-input');
	messageInput.addEventListener('keydown', (event) => {

		if (event.key === 'Enter') {
			event.preventDefault();	//Empeche le retour a la ligne !
			sendButton.click();
		}
	});

	const invite = document.getElementById('invite-button');
	invite.addEventListener('click', async (event) => {
		const msg = `https://transcendance.42.paris/accounts/game-distant/${cachedUserId}/`;
		postMessage(currentChan, msg, true);
		await invite_button();
		window.open(`https://transcendance.42.paris/accounts/game-distant/${cachedUserId}/`, '_blank').focus();
	});
}

//////////////////////////////////////////////////////////////////////////////////////////
	
async function	addChannelToList(nameChan, pv, idChan) {
	var chanList;
	const existingChannel = document.querySelector(`#channel-${nameChan}`);
	if (existingChannel) return;
	if (pv) {

		var result = await doesUserHaveAccessToChan(idChan, cachedUserId);
		if (!result.success)
			return;
		chanList = document.getElementById('friends');
	}
	else
		chanList = document.getElementById('channels-list');

	if (!chanList.querySelector(`#channel-${nameChan}`)) {
		const chanItem = document.createElement('div');
		chanItem.id = `channel-${nameChan}`;
		chanItem.classList.add('chan-item');

		const titleChan = document.createElement('h2');
		titleChan.id = 'title-chan';
		if (pv)
			titleChan.textContent = (await getNameById(result.data.id_u2)).name;
		else
			titleChan.textContent = nameChan;
		chanItem.appendChild(titleChan);
		clickToChannel(chanItem, titleChan.textContent, nameChan);
		chanList.appendChild(chanItem);
	}
}

async function openCenter(printName, nameChan) {
	lastMessageId = 0;
	popCenterChat(nameChan);
	// document.getElementById('new-chan').textContent = '➙';
	// inviteFriendInChan(document.getElementById('add-friend-chan'));
	if (!chatVisible)
		chatVisible = !chatVisible;
	currentChan = nameChan;

	const h2content = document.getElementById('chat-name');
	h2content.textContent = printName;

	const chatContainer = document.getElementById('chat-page');
	chatContainer.innerHTML = ``;

	if (liveChat) clearInterval(liveChat);

	liveChat = setInterval(() => {
		liveChatFetch();
	}, 500);
}

//////////////////////////////////////////////////////////////////////////////////////////
//! CENTER CHANNELS PART
	// Main monitor for the center column and message listener
function	popCenterChat(nameChan) {
	const page = document.querySelector('.page');
	const channels = document.querySelector('.channels');

	page.style.gridTemplateColumns = '1fr minmax(0, 3fr) 1fr';

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
		<button id="invite-button">Inviter à jouer</button>
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

function getPP(userId) {
	return fetch(`/accounts/user-settings/check_pp/${userId}/`)
		.then(response => {
			if (response.status === 404) throw new Error('User not found');
			return response.json(); // Parse JSON first
		})
		.then(data => {
			// console.log("User data:", data); // Now data is defined
			return data; // Return for downstream use
		})
		.catch(error => {
			console.error('Fetch error:', error);
			throw error; // Re-throw for handling in addMessage
		});
}

// Add the message on the chat conv
async function addMessage(mess, sender, id, is_link) {

	const chatPage = document.getElementById('chat-page')

	const message = document.createElement('div');
	message.classList.add('message');

	if (sender === username)	message.classList.add('sent');
	else						message.classList.add('received');

	let pp;
	try {
		const userData = await getPP(id); // Await the result of getPP
		pp = userData.img; // Access the img property
	} catch (error) {
		console.error('Error fetching profile picture:', error);
	}

	const usernameElement = document.createElement('span');
	usernameElement.innerHTML = `<img src='${pp}' id="caca">
								 <p class="name">${sender}</p>`;

	var messElement;
	if (is_link) {
			messElement = document.createElement('a');
			messElement.href = mess;
	}
	else	messElement = document.createElement('p');

	messElement.classList.add('text')

	if (blockedUsersList.includes(id)) { // Then user is blocked
			messElement.textContent = "You blocked this user";
			messElement.style.color = "red";
	}
	else if (is_link) {
		messElement.textContent = "Invitation à jouer";
		messElement.style.color = "#ee5fb7";
	}
	else	messElement.textContent = mess;

	message.appendChild(usernameElement);
	message.appendChild(messElement);
	chatPage.appendChild(message);

	const messImage = document.getElementById('caca');
	usernameElement.addEventListener('click', async function() {
		window.location.href = `/accounts/profile/${sender}`;
	});

	chatPage.scrollTop = chatPage.scrollHeight;
}

//////////////////////////////////////////////////////////////////////////////////////////
//! LEFT CHAN PART

// Add channel to the right channel's list
async function doesUserHaveAccessToChan(idC, idU) {
	return fetch(`/accounts/api/doesUserHaveAccessToChan/${idC}/${idU}`)
		.then(response => {
			if (response.status === 404) throw new Error('User not found');
			return response.json(); // Parse JSON first
		})
		.then(data => {
			if (data.allowed == 'True')
				return { success: true, data };
			return { success: false, data };
		})
		.catch(error => {
			console.log(error);
			return { success: false, data: null };
		});
}	
	

function setChannelNamePV(callback) {
	const inputContainer = document.getElementById('input-dm');
	const overlay = document.getElementById('overlay');

	overlay.style.display = 'block';
	inputContainer.classList.add('show');

	currentPVCallback = callback;
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
			// console.log(data.new_message);
			for (var message of data.new_message) {
				// console.log("Adding message with id = " + message.id);
				await addMessage(message.message, message.sender, message.idSender, message.is_link);
				lastMessageId = message.id;
			}
		}
	} catch (error) {
		console.error('Erreur: ', error);
	}
}

function getNameById(id) {
	return fetch(`/accounts/api/getNameById/${id}/`)
		.then(response => {
			if (response.status === 404) throw new Error('User not found');
			return response.json(); // Parse JSON first
		})
		.then(data => {
			return data; // Return for downstream use
		})
		.catch(error => {
			throw error; // Re-throw for handling in addMessage
		});
}

async function addPvChan(chanId, amiName) {
	// const userData = await getIdByName(amiName);
	pk = amiName;

	const response = await fetch('/accounts/api/postPv/', {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			'X-CSRFToken': csrftoken,  // Use the function directly
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			id_chan: chanId,
			id_u1: cachedUserId,
			id_u2: pk,
		})
	});

	if (!response.ok) {
		throw new Error('Erreur lors de l\'ajout du chan');
	}
}

// Add a new channel to the db
async function addChannelToDb(currentChan, pv, ami) {
	try {
		// Si c'est un canal privé, vérifie d'abord s'il en existe déjà un
		if (pv) {
			const checkResponse = await fetch(`/accounts/api/check_private_channel/${cachedUserId}/${ami}/`);
			const checkData = await checkResponse.json();
			
			if (checkData.exists) {
				alert("Un canal privé existe déjà entre ces utilisateurs!");
				return 0;
			}
		}

		// Continue avec la création du canal si aucun doublon n'est trouvé
		const response = await fetch('/accounts/api/post_chan/', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'X-CSRFToken': csrftoken,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				name: currentChan,
				private: pv
			})
		});

		if (!response.ok)
			throw new Error('Erreur lors de l\'ajout du chan');

		const data = await response.json();
		var chanId = data.chan.id;

		if (pv)
			await addPvChan(chanId, ami);
			
		addChannelToList(currentChan, pv, chanId);
		return 1;
	} catch (error) {
		console.error('Erreur: ', error);
		return 0;
	}
}

// Load channels that already exists and get them from db
// When UserChan table created, use it
let isLoadingChannels = false;

async function	loadChannels() {
	if (isLoadingChannels) return; // Si déjà en cours de chargement, ne rien faire

	try {
		await getCurrentPlayerId();
		await getBlocked();

		const response = await fetch('/accounts/api/get_chans/', {
		headers: {
			'Content-Type': 'application/json',
		}
		});

		const result = await response.json();

		if (result.status === 'success' && Array.isArray(result.channels)) {
			result.channels.forEach(channel => {
				addChannelToList( channel.name, channel.private, channel.id );
			});	
		}
	} catch(error) {
		console.error('Erreur: ', error);
	} finally {
		isLoadingChannels = false;
	}
}

async function invite_button() {
	fetch(`/accounts/create_current_game/${cachedUserId}/`)
	.then(response => {
		if (!response.ok) {
			throw new Error('Erreur réseau');
		}
		console.log("tout est bien reçu");
		return response.json();
	})
	.catch(error => {
		console.error('Erreur lors de la récupération des données :', error);
	});
}

async function postMessage(currentChan, mess, is_link) {
	try {
		const response = await fetch('/accounts/api/post_message/', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'X-CSRFToken': csrftoken,  // Use the function directly
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				channel_name: currentChan,
				sender: username,
				message: mess,
				idSender: cachedUserId,
				is_link : is_link,
			})
		});
		if (!response.ok) {
			throw new Error('Erreur lors de l\'ajout d\'un nouveau message dans le channel');
		}
		const data = await response.json();

		// Accéder à idSender
		const idSender = data.message.idSender;
		// console.log('idSender:', idSender);

	} catch(error) {
		alert("Wow ! That's a long message. It should work better if it shrinks down.");
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
		blockedUsersList = data.blocked_users_ids;
		console.log("blockedUsersList:" + blockedUsersList);
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
