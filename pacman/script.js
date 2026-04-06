// ─── Constants ────────────────────────────────────────────────────────────────
const CELL = 20; // px per tile

// Tile types
const T_WALL   = 0;
const T_DOT    = 1;
const T_EMPTY  = 2;
const T_POWER  = 3; // classic power pellet (eats ghosts)
const T_TUNNEL = 4; // side tunnels

// Special powerup kinds
const PU_FREEZE  = 'freeze';  // ★ star – freeze ghosts 5s
const PU_FIRE    = 'fire';    // ◆ diamond – fire trail 10s
const PU_GHOST   = 'ghost';   // 🍌 banana – ghost form 10s
const PU_BOMB     = 'bomb';     // 💣 bomb – collect and detonate with X (kills ghosts in 5 cells)
const PU_WALL     = 'wall';     // 🧱 wall – surround current cell with barriers for 5s, use Z
const PU_TELEPORT = 'teleport'; // 🌀 teleport – collect and teleport to random far cell with C

// Colours
const COL_BG       = '#000';
const COL_WALL     = '#1a6abf';
const COL_WALL_IN  = '#0d3a6e';
const COL_DOT      = '#ffdd99';
const COL_POWER    = '#fff';
const COL_PACMAN   = '#FFD700';
const COL_FIRE     = '#ff4400';
const COL_FIRE_FD  = '#ff8800'; // fading fire

const GHOST_COLORS  = ['#FF0000','#FFB8FF','#00FFFF','#FFB852'];
const GHOST_SCARED  = '#2121de';
const GHOST_SCARED2 = '#ffffff'; // flashing near end

// Speeds (cells per second)
const PACMAN_SPEED  = 7.5;
const GHOST_SPEED   = 5.5;
const GHOST_SCARED_SPEED = 3.5;

// Timings (ms)
const POWER_DURATION   = 8000;
const FREEZE_DURATION  = 5000;
const FIRE_DURATION    = 10000;
const FIRE_TRAIL_TTL   = 5000; // each fire square lives 5s
const GHOSTFORM_DURATION = 10000;
const SPECIAL_INTERVAL_MIN = 10000;
const SPECIAL_INTERVAL_MAX = 15000;
const BOMB_RADIUS = 5; // tiles
const WALL_DURATION = 5000; // ms
const TELEPORT_MIN_DIST = 5; // minimum Manhattan distance for teleport target
const TELEPORT_ANIM_DURATION = 600; // ms total (300 fade-out + 300 fade-in)

