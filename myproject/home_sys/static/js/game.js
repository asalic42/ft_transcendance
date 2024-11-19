// variables
var table;
var borders;
var context;
var ball = document.getElementById("ball");

window.onload = function() {
    table = document.getElementById("game");
    table.width = 750;
    table.height = 400;
    context = table.getContext("2d");

	createBall();
}

function update() {
    context.fillStyle = "black";
    context.fillRect(0, 0, table.width, table.height);
    context.beginPath();
    context.moveTo(table.width / 2 , 0);
    context.lineTo(table.width / 2, table.height);
    context.strokeStyle = '#cc20ef';
    context.stroke();
    context.closePath();

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

	context.beginPath();
    context.moveTo(player1Coords.x1, player1Coords.y1);
    context.lineTo(player1Coords.x2, player1Coords.y2);
    context.strokeStyle = '#cc20ef';
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(player2Coords.x1, player2Coords.y1);
    context.lineTo(player2Coords.x2, player2Coords.y2);
    context.strokeStyle = '#cc20ef';
    context.stroke();
    context.closePath();
}

function createBall() {
	var ballCoords = {x : table.width / 2, y : table.height / 2, vx : Math.floor(Math.random() * 8), vy : Math.floor(Math.random() * 8)};

    // Initials points player 1
	var player1Coords = {x1 : 50, y1 : (table.height / 2) - 35, x2 : 50, y2 : (table.height / 2) + 35, vy : 12};

    // Initials points player 2
	var player2Coords = {x1 : table.width - 50, y1 : (table.height / 2) - 35, x2 : table.width - 50, y2 : (table.height / 2) + 35, vy : 12};
	launchAnim(ballCoords, player1Coords, player2Coords);
}

let stop = 0;

function launchAnim(ballCoords, player1Coords, player2Coords) {
    requestAnimationFrame(function () {
		if (stop)
			return;
        context.clearRect(0, 0, table.width, table.height);
        update();
        drawPlayer(player1Coords, player2Coords);
        moveBall(ballCoords, player1Coords, player2Coords);
        launchAnim(ballCoords, player1Coords, player2Coords);
    });
}

function isBallHittingPlayer(ballCoords, player1Coords, player2Coords) {
	if (ballCoords.x - 10 < 50 &&
			ballCoords.y - 10 <= player1Coords.y2 &&
			ballCoords.y + 10 >= player1Coords.y1)
			
		return true;
			
	else if (ballCoords.x + 10 > 700 &&
			ballCoords.y - 10 <= player2Coords.y2 &&
			ballCoords.y + 10 >= player2Coords.y1)

		return true;
	return false;
}

function moveBall(ballCoords, player1Coords, player2Coords) {

	// Conditions so that the ball bounces
    // from the edges

    if (isBallHittingPlayer(ballCoords, player1Coords, player2Coords)) 
			{ballCoords.vx = -ballCoords.vx;}
	else if (10 + ballCoords.x > table.width)
		{
			console.log("player 1 wins");
			stop = 1;
		}
	else if (ballCoords.x - 10 < 0)
		{
			console.log("player 2 wins");
			stop = 1;
		}
   else if (ballCoords.y - 10 < 0 || ballCoords.y + 10 > table.height)
        ballCoords.vy = -ballCoords.vy;

	ballCoords.x += ballCoords.vx;	
	ballCoords.y += ballCoords.vy;	

	context.beginPath();
    context.strokeStyle = 'white';
    context.arc(ballCoords.x, ballCoords.y, 10, Math.PI * 2, false);
    context.fillStyle = "black";
    context.fill();
    context.stroke();
    context.closePath();

}