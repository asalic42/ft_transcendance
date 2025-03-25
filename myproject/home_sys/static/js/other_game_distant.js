class CBRoomGameManager {
	constructor() {
		this.roomList = document.getElementById("rooms-list");
		if (!this.roomList) {
			console.error("Element #rooms-list introuvable !");
			return ;
		}
		this.mapId = 0;
		const userId = document.getElementById('new-room').getAttribute('data-user-id');
		this.loadRooms(userId);
	}

	async loadRooms(userId) {
		fetch('/api/cb-rooms/')
			.then(response => response.json())
			.then(rooms => {
				const container = document.getElementById('rooms-list');
	
				if (rooms.length === 0) {
					container.innerHTML = '<p>Aucune Room</p>';
				} else {
					rooms.forEach(room => {
						this.mapId = room.map_id;
						if (userId != room.game_id) {
							const link = document.createElement('a');
							link.href = `/other_game_multi/${room.game_id}/${room.map_id}`;
							link.className = 'other_game_multi room-link';
							link.innerHTML = `<span class="game-mode">Room ${room.game_id}</span>`;
							container.appendChild(link);
						}
					});
				}
			})
			.catch(error => {
				console.error('Error loading rooms: ', error);
			});
	}
}

class CasseBriqueDistantGame {
	static currentGame = null;
	
	constructor(gameId, mapId) {
		CasseBriqueDistantGame.currentGame = this;
		this.mapId = mapId;
		this.gameId = gameId
		
		this.keyHandler = this.handleKey.bind(this);
		this.initState();
		this.currentPlayer = null;
		
		this.socket = new WebSocket(`wss://${window.location.host}/ws/casse-brique/${gameId}/${mapId}`);
		this.initSocket();
	}

	initState() {
		this.keys = {};
		this.gameState = {
			player1_coords: null,
			player2_coords: null,
			ball1_coords: null,
			ball2_coords: null,
			blocks_p1: null,
			blocks_p2: null,
			scores: {
				p1: 0,
				p2: 0
			},
			timeLeft: 60
		};
		this.lastTime = performance.now();
		this.fpsHistory = [];
	
		this.animationId = 0;
		this.mapTab = [];
		this.compteur = 0;
		this.lastMoveTime = 0;
		this.moveCooldown = 10; 
		this.setupListeners();
		this.setupDOM();
	}

	setupDOM() {
		const safeShow = (id) => {
			const element = document.getElementById(id);
			if (element) element.style.display = 'flex';
		};
		['box-scores', 'player1', 'player2' , 'timer', 'game-cb', 'canvas-1', 'canvas-2'].forEach(safeShow);

		document.getElementById("title1").textContent = "0";
		document.getElementById("title2").textContent = "0";
	}

	setupListeners() {

		this.keyHandler = (e) => this.handleKey(e);
		window.addEventListener('keydown', this.keyHandler);
		window.addEventListener('keyup', this.keyHandler);
	}

	removeListeners() {

		this.keyHandler = (e) => this.handleKey(e);
		window.removeEventListener('keydown', this.keyHandler);
		window.removeEventListener('keyup', this.keyHandler);
	}

	handleKey(e) {
		if (e.repeat) return;

		this.keys[e.key] = (e.type === 'keydown');
	}

	initSocket() {
		this.socket.onopen = () => this.handleServerOpen();
		this.socket.onmessage = (event) => this.handleServerMessage(event);
		this.socket.onerror = (error) => this.handleServerError(error);
		this.socket.onclose = () => this.handleServerDisconnect();
	}

	handleServerOpen() {
		console.log("Connexion au Socket !");
	}
	
