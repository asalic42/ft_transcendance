// Variables
let mapTab = [];
let compteur = 0;
var selectedMap;

var	player1 = document.getElementById("player1");
var	player2 = document.getElementById("player2");
var table1 = document.getElementById("game1");
var table2 = document.getElementById("game2");
var context1 = table1.getContext("2d");
var context2 = table2.getContext("2d");

var fps = document.getElementById("fps");
var canvas1 = document.getElementById("canvas-1");
var canvas2 = document.getElementById("canvas-2");
var playername1 = document.getElementById("playername1");
var playername2 = document.getElementById("playername2");
var score1 = document.getElementById("title1");
var score2 = document.getElementById("title2");
var gameOverP1 = document.getElementById("gameOverP1");
var gameOverP2 = document.getElementById("gameOverP2");
var overlay1 = document.getElementById("overlay1");
var overlay2 = document.getElementById("overlay2");
var disconnected = document.getElementById("disconnected");
var timer = document.getElementById("timer");
var buttonP1 = document.getElementById("replay-button-p1");
var buttonP2 = document.getElementById("replay-button-p2");
var countdown1 = document.getElementById("countdown1");
var countdown2 = document.getElementById("countdown2");

let keys = {};
let currentPlayer = null;
let gameState = {
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
let start;

// WebSocket concerns

const socket = new WebSocket(`wss://transcendance.42.paris/ws/casse-brique/${game_id}/${map_id}`);

socket.onopen = function () {
	console.log("Connexion au Socket !");
};

start = Date.now();

socket.onmessage = function(event) {
	const data = JSON.parse(event.data);
	console.log(`Message : ${data.type}`)

	if (data.type == "countdown") {
		countdownBeforeGame(data);
	}
	else if (data.type == "players_name") {
		if (data.player1_name) playername1.innerText = data.player1_name;
		if (data.player2_name) playername2.innerText = data.player2_name;
	}
	else if (data.type == "game_over") {
		winnerWindow(data.winner);
	}
	if (data.type == "game_won") {
        if (data.disconnected) {
            disconnected.style.display = "block"; // Affiche le message de déconnexion
            winnerWindow(data.loser);
        } else {
            winnerWindow(data.loser);
        }
    }

	else if (data.type == "game_restarted")
		game_restarted(data);

	if (data.type === "game_start") {
		player1.style.display = 'flex';
		player2.style.display = 'flex';
		canvas1.style.display = 'flex';
		canvas2.style.display = 'flex';
		fps.style.display = 'flex';
	}

	if (data.type === "game_state") {
		// Stocker la map si elle est présente dans les données
		if (data.mapData) {
			mapTab = data.mapData;
			console.log("Map received from server:", mapTab);
		}
		
		overlay1.style.display = 'none';
		overlay2.style.display = 'none';
		timer.style.display = 'flex';
		launchAnim(data);
	}
	if (data.type === "close_connection") {
		alert(data.message);
		socket.close();
		window.location.reload(); // Rafraîchit la page pour revenir au lobby
	}
};
socket.onerror = function(error) {
	console.log("Erreur socket: ", error);
};

socket.onclose = function() {
	console.log("Deconnexion du Socket...");
}

//! Players related stuff
function movePlayer() {
	const moveData = {};
	if (keys["ArrowLeft"] || keys["ArrowRight"]) {
		const moveValue = keys["ArrowLeft"] ? -10 : 10;

		if (currentPlayer === 1) {
			moveData.player1_coords = { x1: moveValue };			
		} else if (currentPlayer === 2) {
			moveData.player2_coords = { x1: moveValue };
		}
	}
	 // N'envoyer que si on a des données à envoyer
	if (Object.keys(moveData).length > 0 && socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify({
			type: "move_player",
			move: moveData
		}));
	}
}

function drawPlayer(player1Coords, player2Coords) {
	if (!player1Coords || !player2Coords) return;

	context1.beginPath();
	context1.fillStyle = "#ED4EB0";
	context1.roundRect(player1Coords.x1, player1Coords.y1, 120, player1Coords.y2 - player1Coords.y1, 7);
	context1.fill();
	context1.closePath();

	context2.beginPath();
	context2.fillStyle = "#ED4EB0";
	context2.roundRect(player2Coords.x1, player2Coords.y1, 120, player2Coords.y2 - player2Coords.y1, 7);
	context2.fill();
	context2.closePath();
}

