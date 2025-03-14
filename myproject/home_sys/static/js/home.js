let statusSocket;

// Fonction pour récupérer les statuts de tous les utilisateurs
function fetchAllUsersStatus() {
	fetch("/api/user-status/") // Remplacez par l'URL de votre endpoint Django
		.then(response => response.json())
		.then(users => {
			// console.log("Users status fetched:", users);
			users.forEach(user => {
				const userElement = document.getElementById(`user-${user.id}`);
				if (userElement) {
					if (user.is_online) {
						userElement.classList.add("active");
					} else {
						userElement.classList.remove("active");
					}
				}
			});
		})
		.catch(error => console.error('Error fetching users status:', error));
}

function connectWebSocket() {
	statusSocket = new WebSocket("wss://transcendance.42.paris/ws/status/");

	statusSocket.onopen = function(e) {
		console.log("WebSocket connection established");

		// Récupérer les statuts de tous les utilisateurs dès que la connexion WebSocket est établie
		fetchAllUsersStatus();
	};

	statusSocket.onmessage = function(e) {
		// console.log("WebSocket message received:", e.data);
		const data = JSON.parse(e.data);
		const userElement = document.getElementById(`user-${data.user_id}`);
		// console.log("User Element : ", userElement);
		if (userElement) {
			if (data.is_online) {
				userElement.classList.add("active");
			} else {
				userElement.classList.remove("active");
			}
		}
	};

	statusSocket.onclose = function(e) {
		console.error('WebSocket closed unexpectedly. Reconnecting...');
		setTimeout(connectWebSocket, 5000); // Reconnecter après 5 secondes
	};

	statusSocket.onerror = function(e) {
		console.error('WebSocket error:', e);
	};
}

connectWebSocket();