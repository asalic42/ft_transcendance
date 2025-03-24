// Au tout début du fichier
window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    
    if (event.reason instanceof TypeError && event.reason.message.includes('fetch')) {
        alert("Le serveur est down...");
    }
});

//console.error = () => {};

import { PongDistantGame } from './game-distant.js';
import { PongGame } from './game.js';
// import { Bot}
// import { CasseBriqueGame } from './other_game.js';



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
    
var waschan = false;
var wasNotif = false;
var wasSettings = false;
var washome = false;

var gameDistant = false;
var gameRoom = false;
var gamePong = false;
var gameCasseBrique = false;
var gameBot = false;

// Ajoute /accounts/ si absent
// function prependAccounts(url) {
//     let cleanedUrl = url.replace(/^\/+|\/+$/g, ''); // Nettoie les slashs
//     return cleanedUrl.startsWith('accounts/') ? '/' + cleanedUrl : '/accounts/' + cleanedUrl;
// }

// // Fonction de chargement de page via fetch
// async function loadPage(url, pushState = true) {
// 	if (url != "accounts/" && url != "/accounts/")
// 		var finalizedUrl = prependAccounts(url);
// 	else
// 		var finalizedUrl = url.replace(/^\/+|\/+$/g, '');

//     return fetch(finalizedUrl, { 
//         headers: {
//             "X-Requested-With": "XMLHttpRequest",
//         },
//         credentials: 'include'
//     })
//     .then(response => response.text())
//     .then(html => {
//         let parser = new DOMParser();
//         let doc = parser.parseFromString(html, "text/html");
//         let newContent = doc.getElementById("content");

//         if (!newContent) {
//             window.location.href = finalizedUrl;
//             return;
//         }
//         document.getElementById("content").innerHTML = newContent.innerHTML;

// 		if (document.getElementById('mapSelection')) {
// 			// Ensure the script has run (safety check)
// 			if (typeof initializeMapButtons === 'function') {
// 				initializeMapButtons();
// 			}
// 		}
//         // Réexécution des scripts intégrés
// 		Array.from(doc.querySelectorAll('script')).forEach(oldScript => {
// 			const newScript = document.createElement('script');
//             newScript.type = oldScript.type || 'module';
// 			if (oldScript.src) {
// 				// Add cache-buster to prevent stale scripts
// 				newScript.src = oldScript.src + '?t=' + Date.now();
// 				newScript.async = false;
// 			} else {
// 			    newScript.textContent = oldScript.textContent;
// 			}
// 			document.body.appendChild(newScript);
// 			// Remove the script after execution to avoid clutter
// 			newScript.onload = () => newScript.remove();
// 		});

//         if (pushState) history.pushState(null, "", finalizedUrl);
//     })
//     .catch(error => console.error("Erreur de chargement:", error));
// }

// async function handleLinkClick(event) {
//     const link = event.target.closest("a");

//         if (link && link.getAttribute('href') && !link.hasAttribute("data-full-reload")) {
//             event.preventDefault();
//             let urlPath = prependAccounts(link.getAttribute("href"));
//             console.log("url = ", urlPath);
//             loadPage(urlPath);
                
//             if (urlPath.includes("game-distant-choice")) {
//                 gameRoom = true;
//                 await gameDistantRoute();
//             }
//             else if (urlPath.includes("/game-distant/")) {
//                 gameDistant = true;
//             }
//             else if (urlPath === '/accounts/game' || urlPath === '/accounts/game/') {
//                 gamePong = true;
//                 await gameRoute();
//             }
//             else if (urlPath === '/accounts/other_game' ) {
//                 gameCasseBrique = true;
//                 await gameCasseBriqueRoute();
//             }
//             else {
//                 if (gameDistant && PongDistantGame.currentGame) {
//                     PongDistantGame.currentGame.closeSocket();
//                     gameDistant = false;
//                 }
//                 else if (gameRoom) {
//                     window.RoomGameManager = null;
//                     gameRoom = false;
//                 }
//                 else if (gamePong) {
//                     window.PongGame = null;
//                     gamePong = false;
//                 }
//                 else if (gameCasseBrique) {
//                     window.CasseBriqueGame = null;
//                     gameCasseBrique = false;
//                 }
//             }
//         }
// }

