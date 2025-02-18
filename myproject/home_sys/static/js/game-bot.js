// Variables
var table;
var context;
var score_p1 = document.getElementById("scoreP1");
var score_p2 = document.getElementById("scoreP2");
var bounce = 0;
var game = document.getElementById("game");
var count_p1 = 0;
var count_p2 = 0;
let stop = 0;
var frameTime = {counter : 0, time : 0};
var totalframeTime = {counter : 0, time : 0};
let percentage = 0;
let cachedUserId = null;

//! Init

window.onload = function() {
	table = document.getElementById("game");
	context = table.getContext("2d");
}

function createBall(vx) {
	// Balls coords
	var ball = {coords : {x : table.width / 2, y : table.height / 2},
				const_vector : {vx : vx, vy : Math.floor(getRandomArbitrary(-11, 11))},
				vector : {},
				radius : 13,
				hit_vertical : 0,
				hit_player : 0};

	ball.vector = { vx: ball.const_vector.vx, vy: ball.const_vector.vy };

	// Initials points player 1
	var player1Coords = {x1 : 92, y1 : (table.height / 2) - 40, x2 : 100, y2 : (table.height / 2) + 40, const_vy : 20, vy : 20};

	// Initials points player 2
	var player2Coords = {x1 : table.width - 100, y1 : (table.height / 2) - 40, x2 : table.width - 92, y2 : (table.height / 2) + 40, const_vy : 20, vy : 20, ball_predicted_hit : 0};

	launchAnim(ball, player1Coords, player2Coords, Date.now());
	isGameOver();
}

//! Players related stuff

function movePlayer(player1Coords) {

	if (keys["z"] && player1Coords.y1 - player1Coords.vy > 0) {
		player1Coords.y1 -= player1Coords.vy;
		player1Coords.y2 -= player1Coords.vy;
	}
	if (keys["s"] && player1Coords.y2 + player1Coords.vy < table.height) {
		player1Coords.y1 += player1Coords.vy;
		player1Coords.y2 += player1Coords.vy;
	}
}

function moveBot(player2Coords) {
	if ((player2Coords.ball_predicted_hit > 10 || player2Coords.ball_predicted_hit < -10) &&
		player2Coords.y1 + player2Coords.vy > 0 && player2Coords.y2 + player2Coords.vy < table.height) {
		player2Coords.y1 += player2Coords.vy;
		player2Coords.y2 += player2Coords.vy;
		player2Coords.ball_predicted_hit -= player2Coords.vy;
	}
}

function drawPlayer(player1Coords, player2Coords, color) {
	
	movePlayer(player1Coords);
	moveBot(player2Coords);
	context.fillStyle = color;
	context.beginPath();
	context.roundRect(player1Coords.x1, player1Coords.y1, 5, 80, 10);
	context.roundRect(player2Coords.x1, player2Coords.y1, 5, 80, 10);
	context.fill();
	context.closePath();
}

function isBallHittingPlayer(ball, player1Coords, player2Coords) {

	if (ball.hit_player > 0 && ball.hit_player < 5) {// pendant les cinq prochaines frames impossible de rebondir sur les murs.
		ball.hit_player++;
		return false;
	}

	if (ball.hit_player >= 5)
		ball.hit_player = 0;

	if (ball.coords.x - ball.radius >= player1Coords.x1 && ball.coords.x - ball.radius <= player1Coords.x2 + Math.abs(ball.vector.vx * 1) &&
			ball.coords.y - ball.radius <= player1Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player1Coords.y1 - ball.radius / 2) {
				ball.hit_player = 1
				return true;
			}

	else if (ball.coords.x + ball.radius >= player2Coords.x1 - Math.abs(ball.vector.vx * 1) && ball.coords.x + ball.radius <= player2Coords.x2 &&
			ball.coords.y - ball.radius <= player2Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player2Coords.y1 - ball.radius / 2) {
				ball.hit_player = 1
				return true;
			}

	return false;
}

