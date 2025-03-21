function launch_settings() {
	let update_var = {value: false};

	const buttonUpdateSave = document.querySelector(".update-or-save");

	const allInputs = document.querySelectorAll(".settings-user-info input");

	buttonUpdateSave.addEventListener('click', function(e) {
		e.preventDefault();

		update_var.value = !update_var.value;

		if (update_var.value === true) {
			buttonUpdateSave.textContent = "Save";
			allInputs.forEach(input => {
				input.style.backgroundColor = "white";
				input.disabled = false;
				input.style.color = "black";
			});
		} else {
			buttonUpdateSave.textContent = "Update";
			allInputs.forEach(input => {
				input.style.backgroundColor = "#212121";
				input.disabled = true;
				input.style.color = "#888888";
			});
			
			// On envoie les nouvelles données quand on clique sur "Save"
			var new_username = $('#s-username').val(); // Récupère la valeur de l'input username
			var new_pseudo = $('#s-pseudo').val(); // Récupère la valeur de l'input pseudo
			var new_email = $('#s-email').val(); // Récupère la valeur de l'input email

			// Crée un objet FormData pour envoyer les données
			var formData = new FormData();
			formData.append('username', new_username);
			formData.append('pseudo', new_pseudo);
			formData.append('email', new_email);
			formData.append('csrfmiddlewaretoken', getCSRFToken());  // CSRF token pour sécuriser la requête
			// On envoie les données via AJAX
			$.ajaxSetup({
				headers: {
					'X-CSRFToken': getCSRFToken(),
				}
			});
			
			$.ajax({
				url: '/user-settings/update-user/',
				type: 'POST',
				data: formData,
				processData: false,  // Important : ne pas traiter les données (surtout pour les fichiers)
				contentType: false,  // Important : ne pas définir de type de contenu, FormData s'en charge
				success: function(response) {
					if (response.status === 'success') {
						alert('Vos informations ont été mises à jour. ✅');
					} else {
						alert('❌ Erreur : ' + response.message);
					}
				},
				error: function() {
					alert('❌ Erreur lors de la mise à jour des informations.');
				}
			});
	}});

			// Lorsque l'utilisateur choisit un fichier, on déclenche l'upload via AJAX
	$('#s-avatar').on('change', function(event) {
		// Récupère le fichier choisi
		var avatar_file = event.target.files[0];  // Le premier fichier choisi

		// Vérifie si un fichier a bien été sélectionné
		if (!avatar_file) {
			alert('Veuillez choisir un fichier d\'avatar.');
			return;
		}

		// Crée un objet FormData pour envoyer le fichier
		var formData = new FormData();
		formData.append('avatar', avatar_file);  // Ajoute le fichier avatar
		formData.append('csrfmiddlewaretoken', getCSRFToken());  // CSRF token pour la sécurité

		// On envoie les données via AJAX
		$.ajax({
			url: '/user-settings/upload-avatar/',  // URL de la vue pour uploader l'avatar
			type: 'POST',
			data: formData,
			processData: false,  // Important : ne pas traiter les données
			contentType: false,  // Important : ne pas définir de type de contenu, FormData s'en charge
			success: function(response) {
				if (response.status === 'success') {
					// Met à jour l'image de profil sur la page immédiatement
					$('#avatar-img').attr('src', response.new_avatar_url);
				} else {
					alert('❌ Erreur : ' + response.message);
				}
			},
			error: function() {
				alert('❌ Erreur lors du téléchargement de l\'avatar.');
			}
		});
	});


	const signoutButton = document.querySelector(".settings-logout");

	signoutButton.addEventListener("click", function () {
		fetch(`signout/`)
			.then(response => response.json())
			.then(data => {
				if (data.status === 'success') {
					// Créer un élément vidéo

					var videoContainer = document.getElementById('videoContainer');

					var video = document.createElement('video');
					video.src = '/static/videos/turnoffscreen.mp4';
					video.autoplay = true;
					video.muted = true;
					video.loop = false;
					video.style.width = '100%';
					video.style.height = '100%';
					video.style.objectFit = 'cover';

					// Ajouter un événement pour détecter la fin de la vidéo
					video.addEventListener('ended', function () {

						const textElement = document.createElement('span');
						textElement.textContent = 'Seems like you need to refresh or reopen a new page buddy.';
						textElement.style.position = 'absolute'; // Position absolue pour le superposer
						textElement.style.top = '50%'; // Centrer verticalement
						textElement.style.left = '50%'; // Centrer horizontalement
						textElement.style.transform = 'translate(-50%, -50%)'; // Centrer parfaitement
						textElement.style.color = 'white'; // Couleur du texte
						textElement.style.fontSize = '24px'; // Taille du texte
						textElement.style.zIndex = '1000'; // S'assurer qu'il est au-dessus de la vidéo
						textElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Fond semi-transparent
						textElement.style.padding = '10px'; // Espacement autour du texte
						textElement.style.borderRadius = '5px'; // Coins arrondis

						const buttonElement = document.createElement('button');
						buttonElement.textContent = 'Take me home darling';
						buttonElement.style.position = 'absolute'; // Position absolue pour le superposer
						buttonElement.style.top = 'calc(50% + 40px)'; // Placer le bouton sous le texte
						buttonElement.style.left = '50%'; // Centrer horizontalement
						buttonElement.style.transform = 'translateX(-50%)'; // Centrer parfaitement
						buttonElement.style.padding = '10px 20px'; // Espacement autour du texte du bouton
						buttonElement.style.fontSize = '18px'; // Taille du texte du bouton
						buttonElement.style.color = '#fff'; // Couleur du texte du bouton
						buttonElement.style.backgroundColor = '#007bff'; // Couleur de fond du bouton
						buttonElement.style.border = 'none'; // Pas de bordure
						buttonElement.style.borderRadius = '5px'; // Coins arrondis
						buttonElement.style.cursor = 'pointer'; // Curseur pointer pour indiquer que c'est cliquable

						// Ajouter un événement pour rediriger lors du clic
						buttonElement.addEventListener('click', function () {
							window.location.href = 'https://www.youtube.com/watch?v=FiARsQSlzDc';
						});

						videoContainer.appendChild(textElement);
						videoContainer.appendChild(buttonElement);
					});

					// Ajouter la vidéo au conteneur
					videoContainer.innerHTML = ''; // S'assurer que le conteneur est vide avant d'ajouter la vidéo
					videoContainer.appendChild(video);

					// Afficher le conteneur et le positionner au-dessus de tout
					videoContainer.style.display = 'block';
					videoContainer.style.position = 'fixed'; // Position fixe pour couvrir toute la fenêtre
					videoContainer.style.top = '0';
					videoContainer.style.left = '0';
					videoContainer.style.zIndex = '1000'; // Un z-index élevé pour être au-dessus de tout
					videoContainer.style.backgroundColor = 'black'; // Fond noir pour éviter les artefacts

				}
			})
			.catch(error => {return null;});
	});

	/* ------ Pour vérifier si le user/email est valide et est non pris ------ */

	// Fonction générique pour gérer la vérification du pseudo
	function verifiervaliditeelmt(baliseInput, chemin_fetch, taken_bool) {
		const baliseContent = baliseInput.value.trim();

		if (baliseContent.length > 0) {
			// Effectuer la requête AJAX pour vérifier si le pseudo est disponible
			fetch(`${chemin_fetch}=${baliseContent}`)
				.then(response => response.json())
				.then(data => {
					// Mise à jour de l'interface utilisateur selon la disponibilité
					if (data.is_taken) {
						taken_bool.value = true;
					} else {
						taken_bool.value = false;
					}
				})
				.catch(error => {
					return null;
				});
		}
	}

	let is_s_user_len_ok = {value: true};
	let is_s_pseudo_len_ok = {value: true};
	let is_s_email_len_ok = {value: true};

	let s_user_whitespaces_found = {value: false};
	let s_pseudo_whitespaces_found = {value: false};
	let s_email_whitespaces_found = {value: false};

	let is_s_user_already_taken = {value: false};
	let is_s_pseudo_already_taken = {value: false};
	let is_s_email_already_taken = {value: false};

	let is_email_valid = {value: true};

	/* Pour tester les whitespaces */

	function containsWhitespace(value) {
	return /\s/.test(value); 
	}

	/* Pour le user */

	const SusernameInput = document.getElementById("s-username");

	function TestValidity(InputBalise, fetch_url, bool_taken, bool_is_ok, bool_whitespace)
	{
		if (containsWhitespace(InputBalise.value)){
			bool_whitespace.value = true;
		}
		else {
			bool_whitespace.value = false;
		}

		if (InputBalise.value.length > 24) {
			is_s_user_len_ok.value = false;
		}
		else {
			is_s_user_len_ok.value = true;
		}

		verifiervaliditeelmt(InputBalise,
			fetch_url,
			bool_taken);
	}

	function TextColorStatus(InputBalise, bool_taken, bool_is_ok, bool_whitespace)
	{
		if (bool_taken.value === true          ||
				bool_is_ok.value === false     ||
				bool_whitespace.value === true)
		{
			InputBalise.style.color = "red";
		}
		else {
			InputBalise.style.color = "black";
		}
	}

	SusernameInput.addEventListener('keyup', function() {
		
		TestValidity(SusernameInput,
			'check_username/?username',
			is_s_user_already_taken,
			is_s_user_len_ok,
			s_user_whitespaces_found);
	});

	/* Pour l email */

	function validateEmail(email) {
		const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
		return emailPattern.test(email);
	}

	const SemailInput = document.getElementById("s-email");

	SemailInput.addEventListener('keyup', function() {

		TestValidity(SemailInput,
			'check_email/?email',
			is_s_email_already_taken,
			is_s_email_len_ok,
			s_email_whitespaces_found);

		is_email_valid.value = validateEmail(SemailInput.value);
		if (SemailInput.value.trim() === '')
			is_email_valid.value = true;
	});

	const SpseudoInput = document.getElementById("s-pseudo");

	SpseudoInput.addEventListener('keyup', function() {

		TestValidity(SpseudoInput,
			'check_pseudo/?pseudo',
			is_s_pseudo_already_taken,
			is_s_pseudo_len_ok,
			s_pseudo_whitespaces_found);
	});

	function ActiveTextStatusColoration()
	{
		TextColorStatus(SusernameInput,
			is_s_user_already_taken,
			is_s_user_len_ok,
			s_user_whitespaces_found);

		TextColorStatus(SemailInput,
			is_s_email_already_taken,
			is_s_email_len_ok,
			s_email_whitespaces_found);

		TextColorStatus(SpseudoInput,
			is_s_pseudo_already_taken,
			is_s_pseudo_len_ok,
			s_pseudo_whitespaces_found);
	}


	/* Fonction pour checker si les champs sont valides et changer l'état du bouton en conséquence  */

	function button_update_save_status() {

		if (is_s_user_len_ok.value === false            ||
			is_s_email_len_ok.value === false           ||
			is_s_pseudo_len_ok.value === false          ||

			is_s_user_already_taken.value === true      ||
			is_s_email_already_taken.value === true     ||
			is_s_pseudo_already_taken.value === true    ||
			
			s_user_whitespaces_found.value === true     ||
			s_pseudo_whitespaces_found.value === true   ||
			s_email_whitespaces_found.value === true    ||
			
			is_email_valid.value === false)
		{
			buttonUpdateSave.disabled = true;
		}
		else
		{
			buttonUpdateSave.disabled = false;
		}

		if (update_var.value === true)
			ActiveTextStatusColoration();
	}

	SettingsTimeout = setInterval(button_update_save_status, 100);
}