//! Ball
function drawBall(ball, context) {

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

// Remise a 0 pour une nouvelle game
function game_restarted(data) {
	console.log("je suis la !");
	context1.clearRect(0, 0, table1.width, table1.height);
	context2.clearRect(0, 0, table2.width, table2.height);

	if (disconnected.style.display === "block") {
		disconnected.style.display = "none"; 
	}

	buttonP1.style.display = "none";
	buttonP2.style.display = "none";
	gameOverP1.style.display = "none";
	gameOverP2.style.display = "none";

	if (data.number) currentPlayer = data.number;
	if (data.player1_coords) gameState.player1_coords = data.player1_coords;
	if (data.player2_coords) gameState.player2_coords = data.player2_coords;
	if (data.ball_p1) gameState.ball1_coords = data.ball_p1;
	if (data.ball_p2) gameState.ball2_coords = data.ball_p2;
	if (data.scores) gameState.scores = data.scores;
	if (data.blocks_p1) gameState.blocks_p1 = data.blocks_p1;
	if (data.blocks_p2) gameState.blocks_p2 = data.blocks_p2;
	if (data.time != 0) gameState.timeLeft = data.time;

	keys = {};
	score1.innerText = 0;
	score2.innerText = 0;
}

//! Loop func
let id=0;
function launchAnim(data) {

	// console.log("je suis ici !!");
	// console.log("gameState.scores before: ", gameState.scores);

	if (data.number) currentPlayer = data.number;
	if (data.player1_coords) gameState.player1_coords = data.player1_coords;
	if (data.player2_coords) gameState.player2_coords = data.player2_coords;
	if (data.ball_p1) gameState.ball1_coords = data.ball_p1;
	if (data.ball_p2) gameState.ball2_coords = data.ball_p2;
	if (data.scores) gameState.scores = data.scores;
	if (data.blocks_p1) gameState.blocks_p1 = data.blocks_p1;
	if (data.blocks_p2) gameState.blocks_p2 = data.blocks_p2;
	if (data.time != 0) gameState.timeLeft = 60 - data.time.toPrecision(2);

	// console.log("gameState.scores AFTER: ", gameState.scores);
	requestAnimationFrame(() => {

		movePlayer();
		compteur++;
		context1.clearRect(0, 0, table1.width, table1.height);
		context2.clearRect(0, 0, table2.width, table2.height);
		updateDrawing(gameState);

		// if (gameState.scores) {
			// score1.innerText = gameState.scores.p1;
			// score2.innerText = gameState.scores.p2;

			// if (gameState.scores.p1 >= 10 && gameState.scores.p1 == gameState.scores.p2)
				// winnerWindow(0);
			// if (gameState.scores.p1 >= 10)
				// winnerWindow(1);
			// else if (gameState.scores.p2 >= 10)
				// winnerWindow(2);
		// }
		timer.textContent = "Time left: " + gameState.timeLeft + "s";
	})
}

async function winnerWindow(player) {
	context1.clearRect(0, 0, table1.width, table1.height);
	context2.clearRect(0, 0, table2.width, table2.height);

	if (player == 0) {
		drawOuterRectangle("#C42021", "#C42021");
	}

	else if (player == 1) {
		drawOuterRectangle("#365fa0", "#C42021");
		gameOverP1.innerText = "You won !!!";
		gameOverP1.style.color = "#365fa0";
		buttonP1.style.color = "#365fa0";
	}
	else {
		drawOuterRectangle("#C42021", "#365fa0");
		gameOverP2.innerText = "You won !!!";
		gameOverP2.style.color = "#365fa0";
		buttonP2.style.color = "#365fa0";
	}

	drawInnerRectangle("#23232e");
	gameOverP1.style.display = "flex";
	gameOverP2.style.display = "flex";
	if (currentPlayer == 1) {
		buttonP1.style.display = "flex";
		buttonP1.addEventListener("click", resetGame);
	}
	else {
		buttonP2.style.display = "flex";
		buttonP2.addEventListener("click", resetGame);
	}
}

function resetGame() {
	if (socket.readyState === WebSocket.OPEN) {
		console.log("Demande de reset du jeu");
		socket.send(JSON.stringify({type: "restart_game"}));
	} else {
		console.log("Echec");
	}
}

//! Tools
function getRandomArbitrary(min, max) {
	var result = Math.random() * (max - min) + min;
	if (result >= -8 && result <= 8)
		return getRandomArbitrary(min, max);
	return result;
}

function drawBlocks(context, blocks) {
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

function drawOuterRectangle(color_p1, color_p2) {
	context1.fillStyle = color_p1;
	context1.beginPath();
	context1.roundRect(0, 0, table1.width, table1.height, 10);
	context1.fill();
	context1.closePath();

	if (gameState.blocks_p2) {
		context2.fillStyle = color_p2;
		context2.beginPath();
		context2.roundRect(0, 0, table2.width, table2.height, 10);
		context2.fill();
		context2.closePath();
	}
}

function drawInnerRectangle(color) {
	context1.fillStyle = color;
	context1.beginPath();
	context1.roundRect(5, 5, table1.width - 10, table1.height - 10, 8);
	context1.fill();
	context1.closePath();

	context2.fillStyle = color;
	context2.beginPath();
	context2.roundRect(5, 5, table2.width - 10, table2.height - 10, 8);
	context2.fill();
	context2.closePath();
}

window.addEventListener("keydown", (event) => {
	keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
	keys[event.key] = false;
});

function updateDrawing(gameState) {
	drawOuterRectangle("#ED4EB0", "#ED4EB0");
	drawInnerRectangle("#23232e");

	drawPlayer(gameState.player1_coords, gameState.player2_coords);
	drawBlocks(context1, gameState.blocks_p1);
	drawBlocks(context2, gameState.blocks_p2);
	drawBall(gameState.ball1_coords, context1);
	drawBall(gameState.ball2_coords, context2);
}

function countdownBeforeGame(data) {
	overlay1.style.display = 'flex';
	overlay2.style.display = 'flex';
	countdown1.innerText = data.message;
	countdown2.innerText = data.message;
}

let frames = 0;
let lastTime = performance.now();
let fpsElement = document.getElementById('fps');
let avgFpsElement = document.getElementById('avg-fps');
let fpsHistory = [];

function updateFPS() {
    const now = performance.now();
    const delta = now - lastTime;
    const fps = Math.round(1000 / delta);
    
    fpsHistory.push(fps);
    if (fpsHistory.length > 60) { // Garder l'historique des 60 dernières valeurs
        fpsHistory.shift();
    }
    
    const avgFps = Math.round(fpsHistory.reduce((a, b) => a + b) / fpsHistory.length);
    
    fpsElement.textContent = `Fps : ${fps} | Avg Fps : ${avgFps}`;
    lastTime = now;
    
    // requestAnimationFrame(updateFPS);
}

const interval = setInterval(function() {
	updateFPS()
}, 1000);
 

requestAnimationFrame(updateFPS);
