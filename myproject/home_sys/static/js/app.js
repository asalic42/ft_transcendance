function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

document.addEventListener("DOMContentLoaded", function () {

    // Load la page
	function loadPage(url, pushState = true) {
		// Nettoyage de l'URL pour éviter les chemins répétitifs
		var finalizedUrl = "";
		if (url != "accounts/") {
			let cleanUrl = url.replace(/^\/+|\/+$/g, ''); // Enlève les slashes au début et à la fin
			cleanUrl = cleanUrl.replace(/^accounts\//, ''); // Enlève 'accounts/' au début s'il existe
			
			// Construction de l'URL finale
			finalizedUrl = '/accounts/' + cleanUrl;
		}
		else {finalizedUrl = "/" + url;}
		fetch(finalizedUrl, { 
			headers: {
				"X-Requested-With": "XMLHttpRequest",
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
	
            reloadScripts(newContent);

			// Utilise l'URL nettoyée pour l'historique
			if (pushState) history.pushState(null, "", finalizedUrl);
		})
		.catch(error => console.error("Erreur de chargement:", error));
	}

    // Recharge les scripts non-detectes mais ne prends pas en compte les scripts inline (pas secure de les evaluer)
    function reloadScripts(container) {
        if (!container) return;

        document.querySelectorAll("script[src]").forEach(script => script.remove());
        // const existingScripts = new Set(Array.from(document.querySelectorAll('script')).map(s => s.src));

        Array.from(container.querySelectorAll('script')).forEach(oldscript => {
            const newScript = document.createElement('script');
            if (oldscript.src) {
                newScript.src = oldscript.src;
                newScript.async = false;
                document.body.appendChild(newScript);
            } else {
                newScript.textContent = oldscript.textContent;
                document.body.appendChild(newScript);
            }
        });
    }

    function handleLinkClick(event) {
        const link = event.target.closest("a");
        if (link && link.getAttribute('href') && !link.hasAttribute("data-full-reload")) {
            event.preventDefault(); //Empeche le rechargement de toute la page

            let urlPath = link.getAttribute("href").replace(/^\/+/, ""); // Supprime les `/` en trop au début
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