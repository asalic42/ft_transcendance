import { gameRouter } from './router.js'

// utils/api.js
// async function apiGet(url) {
// 	try {
// 	  	const response = await fetch(url, {
// 			credentials: 'include'
// 		});
// 	 	if (!response.ok) throw new Error('Erreur réseau');
// 	  	return await response.json();
// 	} catch (error) {
// 	  	console.error('API GET Error:', error);
// 	  	throw error;
// 	}
// }

// async function apiPost(url, data = {}) {
// 	try {
// 	  	const response = await fetch(url, {
// 			method: 'POST',
// 			headers: {
// 				'Content-Type': 'application/json',
// 				'X-CSRFToken': getCSRFToken()
// 			},
// 			body: JSON.stringify(data)
// 	  	});
// 	  	if (!response.ok) throw new Error('Erreur réseau');
// 	  	return await response.json();
// 	} catch (error) {
// 		console.error('API POST Error:', error);
// 		throw error;
// 	}
// }

// export class RoomGameManager {
// 	constructor() {
// 		console.log("CONSTRUCTOR ROOM");
// 		// if (document.getElementById('rooms-list').dataset.initialized) return ;

// 		this.roomList = document.getElementById('rooms-list');
// 		if (!this.roomList) {
// 			console.error("Element #rooms-list introuvable !");
// 			return ;
// 		}
// 		// document.getElementById('rooms-list').dataset.initialized = true;
// 		this.initEventListenners();
// 		this.loadRooms();
// 	}

// 	initEventListenners() {
// 		console.log("ADD ROOMS LISTENERS");
// 		document.getElementById('new-room').addEventListener('click', (e) => {
// 			e.preventDefault();
// 			this.createRoom();
// 		});

// 		this.roomList.addEventListener('click', (e) => {
// 			console.log("listener JOIN actif");
// 			const roomLink = e.target.closest('.room-link');
// 			if (roomLink) {
// 				e.preventDefault();
// 				this.joinRoom(roomLink.dataset.gameId);
// 			}
// 		});
// 	}

// 	async loadRooms() {
// 		console.log("LOAD ROOMS");
// 		try {
// 			const rooms = await apiGet('/accounts/api/rooms/');

// 			const tmp = document.createDocumentFragment();
// 			if (rooms.length === 0) {
// 				const p = document.createElement('p');
// 				p.textContent = "Aucune Room";
// 				tmp.appendChild(p);
// 			}
// 			else {
// 				rooms.forEach(room => {
// 					const link = document.createElement('a');
// 					link.href = `game-distant/${room.game_id}/0`;
// 					link.className = 'game-distant room-link';
// 					link.dataset.gameId = room.gameId;

// 					const span = document.createElement('span');
// 					span.className = "game-mode";
// 					span.textContent = `Room ${room.game_id}`;

// 					link.appendChild(span);
// 					tmp.appendChild(link);
// 				})
// 			}

// 			document.getElementById('rooms-list').replaceChildren(tmp);


// 			console.log("HTML bien ajoute !!!");
// 		} catch (error) {
// 			console.error('Error loading rooms: ', error);
// 			this.roomList.innerHTML = '<p>Erreur de chargement</p>';
// 		}
// 	}

// 	async createRoom() {
// 		console.log("CREATE A ROOM");
// 		try {
// 			const gameId = await apiPost('/accounts/api/create-room/');
// 			gameRouter.navigate(`/game-distant/${gameId.game_id}/0`);
// 			new PongDistantGame();
// 		} catch (error) {
// 			console.error("Error when creating a room: ", error);
// 		}
// 	}

// 	joinRoom(gameId) {
// 		console.log("JOIN A ROOM");
// 		gameRouter.navigate(`/game-distant/${gameId}/0`);
// 		new PongDistantGame();
// 	}
// }

export class PongDistantGame {

