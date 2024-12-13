// Variables
var table;
var context;
var game = document.getElementById("game");
let stop = 0;
var frameTime = {counter : 0, time : 0};
var totalframeTime = {counter : 0, time : 0};
let percentage = 0;
var score = document.getElementById("title");
var gameOver = document.getElementById("gameOver");
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

var block_arr = []
//! Init
function createBlocks() {
	var start_x = table.width / 7;
	var start_y = table.height / 20;
	var x = start_x
	var y = start_y;
	var width = start_x;
	var height = start_y;
	for (var i = 0; i < 5; i++) {
		for (var j = 0; j < 8; j++) {
			block_arr.push(new block(x, y + start_y + start_y, width, height, 3))
			y += start_y;
		}
		x += start_x;
		y = start_y;
	}
}
window.onload = function() {
	table = document.getElementById("game");
	context = table.getContext("2d");

	createBlocks();
	createBall(Math.floor(getRandomArbitrary(-11, 11)));
}

function createBall(vy) {
	// Balls coords
	var ball = {coords : {x : (table.height / 2), y : table.height - 70},
				const_vector : {vy : vy, vx : Math.floor(getRandomArbitrary(-11, 11))},
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
	if (!stop && isBallHittingPlayer(ball, player1Coords)) {
		var intersection = ((player1Coords.x1 + 60 - ball.coords.x) / -60);
		if (intersection > 0 && intersection < 0.25)
			intersection = 0.25;
		else if (intersection > 1)
			intersection = 1;
		else if (intersection < -1)
			intersection = -1;
		else if (intersection < 0 && intersection > -0.25)
			intersection = -0.25;
		console.log(intersection);
		intersection *= Math.abs(ball.const_vector.vy);
		console.log(intersection);
		ball.const_vector.vx = intersection;
		ball.vector.vx = ball.const_vector.vx;
		ball.const_vector.vy = -(ball.const_vector.vy);
		ball.vector.vy = -ball.vector.vy;
	}
	else if (isGameOver())
		return true;

	isBallHittingWall(ball);
	isBallHittingblock(ball);
	ball.coords.x += ball.vector.vx;
	ball.coords.y += ball.vector.vy;

	drawBall(ball);
}

function isBallHittingblock(ball) {
	// if (ball.hit_block) {
		// ball.hit_block--;
		// return
	// }
	for (let k = 0; k < block_arr.length; k++) {
		if (!block_arr[k].state)
			continue;
		var ballFutureX = ball.coords.x + ball.const_vector.vx;
		var ballFutureY = ball.coords.y + ball.const_vector.vy;
		if (ballFutureX + ball.radius >= block_arr[k].x1 &&
			ballFutureX - ball.radius <= block_arr[k].x1 + block_arr[k].width &&
			ballFutureY - ball.radius >= block_arr[k].y1 &&
			ballFutureY + ball.radius <= block_arr[k].y1 + block_arr[k].height) {
				count += Math.abs(4 - block_arr[k].state);
				block_arr[k].state-- ;
				console.log(ball.coords.y + " " + block_arr[k].y1 + " " + (block_arr[k].y1 + block_arr[k].height));
				if (ball.coords.x + ball.radius > block_arr[k].x1 && ball.coords.x - ball.radius < block_arr[k].x1 + block_arr[k].width) {
					ball.const_vector.vy = -ball.const_vector.vy;
					ball.vector.vy = ball.const_vector.vy;
				}
				else if (ball.coords.y + ball.radius > block_arr[k].y1 && ball.coords.y - ball.radius < block_arr[k].y1 + block_arr[k].height){
					
					ball.const_vector.vx = -(ball.const_vector.vx);
					ball.vector.vx = -ball.vector.vx;
				}
				ball.hit_block = 2;
				break;
			}
	}
}


function isGameOver() {
	if (health <= 0) { //! Change back to <= 0
		console.log("No more health");
		winnerWindow();
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

function launchAnim(ball, player1Coords, start) {

	timeRelatedStuff(ball, start);
	adaptVectorsToFps(ball, player1Coords);
	start = Date.now();
	if (stop)
		return;
	context.clearRect(0, 0, table.width, table.height);
	update();
	drawPlayer(player1Coords, "#ED4EB0");
	if (isEnd(ball))
		return;
	drawBlocks();
	moveBall(ball, player1Coords);
	score.innerText = "Score : " + count;
	requestAnimationFrame(function () {launchAnim(ball, player1Coords, start);});
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

function winnerWindow() {
	
	context.clearRect(0, 0, table.width, table.height);
	
	gameOver.style.display = "flex";
	drawOuterRectangle("#C42021");
	drawInnerRectangle("#23232e");
	console.log("je suis passé chez sosh");
	replay();
}

function replay() {
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
				case 3:
					context.fillStyle = "green";
					break;
				case 2:
					context.fillStyle = "orange";
					break;
				case 1:
					context.fillStyle = "red";
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