	handleServerMessage(event) {
		const data = JSON.parse(event.data);

		if (data.type == "countdown") {
			this.countdownBeforeGame(data);
		}
		else if (data.type == "players_name") {
			if (data.player1_name) document.getElementById("playername1").innerText = data.player1_name;
			if (data.player2_name) document.getElementById("playername2").innerText = data.player2_name;
		}
		else if (data.type == "game_over") {
			this.winnerWindow(data.winner, false);
		}

		if (data.type == "game_won") {
			document.getElementById("overlay1").style.display = 'none';
			document.getElementById("overlay2").style.display = 'none';
			if (data.disconnected) {
				document.getElementById("disconnected").style.display = "block"; // Affiche le message de déconnexion
				this.winnerWindow(data.loser, true);
			} else {
				this.winnerWindow(data.loser, true);
			}
		}
	
		else if (data.type == "game_restarted")
			this.restartGame();
	
		if (data.type === "game_start") {
			document.getElementById("player1").style.display = 'flex';
			document.getElementById("player2").style.display = 'flex';
			Array.from(document.getElementsByClassName("game")).forEach(element => element.style.display = 'flex');
		}
	
		if (data.type === "game_state") {
			// Stocker la map si elle est présente dans les données
			if (data.mapData) {
				this.mapTab = data.mapData;
			}
			
			document.getElementById("overlay1").style.display = 'none';
			document.getElementById("overlay2").style.display = 'none';
			document.getElementById("timer").style.display = 'flex';
			this.launchAnim(data);
		}
		if (data.type === "close_connection") {
			document.getElementById('countdown1').style.display = 'none';
			document.getElementById('countdown2').style.display = 'none';
			// alert(data.message);
			console.log('close 5');
			this.socket.close();
		}
	}

	handleServerError(error) {
		console.log("Erreur socket: ", error);
	}
	
	handleServerDisconnect() {
		console.log("Deconnexion du Socket...");
	}

	drawOuterRectangle(color_p1, color_p2) {
		document.getElementById("game1").getContext("2d").fillStyle = color_p1;
		document.getElementById("game1").getContext("2d").beginPath();
		document.getElementById("game1").getContext("2d").roundRect(0, 0, document.getElementById("game1").width, document.getElementById("game1").height, 10);
		document.getElementById("game1").getContext("2d").fill();
		document.getElementById("game1").getContext("2d").closePath();
	
		if (this.gameState.blocks_p2) {
			document.getElementById("game2").getContext("2d").fillStyle = color_p2;
			document.getElementById("game2").getContext("2d").beginPath();
			document.getElementById("game2").getContext("2d").roundRect(0, 0, document.getElementById("game2").width, document.getElementById("game2").height, 10);
			document.getElementById("game2").getContext("2d").fill();
			document.getElementById("game2").getContext("2d").closePath();
		}
	}
	
	drawInnerRectangle(color) {
		document.getElementById("game1").getContext("2d").fillStyle = color;
		document.getElementById("game1").getContext("2d").beginPath();
		document.getElementById("game1").getContext("2d").roundRect(5, 5, document.getElementById("game1").width - 10, document.getElementById("game1").height - 10, 8);
		document.getElementById("game1").getContext("2d").fill();
		document.getElementById("game1").getContext("2d").closePath();
	
		document.getElementById("game2").getContext("2d").fillStyle = color;
		document.getElementById("game2").getContext("2d").beginPath();
		document.getElementById("game2").getContext("2d").roundRect(5, 5, document.getElementById("game2").width - 10, document.getElementById("game2").height - 10, 8);
		document.getElementById("game2").getContext("2d").fill();
		document.getElementById("game2").getContext("2d").closePath();
	}

	drawPlayer() {
		if (!this.gameState.player1_coords || !this.gameState.player2_coords) return;
	
		document.getElementById("game1").getContext("2d").beginPath();
		document.getElementById("game1").getContext("2d").fillStyle = "#ED4EB0";
		document.getElementById("game1").getContext("2d").roundRect(this.gameState.player1_coords.x1, this.gameState.player1_coords.y1, this.gameState.player1_coords.x2 - this.gameState.player1_coords.x1, this.gameState.player1_coords.y2 - this.gameState.player1_coords.y1, 7);
		document.getElementById("game1").getContext("2d").fill();
		document.getElementById("game1").getContext("2d").closePath();
	
		document.getElementById("game2").getContext("2d").beginPath();
		document.getElementById("game2").getContext("2d").fillStyle = "#ED4EB0";
		document.getElementById("game2").getContext("2d").roundRect(this.gameState.player2_coords.x1, this.gameState.player2_coords.y1, this.gameState.player2_coords.x2 - this.gameState.player2_coords.x1, this.gameState.player2_coords.y2 - this.gameState.player2_coords.y1, 7);
		document.getElementById("game2").getContext("2d").fill();
		document.getElementById("game2").getContext("2d").closePath();
	}
	
