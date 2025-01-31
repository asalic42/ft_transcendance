// Variables
var table = document.getElementById("game");
var	context = table.getContext("2d");
var score_p1 = document.getElementById("scoreP1");
var score_p2 = document.getElementById("scoreP2");
var fps = document.getElementById("fps");
var game = document.getElementById("game");
var disconnected = document.getElementById("disconnected");
const keys = {};                        // Players bars
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
const socket = new WebSocket("wss://transcendance.42.paris/ws/pong/");

socket.onopen = function() {
	// console.log("Connexion réussie au WebSocket");
	// console.log("Socket State: " + socket.readyState); // Cela devrait afficher 1 pour ouvert
	// console.log("URL du WebSocket:", socket.url); // Affiche l'URL du WebSocket
}

let start = Date.now();
let compteur = 0;
socket.onmessage = function(event) {
	try {
        const data = JSON.parse(event.data);

		console.log("game type: ", data.type);
		if (data.type == "game_won"){
			console.log("loser = ", data.loser);
			if (data.loser == 2)
				winnerWindow(1);
			else 
				winnerWindow(2);
			disconnected.style.display = "block";
		}
		
		else if (data.type == "game_restarted") {
			// Clean and reset variables
			context.clearRect(0, 0, table.width, table.height);
			if (disconnected.style.display === "block") {
				disconnected.style.display = "none";
			}
			const button = document.getElementById("replay-button");
    		button.style.display = "none";
			const winner1Text = document.getElementById("wrapper-player1");
			const winner2Text = document.getElementById("wrapper-player2");

			if (gameState.scores.p1 >= 5) {
				drawOuterRectangle("#365fa0");
				winner1Text.style.display = "none";
			}
			else {
				drawOuterRectangle("#C42021");
				winner2Text.style.display = "none";
			}

			gameState = {
				player1_coords: null,
				player2_coords: null,
				ball_coords: null,
				scores: {
					p1: 0,
					p2: 0
				}
			};
			keys = {};
			currentPlayer = null;
			score_p1.innerText = 0;
			score_p2.innerText = 0;
		}

		if (data.number) {
			currentPlayer = data.number;
			// console.log("Vous etes le joueur numero ", currentPlayer);
		}

		if (data.player1_coords) gameState.player1_coords = data.player1_coords;
		if (data.player2_coords) gameState.player2_coords = data.player2_coords;
		if (data.ball_coords) gameState.ball_coords = data.ball_coords;
		if (data.scores) gameState.scores = data.scores;

		requestAnimationFrame(() => {
			sendPlayerMove();
			compteur++;

			let end = Date.now();
			if (end - start > 1000) {
				fps.innerText = "Fps: " + compteur;
				compteur = 0;
				start = Date.now();
			}

			context.clearRect(0, 0, table.width, table.height);
			update(gameState);
			
			if (gameState.scores) {
				score_p1.innerText = gameState.scores.p1;
				score_p2.innerText = gameState.scores.p2;
	
				// console.log(`Scores = ${gameState.scores.p1} || ${gameState.scores.p2}`)
				if (gameState.scores.p1 >= 5) {
					// console.log("P1 a gagne !");
					winnerWindow(1);
				}
				else if (gameState.scores.p2 >= 5) {
					// console.log("P2 a gagne !");
					winnerWindow(2);
				}
			}
	
		})

    } catch (error) {
        console.error("Erreur de parsing des données du WebSocket :", error);
    }
};

socket.onclose = function() {
	console.log("Deconnexion du socket");
};

socket.onerror = function(error) {
    console.error("Erreur WebSocket:", error);
    // console.log("Socket State: " + socket.readyState); // Cela peut être utile pour le débogage
	// console.log("URL du WebSocket:", socket.url); // Affiche l'URL du WebSocket
};
  
window.onload = function() {
    document.getElementById('scores').style.display = 'flex';
	document.getElementById('fps').style.display = 'flex';
	document.getElementById('canvas-container').style.display = 'flex';
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
	if (!player1Coords || !player2Coords) return;
	
	context.fillStyle = "#ED4EB0";
	context.beginPath();
	context.roundRect(player1Coords.x1, player1Coords.y1, 5, 80, 10);
	context.roundRect(player2Coords.x1, player2Coords.y1, 5, 80, 10);
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

	drawPlayer(gameState.player1_coords, gameState.player2_coords);

	drawBall(gameState.ball_coords);

    // console.log('Creating player...');
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

function winnerWindow(player) {
	
	context.clearRect(0, 0, table.width, table.height);
    
	const winner1Text = document.getElementById("wrapper-player1");
	const winner2Text = document.getElementById("wrapper-player2");
	if (player == 1) {
        drawOuterRectangle("#365fa0");
        winner1Text.style.display = "block";
    }
	else {
        drawOuterRectangle("#C42021");
		winner2Text.style.display = "block";
    }
    drawInnerRectangle("#23232e");
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
		socket.send(JSON.stringify({action: "restart_game"}));
		console.log("Demande de reset du jeu");
	} else {
		// console.log("Echec");
	}
}