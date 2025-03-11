import { PongGame } from './game.js';
import { PongDistantGame } from './game-distant.js';

// Router simplifié
class Router {
    constructor() {
        this.currentGame = null;
        this.init();
    }

    init() {
      // Détecter les changements d'URL initiaux
        window.addEventListener('popstate', this.handleRouteChange.bind(this));
    
      // Intercepter les clics sur les liens
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                e.preventDefault();
                this.navigate(new URL(link.href, window.location.origin));
            }
        });

        this.handleRouteChange();
    }

    navigate(url) {
        if (new URL(url).pathname === window.location.pathname) return;

        history.pushState({}, '', url);
        this.handleRouteChange();
    }

    handleRouteChange() {
      const currentPath = window.location.pathname;
      const isGamePage = this.isOnGamePage(currentPath);
      const isDistantGame = currentPath.match(/^\/accounts\/game-distant\/(\d+)\/(\d+)\/?/);
    
      if (isGamePage)
        this.enterLocalGame();
      else if (isDistantGame)
        this.handleDistantGame(isDistantGame);
      else
        this.exitGame();
    }

    isOnGamePage(path) {
        const normalizedPath = path.replace(/\/$/, '');
        return (normalizedPath === '/accounts/game' || normalizedPath === '/accounts/game/'); // Adaptez à votre URL de jeu
    }

    handleDistantGame(match) {
        // on ignore la premiere variable index=0 => fullPath
        const [, gameId, id_t] = match;
        if (this.currentGame) {
            this.currentGame.stopGame();
            this.currentGame = null;
        }

        this.injectTemplateGameDistant(() => {
            this.waitElementsDom(() => {
                if (!this.currentGame) {
                    this.currentGame = new PongDistantGame(gameId, id_t);
                    console.log("DEBUT DISTANT GAME !!");
                }
            });
        });
    }

    enterLocalGame() {

        if (this.currentGame) {
            this.currentGame.stopGame();
            this.currentGame = null;
        }
        this.injectTemplateGame(() => {
            this.waitElementsDom(() => {
                if (!this.currentGame) {
                    this.currentGame = new PongGame();
                    console.log("AUSSI ICI");
                    this.currentGame.start();
                }
            });
        });
    }

    waitElementsDom(callback) {
        const checkEl = () => {
            if (document.getElementById('game') && document.getElementById('scoreP1') && document.getElementById('scoreP2')) {
                callback();
            } else {
                setTimeout(checkEl, 50);
            }
        };
        checkEl();
    }

    injectTemplateGameDistant(callback) {
        const content = document.getElementById('content');

        const newContent = document.createElement('div');
        newContent.innerHTML = `
            <link rel="stylesheet" href="{% static 'css/game-style.css' %}">

            <h3 class="scores" id="fps">Fps : 0</h3>

            <a href="game-distant-choice" class="game-distant">
            	<span class="game-mode">Retour</span>
            </a>

            <div class="scores" id="scores">

            	<h3 id="title-p1">Player 1</h3>
            	<h3 id="scoreP1">0</h3>
            	<h3 id="scoreP2">0</h3>
            	<h3 id="title-p2">Player 2</h3>
            </div>

            <div id="canvas-container">
                <canvas width="1920" height="850" id="game"></canvas>
                <div id="button-container">
                    <button id="replay-button" style="display: none;">Play again !</button>
                </div>
                <div class="wrapper" top="500px" left="500px" width="1100" height="150" style="display: none;" id="wrapper-player1">
                    <svg width="1100" height="150" id="svg-wrapper-player1">
                        <text x="50%" y="50%" dy=".35em" text-anchor="middle" id="text-p1"></text>
                    </svg>
                </div>
                <div class="wrapper" top="500px" left="500px" width="1100" height="150" style="display: none;" id="wrapper-player2">
                    <svg width="1100" height="150" id="svg-wrapper-player2">
                        <text x="50%" y="50%" dy=".35em" text-anchor="middle" id="text-p2"></text>
                    </svg>
                </div>
                <div id="overlay">
                    <h1 id="countdown">3</h1>
                </div>
            </div>

            <h3 class="disconnected" id="disconnected">Un joueur s'est deconnecte</h3>

            <script>
            	var gameId = "{{ game_id }}";
            	{% block script %}
            	    var id_t = "{{ id_t }}";
            	{% endblock %}
            </script>
        `;
        content.appendChild(newContent);

        if (!document.getElementById("canvas-container"))
            console.log("canvas-container n'existe pas");
        setTimeout(callback, 10);

    }

    injectTemplateGame(callback) {
        const content = document.getElementById('content');

        const newContent = document.createElement('div');

        newContent.innerHTML = `
            <link rel="stylesheet" href="/static/css/game-style.css">

            <h3 class="scores" id="fps">Fps : 0 | Avg Fps : </h3>

            <div class="scores" id="scores">
                <h3 id="title">Player 1</h3>
                <h3 id="scoreP1">0</h3>
                <h3 id="scoreP2">0</h3>
                <h3 id="title">Player 2</h3>
            </div>

            <div id="canvas-container">
                <canvas width="1920" height="850" id="game"></canvas>
                <div id="button-container">
                    <button id="replay-button" style="display: none;">Play again !</button>
                </div>
                <div class="wrapper" top="500px" left="500px" width="1100" height="150" style="display: none;" id="wrapper-player1">
                    <svg width="1100" height="150">
                        <text x="50%" y="50%" dy=".35em" text-anchor="middle">
                            Player 1 Wins !
                        </text>
                    </svg>
                </div>
                <div class="wrapper" top="500px" left="500px" width="1100" height="150" style="display: none;" id="wrapper-player2">
                    <svg width="1100" height="150" id="svg-wrapper-player2">
                        <text x="50%" y="50%" dy=".35em" text-anchor="middle">
                            Player 2 Wins !
                        </text>
                    </svg>
                </div>
            </div>
        `;

        content.appendChild(newContent);

        if (!document.getElementById("canvas-container"))
            console.log("canvas-container n'existe pas");
        setTimeout(callback, 10);
    }

    exitGame() {
        if (this.currentGame) {
            this.currentGame.stopGame();
            this.currentGame = null;
        }

        const gameElements = document.querySelectorAll('#canvas-container, #scores, #fps');
        gameElements.forEach(el => el.remove());
    }
  };

export const gameRouter = new Router();