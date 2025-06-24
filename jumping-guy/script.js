const guy = document.getElementById('guy');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const livesDisplay = document.getElementById('lives');
const bulletsDisplay = document.getElementById('bullets');
const menu = document.getElementById('menu');
const menuTitle = document.getElementById('menu-title');
const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');

guy.addEventListener('animationend', e => {
    if (e.animationName === 'jump') {
        isJumping = false;
        guy.classList.remove('jump');
        if (jumpQueued) {
            jumpQueued = false;
            setTimeout(jump, 0);
        }
    }
});

let score = 0;
let lives = 3;
let bullets = 0;
let highScore = 0;
let gameSpeed = 5;
let isJumping = false;
let jumpQueued = false;
let jumpStartTime = 0;
let gemCounterForBullets = 0;
let gameOver = false;
let isPaused = false;
let passedRocksCount = 0;
let isSpacebarDown = false;
let isXDown = false;
let isPDown = false;
let isNDown = false;

let obstacleInterval = 2000; // ms

let obstacleTimerId, gemTimerId, cloudTimerId, treeTimerId;

// Sky color variables
let skyLightness = 73; // Corresponds to HSL lightness for #87CEEB
let lightnessDirection = -1; // -1 for getting darker, 1 for lighter
const lightnessStep = 5; // The amount to change lightness by
const maxLightness = 73;
const minLightness = 20;

let obstacles = [];
let gems = [];
let activeBullets = [];
let clouds = [];
let trees = [];

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !gameOver && !isPaused && !isSpacebarDown) {
        isSpacebarDown = true;
        if (isJumping) {
            // Allow queuing a jump in the last 300ms of the current jump animation (800ms total).
            if (Date.now() - jumpStartTime > 500) {
                jumpQueued = true;
            }
        } else {
            jump();
        }
    }
    if (e.code === 'KeyX' && bullets > 0 && !gameOver && !isPaused && !isXDown) {
        isXDown = true;
        shoot();
    }
    if (e.code === 'KeyP' && !gameOver && !isPDown) {
        isPDown = true;
        togglePause();
    }
    if (e.code === 'KeyN' && !isNDown && menu.style.display === 'block') {
        isNDown = true;
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        isSpacebarDown = false;
    }
    if (e.code === 'KeyX') {
        isXDown = false;
    }
    if (e.code === 'KeyP') {
        isPDown = false;
    }
    if (e.code === 'KeyN') {
        isNDown = false;
    }
});

function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    gameContainer.classList.toggle('paused', isPaused);

    if (isPaused) {
        clearTimeout(obstacleTimerId);
        clearTimeout(gemTimerId);
        clearTimeout(cloudTimerId);
        clearTimeout(treeTimerId);
        showMenu('pause');
    } else {
        menu.style.display = 'none';
        requestAnimationFrame(gameLoop);
        scheduleNextObstacle();
        scheduleNextGem();
        scheduleNextCloud();
        scheduleNextTree();
    }
}

function jump() {
    if (isJumping) return;
    isJumping = true;
    jumpStartTime = Date.now();
    guy.classList.add('jump');
}

function shoot() {
    bullets--;
    updateBulletsDisplay();

    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    const guyRect = guy.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    bullet.style.left = (guyRect.right - containerRect.left) + 'px';
    bullet.style.top = (guyRect.top - containerRect.top + guyRect.height / 2) + 'px';

    gameContainer.appendChild(bullet);
    activeBullets.push(bullet);
}

function createObstacle() {
    if (gameOver || isPaused) return;
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    obstacle.style.left = '800px';
    gameContainer.appendChild(obstacle);
    obstacles.push(obstacle);
    scheduleNextObstacle();
}

function scheduleNextObstacle() {
    if (gameOver) return;
    const nextInterval = obstacleInterval - (score * 2);
    const minInterval = 800 / (gameSpeed / 5);
    const timeout = Math.max(minInterval, nextInterval);
    obstacleTimerId = setTimeout(createObstacle, timeout);
}

function createGem() {
    if (gameOver || isPaused) return;
    const gem = document.createElement('div');
    gem.classList.add('gem');
    gem.style.left = '800px';
    gem.style.bottom = (80 + Math.random() * 100) + 'px';
    gameContainer.appendChild(gem);
    gems.push(gem);
    scheduleNextGem();
}

function scheduleNextGem() {
    if (gameOver) return;
    const timeout = 2000 + Math.random() * 2000;
    gemTimerId = setTimeout(createGem, timeout);
}

function createCloud() {
    if (gameOver || isPaused) return;
    const cloud = document.createElement('div');
    cloud.classList.add('cloud');
    cloud.style.left = '800px';
    cloud.style.top = (20 + Math.random() * 80) + 'px';
    cloud.dataset.speedModifier = (Math.random() * 0.5 + 0.3).toFixed(2);
    gameContainer.appendChild(cloud);
    clouds.push(cloud);
    scheduleNextCloud();
}

