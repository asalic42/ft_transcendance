// console.log(`Current username is ${username}`);


//////////////////////////////////////////////////////////////////////////////////////////

//! MONITORING

async function checkChannels() {
	// await getCurrentPlayerId();
	if (typeof userid === 'undefined' || userid === null) {
        userid = await getCurrentPlayerId();
    }
	await loadChannels();
	liveChanTimeout = setTimeout(checkChannels, 2000);
}

function launch_everything() {
	let chatVisible = false;
	let currentChan;
	let lastMessageId = 0;
	let liveChan;
	let blockedUsersList = null;
	let userid = null;
	// let isLoadingChannels = false;
	// let unreadMsg = {};
	
	// Recup l'user courant
	const userElement = document.getElementById('current-username');
	let username = userElement.getAttribute('data-username');

	checkChannels();

	const newChan = document.getElementById('new-chan');
	const newFren = document.getElementById('add-friend-chan');
	const sendForm = document.getElementById('sendForm');
	const friendSelect = document.getElementById('input-add-friend-chan');
	const overlay = document.getElementById('overlay');
	const inputContainerDM = document.getElementById('input-dm');

	sendForm.addEventListener('click', async function (event) {
		event.preventDefault();
		if (!currentPVCallback) return;

		const selectedFriendId = friendSelect.value;
		const channelName = "TestValue" + userid + selectedFriendId; // Générer le nom du canal

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
		setChannelName(async function (nameChan) {
			addChannelToDb(nameChan, 0, "")
			try {
				const response = await fetch(`/api/chan_exist/${encodeURIComponent(nameChan)}/`);
				const data = await response.json();

				if (data.status !== 'error') {
					openCenter(nameChan, nameChan);
				}
			}
			catch (error) {}
		});
	});

	newFren.addEventListener('click', () => {
		// Creation de chan pv + ouverture
		setChannelNamePV(async function (nameChan, ami) {
			const result = await addChannelToDb(nameChan, 1, ami);
			if (!result) return;
			try {
				const response = await fetch(`/api/chan_exist/${encodeURIComponent(nameChan)}/`);
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
}

// Cliquer sur un channel deja creer
function clickToChannel(chanItem, printName, nameChan) {
	chatVisible = false;
	liveChat = 0;
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
		const msg = `https://${window.location.host}/game-distant/${userid}/`;
		postMessage(currentChan, msg, true);
		await invite_button();
		loadPage(`https://${window.location.host}/game-distant/${userid}/`);
	});
}

//////////////////////////////////////////////////////////////////////////////////////////
async function addChannelToList(nameChan, pv, idChan) {
	var chanList;
	const existingChannel = document.querySelector(`#channel-${nameChan}`);
	if (existingChannel) return;
	if (pv) {

		var result = await doesUserHaveAccessToChan(idChan, userid);
		if (!result.success)
			return;
		chanList = document.getElementById('friends');
	}
	else
		chanList = document.getElementById('channels-list');

	if (!chanList) {
		return;
	}
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

	if (!chatVisible)
		chatVisible = !chatVisible;
	currentChan = nameChan;

	const h2content = document.getElementById('chat-name');
	h2content.textContent = printName;

	const chatContainer = document.getElementById('chat-page');
	chatContainer.innerHTML = ``;

	// onChannelOpening(currentChan);
	// markAsRead()

	if (liveChat) clearInterval(liveChat);

	liveChat = setInterval(() => {
		liveChatFetch();
	}, 250);
}

//////////////////////////////////////////////////////////////////////////////////////////
//! CENTER CHANNELS PART
// Main monitor for the center column and message listener
function popCenterChat(nameChan) {
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
	return fetch(`/user-settings/check_pp/${userId}/`)
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

	console.log("USER ID:", userid);
	console.log("ID:", id);
	console.log("USER ID === ID: ", userid === id);

	if (id === userid) message.classList.add('sent');
	else message.classList.add('received');

	let pp;
	try {
		const userData = await getPP(id); // Await the result of getPP
		pp = userData.img; // Access the img property
	} catch (error) {
		console.error('Error fetching profile picture:', error);
	}

	const usernameElement = document.createElement('span');
	// const sender = messImage.nextElementSibling.textContent;
	// window.location.href = `/profile/${sender}`;
	// usernameElement.innerHTML = `<a href="/profile/${sender}">
	usernameElement.innerHTML = `<img src='${pp}' id="caca">
								<p class="name">${sender}</p>`;

	var messElement;
	if (is_link) {
		messElement = document.createElement('a');
		messElement.href = mess;
	}
	else messElement = document.createElement('p');

	messElement.classList.add('text')

	if (blockedUsersList.includes(id)) { // Then user is blocked
		messElement.textContent = "You blocked this user";
		messElement.style.color = "red";
	}
	else if (is_link) {
		messElement.textContent = "Invitation à jouer";
		messElement.style.color = "#ee5fb7";
	}
	else messElement.textContent = mess;

	message.appendChild(usernameElement);
	message.appendChild(messElement);
	chatPage.appendChild(message);

	const messImages = document.querySelectorAll('#caca');
    messImages.forEach(function (messImage) {
        messImage.addEventListener('click', async function () {
			const sender = messImage.nextElementSibling.textContent;
			loadPage(`/profile/${sender}`);
            // window.location.href = `/profile/${sender}`;
        });
    });

	chatPage.scrollTop = chatPage.scrollHeight;
}

// function onChannelOpening(channelName) {
// 	if (notificationChatSocketSocket.readyState === WebSocket.OPEN) {
// 		notificationChatSocketSocket.send(JSON.stringify({
// 			type: 'channel_opened',
// 			channel_name: channelName
// 		}));
// 	}
// }

//////////////////////////////////////////////////////////////////////////////////////////
//! LEFT CHAN PART

// Add channel to the right channel's list
async function doesUserHaveAccessToChan(idC, idU) {
	return fetch(`/api/doesUserHaveAccessToChan/${idC}/${idU}`)
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
		const response = await fetch(`/api/live_chat/?channel_name=${encodeURIComponent(currentChan)}&last_message=${lastMessageId}`, {
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.log("Erreur du fetch " + `/api/live_chat/?channel_name=${encodeURIComponent(currentChan)}&last_message=${lastMessageId}`);
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
		return null;
	}
}

function get_chan_id(nameChan) {
	console.log("avant fetch: ", currentChan);
	return fetch(`/api/get_chan_id/${nameChan}/`)
		.then(response => {
			if (response.status === 404) throw new Error('User not found');
			return response.json(); // Parse JSON first
		})
		.then(data => {
			return data; // Return for downstream use
		})
		.catch(error => {
			throw null; // Re-throw for handling in addMessage
		});
}

function is_chan_private(idChan) {
	return fetch(`/api/is_chan_private/${idChan}/`)
		.then(response => {
			if (response.status === 404) throw new Error('User not found');
			return response.json(); // Parse JSON first
		})
		.then(data => {
			console.log("je suis la ?!");
			if (data.is_private)
				return true;
			else
				return false;
		})
		.catch(error => {
			throw null; // Re-throw for handling in addMessage
		});
}

function getNameById(id) {
	return fetch(`/api/getNameById/${id}/`)
		.then(response => {
			if (response.status === 404) throw new Error('User not found');
			return response.json(); // Parse JSON first
		})
		.then(data => {
			return data; // Return for downstream use
		})
		.catch(error => {
			throw null; // Re-throw for handling in addMessage
		});
}

async function addPvChan(chanId, amiName) {
	// const userData = await getIdByName(amiName);
	pk = amiName;

	const response = await fetch('/api/postPv/', {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			'X-CSRFToken': getCSRFToken(),  // Use the function directly
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			id_chan: chanId,
			id_u1: userid,
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
			const checkResponse = await fetch(`/api/check_private_channel/${userid}/${ami}/`);
			const checkData = await checkResponse.json();

			if (checkData.exists) {
				alert("Un canal privé existe déjà entre ces utilisateurs!");
				return 0;
			}
		}

		// Continue avec la création du canal si aucun doublon n'est trouvé
		const response = await fetch('/api/post_chan/', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'X-CSRFToken': getCSRFToken(),
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
		return null;
	}
}

// Load channels that already exists and get them from db
// When UserChan table created, use it

async function loadChannels() {
	// if (isLoadingChannels) return; // Si déjà en cours de chargement, ne rien faire

	try {
		await getBlocked();

		const response = await fetch('/api/get_chans/', {
			headers: {
				'Content-Type': 'application/json',
			}
		});

		const result = await response.json();

		if (result.status === 'success' && Array.isArray(result.channels)) {
			result.channels.forEach(channel => {
				addChannelToList(channel.name, channel.private, channel.id);
			});
		}
	} catch (error) {
		return null;
	}
}

async function invite_button() {
	fetch(`/create_current_game/${userid}/`)
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
		const chanId = await get_chan_id(currentChan);
		const is_private = await is_chan_private(chanId.id);
		let result;
		let user2 = null;
		if (is_private) {
			result = await doesUserHaveAccessToChan(chanId.id, userid);
			user2 = result.id_u2;
		}

		const response = await fetch('/api/post_message/', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'X-CSRFToken': getCSRFToken(),  // Use the function directly
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				channel_name: currentChan,
				sender: document.getElementById('current-username').getAttribute('data-username'),
				message: mess,
				idSender: userid,
				is_link: is_link,
				user2: user2
			})
		});
		if (!response.ok) {
			throw new Error('Erreur lors de l\'ajout d\'un nouveau message dans le channel');
		}
		const data = await response.json();

		// notif
		// if (notificationChatSocketSocket.readyState === WebSocket.OPEN)
			// markAsRead()

		// Accéder à idSender
		const idSender = data.message.idSender;

	} catch (error) {
		alert("Wow ! That's a long message. It should work better if it shrinks down.");
		return null;
	}
}

async function getCurrentPlayerId() { // à lancer au chargement de la page;
	if (typeof userid !== 'undefined' && userid !== null) {
		return userid;
	}
	try {
		const response = await fetch('/api/current-user/', {
			credentials: 'same-origin'
		});
		const data = await response.json();
		userid = data.userId;
		return userid;
	} catch (error) {
		console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
		return null;
	}
}

async function postblocked(idBlocked) { // idBlocked = l'id du joueur à bloquer
	try {
		const response = await fetch('/api/post_blocked/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				idUser: userid, //  L'id du jouueur logged
				idBlocked: idBlocked, //  L'id de l'utilidateur qui va être bloqué
			})
		});
		if (!response.ok) {
			throw new Error('Erreur lors de l\'ajout d\'un nouveau blocked');
		}
		const data = await response.json();
	} catch (error) {
		return null;
	}
}

function getBlocked() {
	fetch(`/api/get_blocked/${userid}/`)
		.then(response => {
			if (!response.ok) {
				throw new Error('Erreur réseau');
			}
			return response.json();
		})
		.then(data => {
			blockedUsersList = data.blocked_users_ids;
		})
		.catch(error => {
			return null;
		});
}

async function post_deblock(a) {
	try {
		const response = await fetch('/api/post_deblock/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				idUser: userid, //  L'id du jouueur logged
				idBlocked: a, //  L'id de l'utilidateur qui va être débloqué
			})
		});
		if (!response.ok) {
			throw new Error('Erreur lors du retrait d\'un nouveau blocked');
		}
		const data = await response.json();
	} catch (error) {
		return null;
	}
}
// Fonction pour marquer une notif comme lue
// function markAsRead() {
// 	if (notificationChatSocketSocket.readyState == WebSocket.OPEN) {
// 		notificationChatSocketSocket.send(JSON.stringify({
// 			'type': 'mark_as_read',
// 			'channel_name': currentChan,
// 		}));
// 	}
// }getto