	constructor(gameId, id_t) {
		console.log("JE COMMENCE LE PONG");
		this.initState();
		this.keyHandler = this.handleKey.bind(this);
		this.socket = new WebSocket(`wss://${window.location.host}/ws/pong/${gameId}/${id_t}`);
		this.initSocket();
	}

	initState() {
		this.counter = 3;
		this.keys = {};                        // Players bars
		this.currentPlayer = null;
		this.gameState = {
			player1_coords: null,
			player2_coords: null,
			ball_coords: null,
			scores: {
				p1: 0,
				p2: 0
			}
		};
		this.compteur = 0;
		this.setupDOM();
	}

	setupDOM() {
		const safeShow = (id) => {
			const element = document.getElementById(id);
			if (element) element.style.display = 'flex';
		};
		['scores', 'fps', 'canvas-container'].forEach(safeShow);
		document.getElementById("scoreP1").textContent = "0";
		document.getElementById("scoreP2").textContent = "0";
	}

	// Arrete le jeu
	stopGame() {
		if (disconnected.style.display === "block") {
			disconnected.style.display = "none"; 
		}
		window.removeEventListener('keydown', this.keyHandler);
		window.removeEventListener('keyup', this.keyHandler);
		this.keyHandler = null;
		if (document.getElementById('game').getContext('2d')) {
			document.getElementById('game').getContext('2d').clearRect(0, 0, document.getElementById('game').width, document.getElementById('game').height);
		}
		this.initState();
	}

	// Socket concerns
	initSocket() {
		this.socket.onopen = () => this.handleServerOpen();
		this.socket.onmessage = (event) => this.handleServerMessage(event);
		this.socket.onerror = (error) => this.handleServerError(error);
		this.socket.onclose = () => this.handleServerDisconnect();
	}

	handleServerOpen() {
		console.log("Connexion réussie au WebSocket");
		this.setupListeners();
	}

	handleServerMessage(event) {
		try {
			const data = JSON.parse(event.data);
	
			if (data.type == "countdown") {
				this.countdownBeforeGame(data);
			}
			else if (data.type == "game_won"){
				if (data.loser == 2)
					this.winnerWindow(1);
				else 
					this.winnerWindow(2);
				document.getElementById("disconnected").style.display = "block";
			}
			
			else if (data.type == "game_restarted") {
				this.game_restarted();
			}
	
			else if (data.type == "players_name") {
				if (data.player1_name) {
					document.getElementById("title-p1").innerText = data.player1_name;
					document.getElementById("text-p1").textContent = document.getElementById("title-p1").innerText + " wins !";
				}
	
				if (data.player2_name) {
					document.getElementById("title-p2").innerText = data.player2_name;
					document.getElementById("text-p2").textContent = document.getElementById("title-p2").innerText + " wins !";
				}
			}
	
			else if (data.type == "game_state") {
				document.getElementById("overlay").style.display = 'none';
				this.gameLoop(data, Date.now());
			}
	
			else if (data.type == "game_error") {
				alert("Sorry, there has been a server side error. Please, change rooms.");
			}
	
		} catch (error) {
			console.error("Erreur de parsing des données du WebSocket :", error);
		}
	}

	handleServerError(error) {
		console.error("Erreur WebSocket:", error);
		alert("Game is full, or there has been an error.");
	}

	handleServerDisconnect() {
		console.log("Deconnexion du socket");
	}

	setupListeners() {
		this.keyHandler = (e) => this.handleKey(e);
		window.addEventListener('keydown', this.keyHandler);
		window.addEventListener('keyup', this.keyHandler);
	}

	handleKey(e) {
		this.keys[e.key] = (e.type === 'keydown');
	}

	countdownBeforeGame(data) {
		document.getElementById("overlay").style.display = 'block';
		document.getElementById("countdown").innerText = data.message;
	}

	drawOuterRectangle(color) {
		document.getElementById("game").getContext('2d').fillStyle = color;
		document.getElementById("game").getContext('2d').beginPath();
		document.getElementById("game").getContext('2d').roundRect(0, 0, document.getElementById("game").width, document.getElementById("game").height, 10);
		document.getElementById("game").getContext('2d').fill();
		document.getElementById("game").getContext('2d').closePath();
	}
	
