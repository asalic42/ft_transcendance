class CasseBriqueGame {

	constructor() {
		this.keyHandler = this.handleKey.bind(this);
		this.initState();
		this.selectMap();
	}

	initState() {
		this.macro_ballSpeedIncr = 0.075;
		this.macro_ballInitialSpeed = 9;

		this.frameTime = { counter : 0, time : 0 };
		this.totalframeTime = { counter : 0, time : 0 };
		this.percentage = 0;

		this.mapTab = [];
		this.selectedMap;

		this.count = 0;
		this.health = 5;
		this.cachedUserId = null;
		this.stop = false;
		this.animationId = 0;
		this.keys = {};

		this.blocksDestroyed = 0;
		this.block_arr = [];

		this.ball = null;
		this.player1Coords = null;

		this.setupListeners();
	}
	
	selectMap() {

		document.getElementById('map-choice').addEventListener('click', (event) => {
			if (event.target.closest('.mapButton')) {
				this.selectedMap = event.target.dataset.mapId
				this.launchGame(this.selectedMap);
			}
		});
	}

	async launchGame(mapId) {
			
		await this.fetchMap(mapId);

		document.getElementById("fps").style.display = 'flex';
		document.getElementById("score").style.display = 'flex';
		Array.from(document.getElementsByClassName("game")).forEach(element => element.style.display = 'flex');
		document.getElementById('mapSelection').style.display ='none';
		
		this.update();

		this.createBlocks();
		this.createBall(Math.floor(this.getRandomArbitrary(-11, 0)));
	}

	setupListeners() {

		this.keyHandler = (e) => this.handleKey(e);
		window.addEventListener('keydown', this.keyHandler);
		window.addEventListener('keyup', this.keyHandler);
	}

	handleKey(e) {
		this.keys[e.key] = (e.type === 'keydown');
	}

	// CREATE game's stuff
	createBlocks() {
		var start_x = document.getElementById("game").width / 8;
		var start_y = document.getElementById("game").height / 24;
		var x = start_x - 5
		var y = start_y - 5;
		var width = start_x - 5;
		var height = start_y - 5;
	
		for (var i = 0; i < 6; i++) {
			for (var j = 0; j < 12; j++) {
				this.block_arr.push({
					x1: x,
					y1: y + start_y + start_y,
					width: width,
					height: height,
					state: this.mapTab[j][i]
				});
				y += start_y;
			}
			x += start_x;
			y = start_y - 5;
		}
	}
	
	// vy remplace BALL_INITIAL_SPEED !!!
	createBall(vy) {
		// Balls coords
		this.ball = { coords : { x : (document.getElementById("game").height / 2), y : document.getElementById("game").height - 70 },
					const_vector : { vy : vy, vx : this.macro_ballInitialSpeed, speed: this.macro_ballInitialSpeed },
					vector : {},
					radius : 13,
					hit_horizontal : 0,
					hit_vertical : 0,
					hit_player : 0 };
	
		this.ball.vector = { vx: this.ball.const_vector.vx, vy: this.ball.const_vector.vy, total : this.ball.const_vector.vy + this.ball.const_vector.vx };
	
		// Initials points player 1
		this.player1Coords = { y1 : document.getElementById("game").height - 50, x1 : (document.getElementById("game").height / 2) - 60, y2 : document.getElementById("game").height - 35, x2 : (document.getElementById("game").height / 2) + 60, const_vx : 20, vx : 20 };
	
		this.gameLoop(Date.now());
		if (this.isGameOver())
			this.winnerWindow();
	}
	
	// DRAWING Ball & Player & Blocks & Area
	drawPlayer() {
		
		this.movePlayer();
		document.getElementById("game").getContext("2d").fillStyle = "#ED4EB0";
		document.getElementById("game").getContext("2d").beginPath();
		document.getElementById("game").getContext("2d").roundRect(this.player1Coords.x1, this.player1Coords.y1, 120, this.player1Coords.y2 - this.player1Coords.y1, 7);
		document.getElementById("game").getContext("2d").fill();
		document.getElementById("game").getContext("2d").closePath();
	}

	drawBlocks() {
		for (let k = 0; k < this.block_arr.length; k++) {
			if (this.block_arr[k].state) {
				document.getElementById("game").getContext("2d").beginPath();
				switch (this.block_arr[k].state) {
					case 5:
						document.getElementById("game").getContext("2d").fillStyle = "green";
						break;
					case 4:
						document.getElementById("game").getContext("2d").fillStyle = "yellow";
						break;
					case 3:
						document.getElementById("game").getContext("2d").fillStyle = "orange";
						break;
					case 2:
						document.getElementById("game").getContext("2d").fillStyle = "red";
						break;
					case 1:
						document.getElementById("game").getContext("2d").fillStyle = "darkred";
						break;
				}
				document.getElementById("game").getContext("2d").roundRect(this.block_arr[k].x1, this.block_arr[k].y1, this.block_arr[k].width, this.block_arr[k].height, 10);
				document.getElementById("game").getContext("2d").fill();
			}
		}
	}
	
	drawOuterRectangle(color) {
		document.getElementById("game").getContext("2d").fillStyle = color;
		document.getElementById("game").getContext("2d").beginPath();
		document.getElementById("game").getContext("2d").roundRect(0, 0, document.getElementById("game").width, document.getElementById("game").height, 10);
		document.getElementById("game").getContext("2d").fill();
		document.getElementById("game").getContext("2d").closePath();
	}
	
	drawInnerRectangle(color) {
		document.getElementById("game").getContext("2d").fillStyle = color;
		document.getElementById("game").getContext("2d").beginPath();
		document.getElementById("game").getContext("2d").roundRect(5, 5, document.getElementById("game").width - 10, document.getElementById("game").height - 10, 8);
		document.getElementById("game").getContext("2d").fill();
		document.getElementById("game").getContext("2d").closePath();
	}

	update() {
		this.drawOuterRectangle("#ED4EB0");
		this.drawInnerRectangle("#23232e");
	}
	
	drawBall() {
		document.getElementById("game").getContext("2d").beginPath();
		document.getElementById("game").getContext("2d").fillStyle = 'white';
		document.getElementById("game").getContext("2d").arc(this.ball.coords.x, this.ball.coords.y, this.ball.radius, Math.PI * 2, false);
		document.getElementById("game").getContext("2d").fill();
		document.getElementById("game").getContext("2d").closePath();
		
		document.getElementById("game").getContext("2d").beginPath();
		document.getElementById("game").getContext("2d").fillStyle = "#23232e";
		document.getElementById("game").getContext("2d").arc(this.ball.coords.x, this.ball.coords.y, this.ball.radius - 2, Math.PI * 2, false);
		document.getElementById("game").getContext("2d").fill();
		document.getElementById("game").getContext("2d").stroke();
		document.getElementById("game").getContext("2d").closePath();
	}
	
	// COLLISION Wall & Blocks & Player
	isBallHittingPlayer() {

		if (this.ball.hit_player > 0 && this.ball.hit_player < 15) {
			this.ball.hit_player++;
			return false;
		}
	
		if (this.ball.hit_player >= 15)
			this.ball.hit_player = 0;
	
		if (this.ball.coords.x + this.ball.radius / 2 >= this.player1Coords.x1 && this.ball.coords.x - this.ball.radius / 2 <= this.player1Coords.x2 &&
				this.ball.coords.y + this.ball.radius >= this.player1Coords.y1 &&
				this.ball.coords.y + this.ball.radius <= this.player1Coords.y2) {
					this.ball.hit_player = 1;
					this.incrementBallSpeed();
					return true;
				}
	
		return false;
	}

	isBallHittingWall() {
		// Collision avec les murs gauche ou droit
		if ((this.ball.coords.x - this.ball.radius <= 0 || this.ball.coords.x + this.ball.radius >= document.getElementById("game").width) && this.ball.hit_horizontal === 0) {
			this.ball.hit_horizontal = 1;
			this.ball.const_vector.vx = -this.ball.const_vector.vx;
			this.ball.vector.vx = this.ball.const_vector.vx;
			this.incrementBallSpeed();
	
			// Ajuster la position pour que la balle ne colle pas au mur
			if (this.ball.coords.x - this.ball.radius <= 0) {
				this.ball.coords.x = this.ball.radius;
			} else if (this.ball.coords.x + this.ball.radius >= document.getElementById("game").width) {
				this.ball.coords.x = document.getElementById("game").width - this.ball.radius;
			}
		}
	
		// Collision avec le plafond
		if (this.ball.coords.y - this.ball.radius <= 0 && this.ball.hit_vertical === 0) {
			this.ball.hit_vertical = 1;
			this.ball.const_vector.vy = -this.ball.const_vector.vy;
			this.ball.vector.vy = this.ball.const_vector.vy;
			this.incrementBallSpeed();
	
			// Ajuster la position pour que la balle ne colle pas au plafond
			this.ball.coords.y = this.ball.radius;
		}
	
		if (this.ball.hit_horizontal > 0) this.ball.hit_horizontal++;
		if (this.ball.hit_vertical > 0) this.ball.hit_vertical++;
	
		if (this.ball.hit_horizontal > 5) this.ball.hit_horizontal = 0;
		if (this.ball.hit_vertical > 5) this.ball.hit_vertical = 0;
	}
	
	handlePlayerCollision() {
		const intersection = ((this.player1Coords.x1 + 60 - this.ball.coords.x) / -60);
		this.ball.const_vector.vx = Math.max(-1, Math.min(1, intersection)) * Math.abs(this.ball.const_vector.vy);
		this.ball.const_vector.vy = -this.ball.const_vector.vy;
		this.incrementBallSpeed();
	
		this.ball.vector.vx = this.ball.const_vector.vx;
		this.ball.vector.vy = this.ball.const_vector.vy;
	}
	
	isBallHittingblock() {
		for (let k = 0; k < this.block_arr.length; k++) {
			if (!this.block_arr[k].state) continue;
	
			// Calcul des coordonnées futures de la balle
			var ballFutureX = this.ball.coords.x + this.ball.const_vector.vx;
			var ballFutureY = this.ball.coords.y + this.ball.const_vector.vy;
	
			if (((ballFutureX + this.ball.radius >= this.block_arr[k].x1 && ballFutureX - this.ball.radius <= this.block_arr[k].x1 + this.block_arr[k].width)) &&
				((ballFutureY + this.ball.radius >= this.block_arr[k].y1 && ballFutureY - this.ball.radius <= this.block_arr[k].y1 + this.block_arr[k].height))) {
	
				const hitLeftOrRight = this.ball.coords.x <= this.block_arr[k].x1 || this.ball.coords.x >= this.block_arr[k].x1 + this.block_arr[k].width;
				const hitTopOrBottom = this.ball.coords.y <= this.block_arr[k].y1 || this.ball.coords.y >= this.block_arr[k].y1 + this.block_arr[k].height;
	
				if (hitLeftOrRight && hitTopOrBottom) {
					// Collision sur un coin
					this.ball.const_vector.vx = -this.ball.const_vector.vx;
					this.ball.const_vector.vy = -this.ball.const_vector.vy;
				} else if (hitLeftOrRight) {
					// Collision sur les côtés gauche/droite
					this.ball.const_vector.vx = -this.ball.const_vector.vx;
					// Ajuster la position
					if (this.ball.coords.x <= this.block_arr[k].x1) {
						this.ball.coords.x = this.block_arr[k].x1 - this.ball.radius;
					} else {
						this.ball.coords.x = this.block_arr[k].x1 + this.block_arr[k].width + this.ball.radius;
					}
				} else if (hitTopOrBottom) {
					// Collision sur les côtés haut/bas
					this.ball.const_vector.vy = -this.ball.const_vector.vy;
					// Ajuster la position
					if (this.ball.coords.y <= this.block_arr[k].y1) {
						this.ball.coords.y = this.block_arr[k].y1 - this.ball.radius;
					} else {
						this.ball.coords.y = this.block_arr[k].y1 + this.block_arr[k].height + this.ball.radius;
					}
				}
	
				this.ball.vector.vx = this.ball.const_vector.vx;
				this.ball.vector.vy = this.ball.const_vector.vy;
	
				this.incrementBallSpeed();
	
				this.block_arr[k].state--;
				if (!this.block_arr[k].state) {
					this.blocksDestroyed++;
				}
				this.count += Math.abs(5 - this.block_arr[k].state);
				break;
			}
		}
	}

	// MOVE Player & Ball
	movePlayer() {

		if (this.keys["q"] && this.player1Coords.x1 - this.player1Coords.vx > 0) {
			this.player1Coords.x1 -= this.player1Coords.vx;
			this.player1Coords.x2 -= this.player1Coords.vx;
		}
		if (this.keys["d"] && this.player1Coords.x2 + this.player1Coords.vx < document.getElementById("game").height) {
			this.player1Coords.x1 += this.player1Coords.vx;
			this.player1Coords.x2 += this.player1Coords.vx;
		}
	}
	
	moveBall() {
		const steps = 5; // Subdiviser le mouvement en étapes
		const stepX = this.ball.vector.vx / steps;
		const stepY = this.ball.vector.vy / steps;
	
		for (let i = 0; i < steps; i++) {
			this.ball.coords.x += stepX;
			this.ball.coords.y += stepY;
	
			if (this.isBallHittingPlayer()) {
				this.handlePlayerCollision();
			}
	
			this.isBallHittingWall();
			this.isBallHittingblock();
		}
		this.drawBall();
	}

	//! Loop func
	gameLoop(start) {
		if (this.stop)
			return;

		const frame = () => {

			if (this.stop || !document.getElementById("game")) {
				cancelAnimationFrame(this.animationId);
				return ;
			}

			this.timeRelatedStuff(start);
			this.adaptVectorsToFps();
			start = Date.now();
			document.getElementById("game").getContext("2d").clearRect(0, 0, document.getElementById("game").width, document.getElementById("game").height);

			this.update();
			this.drawPlayer();
			if (this.isPoint())
				return;

			this.drawBlocks();
			this.moveBall();
			document.getElementById("score").innerText = "Score : " + this.count;

			this.animationId = requestAnimationFrame(frame);
		}

		this.animationId = requestAnimationFrame(frame);
	}	

	// CHECKS game over
	isPoint() {
		if (this.blocksDestroyed == 72) {
			this.blocksDestroyed++;
			this.createBall(Math.floor(this.getRandomArbitrary(-11, 0)));
			return true;
		}
		if (this.ball.coords.y + this.ball.radius >= document.getElementById("game").height) {
			this.health--;
			this.createBall(Math.floor(this.getRandomArbitrary(-11, 0)));
			return true;
		}
		return false;
	}

	isGameOver() {
		if (this.blocksDestroyed == 73) {
			this.stop = true;
			return true;
		}
		if (this.health <= 0) {
			this.stop = true;
			return true;
		}
		return false;
	}

	async winnerWindow() {
		if (window.hidden)
			return;
		document.getElementById("game").getContext("2d").clearRect(0, 0, document.getElementById("game").width, document.getElementById("game").height);
		document.getElementById("gameOver").style.display = "flex";
		this.drawOuterRectangle("#C42021");
		if (this.blocksDestroyed == 73) {
			this.drawOuterRectangle("#365FA0");
			document.getElementById("gameOver").style.color = "#365FA0";
			document.getElementById("gameOver").textContent = "Omg ! You won !";
			document.getElementById("replay-button").style.color = "#365FA0";
		}
		this.drawInnerRectangle("#23232e");
	
		cancelAnimationFrame(this.animationId);


		try {
			const playerId = await this.getCurrentPlayerId();
			if (!playerId) {
				console.error('Impossible de sauvegarder le score : utilisateur non connecté');
				this.showReplayButton();  // Au lieu de replay() directement
				return;
			}
			
			// Attendre que l'ajout du score soit terminé
			await this.addNewGame(playerId);
			
		} catch (error) {
			console.error('Erreur lors de la sauvegarde du score:', error);
		}
		this.showReplayButton();
	}
	
	// Séparer l'affichage du bouton replay de son action
	showReplayButton() {
		const button = document.getElementById("replay-button");
		if (button) {
			button.style.display = "flex";
			button.style.color = "#C42021";
			button.addEventListener("click", () => {
				button.style.display = "none";
				document.getElementById("gameOver").style.display = "none";
				this.restartGame();
			});
		}
	}

	stopGame() {
		this.stop = true;

		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}

		window.removeEventListener('keydown', this.keyHandler);
		window.removeEventListener('keyup', this.keyHandler);
		this.keyHandler = null;

		if (document.getElementById('game').getContext('2d')) {
			document.getElementById('game').getContext('2d').clearRect(0, 0, document.getElementById('game').width, document.getElementById('game').height);
		}
	}

	restartGame() {
		if (this.stop) {
			this.stopGame();
			this.keyHandler = this.handleKey.bind(this);
			this.initState();
			this.launchGame(this.selectedMap);
		}
	}

	// API stuff
	async addNewGame(id_player) {
		try {
			const response = await fetch('/api/add_solo_casse_brique/', {
				method: 'POST',
				credentials: 'same-origin',
				headers: {
					'X-CSRFToken': this.getCookie(),  // Use the function directly
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id_player: id_player,
					id_map: this.selectedMap,
					score: this.count
				})
			});
	
			if (!response.ok) {
				const text = await response.text();
				throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
			}
	
			const result = await response.json();
		} catch (error) {
			console.error('Erreur:', error);
		}
	}

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
			return this.cachedUserId;
		} catch (error) {
			console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
			return null;
		}
	}

	async fetchMap(mapId) {
		return fetch(`/api/map/${mapId}/`)
		.then(response => response.text())
		.then(mapData => {
			const mapLines = mapData.split('\n');
			mapLines.forEach((element) => {
				const row = element.split('').map(x => Number(x))
				this.mapTab.push(row);
				row.forEach((number) => {
					if (number === 0)
						this.blocksDestroyed++;
				});
			});
		})
		.catch(error => {
			console.error('Erreur lors de la récupération des données de la carte:', error);
		});
	}

	getCookie() {
		return document.cookie
			.split('; ')
			.find(row => row.startsWith('csrftoken='))
			?.split('=')[1] || '';
	}

	// Utils functions
	incrementBallSpeed() {
		this.ball.const_vector.speed += this.macro_ballSpeedIncr;
		const speedRatio = this.ball.const_vector.speed / Math.sqrt(this.ball.const_vector.vx ** 2 + this.ball.const_vector.vy ** 2);
		this.ball.const_vector.vx *= speedRatio;
		this.ball.const_vector.vy *= speedRatio;
		this.ball.vector.vx = this.ball.const_vector.vx;
		this.ball.vector.vy = this.ball.const_vector.vy;
	}

	timeRelatedStuff(start) {
		let end = Date.now();
		let elapsedTime = end - start; // Temps réel pris par la frame
		this.frameTime.counter++;
		this.frameTime.time += elapsedTime;
	
	
		if (this.frameTime.time > 250) {
			this.totalframeTime.counter += this.frameTime.counter;
			this.totalframeTime.time += 250
			document.getElementById("fps").innerText = "Fps : " + (this.frameTime.counter * 4) + " | Avg Fps : " + (this.totalframeTime.counter * (1000 / this.totalframeTime.time)).toPrecision(3);
			this.frameTime.counter = 0;
			this.frameTime.time = 0;
		}
		this.percentage = (elapsedTime / 16.66).toPrecision(5); // Percentage of the time the frame took to render, based of the time it SHOULD have taken to render
	}
	
	adaptVectorsToFps() {
		this.ball.vector.vx = this.ball.const_vector.vx * this.percentage;
		this.ball.vector.vy = this.ball.const_vector.vy * this.percentage;
		this.player1Coords.vx = this.player1Coords.const_vx * this.percentage;
	}

	getRandomArbitrary(min, max) {
		var result = Math.random() * (max - min) + min;
		if (result >= -8 && result <= 8)
			return this.getRandomArbitrary(min, max);
		return result;
	}
}