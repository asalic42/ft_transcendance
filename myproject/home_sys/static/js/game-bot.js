// Variables
var table;
var context;
var score_p1 = document.getElementById("scoreP1");
var score_p2 = document.getElementById("scoreP2");
var game = document.getElementById("game");
var count = 0;
let stop = 0;
var frameTime = {counter : 0, time : 0};
var totalframeTime = {counter : 0, time : 0};
let percentage = 0;

//! Init

window.onload = function() {
	table = document.getElementById("game");
	context = table.getContext("2d");

	createBall();
}

function createBall() {
	// Balls coords
	var ball = {coords : {x : table.width / 2, y : table.height / 2},
				const_vector : {vx : Math.floor(getRandomArbitrary(-14, 14)), vy : Math.floor(getRandomArbitrary(-14, 14))},
				vector : {},
				radius : 13,
				hit_vertical : 0,
				hit_player : 0};

	ball.vector = { vx: ball.const_vector.vx, vy: ball.const_vector.vy };

	// Initials points player 1
	var player1Coords = {x1 : 92, y1 : (table.height / 2) - 40, x2 : 100, y2 : (table.height / 2) + 40, const_vy : 25, vy : 25};

	// Initials points player 2
	var player2Coords = {x1 : table.width - 100, y1 : (table.height / 2) - 40, x2 : table.width - 92, y2 : (table.height / 2) + 40, const_vy : 25, vy : 25,
						ball_predicted_hit : {y : 0, when : 0, divider : 0}
	};

	launchAnim(ball, player1Coords, player2Coords, Date.now());
}

//! Players related stuff

function updatePlayers(player1Coords, player2Coords) {

	if (keys["z"] && player1Coords.y1 > 0) {
		player1Coords.y1 -= player1Coords.vy;
		player1Coords.y2 -= player1Coords.vy;
	}
	if (keys["s"] && player1Coords.y2 < table.height) {
		player1Coords.y1 += player1Coords.vy;
		player1Coords.y2 += player1Coords.vy;
	}
}

function move_bot(player2Coords) {
	if (player2Coords.ball_predicted_hit.when > 0 &&
		player2Coords.ball_predicted_hit.when < player2Coords.ball_predicted_hit.divider &&
		player2Coords.y1 + player2Coords.vy > 0 && player2Coords.y2 + player2Coords.vy < table.height) {
		player2Coords.y1 += player2Coords.vy;
		player2Coords.y2 += player2Coords.vy;
		player2Coords.ball_predicted_hit.when--;
	}
	else if (player2Coords.ball_predicted_hit.when > 0) {
		player2Coords.ball_predicted_hit.when--;
	}
}

function drawPlayer(player1Coords, player2Coords, color, ball) {
	
	updatePlayers(player1Coords, player2Coords);
	move_bot(player2Coords);
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

	if (ball.coords.x - ball.radius >= player1Coords.x1 && ball.coords.x - ball.radius <= player1Coords.x2 + Math.abs(ball.vector.vx * 1.2) &&
			ball.coords.y - ball.radius <= player1Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player1Coords.y1 - ball.radius / 2) {
				ball.hit_player = 1
				return true;
			}

	else if (ball.coords.x + ball.radius >= player2Coords.x1 - Math.abs(ball.vector.vx * 1.2) && ball.coords.x + ball.radius <= player2Coords.x2 &&
			ball.coords.y - ball.radius <= player2Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player2Coords.y1 - ball.radius / 2) {
				ball.hit_player = 1
				return true;
			}

	return false;
}

//! Ball

