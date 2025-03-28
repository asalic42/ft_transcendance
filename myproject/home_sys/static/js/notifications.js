// Sécurité CSRF cookies
function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        document.cookie.split(';').forEach(cookie => {
            let trimmedCookie = cookie.trim();
            if (trimmedCookie.startsWith('csrftoken=')) {
                cookieValue = trimmedCookie.split('=')[1];
            }
        });
    }
    return cookieValue;
}

function notif_getAddFriendResponse(baliseName, url, dataStatus) {
	document.querySelectorAll(`${baliseName}`).forEach(button => {
		button.addEventListener('click', function() {
			const username = this.getAttribute('data-username');
			fetch(`/${url}/${username}/`, {
				method: 'POST',
				headers: {
					'X-CSRFToken': getCSRFToken(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({})
			})
			.then(response => response.json())
			.then(data => {
				if (data.status === `blocked`) {
					alert(`Impossible d'accepter car vous êtes bloqué par cet utilisateur.`);
					loadPage(`https://${window.location.host}/notifications/`); // Recharger la page pour mettre à jour la liste
				}
				else if (data.status === `unblockBefore`) {
					alert(`Pour accepter la demande d'ami de cet utilisateur, veuillez le débloquer.`);
					loadPage("/notifications/"); // Recharger la page pour mettre à jour la liste
				}
				else if (data.status === `friend_added`) {
					alert(`L'Utilisateur <${username}> a bien été ajouté en ami !`);
					loadPage("/notifications/"); // Recharger la page pour mettre à jour la liste
				}
				else {
					alert('Erreur : ' + data.message);
				}
			})
			.catch(error => console.error('Erreur:', error));
		});
	});
}

function notif_getReponse(baliseName, url, dataStatus, msgStart, msgEnd) {
	document.querySelectorAll(`${baliseName}`).forEach(button => {
		button.addEventListener('click', function() {
			const username = this.getAttribute('data-username');
			fetch(`/${url}/${username}/`, {
				method: 'POST',
				headers: {
					'X-CSRFToken': getCSRFToken(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({})
			})
			.then(response => response.json())
			.then(data => {
				if (data.status === "blocked")
				{
					return (alert('Erreur: ' + "Impossible vous avez été bloqué. Rechargez la page."))
				}
				if (data.status === `${dataStatus}`) {
					alert(`${msgStart} ${username} ${msgEnd}`);
					loadPage("/notifications/"); // Recharger la page pour mettre à jour la liste
				} else {
					alert('Erreur : ' + data.message);
				}
			})
			.catch(error => console.error('Erreur:', error));
		});
	});
}

// Fonction pour récupérer les statuts de tous les utilisateurs
function notif_fetchAllUsersStatus() {

	fetch("/api/user-status/")
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
		.catch(error => {return null;});

	// const testTalk = document.querySelectorAll(".talk-friend");
	// testTalk.forEach(function (testT) {
		// if (testT)
		// {
			// /* Récupérer le user et construire l'url pour la chan priv */
			// testT.addEventListener("click", function() {
				// loadPage(`/channels/`)
			// })
		// }
	// });
}

function connectWebSocket_notif_page() {
	notiffetch = setInterval(notif_fetchAllUsersStatus, 500);
	notif_getAddFriendResponse(".add-it", "accept_friend_request", "friend_added");
	notif_getReponse(".decline-it", "decline_friend_request", "friend_request_declined", "Demande d'ami de", "refusée.");
	notif_getReponse(".block-it", "block_user", "user_blocked", "Utilisateur", "bloqué.");
	notif_getReponse(".remove-friend", "remove_friend", "user_removed", "", "n'est désormait plus votre ami.");
	notif_getReponse(".remove-user-blocked", "remove_blocked_user", "blocked_user_removed", "Le user", "est débloqué.");
	/* notif_getReponse(".invite-friend", "invite_friend", "game_invitation_send", "L'invitation envers le user", "a bien été envoyée."); */
	notif_getReponse(".decline-invitation", "invitation_declined", "game_invitation_declined", "La demande du user", "a bien été refusée.");
}
