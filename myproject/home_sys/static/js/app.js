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

var waschan = false;
var wasNotif = false;
var wasSettings = false;
var washome = false;

var gameDistant = false;
var gameRoom = false;
var gamePong = false;
var gameCasseBrique = false;
var gameBot = false;
var gameCasseBriqueDistant = false;
var gameCasseBriqueDistantRoom = false;

window.socket_t = null;

// Sécurité CSRF cookies

// Normalize URL paths - make sure they start with a single '/'
function normalizeUrl(url) {
    // If it's already a full URL with protocol and domain
    
    if (url.includes('://')) {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname; // Just get the path component
        } catch (e) {
            console.error("Invalid URL:", url);
            return '/';
        }
    }
    // For relative paths, ensure they start with a single '/'
    let cleanedUrl = url.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    let normalizedPath = cleanedUrl ? '/' + cleanedUrl : '/';
    return normalizedPath;
}

async function gameCasseBriqueDistantRoute() {
    console.log('gameCasseBriqueDistantRoute');
    if (!window.CBRoomGameManager) {
        await new Promise(resolve => {
            const checkEl = () => {
                if (document.getElementById('rooms-list'))
                    resolve();
                else
                setTimeout(checkEl, 50);
            };
            checkEl();
        });
    }
    new CBRoomGameManager();
}

async function gameCasseBriqueRoute() {
    if (window.CasseBriqueGame) window.CasseBriqueGame = null;

    if (!window.CasseBriqueGame) {
        await new Promise(resolve => {
            const checkEl = () => {
                if (document.getElementById('mapSelection'))
                    resolve();
                else
                setTimeout(checkEl, 50);
            };
            checkEl();
        });
    }
    new CasseBriqueGame();
}

async function gameRoute() {
    if (!window.PongGame) {
        await new Promise(resolve => {
            const checkEl = () => {
                if (document.getElementById('canvas-container'))
                    resolve();
                else
                setTimeout(checkEl, 50);
            };
            checkEl();
        });
    }
    new PongGame();
    PongGame.currentGame.initGame();
}

async function gameDistantRoute() {
    if (!window.RoomGameManager) {
        await new Promise(resolve => {
            const checkEl = () => {
                if (document.getElementById('rooms-list'))
                    resolve();
                else
                setTimeout(checkEl, 50);
            };
            checkEl();
        });
    }
    new RoomGameManager();
}

let liveChanTimeout;
let SettingsTimeout;
let liveChat;
let homefetch;
let notiffetch;
let if_tournament;
window.game_id_t = 0;
window.id_t_t = 0;
// Ajouter une variable globale pour tracker les scripts chargés

