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

// Ajoute / si absent
function prependAccounts(url) {
    let cleanedUrl = url.replace(/^\/+|\/+$/g, ''); // Nettoie les slashs
    return cleanedUrl.startsWith('') ? '/' + cleanedUrl : '/' + cleanedUrl;
}

// Ajouter une variable globale pour tracker les scripts chargés
let loadedScripts = [];

// Exposer loadPage au scope global
window.loadPage = function(url, pushState = true) {
    loadedScripts.forEach(script => script.remove());
    loadedScripts = []; // Réinitialiser le tableau

    if (url != "" && url != "/")
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
        
        // Exécuter les scripts
        Array.from(newContent.querySelectorAll('script')).forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            document.body.appendChild(newScript);
            loadedScripts.push(newScript);
        });
        
        // Réinitialiser les contrôleurs d'événements
        reinitCoreScripts();
        
        if (pushState) history.pushState(null, "", finalizedUrl);
    })
    .catch(error => console.error("Erreur de chargement:", error));
};

// Fonction centrale pour gérer toute la navigation SPA
function initSPANavigation() {
    // Intercepter tous les clics sur les liens
    document.body.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && link.origin === location.origin) {
            e.preventDefault();
            loadPage(link.href);
        }
    });

    // Gérer le retour/avant navigateur
    window.addEventListener('popstate', function() {
        loadPage(location.href);
    });
}

// Exposer reinitCoreScripts au scope global
window.reinitCoreScripts = function() {
    // Réinitialiser les composants spécifiques ici
    initSPANavigation(); 
};

document.addEventListener("DOMContentLoaded", function () {
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

        console.log("FORM ID : ", form.id);

        // Cas particulier si besoin (exemple pour LevelForm)
        if (form.id === "LevelForm") {
            const level = form.elements.levelfield.value;
            levelinput(level);
            return;
        }

        if (form.id === "id-signin-form" || form.id === "id-signup-form")
            return;

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
        .catch(error => console.error("Erreur d'envoi:", error));
    }

    document.body.addEventListener("click", handleLinkClick);
    document.body.addEventListener("submit", handleFormSubmit);

    window.addEventListener("popstate", function () {
        loadPage(location.pathname, false);
    });
});