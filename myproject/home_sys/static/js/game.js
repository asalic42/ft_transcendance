
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
    
    update();
    createPlayers();
    // createBall();
}

function update() {
    context.fillStyle = "black";
    context.fillRect(0, 0, table.width, table.height);
    context.beginPath();
    context.moveTo(table.width /2 , 0);
    context.lineTo(table.width / 2, table.height);
    context.strokeStyle = '#cc20ef';
    context.stroke();
    context.closePath();

    console.log('Creating player...');
}

/* Players bars */
function createPlayers() {

    // Initials points player 1
    var ax1 = 50;
    var ay1 = (table.height / 2) -15;
    var ax2 = 50;
    var ay2 = (table.height / 2) +15;

    // Initials points player 1
    var x1 = table.width -50, y1 = (table.height / 2) -15;
    var x2 = table.width -50, y2 = (table.height / 2) +15;

    context.beginPath();
    context.moveTo(ax1, ay1);
    context.lineTo(ax2, ay2);
    context.strokeStyle = '#cc20ef';
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = '#cc20ef';
    context.stroke();
    context.closePath();
}

// function createBall() {
//     context.beginPath();
//     context.arc(table.width /2, table.height /2, 50, 0, 7);
//     context.strokeStyle = 'white';
//     context.stroke();
//     context.closePath();
// }