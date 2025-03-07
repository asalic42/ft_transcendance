
(function() {

	if (window.PongGame) return ;

	class PongGame {
		constructor() {
			this.initState();
			this.keyHandler = this.handleKey.bind(this);
		}

		initState() {
			this.animationId = 0;
			this.frameTime = {counter : 0, time : 0};
			this.totalframeTime = {counter : 0, time : 0};
			this.keys = {};
			this.count = {p1: 0, p2: 0};
			this.stop = false;
			this.player1Coords = null;
			this.player2Coords = null;
			this.ball = null;
		}

		start() {

			console.log("START");
			this.count = {p1: 0, p2: 0};
			this.stop = false;

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

			document.getElementById("scoreP1").textContent = "0";
			document.getElementById("scoreP2").textContent = "0";
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

			this.stop = true;
			if (this.animationId) {
				cancelAnimationFrame(this.animationId);
				this.animationId = null;
			}

			window.removeEventListener('keydown', this.keyHandler);
			window.removeEventListener('keyup', this.keyHandler);
			this.keyHandler = null;

			console.log("stop, supp context");
			if (document.getElementById('game').getContext('2d')) {
				document.getElementById('game').getContext('2d').clearRect(0, 0, document.getElementById('game').width, document.getElementById('game').height);
			}
			this.initState();
		}

		// Dessine le rectangle exterieur de l'aire de jeu
		drawOuterRectangle(color) {
			// if (!this.context) console.log("je n'existe pas");
			document.getElementById('game').getContext('2d').fillStyle = color;
			document.getElementById('game').getContext('2d').beginPath();
			document.getElementById('game').getContext('2d').roundRect(0, 0, document.getElementById('game').width, document.getElementById('game').height, 10);
			document.getElementById('game').getContext('2d').fill();
			document.getElementById('game').getContext('2d').closePath();
		}

		// Dessine le rectangle interieur de l'aire de jeu
		drawInnerRectangle(color) {
			document.getElementById('game').getContext('2d').fillStyle = color;
			document.getElementById('game').getContext('2d').beginPath();
			document.getElementById('game').getContext('2d').roundRect(5, 5, document.getElementById('game').width - 10, document.getElementById('game').height - 10, 8);
			document.getElementById('game').getContext('2d').fill();
			document.getElementById('game').getContext('2d').closePath();
		}

		// Update l'aire de jeu
		update() {
			this.drawOuterRectangle("#ED4EB0");
			this.drawInnerRectangle("#23232e");

			const safeShow = (id) => {
				const element = document.getElementById(id);
				if (element) element.style.display = 'flex';
			};
			['scores', 'fps', 'canvas-container'].forEach(safeShow);
		
			document.getElementById('game').getContext('2d').fillStyle = '#ED4EB0';
			document.getElementById('game').getContext('2d').fillRect(document.getElementById('game').width / 2, 0, 5, document.getElementById('game').height);
		
			console.log('Creating player...');
		}

		// Creer la balle au debut du jeu
		createBall(vx) {
			// Balls coords

			this.ball = {coords : {x : document.getElementById('game').width / 2, y : document.getElementById('game').height / 2},
						const_vector : {vx : vx, vy : Math.floor(this.getRandomArbitrary(-10, 10))},
						vector : {},
						radius : 13,
						hit_vertical : 0,
						hit_player : 0};

			this.ball.vector = { vx: this.ball.const_vector.vx, vy: this.ball.const_vector.vy };
		
			// Initials points player 1
			this.player1Coords = {x1 : 92, y1 : (document.getElementById('game').height / 2) - 40, x2 : 100, y2 : (document.getElementById('game').height / 2) + 40, const_vy : 20, vy : 20};
		
			// Initials points player 2
			this.player2Coords = {x1 : document.getElementById('game').width - 100, y1 : (document.getElementById('game').height / 2) - 40, x2 : document.getElementById('game').width - 92, y2 : (document.getElementById('game').height / 2) + 40, const_vy : 20, vy : 20};
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
			document.getElementById('game').getContext('2d').fillStyle = "#ED4EB0";
			document.getElementById('game').getContext('2d').beginPath();
			document.getElementById('game').getContext('2d').roundRect(this.player1Coords.x1, this.player1Coords.y1, 5, 80, 10);
			document.getElementById('game').getContext('2d').roundRect(this.player2Coords.x1, this.player2Coords.y1, 5, 80, 10);
			document.getElementById('game').getContext('2d').fill();
			document.getElementById('game').getContext('2d').closePath();
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

			else if ((this.ball.coords.y - this.ball.radius <= 0 || this.ball.coords.y + this.ball.radius >= document.getElementById('game').height) && !this.ball.hit_vertical) {
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
			document.getElementById('game').getContext('2d').beginPath();
			document.getElementById('game').getContext('2d').fillStyle = 'white';
			document.getElementById('game').getContext('2d').arc(this.ball.coords.x, this.ball.coords.y, this.ball.radius, Math.PI * 2, false);
			document.getElementById('game').getContext('2d').fill();
			document.getElementById('game').getContext('2d').closePath();

			document.getElementById('game').getContext('2d').beginPath();
			document.getElementById('game').getContext('2d').fillStyle = "#23232e";
			document.getElementById('game').getContext('2d').arc(this.ball.coords.x, this.ball.coords.y, this.ball.radius - 2, Math.PI * 2, false);
			document.getElementById('game').getContext('2d').fill();
			document.getElementById('game').getContext('2d').stroke();
			document.getElementById('game').getContext('2d').closePath();
		}

		// Bouge le player selon les touches claviers
		movePlayer() {
			if (this.keys["z"] && this.player1Coords.y1 - this.player1Coords.vy > 0) {
				this.player1Coords.y1 -= this.player1Coords.vy;
				this.player1Coords.y2 -= this.player1Coords.vy;
			}
			if (this.keys["s"] && this.player1Coords.y2 + this.player1Coords.vy < document.getElementById('game').height) {
				this.player1Coords.y1 += this.player1Coords.vy;
				this.player1Coords.y2 += this.player1Coords.vy;
			}
			if (this.keys["ArrowUp"] && this.player2Coords.y1 - this.player1Coords.vy > 0) {
				this.player2Coords.y1 -= this.player2Coords.vy;
				this.player2Coords.y2 -= this.player2Coords.vy;
			}
			if (this.keys["ArrowDown"] && this.player2Coords.y2 + this.player1Coords.vy < document.getElementById('game').height) {
				this.player2Coords.y1 += this.player2Coords.vy;
				this.player2Coords.y2 += this.player2Coords.vy;
			}
		}

		// Loop du jeu
		gameLoop(start) {
			if (this.stop) return;

			const frame = () => {
				if (this.stop || !document.getElementById('game')) {
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
					document.getElementById("fps").innerText = "Fps : " + (this.frameTime.counter * 4) + " | Avg Fps : " + (this.totalframeTime.counter * (1000 / this.totalframeTime.time)).toPrecision(5);
					this.frameTime.counter = 0;
					this.frameTime.time = 0;
				}

				let percentage = (elapsedTime / 16.66).toPrecision(5);
				this.ball.vector.vx = this.ball.const_vector.vx * percentage;
				this.ball.vector.vy = this.ball.const_vector.vy * percentage;
				this.player1Coords.vy = this.player1Coords.const_vy * percentage;
				this.player2Coords.vy = this.player2Coords.const_vy * percentage;
				start = Date.now();

	    	    if (document.getElementById('game')) document.getElementById('game').getContext('2d').clearRect(0, 0, document.getElementById('game').width, document.getElementById('game').height);
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
			if (this.ball.radius + this.ball.coords.x >= document.getElementById('game').width) {
				this.count.p1++;
				document.getElementById("scoreP1").textContent = this.count.p1;
				this.createBall(Math.floor(this.getRandomArbitrary(-10, 0)));
				return true;
			}
			else if (this.ball.coords.x - this.ball.radius <= 0) {
				this.count.p2++;
				document.getElementById("scoreP2").textContent = this.count.p2;
				this.createBall(Math.floor(this.getRandomArbitrary(0, 10)));
				return true;
			}
			return false;
		}

		// Page de win
		winnerWindow(player) {
		
			document.getElementById('game').getContext('2d').clearRect(0, 0, document.getElementById('game').width, document.getElementById('game').height);

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
			setTimeout(() => {
				this.start();
			}, 50);
		}

		// Get player ID from database
		// async getCurrentPlayerId() {
		// 	if (this.cachedUserId !== null) {
		// 		return this.cachedUserId;
		// 	}
		// 	try {
		// 		const response = await fetch('/accounts/api/current-user/', {
		// 			credentials: 'same-origin'
		// 		});
		// 		const data = await response.json();
		// 		this.cachedUserId = data.userId;
		// 		console.log("user ID = ", this.cachedUserId);
		// 		return this.cachedUserId;
		// 	} catch (error) {
		// 		console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
		// 		return null;
		// 	}
		// }

		// Add player stats to database
		// async addNewGame(id_player1, id_player2) {
		// 	// console.log("id_player dans addNewGame: ", id_player);
		// 	try {
		// 		const response = await fetch('/accounts/api/add_pong/', {
		// 			method: 'POST',
		// 			headers: {
		// 				'Content-Type': 'application/json',
		// 				'X-CSRFToken': getCSRFToken()
		// 			},
		// 			credentials: 'include',
		// 			body: JSON.stringify({  // Convertit les données en JSON
		// 				id_p1: id_player1,
		// 				id_p2: id_player2,
		// 				is_bot_game: false,
		// 				score_p1: this.count.p1,
		// 				score_p2: this.count.p2,
		// 				difficulty: this.user_option,
		// 				bounce_nb: this.bounce,
		// 			})
		// 		});
			
		// 		if (!response.ok) {
		// 			const text = await response.text();
		// 			throw new Error(`HTTP error! status: ${response.status}, message: ${text}`); }
				
		// 		const result = await response.json();
		// 		console.log('Nouveau jeu ajouté:', result);
		// 	} catch (error) {
		// 		console.error('Erreur:', error);
		// 	}
		// }

		// Donne une direction aleatoire a la balle
		getRandomArbitrary(min, max) {
			var result = Math.random() * (max - min) + min;
			if (result >= -9 && result <= 9)
				return this.getRandomArbitrary(min, max);
			return result;
		}
	}

	window.PongGame = PongGame;

	// Router simplifié
	var router = {
		currentGame: null,

		init: function() {
		  // Détecter les changements d'URL initiaux
			window.addEventListener('popstate', this.handleRouteChange.bind(this));
		
		  // Intercepter les clics sur les liens
			document.body.addEventListener('click', (e) => {
				console.log("je passe par la moi !");
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
			console.log("here !");
			this.enterGame();
		  }
		  else
		  	this.exitGame();
		},
	
		isOnGamePage: function(path) {
			const normalizedPath = path.replace(/\/$/, '');
			console.log("normalized = ", normalizedPath);
			return (normalizedPath === '/accounts/game' || normalizedPath === '/accounts/game/'); // Adaptez à votre URL de jeu
		},

		enterGame: function() {

			if (this.currentGame) {
	            this.currentGame.stopGame();
	            this.currentGame = null;
	        }
			this.injectTemplate(() => {
				this.waitElementsDom(() => {
					if (!this.currentGame) {
						this.currentGame = new PongGame();
						console.log("AUSSI ICI");
						this.currentGame.start();
					}
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

			// const oldContent = content.querySelector('#canvas-container');
			// if (oldContent) oldContent.remove();

			// const oldContainer = content.querySelector('#canvas-container');
			// const oldScores = content.querySelector('#scores');
			// const oldFps = content.querySelector('#fps');
			
			// if (oldContainer) oldContainer.remove();
			// if (oldScores) oldScores.remove();
			// if (oldFps) oldFps.remove();

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
			if (!document.getElementById("canvas-container")) console.log("canvas-container n'existe pas");
			setTimeout(callback, 10);
		},

		exitGame: function() {
			if (this.currentGame) {
				this.currentGame.stopGame();
				this.currentGame = null;
			}

			const gameElements = document.querySelectorAll('#canvas-container, #scores, #fps');
			gameElements.forEach(el => el.remove());
		}
	  };

	document.addEventListener("DOMContentLoaded", function() {
		router.init();
	});
}) ();

