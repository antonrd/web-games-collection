'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────

const CELL          = 20;        // px per grid cell
const COLS          = 25;
const ROWS          = 22;
const POINTS_PER_LVL = 20;       // points needed to advance

// Base move interval in ms (lower = faster)
const SPEED_BASE    = 200;
const SPEED_DEC     = 18;        // subtract per speed tier
const SPEED_MIN     = 80;        // floor

// Special item types
const ITEM_APPLE    = 'apple';
const ITEM_CHERRY   = 'cherry';
const ITEM_MUSHROOM = 'mushroom';
const ITEM_STAR     = 'star';

// How long special items stay on board (ms)
const ITEM_TTL      = 12000;
// Slow effect duration (ms)
const SLOW_DURATION = 6000;
// Slow multiplier (interval × this)
const SLOW_FACTOR   = 2.2;

// Obstacle density per level (fraction of empty cells that become walls)
// Level 1 = 0 obstacles; each level adds a small increment
const OBS_PER_LEVEL = 4;   // new obstacle segments added per level (beyond 1)

// ─── Game state ──────────────────────────────────────────────────────────────

let canvas, ctx;
let gameState = 'idle'; // idle | playing | paused | dead | levelup | gameover
let animFrame;
let lastStepTime = 0;
let stepInterval = SPEED_BASE;

let score   = 0;
let lives   = 3;
let level   = 1;
let levelScore = 0;   // points collected this level

let snake   = [];     // [{col, row}, ...] head first
let dir     = { dc: 1, dr: 0 };
let nextDir = { dc: 1, dr: 0 };

let grid    = [];     // 2D array: 0=empty, 1=wall

let items   = [];     // { col, row, type, spawnTime }
let nextItemId = 0;

// Active effects
let slowUntil     = 0;   // timestamp when slow ends
let starActive    = false;  // can pass through wall/self once
let starUsed      = false;  // has been used this move

// Touch tracking
let touchStartX = 0;
let touchStartY = 0;

// ─── DOM refs ────────────────────────────────────────────────────────────────

const scoreEl      = document.getElementById('score');
const levelEl      = document.getElementById('level');
const livesEl      = document.getElementById('lives');
const targetEl     = document.getElementById('target');
const puStatusEl   = document.getElementById('powerup-status');
const msgEl        = document.getElementById('message');
const msgTitle     = document.getElementById('message-title');
const msgBody      = document.getElementById('message-body');
const msgBtn       = document.getElementById('message-btn');

// ─── Initialisation ──────────────────────────────────────────────────────────

function init() {
    canvas = document.getElementById('gameCanvas');
    canvas.width  = COLS * CELL;
    canvas.height = ROWS * CELL;
    ctx = canvas.getContext('2d');

    bindInput();
    showMessage('SNAKE', 'Collect apples to score points.\nAvoid walls and your own tail!\n\n❤️❤️❤️  3 lives to start', 'PLAY', startGame);
}

function startGame() {
    score  = 0;
    lives  = 3;
    level  = 1;
    startLevel();
}

function startLevel() {
    levelScore       = 0;
    slowUntil        = 0;
    starActive       = false;
    starUsed         = false;
    lastSpecialSpawn = Date.now();
    stepInterval     = calcInterval();

    buildGrid();
    placeSnake();
    items = [];
    spawnItem(ITEM_APPLE);   // always start with one apple

    updateHUD();
    hideMessage();
    gameState = 'playing';
    lastStepTime = 0;
    if (!animFrame) animFrame = requestAnimationFrame(loop);
}

// ─── Grid / Obstacles ────────────────────────────────────────────────────────