// Exposer loadPage au scope global
window.loadPage = function(url, pushState = true) {

    // Normalize the URL to prevent duplication
    const normalizedUrl = normalizeUrl(url);

    // Vérifier si on est sur la page de login ou non
    const isLoginPage = normalizedUrl === '/' || normalizedUrl === '';
    const navbar = document.querySelector('.navbar');

    // Set navbar visibility before loading content
    if (navbar) {
        navbar.style.display = isLoginPage ? 'none' : 'flex';
        
        // Force browser to acknowledge the style change
        void navbar.offsetWidth;
    }

    return fetch(normalizedUrl, { 
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

        if (!newContent)
        {
            console.error("No content element found in response HTML");
            // window.location.href = normalizedUrl;
            return;
        }
        
        document.getElementById("content").innerHTML = newContent.innerHTML;
        
		if (pushState) history.pushState(null, "", normalizedUrl);
        
        // Double-check navbar visibility after content is loaded
        const currentPath = window.location.pathname;
        const isLoginPageNow = currentPath === '/' || currentPath === '';
        if (navbar)
            {
                navbar.style.display = isLoginPageNow ? 'none' : 'flex';
                
                // Force browser to acknowledge the style change
                void navbar.offsetWidth;
            }
            
		const profileName = document.getElementById('accounts_link').href;
		if ((/^https:\/\/[^/]+\/profile\/.+$/.test(url) || /\/profile\/.+$/.test(url) )&& url != profileName)
			launch_profile();

		if (url === `https://${window.location.host}/deleteAccount/` || url === '/deleteAccount/')
			delete_acc();
		
		if (waschan) {
			clearTimeout(liveChanTimeout);
			clearInterval(liveChat);
			waschan = false;
		}
		if (url === `https://${window.location.host}/channels/` || url === '/channels/') {
            launch_everything();
            waschan = true;
        }

		if (wasSettings){
			clearTimeout(SettingsTimeout);
			wasSettings = false;
		}
		else if (url === `https://${window.location.host}/user-settings/` || url === '/user-settings/') {
			launch_settings();
			wasSettings = true;
		}

        // Home Page
		if (washome)
		{
			clearInterval(homefetch);
			washome = false;
		}
        else if (url === `https://${window.location.host}/home/` || url === '/home/')
        {
            fetchAllUsersStatus();
            washome = true;
        }

        if (url.includes("/game-distant-choice")) {
            gameRoom = true;
            gameDistantRoute();
            return ;
        }
        else if (gameRoom) {
            window.RoomGameManager = null;
            gameRoom = false;
            return ;
        }

        if (url.includes("/game-distant/")) {
            if (!gameDistant) {
                const pathParts = window.location.pathname.split('/');
                new PongDistantGame(pathParts[2], pathParts[3]);
            }
            else if (if_tournament) {
				new PongDistantGame(window.game_id_t, window.id_t_t);
            }
			gameDistant = true;
            return ;
        }
        else if (gameDistant && PongDistantGame.currentGame) {
			PongDistantGame.currentGame.closeSocket();
            gameDistant = false;
            return ;
        }
        
        if (wasNotif)
        {
            clearInterval(notiffetch);
            wasNotif = false;
        }
        if (url === `https://${window.location.host}/notifications/` || url === '/notifications/')
        {
            connectWebSocket_notif_page();
            wasNotif = true;
        }

        // PROBLEME !!!
        if (url === `https://${window.location.host}/game/` || url == '/game/') {
            gamePong = true;
            gameRoute();
            return ;
        }
        else if (gamePong) {
			window.PongGame = null;
            gamePong = false;
            return ;
        }

        if (url.includes("/tournament/")) {
			// Recharger le contenu du tournoi pour réinitialiser le DOM
			if_tournament = true;
			launch_tournament(); // Réinitialiser les listeners WebSocket
		}
        else if (if_tournament && !(url.includes("/game-distant/"))) {
			window.socket_t.close();
			window.socket_t = null
			if_tournament = false;
		}

        if (url.includes('/other_game/')) {
            gameCasseBrique = true;
            gameCasseBriqueRoute();
        }
        else if (gameCasseBrique) {
			window.CasseBriqueGame = null;
            gameCasseBrique = false;
        }

        if (url.includes(`/other_game_multi_room/`)) {
            gameCasseBriqueDistantRoom = true;
            gameCasseBriqueDistantRoute();
        }
        else if (url.includes(`/other_game_multi/`)) {
            gameCasseBriqueDistant = true;
            const pathParts = window.location.pathname.split('/');
            new CasseBriqueDistantGame(pathParts[2], pathParts[3]);
        }
        else if (gameCasseBriqueDistant && CasseBriqueDistantGame.currentGame) {
            CasseBriqueDistantGame.currentGame.closeSocket();
            gameCasseBriqueDistant = false;
            window.CasseBriqueGame = null;
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
        navbar.style.display = isLoginPageNow ? 'none' : 'flex';
    }
};

// Single function to handle all link clicks for SPA navigation
function handleLinkClick(event) {
    let link = event.target.closest("a");
    // Process only if it's a link, has href, is same origin, and doesn't have data-full-reload
    if (link && link.href && 
        (new URL(link.href).origin === window.location.origin) && 
        !link.hasAttribute("data-full-reload") &&
        !link.hasAttribute("data-spa-ignore")) {
        
        event.preventDefault();
		if (if_tournament && !(link.href.includes("/game-distant/"))) {
			window.socket_t.onclose = function() {};
		}
        loadPage(link.href);

    }
}

// Handle form submissions
function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target.closest("form");
    if (!form) return;
    
    // Skip special forms that have their own handlers
    if (form.id === "id-signin-form" || form.id === "id-signup-form") {
        return;
    }

    if (form.id === "LevelForm") {
        loadPage(location.pathname).then(() => {
            const level = form.elements.levelfield.value;
            const bot_game = new BotGame(level);
            bot_game.start();
        });
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
        
        if (navbar) {
            navbar.style.display = isLoginPage ? 'none' : 'flex';
        }
		loadPage(window.location.pathname, false);	
    });

    // Initial navbar setup
    const currentUrl = window.location.pathname;
    const isLoginPage = currentUrl === '/' || currentUrl === '';
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        navbar.style.display = isLoginPage ? 'none' : 'flex';
    }
	if (window.location.pathname != '/')
		loadPage(window.location.pathname, false);
});