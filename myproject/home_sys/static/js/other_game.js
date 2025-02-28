const BALL_SPEED_INCREMENT = 0.075;
const BALL_INITIAL_SPEED = 9;

// Variables
let mapTab = [];
var table;
var context;
var canvasContainer = document.getElementById("canvas-container");
var frameTime = {counter : 0, time : 0};
var totalframeTime = {counter : 0, time : 0};
let percentage = 0;
var fps = document.getElementById("fps");
var	blocksDestroyed = 0;
var score = document.getElementById("title");
var gameOver = document.getElementById("gameOver");
const mapSelection = document.getElementById('mapSelection');
const game = document.querySelector('.game');
var count = 0;
var health = 1;

class block {
	x1; y1; width; height; state;
	constructor(x1, y1, width, height, state) {
		this.x1 = x1;
		this.y1 = y1;
		this.width = width;
		this.height = height;
		this.state = state;
	}
}
let cachedUserId = null;

//! Init
var selectedMap;
function initializeMapButtons() {
	const mapButtons = document.querySelectorAll('.mapButton[data-map-id]');
	console.log("initialized")
	mapButtons.forEach(button => {
		button.addEventListener('click', function() {
			const mapId = this.getAttribute('data-map-id');
			document.getElementById("map-choice").style.display = "none";
			selectedMap = parseInt(mapId);
			console.log(selectedMap);
			launch(selectedMap);
		});
	});
}
		
initializeMapButtons();

async function launch (idMap) {
	table = document.getElementById("game");
	context = table.getContext("2d");
	
	await fetchMap(idMap);
	// fps.style.display = 'flex';
	// title.style.display = 'flex';
	Array.from(document.getElementsByClassName("game")).forEach(element => element.style.display = 'flex');
	mapSelection.style.display ='none';

	createBlocks();
	createBall();
}
let block_arr = [];

function createBlocks() {
	var start_x = table.width / 8;
	var start_y = table.height / 24;
	var x = start_x - 5
	var y = start_y - 5;
	var width = start_x - 5;
	var height = start_y - 5;

	for (var i = 0; i < 6; i++) {
		for (var j = 0; j < 12; j++) {
			block_arr.push(new block(x, y + start_y + start_y, width, height, mapTab[j][i]))
			y += start_y;
		}
		x += start_x;
		y = start_y - 5;
	}
}

function createBall(vy) {
	// Balls coords
	var ball = {coords : {x : (table.height / 2), y : table.height - 70},
				const_vector : {vy : BALL_INITIAL_SPEED, vx : BALL_INITIAL_SPEED, speed: BALL_INITIAL_SPEED},
				vector : {},
				radius : 13,
				hit_horizontal : 0,
				hit_vertical : 0,
				hit_player : 0};

	ball.vector = { vx: ball.const_vector.vx, vy: ball.const_vector.vy, total : ball.const_vector.vy + ball.const_vector.vx};

	// Initials points player 1
	var player1Coords = {y1 : table.height - 50, x1 : (table.height / 2) - 60, y2 : table.height - 35, x2 : (table.height / 2) + 60, const_vx : 20, vx : 20};

	launchAnim(ball, player1Coords, Date.now());
	if (isGameOver())
		winnerWindow();
}

//! Players related stuff

function movePlayer(player1Coords) {

	if (keys["q"] && player1Coords.x1 - player1Coords.vx > 0) {
		player1Coords.x1 -= player1Coords.vx;
		player1Coords.x2 -= player1Coords.vx;
	}
	if (keys["d"] && player1Coords.x2 + player1Coords.vx < table.height) {
		player1Coords.x1 += player1Coords.vx;
		player1Coords.x2 += player1Coords.vx;
	}
}

function drawPlayer(player1Coords, color) {
	
	movePlayer(player1Coords);
	context.fillStyle = color;
	context.beginPath();
	context.roundRect(player1Coords.x1, player1Coords.y1, 120, player1Coords.y2 - player1Coords.y1, 7);
	context.fill();
	context.closePath();
}

function isBallHittingPlayer(ball, player1Coords) {

	if (ball.hit_player > 0 && ball.hit_player < 15) {
		ball.hit_player++;
		return false;
	}

	if (ball.hit_player >= 15)
		ball.hit_player = 0;

	if (ball.coords.x + ball.radius / 2 >= player1Coords.x1 && ball.coords.x - ball.radius / 2 <= player1Coords.x2 &&
			ball.coords.y + ball.radius >= player1Coords.y1 &&
			ball.coords.y + ball.radius <= player1Coords.y2) {
				ball.hit_player = 1;
				incrementBallSpeed(ball);
				return true;
			}

	return false;
}

var user_option = 2;
function rangeSlide(value) {
	document.getElementById('rangeValue').innerHTML = value;
	user_option = value;
}

//! Ball

