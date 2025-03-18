	export class PongGame {
		static currentGame = null;

		constructor() {
			this.initState();
			this.keyHandler = this.handleKey.bind(this);
		}
		
		initState() {
			PongGame.currentGame = this;
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

		initGame() {

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
			PongGame.currentGame = null
			this.initState();
		}

		// Dessine le rectangle exterieur de l'aire de jeu
		drawOuterRectangle(color) {
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
				this.initGame();
			}, 50);
		}

		// Donne une direction aleatoire a la balle
		getRandomArbitrary(min, max) {
			var result = Math.random() * (max - min) + min;
			if (result >= -9 && result <= 9)
				return this.getRandomArbitrary(min, max);
			return result;
		}
	}