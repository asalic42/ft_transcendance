// Sécurité CSRF cookies
function getCSRFToken() {
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

// Normalize URL paths - make sure they start with a single '/'
function normalizeUrl(url) {
    // If it's already a full URL with protocol and domain
    console.log("Processing URL:", url);
    
    if (url.includes('://')) {
        try {
            const urlObj = new URL(url);
            console.log("Normalized URL (full):", urlObj.pathname);
            return urlObj.pathname; // Just get the path component
        } catch (e) {
            console.error("Invalid URL:", url);
            return '/';
        }
    }
    // For relative paths, ensure they start with a single '/'
    let cleanedUrl = url.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    let normalizedPath = cleanedUrl ? '/' + cleanedUrl : '/';
    console.log("Normalized URL (relative):", normalizedPath);
    return normalizedPath;
}
    
/* ----------------------------------- AWE-GAME-RAPH ----------------------------------------- */

// Recup le csrf token definit plus tot dans le code
/* function getCSRFToken() {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';
} */

var waschan = false;
let liveChanTimeout;

/* document.addEventListener("DOMContentLoaded", function () {

    // Ajoute /accounts/ si absent
    function prependAccounts(url) {
        let cleanedUrl = url.replace(/^\/+|\/+$/g, ''); // Nettoie les slashs
        return cleanedUrl.startsWith('accounts/') ? '/' + cleanedUrl : '/accounts/' + cleanedUrl;
    }

    // Fonction de chargement de page via fetch
    // Fonction de chargement de page via fetch
    // Ajouter une variable globale pour tracker les scripts chargés
    
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
}); */

/* ----------------------------------- [FIN] AWE-GAME-RAPH ----------------------------------------- */
    

// Ajouter une variable globale pour tracker les scripts chargés
/* let loadedScripts = []; */

// Exposer loadPage au scope global
window.loadPage = function(url, pushState = true) {
    // Remove previously loaded scripts
    /* loadedScripts.forEach(script => script.remove());
    loadedScripts = []; // Réinitialiser le tableau */
    
    // Normalize the URL to prevent duplication
    const normalizedUrl = normalizeUrl(url);
    
    // Vérifier si on est sur la page de login ou non
    const isLoginPage = normalizedUrl === '/' || normalizedUrl === '';
    const navbar = document.querySelector('.navbar');
    
    // Debug logs
    console.log("Loading page:", normalizedUrl);
    console.log("isLoginPage detected as:", isLoginPage);
    console.log("navbar element exists:", navbar !== null);
    
    // Set navbar visibility before loading content
    if (navbar) {
        console.log("Current navbar display style:", navbar.style.display);
        console.log("Setting navbar display to:", isLoginPage ? 'none' : 'flex');
        navbar.style.display = isLoginPage ? 'none' : 'flex';
        
        // Force browser to acknowledge the style change
        void navbar.offsetWidth;
    }
    
    fetch(normalizedUrl, { 
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

        if (!newContent) {
            console.error("No content element found in response HTML");
            window.location.href = normalizedUrl;
            return;
        }
        
        document.getElementById("content").innerHTML = newContent.innerHTML;
        
        // Exécuter les scripts
        /* Array.from(newContent.querySelectorAll('script')).forEach(oldScript => {
            const newScript = document.createElement('script');
            if (oldScript.src) {
                newScript.src = oldScript.src;
            } else {
                newScript.textContent = oldScript.textContent;
            }
            document.body.appendChild(newScript);
            loadedScripts.push(newScript);
        }); */
        
        // Update browser history if requested
        if (pushState) {
            history.pushState(null, "", normalizedUrl);
        }
        
        // Double-check navbar visibility after content is loaded
        const currentPath = window.location.pathname;
        const isLoginPageNow = currentPath === '/' || currentPath === '';
        if (navbar) {
            console.log("After content loaded - Setting navbar display to:", isLoginPageNow ? 'none' : 'flex');
            navbar.style.display = isLoginPageNow ? 'none' : 'flex';
            
            // Force browser to acknowledge the style change
            void navbar.offsetWidth;
        }

        if (document.getElementById('mapSelection')) {
            initializeMapButtons();
        }
        if (pushState) history.pushState(null, "", normalizedUrl);
        
        const target_url = `https://${window.location.host}/channels/`;

        if (url === target_url) {
            launch_everything();
            waschan = true;
        }
        else if (waschan){
            clearTimeout(liveChanTimeout);
            waschan = false;
        }
    })
    .catch(error => console.error("Erreur de chargement:", error));
};

// Exposer reinitCoreScripts au scope global - but don't re-attach event handlers
window.reinitCoreScripts = function() {
    // Initialize any components, but don't re-attach the same event listeners
    // This prevents duplicate handlers
    
    // Force navbar display based on current URL
    const currentPath = window.location.pathname;
    const isLoginPageNow = currentPath === '/' || currentPath === '';
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        console.log("Reinit - Setting navbar display to:", isLoginPageNow ? 'none' : 'flex');
        navbar.style.display = isLoginPageNow ? 'none' : 'flex';
    }
};