// ─── Maze definition (28×31 classic-ish layout) ───────────────────────────────
// 0=wall, 1=dot, 2=empty, 3=power pellet, 4=tunnel
const MAZE_TEMPLATE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,3,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,3,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,2,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,2,2,2,2,2,2,2,2,2,2,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,2,0,0,0,2,2,2,0,0,0,0,0,1,0,0,0,0,0,0],
  [4,2,2,2,2,2,1,2,2,2,0,2,2,2,2,2,2,2,0,2,2,1,2,2,2,2,2,4],
  [0,0,0,0,0,0,1,0,0,2,0,2,2,2,2,2,2,2,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,2,2,2,2,2,2,2,2,2,2,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
  [0,3,1,1,0,0,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,0,0,1,1,3,0],
  [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const ROWS = MAZE_TEMPLATE.length;
const COLS = MAZE_TEMPLATE[0].length;

// Ghost house rows (row 8-12, cols 10-17)
const GHOST_HOUSE_ROWS = [8,9,10,11,12];
const GHOST_HOUSE_COLS = [10,11,12,13,14,15,16,17];

// ─── Game state ───────────────────────────────────────────────────────────────
let canvas, ctx;
let maze, totalDots;
let pacman, ghosts;
let score, lives, level;
let gameState; // 'playing' | 'paused' | 'dead' | 'won' | 'gameover'
let lastTime = 0;
let animFrame;
let gameTimer = 0; // ms elapsed while playing
let bombs = 0;      // player's bomb inventory
let walls = 0;      // player's wall inventory
let teleports = 0;  // player's teleport inventory

// Bomb explosion animation: { x, y, radius, born, duration }
let bombExplosion = null;

// Active wall barrier: { row, col, born } — null when inactive
let wallBarrier = null;

// Teleport animation: { fromX, fromY, toX, toY, born, phase:'out'|'in' }
let teleportAnim = null;

// Special powerup on board
let specialPU = null; // { row, col, kind, spawnTime }
let specialTimer = 0;  // countdown to next spawn attempt

// Active effects on pacman
let effects = {
    power: 0,       // ms remaining (classic power pellet)
    freeze: 0,      // ms remaining
    fire: 0,        // ms remaining
    ghostForm: 0,   // ms remaining
};

// Fire trail squares: [{row, col, born}]
let fireTrail = [];

// Death animation
let deathAnim = { active: false, timer: 0, duration: 1200 };

// ─── Canvas setup ─────────────────────────────────────────────────────────────
function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    // Fit canvas to viewport
    const maxW = Math.min(window.innerWidth - 20, 580);
    const scale = Math.floor(maxW / (COLS * CELL));
    const cs = Math.max(1, scale);
    canvas.width  = COLS * CELL;
    canvas.height = ROWS * CELL;
    // CSS scale
    const cssW = COLS * CELL;
    const cssH = ROWS * CELL;
    const ratio = Math.min((window.innerWidth - 24) / cssW, 1);
    canvas.style.width  = Math.floor(cssW * ratio) + 'px';
    canvas.style.height = Math.floor(cssH * ratio) + 'px';
    ctx = canvas.getContext('2d');
}

// ─── Maze helpers ─────────────────────────────────────────────────────────────
function buildMaze() {
    maze = MAZE_TEMPLATE.map(row => row.slice());
    totalDots = 0;
    for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
            if (maze[r][c] === T_DOT || maze[r][c] === T_POWER) totalDots++;
}

function isWall(r, c) {
    if (r < 0 || r >= ROWS) return true;
    const nc = ((c % COLS) + COLS) % COLS;
    return maze[r][nc] === T_WALL;
}

function isPassable(r, c, isGhost) {
    if (r < 0 || r >= ROWS) return false;
    const nc = ((c % COLS) + COLS) % COLS;
    const t = maze[r][nc];
    if (t === T_WALL) return false;
    // Ghosts can't pass active fire (unless it's their own logic)
    if (!isGhost && t === T_WALL) return false;
    return true;
}

function isPassableForGhost(r, c) {
    if (r < 0 || r >= ROWS) return false;
    const nc = ((c % COLS) + COLS) % COLS;
    return maze[r][nc] !== T_WALL;
}

function isFireAt(r, c) {
    return fireTrail.some(f => f.row === r && f.col === c);
}

// ─── Entities ─────────────────────────────────────────────────────────────────
function makePacman() {
    return {
        row: 16, col: 14,      // pixel position (tile)
        x: 14 * CELL + CELL/2, // pixel center
        y: 16 * CELL + CELL/2,
        dx: 0, dy: 0,          // current direction
        nextDx: 0, nextDy: 0,  // queued direction
        mouthAngle: 0.25,
        mouthDir: 1,
    };
}

function makeGhosts() {
    const defs = [
        { row: 10, col: 13, color: GHOST_COLORS[0], name: 'Blinky', exitDelay: 800   },
        { row: 10, col: 14, color: GHOST_COLORS[1], name: 'Pinky',  exitDelay: 4000  },
        { row: 11, col: 13, color: GHOST_COLORS[2], name: 'Inky',   exitDelay: 8000  },
        { row: 11, col: 14, color: GHOST_COLORS[3], name: 'Clyde',  exitDelay: 12000 },
    ];
    return defs.map(d => ({
        // Tile-based position: ghost moves strictly tile-to-tile
        tileRow: d.row, tileCol: d.col, // tile the ghost is currently at
        nextRow: d.row, nextCol: d.col, // tile the ghost is heading toward
        progress: 0,                     // 0-1 fraction of the way to nextRow/nextCol
        dx: 0, dy: 0,                    // direction of current movement
        x: d.col * CELL + CELL/2,
        y: d.row * CELL + CELL/2,
        color: d.color, name: d.name,
        scared: false, frozen: false, eaten: false,
        inHouse: true, exitedHouse: false,
        exitDelay: d.exitDelay,
        bounceT: Math.random() * Math.PI * 2,
        scaredFlash: false,
    }));
}

// ─── Init / reset ─────────────────────────────────────────────────────────────
function initGame() {
    buildMaze();
    pacman = makePacman();
    pacman.x = pacman.col * CELL + CELL/2;
    pacman.y = pacman.row * CELL + CELL/2;
    ghosts  = makeGhosts();
    score   = parseInt(document.getElementById('score').textContent) || 0;
    lives   = 3;
    level   = 1;
    effects = { power: 0, freeze: 0, fire: 0, ghostForm: 0 };
    fireTrail = [];
    specialPU = null;
    specialTimer = randomSpecialInterval();
    gameTimer = 0;
    bombs = 0;
    walls = 0;
    teleports = 0;
    bombExplosion = null;
    wallBarrier = null;
    teleportAnim = null;
    gameState = 'playing';
    updateHUD();
    hideMessage();
    lastTime = 0;
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(loop);
}

function resetAfterDeath() {
    pacman = makePacman();
    pacman.x = pacman.col * CELL + CELL/2;
    pacman.y = pacman.row * CELL + CELL/2;
    ghosts  = makeGhosts();
    effects = { power: 0, freeze: 0, fire: 0, ghostForm: 0 };
    fireTrail = [];
    specialPU = null;
    specialTimer = randomSpecialInterval();
    bombExplosion = null;
    wallBarrier = null;
    teleportAnim = null;
    // bombs, walls, teleports inventory kept across deaths
    gameState = 'playing';
    lastTime = 0;
}

function nextLevel() {
    level++;
    buildMaze();
    pacman = makePacman();
    pacman.x = pacman.col * CELL + CELL/2;
    pacman.y = pacman.row * CELL + CELL/2;
    ghosts  = makeGhosts();
    effects = { power: 0, freeze: 0, fire: 0, ghostForm: 0 };
    fireTrail = [];
    specialPU = null;
    specialTimer = randomSpecialInterval();
    bombExplosion = null;
    wallBarrier = null;
    teleportAnim = null;
    // bombs, walls, teleports inventory carry over between levels
    gameState = 'playing';
    updateHUD();
    lastTime = 0;
}

function randomSpecialInterval() {
    return SPECIAL_INTERVAL_MIN + Math.random() * (SPECIAL_INTERVAL_MAX - SPECIAL_INTERVAL_MIN);
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
    const secs = Math.floor(gameTimer / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${mm}:${ss}`;
    const bombEl = document.getElementById('bomb-count');
    if (bombEl) {
        bombEl.textContent = bombs;
        document.getElementById('bomb-hud').style.display = bombs > 0 ? 'flex' : 'none';
    }
    const wallEl = document.getElementById('wall-count');
    if (wallEl) {
        wallEl.textContent = walls;
        document.getElementById('wall-hud').style.display = walls > 0 ? 'flex' : 'none';
    }
    const teleEl = document.getElementById('teleport-count');
    if (teleEl) {
        teleEl.textContent = teleports;
        document.getElementById('teleport-hud').style.display = teleports > 0 ? 'flex' : 'none';
    }
}

function updatePowerStatus() {
    const parts = [];
    if (effects.power > 0)     parts.push(`POWER ${(effects.power/1000).toFixed(1)}s`);
    if (effects.freeze > 0)    parts.push(`FREEZE ${(effects.freeze/1000).toFixed(1)}s`);
    if (effects.fire > 0)      parts.push(`FIRE ${(effects.fire/1000).toFixed(1)}s`);
    if (effects.ghostForm > 0) parts.push(`GHOST FORM ${(effects.ghostForm/1000).toFixed(1)}s`);
    if (wallBarrier) {
        const rem = Math.max(0, WALL_DURATION - (performance.now() - wallBarrier.born));
        parts.push(`WALL ${(rem/1000).toFixed(1)}s`);
    }
    document.getElementById('powerup-status').textContent = parts.join('  |  ');
}

// Brief non-blocking notice for cheat activation
let cheatNotice = null; // { msg, born, duration }
function showCheatNotice(msg) {
    cheatNotice = { msg, born: performance.now(), duration: 2000 };
}
function drawCheatNotice(now) {
    if (!cheatNotice) return;
    const elapsed = Math.max(0, now - cheatNotice.born);
    if (elapsed >= cheatNotice.duration) { cheatNotice = null; return; }
    const alpha = elapsed < 300 ? elapsed / 300 : Math.max(0, 1 - (elapsed - 300) / (cheatNotice.duration - 300));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    const w = CELL * 14, h = CELL * 2.2;
    const x = (canvas.width - w) / 2, y = CELL * 1.5;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffdd00';
    ctx.font = `bold ${CELL * 0.9}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cheatNotice.msg, canvas.width / 2, y + h / 2);
    ctx.restore();
}

function showMessage(html) {
    const el = document.getElementById('message');
    el.innerHTML = html;
    el.classList.remove('hidden');
}
function hideMessage() {
    document.getElementById('message').classList.add('hidden');
}

// ─── Input ────────────────────────────────────────────────────────────────────
const DIR_MAP = {
    ArrowUp:    [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
    w:[0,-1], s:[0,1], a:[-1,0], d:[1,0],
    W:[0,-1], S:[0,1], A:[-1,0], D:[1,0],
};

// Cheat codes: type "bomb" → +1000 bombs, "wall" → +1000 walls
let cheatBuffer = [];

document.addEventListener('keydown', e => {
    const d = DIR_MAP[e.key];
    if (d) {
        e.preventDefault();
        pacman.nextDx = d[0];
        pacman.nextDy = d[1];
        if (gameState === 'gameover' || gameState === 'won') return;
        if (gameState !== 'playing') {
            if (gameState === 'dead') return;
            gameState = 'playing';
        }
    }
    if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
            lastTime = 0;
        } else if (gameState === 'gameover') {
            score = 0; initGame();
        }
    }
    if (e.key === 'Enter') {
        if (gameState === 'gameover') { score = 0; initGame(); }
    }
    if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        detonateBomb();
    }
    if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        activateWall();
    }
    if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        activateTeleport();
    }
    // Cheat code detection
    cheatBuffer.push(e.key.toLowerCase());
    if (cheatBuffer.length > 4) cheatBuffer.shift();
    if (cheatBuffer.join('') === 'bomb') {
        bombs += 1000;
        updateHUD();
        showCheatNotice('💣 DEMO MODE: +1000 BOMBS!');
    }
    if (cheatBuffer.join('') === 'wall') {
        walls += 1000;
        updateHUD();
        showCheatNotice('🧱 DEMO MODE: +1000 WALLS!');
    }
    if (cheatBuffer.join('') === 'tele') {
        teleports += 1000;
        updateHUD();
        showCheatNotice('🌀 DEMO MODE: +1000 TELEPORTS!');
    }
});