function incrementBallSpeed(ball) {
	ball.const_vector.speed += BALL_SPEED_INCREMENT;
	const speedRatio = ball.const_vector.speed / Math.sqrt(ball.const_vector.vx ** 2 + ball.const_vector.vy ** 2);
	ball.const_vector.vx *= speedRatio;
	ball.const_vector.vy *= speedRatio;
	ball.vector.vx = ball.const_vector.vx;
	ball.vector.vy = ball.const_vector.vy;
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
	// Collision avec les murs gauche ou droit
	if ((ball.coords.x - ball.radius <= 0 || ball.coords.x + ball.radius >= table.width) && ball.hit_horizontal === 0) {
		ball.hit_horizontal = 1;
		ball.const_vector.vx = -ball.const_vector.vx;
		ball.vector.vx = ball.const_vector.vx;
		incrementBallSpeed(ball);

		// Ajuster la position pour que la balle ne colle pas au mur
		if (ball.coords.x - ball.radius <= 0) {
			ball.coords.x = ball.radius;
		} else if (ball.coords.x + ball.radius >= table.width) {
			ball.coords.x = table.width - ball.radius;
		}
	}

	// Collision avec le plafond
	if (ball.coords.y - ball.radius <= 0 && ball.hit_vertical === 0) {
		ball.hit_vertical = 1;
		ball.const_vector.vy = -ball.const_vector.vy;
		ball.vector.vy = ball.const_vector.vy;
		incrementBallSpeed(ball);

		// Ajuster la position pour que la balle ne colle pas au plafond
		ball.coords.y = ball.radius;
	}

	if (ball.hit_horizontal > 0) ball.hit_horizontal++;
	if (ball.hit_vertical > 0) ball.hit_vertical++;

	if (ball.hit_horizontal > 5) ball.hit_horizontal = 0;
	if (ball.hit_vertical > 5) ball.hit_vertical = 0;
}

function handlePlayerCollision(ball, player1Coords) {
	const intersection = ((player1Coords.x1 + 60 - ball.coords.x) / -60);
	ball.const_vector.vx = Math.max(-1, Math.min(1, intersection)) * Math.abs(ball.const_vector.vy);
	ball.const_vector.vy = -ball.const_vector.vy;
	incrementBallSpeed(ball);

	ball.vector.vx = ball.const_vector.vx;
	ball.vector.vy = ball.const_vector.vy;
}


function moveBall(ball, player1Coords) {
	const steps = 5; // Subdiviser le mouvement en étapes
	const stepX = ball.vector.vx / steps;
	const stepY = ball.vector.vy / steps;

	for (let i = 0; i < steps; i++) {
		ball.coords.x += stepX;
		ball.coords.y += stepY;

		if (isBallHittingPlayer(ball, player1Coords)) {
			handlePlayerCollision(ball, player1Coords);
		}

		isBallHittingWall(ball);
		isBallHittingblock(ball);
	}

	drawBall(ball);
}

function isBallHittingblock(ball) {
	for (let k = 0; k < block_arr.length; k++) {
		if (!block_arr[k].state) continue;

		// Calcul des coordonnées futures de la balle
		var ballFutureX = ball.coords.x + ball.const_vector.vx;
		var ballFutureY = ball.coords.y + ball.const_vector.vy;

		if (((ballFutureX + ball.radius >= block_arr[k].x1 && ballFutureX - ball.radius <= block_arr[k].x1 + block_arr[k].width)) &&
			((ballFutureY + ball.radius >= block_arr[k].y1 && ballFutureY - ball.radius <= block_arr[k].y1 + block_arr[k].height))) {

			const hitLeftOrRight = ball.coords.x <= block_arr[k].x1 || ball.coords.x >= block_arr[k].x1 + block_arr[k].width;
			const hitTopOrBottom = ball.coords.y <= block_arr[k].y1 || ball.coords.y >= block_arr[k].y1 + block_arr[k].height;

			if (hitLeftOrRight && hitTopOrBottom) {
				// Collision sur un coin
				ball.const_vector.vx = -ball.const_vector.vx;
				ball.const_vector.vy = -ball.const_vector.vy;
			} else if (hitLeftOrRight) {
				// Collision sur les côtés gauche/droite
				ball.const_vector.vx = -ball.const_vector.vx;
				// Ajuster la position
				if (ball.coords.x <= block_arr[k].x1) {
					ball.coords.x = block_arr[k].x1 - ball.radius;
				} else {
					ball.coords.x = block_arr[k].x1 + block_arr[k].width + ball.radius;
				}
			} else if (hitTopOrBottom) {
				// Collision sur les côtés haut/bas
				ball.const_vector.vy = -ball.const_vector.vy;
				// Ajuster la position
				if (ball.coords.y <= block_arr[k].y1) {
					ball.coords.y = block_arr[k].y1 - ball.radius;
				} else {
					ball.coords.y = block_arr[k].y1 + block_arr[k].height + ball.radius;
				}
			}

			ball.vector.vx = ball.const_vector.vx;
			ball.vector.vy = ball.const_vector.vy;

			incrementBallSpeed(ball);

			block_arr[k].state--;
			console.log(`block_arr[k].state ${block_arr[k].state}`);
			if (!block_arr[k].state) {
				blocksDestroyed++;
			}
			count += Math.abs(5 - block_arr[k].state);
			break;
		}
	}
}


