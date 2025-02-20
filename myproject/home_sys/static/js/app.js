// Securite CSRF cookies
function getTokenCSRF() {
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

document.addEventListener("DOMContentLoaded", function () {

    // Load la page
    // In app.js, update the loadPage function:
	function loadPage(url, pushState = true) {
		// Nettoyage de l'URL pour éviter les chemins répétitifs
		let cleanUrl = url.replace(/^\/+|\/+$/g, ''); // Enlève les slashes au début et à la fin
		cleanUrl = cleanUrl.replace(/^accounts\//, ''); // Enlève 'accounts/' au début s'il existe
		
		// Construction de l'URL finale
		const finalizedUrl = '/accounts/' + cleanUrl;
		
		console.log(`Original URL: ${url}, Cleaned URL: ${cleanUrl}, Final URL: ${finalizedUrl}`);
		
		fetch(finalizedUrl, { 
			headers: {
				"X-Requested-With": "XMLHttpRequest",
				"X-CSRFToken": getTokenCSRF()
			},
			credentials: 'include'
		})
		.then(response => response.text())
		.then(html => {
			let parser = new DOMParser();
			let doc = parser.parseFromString(html, "text/html");
			let newContent = doc.getElementById("content");
	
			if (!newContent) {
				window.location.href = finalizedUrl;
				return;
			}
	
			document.getElementById("content").innerHTML = newContent.innerHTML;
	
			// Re-execute scripts
			Array.from(doc.querySelectorAll('script')).forEach(oldScript => {
				const newScript = document.createElement('script');
				if (oldScript.src) {
					newScript.src = oldScript.src;
					newScript.async = false;
				} else {
					newScript.textContent = oldScript.textContent;
				}
				document.body.appendChild(newScript).parentNode.removeChild(newScript);
			});
	
			// Utilise l'URL nettoyée pour l'historique
			if (pushState) history.pushState(null, "", finalizedUrl);
		})
		.catch(error => console.error("Erreur de chargement:", error));
	}

    function handleLinkClick(event) {
        const link = event.target.closest("a");
        if (link && link.getAttribute('href') && !link.hasAttribute("data-full-reload")) {
            event.preventDefault(); //Empeche le rechargement de toute la page


            // let basePath = "/accounts/";  // Base fixe de l'URL
            let urlPath = link.getAttribute("href").replace(/^\/+/, ""); // Supprime les `/` en trop au début
            
            // let finalUrl = basePath;
            // if (!urlPath.startsWith("accounts/"))
            let finalUrl = urlPath; // Construit l'URL proprement
            loadPage(finalUrl);
        }
    }
    
    // Formulaire de connexion
    function handleFormSubmit(event) {
        event.preventDefault();

        const form = event.target.closest("form");
        if (!form) return;

        if (form.id === "LevelForm") {
            const level = form.elements.levelfield.value;
            console.log("level: ", level);
            levelinput(level);  // Démarre le jeu avec la bonne difficulté
            return;  // On arrête ici pour éviter le fetch
        }

        const formData = new FormData(form);

        fetch(form.action, {
            method: form.method,
            body: formData,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": getTokenCSRF()
            }

        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else if (data.html) {
                document.getElementById("content").innerHTML = data.html;
                history.pushState(null, "", data.redirect);
            } else if (data.redirect) {
                loadPage(data.redirect);
            }
        })
        .catch(error => console.error("Erreur d’envoi:", error));
    }

    document.body.addEventListener("click", handleLinkClick);
    document.body.addEventListener("submit", handleFormSubmit);

    window.addEventListener("popstate", function () {
        loadPage(location.pathname, false);
    });
});