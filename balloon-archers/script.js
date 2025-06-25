document.addEventListener('DOMContentLoaded', () => {

    // Engine setup
    const { Engine, Render, World, Bodies, Body, Events, Vector } = Matter;
    const engine = Engine.create();
    const gameContainer = document.getElementById('game-container');
    const render = Render.create({
        element: gameContainer,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: false,
            background: '#87CEEB'
        }
    });

    // Game state
    let player1Score = 0;
    let player2Score = 0;
    let timer = 120;
    let gameInterval;
    let isPaused = false;
    let balloons = [];

    // Player settings
    const player1 = {
        angle: -45, // Angle in degrees, negative for left player
        power: 50,
        arrows: 20,
        reloading: false,
        body: null,
        aimArrow: null,
        powerBar: null,
        colors: {
            main: '#0077be', // Blue
            light: '#6495ED' // Lighter Blue
        }
    };
    const player2 = {
        angle: -135, // Angle in degrees, negative for right player
        power: 50,
        arrows: 20,
        reloading: false,
        body: null,
        aimArrow: null,
        powerBar: null,
        colors: {
            main: '#c4002a', // Red
            light: '#ff4d4d' // Lighter Red
        }
    };

    // DOM Elements
    const player1ScoreEl = document.getElementById('player1-score');
    const player1ArrowsEl = document.getElementById('player1-arrows');
    const player2ScoreEl = document.getElementById('player2-score');
    const player2ArrowsEl = document.getElementById('player2-arrows');
    const player1AngleEl = document.getElementById('player1-angle');
    const player1PowerEl = document.getElementById('player1-power');
    const player2AngleEl = document.getElementById('player2-angle');
    const player2PowerEl = document.getElementById('player2-power');
    const timerEl = document.getElementById('timer');
    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const finalScoreP1 = document.getElementById('final-score-p1');
    const finalScoreP2 = document.getElementById('final-score-p2');
    const messageBox = document.getElementById('message-box');
    const pauseOverlay = document.getElementById('pause-overlay');
    const restartBtn = document.getElementById('restart-btn');

    function createWorld() {
        World.clear(engine.world);
        balloons.forEach(b => World.remove(engine.world, b.body));
        balloons = [];

        // Ground
        World.add(engine.world, Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 25, window.innerWidth, 50, { isStatic: true, render: { fillStyle: '#228B22' } }));

        // Archer platforms
        player1.body = Bodies.rectangle(100, window.innerHeight - 100, 100, 50, {
            isStatic: true,
            render: {
                fillStyle: '#cccccc', // Gray fill
                strokeStyle: player1.colors.main,
                lineWidth: 4,
                zIndex: 1
            },
            collisionFilter: { group: -1 }
        });
        player2.body = Bodies.rectangle(window.innerWidth - 100, window.innerHeight - 100, 100, 50, {
            isStatic: true,
            render: {
                fillStyle: '#cccccc', // Gray fill
                strokeStyle: player2.colors.main,
                lineWidth: 4,
                zIndex: 1
            },
            collisionFilter: { group: -2 }
        });

        // Power bars
        player1.powerBar = createPowerBar(player1);
        player2.powerBar = createPowerBar(player2);

        // Aiming arrows
        player1.aimArrow = createAimArrow(player1);
        player2.aimArrow = createAimArrow(player2);

        World.add(engine.world, [player1.body, player2.body, player1.powerBar, player2.powerBar, player1.aimArrow, player2.aimArrow]);

        // Add initial balloons
        for (let i = 0; i < 10; i++) {
            createBalloon();
        }
    }

    function createBalloon() {
        const x = Math.random() * (window.innerWidth - 400) + 200;
        const y = Math.random() * (window.innerHeight / 2);
        const radius = 25;
        const color = `hsl(${Math.random() * 360}, 100%, 75%)`;

        const balloonBody = Bodies.circle(x, y, radius, {
            isSensor: true, // It should not physically interact, just trigger collision events
            frictionAir: 0, // Prevents air drag from slowing down the balloon
            render: {
                fillStyle: color,
                strokeStyle: 'black',
                lineWidth: 2
            }
        });

        const balloon = {
            body: balloonBody,
            minY: y,
            maxY: y + (Math.random() * 200 + 100),
            speed: Math.random() * 1.5 + 0.5,
            direction: Math.random() < 0.5 ? 1 : -1
        };

        balloons.push(balloon);
        World.add(engine.world, balloonBody);
    }

    function createPowerBar(player) {
        const platform = player.body;
        return Bodies.rectangle(platform.position.x, platform.position.y, 0, 50, {
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: player.colors.light,
                zIndex: 2 // Above platform, below aim arrow
            }
        });
    }

    function createAimArrow(player) {
        const startX = player.body.position.x + (player === player1 ? 30 : -30);
        const startY = player.body.position.y - 30;
        return Bodies.rectangle(startX, startY, 50, 5, {
            isSensor: true,
            isStatic: true,
            render: {
                fillStyle: player.colors.main,
                opacity: 0.7,
                zIndex: 3
            }
        });
    }

    function shootArrow(player) {
        if (player.arrows <= 0 || player.reloading || isPaused) return;

        player.arrows--;
        updateUI();

        const angleRad = player.angle * (Math.PI / 180);
        const velocityMagnitude = (player.power / 100) * 30 + 5;

        const startX = player.body.position.x + (player === player1 ? 30 : -30);
        const startY = player.body.position.y - 30;

        const arrow = Bodies.rectangle(startX, startY, 50, 5, {
            label: player === player1 ? 'arrow1' : 'arrow2',
            frictionAir: 0.01,
            render: { fillStyle: player.colors.main },
            collisionFilter: { group: player === player1 ? -1 : -2 }
        });

        const velocity = {
            x: Math.cos(angleRad) * velocityMagnitude,
            y: Math.sin(angleRad) * velocityMagnitude
        };

        Body.setAngle(arrow, angleRad);
        Body.setVelocity(arrow, velocity);

        World.add(engine.world, arrow);

        // Hide aim arrow briefly
        player.aimArrow.render.visible = false;
        setTimeout(() => {
            player.aimArrow.render.visible = true;
        }, 300);

        if (player.arrows === 0) {
            reloadArrows(player);
        }
    }

    function reloadArrows(player) {
        player.reloading = true;
        const ammoEl = player === player1 ? player1ArrowsEl.parentElement : player2ArrowsEl.parentElement;
        ammoEl.classList.add('reloading');

        setTimeout(() => {
            player.arrows = 10;
            player.reloading = false;
            ammoEl.classList.remove('reloading');
            updateUI();
        }, 10000);
    }

    function startGame() {
        player1Score = 0;
        player2Score = 0;
        player1.arrows = 20;
        player1.power = 50;
        player1.angle = -45;
        player2.arrows = 20;
        player2.power = 50;
        player2.angle = -135;
        player1.reloading = false;
        player2.reloading = false;
        isPaused = false;
        timer = 120;
        messageOverlay.classList.add('hidden');
        pauseOverlay.classList.add('hidden');

        updateUI();
        createWorld();

        gameInterval = setInterval(() => {
            timer--;
            updateUI();
            if (timer <= 0) {
                endGame();
            }
        }, 1000);

        Engine.run(engine);
        Render.run(render);
    }

    function endGame() {
        clearInterval(gameInterval);
        Engine.clear(engine);
        Render.stop(render);

        // Update final scores
        finalScoreP1.innerText = player1Score;
        finalScoreP1.style.color = player1.colors.main;
        finalScoreP2.innerText = player2Score;
        finalScoreP2.style.color = player2.colors.main;

        // Determine winner and apply styles/animations
        messageBox.classList.remove('fireworks', 'draw-anim');
        if (player1Score > player2Score) {
            messageText.innerText = 'Blue Player Wins!';
            messageText.style.color = player1.colors.main;
            messageBox.classList.add('fireworks');
        } else if (player2Score > player1Score) {
            messageText.innerText = 'Red Player Wins!';
            messageText.style.color = player2.colors.main;
            messageBox.classList.add('fireworks');
        } else {
            messageText.innerText = "It's a Draw!";
            messageText.style.color = '#333';
            messageBox.classList.add('draw-anim');
        }

        messageOverlay.classList.remove('hidden');
    }

    function updateUI() {
        player1ScoreEl.innerText = player1Score;
        player2ScoreEl.innerText = player2Score;
        player1ArrowsEl.innerText = player1.reloading ? '...' : player1.arrows;
        player2ArrowsEl.innerText = player2.reloading ? '...' : player2.arrows;
        player1AngleEl.innerText = Math.abs(player1.angle);
        player1PowerEl.innerText = player1.power;
        player2AngleEl.innerText = 180 - Math.abs(player2.angle);
        player2PowerEl.innerText = player2.power;
        timerEl.innerText = timer;
    }

    // Input handling
    const keys = {};
    window.addEventListener('keydown', (e) => { keys[e.code] = true; });
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
        if (e.code === 'Space') shootArrow(player1);
        if (e.code === 'Enter') shootArrow(player2);
        if (e.code === 'KeyP') togglePause();
    });

    Events.on(engine, 'beforeUpdate', () => {
        if (isPaused) return;

        // Player 1 controls
        if (keys['KeyA']) player1.angle = Math.max(-90, player1.angle - 1);
        if (keys['KeyD']) player1.angle = Math.min(0, player1.angle + 1);
        if (keys['KeyW']) player1.power = Math.min(100, player1.power + 1);
        if (keys['KeyS']) player1.power = Math.max(0, player1.power - 1);

        // Player 2 controls
        if (keys['ArrowLeft']) player2.angle = Math.max(-180, player2.angle - 1);
        if (keys['ArrowRight']) player2.angle = Math.min(-90, player2.angle + 1);
        if (keys['ArrowUp']) player2.power = Math.min(100, player2.power + 1);
        if (keys['ArrowDown']) player2.power = Math.max(0, player2.power - 1);

        // Update aiming arrows & power bars
        updateAimArrow(player1);
        updateAimArrow(player2);
        updatePowerBar(player1);
        updatePowerBar(player2);

        // Balloon movement
        balloons.forEach(balloon => {
            // 1. Counteract gravity to make them "float"
            Body.applyForce(balloon.body, balloon.body.position, {
                x: 0,
                y: -engine.world.gravity.y * engine.world.gravity.scale * balloon.body.mass
            });

            // 2. Change direction at the boundaries
            if (balloon.body.position.y > balloon.maxY && balloon.direction === 1) {
                balloon.direction = -1;
            } else if (balloon.body.position.y < balloon.minY && balloon.direction === -1) {
                balloon.direction = 1;
            }

            // 3. Set the vertical velocity
            Body.setVelocity(balloon.body, { x: 0, y: balloon.speed * balloon.direction });
        });

        updateUI();
    });

    function updateAimArrow(player) {
        const angleRad = player.angle * (Math.PI / 180);
        const startX = player.body.position.x + (player === player1 ? 30 : -30);
        const startY = player.body.position.y - 30;

        Body.setPosition(player.aimArrow, { x: startX, y: startY });
        Body.setAngle(player.aimArrow, angleRad);
    }

    function updatePowerBar(player) {
        const platform = player.body;
        const powerWidth = (player.power / 100) * 100; // 100 is platform width
        const xOffset = (-100 / 2) + (powerWidth / 2);

        // Recreate the body to update its width
        World.remove(engine.world, player.powerBar);
        player.powerBar = Bodies.rectangle(platform.position.x + xOffset, platform.position.y, powerWidth, 50, {
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: player.colors.light,
                zIndex: 2
            }
        });
        World.add(engine.world, player.powerBar);
    }

    // Collision handling
    Events.on(engine, 'collisionStart', (event) => {
        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            const isArrow1 = bodyA.label === 'arrow1' || bodyB.label === 'arrow1';
            const isArrow2 = bodyA.label === 'arrow2' || bodyB.label === 'arrow2';
            const isBalloon = balloons.some(b => b.body === bodyA || b.body === bodyB);

            if (isBalloon && (isArrow1 || isArrow2)) {
                const balloonBody = balloons.find(b => b.body === bodyA || b.body === bodyB).body;
                World.remove(engine.world, balloonBody);
                balloons = balloons.filter(b => b.body !== balloonBody);

                if(isArrow1) {
                    player1Score++;
                    World.remove(engine.world, bodyA.label === 'arrow1' ? bodyA : bodyB);
                }
                if(isArrow2) {
                    player2Score++;
                     World.remove(engine.world, bodyA.label === 'arrow2' ? bodyA : bodyB);
                }

                // Add a new balloon
                setTimeout(createBalloon, 1000);
            }
        });
    });

    restartBtn.addEventListener('click', startGame);

    // Add this new function
    function togglePause() {
        isPaused = !isPaused;

        if (isPaused) {
            engine.timing.timeScale = 0; // Freeze the physics
            clearInterval(gameInterval);
            pauseOverlay.classList.remove('hidden');
        } else {
            engine.timing.timeScale = 1; // Unfreeze
            gameInterval = setInterval(() => {
                timer--;
                updateUI();
                if (timer <= 0) {
                    endGame();
                }
            }, 1000);
            pauseOverlay.classList.add('hidden');
        }
    }

    // Initial game start
    startGame();
});