function scheduleNextCloud() {
    if (gameOver) return;
    const timeout = 7000 + Math.random() * 7000;
    cloudTimerId = setTimeout(createCloud, timeout);
}

function createTree() {
    if (gameOver || isPaused) return;
    const tree = document.createElement('div');
    tree.classList.add('tree');

    const height = 60 + Math.random() * 40;
    const baseWidth = 30 + Math.random() * 20;
    const greenShades = ['#228B22', '#006400', '#556B2F'];
    const color = greenShades[Math.floor(Math.random() * greenShades.length)];

    tree.style.setProperty('--tree-height', `${height}px`);
    tree.style.setProperty('--tree-width', `${baseWidth}px`);
    tree.style.setProperty('--tree-color', color);
    tree.style.left = '800px';

    tree.dataset.speedModifier = (Math.random() * 0.2 + 0.3).toFixed(2);

    gameContainer.appendChild(tree);
    trees.push(tree);
    scheduleNextTree();
}

function scheduleNextTree() {
    if (gameOver) return;
    const timeout = 4000 + Math.random() * 4000;
    treeTimerId = setTimeout(createTree, timeout);
}

function gameLoop() {
    if (isPaused || gameOver) {
        return;
    }

    // Move Mountains
    let mountainsLeft = parseInt(window.getComputedStyle(mountains).left);
    mountainsLeft -= gameSpeed * 0.2; // Move at 20% of game speed
    if (mountainsLeft < -800) { // When it's off screen
        mountainsLeft = 800; // Reset to the right
    }
    mountains.style.left = mountainsLeft + 'px';

    // Move Trees
    for (let i = trees.length - 1; i >= 0; i--) {
        const tree = trees[i];
        let currentLeft = parseInt(tree.style.left);
        currentLeft -= gameSpeed * tree.dataset.speedModifier;
        tree.style.left = currentLeft + 'px';

        if (currentLeft < -60) {
            tree.remove();
            trees.splice(i, 1);
        }
    }

    // Move Clouds
    for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];
        let currentLeft = parseInt(cloud.style.left);
        currentLeft -= gameSpeed * cloud.dataset.speedModifier;
        cloud.style.left = currentLeft + 'px';

        if (currentLeft < -100) {
            cloud.remove();
            clouds.splice(i, 1);
        }
    }

    // Move Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        let currentLeft = parseInt(obstacle.style.left);
        currentLeft -= gameSpeed;
        obstacle.style.left = currentLeft + 'px';

        if (currentLeft < -30) {
            obstacle.remove();
            obstacles.splice(i, 1);
            passedRocksCount++;
            if (passedRocksCount > 0 && passedRocksCount % 10 === 0) {
                gameSpeed += 0.5;

                skyLightness += lightnessStep * lightnessDirection;
                if (skyLightness <= minLightness) {
                    skyLightness = minLightness;
                    lightnessDirection = 1;
                } else if (skyLightness >= maxLightness) {
                    skyLightness = maxLightness;
                    lightnessDirection = -1;
                }
                gameContainer.style.backgroundColor = `hsl(197, 71%, ${skyLightness}%)`;
            }
        }
    }

    // Move Gems
    for (let i = gems.length - 1; i >= 0; i--) {
        const gem = gems[i];
        let currentLeft = parseInt(gem.style.left);
        currentLeft -= gameSpeed;
        gem.style.left = currentLeft + 'px';

        if (currentLeft < -25) {
            gem.remove();
            gems.splice(i, 1);
        }
    }

    // Move Bullets
    for (let i = activeBullets.length - 1; i >= 0; i--) {
        const bullet = activeBullets[i];
        let currentLeft = parseInt(bullet.style.left);
        currentLeft += 10; // Bullet speed
        bullet.style.left = currentLeft + 'px';

        if (currentLeft > 800) {
            bullet.remove();
            activeBullets.splice(i, 1);
        }
    }

    checkCollisions();

    requestAnimationFrame(gameLoop);
}

function checkCollisions() {
    const guyRect = guy.getBoundingClientRect();

    // Player vs Obstacle
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        const obstacleRect = obstacle.getBoundingClientRect();
        if (isColliding(guyRect, obstacleRect, 10)) {
            obstacle.remove();
            obstacles.splice(i, 1);
            loseLife();
        }
    }

    // Player vs Gem
    for (let i = gems.length - 1; i >= 0; i--) {
        const gem = gems[i];
        const gemRect = gem.getBoundingClientRect();
        if (isColliding(guyRect, gemRect, 5)) {
            gem.remove();
            gems.splice(i, 1);
            collectGem();
        }
    }

    // Bullet vs Obstacle
    for (let i = activeBullets.length - 1; i >= 0; i--) {
        const bullet = activeBullets[i];
        const bulletRect = bullet.getBoundingClientRect();

        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obstacle = obstacles[j];
            const obstacleRect = obstacle.getBoundingClientRect();

            if(isColliding(bulletRect, obstacleRect)) {
                bullet.remove();
                activeBullets.splice(i, 1);
                obstacle.remove();
                obstacles.splice(j, 1);
                break; // a bullet can only hit one obstacle
            }
        }
    }
}

