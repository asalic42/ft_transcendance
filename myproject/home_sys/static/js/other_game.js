// Variables
let mapTab = [];
var table;
var context;
var canvasContainer = document.getElementById("canvas-container");
var frameTime = {counter : 0, time : 0};
var totalframeTime = {counter : 0, time : 0};
let percentage = 0;
var score = document.getElementById("title");
var fps = document.getElementById("fps");
var gameOver = document.getElementById("gameOver");
const gameSelection = document.querySelector('.game-selection');
const game = document.querySelector('.game');
var count = 0;
var health = 3;

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


gameSelection.addEventListener('click', (event) => {
	if (event.target.tagName === 'BUTTON') {
	  const selectedMap = event.target.dataset.map;
	  console.log(selectedMap)
	  launch(selectedMap);
	}
});

async function launch (idMap) {
	table = document.getElementById("game");
	context = table.getContext("2d");
	
	await fetchMatp(idMap);
	fps.style.display = 'flex';
	title.style.display = 'flex';
	canvasContainer.style.display = 'flex';
	gameSelection.style.display ='none';
	createBlocks();
	createBall(Math.floor(getRandomArbitrary(0, 11)));
}
let block_arr = [];

function createBlocks() {
	var start_x = table.width / 8;
	var start_y = table.height / 24;
	var x = start_x
	var y = start_y;
	var width = start_x;
	var height = start_y;

	console.log("maptab");
	console.log(mapTab);
	for (var i = 0; i < 6; i++) {
		for (var j = 0; j < 12; j++) {
			block_arr.push(new block(x, y + start_y + start_y, width, height, mapTab[j][i]))
			y += start_y;
		}
		x += start_x;
		y = start_y;
	}
}


