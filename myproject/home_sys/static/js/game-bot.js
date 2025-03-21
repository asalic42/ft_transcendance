
(function() {

	if (window.BotGame) return ;


	class BotGame {
		constructor()  {
			this.initState();
			this.keyHandler = this.handleKey.bind(this);
		}

		initState() {
			this.bounce = 0;
			this.user_option = 2;
			this.count = {p1: 0, p2: 0};
			this.stop = false;
			this.frameTime = {counter : 0, time : 0};
			this.totalframeTime = {counter : 0, time : 0};
			this.bot_time = -1;
			this.percentage = 0;
			this.cachedUserId = null;
			this.animationId = 0;
			this.keys = {};
			this.player1Coords = null;
			this.player2Coords = null;
			this.ball = null;
		}

		// Set up le jeu avant de lancer la game
		start() {

			const form = document.getElementById('LevelForm');
			this.user_option = form.elements.levelfield.value;

			this.setupDOM();
			this.setupListeners();

			this.update();
			this.createBall(Math.floor(this.getRandomArbitrary(-11, 11)));
		}

		setupDOM() {

			if (document.getElementById('bot-page')) document.getElementById('bot-page').style.display = 'none';
			const safeShow = (id) => {
				const element = document.getElementById(id);
				if (element) element.style.display = 'flex';
			};
			['scores', 'fps', 'bot-canvas-container'].forEach(safeShow);

			document.getElementById('scoreP1').textContent = "0";
			document.getElementById('scoreP2').textContent = "0";
		}

		setupListeners() {
			this.keyHandler = (event) => this.handleKey(event);
			window.addEventListener('keydown', this.keyHandler);
			window.addEventListener('keyup', this.keyHandler);
		}

		handleKey(event) {
			this.keys[event.key] = (event.type === 'keydown');
		}

		// Clean du jeu a la fin de la partie
		stopGame() {
			this.stop = true;

			if (this.animationId) {
				cancelAnimationFrame(this.animationId);
				this.animationId = null;
			}

			window.removeEventListener('keydown', this.keyHandler);
			window.removeEventListener('keyup', this.keyHandler);
			this.keyHandler = null;

			if (document.getElementById('bot-game').getContext('2d')) {
				document.getElementById('bot-game').getContext('2d').clearRect(0, 0, document.getElementById('bot-game').width, document.getElementById('bot-game').height);
			}
			this.initState();
		}

		// Creee la balle et les joueurs
		createBall(vx) {

			if (this.animationId) {
				cancelAnimationFrame(this.animationId);
				this.animationId = null;
			}

			// Balls coords
			this.ball = {coords : {x : document.getElementById('bot-game').width / 2, y : document.getElementById('bot-game').height / 2},
						const_vector : {vx : vx, vy : Math.floor(this.getRandomArbitrary(-11, 11))},
						vector : {},
						radius : 13,
						hit_vertical : 0,
						hit_player : 0};
		
			this.ball.vector = { vx: this.ball.const_vector.vx, vy: this.ball.const_vector.vy };
		
			// Initials points player 1
			this.player1Coords = {x1 : 92, y1 : (document.getElementById('bot-game').height / 2) - 40, x2 : 100, y2 : (document.getElementById('bot-game').height / 2) + 40, const_vy : 20, vy : 20};
		
			// Initials points player 2
			this.player2Coords = {x1 : document.getElementById('bot-game').width - 100, y1 : (document.getElementById('bot-game').height / 2) - 40, x2 : document.getElementById('bot-game').width - 92, y2 : (document.getElementById('bot-game').height / 2) + 40, const_vy : 20, vy : 20, ball_predicted_hit : 0};
		
			this.gameLoop(Date.now());
			this.isGameOver();
		}

		drawOuterRectangle(color) {
			document.getElementById('bot-game').getContext('2d').fillStyle = color;
			document.getElementById('bot-game').getContext('2d').beginPath();
			document.getElementById('bot-game').getContext('2d').roundRect(0, 0, document.getElementById('bot-game').width, document.getElementById('bot-game').height, 10);
			document.getElementById('bot-game').getContext('2d').fill();
			document.getElementById('bot-game').getContext('2d').closePath();
		}

		drawInnerRectangle(color) {
			document.getElementById('bot-game').getContext('2d').fillStyle = color;
			document.getElementById('bot-game').getContext('2d').beginPath();
			document.getElementById('bot-game').getContext('2d').roundRect(5, 5, document.getElementById('bot-game').width - 10, document.getElementById('bot-game').height - 10, 8);
			document.getElementById('bot-game').getContext('2d').fill();
			document.getElementById('bot-game').getContext('2d').closePath();
		}

		// Update de l'aire de jeu
		update() {
			this.drawOuterRectangle("#ED4EB0");
			this.drawInnerRectangle("#23232e");
		
			document.getElementById('bot-game').getContext('2d').fillStyle = '#ED4EB0';
			document.getElementById('bot-game').getContext('2d').fillRect(document.getElementById('bot-game').width / 2, 0, 5, document.getElementById('bot-game').height);
		}

		// Bouge le joueur
		movePlayer() {

			if (this.keys["z"] && this.player1Coords.y1 - this.player1Coords.vy > 0) {
				this.player1Coords.y1 -= this.player1Coords.vy;
				this.player1Coords.y2 -= this.player1Coords.vy;
			}
			if (this.keys["s"] && this.player1Coords.y2 + this.player1Coords.vy < document.getElementById('bot-game').height) {
				this.player1Coords.y1 += this.player1Coords.vy;
				this.player1Coords.y2 += this.player1Coords.vy;
			}
		}

		// Bouge le BOT
		moveBot() {
			if ((this.player2Coords.ball_predicted_hit > 10 || this.player2Coords.ball_predicted_hit < -10) &&
				this.player2Coords.y1 + this.player2Coords.vy > 0 && this.player2Coords.y2 + this.player2Coords.vy < document.getElementById('bot-game').height) {
				this.player2Coords.y1 += this.player2Coords.vy;
				this.player2Coords.y2 += this.player2Coords.vy;
				this.player2Coords.ball_predicted_hit -= this.player2Coords.vy;
			}
		}

		// Dessine le joueur
		drawPlayer() {
			this.movePlayer();
			this.moveBot();
			document.getElementById('bot-game').getContext('2d').fillStyle = "#ED4EB0";
			document.getElementById('bot-game').getContext('2d').beginPath();
			document.getElementById('bot-game').getContext('2d').roundRect(this.player1Coords.x1, this.player1Coords.y1, 5, 80, 10);
			document.getElementById('bot-game').getContext('2d').roundRect(this.player2Coords.x1, this.player2Coords.y1, 5, 80, 10);
			document.getElementById('bot-game').getContext('2d').fill();
			document.getElementById('bot-game').getContext('2d').closePath();
		}

		// Bouge la balle
		moveBall() {

			// Ball is hiting a player.
			if (!this.stop && this.isBallHittingPlayer()) {
				this.bounce++;
				this.ball.const_vector.vx = -(this.ball.const_vector.vx);
				this.ball.vector.vx = -this.ball.vector.vx;
				if (this.ball.const_vector.vx < 0 && this.ball.const_vector.vx > -30)
					this.ball.const_vector.vx -= 1;
				else if (this.ball.const_vector.vx < 30)
					this.ball.const_vector.vx += 1;
			}
		
			this.isBallHittingWall();
			this.ball.coords.x += this.ball.vector.vx;
			this.ball.coords.y += this.ball.vector.vy;
		
			this.drawBall();
		}

		// Check si la balle touche une raquette
		isBallHittingPlayer() {

			if (this.ball.hit_player > 0 && this.ball.hit_player < 5) {// pendant les cinq prochaines frames impossible de rebondir sur les murs.
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

		//dessine une nouvelle balle
		drawBall() {
			document.getElementById('bot-game').getContext('2d').beginPath();
			document.getElementById('bot-game').getContext('2d').fillStyle = 'white';
			document.getElementById('bot-game').getContext('2d').arc(this.ball.coords.x, this.ball.coords.y, this.ball.radius, Math.PI * 2, false);
			document.getElementById('bot-game').getContext('2d').fill();
			document.getElementById('bot-game').getContext('2d').closePath();

			document.getElementById('bot-game').getContext('2d').beginPath();
			document.getElementById('bot-game').getContext('2d').fillStyle = "#23232e";
			document.getElementById('bot-game').getContext('2d').arc(this.ball.coords.x, this.ball.coords.y, this.ball.radius - 2, Math.PI * 2, false);
			document.getElementById('bot-game').getContext('2d').fill();
			document.getElementById('bot-game').getContext('2d').stroke();
			document.getElementById('bot-game').getContext('2d').closePath();
		}

		// Check si la balle touche une bordure
		isBallHittingWall() {
			if ((this.ball.coords.y - this.ball.radius <= 0 || this.ball.coords.y + this.ball.radius >= document.getElementById('bot-game').height) && !this.ball.hit_vertical) {
				this.ball.hit_vertical = 1;
				this.ball.vector.vy = -this.ball.vector.vy;
				this.ball.const_vector.vy = -this.ball.const_vector.vy;
			}
			else if (this.ball.hit_vertical) // pendant les quates prochaines frames impossible de rebondir sur les murs.
				this.ball.hit_vertical++;
			if (this.ball.hit_vertical >= 5)
				this.ball.hit_vertical = 0;
		}

		// Loop principale du jeu
		gameLoop(start) {
			if (this.stop || this.animationId) return;

			const frame = () => {
				if (this.stop || !document.getElementById('bot-game')) {
					cancelAnimationFrame(this.animationId);
					return ;
				}

				// Calcul FPS
				this.timeRelatedStuff(start);
				this.adaptVectorsToFps();
				start = Date.now();

				// Dynamique de jeu
				if (document.getElementById('bot-game').getContext('2d')) document.getElementById('bot-game').getContext('2d').clearRect(0, 0, document.getElementById('bot-game').width, document.getElementById('bot-game').height);
				this.update();
				this.drawPlayer();
				if (this.isPointWin())
					return ;
				this.moveBall();
				this.animationId = requestAnimationFrame(frame);	
			};

			this.animationId = requestAnimationFrame(frame);
		}

		/* Function that detects whether a player has won a point or not */
		isPointWin() {
   			if (this.ball.radius + this.ball.coords.x >= document.getElementById('bot-game').width) {
   			    this.count.p1++;
   			  	document.getElementById('scoreP1').textContent = this.count.p1;
   			    this.createBall(Math.floor(this.getRandomArbitrary(-10, 0)));
   			    return true;
   			}
   			else if (this.ball.coords.x - this.ball.radius <= 0) {
   			    this.count.p2++;
   			    document.getElementById('scoreP2').textContent = this.count.p2;
   			    this.createBall(Math.floor(this.getRandomArbitrary(0, 10)));
   			    return true;
   			}
   			return false;
		}

		// Check si la partie est teminee
		isGameOver() {
			if (this.count.p1 == 5 || this.count.p2 == 5) {
				this.stop = true;
				if (this.count.p1 == 5) {
					console.log("player 1 wins");
					this.winnerWindow(1);
				}
				else {
					console.log("player 2 wins");
					this.winnerWindow(2);
				}   
				return true;
			}
			return false
		}

		// Annonce du gagnant + add stats a la database
		async winnerWindow(player) {

			document.getElementById('bot-game').getContext('2d').clearRect(0, 0, document.getElementById('bot-game').width, document.getElementById('bot-game').height);
			cancelAnimationFrame(this.animationId);
		
			const winner1Text = document.getElementById("wrapper-player1");
			const winner2Text = document.getElementById("wrapper-player2");

			try {
				const playerId1 = await this.getCurrentPlayerId();
				if (!playerId) {
					console.error('Impossible de sauvegarder le score : utilisateur non connecté');
					return;
				}

				const playerId2 = await this.getCurrentPlayerId();
				if (!playerId) {
					console.error('Impossible de sauvegarder le score : utilisateur non connecté');
					return;
				}
			
				// Attendre que l'ajout du score soit terminé
				await this.addNewGame(playerId);


			} catch (error) {
				console.error('Erreur lors de la sauvegarde du score:', error);
			}
		
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

		// bouton + menage avant de relancer
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

		// Redemarrer le jeu apres click sur 'replay'
		restartGame() {
			if (this.stop)
				this.stopGame();
			setTimeout(() => {
				this.start();
			}, 50);

		}

		// Get player ID from database
		async getCurrentPlayerId() {
			if (this.cachedUserId !== null) {
				return this.cachedUserId;
			}
			try {
				const response = await fetch('/api/current-user/', {
					credentials: 'same-origin'
				});
				const data = await response.json();
				this.cachedUserId = data.userId;
				console.log("user ID = ", this.cachedUserId);
				return this.cachedUserId;
			} catch (error) {
				console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
				return null;
			}
		}

		// Add player stats to database
		async addNewGame(id_player) {
			console.log("id_player dans addNewGame: ", id_player);
			try {
				const response = await fetch('/api/add_pong/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': getCSRFToken()
					},
					credentials: 'include',
					body: JSON.stringify({  // Convertit les données en JSON
						id_p1: id_player,
						id_p2: null,
						is_bot_game: true,
						score_p1: this.count.p1,
						score_p2: this.count.p2,
						difficulty: this.user_option,
						bounce_nb: this.bounce,
					})
				});
			
				if (!response.ok) {
					const text = await response.text();
					throw new Error(`HTTP error! status: ${response.status}, message: ${text}`); }
				
				const result = await response.json();
				console.log('Nouveau jeu ajouté:', result);
			} catch (error) {
				console.error('Erreur:', error);
			}
		}

		// Calcul Ball pour le BOT
		calculateBall() {	
			let pg_option = 5 - this.user_option;
			let count = 0;
		
			let cpy_x = this.ball.coords.x;
			let cpy_y = this.ball.coords.y;
			let cpy_vx = this.ball.const_vector.vx;
			let cpy_vy = this.ball.const_vector.vy;
			while (cpy_x <= this.player2Coords.x1 && ++count < 2000) {
				if (cpy_y > 1080 - this.ball.radius || cpy_y < 0 + this.ball.radius)
					cpy_vy = -cpy_vy;
				if (cpy_x < 100 + this.ball.radius)
					cpy_vx = -cpy_vx;
				cpy_x += cpy_vx;
				cpy_y += cpy_vy;
				this.player2Coords.ball_predicted_hit++;
			}
			this.player2Coords.ball_predicted_hit = cpy_y - ((this.player2Coords.y1 + 40) + Math.floor(this.bot_getRandomArbitrary(pg_option * -10, pg_option * 10)));
			if ((this.player2Coords.ball_predicted_hit < 0 && this.player2Coords.const_vy > 0) || (this.player2Coords.ball_predicted_hit > 0 && this.player2Coords.const_vy < 0))
				this.player2Coords.const_vy = -this.player2Coords.const_vy;
		}

		// Calcul FPS
		timeRelatedStuff(start) {
			let end = Date.now();
			let elapsedTime = end - start; // Temps réel pris par la frame
			this.frameTime.counter++;
			this.frameTime.time += elapsedTime;

			if (this.bot_time < 0 || end - this.bot_time >= 1000) {
				this.bot_time = Date.now();
				this.calculateBall();
			}

			if (this.frameTime.time > 250) {
				this.totalframeTime.counter += this.frameTime.counter;
				this.totalframeTime.time += 250
				document.getElementById('fps').innerText = "Fps : " + (this.frameTime.counter * 4) + " | Avg Fps : " + (this.totalframeTime.counter * (1000 / this.totalframeTime.time)).toPrecision(3);
				this.frameTime.counter = 0;
				this.frameTime.time = 0;
			}
			this.percentage = (elapsedTime / 16.66).toPrecision(5); // Percentage of the time the frame took to render, based of the time it SHOULD have taken to render
		}

		adaptVectorsToFps() {
			this.ball.vector.vx = this.ball.const_vector.vx * this.percentage;
			this.ball.vector.vy = this.ball.const_vector.vy * this.percentage;
			this.player1Coords.vy = this.player1Coords.const_vy * this.percentage;
			this.player2Coords.vy = this.player2Coords.const_vy * this.percentage;
		}

		// Utils random direction ball
		getRandomArbitrary(min, max) {
			var result = Math.random() * (max - min) + min;
			if (result >= -9 && result <= 9)
				return this.getRandomArbitrary(min, max);
			return result;
		}

		bot_getRandomArbitrary(min, max) {
			var result = Math.random() * (max - min) + min;
			return result;
		}
	}

	window.BotGame = BotGame;
});
