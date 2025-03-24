
function startButton(link, name, message) {
	const playersContainer = document.getElementById('square');
	
	if (!playersContainer) {
		return setTimeout(() => startButton(link, name, message), 100); // Réessayer après 100ms
	}
	
	const button = document.getElementById('bt');
	// button.style.display = "none";
	document.getElementById('opponant').innerText = `You are going to face ${name}`
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	button.removeAttribute("disabled");
	button.textContent = 'Ouvrir le jeu';
	button.style = "position: relative; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer;";
	document.getElementById("loader").style.display = 'block';
	document.getElementById('button_id').href = link;
	document.getElementById("message").innerHTML = message;
}

async function getCurrentPlayerId() { // à lancer au chargement de la page;
	try {
		const response = await fetch('/api/current-user/', {
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


function launch_tournament() {
	let cachedUserId = getCurrentPlayerId; // à lancer au chargement de la page;
	let alert = false;
	const id_t = document.querySelector('.container').dataset.idT;
	window.id_t_t = id_t;
	if (window.socket_t == null)
		window.socket_t = new WebSocket(`wss://${window.location.host}/ws/tournament/${id_t}`);

	window.socket_t.onopen = function() {
		span = document.createElement('span');
		span.classList.add('player_list');
		document.getElementById('square').appendChild(span);
	}
	
	window.socket_t.onclose = function() {
		if (!alert) {
			alert("Tournament is full, finished or there has been an error.")
		}
		alert = false;
		loadPage(`game-mode-pong/`);
	}

	window.socket_t.onmessage = async function(event) {
		try {
			const data = JSON.parse(event.data);
			if (data.type === "game_link") {
				const str = new String(data.link);
				window.game_id_t = Number(str.substring(14, 19)); 
				if (document.getElementById("loader"))
					document.getElementById("loader").style.display = 'none';
				startButton(data.link, data.name_op, data.message);
			}
			if (data.type === 'result') {
				function print_result() {
					
					if (!document.getElementById('square')) {
						return setTimeout(() => print_result(), 100); // Réessayer après 100ms
					}
					
					document.getElementById('bt').style.display = "none";
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
				print_result();

				function sleep(ms) {
					return new Promise(resolve => setTimeout(resolve, ms));
				}
	
				await sleep(5000);
				if (!alert) {
					alert('Tournament is finished. Thanks.');
					alert = true;
				}
				await sleep(1000);
				window.socket_t.onclose = function(){}
				loadPage(`game-mode-pong/`);
			}
			if (data.type === "tournament_cancelled") {
				if (!alert) {
					alert("Tournament is cancelled. Someone disconnected.");
					alert = true;
				}
				window.socket_t.onclose = function(){}
				loadPage(`/game-mode-pong/`);
			}
			if (data.type === "user_list") {
				span.textContent = "Users connected to tournament: ";
				data.data.forEach(function (name, index) {
					span.textContent += name + "\n";
				});
			}
			if (data.type === "already") {
				if (!alert) {
					alert("This tournament already ran.")
					alert = true;
				}
				function sleep(ms) {
					return new Promise(resolve => setTimeout(resolve, ms));
				}
	
				sleep(1000);
				loadPage(`game-mode-pong/`);
			}
		} catch (error) {
			console.error("Erreur de parsing des données du WebSocket :", error);
		}
	}
	
}