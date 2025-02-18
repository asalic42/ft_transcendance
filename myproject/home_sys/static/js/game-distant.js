// Variables
var table = document.getElementById("game");
var	context = table.getContext("2d");
var score_p1 = document.getElementById("scoreP1");
var score_p2 = document.getElementById("scoreP2");
var player1_name = document.getElementById("title-p1");
var player2_name = document.getElementById("title-p2");
var text_win_p1 = document.getElementById("text-p1");
var text_win_p2 = document.getElementById("text-p2");
var fps = document.getElementById("fps");
var game = document.getElementById("game");
var disconnected = document.getElementById("disconnected");
var overlay = document.getElementById("overlay");
var countdown = document.getElementById("countdown");

var counter = 3;
var keys = {};                        // Players bars
let currentPlayer = null;
let gameState = {
	player1_coords: null,
	player2_coords: null,
	ball_coords: null,
	scores: {
		p1: 0,
		p2: 0
	}
};

// WebSocket concerns
const socket = new WebSocket(`wss://transcendance.42.paris/ws/pong/${gameId}/${id_t}`);

socket.onopen = function() {
	console.log("Connexion réussie au WebSocket");
}

let start = Date.now();
let compteur = 0;
socket.onmessage = function(event) {
	try {
		const data = JSON.parse(event.data);
		console.log(data.type);

		if (data.type == "countdown") {
			countdownBeforeGame(data);
		}
		else if (data.type == "game_won"){
			if (data.loser == 2)
				winnerWindow(1);
			else 
				winnerWindow(2);
			disconnected.style.display = "block";
		}
		
		else if (data.type == "game_restarted") {
			game_restarted(data);
		}

		else if (data.type == "players_name") {
			if (data.player1_name) {
				player1_name.innerText = data.player1_name;
				text_win_p1.textContent = player1_name.innerText + " wins !";
			} 
			
			if (data.player2_name) {
				player2_name.innerText = data.player2_name;
				text_win_p2.textContent = player2_name.innerText + " wins !";
			} 
				
		}

		else if (data.type == "game_state") {
			overlay.style.display = 'none';
			startGame(data);
		}
		else if (data.type == "game_error") {
			cancelAnimationFrame(animation_id);
			alert("Sorry, there has been a server side error. Please, change rooms.");
		}

    } catch (error) {
        console.error("Erreur de parsing des données du WebSocket :", error);
    }
};

socket.onclose = function() {
	console.log("Deconnexion du socket");
    alert("Game is full, or there has been an error.")
};

socket.onerror = function(error) {
    console.error("Erreur WebSocket:", error);
};
  
window.onload = function() {
    document.getElementById('scores').style.display = 'flex';
	document.getElementById('fps').style.display = 'flex';
	document.getElementById('canvas-container').style.display = 'flex';
}

var animation_id;

function startGame(data) {

	if (data.number) currentPlayer = data.number;
	if (data.player1_coords) gameState.player1_coords = data.player1_coords;
	if (data.player2_coords) gameState.player2_coords = data.player2_coords;
	if (data.ball_coords) gameState.ball_coords = data.ball_coords;
	if (data.scores) gameState.scores = data.scores;

	animation_id = requestAnimationFrame(() => {
		sendPlayerMove();
		compteur++;

		let end = Date.now();
		if (end - start > 1000) {
			fps.innerText = "Fps: " + compteur;
			compteur = 0;
			start = Date.now();
		}

		context.clearRect(0, 0, table.width, table.height);
		console.log('gameState : ' + gameState);
		update(gameState);
		
		if (gameState.scores) {
			score_p1.innerText = gameState.scores.p1;
			score_p2.innerText = gameState.scores.p2;

			if (gameState.scores.p1 >= 1) {
				winnerWindow(1);
			}
			else if (gameState.scores.p2 >= 1) {
				winnerWindow(2);
			}
		}
	})
}

function game_restarted(data) {
	context.clearRect(0, 0, table.width, table.height);
	if (disconnected.style.display === "block") {
		disconnected.style.display = "none"; 
	}
	const button = document.getElementById("replay-button");
    button.style.display = "none";
	const winner1Text = document.getElementById("wrapper-player1");
	const winner2Text = document.getElementById("wrapper-player2");

	winner1Text.style.display = "none";
	winner2Text.style.display = "none";
	if (gameState.scores.p1 >= 1) {
		drawOuterRectangle("#365fa0");
	}
	else {
		drawOuterRectangle("#C42021");
	}

	if (data.number) currentPlayer = data.number;
	if (data.player1_coords) gameState.player1_coords = data.player1_coords;
	if (data.player2_coords) gameState.player2_coords = data.player2_coords;
	if (data.ball_coords) gameState.ball_coords = data.ball_coords;
	if (data.scores) gameState.scores = data.scores;

	keys = {};
	score_p1.innerText = 0;
	score_p2.innerText = 0;
}

