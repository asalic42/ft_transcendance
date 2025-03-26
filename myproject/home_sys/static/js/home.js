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


/**
 * Récupère et affiche les utilisateurs en ligne et hors ligne de manière optimisée
 */
function fetchOnlineUsers() {
	fetch('/api/online-users')
		.then(response => response.json())
		.then(data => {
			const userList = document.getElementById('user-list');
			const offlines = document.getElementById('user-offline');
			const emptyStateOn = document.getElementById('empty-state-on');
			const emptyStateOff = document.getElementById('empty-state-off');

			// Traitement des utilisateurs en ligne
			processUserList({
				container: userList,
				newUsers: data.online_users,
				emptyState: emptyStateOn,
				status: 'online'
			});

			// Traitement des utilisateurs hors ligne
			processUserList({
				container: offlines,
				newUsers: data.offline_users,
				emptyState: emptyStateOff,
				status: 'offline'
			});
		})
		.catch(error => {
			console.error('Erreur lors de la récupération des utilisateurs:', error);
		});
}

/**
 * Gère la mise à jour optimisée d'une liste d'utilisateurs
 * @param {Object} params - Paramètres de configuration
 * @param {HTMLElement} params.container - Conteneur HTML
 * @param {Array} params.newUsers - Nouvelle liste d'utilisateurs
 * @param {HTMLElement} params.emptyState - Élément d'état vide
 * @param {string} params.status - Statut des utilisateurs (online/offline)
 */
function processUserList({ container, newUsers, emptyState, status }) {
	if (!container) return;

	// Masquer/afficher l'état vide
	if (emptyState) {
		emptyState.style.display = newUsers.length ? 'none' : 'block';
	}

	// Créer un Set des IDs des nouveaux utilisateurs
	const newUserIds = new Set(newUsers.map(user => user.id));
	
	// Supprimer les cartes des utilisateurs qui ne sont plus dans la liste
	const existingCards = container.querySelectorAll('.user-card');
	existingCards.forEach(card => {
		const userId = card.className.split('-').pop();
		if (!newUserIds.has(Number(userId))) {
			card.remove();
		}
	});

	// Ajouter seulement les nouveaux utilisateurs
	newUsers.forEach(user => {
		const existingCard = container.querySelector(`.user-card.${status}-${user.id}`);
		if (!existingCard) {
			createUserCard(container, status, user);
		}
	});
}

/**
 * Crée une carte utilisateur (inchangée par rapport à votre version)
 */
function createUserCard(userlist, card_name, user) {

	const userCard = document.createElement('div');
	userCard.className = `user-card ${card_name}-${user.id}`;
	
	const userAvatar = document.createElement('img');
	userAvatar.className = 'user-avatar';
	userAvatar.src = user.image;
	userAvatar.alt = `Avatar de ${user.username}`;
	userAvatar.loading = 'lazy';

	const userName = document.createElement('p');
	userName.className = 'user-name';
	userName.textContent = user.username;

	const profileButton = document.createElement('a');
	profileButton.className = 'profile-button button';
	profileButton.href = `https://${window.location.host}/profile/${user.username}`;
	profileButton.textContent = 'Voir le profil';
	profileButton.ariaLabel = `Profil de ${user.username}`;

	if (user.deleted === true)
	{
		profileButton.style.background = "gray";
		profileButton.textContent = "Locked out user";
	}


	userCard.append(userAvatar, userName, profileButton);
	userlist?.appendChild(userCard);
}

// Récupérer les demandes d'amis toutes les 10 secondes
	// Appeler la fonction pour récupérer les utilisateurs en ligne au chargement de la page
// document.addEventListener('DOMContentLoaded', fetchOnlineUsers);
	

// homefetch = setInterval(fetchOnlineUsers, 500);