	drawInnerRectangle(color) {
		document.getElementById("game").getContext('2d').fillStyle = color;
		document.getElementById("game").getContext('2d').beginPath();
		document.getElementById("game").getContext('2d').roundRect(5, 5, document.getElementById("game").width - 10, document.getElementById("game").height - 10, 8);
		document.getElementById("game").getContext('2d').fill();
		document.getElementById("game").getContext('2d').closePath();
	}
	
	drawPlayer() {
		if (!this.gameState.player1_coords || !this.gameState.player2_coords) return;
	
		document.getElementById("game").getContext('2d').fillStyle = "#ED4EB0";
		document.getElementById("game").getContext('2d').beginPath();
		
		if (this.gameState.player1_coords) {
			document.getElementById("game").getContext('2d').roundRect(this.gameState.player1_coords.x1, this.gameState.player1_coords.y1, 5, 80, 10);
		}
		if (this.gameState.player2_coords) {
			document.getElementById("game").getContext('2d').roundRect(this.gameState.player2_coords.x1, this.gameState.player2_coords.y1, 5, 80, 10);
		}
		document.getElementById("game").getContext('2d').fill();
		document.getElementById("game").getContext('2d').closePath();
	}
	
	drawBall() {
		if (!this.gameState.ball_coords) return; 
	
		document.getElementById("game").getContext('2d').beginPath();
		document.getElementById("game").getContext('2d').fillStyle = 'white';
		document.getElementById("game").getContext('2d').arc(this.gameState.ball_coords.x, this.gameState.ball_coords.y, 13, Math.PI * 2, false);
		document.getElementById("game").getContext('2d').fill();
		document.getElementById("game").getContext('2d').closePath();
		
		document.getElementById("game").getContext('2d').beginPath();
		document.getElementById("game").getContext('2d').fillStyle = "#23232e";
		document.getElementById("game").getContext('2d').arc(this.gameState.ball_coords.x, this.gameState.ball_coords.y, 13 - 2, Math.PI * 2, false);
		document.getElementById("game").getContext('2d').fill();
		document.getElementById("game").getContext('2d').stroke();
		document.getElementById("game").getContext('2d').closePath();
	}
	
	update() {
	
		this.drawOuterRectangle("#ED4EB0");
		this.drawInnerRectangle("#23232e");
	
		document.getElementById("game").getContext('2d').fillStyle = '#ED4EB0';
		document.getElementById("game").getContext('2d').fillRect(document.getElementById("game").width / 2, 0, 5, document.getElementById("game").height);
	
		console.log('Drawing player');
		this.drawPlayer();
		this.drawBall();
	}

