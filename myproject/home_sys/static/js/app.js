// Recup le csrf token definit plus tot dans le code
function getCSRFToken() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';
}

document.addEventListener("DOMContentLoaded", function () {
    // Registre des scripts déjà chargés pour éviter les doublons
    window.loadedScripts = window.loadedScripts || {
        external: new Set(), // URLs des scripts externes
        moduleVars: new Set() // Noms des variables globales créées par les scripts
    };

    // Nettoyer les variables globales explicitement
    function cleanupGlobalVars() {
        window.loadedScripts.moduleVars.forEach(varName => {
            try {
                if (window[varName]) {
                    window[varName] = null;
                    delete window[varName];
                }
            } catch (e) {
                console.warn("Impossible de nettoyer la variable:", varName);
            }
        });
        window.loadedScripts.moduleVars.clear();
    }

    // Ajoute /accounts/ si absent
    function prependAccounts(url) {
        let cleanedUrl = url.replace(/^\/+|\/+$/g, ''); // Nettoie les slashs
        return cleanedUrl.startsWith('accounts/') ? '/' + cleanedUrl : '/accounts/' + cleanedUrl;
    }

    // Fonction de chargement de page via fetch (améliorée)
    function loadPage(url, pushState = true) {
        if (url != "accounts/" && url != "/accounts/")
            var finalizedUrl = prependAccounts(url);
        else
            var finalizedUrl = url.replace(/^\/+|\/+$/g, '');

        // Nettoyage avant chargement de la nouvelle page
        cleanupGlobalVars();

        return fetch(finalizedUrl, { 
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
            
            // Nettoyage des scripts existants chargés dynamiquement
            document.querySelectorAll('script[data-dynamic="true"]').forEach(script => {
                script.remove();
            });
            
            // Mise à jour du contenu
            document.getElementById("content").innerHTML = newContent.innerHTML;

            // Initialisation de fonctions spécifiques si nécessaire
            if (document.getElementById('mapSelection')) {
                if (typeof initializeMapButtons === 'function') {
                    initializeMapButtons();
                }
            }
            
            // Traitement des nouveaux scripts
            const scriptPromises = [];
            
            Array.from(doc.querySelectorAll('script')).forEach(oldScript => {
                // Analyser le contenu du script pour identifier les variables globales
                if (!oldScript.src && oldScript.textContent) {
                    const varDeclarations = oldScript.textContent.match(/(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
                    varDeclarations.forEach(declaration => {
                        const varName = declaration.replace(/(?:var|let|const)\s+/, '');
                        window.loadedScripts.moduleVars.add(varName);
                    });
                }
                
                const newScript = document.createElement('script');
                newScript.setAttribute('data-dynamic', 'true'); // Pour identification
                
                if (oldScript.src) {
                    // Pour les scripts externes
                    const scriptUrl = oldScript.src.split('?')[0]; // URL de base sans paramètres
                    
                    // Éviter de charger le même script plusieurs fois
                    if (window.loadedScripts.external.has(scriptUrl)) {
                        return; // Sauter ce script s'il est déjà chargé
                    }
                    
                    window.loadedScripts.external.add(scriptUrl);
                    newScript.src = scriptUrl + '?t=' + Date.now(); // Cache busting
                    newScript.async = false;
                    
                    // Créer une promesse pour attendre le chargement
                    const promise = new Promise((resolve, reject) => {
                        newScript.onload = resolve;
                        newScript.onerror = reject;
                    });
                    scriptPromises.push(promise);
                } else {
                    // Pour les scripts inline, utiliser une IIFE pour isoler les variables
                    newScript.textContent = `(function() { 
                        try {
                            ${oldScript.textContent}
                        } catch (error) {
                            console.error("Erreur dans le script inline:", error);
                        }
                    })();`;
                }
                
                document.body.appendChild(newScript);
            });
            
            // Attendre le chargement de tous les scripts
            return Promise.all(scriptPromises).then(() => {
                if (pushState) history.pushState(null, "", finalizedUrl);
            });
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
            loadPage(location.pathname).then(() => {
                console.log("j'appelle BOT ici");
                // Éviter les redéclarations
                if (window.botGame) {
                    delete window.botGame;
                }
                const bot_game = new BotGame();
                bot_game.start();
            });
            return;
        }

        const formData = new FormData(form);
        const actionUrl = prependAccounts(form.action);

        fetch(actionUrl, {
            method: form.method,
            body: formData,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRFToken": getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else if (data.html) {
                // Nettoyage avant mise à jour du contenu
                cleanupGlobalVars();
                document.querySelectorAll('script[data-dynamic="true"]').forEach(script => {
                    script.remove();
                });
                
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