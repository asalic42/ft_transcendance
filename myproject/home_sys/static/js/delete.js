function delete_acc() {
// List of image paths
	

	// Pick a random image
	const randomImage = images[Math.floor(Math.random() * images.length)];

	// Set the 'src' of the img tag
	document.getElementById('randomImage').src = randomImage;

	// Récupérer les éléments
	const button = document.querySelector('.button-delete-2');
	const hiddenElement = document.getElementById('map');
	const spanText = document.querySelector('.partie-text');
	const testTest = document.querySelector('.test-test');

	// Ajouter un événement mouseover pour afficher l'élément
	button.addEventListener('mouseover', function() {
		hiddenElement.style.opacity = '1'; // Affiche l'élément
		hiddenElement.style.pointerEvents = 'auto';
		spanText.style.color = '#000000';
		spanText.style.fontWeight = 'bold';
		spanText.style.fontSize = '18px';
		testTest.style.marginTop = "-70px";
		testTest.style.opacity = "0";
		testTest.style.pointerEvents = "none";
	});
	 // Fonction pour obtenir la localisation de l'IP via l'API ipinfo.io
	fetch('get-ip-info/')  // Remplacez "YOUR_API_KEY" par votre clé API gratuite
	 .then(response => response.json())
	 .then(data => {
	   const ipLocation = data.loc.split(',');
	   const latitude = parseFloat(ipLocation[0]);
	   const longitude = parseFloat(ipLocation[1]);
	 
	   // Initialisation de la carte Leaflet
	   const map = L.map('map').setView([latitude, longitude], 13);
	 
	   // Ajout d'un fond de carte (OpenStreetMap)
	   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		 attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	   }).addTo(map);
   
	   // Ajout d'un marqueur à la localisation de l'utilisateur
	   L.marker([latitude, longitude]).addTo(map)
		 .bindPopup('You are just here 😈.')
		 .openPopup();
	 })
	 .catch(error => {
	   console.error("Erreur lors de la récupération des données IP :", error);
	 });
}