function isColliding(rect1, rect2, padding = 0) {
    // Add a padding to shrink the hitboxes, making collisions less strict.
    return !(
        rect1.right - padding < rect2.left + padding ||
        rect1.left + padding > rect2.right - padding ||
        rect1.bottom - padding < rect2.top + padding ||
        rect1.top + padding > rect2.bottom - padding
    );
}

function loseLife() {
    lives--;
    updateLivesDisplay();
    if (lives <= 0) {
        gameOver = true;

        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            localStorage.setItem('jumpingGuyHighScore', highScore);
        }

        clearTimeout(obstacleTimerId);
        clearTimeout(gemTimerId);
        clearTimeout(cloudTimerId);
        clearTimeout(treeTimerId);
        gameContainer.classList.add('paused');
        showMenu('gameover');
    }
}

function collectGem() {
    score++;
    gemCounterForBullets++;
    scoreDisplay.textContent = score;

    if (highScore > 0 && score > highScore) {
        scoreDisplay.parentElement.style.backgroundColor = 'mediumpurple';
    }

    if (gemCounterForBullets >= 10) {
        bullets += 5;
        gemCounterForBullets = 0;

        bulletsDisplay.textContent = bullets;
        const bulletContainer = bulletsDisplay.parentElement;

        // Flash purple
        bulletContainer.style.backgroundColor = 'mediumpurple';

        // After a short delay, set it to the normal color for having bullets
        setTimeout(() => {
            bulletContainer.style.backgroundColor = 'lightcoral';
        }, 300);
    }
}

function updateBulletsDisplay() {
    bulletsDisplay.textContent = bullets;
    bulletsDisplay.parentElement.style.backgroundColor = bullets > 0 ? 'lightcoral' : 'rgba(0, 0, 0, 0.2)';
}

function updateLivesDisplay() {
    livesDisplay.textContent = lives;
    const livesContainer = livesDisplay.parentElement;
    switch(lives) {
        case 3:
            livesContainer.style.backgroundColor = 'green';
            break;
        case 2:
            livesContainer.style.backgroundColor = 'orange';
            break;
        case 1:
            livesContainer.style.backgroundColor = 'lightcoral';
            break;
        default:
            livesContainer.style.backgroundColor = 'darkred';
            break;
    }
}

function showMenu(state) {
    let title = '';
    let showResume = false;

    switch(state) {
        case 'initial':
            title = 'Jumping Guy';
            break;
        case 'pause':
            title = 'Paused';
            showResume = true;
            break;
        case 'gameover':
            title = 'Game Over';
            break;
    }

    menuTitle.textContent = title;
    resumeBtn.style.display = showResume ? 'block' : 'none';
    menu.style.display = 'block';
}

function resetGame() {
    [...obstacles, ...gems, ...activeBullets, ...clouds, ...trees].forEach(el => el.remove());

    obstacles = [];
    gems = [];
    activeBullets = [];
    clouds = [];
    trees = [];

    score = 0;
    lives = 3;
    bullets = 0;
    gameSpeed = 5;
    isJumping = false;
    jumpQueued = false;
    jumpStartTime = 0;
    gemCounterForBullets = 0;
    passedRocksCount = 0;
    isSpacebarDown = false;
    isXDown = false;
    isPDown = false;
    isNDown = false;

    scoreDisplay.textContent = score;
    updateLivesDisplay();
    updateBulletsDisplay();

    // Reset score background, as it doesn't have its own update function
    scoreDisplay.parentElement.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';

    skyLightness = 73;
    lightnessDirection = -1;
    gameContainer.style.backgroundColor = `hsl(197, 71%, ${skyLightness}%)`;

    gameContainer.classList.remove('paused');
}

function startGame() {
    resetGame();
    gameOver = false;
    isPaused = false;
    menu.style.display = 'none';
    requestAnimationFrame(gameLoop);
    scheduleNextObstacle();
    scheduleNextGem();
    scheduleNextCloud();
    scheduleNextTree();
}

document.addEventListener('DOMContentLoaded', () => {
    highScore = localStorage.getItem('jumpingGuyHighScore') || 0;
    highScoreDisplay.textContent = highScore;
    showMenu('initial');
    startBtn.addEventListener('click', startGame);
    resumeBtn.addEventListener('click', togglePause);
});
