// BLOCK BUTTON
function launch_profile() {
	const blockButton = document.querySelector(".other-profile-block");
	if (blockButton) {

		blockButton.addEventListener('click', function(e) {
			e.preventDefault();
			const username = encodeURIComponent(blockButton.getAttribute('data-username'));
			if (!username) {
				console.error("Username non trouvé !");
				alert("Erreur : Utilisateur non trouvé.");
				return;
			}
			console.log("Username récupéré :", username); // Debugging
			// Construire l'URL correctement
			const url = `/block_user/${username}/`;
			fetch(url, {
				method: 'POST',
				headers: {
					'X-CSRFToken': getCSRFToken(),
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({})
			})
			.then(response => {
				console.log("Réponse reçue:", response);
				if (!response.ok) {
					throw new Error('Erreur réseau ou serveur');
				}
				return response.json();
			})
			.then(data => {
				console.log("Données reçues:", data);
				switch (data.status) {
					case ('user_blocked'):
						alert('Cet Insolent a été bloqué ! 🫡​');
						break;
				}
			})
			.catch(error => {
				console.error('Error:', error);
				alert("Une erreur s'est produite lors de l'ajout de l'ami. Veuillez réessayer.");
			});
		});
	}
	
	// ADD BUTTON
	
	const addButton = document.querySelector(".other-profile-add-friend");
	if (addButton) {

		addButton.addEventListener('click', function(e) {
		   e.preventDefault();
	   
		   // Récupérer et encoder le username
		   const username = encodeURIComponent(addButton.getAttribute('data-username'));
	   
		   if (!username) {
			   console.error("Username non trouvé !");
			   alert("Erreur : Utilisateur non trouvé.");
			   return;
		   }
	   
		   console.log("Username récupéré :", username); // Debugging
	   
		   // Construire l'URL correctement
		   const url = `/add_friend/${username}/`;
	   
		   fetch(url, {
			   method: 'POST',
			   headers: {
				   'X-CSRFToken': getCSRFToken(),
				   'Content-Type': 'application/json'
			   },
			   body: JSON.stringify({})
		   })
		   .then(response => {
			   console.log("Réponse reçue:", response);
			   if (!response.ok) {
				   throw new Error('Erreur réseau ou serveur');
			   }
			   return response.json();
		   })
		   .then(data => {
			   console.log("Données reçues:", data);
			   switch (data.status) {
				   case ('friend_added'):
					   alert('Ami ajouté avec succès !');
					   break;
					   
				   case ('friend_request_sent'):
					   alert('Demande d\'ami envoyée !');
					   break;
				   case ('waiting'):
					   alert('Demande déjà envoyée, en attente de réponse.');
					   break;
				   case ('friend'):
					   alert('Vous êtes déjà amis.');
					   break;
				   case ('blocked'):
					   alert('Vous êtes bloqué par cet utilisateur.');
					   break;
				   
				   case ('unblockBefore'):
					   alert('Débloquez cet utilisateur pour le demander en ami.');
					   break;
			   }
		   })
		   .catch(error => {
			   console.error('Error:', error);
			   alert("Une erreur s'est produite lors de l'ajout de l'ami. Veuillez réessayer.");
		   });
	   });
	}
}