function bindDpad() {
    const map = { dUp:[0,-1], dDown:[0,1], dLeft:[-1,0], dRight:[1,0] };
    for (const [id, dir] of Object.entries(map)) {
        const btn = document.getElementById(id);
        const fn = e => { e.preventDefault(); pacman.nextDx=dir[0]; pacman.nextDy=dir[1]; };
        btn.addEventListener('touchstart', fn, { passive: false });
        btn.addEventListener('mousedown', fn);
    }
}

// Touch swipe – bound after canvas is created
let touchStart = null;
function bindCanvasTouch() {
    canvas.addEventListener('touchstart', e => {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    canvas.addEventListener('touchend', e => {
        if (!touchStart) return;
        const dx = e.changedTouches[0].clientX - touchStart.x;
        const dy = e.changedTouches[0].clientY - touchStart.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            pacman.nextDx = dx > 0 ? 1 : -1; pacman.nextDy = 0;
        } else {
            pacman.nextDx = 0; pacman.nextDy = dy > 0 ? 1 : -1;
        }
        touchStart = null;
    }, { passive: true });
}

// ─── Movement helpers ─────────────────────────────────────────────────────────
// Returns tile coords for pixel center
function pixelToTile(px, py) {
    return { col: Math.floor(px / CELL), row: Math.floor(py / CELL) };
}

// Wrap column for tunnels
function wrapCol(c) {
    return ((c % COLS) + COLS) % COLS;
}

// Snap pixel to tile center
function tileCenter(r, c) {
    return { x: c * CELL + CELL/2, y: r * CELL + CELL/2 };
}

// ─── Pacman movement ──────────────────────────────────────────────────────────
function movePacman(dt) {
    if (teleportAnim) return; // frozen during teleport animation
    const speed = PACMAN_SPEED * CELL * (dt / 1000);

    // Try to turn
    const { col: tc, row: tr } = pixelToTile(pacman.x, pacman.y);
    const centerX = tc * CELL + CELL/2;
    const centerY = tr * CELL + CELL/2;
    const threshold = speed + 1;

    if (pacman.nextDx !== pacman.dx || pacman.nextDy !== pacman.dy) {
        const aligned = Math.abs(pacman.x - centerX) < threshold && Math.abs(pacman.y - centerY) < threshold;
        if (aligned) {
            const nr = tr + pacman.nextDy;
            const nc = wrapCol(tc + pacman.nextDx);
            if (!isWall(nr, nc) && !isWallBarrierAt(nr, nc)) {
                pacman.dx = pacman.nextDx;
                pacman.dy = pacman.nextDy;
                pacman.x = centerX;
                pacman.y = centerY;
            }
        }
    }

    // Move
    const nx = pacman.x + pacman.dx * speed;
    const ny = pacman.y + pacman.dy * speed;

    const nextCol = wrapCol(Math.floor(nx / CELL));
    const nextRow = Math.floor(ny / CELL);

    // Clamp to tile center on wall collision
    if (pacman.dx !== 0) {
        if (isWall(Math.floor(pacman.y / CELL), nextCol) || isWallBarrierAt(Math.floor(pacman.y / CELL), nextCol)) {
            pacman.x = centerX;
            pacman.dx = 0;
        } else {
            pacman.x = nx;
            // Wrap tunnel
            if (pacman.x < 0) pacman.x += COLS * CELL;
            if (pacman.x >= COLS * CELL) pacman.x -= COLS * CELL;
        }
    }
    if (pacman.dy !== 0) {
        if (isWall(nextRow, Math.floor(pacman.x / CELL)) || isWallBarrierAt(nextRow, Math.floor(pacman.x / CELL))) {
            pacman.y = centerY;
            pacman.dy = 0;
        } else {
            pacman.y = ny;
        }
    }

    // Mouth animation
    pacman.mouthAngle += pacman.mouthDir * 0.08;
    if (pacman.mouthAngle > 0.28) pacman.mouthDir = -1;
    if (pacman.mouthAngle < 0.02) pacman.mouthDir = 1;
}

// ─── Dot eating ───────────────────────────────────────────────────────────────
function checkDotEat() {
    if (effects.ghostForm > 0) return; // can't eat dots in ghost form
    const col = wrapCol(Math.round((pacman.x - CELL/2) / CELL));
    const row = Math.round((pacman.y - CELL/2) / CELL);
    if (row < 0 || row >= ROWS) return;

    const tile = maze[row][col];
    if (tile === T_DOT) {
        maze[row][col] = T_EMPTY;
        score += 10;
        totalDots--;
        updateHUD();
    } else if (tile === T_POWER) {
        maze[row][col] = T_EMPTY;
        score += 50;
        totalDots--;
        effects.power = POWER_DURATION;
        ghosts.forEach(g => { if (!g.eaten) g.scared = true; });
        updateHUD();
    }

    // Check special pickup
    if (specialPU && specialPU.row === row && specialPU.col === col) {
        applySpecialPU(specialPU.kind);
        specialPU = null;
        specialTimer = randomSpecialInterval();
    }

    if (totalDots <= 0) {
        gameState = 'won';
        showMessage(`Level ${level} Complete!<br>Score: ${score}<br><button onclick="nextLevelWrapper()">Next Level</button>`);
    }
}

function applySpecialPU(kind) {
    score += 200;
    if (kind === PU_FREEZE) {
        effects.freeze = FREEZE_DURATION;
        ghosts.forEach(g => g.frozen = true);
    } else if (kind === PU_FIRE) {
        effects.fire = FIRE_DURATION;
    } else if (kind === PU_GHOST) {
        effects.ghostForm = GHOSTFORM_DURATION;
    } else if (kind === PU_BOMB) {
        bombs++;
    } else if (kind === PU_WALL) {
        walls++;
    } else if (kind === PU_TELEPORT) {
        teleports++;
    }
    updateHUD();
}

function activateWall() {
    if (walls <= 0 || gameState !== 'playing') return;
    walls--;
    const pr = Math.round((pacman.y - CELL/2) / CELL);
    const pc = wrapCol(Math.round((pacman.x - CELL/2) / CELL));
    wallBarrier = { row: pr, col: pc, born: performance.now() };
    updateHUD();
}

function activateTeleport() {
    if (teleports <= 0 || gameState !== 'playing' || teleportAnim) return;
    const pr = Math.round((pacman.y - CELL/2) / CELL);
    const pc = wrapCol(Math.round((pacman.x - CELL/2) / CELL));

    // Build list of eligible cells
    const eligible = [];
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            const t = maze[r][c];
            if (t === T_WALL) continue;
            // Must differ from current cell
            if (r === pr && c === pc) continue;
            // Must be at least TELEPORT_MIN_DIST away (Manhattan)
            if (Math.abs(r - pr) + Math.abs(c - pc) < TELEPORT_MIN_DIST) continue;
            // No ghost standing on this cell
            const ghostHere = ghosts.some(g => {
                if (g.eaten || g.inHouse) return false;
                const gr = Math.round((g.y - CELL/2) / CELL);
                const gc = wrapCol(Math.round((g.x - CELL/2) / CELL));
                return gr === r && gc === c;
            });
            if (ghostHere) continue;
            // No special item on this cell
            if (specialPU && specialPU.row === r && specialPU.col === c) continue;
            eligible.push([r, c]);
        }
    }
    if (eligible.length === 0) return; // no valid target, don't consume

    teleports--;
    updateHUD();

    const [tr, tc] = eligible[Math.floor(Math.random() * eligible.length)];
    const toX = tc * CELL + CELL/2;
    const toY = tr * CELL + CELL/2;

    teleportAnim = {
        fromX: pacman.x, fromY: pacman.y,
        toX, toY, toRow: tr, toCol: tc,
        born: performance.now(),
    };
}