// Single function to handle all link clicks for SPA navigation
function handleLinkClick(event) {
    const link = event.target.closest("a");
    
    // Process only if it's a link, has href, is same origin, and doesn't have data-full-reload
    if (link && link.href && 
        (new URL(link.href).origin === window.location.origin) && 
        !link.hasAttribute("data-full-reload") &&
        !link.hasAttribute("data-spa-ignore")) {
        
        event.preventDefault();
        loadPage(link.href);
    }
}

// Handle form submissions
function handleFormSubmit(event) {
    const form = event.target.closest("form");
    if (!form) return;
    
    // Skip special forms that have their own handlers
    if (form.id === "id-signin-form" || form.id === "id-signup-form") {
        return;
    }
    
    // Special case for LevelForm if needed
    if (form.id === "LevelForm") {
        event.preventDefault();
        const level = form.elements.levelfield.value;
        if (typeof levelinput === 'function') {
            levelinput(level);
        }
        return;
    }
    
    // Handle standard form submissions
    event.preventDefault();
    const formData = new FormData(form);
    const actionUrl = normalizeUrl(form.action);

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
            document.getElementById("content").innerHTML = data.html;
            history.pushState(null, "", normalizeUrl(data.redirect || form.action));
            
            // Force navbar display after form submission
            const currentPath = window.location.pathname;
            const isLoginPageNow = currentPath === '/' || currentPath === '';
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                navbar.style.display = isLoginPageNow ? 'none' : 'flex';
            }
        } else if (data.redirect) {
            loadPage(data.redirect);
        }
    })
    .catch(error => console.error("Erreur d'envoi:", error));
}

// Initialize the SPA navigation only once when the document loads
document.addEventListener("DOMContentLoaded", function() {
    // Attach event handlers only once
    document.body.addEventListener("click", handleLinkClick);
    document.body.addEventListener("submit", handleFormSubmit);

    // Modifiez le gestionnaire popstate existant
    window.addEventListener("popstate", function() {
        // Vérifier si on est sur la page de login
        const currentUrl = window.location.pathname;
        const isLoginPage = currentUrl === '/' || currentUrl === '';
        const navbar = document.querySelector('.navbar');
        
        console.log("popstate - Current URL:", currentUrl);
        console.log("popstate - Is login page:", isLoginPage);
        
        if (navbar) {
            console.log("popstate - Setting navbar display to:", isLoginPage ? 'none' : 'flex');
            navbar.style.display = isLoginPage ? 'none' : 'flex';
        }
        
        loadPage(window.location.pathname, false);
    });

    // Initial navbar setup
    const currentUrl = window.location.pathname;
    const isLoginPage = currentUrl === '/' || currentUrl === '';
    const navbar = document.querySelector('.navbar');
    
    console.log("Initial load - Current URL:", currentUrl);
    console.log("Initial load - Is login page:", isLoginPage);
    
    if (navbar) {
        console.log("Initial load - Setting navbar display to:", isLoginPage ? 'none' : 'flex');
        navbar.style.display = isLoginPage ? 'none' : 'flex';
    }
});