// Variables
var table;
var context;
var score = document.getElementById("score");
var fps = document.getElementById("fps");
var game = document.getElementById("game");
var count = 0;

function getRandomArbitrary(min, max) {
	var result = Math.random() * (max - min) + min;
	if (result >= -10 && result <= 10)
		return getRandomArbitrary(min, max);
	return result;
}
  
window.onload = function() {
    table = document.getElementById("game");
    context = table.getContext("2d");

	createBall();
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

function update() {

	drawOuterRectangle("#ED4EB0");
	drawInnerRectangle("#23232e");

    context.fillStyle = '#ED4EB0';
    context.fillRect(table.width / 2, 0, 5, table.height);

    console.log('Creating player...');
}

/* Players bars */
const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

function updatePlayers(player1Coords, player2Coords) {
    if (keys["z"] && player1Coords.y1 > 0) {
        player1Coords.y1 -= player1Coords.vy;
        player1Coords.y2 -= player1Coords.vy;
    }
    if (keys["s"] && player1Coords.y2 < table.height) {
        player1Coords.y1 += player1Coords.vy;
        player1Coords.y2 += player1Coords.vy;
    }
    if (keys["ArrowUp"] && player2Coords.y1 > 0) {
        player2Coords.y1 -= player2Coords.vy;
        player2Coords.y2 -= player2Coords.vy;
    }
    if (keys["ArrowDown"] && player2Coords.y2 < table.height) {
        player2Coords.y1 += player2Coords.vy;
        player2Coords.y2 += player2Coords.vy;
    }
}

function drawPlayer(player1Coords, player2Coords, color) {
	
	updatePlayers(player1Coords, player2Coords);
	context.fillStyle = color;
	context.beginPath();
	context.roundRect(player1Coords.x1, player1Coords.y1, 5, 80, 10);
	context.roundRect(player2Coords.x1, player2Coords.y1, 5, 80, 10);
	context.fill();
	context.closePath();
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
	var player2Coords = {x1 : table.width - 100, y1 : (table.height / 2) - 40, x2 : table.width - 92, y2 : (table.height / 2) + 40, const_vy : 25, vy : 25};
	launchAnim(ball, player1Coords, player2Coords, Date.now());
}

let stop = 0;
var frameTime = {counter : 0, time : 0};

function launchAnim(ball, player1Coords, player2Coords, start) {
    end = Date.now();
	let elapsedTime = end - start; // Temps réel pris par la frame
	frameTime.counter++;
	frameTime.time += elapsedTime;
	if (frameTime.time > 250) {
		fps.innerText = "Fps : " + (frameTime.counter * 4);
		frameTime.counter = 0;
		frameTime.time = 0;
	}

	let percentage = (elapsedTime / 16.66).toPrecision(5);
	ball.vector.vx = ball.const_vector.vx * percentage;
	ball.vector.vy = ball.const_vector.vy *percentage;
	player1Coords.vy = player1Coords.const_vy * percentage;
	player2Coords.vy = player2Coords.const_vy * percentage;
	start = Date.now();
	requestAnimationFrame(function () {
		if (stop)
			return;
        context.clearRect(0, 0, table.width, table.height);
        update();
        drawPlayer(player1Coords, player2Coords, "#ED4EB0");
        moveBall(ball, player1Coords, player2Coords);
        launchAnim(ball, player1Coords, player2Coords, start);
    });
    
}

function isBallHittingPlayer(ball, player1Coords, player2Coords) {

	if (ball.hit_player > 0 && ball.hit_player < 2) {// pendant les deux prochaines frames impossible de rebondir sur les murs.
		ball.hit_player++;
		return false;
	}
	if (ball.hit_player >= 2)
		ball.hit_player = 0;

    if (ball.coords.x - ball.radius >= player1Coords.x1 && ball.coords.x - ball.radius <= player1Coords.x2 + Math.abs(ball.vector.vx * 0.8) &&
			ball.coords.y - ball.radius <= player1Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player1Coords.y1 - ball.radius / 2) {
				ball.hit_player = 1
				return true;
			}

	else if (ball.coords.x + ball.radius >= player2Coords.x1 - Math.abs(ball.vector.vx * 0.8) && ball.coords.x + ball.radius <= player2Coords.x2 &&
			ball.coords.y - ball.radius <= player2Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player2Coords.y1 - ball.radius / 2) {
				ball.hit_player = 1
				return true;
			}

	return false;
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

function moveBall(ball, player1Coords, player2Coords) {

	// Conditions so that the ball bounces
    // from the edges

    if (!stop && isBallHittingPlayer(ball, player1Coords, player2Coords)) {
		console.log(ball.vector.vx);
		count++;
		score.innerText = "Score : " + count;
		ball.const_vector.vx = -(ball.const_vector.vx);
		ball.vector.vx = -ball.vector.vx;
		if (ball.const_vector.vx < 0 && ball.const_vector.vx > -30) {
			ball.vector.vx -= 1;
			ball.const_vector.vx -= 1;

		}
		else if (ball.const_vector.vx < 30) {
			ball.vector.vx += 1;
			ball.const_vector.vx += 1;

		}
	}

    else if (ball.radius + ball.coords.x >= table.width)
    {
        console.log("player 1 wins");
        winnerWindow(1);
        stop = 1;
        return;
    }
    else if (ball.coords.x - ball.radius <= 0)
    {
        console.log("player 2 wins");
        winnerWindow(2);
        stop = 1;
        return;
    }
	else if ((ball.coords.y - ball.radius <= 0 || ball.coords.y + ball.radius >= table.height) && !ball.hit_vertical) {
		ball.hit_vertical = 1
        ball.vector.vy = -ball.vector.vy;
		ball.const_vector.vy = -ball.const_vector.vy;
	}
	if (ball.hit_vertical) // pendant les deux prochaines frames impossible de rebondir sur les murs.
		ball.hit_vertical++;
	if (ball.hit_vertical > 3)
		ball.hit_vertical = 0;

    ball.coords.x += ball.vector.vx;	
	ball.coords.y += ball.vector.vy;

	drawBall(ball);
}

function winnerWindow(player) {
	
	context.clearRect(0, 0, table.width, table.height);
	drawInnerRectangle("#23232e");

	const winner1Text = document.getElementById("wrapper-player1");
	const winner2Text = document.getElementById("wrapper-player2");
	if (player == 1)
		winner1Text.style.display = "block";
	else
		winner2Text.style.display = "block";
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