function isWallBarrierAt(r, c) {
    if (!wallBarrier) return false;
    // The barrier blocks the 4 cells adjacent to the barrier cell
    const br = wallBarrier.row, bc = wallBarrier.col;
    return (r === br && c === bc + 1) ||
           (r === br && c === bc - 1) ||
           (r === br + 1 && c === bc) ||
           (r === br - 1 && c === bc);
}

function detonateBomb() {
    if (bombs <= 0 || gameState !== 'playing') return;
    bombs--;
    const pr = Math.round((pacman.y - CELL/2) / CELL);
    const pc = wrapCol(Math.round((pacman.x - CELL/2) / CELL));
    // Kill ghosts within BOMB_RADIUS tiles (Manhattan distance)
    ghosts.forEach(g => {
        if (g.eaten || g.inHouse) return;
        const gr = Math.round((g.y - CELL/2) / CELL);
        const gc = wrapCol(Math.round((g.x - CELL/2) / CELL));
        const dist = Math.abs(gr - pr) + Math.abs(gc - pc);
        if (dist <= BOMB_RADIUS) {
            g.eaten = true;
            g.scared = false;
            score += 300;
            setTimeout(() => respawnGhost(g), 3000);
        }
    });
    // Pre-compute non-wall cells within blast radius for the visual
    const blastCells = [];
    for (let dr = -BOMB_RADIUS; dr <= BOMB_RADIUS; dr++) {
        for (let dc = -BOMB_RADIUS; dc <= BOMB_RADIUS; dc++) {
            if (Math.abs(dr) + Math.abs(dc) > BOMB_RADIUS) continue;
            const br = pr + dr, bc = wrapCol(pc + dc);
            if (br < 0 || br >= ROWS) continue;
            if (maze[br][bc] === T_WALL) continue;
            blastCells.push([br, bc]);
        }
    }
    // Trigger explosion visual
    bombExplosion = {
        x: pacman.x, y: pacman.y,
        originRow: pr, originCol: pc,
        cells: blastCells,
        radius: BOMB_RADIUS * CELL,
        born: performance.now(),
        duration: 900,
    };
    updateHUD();
}

// ─── Fire trail ───────────────────────────────────────────────────────────────
function updateFireTrail(dt, now) {
    if (effects.fire > 0) {
        const col = wrapCol(Math.round((pacman.x - CELL/2) / CELL));
        const row = Math.round((pacman.y - CELL/2) / CELL);
        if (row >= 0 && row < ROWS) {
            // Add if not already there
            if (!fireTrail.some(f => f.row === row && f.col === col)) {
                fireTrail.push({ row, col, born: now });
            }
        }
    }
    // Expire old fire
    fireTrail = fireTrail.filter(f => (now - f.born) < FIRE_TRAIL_TTL);
}

// ─── Ghost AI ─────────────────────────────────────────────────────────────────

// Returns true if a tile is inside the ghost house interior.
// Ghosts that have exited are not allowed to re-enter.
function isHouseInterior(r, c) {
    return r >= 9 && r <= 12 && c >= 9 && c <= 18;
}

// BFS shortest path distance from (sr,sc) to (tr,tc) for a ghost.
// Returns Infinity if unreachable.
function bfsDistance(sr, sc, tr, tc, g) {
    if (sr === tr && sc === tc) return 0;
    const queue = [[sr, sc, 0]];
    const visited = new Set([`${sr},${sc}`]);
    while (queue.length > 0) {
        const [r, c, d] = queue.shift();
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nr = r + dr, nc = wrapCol(c + dc);
            const key = `${nr},${nc}`;
            if (visited.has(key)) continue;
            if (!isPassableForGhost(nr, nc)) continue;
            if (isFireAt(nr, nc)) continue;
            if (isWallBarrierAt(nr, nc)) continue;
            if (g.exitedHouse && isHouseInterior(nr, nc)) continue;
            if (nr === tr && nc === tc) return d + 1;
            visited.add(key);
            queue.push([nr, nc, d + 1]);
        }
    }
    return Infinity;
}

