// Recup le csrf token definit plus tot dans le code
function getCSRFToken() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';
}

var waschan = false;
let liveChanTimeout;

document.addEventListener("DOMContentLoaded", function () {

    // Ajoute /accounts/ si absent
    function prependAccounts(url) {
        let cleanedUrl = url.replace(/^\/+|\/+$/g, ''); // Nettoie les slashs
        return cleanedUrl.startsWith('accounts/') ? '/' + cleanedUrl : '/accounts/' + cleanedUrl;
    }

    // Fonction de chargement de page via fetch
    // Fonction de chargement de page via fetch
    // Ajouter une variable globale pour tracker les scripts chargés
    let loadedScripts = [];
    
    // Fonction de chargement de page via fetch (modifiée)
    function loadPage(url, pushState = true) {
        // Supprimer les anciens scripts avant de charger la nouvelle page
    
        if (url != "accounts/" && url != "/accounts/")
            var finalizedUrl = prependAccounts(url);
        else
            var finalizedUrl = url.replace(/^\/+|\/+$/g, '');
    
        fetch(finalizedUrl, { 
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": getCSRFToken()
            },
            credentials: 'include'
        })
        .then(response => response.text())
        .then(html => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, "text/html");
            let newContent = doc.getElementById("content");
    
			// window.location.hash = finalizedUrl;
            if (!newContent) {
                window.location.href = finalizedUrl;
                return;
            }
    
            document.getElementById("content").innerHTML = newContent.innerHTML;
    
            // Gestion des scripts
        })
        .then(() => {
            if (document.getElementById('mapSelection')) {
                initializeMapButtons();
            }
            if (pushState) history.pushState(null, "", finalizedUrl);
			if (url === "/accounts/channels") {
				launch_everything();
				waschan = true;
			}
			else if (waschan){
				clearTimeout(liveChanTimeout);
				waschan = false;
			}
        })
        .catch(error => console.error("Erreur de chargement:", error));
    }

    function handleLinkClick(event) {
        const link = event.target.closest("a");
        if (link && link.getAttribute('href') && !link.hasAttribute("data-full-reload")) {
            event.preventDefault();
            let urlPath = prependAccounts(link.getAttribute("href"));
            loadPage(urlPath);
        }
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target.closest("form");
        if (!form) return;

        // Cas particulier si besoin (exemple pour LevelForm)
        if (form.id === "LevelForm") {
            const level = form.elements.levelfield.value;
            levelinput(level);
            return;
        }

        const formData = new FormData(form);
        const actionUrl = prependAccounts(form.action);

        fetch(actionUrl, {
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
                history.pushState(null, "", prependAccounts(data.redirect || form.action));
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