function createBall(vy) {
	// Balls coords
	var ball = {coords : {x : (table.height / 2), y : table.height - 70},
				const_vector : {vy : vy, vx : 50},
				vector : {},
				radius : 13,
				hit_horizontal : 0,
				hit_vertical : 0,
				hit_block : 0,
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

	if (ball.hit_player > 0 && ball.hit_player < 15) {// pendant les cinq prochaines frames impossible de rebondir sur les murs.
		ball.hit_player++;
		return false;
	}

	if (ball.hit_player >= 15)
		ball.hit_player = 0;

	if (ball.coords.x - ball.radius >= player1Coords.x1 && ball.coords.x - ball.radius <= player1Coords.x2 &&
			ball.coords.y - ball.radius <= player1Coords.y1 - 7 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player1Coords.y1 - ball.radius / 2) {
				ball.hit_player = 1
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
	if ((ball.coords.x - ball.radius <= 0 || ball.coords.x + ball.radius >= table.height) && !ball.hit_horizontal) {
		ball.hit_horizontal = 1;
		ball.vector.vx = -ball.vector.vx;
		ball.const_vector.vx = -ball.const_vector.vx;
	}
	else if (ball.coords.y - ball.radius <= 0 && !ball.hit_vertical) {
		ball.hit_vertical = 1;
		ball.vector.vy = -ball.vector.vy;
		ball.const_vector.vy = -ball.const_vector.vy;
	}
	else if (ball.hit_horizontal) // pendant les quates prochaines frames impossible de rebondir sur les murs.
		ball.hit_horizontal++;
	
	else if (ball.hit_vertical) // pendant les quates prochaines frames impossible de rebondir sur les murs.
		ball.hit_vertical++;

	if (ball.hit_vertical >= 5)
		ball.hit_vertical = 0;
	if (ball.hit_horizontal >= 5)
		ball.hit_horizontal = 0;


}

function moveBall(ball, player1Coords) {

	// Ball is hiting a player.
	if (isBallHittingPlayer(ball, player1Coords)) {
		var intersection = ((player1Coords.x1 + 60 - ball.coords.x) / -60);
		if (intersection > 0 && intersection < 0.25)
			intersection = 0.25;
		else if (intersection > 1)
			intersection = 1;
		else if (intersection < -1)
			intersection = -1;
		else if (intersection < 0 && intersection > -0.25)
			intersection = -0.25;
		intersection *= Math.abs(ball.const_vector.vy);
		ball.const_vector.vx = intersection;
		ball.vector.vx = ball.const_vector.vx;
		ball.const_vector.vy = -(ball.const_vector.vy);
		ball.vector.vy = -ball.vector.vy;
	}
	isBallHittingWall(ball);
	isBallHittingblock(ball);
	ball.coords.x += ball.vector.vx;
	ball.coords.y += ball.vector.vy;

	drawBall(ball);
}

function isBallHittingblock(ball) {
	for (let k = 0; k < block_arr.length; k++) {
		if (!block_arr[k].state)
			continue;
		var ballFutureX = ball.coords.x + ball.vector.vx;
		var ballFutureY = ball.coords.y + ball.vector.vy;
		if (((ballFutureX + ball.radius >= block_arr[k].x1 && ballFutureX + ball.radius <= block_arr[k].x1 + block_arr[k].width ) || (ballFutureX - ball.radius >= block_arr[k].x1 && ballFutureX - ball.radius <= block_arr[k].x1 + block_arr[k].width ))
			&&
			((ballFutureY + ball.radius >= block_arr[k].y1 && ballFutureY + ball.radius <= block_arr[k].y1 + block_arr[k].height) || (ballFutureY - ball.radius >= block_arr[k].y1 && ballFutureY - ball.radius<= block_arr[k].y1 + block_arr[k].height)))
			{
				// console.log(ball.coords.y + " " + block_arr[k].y1 + " " + (block_arr[k].y1 + block_arr[k].height));
				if (ball.hit_block)
					break;
				//* Determines how ball is going to bounce
				if (ball.coords.x + ball.radius > block_arr[k].x1 && ball.coords.x - ball.radius < block_arr[k].x1 + block_arr[k].width) {
					ball.const_vector.vy = -ball.const_vector.vy;
					ball.vector.vy = ball.const_vector.vy;
				}
				else if (ball.coords.y + ball.radius > block_arr[k].y1 && ball.coords.y - ball.radius < block_arr[k].y1 + block_arr[k].height){
					
					ball.const_vector.vx = -(ball.const_vector.vx);
					ball.vector.vx = -ball.vector.vx;
				}
				ball.hit_block = 2;
				count += Math.abs(4 - block_arr[k].state); //* Add score 
				block_arr[k].state-- ; //* Change block color
				break;
			}
	}
	if (ball.hit_block > 0)
		ball.hit_block--;
}


function isGameOver() {
	if (health <= 0) {
		return true;
	}
	return false;
}


function isEnd(ball) {
	if (ball.coords.y + ball.radius >= table.height) {
		health--;
		createBall(Math.floor(getRandomArbitrary(0, 10)));
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
	context.clearRect(0, 0, table.width, table.height);
	gameOver.style.display = "flex";
	drawOuterRectangle("#C42021");
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
		
		var mapId = 1;
		console.log(playerId, count, mapId);

		// Attendre que l'ajout du score soit terminé
		await addNewGame(playerId, mapId, count);
		
		// Seulement après que le score est sauvegardé
		showReplayButton();
		
	} catch (error) {
		console.error('Erreur lors de la sauvegarde du score:', error);
		showReplayButton();
	}
}

// Séparer l'affichage du bouton replay de son action
function showReplayButton() {
	const button = document.getElementById("replay-button");
	button.style.display = "flex";
	button.style.color = "#C42021";
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
			context.roundRect(block_arr[k].x1, block_arr[k].y1, block_arr[k].width - 5, block_arr[k].height - 5, 10);
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
	console.log(cachedUserId);
	if (cachedUserId !== null) {
		return cachedUserId;
	}
	try {
		const response = await fetch('/account/api/current-user/', {
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

async function addNewGame(id_player, id_map, score) {
	console.log("Appel de addnewgame");
	try {
		const response = await fetch('/account/api/add_solo_casse_brique/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({  // Convertit les données en JSON
				id_player: id_player,
				id_map: id_map,
				score: score
			})
		});

		if (!response.ok) {
			throw new Error('Erreur lors de l\'ajout du jeu');
		}

		const result = await response.json();
		console.log('Nouveau jeu ajouté:', result);
	} catch (error) {
		console.error('Erreur:', error);
	}
}

function fetchMatp(mapId) {
	return fetch(`/account/api/map/${mapId}/`)
	.then(response => response.text())
	.then(mapData => {
		const mapLines = mapData.split('\n');
		mapLines.forEach((element) => mapTab.push(element.split('').map(x=>Number(x))));
		console.log(mapLines);  // Affiche la carte sous forme de tableau 2D
		
	})
	.catch(error => {
		console.error('Erreur lors de la récupération des données de la carte:', error);
	});
	
}