
// Sécurité CSRF cookies
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
        loadedScripts.forEach(script => script.remove());
        loadedScripts = []; // Réinitialiser le tableau
    
        if (url != "accounts/" && url != "/accounts/")
            var finalizedUrl = prependAccounts(url);
        else
            var finalizedUrl = url.replace(/^\/+|\/+$/g, '');
    
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
    
            // Gestion des scripts
            const scriptPromises = [];
            Array.from(doc.querySelectorAll('script')).forEach(oldScript => {
                const newScript = document.createElement('script');
                if (oldScript.src) {
                    newScript.src = oldScript.src;
                    newScript.async = false;
                    const promise = new Promise((resolve, reject) => {
                        newScript.onload = () => {
                            resolve();
                        };
                        newScript.onerror = reject;
                    });
                    scriptPromises.push(promise);
                } else {
                    newScript.textContent = oldScript.textContent;
                    scriptPromises.push(Promise.resolve());
                }
                document.body.appendChild(newScript);
                loadedScripts.push(newScript); // Stocker la référence
            });
    
            return Promise.all(scriptPromises);
        })
        .then(() => {
            if (document.getElementById('mapSelection')) {
                initializeMapButtons();
            }
            if (pushState) history.pushState(null, "", finalizedUrl);
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
