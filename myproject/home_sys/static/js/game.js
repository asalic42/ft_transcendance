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

function update() {

    context.fillStyle = '#cc20ef';
    context.fillRect(0, 0, table.width, table.height);

    context.fillStyle = "black";
    context.fillRect(+5, +5, table.width -10, table.height-10);

    context.fillStyle = '#cc20ef';
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

function drawPlayer(player1Coords, player2Coords) {
	
	updatePlayers(player1Coords, player2Coords);

    context.fillStyle = '#cc20ef';
    context.fillRect(player1Coords.x1, player1Coords.y1, 5, 80);
    context.fillStyle = '#cc20ef';
    context.fillRect(player2Coords.x1, player2Coords.y1, 5, 80);
}

function createBall() {
    // Balls coords
	var ball = {coords : {x : table.width / 2, y : table.height / 2},
				vector : {vx : Math.floor(getRandomArbitrary(-7, 7)), vy : Math.floor(getRandomArbitrary(-7, 7))},
				radius : 13};

    // Initials points player 1
	var player1Coords = {x1 : 100, y1 : (table.height / 2) - 40, x2 : 105, y2 : (table.height / 2) + 40, vy : 12};

    // Initials points player 2
	var player2Coords = {x1 : table.width - 100, y1 : (table.height / 2) - 40, x2 : table.width - 95, y2 : (table.height / 2) + 40, vy : 12, y3 : 0};
	launchAnim(ball, player1Coords, player2Coords);
}

let stop = 0;

function launchAnim(ball, player1Coords, player2Coords) {
    requestAnimationFrame(function () {
		if (stop)
			return;
        context.clearRect(0, 0, table.width, table.height);
        update();
        drawPlayer(player1Coords, player2Coords);
        moveBall(ball, player1Coords, player2Coords);
        launchAnim(ball, player1Coords, player2Coords);
    });
    if (stop)
        moveBall(ball, player1Coords, player2Coords);
}

function isBallHittingPlayer(ball, player1Coords, player2Coords) {

    if (ball.coords.x - ball.radius >= player1Coords.x1 && ball.coords.x - ball.radius <= player1Coords.x2 + Math.abs(ball.vector.vx * 0.8) &&
			ball.coords.y - ball.radius <= player1Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player1Coords.y1 - ball.radius / 2)
			
		return true;

	else if (ball.coords.x + ball.radius >= player2Coords.x1 - Math.abs(ball.vector.vx * 0.8) && ball.coords.x + 10 <= player2Coords.x2 &&
			ball.coords.y - ball.radius <= player2Coords.y2 + ball.radius / 2 &&
			ball.coords.y + ball.radius >= player2Coords.y1 - ball.radius / 2)

		return true;
	return false;
}

function moveBall(ball, player1Coords, player2Coords) {

	// Conditions so that the ball bounces
    // from the edges

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
    else if (ball.coords.y - ball.radius <= 0 || ball.coords.y + ball.radius >= table.height)
        ball.vector.vy = -ball.vector.vy;

    ball.coords.x += ball.vector.vx;	
	ball.coords.y += ball.vector.vy;

	context.beginPath();
    context.strokeStyle = 'white';
    context.arc(ball.coords.x, ball.coords.y, ball.radius + 1, Math.PI * 2, false);
    context.fillStyle = "black";
    context.arc(ball.coords.x, ball.coords.y, ball.radius, Math.PI * 2, false);
    context.fill();
    context.stroke();
    context.closePath();
}

function winnerWindow(player) {
    context.clearRect(0, 0, table.width, table.height);
    context.fillStyle = "black";
    context.fillRect(0, 0, table.width, table.height);
    if (player == 1)
        context.fillStyle = "blue";
    else
        context.fillStyle = "red";
    context.fillRect(5, 5, table.width -10, table.height -10);

    const text = "Player " + player + " wins !";
    context.font = "bold 40px 'Namaku'";
    context.fillStyle = "white";
    context.textAlign = "center";    
    context.fillText(text, table.width /2, table.height /2);

    replay();
}

function replay() {
    const button = document.getElementById("replay-button");
    button.style.display = "block";  

    button.addEventListener("click", () => {
        window.location.reload();
    });

}