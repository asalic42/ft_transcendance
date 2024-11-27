// Variables
var table;
var context;
var score_p1 = document.getElementById("scoreP1");
var score_p2 = document.getElementById("scoreP2");
var game = document.getElementById("game");
var count_p1 = 0;
var count_p2 = 0;
let stop = 0;                           // Endgame
const keys = {};                        // Players bars

function getRandomArbitrary(min, max) {
	var result = Math.random() * (max - min) + min;
	if (result >= -4 && result <= 4)
		return getRandomArbitrary(min, max);
	return result;
}
  
window.onload = function() {
    table = document.getElementById("game");
    context = table.getContext("2d");

	createBall(Math.floor(getRandomArbitrary(-7, 7)));
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

window.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

function movePlayer(player1Coords, player2Coords) {
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
	
	movePlayer(player1Coords, player2Coords);
	context.fillStyle = color;
	context.beginPath();
	context.roundRect(player1Coords.x1, player1Coords.y1, 5, 80, 10);
	context.roundRect(player2Coords.x1, player2Coords.y1, 5, 80, 10);
	context.fill();
	context.closePath();
}

function createBall(vx) {
    // Balls coords
	var ball = {coords : {x : table.width / 2, y : table.height / 2},
				vector : {vx : vx, vy : Math.floor(getRandomArbitrary(-7, 7))},
				radius : 13};

    // Initials player 1 coords
	var player1Coords = {x1 : 92, y1 : (table.height / 2) - 40, x2 : 100, y2 : (table.height / 2) + 40, vy : 12};

    // Initials player 2 coords
	var player2Coords = {x1 : table.width - 100, y1 : (table.height / 2) - 40, x2 : table.width - 92, y2 : (table.height / 2) + 40, vy : 12, y3 : 0};
	launchAnim(ball, player1Coords, player2Coords);
}


/* Function that detects whether a player has won a point or not */
function isPointWin(ball) {
    if (ball.radius + ball.coords.x >= table.width) {
        count_p1++;
        score_p1.innerText = count_p1;
        createBall(Math.floor(getRandomArbitrary(-7, 0)));
        return true;
    }
    else if (ball.coords.x - ball.radius <= 0) {
        count_p2++;
        score_p2.innerText = count_p2;
        createBall(Math.floor(getRandomArbitrary(0, 7)));
        return true;
    }
    return false;
}

/* Animation function that run the game */
function launchAnim(ball, player1Coords, player2Coords) {
    requestAnimationFrame(function () {
		if (stop)
			return;
        context.clearRect(0, 0, table.width, table.height);
        update();
        drawPlayer(player1Coords, player2Coords, "#ED4EB0");
        if (isPointWin(ball))
            return ;
        moveBall(ball, player1Coords, player2Coords);
        launchAnim(ball, player1Coords, player2Coords);
    });
    if (stop)
        moveBall(ball, player1Coords, player2Coords);
}

/* Check if the ball touch a player */
function isBallHittingPlayer(ball, player1Coords, player2Coords) {

    if (ball.coords.x - ball.radius >= player1Coords.x1 && ball.coords.x - ball.radius <= player1Coords.x2 + Math.abs(ball.vector.vx * 0.8) &&
			ball.coords.y - ball.radius <= player1Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player1Coords.y1 - ball.radius / 2)
		return true;

	else if (ball.coords.x + ball.radius >= player2Coords.x1 - Math.abs(ball.vector.vx * 0.8) && ball.coords.x + ball.radius <= player2Coords.x2 &&
			ball.coords.y - ball.radius <= player2Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player2Coords.y1 - ball.radius / 2)
		return true;
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

	// Conditions so that the ball bounces from the edges

    if (!stop && isBallHittingPlayer(ball, player1Coords, player2Coords)) {
		console.log(ball.vector.vx);
		ball.vector.vx = -(ball.vector.vx);
		if (ball.vector.vx < 0 && ball.vector.vx > -30)
			ball.vector.vx -= 1;
		else if (ball.vector.vx < 30)
			ball.vector.vx += 1;
    }
 
    // Winning condition
    else if (count_p1 == 5 || count_p2 == 5) {
        stop = 1;
        if (count_p1 == 5) {
            console.log("player 1 wins");
            winnerWindow(1);
        }
        else {
            console.log("player 2 wins");
            winnerWindow(2);
        }   
        return;
    }

    // Bounce on the top and bottom
    else if (ball.coords.y - ball.radius <= 0 || ball.coords.y + ball.radius >= table.height) {
        ball.vector.vy = -ball.vector.vy;
    }

    ball.coords.x += ball.vector.vx;	
	ball.coords.y += ball.vector.vy;

	drawBall(ball);
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
	button.addEventListener("click", () => {
		window.location.reload();
    });
}