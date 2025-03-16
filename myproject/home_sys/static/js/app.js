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

// Ajouter une variable globale pour tracker les scripts chargés
let loadedScripts = [];

// Exposer loadPage au scope global
window.loadPage = function(url, pushState = true) {
    // Remove previously loaded scripts
    loadedScripts.forEach(script => script.remove());
    loadedScripts = []; // Réinitialiser le tableau
    
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
            console.error("No content element found in response HTML");
            window.location.href = normalizedUrl;
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
            "X-CSRFToken": getTokenCSRF()
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