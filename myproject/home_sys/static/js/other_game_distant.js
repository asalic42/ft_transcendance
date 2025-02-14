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
var gameOver = document.getElementById("gameOver");
var overlay1 = document.getElementById("overlay1");
var overlay2 = document.getElementById("overlay2");
var disconnected = document.getElementById("disconnected");
var timer = document.getElementById("timer");
var mapSelection = document.querySelector('.mapSelection');

const keys = {};
let currentPlayer = null;
let gameState = {
	player1_coords: null,
	player2_coords: null,
	ball1_coords: null,
	ball2_coords: null,
	blocks: null,
	scores: {
		p1: 0,
		p2: 0
	},
	timeLeft: 60
};
let start;

// WebSocket concerns
var socket;

function connectToWebSocket(selectedMap) {

	socket = new WebSocket("wss://transcendance.42.paris/ws/casse-brique/");
	
	socket.onopen = function () {
		console.log("Connexion au Socket !");

		if (selectedMap && mapTab) {
			console.log("je selectionne la map");
			socket.send(JSON.stringify({
				type: "map_selected",
				mapTab: mapTab,
				map: selectedMap
			}));
		}
	};

	start = Date.now();
	socket.onmessage = function(event) {
	    const data = JSON.parse(event.data);

		if (data.type == "countdown") {
			countdownBeforeGame(data);
		}
		else if (data.type == "players_name") {
			if (data.player1_name) playername1.innerText = data.player1_name;
			if (data.player2_name) playername2.innerText = data.player2_name;
		}
		else if (data.type == "game_over") {
			if (data.winner == 1)
				winnerWindow(1);
			else if (data.winner == 2)
				winnerWindow(2);
		}
		else if (data.type == "game_won") {
			if (data.loser == 1)
				winnerWindow(2);
			else if (data.loser == 2)
				winnerWindow(1);
			disconnected.style.display = "block";
		}

		// else if (data.type == "game_restarted")
			// game_restarted(data);

		else if (data.type == "game_state") {
			overlay1.style.display = 'none';
			overlay2.style.display = 'none';
			timer.style.display = 'flex';
	        launchAnim(data);
	    }
	};

	socket.onerror = function(error) {
	    console.log("Erreur socket: ", error);
	};

	socket.onclose = function() {
	    console.log("Deconnexion du Socket...");
	};

}

//! Init Map
mapSelection.addEventListener('click', (event) => {

	if (event.target.tagName === 'BUTTON') {
	  selectedMap = event.target.dataset.map;
	  console.log(selectedMap)
	  mapSelection.style.display ='none';

	  launch(selectedMap);
	}
})

async function launch(idMap) {
	await fetchMap(idMap);
	fps.style.display = 'flex';
	player1.style.display = 'flex';
	player2.style.display = 'flex';
	canvas1.style.display = 'flex';
	canvas2.style.display = 'flex';


	connectToWebSocket(idMap);
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

//! Loop func
let id=0;
function launchAnim(data) {

	if (data.number) currentPlayer = data.number;
	if (data.player1_coords) gameState.player1_coords = data.player1_coords;
	if (data.player2_coords) gameState.player2_coords = data.player2_coords;
	if (data.ball_p1) gameState.ball1_coords = data.ball_p1;
	if (data.ball_p2) gameState.ball2_coords = data.ball_p2;
	if (data.scores) gameState.scores = data.scores;
	if (data.blocks) gameState.blocks = data.blocks;
	if (data.time != 0) gameState.timeLeft = data.time;

	requestAnimationFrame(function () {

		movePlayer();
    	compteur++;
		let end = Date.now();
		if (end - start > 1000) {
			fps.innerText = "Fps: " + compteur;
			compteur = 0;
			start = Date.now();
		}
		context1.clearRect(0, 0, table1.width, table1.height);
		context2.clearRect(0, 0, table2.width, table2.height);
		updateDrawing();

		score1.innerText = gameState.scores.p1;
		score1.innerText = gameState.scores.p2;
		timer.textContent = "Time left: " + gameState.timeLeft + "s";
	})
}

async function winnerWindow(player) {
	context1.clearRect(0, 0, table1.width, table1.height);
	context2.clearRect(0, 0, table2.width, table2.height);
	gameOver.style.display = "flex";
	drawOuterRectangle("#C42021");
	drawInnerRectangle("#23232e");

	showReplayButton(player);
}

// Séparer l'affichage du bouton replay de son action
function showReplayButton(player) {
	const button = document.getElementById("replay-button");
	button.style.display = "flex";
	button.style.color = "#C42021";

	if (player == 1) {
		// afficher anim player 1
	}
	else {
		// afficher anim player 2
	}

	button.addEventListener("click", resetGame);
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

function drawBlocks(context) {
	if (!gameState.blocks) return ;

	for (let k = 0; k < gameState.blocks.length; k++) {
		if (gameState.blocks[k].state) {
			context.beginPath();
			switch (gameState.blocks[k].state) {
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
			context.roundRect(gameState.blocks[k].x, gameState.blocks[k].y, gameState.blocks[k].width, gameState.blocks[k].height, 7);
			context.fill();
		}
	}
}

function drawOuterRectangle(color) {
	context1.fillStyle = color;
	context1.beginPath();
	context1.roundRect(0, 0, table1.width, table1.height, 10);
	context1.fill();
	context1.closePath();

	context2.fillStyle = color;
	context2.beginPath();
	context2.roundRect(0, 0, table2.width, table2.height, 10);
	context2.fill();
	context2.closePath();

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

function updateDrawing() {
	drawOuterRectangle("#ED4EB0");
	drawInnerRectangle("#23232e");

    drawPlayer(gameState.player1_coords, gameState.player2_coords);
    drawBlocks(context1);
    drawBlocks(context2);
	drawBall(gameState.ball1_coords, context1);
	drawBall(gameState.ball2_coords, context2);
}

function countdownBeforeGame(data) {
	overlay1.style.display = 'flex';
	overlay2.style.display = 'flex';
	document.getElementById("countdown1").innerText = data.message;
	document.getElementById("countdown2").innerText = data.message;
}

function fetchMap(selectedMap) {
	return fetch(`/accounts/api/map/${selectedMap}/`)
	.then(response => response.text())
	.then(mapData => {
		const mapLines = mapData.split('\n');
		mapLines.forEach((element) => mapTab.push(element.split('').map(x=>Number(x))));
	})
	.catch(error => {
		console.error('Erreur lors de la récupération des données de la carte:', error);
	});
	
}