function buildGrid() {
    // Empty grid
    grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));

    if (level <= 1) return;

    const numSegments = (level - 1) * OBS_PER_LEVEL;

    // We'll place obstacle segments: each is a short straight wall (2-5 cells)
    let placed = 0;
    let attempts = 0;
    while (placed < numSegments && attempts < 2000) {
        attempts++;
        const len   = 2 + Math.floor(Math.random() * 4); // 2-5
        const horiz = Math.random() < 0.5;
        const startC = 1 + Math.floor(Math.random() * (COLS - 2));
        const startR = 1 + Math.floor(Math.random() * (ROWS - 2));

        // Collect candidate cells
        const cells = [];
        for (let i = 0; i < len; i++) {
            const c = horiz ? startC + i : startC;
            const r = horiz ? startR     : startR + i;
            if (c < 0 || c >= COLS || r < 0 || r >= ROWS) break;
            // Keep a clear border around the starting area
            if (c >= 9 && c <= 15 && r >= 8 && r <= 13) break;
            cells.push({ c, r });
        }
        if (cells.length < 2) continue;

        // Check none of these cells already have a wall
        if (cells.some(({ c, r }) => grid[r][c] === 1)) continue;

        cells.forEach(({ c, r }) => { grid[r][c] = 1; });
        placed++;
    }
}

function isWall(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
    return grid[row][col] === 1;
}

// ─── Snake placement ─────────────────────────────────────────────────────────

function placeSnake() {
    // Start in the middle, length 3, moving right
    const midC = Math.floor(COLS / 2);
    const midR = Math.floor(ROWS / 2);
    snake = [
        { col: midC,     row: midR },
        { col: midC - 1, row: midR },
        { col: midC - 2, row: midR },
    ];
    dir     = { dc: 1, dr: 0 };
    nextDir = { dc: 1, dr: 0 };
}

// ─── Speed ───────────────────────────────────────────────────────────────────

function calcInterval() {
    // Speed tier increases every 3 levels
    const tier = Math.floor((level - 1) / 3);
    const interval = SPEED_BASE - tier * SPEED_DEC;
    return Math.max(interval, SPEED_MIN);
}

function currentInterval() {
    const base = calcInterval();
    if (Date.now() < slowUntil) return Math.round(base * SLOW_FACTOR);
    return base;
}

// ─── Items ───────────────────────────────────────────────────────────────────

function pickItemType() {
    // As levels progress, more variety appears
    const r = Math.random();
    if (level < 2) return ITEM_APPLE;

    // Cherry appears from level 2
    // Mushroom from level 3
    // Star from level 4
    const hasMushroom = level >= 3;
    const hasStar     = level >= 4;

    // Weights (out of 1)
    // Apple is always the most common
    let cherryChance   = Math.min(0.04 + (level - 2) * 0.012, 0.18);
    let mushroomChance = hasMushroom ? Math.min(0.03 + (level - 3) * 0.01, 0.12) : 0;
    let starChance     = hasStar     ? Math.min(0.02 + (level - 4) * 0.008, 0.08) : 0;

    if (r < starChance)     return ITEM_STAR;
    if (r < starChance + mushroomChance) return ITEM_MUSHROOM;
    if (r < starChance + mushroomChance + cherryChance) return ITEM_CHERRY;
    return ITEM_APPLE;
}

function spawnItem(forceType) {
    const type = forceType || pickItemType();
    const pos  = findEmptyCell();
    if (!pos) return;
    items.push({ col: pos.col, row: pos.row, type, spawnTime: Date.now(), id: nextItemId++ });
}

function findEmptyCell() {
    const snakeSet = new Set(snake.map(s => `${s.col},${s.row}`));
    const itemSet  = new Set(items.map(i => `${i.col},${i.row}`));
    const candidates = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!isWall(c, r) && !snakeSet.has(`${c},${r}`) && !itemSet.has(`${c},${r}`)) {
                candidates.push({ col: c, row: r });
            }
        }
    }
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function hasApple() {
    return items.some(i => i.type === ITEM_APPLE);
}

// ─── Main loop ───────────────────────────────────────────────────────────────

function loop(ts) {
    animFrame = requestAnimationFrame(loop);

    if (gameState !== 'playing') {
        draw(ts);
        return;
    }

    if (!lastStepTime) lastStepTime = ts;
    const interval = currentInterval();

    if (ts - lastStepTime >= interval) {
        lastStepTime = ts;
        step(ts);
    }

    // Expire items
    const now = Date.now();
    items = items.filter(item => {
        if (item.type === ITEM_APPLE) return true; // apples never expire
        return now - item.spawnTime < ITEM_TTL;
    });

    // Ensure there's always an apple
    if (!hasApple()) spawnItem(ITEM_APPLE);

    // Occasionally spawn a special item
    maybeSpawnSpecial(now);

    updateHUD();
    draw(ts);
}