async function gameCasseBriqueRoute() {
    if (!window.CasseBriqueGame) {
        const module = await import('./other_game.js');
        window.CasseBriqueGame = module.CasseBriqueGame;
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
    new window.CasseBriqueGame();
}

async function gameRoute() {
    if (!window.PongGame) {
        const module = await import('./game.js');
        window.PongGame = module.PongGame;
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
    new window.PongGame();
    PongGame.currentGame.initGame();
}

async function gameDistantRoute() {
    if (!window.RoomGameManager) {
        const module = await import('./game-distant.js');
        window.RoomGameManager = module.RoomGameManager;
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
    new window.RoomGameManager();
}

async function gameBotRoute() {

    if (!window.BotGame) {
        const module = await import('./game-bot.js');
        window.BotGame = module.BotGame;
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
    new window.BotGame();
    BotGame.currentGame.start();
}

let liveChanTimeout;
let SettingsTimeout;
let liveChat;
let homefetch;
let notiffetch;

let errorprint;
// Ajouter une variable globale pour tracker les scripts chargés
/* getCSRFTokenlet loadedScripts = []; */

// Exposer loadPage au scope global
window.loadPage = function(url, pushState = true) {
    // Normalize the URL to prevent duplication
    const normalizedUrl = normalizeUrl(url);

    // Vérifier si on est sur la page de login ou non
    const isLoginPage = normalizedUrl === '/' || normalizedUrl === '';
    const navbar = document.querySelector('.navbar');

    console.log("isLoginPage ? : ", isLoginPage);


    // Set navbar visibility before loading content
    if (navbar) {
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

        if (!newContent)
        {	
            console.error("No content element found in response HTML");
            window.location.href = normalizedUrl;
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

        if (url === '/') url = `https://${window.location.host}`;
        
        if (url === `https://${window.location.host}` || url.match("signout"))
        {
            navbar.style.display = 'none';
            launch_login_page();
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
		else if (url === `https://${window.location.host}/channels/` || url === '/channels/') {
            launch_everything();
            waschan = true;
        }
		
		if (wasNotif) {
            clearInterval(notiffetch);
			wasNotif = false;
		}
        
		if (url === `https://${window.location.host}/notifications/` || url === '/notifications/') {
            connectWebSocket_notif_page();
			wasNotif = true
		}

		if (wasSettings){
			clearTimeout(SettingsTimeout);
			wasSettings = false;
		}
		else if (url === `https://${window.location.host}/user-settings/` || url === '/user-settings/') {
			launch_settings();
			wasSettings = true;
		}
		else if (wasSettings)
        {
            clearTimeout(SettingsTimeout);
            wasSettings = false;
        }

        // Home Page
        if (url === `https://${window.location.host}/home/` || url === '/home/')
        {
            fetchAllUsersStatus();
            washome = true;
        }
        else if (washome)
        {
            clearInterval(homefetch);
            washome = false;
        }

        if (url.includes("game-distant-choice")) {
            gameRoom = true;
            gameDistantRoute();
        }
        else if (gameRoom) {
            window.RoomGameManager = null;
            gameRoom = false;
        }

        if (url.includes("/game-distant/")) {
            gameDistant = true;
        }
        else if (gameDistant && PongDistantGame.currentGame) {
            PongDistantGame.currentGame.closeSocket();
            gameDistant = false;
        }

        if (url === `https://${window.location.host}/game/` || url === `https://${window.location.host}/game`) {
            gamePong = true;
            gameRoute();
        }
        else if (gamePong) {
            window.PongGame = null;
            gamePong = false;
        }

        if (url === `https://${window.location.host}/other_game/`) {
            gameCasseBrique = true;
            gameCasseBriqueRoute();
        }
        else if (gameCasseBrique) {
            window.CasseBriqueGame = null;
            gameCasseBrique = false;
        }
    })
    .catch((error) => {
        console.error(error);
    });
};

// Exposer reinitCoreScripts au scope global - but don't re-attach event handlers
window.reinitCoreScripts = function() {
    // Initialize any components, but don't re-attach the same event listeners
    // This prevents duplicate handlersloadPage
    
    // Force navbar display based on current URL
    const currentPath = window.location.pathname;
    const isLoginPageNow = currentPath === '/' || currentPath === '';
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.display = isLoginPageNow ? 'none' : 'flex';
    }
};

function handleLinkClick(event) {
    let link = event.target.closest("a");
    // Process only if it's a link, has href, is same origin, and doesn't have data-full-reload
    if (link && link.href && 
        (new URL(link.href).origin === window.location.origin) && 
        !link.hasAttribute("data-full-reload") &&
        !link.hasAttribute("data-spa-ignore")) {
        
        event.preventDefault();
        if (link.href.match("signout"))
        {
            const navbar = document.querySelector('.navbar');
            navbar.style.display = "none";
            // console.log("1> LINK HREF : ", link.href);
            // loadPage(`https://${window.location.host}/`);
            // return ;
        }
        console.log("2> LINK HREF : ", link.href);
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
        loadPage(location.pathname)

        if (window.location.includes("game-bot")) {
            gameBot = true;
            gameBotRoute();
        }
        else if (gameBot) {
            window.BotGame = null;
            gameBot = false;
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
	loadPage(window.location.pathname, false);	
});