	//! Ball
	drawBall(ball, context) {
	
		if (!ball) return;
	
		context.beginPath();
		context.fillStyle = 'white';
		context.arc(ball.coords.x, ball.coords.y, ball.radius, Math.PI * 2, false);
		context.fill();
		context.closePath();
		
		context.beginPath();
		context.fillStyle = "#23232e";
		context.arc(ball.coords.x, ball.coords.y, ball.radius - 2, Math.PI * 2, false);
		context.fill();
		context.stroke();
		context.closePath();
	}

	drawBlocks(context, blocks) {
		if (!blocks) return;
	
		blocks.forEach(block => {
			if (block.state) {
				context.beginPath();
				// Définir la couleur en fonction de l'état
				switch (block.state) {
					case 5:
						context.fillStyle = "green";
						break;
					case 4:
						context.fillStyle = "yellow";
						break;
					case 3:
						context.fillStyle = "orange";
						break;
					case 2:
						context.fillStyle = "red";
						break;
					case 1:
						context.fillStyle = "darkred";
						break;
				}
				context.roundRect(block.x, block.y, block.width, block.height, 7);
				context.fill();
			}
		});
	}

	updateDrawing() {
		this.drawOuterRectangle("#ED4EB0", "#ED4EB0");
		this.drawInnerRectangle("#23232e");
	
		this.drawPlayer();

		this.drawBlocks(document.getElementById("game1").getContext("2d"), this.gameState.blocks_p1);
		this.drawBlocks(document.getElementById("game2").getContext("2d"), this.gameState.blocks_p2);

		this.drawBall(this.gameState.ball1_coords, document.getElementById("game1").getContext("2d"));
		this.drawBall(this.gameState.ball2_coords, document.getElementById("game2").getContext("2d"));
	}