let lastSpecialSpawn = 0;

function maybeSpawnSpecial(now) {
    if (level < 2) return;
    // Spawn interval decreases with level (more frequent specials at higher levels)
    const spawnInterval = Math.max(4000, 9000 - level * 300);
    if (now - lastSpecialSpawn < spawnInterval) return;
    lastSpecialSpawn = now;

    const type = pickItemType();
    if (type !== ITEM_APPLE) spawnItem(type);
}

function step(ts) {
    // Apply direction
    dir = { ...nextDir };

    const head = snake[0];
    let nc = head.col + dir.dc;
    let nr = head.row + dir.dr;

    // Check for wall/border collision
    const hitBorder = nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS;
    const hitWall   = !hitBorder && isWall(nc, nr);
    const snakeSet  = new Set(snake.slice(0, -1).map(s => `${s.col},${s.row}`));
    const hitSelf   = !hitBorder && !hitWall && snakeSet.has(`${nc},${nr}`);

    if (hitBorder || hitWall || hitSelf) {
        if (starActive && !starUsed) {
            // Star power: pass through once
            starUsed = true;
            // For border: wrap around
            if (hitBorder) {
                nc = ((nc % COLS) + COLS) % COLS;
                nr = ((nr % ROWS) + ROWS) % ROWS;
            }
            // For wall/self: just move into that cell (star consumed)
            starActive = false;
        } else {
            loseLife();
            return;
        }
    }

    // Move snake: add new head, remove tail
    snake.unshift({ col: nc, row: nr });

    // Check if we ate an item
    let ate = false;
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item.col === nc && item.row === nr) {
            ate = true;
            applyItem(item);
            items.splice(i, 1);
            break;
        }
    }

    if (!ate) {
        snake.pop(); // normal move: shrink tail
    }

    // Always ensure apple
    if (!hasApple()) spawnItem(ITEM_APPLE);

    // Check level completion
    if (levelScore >= POINTS_PER_LVL) {
        gameState = 'levelup';
        showMessage(`LEVEL ${level} CLEAR!`, `Score: ${score}\n\nNext level has more obstacles and\npossibly more special items!`, 'NEXT LEVEL', () => {
            level++;
            startLevel();
        });
    }
}

function applyItem(item) {
    switch (item.type) {
        case ITEM_APPLE:
            addPoints(1);
            // Grow: keep tail (don't pop in step — already handled by 'ate' flag)
            break;
        case ITEM_CHERRY:
            addPoints(3);
            // Grow by 2 extra (snake already grew by 1 from not popping)
            if (snake.length >= 2) {
                snake.push({ ...snake[snake.length - 1] });
                snake.push({ ...snake[snake.length - 1] });
            }
            break;
        case ITEM_MUSHROOM:
            slowUntil = Date.now() + SLOW_DURATION;
            break;
        case ITEM_STAR:
            starActive = true;
            starUsed   = false;
            break;
    }
}

function addPoints(pts) {
    score      += pts;
    levelScore += pts;
}

// ─── Lives / Death ───────────────────────────────────────────────────────────

function loseLife() {
    lives--;
    updateHUD();

    if (lives <= 0) {
        gameState = 'gameover';
        showMessage('GAME OVER', `Final Score: ${score}\nReached Level: ${level}`, 'PLAY AGAIN', startGame);
    } else {
        // Brief pause then restart position
        gameState = 'dead';
        setTimeout(() => {
            slowUntil  = 0;
            starActive = false;
            starUsed   = false;
            placeSnake();
            stepInterval = calcInterval();
            lastStepTime = 0;
            gameState = 'playing';
        }, 900);
    }
}

// ─── HUD ─────────────────────────────────────────────────────────────────────

