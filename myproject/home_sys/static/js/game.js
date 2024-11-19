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
	var ballCoords = {x : table.width / 2, y : table.height / 2, vx : Math.floor(Math.random() * 8), vy : Math.floor(Math.random() * 16)};

    // Initials points player 1
	var player1Coords = {x1 :  50, y1 : (table.height / 2) - 25, x2 : 50, y2 : (table.height / 2) + 25, vy : 15};

    // Initials points player 2
	var player2Coords = {x1 : table.width -50, y1 : (table.height / 2) - 25, x2 : table.width -50, y2 : (table.height / 2) + 25, vy : 15};
	launchAnim(ballCoords, player1Coords, player2Coords);
}

function launchAnim(ballCoords, player1Coords, player2Coords) {
    window.requestAnimationFrame(function () {
        context.clearRect(0, 0, table.width, table.height);
        update();
        updatePlayers(player1Coords, player2Coords);
        drawPlayer(player1Coords, player2Coords);
        moveBall(ballCoords);
        launchAnim(ballCoords, player1Coords, player2Coords);
    });
}

function moveBall(ballCoords) {

	// Conditions so that the ball bounces
    // from the edges
    if (10 + ballCoords.x > table.width)
        ballCoords.vx = -ballCoords.vx;

    if (ballCoords.x - 10 < 0)
        ballCoords.vx = -ballCoords.vx;

    if (ballCoords.y + 10 > table.height)
        ballCoords.vy = -ballCoords.vy;

    if (ballCoords.y - 10 < 0)
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