function countdownBeforeGame(data) {
	overlay.style.display = 'block';
	countdown.innerText = data.message;
}

function drawOuterRectangle(color) {
    context.fillStyle = color;
	context.beginPath();
	context.roundRect(0, 0, table.width, table.height, 10);
	context.fill();
	context.closePath();
}

function drawInnerRectangle(color) {
	context.fillStyle = color;
	context.beginPath();
	context.roundRect(5, 5, table.width - 10, table.height - 10, 8);
	context.fill();
    context.closePath();
}

function drawPlayer(player1Coords, player2Coords) {
	// console.log('player1Coords: ' + player1Coords);
	// console.log('player2Coords: ' + player2Coords);
	if (!player1Coords || !player2Coords) return;

	context.fillStyle = "#ED4EB0";
	context.beginPath();
	// console.log("player1Coords.x1 :" + player1Coords.x1 + " player1Coords.y1: " + player1Coords.y1);
	// console.log("player2Coords.x1 :" + player2Coords.x1 + " player2Coords.y1: " + player2Coords.y1);
	
	if (player1Coords) {
        context.roundRect(player1Coords.x1, player1Coords.y1, 5, 80, 10);
    }
    if (player2Coords) {
        context.roundRect(player2Coords.x1, player2Coords.y1, 5, 80, 10);
    }
	context.fill();
	context.closePath();
}

function drawBall(ball) {
	if (!ball) return; 

	context.beginPath();
    context.fillStyle = 'white';
    context.arc(ball.x, ball.y, 13, Math.PI * 2, false);
    context.fill();
    context.closePath();
	
	context.beginPath();
	context.fillStyle = "#23232e";
    context.arc(ball.x, ball.y, 13 - 2, Math.PI * 2, false);
    context.fill();
    context.stroke();
    context.closePath();
}

function update(gameState) {

	drawOuterRectangle("#ED4EB0");
	drawInnerRectangle("#23232e");

    context.fillStyle = '#ED4EB0';
    context.fillRect(table.width / 2, 0, 5, table.height);

	console.log('drawing player');
	drawPlayer(gameState.player1_coords, gameState.player2_coords);
	drawBall(gameState.ball_coords);
}

window.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

function sendPlayerMove() {
	const moveData = {};
	if (keys["ArrowUp"] || keys["ArrowDown"]) {
		const moveValue = keys["ArrowUp"] ? -10 : 10;

		if (currentPlayer === 1) {
			moveData.player1_coords = { y1: moveValue };			
		} else if (currentPlayer === 2) {
			moveData.player2_coords = { y1: moveValue };
		}
	}
	 // N'envoyer que si on a des données à envoyer
	if (Object.keys(moveData).length > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(moveData));
    }
}

async function winnerWindow(player) {
	
	context.clearRect(0, 0, table.width, table.height);
    
	const winner1Text = document.getElementById("wrapper-player1");
	const winner2Text = document.getElementById("wrapper-player2");

	winner1Text.style.display = 'none';
	winner2Text.style.display = 'none';
	if (player == 1) {
        drawOuterRectangle("#365fa0");
        winner1Text.style.display = "block";
    }
	else {
        drawOuterRectangle("#C42021");
		winner2Text.style.display = "block";
    }
    drawInnerRectangle("#23232e");
	await new Promise(r => setTimeout(r, 2000));
	if (id_t) {
		window.close();
	}
    newGame(player);
}

function newGame(player) {
    const button = document.getElementById("replay-button");
    button.style.display = "block";

	if (player == 1)
		button.style.color = "#C42021";
	else
		button.style.color = "#365FA0";

	button.addEventListener("click", resetGame);
}

function resetGame() {
	if (socket.readyState === WebSocket.OPEN) {
		console.log("Demande de reset du jeu");
		socket.send(JSON.stringify({action: "restart_game"}));
	} else {
		console.log("Echec");
	}
}