function updateHUD() {
    scoreEl.textContent  = score;
    levelEl.textContent  = level;
    targetEl.textContent = POINTS_PER_LVL;

    const heartsNeeded = lives;
    livesEl.textContent = '❤️'.repeat(Math.max(0, heartsNeeded));

    // Power-up status
    const now = Date.now();
    const parts = [];
    if (now < slowUntil) {
        const secs = ((slowUntil - now) / 1000).toFixed(1);
        parts.push(`🍄 SLOW (${secs}s)`);
    }
    if (starActive) parts.push('⭐ STAR READY');
    puStatusEl.textContent = parts.join('   ');
}

// ─── Drawing ─────────────────────────────────────────────────────────────────

const COLOR_EMPTY        = '#0a0a0a';
const COLOR_WALL         = '#1e4a2e';
const COLOR_WALL_BORDER  = '#2d7a45';
const COLOR_SNAKE_HEAD   = '#4cff72';
const COLOR_SNAKE_BODY   = '#1e9a42';
const COLOR_SNAKE_BORDER = '#0d5a28';
const COLOR_GRID         = '#111';

const ITEM_EMOJI = {
    [ITEM_APPLE]:    '🍎',
    [ITEM_CHERRY]:   '🍒',
    [ITEM_MUSHROOM]: '🍄',
    [ITEM_STAR]:     '⭐',
};

function draw(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawWalls();
    drawItems(ts);
    drawSnake(ts);

    if (gameState === 'dead') {
        drawDeathFlash(ts);
    }

    if (gameState === 'paused') {
        drawPauseOverlay();
    }
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4cff72';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 16);

    ctx.fillStyle = '#888';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('press SPACE to continue', canvas.width / 2, canvas.height / 2 + 18);
}

function drawGrid() {
    ctx.fillStyle = COLOR_EMPTY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, ROWS * CELL);
        ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(COLS * CELL, r * CELL);
        ctx.stroke();
    }
}

function drawWalls() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] === 1) {
                ctx.fillStyle = COLOR_WALL;
                ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
                ctx.strokeStyle = COLOR_WALL_BORDER;
                ctx.lineWidth = 1;
                ctx.strokeRect(c * CELL + 0.5, r * CELL + 0.5, CELL - 1, CELL - 1);
            }
        }
    }
}