function calculate_ball(ball, player2Coords) {	
	if (ball.const_vector.vx > 0)	 {
		cpy_x = ball.coords.x;
		cpy_y = ball.coords.y;
		player2Coords.ball_predicted_hit.when = 0;
		while (cpy_x <= player2Coords.x1 && cpy_y < 1080 && cpy_y > 0 && player2Coords.ball_predicted_hit.when < 1000) {
			cpy_x += ball.const_vector.vx;
			cpy_y += ball.const_vector.vy;
			player2Coords.ball_predicted_hit.when++;
		}
		var diff = cpy_y - (player2Coords.y1 + 20);
		if ((diff < 0 && player2Coords.const_vy > 0) || (diff > 0 && player2Coords.const_vy < 0))
			player2Coords.const_vy = -player2Coords.const_vy ;
		player2Coords.ball_predicted_hit.divider = Math.abs(diff / player2Coords.const_vy) ;
		
		//console.log("diff = " + diff + " and const_vy = " + player2Coords.const_vy);
		//console.log("player2Coords.ball_predicted_hit.divider = " + player2Coords.ball_predicted_hit.divider);
		//console.log("ball will hit in " + player2Coords.ball_predicted_hit.when + " frames, at y = " + cpy_y);
	}
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
		console.log(ball.vector.vx);
		count++;
		ball.const_vector.vx = -(ball.const_vector.vx);
		ball.vector.vx = -ball.vector.vx;
		if (ball.const_vector.vx < 0 && ball.const_vector.vx > -30)
			ball.const_vector.vx -= 1;
		else if (ball.const_vector.vx < 30)
			ball.const_vector.vx += 1;
	}

	else if (isGameOver(ball))
		return true;

	isBallHittingWall(ball);
	ball.coords.x += ball.vector.vx;
	ball.coords.y += ball.vector.vy;

	drawBall(ball);
}

//! Loop func

function launchAnim(ball, player1Coords, player2Coords, start) {

	timeRelatedStuff(ball, player1Coords, player2Coords, start);
	adaptVectorsToFps(ball, player1Coords, player2Coords);
	start = Date.now();
	if (stop)
		return;
	context.clearRect(0, 0, table.width, table.height);
	update();
	drawPlayer(player1Coords, player2Coords, "#ED4EB0", ball);
	moveBall(ball, player1Coords, player2Coords);
	requestAnimationFrame(function () {launchAnim(ball, player1Coords, player2Coords, start);});
}

//! Fps related stuff

function timeRelatedStuff(ball, player1Coords, player2Coords, start) {
	end = Date.now();
	let elapsedTime = end - start; // Temps réel pris par la frame
	frameTime.counter++;
	frameTime.time += elapsedTime;
	
	if ((frameTime.time > 52 && frameTime.time > 72 ) || // faire que le bot s'actualise de cette manière va rendre son comportement hasardeux, donc humain.
		(frameTime.time > 115 && frameTime.time > 135 ) ||
		(frameTime.time > 178 && frameTime.time > 298 ) ||
		frameTime.time > 240)
		calculate_ball(ball, player2Coords);

	if (frameTime.time > 250) {
		totalframeTime.counter += frameTime.counter;
		totalframeTime.time += 250
		fps.innerText = "Fps : " + (frameTime.counter * 4) + " | Avg Fps : " + (totalframeTime.counter * (1000 / totalframeTime.time)).toPrecision(3);
		frameTime.counter = 0;
		frameTime.time = 0;
	}
	percentage = (elapsedTime / 16.66).toPrecision(5);
}

function adaptVectorsToFps(ball, player1Coords, player2Coords) {
	ball.vector.vx = ball.const_vector.vx * percentage;
	ball.vector.vy = ball.const_vector.vy * percentage;
	player1Coords.vy = player1Coords.const_vy * percentage;
	player2Coords.vy = player2Coords.const_vy * percentage;
}

function isGameOver(ball) {
	if (ball.radius + ball.coords.x >= table.width)
	{
		console.log("player 1 wins when ball was at y = " + ball.coords.y);
		winnerWindow(1);
		stop = 1;
		return true;
	}
	else if (ball.coords.x - ball.radius <= 0)
	{
		console.log("player 2 wins");
		winnerWindow(2);
		stop = 1;
		return true;
	}
	return false
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
function getRandomArbitrary(min, max) {
	var result = Math.random() * (max - min) + min;
	if (result >= -10 && result <= 10)
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
