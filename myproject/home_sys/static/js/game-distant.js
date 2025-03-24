class RoomGameManager {

	constructor() {
		this.roomList = document.getElementById("rooms-list");
		if (!this.roomList) {
			console.error("Element #rooms-list introuvable !");
			return ;
		}
		const userId = document.getElementById('new-room').getAttribute('data-user-id');
		this.loadRooms();
		this.initEventListenners(userId);
	}

	initEventListenners(userId) {
		document.getElementById('new-room').addEventListener('click', (e) => {
			e.preventDefault();
			this.createRoom(userId);
		});
	}

	async loadRooms() {

		fetch('/api/rooms/')
			.then(response => response.json())
			.then(rooms => {
				const container = document.getElementById('rooms-list');
	
				if (rooms.length === 0) {
					container.innerHTML = '<p>Aucune Room</p>';
				} else {
					rooms.forEach(room => {
						const link = document.createElement('a');
						link.href = `/game-distant/${room.game_id}/0`;
						link.className = 'game-distant room-link';
						link.innerHTML = `<span class="game-mode">Room ${room.game_id}</span>`;
						link.addEventListener('click', () => this.joinRoom(room.game_id));
						container.appendChild(link);
					});
				}
			})
			.catch(error => {
				console.error('Error loading rooms: ', error);
			});
	}

	chargingGame() {
		return new Promise((resolve) => {
			const html = `
            	<link rel="stylesheet" href="/static/css/game-style.css">

            	<div class="scores" id="scores">

            		<h3 id="title-p1">Player 1</h3>
            		<h3 id="scoreP1">0</h3>
            		<h3 id="scoreP2">0</h3>
            		<h3 id="title-p2">Player 2</h3>
            	</div>

            	<div id="canvas-container" display="block">
            	    <canvas width="1920" height="850" id="game"></canvas>
            	    <div id="button-container">
            	        <button id="replay-button" style="display: none;">Play again !</button>
            	    </div>
            	    <div class="wrapper" top="500px" left="500px" width="1100" height="150" style="display: none;" id="wrapper-player1">
            	        <svg width="1100" height="150" id="svg-wrapper-player1">
            	            <text x="50%" y="50%" dy=".35em" text-anchor="middle" id="text-p1"></text>
            	        </svg>
            	    </div>
            	    <div class="wrapper" top="500px" left="500px" width="1100" height="150" style="display: none;" id="wrapper-player2">
            	        <svg width="1100" height="150" id="svg-wrapper-player2">
            	            <text x="50%" y="50%" dy=".35em" text-anchor="middle" id="text-p2"></text>
            	        </svg>
            	    </div>
            	    <div id="overlay">
            	        <h1 id="countdown">3</h1>
            	    </div>
            	</div>

            	<h3 class="disconnected" id="disconnected">Un joueur s'est deconnecte</h3>
       		`;
			document.getElementById('content').innerHTML = html;
			setTimeout(resolve, 50);
		});
	}

	async createRoom(gameId) {
		try {
			await fetch(`/create_current_game/${gameId}/`)
			await this.chargingGame();
			new PongDistantGame(gameId, 0);
		} catch (error) {
			console.error("Error when creating a room: ", error);
		}
	}

	async joinRoom(gameId) {
		await this.chargingGame();
		new PongDistantGame(gameId, 0);
	}
}

class PongDistantGame {
	static currentGame = null;

	constructor(gameId, id_t) {
		PongDistantGame.currentGame = this;
		
		this.keyHandler = this.handleKey.bind(this);
		this.initState();
		
		this.currentPlayer = null;
		this.socket = new WebSocket(`wss://${window.location.host}/ws/pong/${gameId}/${id_t}`);
		this.initSocket();
		this.id_t = id_t;
	}

	initState() {
		this.keys = {};                        // Players bars
		this.counter = 3;
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
		this.setupListeners();
	}