function getGhostTarget(g) {
    const pacRow = Math.round((pacman.y - CELL/2) / CELL);
    const pacCol = wrapCol(Math.round((pacman.x - CELL/2) / CELL));
    let tRow = pacRow, tCol = pacCol;
    if (g.name === 'Pinky') {
        tRow = pacRow + 4 * pacman.dy;
        tCol = wrapCol(pacCol + 4 * pacman.dx);
    }
    if (g.name === 'Clyde') {
        const dist = Math.hypot(g.tileCol - pacCol, g.tileRow - pacRow);
        if (dist < 8) { tRow = ROWS - 3; tCol = 2; }
    }
    return { tRow, tCol };
}

// Called when a ghost arrives at a new tile: chooses the next tile to move to.
function pickGhostNext(g) {
    const row = g.tileRow, col = g.tileCol;
    const revDx = -g.dx, revDy = -g.dy;
    const DIRS = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];

    // Filter to valid moves: no U-turn, passable, not fire, not wall barrier, not house if exited
    const possible = DIRS.filter(d => {
        if (d.dx === revDx && d.dy === revDy) return false;
        const nr = row + d.dy, nc = wrapCol(col + d.dx);
        if (!isPassableForGhost(nr, nc)) return false;
        if (isFireAt(nr, nc)) return false;
        if (isWallBarrierAt(nr, nc)) return false;
        if (g.exitedHouse && isHouseInterior(nr, nc)) return false;
        return true;
    });

    let chosen;
    if (possible.length === 0) {
        // Force U-turn
        const rr = row + revDy, rc = wrapCol(col + revDx);
        if (isPassableForGhost(rr, rc) && !isWallBarrierAt(rr, rc) && !(g.exitedHouse && isHouseInterior(rr, rc))) {
            chosen = { dx: revDx, dy: revDy };
        } else {
            // Completely enclosed – try any passable direction
            for (const d of DIRS) {
                const nr = row + d.dy, nc = wrapCol(col + d.dx);
                if (isPassableForGhost(nr, nc) && !isFireAt(nr, nc) && !isWallBarrierAt(nr, nc)) { chosen = d; break; }
            }
        }
    } else if (possible.length === 1) {
        chosen = possible[0];
    } else if (g.scared) {
        chosen = possible[Math.floor(Math.random() * possible.length)];
    } else {
        // BFS-guided chase: for each candidate first step, measure BFS distance to target
        const { tRow, tCol } = getGhostTarget(g);
        let bestDir = possible[0], bestDist = Infinity;
        for (const d of possible) {
            const nr = row + d.dy, nc = wrapCol(col + d.dx);
            const dist = bfsDistance(nr, nc, tRow, tCol, g);
            if (dist < bestDist) { bestDist = dist; bestDir = d; }
        }
        chosen = bestDir;
    }

    if (!chosen) {
        g.nextRow = row; g.nextCol = col; return; // stuck – stay put
    }
    g.dx = chosen.dx; g.dy = chosen.dy;
    g.nextRow = row + g.dy;
    g.nextCol = wrapCol(col + g.dx);
}

function moveGhosts(dt, now) {
    ghosts.forEach(g => {
        if (g.frozen || g.eaten) return;

        if (g.inHouse) {
            g.exitDelay -= dt;
            if (g.exitDelay <= 0) {
                // Release: place at the corridor directly above the house door
                g.inHouse = false;
                g.exitedHouse = true;
                g.tileRow = 8; g.tileCol = 13;
                g.nextRow  = 8; g.nextCol  = 13;
                g.progress = 0;
                g.dx = 0; g.dy = 0;
                g.x = g.tileCol * CELL + CELL/2;
                g.y = g.tileRow * CELL + CELL/2;
                pickGhostNext(g); // choose first direction immediately
            } else {
                // Idle bounce animation inside house
                g.bounceT += dt * 0.004;
                g.x = g.tileCol * CELL + CELL/2;
                g.y = g.tileRow * CELL + CELL/2 + Math.sin(g.bounceT) * 3;
            }
            return;
        }

        const speed = g.scared ? GHOST_SCARED_SPEED : GHOST_SPEED; // tiles/sec
        g.progress += speed * dt / 1000;

        // Arrive at one or more tiles this frame
        while (g.progress >= 1) {
            g.progress -= 1;
            g.tileRow = g.nextRow;
            g.tileCol = wrapCol(g.nextCol);
            pickGhostNext(g);
        }

        // Interpolate pixel position
        const fx = g.tileCol * CELL + CELL/2;
        const fy = g.tileRow * CELL + CELL/2;
        let tx = g.nextCol * CELL + CELL/2;
        const ty = g.nextRow * CELL + CELL/2;
        // Smooth tunnel wrap (horizontal only)
        if (g.dy === 0 && Math.abs(tx - fx) > CELL * 2) {
            tx += tx < fx ? COLS * CELL : -COLS * CELL;
        }
        g.x = fx + (tx - fx) * g.progress;
        g.y = fy + (ty - fy) * g.progress;
        if (g.x < 0) g.x += COLS * CELL;
        if (g.x >= COLS * CELL) g.x -= COLS * CELL;

        // Scared flash near end of power effect
        if (effects.power > 0 && effects.power < 2000 && g.scared) {
            g.scaredFlash = Math.floor(Date.now() / 250) % 2 === 0;
        } else {
            g.scaredFlash = false;
        }
    });
}

// ─── Collision ────────────────────────────────────────────────────────────────
function checkCollisions(now) {
    if (teleportAnim) return; // no collisions during teleport
    const pr = Math.round((pacman.y - CELL/2) / CELL);
    const pc = wrapCol(Math.round((pacman.x - CELL/2) / CELL));

    ghosts.forEach(g => {
        if (g.eaten || g.inHouse) return;
        const gr = Math.round((g.y - CELL/2) / CELL);
        const gc = wrapCol(Math.round((g.x - CELL/2) / CELL));
        const dist = Math.hypot(pacman.x - g.x, pacman.y - g.y);
        if (dist > CELL * 0.9) return;

        if (effects.ghostForm > 0) return; // pass through in ghost form

        if (g.scared && effects.power > 0) {
            // Eat ghost
            g.eaten = true;
            g.scared = false;
            score += 200;
            updateHUD();
            // Respawn ghost after delay
            setTimeout(() => respawnGhost(g), 3000);
        } else if (!g.scared && !g.frozen) {
            // Pacman dies
            pacmanDie();
        }
    });
}

function respawnGhost(g) {
    const idx = ghosts.indexOf(g);
    const newG = makeGhosts()[idx];
    Object.assign(g, newG);
}

function pacmanDie() {
    if (gameState !== 'playing') return;
    gameState = 'dead';
    deathAnim.active = true;
    deathAnim.timer = 0;
    lives--;
    updateHUD();
}

// ─── Special powerup spawning ─────────────────────────────────────────────────
const PU_KINDS_BASE = [PU_FREEZE, PU_FIRE, PU_GHOST];

