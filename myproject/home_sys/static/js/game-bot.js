// Variables
var table;
var context;
var score = document.getElementById("score");
var game = document.getElementById("game");
var count = 0;

function getRandomArbitrary(min, max) {
	var result = Math.random() * (max - min) + min;
	if (result >= -4 && result <= 4)
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

}


function createBall() {
    // Balls coords
	var ball = {coords : {x : table.width / 2, y : table.height / 2},
				vector : {vx : Math.floor(getRandomArbitrary(-7, 7)), vy : Math.floor(getRandomArbitrary(-7, 7))},
				radius : 13,
				colision : {when : 0, y : 0}};

    // Initials points player 1
	var player1Coords = {x1 : 92, y1 : (table.height / 2) - 40, x2 : 100, y2 : (table.height / 2) + 40, vy : 12};

    // Initials points player 2
	var player2Coords = {x1 : table.width - 100, y1 : (table.height / 2) - 40, x2 : table.width - 92, y2 : (table.height / 2) + 40, vy : 12};
	launchAnim(ball, player1Coords, player2Coords);
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
}

function move_bot(player1Coords, player2Coords, ball) {
 	
}

function drawPlayer(player1Coords, player2Coords, color, ball) {
	
	updatePlayers(player1Coords, player2Coords);
	move_bot(player1Coords, player2Coords, ball);
	context.fillStyle = color;
	context.beginPath();
	context.roundRect(player1Coords.x1, player1Coords.y1, 5, 80, 10);
	context.roundRect(player2Coords.x1, player2Coords.y1, 5, 80, 10);
	context.fill();
	context.closePath();
}

let stop = 0;

function launchAnim(ball, player1Coords, player2Coords) {
    requestAnimationFrame(function () {
		if (stop)
			return;
        context.clearRect(0, 0, table.width, table.height);
        update();
        moveBall(ball, player1Coords, player2Coords);
        drawPlayer(player1Coords, player2Coords, "#ED4EB0", ball);
        launchAnim(ball, player1Coords, player2Coords);
    });
}

function isBallHittingPlayer(ball, player1Coords, player2Coords) {

    if (ball.coords.x - ball.radius >= player1Coords.x1 && ball.coords.x - ball.radius <= player1Coords.x2 + Math.abs(ball.vector.vx * 0.8) &&
			ball.coords.y - ball.radius <= player1Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player1Coords.y1 - ball.radius / 2)
			
		return true;

	else if (ball.coords.x + ball.radius >= player2Coords.x1 - Math.abs(ball.vector.vx * 0.8) && ball.coords.x + ball.radius <= player2Coords.x2 &&
			ball.coords.y - ball.radius <= player2Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player2Coords.y1 - ball.radius / 2) {
			
				ball.colision.when = 0;
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

	// Ball is hiting a player.

    if (!stop && isBallHittingPlayer(ball, player1Coords, player2Coords)) {
		console.log(ball.vector.vx);
		count++;
		score.innerText = "Score : " + count;
		ball.vector.vx = -(ball.vector.vx);
		if (ball.vector.vx < 0 && ball.vector.vx > -30)
			ball.vector.vx -= 1;
		else if (ball.vector.vx < 30)
			ball.vector.vx += 1;
	}

    else if (ball.radius + ball.coords.x >= table.width)
    {
        console.log("player 1 wins when ball was at y = " + ball.coords.y);
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
	// ball is hitting an edge.
    if (ball.coords.y - ball.radius <= 0 || ball.coords.y + ball.radius >= table.height)
        ball.vector.vy = -ball.vector.vy;

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