	setupDOM() {
		const safeShow = (id) => {
			const element = document.getElementById(id);
			if (element) element.style.display = 'flex';
		};
		['scores', 'scoreP1', 'scoreP2', 'canvas-container'].forEach(safeShow);

		if (document.getElementById("scoreP1")) document.getElementById("scoreP1").textContent = "0";
		if (document.getElementById("scoreP2")) document.getElementById("scoreP2").textContent = "0";
	}

	// Arrete le jeu
	stopGame() {
		window.removeEventListener('keydown',  this.keyHandler);
		window.removeEventListener('keyup',  this.keyHandler);

		if (document.getElementById('disconnected') && document.getElementById('disconnected').style.display === "block") {
			document.getElementById('disconnected').style.display = "none"; 
		}

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
	}

	handleServerMessage(event) {
		try {
			const data = JSON.parse(event.data);

			if (data.type == "countdown") {
				const winner1Text = document.getElementById("wrapper-player1");
				const winner2Text = document.getElementById("wrapper-player2");
				const button = document.getElementById("replay-button");
				const disco = document.getElementById("disconnected");

				disco.style.display = "none";
				button.style.display = "none";
				winner1Text.style.display = 'none';
				winner2Text.style.display = 'none';
				this.countdownBeforeGame(data);
			}
			
			else if (data.type == "game_won") {
				document.getElementById("disconnected").style.display = "block";
				document.getElementById("overlay").style.display = "none";
				if (data.loser == 2)
					this.winnerWindow(1, true);
				else 
					this.winnerWindow(2, true);
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
			else if (data.type == "close_connection") {
				document.getElementById('countdown').style.display = 'none';
				this.socket.close();
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
		window.addEventListener('keydown', this.keyHandler);
		window.addEventListener('keyup', this.keyHandler);
	}

	handleKey(e) {
		this.keys[e.key] = (e.type === 'keydown');
	}

	countdownBeforeGame(data) {
		document.getElementById("scores").style.display = 'flex';
		document.getElementById("canvas-container").style.display = 'flex';
		document.getElementById("game").style.display = 'block';
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
	
		this.drawPlayer();
		this.drawBall();
	}

	sendPlayerMove() {
		const moveData = {};
		if (this.keys["ArrowUp"] || this.keys["ArrowDown"]) {
			const moveValue = this.keys["ArrowUp"] ? -3 : 3;
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
	
	gameLoop(data) {
		if (data.number) this.currentPlayer = data.number;
		if (data.player1_coords) this.gameState.player1_coords = data.player1_coords;
		if (data.player2_coords) this.gameState.player2_coords = data.player2_coords;
		if (data.ball_coords) this.gameState.ball_coords = data.ball_coords;
		if (data.scores) this.gameState.scores = data.scores;
	
		this.sendPlayerMove();
	
		document.getElementById("game").getContext('2d').clearRect(0, 0, document.getElementById("game").width, document.getElementById("game").height);
		this.update();
		
		if (this.gameState.scores) {
			document.getElementById("scoreP1").innerText = this.gameState.scores.p1;
			document.getElementById("scoreP2").innerText = this.gameState.scores.p2;

			if (this.gameState.scores.p1 >= 5) {
				this.winnerWindow(1, false);
			}
			else if (this.gameState.scores.p2 >= 5) {
				this.winnerWindow(2, false);
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
		this.setupListeners();
	}

	async winnerWindow(player, deco) {

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
		await new Promise(r => setTimeout(r, 2000));
		if (this.id_t != 0) {
			loadPage(`/tournament/${this.id_t}`);
		}
		if (deco == false)
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
			this.socket.send(JSON.stringify({action: "restart_game"}));
		} else {
			console.log("Echec");
		}
	}

	closeSocket() {
		if (this.socket && this.socket.readyState == WebSocket.OPEN) {
			this.socket.close();

			window.removeEventListener('keydown', this.keyHandler);
			window.removeEventListener('keyup', this.keyHandler);

			console.log("Socket ferme !");
			
			PongDistantGame.currentGame = null;

			if (!this.id_t)
				this.stopGame();
		}
	}
}