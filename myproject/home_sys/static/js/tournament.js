const socket = new WebSocket(`wss://transcendance.42.paris/ws/tournament/${id_t}`);

socket.onopen = function() {
    console.log("Connexion réussie au WebSocket");
	span = document.createElement('span');
	span.classList.add('player_list');
	document.getElementById('square').appendChild(span);
}

socket.onclose = function socket_close() {
	alert("Tournament is full, running or there has been an error.")
	window.location.href = "https://transcendance.42.paris/accounts/game-mode-pong/"
}

function startButton(link) {
	const button = document.createElement('button');
	button.style.display = "none";
	button.id = "bt";
	document.body.appendChild(button);
	button.textContent = 'Ouvrir le jeu dans un nouvel onglet';
	button.style = "position: absolute; left: 200px; top: 100px; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer;";
	button.onclick = function() {
		window.open(link, '_blank');
		button.textContent = "Everyone needs to finish their game first.";
		button.style.background = "red";
		button.disabled = "disabled";
		first_pass = false;
	};
}

var first_pass = true;

socket.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data);
        console.log("Message reçu:", data);

        if (data.type === "game_link") {
			document.getElementById("loader").display = 'none';
			if (!first_pass)
				document.getElementById('bt').remove();
			startButton(data.link)
		}
		if (data.type === 'result') {
			document.getElementById('bt').display = 'none';
			document.getElementById('title').innerText = "Le tournois est fini, voici les résultats :"
			const playerId = data.player_id;
			const score = data.score;
			const name = data.name;
	
			// Create or update player element
			playerElement = document.createElement('div');
			playerElement.id = `player-${playerId}`;
			playerElement.classList.add('player-info'); // Add a class for styling
			document.getElementById('players-container').appendChild(playerElement); // Add to the container
	
			// Update name and score
			nameElement = document.createElement('span');
			nameElement.classList.add('name');
			playerElement.appendChild(nameElement);

			scoreElement = document.createElement('span');
			scoreElement.classList.add('score');
			playerElement.appendChild(scoreElement);

			nameElement.textContent = playerId === cachedUserId ? "You" : name; // "You" for current user
			scoreElement.textContent = ": " + score;
		}
		if (data.type === "tournament_cancelled") {
			alert("Tournament is cancelled. Someone disconnected.");
			window.location.href = "https://transcendance.42.paris/accounts/game-mode-pong/"
		}
		if (data.type === "user_list") {
			span.textContent = "";
			data.data.forEach(function (name, index) {
				span.textContent += name + "\n";
			  });
			console.log(span);

			// document.getElementById('players-container').appendChild(list);
		}
		if (data.type === "already") {
			alert("This tournament already ran.")
			function sleep(ms) {
				return new Promise(resolve => setTimeout(resolve, ms));
			}

			sleep(1000);
			window.location.href = "https://transcendance.42.paris/accounts/game-mode-pong/"
		}
    } catch (error) {
        console.error("Erreur de parsing des données du WebSocket :", error);
    }
}

document.addEventListener("DOMContentLoaded", function() {
	getCurrentPlayerId()
});

let cachedUserId = null;
async function getCurrentPlayerId() { // à lancer au chargement de la page;
	if (cachedUserId !== null) {
		return cachedUserId;
	}
	try {
		const response = await fetch('/accounts/api/current-user/', {
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