var user_option = 2;
function levelinput(value) {
	var form = document.getElementById('LevelForm');
	user_option = form.elements.levelfield.value;
	document.getElementById('page').style.display = 'none';
	document.getElementById('scores').style.display = 'flex';
	document.getElementById('fps').style.display = 'flex';
	document.getElementById('canvas-container').style.display = 'flex';
	createBall(Math.floor(getRandomArbitrary(-11, 11)));

}

//! Ball

function calculateBall(ball, player2Coords) {	
	var pg_option = 5 - user_option;
	var count = 0;

	cpy_x = ball.coords.x;
	cpy_y = ball.coords.y;
	cpy_vx = ball.const_vector.vx;
	cpy_vy = ball.const_vector.vy;
	while (cpy_x <= player2Coords.x1 && ++count < 2000) {
		if (cpy_y > 1080 - ball.radius || cpy_y < 0 + ball.radius)
			cpy_vy = -cpy_vy;
		if (cpy_x < 100 + ball.radius)
			cpy_vx = -cpy_vx;
		cpy_x += cpy_vx;
		cpy_y += cpy_vy;
		player2Coords.ball_predicted_hit.when++;
	}
	player2Coords.ball_predicted_hit = cpy_y - ((player2Coords.y1 + 40) + Math.floor(bot_getRandomArbitrary(pg_option * -10, pg_option * 10)));
	if ((player2Coords.ball_predicted_hit < 0 && player2Coords.const_vy > 0) || (player2Coords.ball_predicted_hit > 0 && player2Coords.const_vy < 0))
		player2Coords.const_vy = -player2Coords.const_vy ;
}

