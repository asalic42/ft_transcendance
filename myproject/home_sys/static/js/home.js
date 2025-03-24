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
      if (userList) userList.innerHTML = '';
      
      // Si des utilisateurs sont en ligne
      if (data.online_users.length > 0) {
          if (emptyState) emptyState.style.display = 'none';
          
          data.online_users.forEach(user => {
              const userCard = document.createElement('div');
              userCard.classList.add(`user-card-${user.id}`);

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

              // Ajout de la carte de l'utilisateur à la liste
              if (userList) userList.appendChild(userCard);

              const cardToHide = document.querySelector(`.card-${user.id}`);
              if (cardToHide)
              {
                cardToHide.style.display = "none";
              }
          })
      } else {
          // Si aucun utilisateur n'est en ligne, afficher l'état vide
          if (emptyState) emptyState.style.display = 'block';
      }

      if (data.offline_users.length > 0) {
        data.offline_users.forEach(off_user => {
          const OfflineCards = document.querySelector(`.card-${off_user.id}`);

          if (OfflineCards) {
            // Si l'utilisateur n'est pas en ligne, afficher la carte comme "offline"
            OfflineCards.style.display = "block";
          }
        })
      }
  })
  .catch(error => console.error('Erreur lors de la récupération des utilisateurs en ligne :', error));
}


// Récupérer les demandes d'amis toutes les 10 secondes
  // Appeler la fonction pour récupérer les utilisateurs en ligne au chargement de la page
  document.addEventListener('DOMContentLoaded', fetchOnlineUsers);
  

  homefetch = setInterval(fetchOnlineUsers, 500);