	async movePlayer(sleepTime) {
		const now = Date.now();
		if (now - this.lastMoveTime < this.moveCooldown) return;
		
		const moveData = {};
		if (this.keys["ArrowLeft"] || this.keys["ArrowRight"]) {
			const moveValue = this.keys["ArrowLeft"] ? -19 : 19;
	
			if (this.currentPlayer === 1) {
				moveData.player1_coords = { x1: moveValue };			
			} else if (this.currentPlayer === 2) {
				moveData.player2_coords = { x1: moveValue };
			}
		}
		 // N'envoyer que si on a des données à envoyer
		if (Object.keys(moveData).length > 0 && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify({
				type: "move_player",
				move: moveData
			}));
		}
		this.lastMoveTime = now;
	}

	async launchAnim(data) {
		if (data.number) this.currentPlayer = data.number;
		if (data.player1_coords) this.gameState.player1_coords = data.player1_coords;
		if (data.player2_coords) this.gameState.player2_coords = data.player2_coords;
		if (data.ball_p1) this.gameState.ball1_coords = data.ball_p1;
		if (data.ball_p2) this.gameState.ball2_coords = data.ball_p2;
		if (data.scores) this.gameState.scores = data.scores;
		if (data.blocks_p1) this.gameState.blocks_p1 = data.blocks_p1;
		if (data.blocks_p2) this.gameState.blocks_p2 = data.blocks_p2;
		if (data.time && data.time != 0) this.gameState.timeLeft = Math.floor(60 - data.time.toPrecision(2));
	
		// this.updateFPS();
		await this.movePlayer(data.sleepTime);
		this.compteur++;
		document.getElementById("game1").getContext("2d").clearRect(0, 0, document.getElementById("game1").width, document.getElementById("game1").height);
		document.getElementById("game2").getContext("2d").clearRect(0, 0, document.getElementById("game2").width, document.getElementById("game2").height);
		this.updateDrawing();

		if (this.gameState.scores && this.gameState.timeLeft) {
			document.getElementById("title1").innerText = this.gameState.scores.p1;
			document.getElementById("title2").innerText = this.gameState.scores.p2;

			if (this.gameState.timeLeft <= 0) {
				if (this.gameState.scores.p1 > this.gameState.scores.p2)
					this.winnerWindow(1, false);
				else if (this.gameState.scores.p2 > this.gameState.scores.p1)
					this.winnerWindow(2, false);
				else
					this.winnerWindow(0, false);
			}
		}
		document.getElementById("timer").textContent = "Time left: " + this.gameState.timeLeft + "s";
	}

	countdownBeforeGame(data) {
		document.getElementById("overlay1").style.display = 'flex';
		document.getElementById("overlay2").style.display = 'flex';
		document.getElementById("countdown1").innerText = data.message;
		document.getElementById("countdown2").innerText = data.message;
	}

	winnerWindow(player, deco) {
		document.getElementById("game1").getContext("2d").clearRect(0, 0, document.getElementById("game1").width, document.getElementById("game1").height);
		document.getElementById("game2").getContext("2d").clearRect(0, 0, document.getElementById("game2").width, document.getElementById("game2").height);

		if (player == 0) {
			this.drawOuterRectangle("#C42021", "#C42021");
		}
	
		else if (player == 1) {
			this.drawOuterRectangle("#365fa0", "#C42021");
			document.getElementById("gameOverP1").innerText = "You won !!!";
			document.getElementById("gameOverP1").style.color = "#365fa0";
			document.getElementById("replay-button-p1").style.color = "#365fa0";
		}
		else {
			this.drawOuterRectangle("#C42021", "#365fa0");
			document.getElementById("gameOverP2").innerText = "You won !!!";
			document.getElementById("gameOverP2").style.color = "#365fa0";
			document.getElementById("replay-button-p2").style.color = "#365fa0";
		}
	
		this.drawInnerRectangle("#23232e");
		document.getElementById("gameOverP1").style.display = "flex";
		document.getElementById("gameOverP2").style.display = "flex";

		if (!deco) {
			if (this.currentPlayer == 1) {
				document.getElementById("replay-button-p1").style.display = "flex";
				document.getElementById("replay-button-p1").addEventListener("click", () => {
					this.resetGame();
				});
			}
			else {
				document.getElementById("replay-button-p2").style.display = "flex";
				document.getElementById("replay-button-p2").addEventListener("click", () => {
					this.resetGame();
				});
			}
		}
	}

	resetGame() {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify({type: "restart_game"}));
		} else {
			console.log("Echec");
		}
	}

	restartGame() {
		document.getElementById("game1").getContext("2d").clearRect(0, 0, document.getElementById("game1").width, document.getElementById("game1").height);
		document.getElementById("game2").getContext("2d").clearRect(0, 0, document.getElementById("game2").width, document.getElementById("game2").height);
	
		if (document.getElementById("disconnected").style.display === "block") {
			document.getElementById("disconnected").style.display = "none"; 
		}
	
		document.getElementById("replay-button-p1").style.display = "none";
		document.getElementById("replay-button-p2").style.display = "none";
		document.getElementById("gameOverP1").style.display = "none";
		document.getElementById("gameOverP2").style.display = "none";

		this.initState();
	}

	closeSocket() {
		if (this.socket && this.socket.readyState == WebSocket.OPEN) {
			console.log('close 4');
			this.socket.close();

			window.removeEventListener('keydown', this.keyHandler);
			window.removeEventListener('keyup', this.keyHandler);

			CasseBriqueDistantGame.currentGame = null;
		}
	}
}