function drawBall(ball) {
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

function isBallHittingWall(ball) {
	if ((ball.coords.y - ball.radius <= 0 || ball.coords.y + ball.radius >= table.height) && !ball.hit_vertical) {
		ball.hit_vertical = 1;
		ball.vector.vy = -ball.vector.vy;
		ball.const_vector.vy = -ball.const_vector.vy;
	}
	else if (ball.hit_vertical) // pendant les quates prochaines frames impossible de rebondir sur les murs.
		ball.hit_vertical++;
	if (ball.hit_vertical >= 5)
		ball.hit_vertical = 0;

}

function moveBall(ball, player1Coords, player2Coords) {

	// Ball is hiting a player.
	if (!stop && isBallHittingPlayer(ball, player1Coords, player2Coords)) {
		bounce++;
		ball.const_vector.vx = -(ball.const_vector.vx);
		ball.vector.vx = -ball.vector.vx;
		if (ball.const_vector.vx < 0 && ball.const_vector.vx > -30)
			ball.const_vector.vx -= 1;
		else if (ball.const_vector.vx < 30)
			ball.const_vector.vx += 1;
	}

	isBallHittingWall(ball);
	ball.coords.x += ball.vector.vx;
	ball.coords.y += ball.vector.vy;

	drawBall(ball);
}

/* Function that detects whether a player has won a point or not */
function isPointWin(ball) {
    if (ball.radius + ball.coords.x >= table.width) {
        count_p1++;
        score_p1.innerText = count_p1;
        createBall(Math.floor(getRandomArbitrary(-10, 0)));
        return true;
    }
    else if (ball.coords.x - ball.radius <= 0) {
        count_p2++;
        score_p2.innerText = count_p2;
        createBall(Math.floor(getRandomArbitrary(0, 10)));
        return true;
    }
    return false;
}

//! Loop func
let id=0;
function launchAnim(ball, player1Coords, player2Coords, start) {

	timeRelatedStuff(ball, player2Coords, start);
	adaptVectorsToFps(ball, player1Coords, player2Coords);
	start = Date.now();
	if (stop)
		return;
	context.clearRect(0, 0, table.width, table.height);
	update();
	drawPlayer(player1Coords, player2Coords, "#ED4EB0");
	if (isPointWin(ball))
		return ;
	moveBall(ball, player1Coords, player2Coords);
	id = requestAnimationFrame(function () {launchAnim(ball, player1Coords, player2Coords, start);});
}

//! Fps related stuff

bot_time = -1;
function timeRelatedStuff(ball, player2Coords, start) {
	end = Date.now();
	let elapsedTime = end - start; // Temps réel pris par la frame
	frameTime.counter++;
	frameTime.time += elapsedTime;
	
	if (bot_time < 0 || end - bot_time >= 1000) {
		bot_time = Date.now()	
		calculateBall(ball, player2Coords);
	}

	if (frameTime.time > 250) {
		totalframeTime.counter += frameTime.counter;
		totalframeTime.time += 250
		fps.innerText = "Fps : " + (frameTime.counter * 4) + " | Avg Fps : " + (totalframeTime.counter * (1000 / totalframeTime.time)).toPrecision(3);
		frameTime.counter = 0;
		frameTime.time = 0;
	}
	percentage = (elapsedTime / 16.66).toPrecision(5); // Percentage of the time the frame took to render, based of the time it SHOULD have taken to render
}

function adaptVectorsToFps(ball, player1Coords, player2Coords) {
	ball.vector.vx = ball.const_vector.vx * percentage;
	ball.vector.vy = ball.const_vector.vy * percentage;
	player1Coords.vy = player1Coords.const_vy * percentage;
	player2Coords.vy = player2Coords.const_vy * percentage;
}

function isGameOver() {
	if (count_p1 == 5 || count_p2 == 5) {
        stop = 1;
        if (count_p1 == 5) {
            console.log("player 1 wins");
            winnerWindow(1);
        }
        else {
            console.log("player 2 wins");
            winnerWindow(2);
        }   
        return true;
    }
	return false
}

async function winnerWindow(player) {
	
	context.clearRect(0, 0, table.width, table.height);
	cancelAnimationFrame(id);

	const winner1Text = document.getElementById("wrapper-player1");
	const winner2Text = document.getElementById("wrapper-player2");
	
	try {
		const playerId = await getCurrentPlayerId();
		if (!playerId) {
			console.error('Impossible de sauvegarder le score : utilisateur non connecté');
			return;
		}
		console.log(playerId);

		// Attendre que l'ajout du score soit terminé
		await addNewGame(playerId);
		
		
	} catch (error) {
		console.error('Erreur lors de la sauvegarde du score:', error);
	}

	if (player == 1) {
		drawOuterRectangle("#365fa0");
		winner1Text.style.display = "block"; 
	}
	else {
		drawOuterRectangle("#C42021");
		winner2Text.style.display = "block";
	}
	drawInnerRectangle("#23232e");
	replay(player);
}

function replay(player) {
	const button = document.getElementById("replay-button");
	button.style.display = "block";

	if (player == 1)
		button.style.color = "#C42021";
	else
		button.style.color = "#365FA0";
	button.addEventListener("click", () => {
		window.location.reload();
	});
	
}

//! Tools
function bot_getRandomArbitrary(min, max) {
	var result = Math.random() * (max - min) + min;
	return result;
}

function getRandomArbitrary(min, max) {
	var result = Math.random() * (max - min) + min;
	if (result >= -9 && result <= 9)
		return getRandomArbitrary(min, max);
	return result;
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

const keys = {};

window.addEventListener("keydown", (event) => {
	keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
	keys[event.key] = false;
});

function update() {
	drawOuterRectangle("#ED4EB0");
	drawInnerRectangle("#23232e");

	context.fillStyle = '#ED4EB0';
	context.fillRect(table.width / 2, 0, 5, table.height);
}

async function getCurrentPlayerId() {
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

async function addNewGame(id_player) {
	console.log("Appel de addnewgame");
	try {
		const response = await fetch('/accounts/api/add_pong/', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'X-CSRFToken': getCookie('csrftoken'),  // Use the function directly
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({  // Convertit les données en JSON
				id_p1: id_player,
				id_p2: null,
				is_bot_game: true,
				score_p1: count_p1,
				score_p2: count_p2,
				difficulty: user_option,
				bounce_nb: bounce,
			})
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);		}

		const result = await response.json();
		console.log('Nouveau jeu ajouté:', result);
	} catch (error) {
		console.error('Erreur:', error);
	}
}