	sendPlayerMove() {
		const moveData = {};
		if (this.keys["ArrowUp"] || this.keys["ArrowDown"]) {
			const moveValue = this.keys["ArrowUp"] ? -10 : 10;
	
			if (this.currentPlayer === 1) {
				moveData.player1_coords = { y1: moveValue };			
			} else if (this.currentPlayer === 2) {
				moveData.player2_coords = { y1: moveValue };
			}
		}
		 // N'envoyer que si on a des données à envoyer
		if (Object.keys(moveData).length > 0 && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(moveData));
		}
	}
	
	gameLoop(data, start) {
		if (data.number) this.currentPlayer = data.number;
		if (data.player1_coords) this.gameState.player1_coords = data.player1_coords;
		if (data.player2_coords) this.gameState.player2_coords = data.player2_coords;
		if (data.ball_coords) this.gameState.ball_coords = data.ball_coords;
		if (data.scores) this.gameState.scores = data.scores;
	
		this.sendPlayerMove();
		this.compteur++;

		let end = Date.now();
		if (end - start > 1000) {
			document.getElementById("fps").innerText = "Fps: " + this.compteur;
			this.compteur = 0;
			start = Date.now();
		}

		document.getElementById("game").getContext('2d').clearRect(0, 0, document.getElementById("game").width, document.getElementById("game").height);
		this.update();
		
		if (this.gameState.scores) {
			document.getElementById("scoreP1").innerText = this.gameState.scores.p1;
			document.getElementById("scoreP2").innerText = this.gameState.scores.p2;

			if (this.gameState.scores.p1 >= 5) {
				this.winnerWindow(1);
			}
			else if (this.gameState.scores.p2 >= 5) {
				this.winnerWindow(2);
			}
		}
	}

	game_restarted() {
		
		const button = document.getElementById("replay-button");
		const winner1Text = document.getElementById("wrapper-player1");
		const winner2Text = document.getElementById("wrapper-player2");
		
		button.style.display = "none";
		winner1Text.style.display = "none";
		winner2Text.style.display = "none";
		
		if (this.gameState.scores.p1 >= 1) {
			this.drawOuterRectangle("#365fa0");
		}
		else {
			this.drawOuterRectangle("#C42021");
		}
		
		this.stopGame();
	}

	async winnerWindow(player) {

		document.getElementById('game').getContext('2d').clearRect(0, 0, document.getElementById('game').width, document.getElementById('game').height);
		
		const winner1Text = document.getElementById("wrapper-player1");
		const winner2Text = document.getElementById("wrapper-player2");
	
		winner1Text.style.display = 'none';
		winner2Text.style.display = 'none';
		if (player == 1) {
			this.drawOuterRectangle("#365fa0");
			winner1Text.style.display = "block";
		}
		else {
			this.drawOuterRectangle("#C42021");
			winner2Text.style.display = "block";
		}
		this.drawInnerRectangle("#23232e");
		this.newGame(player);
	}
	
	newGame(player) {
		const button = document.getElementById("replay-button");
		button.style.display = "block";
	
		if (player == 1)
			button.style.color = "#C42021";
		else
			button.style.color = "#365FA0";
	
		button.addEventListener("click", () => {
			this.resetGame();
		});
	}
	
	resetGame() {
		if (this.socket.readyState === WebSocket.OPEN) {
			console.log("Demande de reset du jeu");
			this.socket.send(JSON.stringify({action: "restart_game"}));
		} else {
			console.log("Echec");
		}
	}
}

function loadRooms() {
	console.log("LOAD ROOMS");
	fetch('/accounts/api/rooms/')
		.then(response => response.json())
		.then(rooms => {
			const container = document.getElementById('rooms-list');
			

			if (rooms.length === 0) {
				container.innerHTML = '<p>Aucune Room</p>';
			} else {
				rooms.forEach(room => {
					const link = document.createElement('div');
					link.className = 'game-distant room-link';
					link.innerHTML = `<span class="game-mode">Room ${room.game_id}</span>`;
					link.addEventListener('click', () => joinRoom(room.game_id));
					container.appendChild(link);
				});
			}
			console.log("HTML bien ajoute !!!");
		})
		.catch(error => {
			console.error('Error loading rooms: ', error);
			// document.addEventListener('rooms-list').innerHTML = '<p class="error">Erreur de chargement</p>';
		});
}

function joinRoom(roomId) {
	new PongDistantGame(roomId, 0);
}

async function createRoom(gameId) {
	console.log("CREATE A ROOM");
	try {
		const response = await fetch('/accounts/api/create-room/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCSRFToken() // Assurez-vous que cette fonction est bien définie
			},
			body: JSON.stringify({
				gameId: gameId
			})
		});

		if (!response.ok) {
			throw new Error('Erreur reseau lors de la creation de la salle');
		}

		await response.json();
		new PongDistantGame(gameId, 0);
		
	} catch (error) {
		console.error("Error when creating a room: ", error);
	}
}

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById('new-room').addEventListener('click', async (e) => {
		e.preventDefault();
		const userId = document.getElementById('new-room').getAttribute('data-user-id');
		await createRoom(userId);
	});

	console.log("je suis la!");
	loadRooms();

});