function spawnSpecialPU() {
    // Find random empty tile not occupied by ghost house area
    const empties = [];
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (maze[r][c] === T_DOT || maze[r][c] === T_EMPTY) {
                if (!GHOST_HOUSE_ROWS.includes(r) || !GHOST_HOUSE_COLS.includes(c)) {
                    empties.push([r, c]);
                }
            }
        }
    }
    if (empties.length === 0) return;
    const [row, col] = empties[Math.floor(Math.random() * empties.length)];
    const kinds = [...PU_KINDS_BASE];
    if (level >= 2) kinds.push(PU_BOMB);
    if (level >= 3) kinds.push(PU_WALL);
    if (level >= 4) kinds.push(PU_TELEPORT);
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    specialPU = { row, col, kind, spawnTime: Date.now() };
}

// ─── Effects timers ───────────────────────────────────────────────────────────
function updateEffects(dt) {
    if (effects.power > 0) {
        effects.power -= dt;
        if (effects.power <= 0) {
            effects.power = 0;
            ghosts.forEach(g => { g.scared = false; });
        }
    }
    if (effects.freeze > 0) {
        effects.freeze -= dt;
        if (effects.freeze <= 0) {
            effects.freeze = 0;
            ghosts.forEach(g => { g.frozen = false; });
        }
    }
    if (effects.fire > 0) {
        effects.fire -= dt;
        if (effects.fire <= 0) effects.fire = 0;
    }
    if (effects.ghostForm > 0) {
        effects.ghostForm -= dt;
        if (effects.ghostForm <= 0) effects.ghostForm = 0;
    }
    if (wallBarrier && (performance.now() - wallBarrier.born) >= WALL_DURATION) {
        wallBarrier = null;
    }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function drawMaze() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * CELL, y = r * CELL;
            const t = maze[r][c];
            if (t === T_WALL) {
                ctx.fillStyle = COL_WALL;
                ctx.fillRect(x, y, CELL, CELL);
                // Inner shadow for 3D look
                ctx.fillStyle = COL_WALL_IN;
                ctx.fillRect(x+2, y+2, CELL-4, CELL-4);
            } else {
                ctx.fillStyle = COL_BG;
                ctx.fillRect(x, y, CELL, CELL);
                if (t === T_DOT) {
                    ctx.fillStyle = COL_DOT;
                    ctx.beginPath();
                    ctx.arc(x + CELL/2, y + CELL/2, 2, 0, Math.PI*2);
                    ctx.fill();
                } else if (t === T_POWER) {
                    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
                    ctx.fillStyle = COL_POWER;
                    ctx.beginPath();
                    ctx.arc(x + CELL/2, y + CELL/2, 5 * pulse, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }
    }
}

function drawFireTrail(now) {
    fireTrail.forEach(f => {
        const age = now - f.born;
        const t = age / FIRE_TRAIL_TTL;
        const alpha = 1 - t * 0.7;
        const x = f.col * CELL, y = f.row * CELL;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = t < 0.5 ? COL_FIRE : COL_FIRE_FD;
        ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
        // Flame flicker
        ctx.fillStyle = '#ffdd00';
        const flicker = Math.sin(now / 80 + f.col + f.row) * 2;
        ctx.fillRect(x + 5 + flicker, y + 5, CELL - 10 - flicker, CELL - 10);
        ctx.globalAlpha = 1;
    });
}

function drawSpecialPU() {
    if (!specialPU) return;
    const { row, col, kind, spawnTime } = specialPU;
    const x = col * CELL + CELL/2;
    const y = row * CELL + CELL/2;
    const pulse = 1 + 0.15 * Math.sin(Date.now() / 200);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);

    if (kind === PU_FREEZE) {
        // Cyan star
        drawStar(ctx, 0, 0, 7, 3.5, 5, '#00ffff', '#0088ff');
    } else if (kind === PU_FIRE) {
        // Orange diamond
        drawDiamond(ctx, 0, 0, 8, '#ff6600', '#ffaa00');
    } else if (kind === PU_GHOST) {
        // Banana
        drawBanana(ctx, 0, 0);
    } else if (kind === PU_BOMB) {
        // Bomb: dark circle with fuse
        drawBombIcon(ctx, 0, 0, 7);
    } else if (kind === PU_WALL) {
        // Brick icon
        drawBrickIcon(ctx, 0, 0, 8);
    } else if (kind === PU_TELEPORT) {
        // Swirl icon
        drawTeleportIcon(ctx, 0, 0, 7);
    }
    ctx.restore();
}

function drawStar(ctx, cx, cy, outerR, innerR, points, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI / points) - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawDiamond(ctx, cx, cy, size, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.6, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.6, cy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    // Shine
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.15, cy - size * 0.6);
    ctx.lineTo(cx + size * 0.2, cy - size * 0.3);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();
}

function drawBanana(ctx, cx, cy) {
    ctx.save();
    ctx.strokeStyle = '#ffe44d';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 7, Math.PI * 1.1, Math.PI * 0.05);
    ctx.stroke();
    // Tips
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#cc8800';
    ctx.fill();
    ctx.restore();
}

