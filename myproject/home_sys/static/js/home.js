// Fonction pour récupérer les statuts de tous les utilisateurs
function fetchAllUsersStatus() {
	//fetch("/api/user-status/") // Remplacez par l'URL de votre endpoint Django
	//.then(response => response.json())
	//.then(users => {
	//	// console.log("Users status fetched:", users);
	//	users.forEach(user => {
	//		const userElement = document.getElementById(`user-${user.id}`);
	//		if (userElement) {
	//			if (user.is_online) {
	//				userElement.classList.add("active");
	//			} else {
	//				userElement.classList.remove("active");
	//			}
	//		}
	//	});
	//})
	//.catch(error => console.error('Error fetching users status:', error));
//
	//homefetch = setInterval(fetchOnlineUsers, 500);
}

/* function connectWebSocket() {
	const socketStatus = new WebSocket(`wss://${window.location.host}/ws/status/`);

	socketStatus.onopen = function(e) {
		console.log("WebSocket connection established");

		// Récupérer les statuts de tous les utilisateurs dès que la connexion WebSocket est établie
		fetchAllUsersStatus();
	};

	socketStatus.onmessage = function(e) {socketStatus
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

	socketStatus.onclose = function(e) {
		console.error('WebSocket closed unexpectedly. Reconnecting...');
		setTimeout(connectWebSocket, 5000); // Reconnecter après 5 secondes
	};

	socketStatus.onerror = function(e) {
		console.error('WebSocket error:', e);
	};
} */

//connectWebSocket();


function fetchOnlineUsers() {
    /* fetch('/api/online-users')
      .then(response => response.json())
      .then(data => {
        const userList = document.getElementById('user-list');
        const emptyState = document.getElementById('empty-state');
        
        // Vider la liste actuelle d'utilisateurs
		if (userList)
        	userList.innerHTML = '';
        
        // Si des utilisateurs sont en ligne
        if (data.online_users.length > 0) {
			if (emptyState)
          		emptyState.style.display = 'none';
          	
			data.online_users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.classList.add('user-card');
            
            const userAvatar = document.createElement('img');
            userAvatar.classList.add('user-avatar');
            userAvatar.src = user.image;
            userAvatar.alt = user.username;
            
            const userName = document.createElement('p');
            userName.classList.add('user-name');
            userName.textContent = user.username;

            const profileButton = document.createElement('a');
            profileButton.classList.add('profile-button');
            profileButton.href = `https://${window.location.host}/profile/${user.username}`;
            profileButton.textContent = 'profile';

            userCard.appendChild(userAvatar);
            userCard.appendChild(userName);
            userCard.appendChild(profileButton);
            
			if (userList)
            	userList.appendChild(userCard);
          });
        } else {
			if (emptyState)
          		emptyState.style.display = 'block';
        }
      }); */
  }

  // Appeler la fonction pour récupérer les utilisateurs en ligne au chargement de la page
  
  
  // Optionnel : mettre à jour la liste toutes les 30 secondes