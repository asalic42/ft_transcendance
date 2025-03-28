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
		var avatar_file = event.target.files[0];
	
		if (!avatar_file) {
			alert('Veuillez choisir un fichier d\'avatar.');
			return;
		}
	
		// Vérification du format (PNG ou JPG)
		var allowed_extensions = ['.png', '.jpg', '.jpeg'];
		var file_extension = avatar_file.name.split('.').pop().toLowerCase();
		
		if (!allowed_extensions.includes('.' + file_extension)) {
			alert('❌ Format de fichier non supporté. Utilisez .png ou .jpg.');
			return;
		}
	
		// Vérification de la taille (max 4 Mo)
		var max_size = 4 * 1024 * 1024; // 4 Mo en octets
		if (avatar_file.size > max_size) {
			alert('❌ Le fichier est trop lourd (max 4 Mo).');
			return;
		}
	
		// Envoi du fichier si tout est valide
		var formData = new FormData();
		formData.append('avatar', avatar_file);
		formData.append('csrfmiddlewaretoken', getCSRFToken());
	
		$.ajax({
			url: '/user-settings/upload-avatar/',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: function(response) {
				if (response.status === 'success') {
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
			bool_is_ok.value = false;
		}
		else {
			bool_is_ok.value = true;
		}

		verifiervaliditeelmt(InputBalise,
			fetch_url,
			bool_taken);
	}

	function TextColorStatus(InputBalise, bool_taken, bool_is_ok, bool_whitespace, bool_m)
	{
		if (bool_taken.value === true          ||
				bool_is_ok.value === false     ||
				bool_whitespace.value === true ||
				bool_m === false)
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
			s_user_whitespaces_found, true);

		TextColorStatus(SemailInput,
			is_s_email_already_taken,
			is_s_email_len_ok,
			s_email_whitespaces_found, is_email_valid.value);

		TextColorStatus(SpseudoInput,
			is_s_pseudo_already_taken,
			is_s_pseudo_len_ok,
			s_pseudo_whitespaces_found, true);
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