function drawBombIcon(ctx, cx, cy, r) {
    // Body
    ctx.beginPath();
    ctx.arc(cx, cy + 1, r, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Shine
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3 + 1, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    // Fuse
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.5, cy - r * 0.7 + 1);
    ctx.quadraticCurveTo(cx + r * 1.0, cy - r * 1.4, cx + r * 0.3, cy - r * 1.7);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    // Spark at fuse tip
    ctx.beginPath();
    ctx.arc(cx + r * 0.3, cy - r * 1.7, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdd00';
    ctx.fill();
}

function drawBrickIcon(ctx, cx, cy, s) {
    // Two rows of offset bricks in terracotta colours
    const bw = s, bh = s * 0.5;
    ctx.fillStyle = '#c0522a';
    // Top row: two half-bricks
    ctx.fillRect(cx - s, cy - bh - 1, bw - 1, bh - 1);
    ctx.fillRect(cx + 1, cy - bh - 1, bw - 1, bh - 1);
    // Bottom row: offset full brick + half
    ctx.fillRect(cx - s * 0.5, cy + 1, bw * 1.5 - 1, bh - 1);
    // Mortar lines (dark gaps already from spacing; add highlight)
    ctx.fillStyle = '#e8784a';
    ctx.fillRect(cx - s + 2, cy - bh, bw - 5, 2);
    ctx.fillRect(cx + 3, cy - bh, bw - 5, 2);
    ctx.fillRect(cx - s * 0.5 + 2, cy + 2, bw * 1.5 - 5, 2);
}

function drawTeleportIcon(ctx, cx, cy, r) {
    // Spiral / swirl in cyan-purple gradient look
    ctx.save();
    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#cc44ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = '#00eeff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Dot in center
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Cross-hair lines
    ctx.strokeStyle = 'rgba(200,100,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    ctx.restore();
}

function drawTeleportAnim(now) {
    if (!teleportAnim) return;
    const elapsed = Math.max(0, now - teleportAnim.born);
    const half = TELEPORT_ANIM_DURATION / 2;

    if (elapsed < half) {
        // Phase 1: pacman fades out at fromX/fromY with expanding ring
        const t = elapsed / half; // 0→1
        const alpha = 1 - t;
        const ringR = CELL * 0.5 + t * CELL * 1.5;

        ctx.save();
        // Fading ring at departure point
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(teleportAnim.fromX, teleportAnim.fromY, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = '#cc44ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Second smaller ring
        ctx.beginPath();
        ctx.arc(teleportAnim.fromX, teleportAnim.fromY, ringR * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = '#00eeff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Draw pacman fading out
        ctx.save();
        ctx.globalAlpha = alpha;
        _drawPacmanAt(teleportAnim.fromX, teleportAnim.fromY);
        ctx.restore();
    } else if (elapsed < TELEPORT_ANIM_DURATION) {
        // Phase 2: pacman fades in at toX/toY with contracting ring
        const t = (elapsed - half) / half; // 0→1
        const alpha = t;
        const ringR = CELL * 2 * (1 - t);

        ctx.save();
        // Contracting ring at arrival point
        ctx.globalAlpha = (1 - t) * 0.9;
        ctx.beginPath();
        ctx.arc(teleportAnim.toX, teleportAnim.toY, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = '#cc44ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(teleportAnim.toX, teleportAnim.toY, ringR * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = '#00eeff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Draw pacman fading in
        ctx.save();
        ctx.globalAlpha = alpha;
        _drawPacmanAt(teleportAnim.toX, teleportAnim.toY);
        ctx.restore();
    } else {
        // Animation done — snap pacman to destination
        pacman.x = teleportAnim.toX;
        pacman.y = teleportAnim.toY;
        teleportAnim = null;
    }
}

// Draws pacman body at an arbitrary pixel position (used by teleport anim)
function _drawPacmanAt(px, py) {
    const r = CELL / 2 - 1;
    let angle = 0;
    if (pacman.dx === 1)  angle = 0;
    if (pacman.dx === -1) angle = Math.PI;
    if (pacman.dy === -1) angle = -Math.PI / 2;
    if (pacman.dy === 1)  angle = Math.PI / 2;

    if (effects.ghostForm > 0) {
        ctx.fillStyle = '#aaffaa';
        ctx.beginPath();
        ctx.arc(px, py - 1, r, Math.PI, 0, false);
        ctx.lineTo(px + r, py + r - 1);
        const segments = 3, segW = (r * 2) / segments;
        for (let i = 0; i < segments; i++) {
            const bx = px + r - segW * i - segW / 2;
            const by = i % 2 === 0 ? py + r + 2 : py + r - 2;
            ctx.quadraticCurveTo(bx + segW / 2, by, px + r - segW * (i + 1), py + r - 1);
        }
        ctx.closePath();
        ctx.fill();
    } else {
        const col = effects.fire > 0 ? '#ff8800' : COL_PACMAN;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.arc(px, py, r, angle + pacman.mouthAngle * Math.PI, angle + (2 - pacman.mouthAngle) * Math.PI);
        ctx.closePath();
        ctx.fill();
    }
}

function drawWallBarrier(now) {
    if (!wallBarrier) return;
    const elapsed = Math.max(0, now - wallBarrier.born);
    const remaining = WALL_DURATION - elapsed;
    if (remaining <= 0) return;

    const { row, col } = wallBarrier;
    const x = col * CELL, y = row * CELL;
    // Fade out in last second
    const alpha = remaining < 1000 ? remaining / 1000 : 1;
    // Slow pulse
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(now / 300));

    ctx.save();
    ctx.globalAlpha = alpha;

    // Fill the barrier cell with a semi-transparent tint
    ctx.fillStyle = `rgba(255,120,30,${0.18 * pulse})`;
    ctx.fillRect(x, y, CELL, CELL);

    // Draw thick border on all 4 sides of the cell
    const bw = 4; // border width in px
    ctx.strokeStyle = `rgba(255,160,40,${0.9 * pulse})`;
    ctx.lineWidth = bw;
    ctx.strokeRect(x + bw/2, y + bw/2, CELL - bw, CELL - bw);

    // Draw brick pattern on each of the 4 sides (as coloured segments)
    const brickCol1 = `rgba(200,80,20,${alpha})`;
    const brickCol2 = `rgba(240,130,50,${alpha})`;
    const sides = [
        [x,            y,            CELL, bw],   // top
        [x,            y+CELL-bw,    CELL, bw],   // bottom
        [x,            y,            bw,   CELL],  // left
        [x+CELL-bw,    y,            bw,   CELL],  // right
    ];
    sides.forEach(([sx, sy, sw, sh]) => {
        const isHoriz = sw > sh;
        const segCount = isHoriz ? 4 : 3;
        const segLen = (isHoriz ? sw : sh) / segCount;
        for (let s = 0; s < segCount; s++) {
            ctx.fillStyle = s % 2 === 0 ? brickCol1 : brickCol2;
            if (isHoriz) {
                ctx.fillRect(sx + s * segLen + 0.5, sy, segLen - 1, sh);
            } else {
                ctx.fillRect(sx, sy + s * segLen + 0.5, sw, segLen - 1);
            }
        }
    });

    ctx.restore();
}

function drawBombExplosion(now) {
    if (!bombExplosion) return;
    const elapsed = Math.max(0, now - bombExplosion.born);
    if (elapsed >= bombExplosion.duration) {
        bombExplosion = null;
        return;
    }
    const t = elapsed / bombExplosion.duration; // 0→1
    const fade = 1 - t;

    ctx.save();

    // Paint each affected cell with fire colors
    const { originRow: or, originCol: oc, cells } = bombExplosion;
    for (const [cr, cc] of cells) {
        const dist = Math.abs(cr - or) + Math.abs(cc - oc);
        // Cells closer to centre stay bright longer; outer cells fade sooner
        const cellFade = Math.max(0, fade - dist * 0.04);
        if (cellFade <= 0) continue;

        const x = cc * CELL, y = cr * CELL;
        // Flicker: each cell has a slightly different phase
        const flicker = 0.75 + 0.25 * Math.sin(now / 60 + cr * 3.1 + cc * 1.7);

        // Core colour: white-yellow → orange → red as t increases
        let r, g, b;
        if (t < 0.3) {
            // white-yellow core
            r = 255; g = 255; b = Math.round(200 * (1 - t / 0.3));
        } else if (t < 0.65) {
            // orange
            r = 255; g = Math.round(180 * (1 - (t - 0.3) / 0.35)); b = 0;
        } else {
            // deep red
            r = Math.round(255 * (1 - (t - 0.65) / 0.35)); g = 0; b = 0;
        }

        ctx.globalAlpha = cellFade * flicker * 0.88;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, CELL, CELL);

        // Bright inner highlight
        ctx.globalAlpha = cellFade * flicker * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
    }

    // Expanding shockwave ring on top
    const ringR = bombExplosion.radius * Math.min(t * 3, 1); // expands fast in first third
    ctx.globalAlpha = Math.max(0, 1 - t * 2) * 0.9;         // disappears in first half
    ctx.beginPath();
    ctx.arc(bombExplosion.x, bombExplosion.y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffa0';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
}

function drawGhost(g, now) {
    const x = g.x, y = g.y;
    const r = CELL / 2 - 1;

    let color;
    if (g.scared) {
        color = g.scaredFlash ? GHOST_SCARED2 : GHOST_SCARED;
    } else {
        color = g.color;
    }

    ctx.save();
    ctx.globalAlpha = g.eaten ? 0.2 : 1;

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 1, r, Math.PI, 0, false);
    // Wavy bottom
    const segments = 3;
    const segW = (r * 2) / segments;
    ctx.lineTo(x + r, y + r - 1);
    for (let i = 0; i < segments; i++) {
        const bx = x + r - segW * i - segW / 2;
        const by = i % 2 === 0 ? y + r + 2 : y + r - 2;
        ctx.quadraticCurveTo(bx + segW / 2, by, x + r - segW * (i + 1), y + r - 1);
    }
    ctx.closePath();
    ctx.fill();

    // Eyes
    if (!g.scared) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(x - r/3, y - 2, r/4, r/3, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + r/3, y - 2, r/4, r/3, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00f';
        ctx.beginPath(); ctx.arc(x - r/3 + g.dx, y - 2 + g.dy, r/6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + r/3 + g.dx, y - 2 + g.dy, r/6, 0, Math.PI*2); ctx.fill();
    } else {
        // Scared eyes
        ctx.fillStyle = color === GHOST_SCARED2 ? '#0000aa' : '#ffb0b0';
        ctx.fillRect(x - r/2, y - 3, r/3, r/3);
        ctx.fillRect(x + r/6, y - 3, r/3, r/3);
    }

    ctx.restore();
}

function drawPacman() {
    const x = pacman.x, y = pacman.y;
    const r = CELL / 2 - 1;

    let angle = 0;
    if (pacman.dx === 1)  angle = 0;
    if (pacman.dx === -1) angle = Math.PI;
    if (pacman.dy === -1) angle = -Math.PI / 2;
    if (pacman.dy === 1)  angle = Math.PI / 2;

    ctx.save();

    if (effects.ghostForm > 0) {
        // Semi-transparent ghost-like pacman
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#aaffaa';
        // Draw ghost body for pacman
        ctx.beginPath();
        ctx.arc(x, y - 1, r, Math.PI, 0, false);
        ctx.lineTo(x + r, y + r - 1);
        const segments = 3, segW = (r * 2) / segments;
        for (let i = 0; i < segments; i++) {
            const bx = x + r - segW * i - segW / 2;
            const by = i % 2 === 0 ? y + r + 2 : y + r - 2;
            ctx.quadraticCurveTo(bx + segW / 2, by, x + r - segW * (i + 1), y + r - 1);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    } else {
        // Normal pacman
        const col = effects.fire > 0 ? '#ff8800' : COL_PACMAN;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, r, angle + pacman.mouthAngle * Math.PI, angle + (2 - pacman.mouthAngle) * Math.PI);
        ctx.closePath();
        ctx.fill();

        // Eye
        const eyeX = x + Math.cos(angle - Math.PI/4) * r * 0.5;
        const eyeY = y + Math.sin(angle - Math.PI/4) * r * 0.5;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 1.5, 0, Math.PI*2);
        ctx.fill();
    }

    ctx.restore();
}

function drawDeathAnim(progress) {
    const x = pacman.x, y = pacman.y;
    const r = CELL / 2 - 1;
    const open = progress * Math.PI;
    ctx.fillStyle = COL_PACMAN;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, open, Math.PI * 2 - open);
    ctx.closePath();
    ctx.fill();
}