function drawItems(ts) {
    ctx.font = `${CELL - 2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const now = Date.now();

    items.forEach(item => {
        const x = item.col * CELL + CELL / 2;
        const y = item.row * CELL + CELL / 2;

        // Pulsing scale for special items
        let scale = 1;
        if (item.type !== ITEM_APPLE) {
            const age = (now - item.spawnTime) / 1000;
            // Fade out last 2 seconds
            const ttlFrac = (now - item.spawnTime) / ITEM_TTL;
            if (ttlFrac > 0.83) {
                scale = 0.6 + 0.4 * Math.sin((1 - ttlFrac) / 0.17 * Math.PI);
            } else {
                scale = 1 + 0.08 * Math.sin(age * 4);
            }
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillText(ITEM_EMOJI[item.type], 0, 1);
        ctx.restore();
    });
}

function drawSnake(ts) {
    const slowActive = Date.now() < slowUntil;

    snake.forEach((seg, i) => {
        const x = seg.col * CELL;
        const y = seg.row * CELL;
        const isHead = i === 0;

        // Color: head is bright, body fades toward tail
        let fill;
        if (isHead) {
            fill = starActive ? '#ffe866' : (slowActive ? '#7bdcff' : COLOR_SNAKE_HEAD);
        } else {
            const t = i / snake.length;
            fill = slowActive
                ? lerpColor('#5ab8e0', '#1a4a5e', t)
                : lerpColor(COLOR_SNAKE_BODY, '#0a3018', t);
        }

        // Draw segment (slightly inset for gap effect)
        const pad = isHead ? 1 : 2;
        ctx.fillStyle = fill;
        ctx.beginPath();
        roundRect(ctx, x + pad, y + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 5 : 3);
        ctx.fill();

        if (isHead) {
            ctx.strokeStyle = COLOR_SNAKE_BORDER;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            drawEyes(seg, ts);
        }
    });
}

function drawEyes(head, ts) {
    const x = head.col * CELL;
    const y = head.row * CELL;

    // Eye positions depend on direction
    const { dc, dr } = dir;
    let e1, e2;

    if (dc === 1)       { e1 = { x: x+14, y: y+5  }; e2 = { x: x+14, y: y+13 }; }
    else if (dc === -1) { e1 = { x: x+4,  y: y+5  }; e2 = { x: x+4,  y: y+13 }; }
    else if (dr === -1) { e1 = { x: x+5,  y: y+5  }; e2 = { x: x+13, y: y+5  }; }
    else                { e1 = { x: x+5,  y: y+14 }; e2 = { x: x+13, y: y+14 }; }

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(e1.x, e1.y, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2.x, e2.y, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(e1.x, e1.y, 1.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2.x, e2.y, 1.2, 0, Math.PI*2); ctx.fill();
}

let deathFlashStart = null;

function drawDeathFlash(ts) {
    if (!deathFlashStart) deathFlashStart = ts;
    const elapsed = ts - deathFlashStart;
    const alpha   = 0.5 * Math.abs(Math.sin(elapsed / 120));
    ctx.fillStyle = `rgba(255, 60, 60, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (elapsed > 800) deathFlashStart = null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function lerpColor(a, b, t) {
    const parse = hex => [
        parseInt(hex.slice(1,3),16),
        parseInt(hex.slice(3,5),16),
        parseInt(hex.slice(5,7),16),
    ];
    const ca = parse(a), cb = parse(b);
    const r = Math.round(ca[0] + (cb[0]-ca[0])*t);
    const g = Math.round(ca[1] + (cb[1]-ca[1])*t);
    const bl= Math.round(ca[2] + (cb[2]-ca[2])*t);
    return `rgb(${r},${g},${bl})`;
}

// ─── Message overlay ─────────────────────────────────────────────────────────

function showMessage(title, body, btnText, onBtn) {
    msgTitle.textContent = title;
    msgBody.textContent  = body;
    msgBtn.textContent   = btnText;
    msgBtn.onclick = () => {
        hideMessage();
        onBtn();
    };
    msgEl.classList.remove('hidden');
}

function hideMessage() {
    msgEl.classList.add('hidden');
}

// ─── Input handling ───────────────────────────────────────────────────────────

function trySetDir(dc, dr) {
    // Prevent reversing into self
    if (dc === -dir.dc && dr === -dir.dr) return;
    nextDir = { dc, dr };
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
    } else if (gameState === 'paused') {
        lastStepTime = 0; // prevent a large dt jump after unpausing
        gameState = 'playing';
    }
}

function bindInput() {
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === ' ') {
            e.preventDefault();
            togglePause();
            return;
        }
        if (gameState !== 'playing') return;
        switch (e.key) {
            case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); trySetDir( 0, -1); break;
            case 'ArrowDown':  case 's': case 'S': e.preventDefault(); trySetDir( 0,  1); break;
            case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); trySetDir(-1,  0); break;
            case 'ArrowRight': case 'd': case 'D': e.preventDefault(); trySetDir( 1,  0); break;
        }
    });

    // D-pad buttons
    document.getElementById('dUp').addEventListener('click',    () => trySetDir( 0, -1));
    document.getElementById('dDown').addEventListener('click',  () => trySetDir( 0,  1));
    document.getElementById('dLeft').addEventListener('click',  () => trySetDir(-1,  0));
    document.getElementById('dRight').addEventListener('click', () => trySetDir( 1,  0));

    // Touch swipe on canvas
    canvas.addEventListener('touchstart', e => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', e => {
        if (gameState !== 'playing') return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const minSwipe = 20;
        if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            trySetDir(dx > 0 ? 1 : -1, 0);
        } else {
            trySetDir(0, dy > 0 ? 1 : -1);
        }
    }, { passive: true });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

window.addEventListener('load', init);
