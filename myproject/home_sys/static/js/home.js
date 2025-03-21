// Fonction pour récupérer les statuts de tous les utilisateurs
function fetchAllUsersStatus() {
	fetch("/api/user-status/") // Remplacez par l'URL de votre endpoint Django
		.then(response => response.json())
		.then(users => {
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


function fetchOnlineUsers() {
    fetch('/api/online-users')
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
      });
  }

// Récupérer les demandes d'amis toutes les 10 secondes
  // Appeler la fonction pour récupérer les utilisateurs en ligne au chargement de la page
  document.addEventListener('DOMContentLoaded', fetchOnlineUsers);
  

  homefetch = setInterval(fetchOnlineUsers, 500);