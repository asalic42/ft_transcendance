// Variables
// var table;
// var context;
// var score_p1;
// var score_p2;
// var fps;
// var count_p1 = 0;
// var count_p2 = 0;
// var stop = 0;                           // Endgame
// var keys = {};                        // Players bars
// var id = 0;
// var frameTime = {counter : 0, time : 0};
// var totalframeTime = {counter : 0, time : 0};

(function() {

	if (window.PongGame) return ;

	class PongGame {
		constructor() {
			this.initState();
			this.keyHandler = this.handleKey.bind(this);
		}

		initState() {
			this.table = null;
			this.context = null;
			this.animationId = 0;
			this.fps = null;
			this.frameTime = {counter : 0, time : 0};
			this.totalframeTime = {counter : 0, time : 0};
			this.keys = {};
			this.score_p1 = null;
			this.score_p2 = null;
			this.count = {p1: 0, p2: 0};
			this.stop = false;
		}

		start() {

			// Vérifier que le canvas existe
			this.table = document.getElementById('game');
			if (!this.table) {
			   console.error("Canvas 'game' introuvable !");
			   return;
			}

			// Vérifier le contexte 2D
			this.context = this.table.getContext('2d');
			if (!this.context) {
			   console.error("Contexte 2D non supporté !");
			   return;
			}

			// Vérifier les éléments de score
			this.score_p1 = document.getElementById("scoreP1");
			this.score_p2 = document.getElementById("scoreP2");
			if (!this.score_p1 || !this.score_p2) {
			   console.error("Éléments de score introuvables !");
			   return;
			}
			this.count = {p1: 0, p2: 0};
			this.stop = false;

			this.fps = document.getElementById("fps");

			this.setupDOM();
			this.setupListeners();

			this.update();

			this.createBall(Math.floor(this.getRandomArbitrary(-10, 10)));
		}

		// Active le DOM au chargement de la page
		setupDOM() {

			const safeShow = (id) => {
				const element = document.getElementById(id);
				if (element) element.style.display = 'flex';
			};
			['scores', 'fps', 'canvas-container'].forEach(safeShow);

			if (!this.score_p1 || !this.score_p2) {
				console.log("element introuvable");
				return ;
			}

			this.score_p1.textContent = "0";
			this.score_p2.textContent = "0";
		}

		// Active les ecouteurs pour les touches claviers
		setupListeners() {

			this.keyHandler = (e) => this.handleKey(e);
			window.addEventListener('keydown', this.keyHandler);
			window.addEventListener('keyup', this.keyHandler);
		}

		handleKey(e) {
			this.keys[e.key] = (e.type === 'keydown');
		}

		// Arrete le jeu
		stopGame() {

			console.log("JE SUIS LAAAAAAAAAAAAAAAA");
			this.stop = true;
			cancelAnimationFrame(this.animationId);

			window.removeEventListener('keydown', this.keyHandler);
			window.removeEventListener('keyup', this.keyHandler);
			this.keyHandler = null;

			const safeHide = (id) => document.getElementById(id).style.display = 'none';
			['scores', 'fps', 'canvas-container'].forEach(safeHide);

			this.initState();
		}

		// Dessine le rectangle exterieur de l'aire de jeu
		drawOuterRectangle(color) {
			this.context.fillStyle = color;
			this.context.beginPath();
			this.context.roundRect(0, 0, this.table.width, this.table.height, 10);
			this.context.fill();
			this.context.closePath();
		}

		// Dessine le rectangle interieur de l'aire de jeu
		drawInnerRectangle(color) {
			this.context.fillStyle = color;
			this.context.beginPath();
			this.context.roundRect(5, 5, this.table.width - 10, this.table.height - 10, 8);
			this.context.fill();
			this.context.closePath();
		}

		// Update l'aire de jeu
		update() {
			this.drawOuterRectangle("#ED4EB0");
			this.drawInnerRectangle("#23232e");
		
			this.context.fillStyle = '#ED4EB0';
			this.context.fillRect(this.table.width / 2, 0, 5, this.table.height);
		
			console.log('Creating player...');
		}

		// Creer la balle au debut du jeu
		createBall(vx) {
			// Balls coords
			this.ball = {coords : {x : this.table.width / 2, y : this.table.height / 2},
						const_vector : {vx : vx, vy : Math.floor(this.getRandomArbitrary(-10, 10))},
						vector : {},
						radius : 13,
						hit_vertical : 0,
						hit_player : 0};

			this.ball.vector = { vx: this.ball.const_vector.vx, vy: this.ball.const_vector.vy };
		
			// Initials points player 1
			this.player1Coords = {x1 : 92, y1 : (this.table.height / 2) - 40, x2 : 100, y2 : (this.table.height / 2) + 40, const_vy : 20, vy : 20};
		
			// Initials points player 2
			this.player2Coords = {x1 : this.table.width - 100, y1 : (this.table.height / 2) - 40, x2 : this.table.width - 92, y2 : (this.table.height / 2) + 40, const_vy : 20, vy : 20};
			this.gameLoop(Date.now());
		}

		/* Check if the ball touch a player */
		isBallHittingPlayer() {

			if (this.ball.hit_player > 0 && this.ball.hit_player < 5) {// pendant les deux prochaines frames impossible de rebondir sur les murs.
				this.ball.hit_player++;
				return false;
			}
			if (this.ball.hit_player >= 5)
				this.ball.hit_player = 0;

		    if (this.ball.coords.x - this.ball.radius >= this.player1Coords.x1 && this.ball.coords.x - this.ball.radius <= this.player1Coords.x2 + Math.abs(this.ball.vector.vx * 1) &&
					this.ball.coords.y - this.ball.radius <= this.player1Coords.y2 + this.ball.radius / 2 &&
					this.ball.coords.y + this.ball.radius >= this.player1Coords.y1 - this.ball.radius / 2) {
						this.ball.hit_player = 1
						return true;
					}

			else if (this.ball.coords.x + this.ball.radius >= this.player2Coords.x1 - Math.abs(this.ball.vector.vx * 1) && this.ball.coords.x + this.ball.radius <= this.player2Coords.x2 &&
					this.ball.coords.y - this.ball.radius <= this.player2Coords.y2 + this.ball.radius / 2 &&
					this.ball.coords.y + this.ball.radius >= this.player2Coords.y1 - this.ball.radius / 2) {
						this.ball.hit_player = 1
						return true;
					}
			return false;
		}

		// Dessine les players
		drawPlayer() {
			this.movePlayer(this.player1Coords, this.player2Coords);
			this.context.fillStyle = "#ED4EB0";
			this.context.beginPath();
			this.context.roundRect(this.player1Coords.x1, this.player1Coords.y1, 5, 80, 10);
			this.context.roundRect(this.player2Coords.x1, this.player2Coords.y1, 5, 80, 10);
			this.context.fill();
			this.context.closePath();
		}

		// Bouge la balle et check les rebonds
		moveBall() {
			// Conditions so that the ball bounces from the edges
			if (!this.stop && this.isBallHittingPlayer()) {
				this.ball.const_vector.vx = -(this.ball.const_vector.vx);
				this.ball.vector.vx = -this.ball.vector.vx;
				if (this.ball.const_vector.vx < 0 && this.ball.const_vector.vx > -30) {
					this.ball.vector.vx -= 1;
					this.ball.const_vector.vx -= 1;
				}
				else if (this.ball.const_vector.vx < 30) {
					this.ball.vector.vx += 1;
					this.ball.const_vector.vx += 1;
				}
			}

			// Winning condition
			else if (this.count.p1 == 5 || this.count.p2 == 5) {
				this.stop = 1;
				if (this.count.p1 == 5) {
					console.log("player 1 wins");
					this.winnerWindow(1);
				}
				else {
					console.log("player 2 wins");
					this.winnerWindow(2);
				}   
				return;
			}

			else if ((this.ball.coords.y - this.ball.radius <= 0 || this.ball.coords.y + this.ball.radius >= this.table.height) && !this.ball.hit_vertical) {
				this.ball.hit_vertical = 1;
				this.ball.vector.vy = -this.ball.vector.vy;
				this.ball.const_vector.vy = -this.ball.const_vector.vy;
			}
			if (this.ball.hit_vertical) // pendant les deux prochaines frames impossible de rebondir sur les murs.
				this.ball.hit_vertical++;
			if (this.ball.hit_vertical >= 5)
				this.ball.hit_vertical = 0;
		
			this.ball.coords.x += this.ball.vector.vx;	
			this.ball.coords.y += this.ball.vector.vy;

			this.drawBall();
		}

		// Dessine la balle
		drawBall() {
			this.context.beginPath();
			this.context.fillStyle = 'white';
			this.context.arc(this.ball.coords.x, this.ball.coords.y, this.ball.radius, Math.PI * 2, false);
			this.context.fill();
			this.context.closePath();

			this.context.beginPath();
			this.context.fillStyle = "#23232e";
			this.context.arc(this.ball.coords.x, this.ball.coords.y, this.ball.radius - 2, Math.PI * 2, false);
			this.context.fill();
			this.context.stroke();
			this.context.closePath();
		}

		// Bouge le player selon les touches claviers
		movePlayer() {
			if (this.keys["z"] && this.player1Coords.y1 - this.player1Coords.vy > 0) {
				this.player1Coords.y1 -= this.player1Coords.vy;
				this.player1Coords.y2 -= this.player1Coords.vy;
			}
			if (this.keys["s"] && this.player1Coords.y2 + this.player1Coords.vy < this.table.height) {
				this.player1Coords.y1 += this.player1Coords.vy;
				this.player1Coords.y2 += this.player1Coords.vy;
			}
			if (this.keys["ArrowUp"] && this.player2Coords.y1 - this.player1Coords.vy > 0) {
				this.player2Coords.y1 -= this.player2Coords.vy;
				this.player2Coords.y2 -= this.player2Coords.vy;
			}
			if (this.keys["ArrowDown"] && this.player2Coords.y2 + this.player1Coords.vy < this.table.height) {
				this.player2Coords.y1 += this.player2Coords.vy;
				this.player2Coords.y2 += this.player2Coords.vy;
			}
		}

		// Loop du jeu
		gameLoop(start) {
			if (this.stop) return;

			const frame = () => {
				if (this.stop) {
					cancelAnimationFrame(this.animationId);
					return ;
				}

				let end = Date.now();
				let elapsedTime = end - start; // Temps réel pris par la frame
				this.frameTime.counter++;
				this.frameTime.time += elapsedTime;
				if (this.frameTime.time > 250) {
					this.totalframeTime.counter += this.frameTime.counter;
					this.totalframeTime.time += 250
					this.fps.innerText = "Fps : " + (this.frameTime.counter * 4) + " | Avg Fps : " + (this.totalframeTime.counter * (1000 / this.totalframeTime.time)).toPrecision(5);
					this.frameTime.counter = 0;
					this.frameTime.time = 0;
				}

				let percentage = (elapsedTime / 16.66).toPrecision(5);
				this.ball.vector.vx = this.ball.const_vector.vx * percentage;
				this.ball.vector.vy = this.ball.const_vector.vy * percentage;
				this.player1Coords.vy = this.player1Coords.const_vy * percentage;
				this.player2Coords.vy = this.player2Coords.const_vy * percentage;
				start = Date.now();

	    	    if (this.context) this.context.clearRect(0, 0, this.table.width, this.table.height);
	    	    this.update();
	    	    this.drawPlayer();

	    	    if (this.isPointWin()) {
	    	        return ;
				}
	    	    this.moveBall();
				this.animationId = requestAnimationFrame(frame);
	    	};

			this.animationId = requestAnimationFrame(frame);
		}

		// Add un point a un player
		isPointWin() {
			if (this.ball.radius + this.ball.coords.x >= this.table.width) {
				this.count.p1++;
				this.score_p1.innerText = this.count.p1;
				this.createBall(Math.floor(this.getRandomArbitrary(-10, 0)));
				return true;
			}
			else if (this.ball.coords.x - this.ball.radius <= 0) {
				this.count.p2++;
				this.score_p2.innerText = this.count.p2;
				this.createBall(Math.floor(this.getRandomArbitrary(0, 10)));
				return true;
			}
			return false;
		}

		// Page de win
		winnerWindow(player) {
		
			this.context.clearRect(0, 0, this.table.width, this.table.height);

			const winner1Text = document.getElementById("wrapper-player1");
			const winner2Text = document.getElementById("wrapper-player2");
			if (player == 1) {
				this.drawOuterRectangle("#365fa0");
				winner1Text.style.display = "block";
			}
			else {
				this.drawOuterRectangle("#C42021");
				winner2Text.style.display = "block";
			}
			this.drawInnerRectangle("#23232e");
			this.newGame(player);
		}

		// Lancer une nouvelle partie apres click bouton
		newGame(player) {
			const button = document.getElementById("replay-button");
			button.style.display = "block";
		
			if (player == 1)
				button.style.color = "#C42021";
			else
				button.style.color = "#365FA0";
			button.addEventListener("click", () => {
				const winner1Text = document.getElementById("wrapper-player1");
				const winner2Text = document.getElementById("wrapper-player2");
			
				winner1Text.style.display = "none";
				winner2Text.style.display = "none";
				button.style.display = "none";
				this.restartGame();
			});
		}

		// Restart the game
		restartGame() {
			if (this.stop)
				this.stopGame();
			// if (this.context) this.context.clearRect(0, 0, this.table.width, this.table.height);
			this.start();
		}

		// Donne une direction aleatoire a la balle
		getRandomArbitrary(min, max) {
			var result = Math.random() * (max - min) + min;
			if (result >= -9 && result <= 9)
				return this.getRandomArbitrary(min, max);
			return result;
		}
	}
	// }

	window.PongGame = PongGame;

	// Router simplifié
	var router = {
		currentGame: null,

		init: function() {
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
		},

		navigate: function(url) {
			if (new URL(url).pathname === window.location.pathname) return;

			history.pushState({}, '', url);
			this.handleRouteChange();
		},
	
		handleRouteChange: function() {
		  const currentPath = window.location.pathname;
		  const isGamePage = this.isOnGamePage(currentPath);
		
		  if (isGamePage) {
			console.log("je rentre dans la fonction");
			this.enterGame();
		  }
		  else
		  	this.exitGame();
		},
	
		isOnGamePage: function(path) {
			const normalizedPath = path.replace(/\/$/, '');
			return normalizedPath === '/accounts/game'; // Adaptez à votre URL de jeu
		},

		enterGame: function() {

			if (this.currentGame) {
	            this.currentGame.stopGame();
	            this.currentGame = null;
	        }

			this.injectTemplate(() => {
				this.waitElementsDom(() => {
					this.currentGame = new PongGame();
					this.currentGame.start();
				});
			});
		},

		waitElementsDom: function(callback) {
			const checkEl = () => {
				if (document.getElementById('game') && document.getElementById('scoreP1') && document.getElementById('scoreP2')) {
					callback();
				} else {
					setTimeout(checkEl, 50);
				}
			};
			checkEl();
		},

		injectTemplate: function(callback) {
			const content = document.getElementById('content');

			if (content.querySelector('#canvas-container')) {
				callback();
				return;
			}

			const gameHtml = `
				<link rel="stylesheet" href="{% static 'css/game-style.css' %}">

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

			content.innerHTML = gameHtml;
			callback();
		},

		exitGame: function() {
			if (this.currentGame) {
				this.currentGame.stopGame();
				this.currentGame = null;
			}
		}
	  };

	document.addEventListener("DOMContentLoaded", function() {
		router.init();
	});
}) ();