function draw(now) {
    ctx.fillStyle = COL_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMaze();
    drawFireTrail(now);
    drawSpecialPU();
    drawWallBarrier(now);
    drawBombExplosion(now);

    if (deathAnim.active) {
        const progress = Math.min(deathAnim.timer / deathAnim.duration, 1);
        drawDeathAnim(progress);
    } else if (teleportAnim) {
        // drawTeleportAnim handles drawing pacman during the animation
        drawTeleportAnim(now);
    } else {
        drawPacman();
    }

    ghosts.forEach(g => drawGhost(g, now));
    drawCheatNotice(now);
}

// ─── Main loop ────────────────────────────────────────────────────────────────
function loop(ts) {
    const dt = lastTime ? Math.min(ts - lastTime, 50) : 16;
    lastTime = ts;
    const now = ts;

    if (gameState === 'playing') {
        gameTimer += dt;
        updateEffects(dt);
        movePacman(dt);
        updateFireTrail(dt, now);
        moveGhosts(dt, now);
        checkDotEat();
        checkCollisions(now);

        // Special PU timer
        specialTimer -= dt;
        if (specialTimer <= 0 && !specialPU) {
            spawnSpecialPU();
            specialTimer = randomSpecialInterval();
        }
        // Remove special after 15s if not collected
        if (specialPU && (now - specialPU.spawnTime) > 15000) {
            specialPU = null;
            specialTimer = randomSpecialInterval();
        }

        updatePowerStatus();
        updateHUD();
    } else if (gameState === 'dead') {
        if (deathAnim.active) {
            deathAnim.timer += dt;
            if (deathAnim.timer >= deathAnim.duration) {
                deathAnim.active = false;
                if (lives <= 0) {
                    gameState = 'gameover';
                    fireTrail = [];
                    teleportAnim = null;
                    showMessage(`Game Over<br>Score: ${score}<br><button onclick="restartWrapper()">Play Again</button>`);
                } else {
                    resetAfterDeath();
                }
            }
        }
    }

    draw(now);
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${CELL * 2}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
        ctx.font = `${CELL}px 'Courier New', monospace`;
        ctx.fillStyle = '#fff';
        ctx.fillText('press SPACE to resume', canvas.width / 2, canvas.height / 2 + CELL * 2.5);
    }
    animFrame = requestAnimationFrame(loop);
}

// ─── Global wrappers for inline onclick ───────────────────────────────────────
function nextLevelWrapper() {
    hideMessage();
    nextLevel();
}
function restartWrapper() {
    score = 0;
    lives = 3;
    level = 1;
    hideMessage();
    initGame();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    initCanvas();
    bindDpad();
    bindCanvasTouch();
    initGame();
});

window.addEventListener('resize', () => {
    initCanvas();
});