function isGameOver() {
	if (blocksDestroyed == 73) {
		return true;
	}
	if (health <= 0) {
		return true;
	}
	return false;
}


function isEnd(ball) {
	if (blocksDestroyed == 72) {
		blocksDestroyed++;
		createBall(Math.floor(getRandomArbitrary(-11, 0)));
		return true;
	}
	if (ball.coords.y + ball.radius >= table.height) {
		health--;
		createBall(Math.floor(getRandomArbitrary(-11, 0)));
		return true;
	}
	return false;
}

//! Loop func
let id=0;
function launchAnim(ball, player1Coords, start) {
	timeRelatedStuff(ball, start);
	adaptVectorsToFps(ball, player1Coords);
	start = Date.now();
	context.clearRect(0, 0, table.width, table.height);
	
	update();
	drawPlayer(player1Coords, "#ED4EB0");
	if (isEnd(ball))
		return;
	drawBlocks();
	moveBall(ball, player1Coords);
	score.innerText = "Score : " + count;
	id = requestAnimationFrame(function () {launchAnim(ball, player1Coords, start);});
}

//! Fps related stuff

bot_time = -1;
function timeRelatedStuff(ball, start) {
	end = Date.now();
	let elapsedTime = end - start; // Temps réel pris par la frame
	frameTime.counter++;
	frameTime.time += elapsedTime;


	if (frameTime.time > 250) {
		totalframeTime.counter += frameTime.counter;
		totalframeTime.time += 250
		fps.innerText = "Fps : " + (frameTime.counter * 4) + " | Avg Fps : " + (totalframeTime.counter * (1000 / totalframeTime.time)).toPrecision(3);
		frameTime.counter = 0;
		frameTime.time = 0;
	}
	percentage = (elapsedTime / 16.66).toPrecision(5); // Percentage of the time the frame took to render, based of the time it SHOULD have taken to render
}

function adaptVectorsToFps(ball, player1Coords) {
	ball.vector.vx = ball.const_vector.vx * percentage;
	ball.vector.vy = ball.const_vector.vy * percentage;
	player1Coords.vx = player1Coords.const_vx * percentage;
}

async function winnerWindow() {
	console.log(winnerWindow);
	context.clearRect(0, 0, table.width, table.height);
	gameOver.style.display = "flex";
	drawOuterRectangle("#C42021");
	if (blocksDestroyed == 73) {
		drawOuterRectangle("#365FA0");
		gameOver.style.color = "#365FA0";
		gameOver.textContent = "Omg ! You won !";
		document.getElementById("replay-button").style.color = "#365FA0";
		console.log("You won, exterior.");
	}
	drawInnerRectangle("#23232e");

	cancelAnimationFrame(id);
	console.log("tourne en boucle");
	try {
		const playerId = await getCurrentPlayerId();
		if (!playerId) {
			console.error('Impossible de sauvegarder le score : utilisateur non connecté');
			showReplayButton();  // Au lieu de replay() directement
			return;
		}
		
		console.log(playerId, count);

		// Attendre que l'ajout du score soit terminé
		await addNewGame(playerId, count);
		
	} catch (error) {
		console.error('Erreur lors de la sauvegarde du score:', error);
	}
	showReplayButton();
}

// Séparer l'affichage du bouton replay de son action
function showReplayButton() {
	const button = document.getElementById("replay-button");
	button.style.display = "flex";
	// button.style.color = "#C42021";
	button.addEventListener("click", () => {
		window.location.reload();
	});
}


//! Tools
function getRandomArbitrary(min, max) {
	var result = Math.random() * (max - min) + min;
	if (result >= -8 && result <= 8)
		return getRandomArbitrary(min, max);
	return result;
}

function drawBlocks() {
	for (let k = 0; k < block_arr.length; k++) {
		if (block_arr[k].state) {
			context.beginPath();
			switch (block_arr[k].state) {
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
			context.roundRect(block_arr[k].x1, block_arr[k].y1, block_arr[k].width, block_arr[k].height, 10);
			context.fill();
		}
	}
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
}

//! API STUFF

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

async function addNewGame(id_player, score) {
	console.log("Appel de addnewgame");
	try {
		const response = await fetch('/accounts/api/add_solo_casse_brique/', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'X-CSRFToken': csrftoken,  // Use the function directly
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				id_player: id_player,
				id_map: selectedMap,
				score: score
			})
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
		}

		const result = await response.json();
		console.log('Nouveau jeu ajouté:', result);
	} catch (error) {
		console.error('Erreur:', error);
	}
}

async function fetchMap(mapId) {
	return fetch(`/accounts/api/map/${mapId}/`)
	.then(response => response.text())
	.then(mapData => {
		const mapLines = mapData.split('\n');
		mapLines.forEach(function (element) {
			mapTab.push(element.split('').map(x=>Number(x)));
			mapTab[mapTab.length - 1].forEach(function (number) {
				if (number == 0)
					blocksDestroyed++;
			});
		});
	})
	.catch(error => {
		console.error('Erreur lors de la récupération des données de la carte:', error);
	});
}