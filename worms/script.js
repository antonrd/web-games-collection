// ─── Constants ────────────────────────────────────────────────────────────────
const TILE   = 4;          // px per terrain tile
const COLS   = 220;        // terrain grid width  (880px canvas)
const ROWS   = 130;        // terrain grid height (520px canvas)
const CW     = COLS * TILE;
const CH     = ROWS * TILE;
const GRAVITY = 0.35;
const MAX_FALL = 12;
const WORM_W  = 12;
const WORM_H  = 16;
const WORM_HP = 100;

// ─── Terrain ─────────────────────────────────────────────────────────────────
// solid[row][col] = true means terrain exists there
let solid = [];

function generateTerrain() {
    solid = Array.from({length: ROWS}, () => new Uint8Array(COLS));

    // Multi-octave Perlin-ish noise via value noise
    const base = smoothNoise(COLS, 0.008, 4, 0.5);
    const detail = smoothNoise(COLS, 0.03, 2, 0.5);

    for (let c = 0; c < COLS; c++) {
        const heightFrac = 0.38 + base[c] * 0.28 + detail[c] * 0.06;
        const surfaceRow = Math.floor(ROWS * heightFrac);
        for (let r = surfaceRow; r < ROWS; r++) {
            solid[r][c] = 1;
        }
    }

    // Add some floating islands / raised blobs
    for (let i = 0; i < 5; i++) {
        addBlob(
            Math.floor(Math.random() * COLS),
            Math.floor(ROWS * (0.2 + Math.random() * 0.25)),
            12 + Math.floor(Math.random() * 20),
            6 + Math.floor(Math.random() * 10)
        );
    }

    // Carve some caves
    for (let i = 0; i < 4; i++) {
        carveCave(
            Math.floor(COLS * 0.1 + Math.random() * COLS * 0.8),
            Math.floor(ROWS * 0.55 + Math.random() * ROWS * 0.25),
            8 + Math.floor(Math.random() * 14)
        );
    }

    // Always keep bottom 3 rows solid (water level)
    for (let c = 0; c < COLS; c++) {
        solid[ROWS-1][c] = 1;
        solid[ROWS-2][c] = 1;
        solid[ROWS-3][c] = 1;
    }
}

function smoothNoise(len, freq, octaves, persistence) {
    const result = new Float32Array(len);
    let amp = 1, maxAmp = 0;
    for (let o = 0; o < octaves; o++) {
        const pts = Math.ceil(len * freq * Math.pow(2, o)) + 2;
        const raw = Array.from({length: pts}, () => Math.random());
        for (let i = 0; i < len; i++) {
            const t = i * freq * Math.pow(2, o);
            const a = Math.floor(t) % pts;
            const b = (a + 1) % pts;
            const f = t - Math.floor(t);
            const smooth = f * f * (3 - 2 * f);
            result[i] += (raw[a] + smooth * (raw[b] - raw[a])) * amp;
        }
        maxAmp += amp;
        amp *= persistence;
    }
    for (let i = 0; i < len; i++) result[i] /= maxAmp;
    return result;
}

function addBlob(cx, cy, rw, rh) {
    for (let r = cy - rh; r <= cy + rh; r++) {
        for (let c = cx - rw; c <= cx + rw; c++) {
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
            const dx = (c - cx) / rw, dy = (r - cy) / rh;
            if (dx*dx + dy*dy <= 1) solid[r][c] = 1;
        }
    }
}

function carveCave(cx, cy, r) {
    for (let dr = -r; dr <= r; dr++) {
        for (let dc = -r; dc <= r; dc++) {
            const row = cy + dr, col = cx + dc;
            if (row < 2 || row >= ROWS - 3 || col < 0 || col >= COLS) continue;
            if (dc*dc + dr*dr <= r*r) solid[row][col] = 0;
        }
    }
}

function blastTerrain(cx, cy, radius) {
    const tc = Math.floor(cx / TILE);
    const tr = Math.floor(cy / TILE);
    const tr_ = Math.ceil(radius / TILE) + 1;
    for (let dr = -tr_; dr <= tr_; dr++) {
        for (let dc = -tr_; dc <= tr_; dc++) {
            const row = tr + dr, col = tc + dc;
            if (row < 0 || row >= ROWS - 3 || col < 0 || col >= COLS) continue;
            const px = col * TILE + TILE/2, py = row * TILE + TILE/2;
            const dx = px - cx, dy = py - cy;
            if (dx*dx + dy*dy <= radius*radius) solid[row][col] = 0;
        }
    }
    terrainDirty = true;
}

function isSolid(px, py) {
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return r >= ROWS;
    return solid[r][c] === 1;
}

function surfaceY(px, startY) {
    for (let y = startY; y < CH; y++) {
        if (isSolid(px, y)) return y;
    }
    return CH;
}

// ─── Terrain rendering ────────────────────────────────────────────────────────
let terrainCanvas, terrainCtx, terrainDirty = true;

function initTerrainCanvas() {
    terrainCanvas = document.createElement('canvas');
    terrainCanvas.width  = CW;
    terrainCanvas.height = CH;
    terrainCtx = terrainCanvas.getContext('2d');
    terrainDirty = true;
}

function rebuildTerrainImage() {
    terrainCtx.clearRect(0, 0, CW, CH);

    // Draw in large horizontal spans for speed
    for (let r = 0; r < ROWS; r++) {
        let c = 0;
        while (c < COLS) {
            if (!solid[r][c]) { c++; continue; }
            let end = c;
            while (end < COLS && solid[r][end]) end++;
            // surface row = first solid row in this column?
            const isSurface = r === 0 || (r > 0 && solid[r-1] && !solid[r-1][c]);
            terrainCtx.fillStyle = isSurface ? '#5d8a3c' : '#7a5c3a';
            terrainCtx.fillRect(c * TILE, r * TILE, (end - c) * TILE, TILE);
            c = end;
        }
    }

    // Grass highlight on surface tiles
    for (let r = 1; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (solid[r][c] && !solid[r-1][c]) {
                terrainCtx.fillStyle = '#8bc34a';
                terrainCtx.fillRect(c * TILE, r * TILE, TILE, 2);
            }
        }
    }

    // Water at bottom
    terrainCtx.fillStyle = 'rgba(30,100,200,0.7)';
    terrainCtx.fillRect(0, (ROWS-3)*TILE, CW, 3*TILE);

    terrainDirty = false;
}

// ─── Camera ───────────────────────────────────────────────────────────────────
const VIEW_W = 880, VIEW_H = 520;
let camX = 0, camY = 0;

function clampCam() {
    camX = Math.max(0, Math.min(CW - VIEW_W, camX));
    camY = Math.max(0, Math.min(CH - VIEW_H, camY));
}

function centerCamOn(wx, wy) {
    camX = wx - VIEW_W / 2;
    camY = wy - VIEW_H / 2;
    clampCam();
}

// ─── Worm class ───────────────────────────────────────────────────────────────
let wormIdCounter = 0;

class Worm {
    constructor(team, name, x, y) {
        this.id   = wormIdCounter++;
        this.team = team;       // 'a' | 'b'
        this.name = name;
        this.x    = x;
        this.y    = y;
        this.vx   = 0;
        this.vy   = 0;
        this.hp   = WORM_HP;
        this.dead = false;
        this.onGround = true;
        this.facing = 1;        // 1=right, -1=left
        this.inventory = {bazooka:Infinity, grenade:3, shotgun:6, airstrike:1, mine:2, rope:1};
        this.activeWeapon = 'bazooka';
        this.aimAngle = -45;    // degrees, 0=right, -90=up
        this.animFrame = 0;
        this.walkTimer = 0;
        this.fallDist  = 0;
        this.ropeState = null;  // null | {hooked, hookX, hookY, len, angle, angVel}
        this.justFired = false;
    }

    get cx() { return this.x + WORM_W / 2; }
    get cy() { return this.y + WORM_H / 2; }
    get bottom() { return this.y + WORM_H; }
    get right()  { return this.x + WORM_W; }

    draw(ctx) {
        if (this.dead) return;
        const px = Math.round(this.x - camX);
        const py = Math.round(this.y - camY);

        // Body
        ctx.fillStyle = this.team === 'a' ? '#e05555' : '#5588e0';
        ctx.beginPath();
        ctx.ellipse(px + WORM_W/2, py + WORM_H*0.6, WORM_W/2, WORM_H*0.45, 0, 0, Math.PI*2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#f5c28a';
        ctx.beginPath();
        ctx.arc(px + WORM_W/2, py + WORM_H*0.22, WORM_W*0.38, 0, Math.PI*2);
        ctx.fill();

        // Eyes
        const eyeOffX = this.facing * 2;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px + WORM_W/2 + eyeOffX, py + WORM_H*0.2, 1.5, 0, Math.PI*2);
        ctx.fill();

        // Hat (team marker)
        ctx.fillStyle = this.team === 'a' ? '#cc2222' : '#2244cc';
        ctx.fillRect(px + WORM_W/2 - 5, py + 1, 10, 4);
        ctx.fillRect(px + WORM_W/2 - 3, py - 3, 6, 5);

        // Aim indicator when active & on ground
        if (this === activeWorm() && this.onGround && !this.ropeState) {
            this.drawAim(ctx, px, py);
        }

        // Rope
        if (this.ropeState) {
            this.drawRope(ctx);
        }

        // HP bar above
        if (this.hp < WORM_HP) {
            const bw = 24, bh = 4;
            const bx = px + WORM_W/2 - bw/2;
            const by = py - 10;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = this.team === 'a' ? '#ff6b6b' : '#6bb5ff';
            ctx.fillRect(bx, by, bw * (this.hp / WORM_HP), bh);
        }

        // Name tag on active worm
        if (this === activeWorm()) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, px + WORM_W/2, py - 14);
        }
    }

    drawAim(ctx, px, py) {
        const rad = this.aimAngle * Math.PI / 180;
        const dx  = Math.cos(rad) * this.facing;
        const dy  = Math.sin(rad);
        const len = 28;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(px + WORM_W/2, py + WORM_H*0.5);
        ctx.lineTo(px + WORM_W/2 + dx * len, py + WORM_H*0.5 + dy * len);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    drawRope(ctx) {
        const rs = this.ropeState;
        const wx = this.cx - camX;
        const wy = this.cy - camY;
        ctx.save();
        ctx.strokeStyle = rs.hooked ? '#d4a017' : '#aaa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        if (rs.hooked) {
            ctx.lineTo(rs.hookX - camX, rs.hookY - camY);
        } else {
            ctx.lineTo(rs.tipX - camX, rs.tipY - camY);
        }
        ctx.stroke();
        // Hook dot
        if (rs.hooked) {
            ctx.fillStyle = '#d4a017';
            ctx.beginPath();
            ctx.arc(rs.hookX - camX, rs.hookY - camY, 3, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }

    update() {
        if (this.dead) return;

        if (this.ropeState && this.ropeState.hooked) {
            this.updateRopePhysics();
            return;
        }

        // Gravity — skip if already on ground to prevent oscillation
        if (!this.onGround) {
            this.vy = Math.min(this.vy + GRAVITY, MAX_FALL);
        }

        // Move X
        this.x += this.vx;
        // Clamp to canvas
        this.x = Math.max(0, Math.min(CW - WORM_W, this.x));

        // Horizontal collision — check leading edge at mid and lower body
        const leadX = this.vx >= 0 ? this.x + WORM_W : this.x;
        if (isSolid(leadX, this.y + WORM_H * 0.5) || isSolid(leadX, this.y + WORM_H - 1)) {
            this.x -= this.vx;
            // Step up slopes when grounded — scan up to 3 tiles high
            if (this.onGround) {
                let stepped = false;
                for (let s = 1; s <= TILE * 3; s++) {
                    if (!isSolid(leadX, this.y + WORM_H - 1 - s) &&
                        !isSolid(leadX, this.y - s)) {
                        this.y -= s;
                        this.x += this.vx; // re-apply horizontal move now that we've stepped up
                        stepped = true;
                        break;
                    }
                }
                if (!stepped) this.vx = 0;
            } else {
                this.vx = 0;
            }
        }

        // Move Y
        const prevY = this.y;
        this.y += this.vy;

        // Vertical collision (floor) — find highest solid contact under any foot point
        const footY = this.y + WORM_H;
        const footXs = [this.x + 2, this.cx, this.x + WORM_W - 2];
        let snapY = null;
        for (const fx of footXs) {
            // Scan downward from current feet up to a few pixels to find solid tile
            for (let dy = 0; dy <= TILE + 1; dy++) {
                if (isSolid(fx, footY + dy)) {
                    const tileTop = Math.floor((footY + dy) / TILE) * TILE;
                    if (snapY === null || tileTop < snapY) snapY = tileTop;
                    break;
                }
            }
        }
        if (snapY !== null && footY <= snapY + TILE) {
            const newY = snapY - WORM_H;
            const fell = newY - prevY;
            if (this.vy > 5) this.fallDist += Math.abs(fell);
            this.y = newY;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Ceiling collision
        if (isSolid(this.cx, this.y)) {
            this.y = Math.ceil(this.y / TILE) * TILE;
            this.vy = Math.abs(this.vy) * 0.3;
        }

        // Fell in water
        if (this.y + WORM_H >= (ROWS - 3) * TILE) {
            this.takeDamage(WORM_HP, 'drowned');
        }

        // Friction
        this.vx *= 0.85;
        if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }

    updateRopePhysics() {
        const rs = this.ropeState;
        if (rs.justAttached) { rs.justAttached = false; return; }
        rs.angVel -= (GRAVITY / rs.len) * Math.sin(rs.angle) * 0.06;
        rs.angVel *= 0.995;
        rs.angVel = Math.max(-0.06, Math.min(0.06, rs.angVel)); // cap swing speed
        rs.angle  += rs.angVel;

        const nx = rs.hookX + Math.sin(rs.angle) * rs.len;
        const ny = rs.hookY + Math.cos(rs.angle) * rs.len;
        const newX = nx - WORM_W/2;
        const newY = ny - WORM_H/2;

        // Block worm from entering solid terrain during swing
        const solidHead = isSolid(nx, newY);
        const solidFeet = isSolid(nx, newY + WORM_H);
        const solidLeft = isSolid(newX, ny - WORM_H * 0.25);
        const solidRight = isSolid(newX + WORM_W, ny - WORM_H * 0.25);

        if (solidHead || solidFeet || solidLeft || solidRight) {
            rs.angVel *= -0.3; // bounce back
            return; // keep old position
        }

        this.x = Math.max(0, Math.min(CW - WORM_W, newX));
        this.y = Math.max(0, newY);
    }

    fireRope() {
        if (this.inventory.rope <= 0) return false;
        // Fire hook in aim direction
        const rad = this.aimAngle * Math.PI / 180;
        const vhx = Math.cos(rad) * this.facing * 12;
        const vhy = Math.sin(rad) * 12;
        this.ropeState = {
            hooked: false,
            tipX: this.cx, tipY: this.cy,
            vx: vhx, vy: vhy,
            hookX: 0, hookY: 0,
            len: 1, angle: 0, angVel: 0
        };
        return true;
    }

    updateRopeTip() {
        const rs = this.ropeState;
        if (!rs || rs.hooked) return;
        rs.tipX += rs.vx;
        rs.tipY += rs.vy;
        rs.vy   += GRAVITY * 0.5;

        if (isSolid(rs.tipX, rs.tipY)) {
            rs.hooked = true;
            rs.justAttached = true;
            rs.hookX  = rs.tipX - rs.vx;
            rs.hookY  = rs.tipY - rs.vy;
            const dx = this.cx - rs.hookX;
            const dy = this.cy - rs.hookY;
            rs.len   = Math.sqrt(dx*dx + dy*dy);
            rs.angle = Math.atan2(dx, dy);
            rs.angVel = (this.vx * Math.cos(rs.angle) - this.vy * Math.sin(rs.angle)) / rs.len;
        } else if (rs.tipX < 0 || rs.tipX > CW || rs.tipY > CH || rs.tipY < 0) {
            this.ropeState = null;
        }
    }

    releaseRope() {
        const rs = this.ropeState;
        if (!rs) return;
        if (rs.hooked) {
            const spd = Math.abs(rs.angVel) * rs.len;
            this.vx =  Math.cos(rs.angle) * spd * this.facing * 0.12;
            this.vy = -Math.sin(Math.abs(rs.angle)) * spd * 0.12;
        }
        this.ropeState = null;
        // Push worm out of terrain if release landed inside solid pixels
        for (let tries = 0; tries < 20; tries++) {
            if (!isSolid(this.cx, this.y) && !isSolid(this.cx, this.y + WORM_H)) break;
            this.y -= 1;
        }
    }

    adjustRope(delta) {
        if (!this.ropeState || !this.ropeState.hooked) return;
        this.ropeState.len = Math.max(20, Math.min(200, this.ropeState.len + delta));
    }

    takeDamage(amount, source) {
        if (this.dead) return;
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp === 0) this.die();
        spawnDamageFloat(this.cx, this.y, amount);
        updateHUD();
    }

    die() {
        this.dead = true;
        this.ropeState = null;
        spawnExplosionParticles(this.cx, this.cy, '#fff', 12);
        updateHUD();
        checkWinCondition();
    }

    placeOnSurface() {
        const footXs = [this.x + 2, this.cx, this.x + WORM_W - 2];
        for (let y = 0; y < CH - WORM_H; y++) {
            const clear = footXs.every(fx => !isSolid(fx, y));
            if (!clear) continue;
            const footY = y + WORM_H;
            let snapY = null;
            for (const fx of footXs) {
                for (let dy = 0; dy <= TILE + 1; dy++) {
                    if (isSolid(fx, footY + dy)) {
                        const tileTop = Math.floor((footY + dy) / TILE) * TILE;
                        if (snapY === null || tileTop < snapY) snapY = tileTop;
                        break;
                    }
                }
            }
            if (snapY !== null) {
                this.y = snapY - WORM_H;
                return true;
            }
        }
        return false;
    }
}

// ─── Projectiles ─────────────────────────────────────────────────────────────
let projectiles = [];

class Projectile {
    constructor(opts) {
        Object.assign(this, {
            x:0, y:0, vx:0, vy:0, type:'bazooka',
            radius:30, damage:50, fuse:-1, bounces:0,
            owner:null, active:true,
            trail:[], trailMax:12
        }, opts);
    }

    update() {
        if (!this.active) return;

        // Trail
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.trailMax) this.trail.shift();

        // Gravity (mines have no velocity after placement)
        if (this.type !== 'mine') {
            this.vy += GRAVITY * 0.5;
            if (this.type === 'airstrike') this.vy = 6; // straight down

            // Wind
            this.vx += wind * 0.008;

            this.x += this.vx;
            this.y += this.vy;
        }

        // Fuse countdown (grenade)
        if (this.fuse > 0) {
            this.fuse--;
            if (this.fuse === 0) { this.explode(); return; }
        }

        // Out of bounds
        if (this.x < 0 || this.x > CW || this.y > CH) {
            this.active = false;
            return;
        }

        // Terrain collision
        if (isSolid(this.x, this.y)) {
            if (this.type === 'grenade' && this.bounces < 3) {
                this.vy *= -0.5;
                this.vx *= 0.7;
                this.bounces++;
            } else if (this.type === 'mine') {
                // already placed
            } else {
                this.explode();
            }
        }
    }

    explode() {
        if (!this.active) return;
        this.active = false;
        blastTerrain(this.x, this.y, this.radius);
        spawnExplosionParticles(this.x, this.y, '#ff8800', 20);
        // Damage worms in radius
        const allWorms = [...teamA, ...teamB];
        for (const w of allWorms) {
            if (w.dead) continue;
            const dx = w.cx - this.x, dy = w.cy - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < this.radius + WORM_W) {
                const dmg = Math.round(this.damage * (1 - dist / (this.radius + WORM_W)));
                if (dmg > 0) {
                    w.takeDamage(dmg, 'explosion');
                    // Knockback
                    const force = (1 - dist / (this.radius + WORM_W)) * 8;
                    w.vx += (dx / (dist+1)) * force;
                    w.vy += (dy / (dist+1)) * force - 2;
                    w.onGround = false;
                }
            }
        }
        playSfx('explosion');
    }

    draw(ctx) {
        if (!this.active) return;
        const px = this.x - camX, py = this.y - camY;

        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = i / this.trail.length;
            const tx = this.trail[i].x - camX;
            const ty = this.trail[i].y - camY;
            ctx.beginPath();
            ctx.arc(tx, ty, (this.type === 'airstrike' ? 2 : 1.5) * t, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255,180,50,${t * 0.6})`;
            ctx.fill();
        }

        if (this.type === 'mine') {
            ctx.fillStyle = '#cc0000';
            ctx.fillRect(px - 5, py - 5, 10, 8);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(px - 2, py - 9, 4, 5);
            return;
        }

        ctx.save();
        const angle = Math.atan2(this.vy, this.vx);
        ctx.translate(px, py);
        ctx.rotate(angle);
        if (this.type === 'bazooka') {
            ctx.fillStyle = '#888';
            ctx.fillRect(-6, -2, 12, 4);
            ctx.fillStyle = '#cc4400';
            ctx.beginPath();
            ctx.arc(6, 0, 4, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === 'grenade') {
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI*2);
            ctx.fill();
            // Fuse cord
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(0, -9);
            ctx.stroke();
            // Blinking spark — blink faster as fuse runs down
            const blinkRate = this.fuse > 90 ? 20 : this.fuse > 40 ? 10 : 4;
            if (Math.floor(this.fuse / blinkRate) % 2 === 0) {
                ctx.fillStyle = '#ffdd57';
                ctx.beginPath();
                ctx.arc(0, -10, 2.5, 0, Math.PI*2);
                ctx.fill();
            }
            // Seconds remaining label
            ctx.restore();
            ctx.fillStyle = 'rgba(255,220,0,0.9)';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(Math.ceil(this.fuse / 60) + 's', px, py - 14);
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
        } else if (this.type === 'shotgun') {
            ctx.fillStyle = '#ffdd57';
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI*2);
            ctx.fill();
        } else if (this.type === 'airstrike') {
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(-5, -3, 10, 6);
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(10, -4);
            ctx.lineTo(10, 4);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

// ─── Mines ────────────────────────────────────────────────────────────────────
let mines = [];

class Mine {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.active = true;
        this.armed = false;
        this.explodeAt = Date.now() + 5000; // real 5 seconds
    }

    update() {
        if (!this.active) return;
        if (Date.now() >= this.explodeAt) this.explode();
    }

    explode() {
        if (!this.active) return;
        this.active = false;
        blastTerrain(this.x, this.y, 35);
        spawnExplosionParticles(this.x, this.y, '#ff8800', 20);
        const allWorms = [...teamA, ...teamB];
        for (const w of allWorms) {
            if (w.dead) continue;
            const dx = w.cx - this.x, dy = w.cy - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 50) {
                const dmg = Math.round(50 * (1 - dist / 50));
                if (dmg > 0) {
                    w.takeDamage(dmg, 'mine');
                    w.vx += (dx / (dist+1)) * 6;
                    w.vy += (dy / (dist+1)) * 6 - 2;
                }
            }
        }
        playSfx('explosion');
    }

    draw(ctx) {
        if (!this.active) return;
        const px = this.x - camX, py = this.y - camY;
        ctx.fillStyle = this.armed ? '#cc0000' : '#884400';
        ctx.fillRect(px - 5, py - 5, 10, 8);
        ctx.fillStyle = this.armed ? '#ff4444' : '#bb8800';
        ctx.fillRect(px - 2, py - 9, 4, 5);

        // Countdown above dynamite
        const msLeft = Math.max(0, this.explodeAt - Date.now());
        const secsLeft = Math.ceil(msLeft / 1000);
        const blinking = msLeft <= 1000 && Math.floor(msLeft / 100) % 2 === 0;
        ctx.fillStyle = blinking ? '#ff4444' : '#ffdd57';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(secsLeft + 's', px, py - 13);
    }
}

// ─── Crates ───────────────────────────────────────────────────────────────────
let crates = [];
const CRATE_WEAPONS = ['grenade', 'shotgun', 'airstrike', 'mine', 'rope'];

class Crate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 0;
        this.weapon = CRATE_WEAPONS[Math.floor(Math.random() * CRATE_WEAPONS.length)];
        this.amount = Math.floor(Math.random() * 3) + 1;
        this.active = true;
        this.bobTimer = 0;
    }

    update() {
        if (!this.active) return;
        this.vy = Math.min(this.vy + GRAVITY * 0.4, 6);
        this.y += this.vy;
        if (isSolid(this.x + 8, this.y + 16)) {
            this.y = Math.floor((this.y + 16) / TILE) * TILE - 16;
            this.vy = 0;
        }
        this.bobTimer++;

        // Check pickup
        const allWorms = [...teamA, ...teamB];
        for (const w of allWorms) {
            if (w.dead) continue;
            const dx = w.cx - (this.x + 8), dy = w.cy - (this.y + 8);
            if (dx*dx + dy*dy < 22*22) {
                w.inventory[this.weapon] = (w.inventory[this.weapon] || 0) + this.amount;
                showPickupMessage(w, this.weapon, this.amount);
                this.active = false;
                updateWeaponBar();
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        const px = this.x - camX;
        const py = this.y - camY + Math.sin(this.bobTimer * 0.05) * 2;
        // Crate body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(px, py, 16, 16);
        ctx.strokeStyle = '#5a2d0c';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, 16, 16);
        // Cross
        ctx.strokeStyle = '#d4a017';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 2); ctx.lineTo(px + 8, py + 14);
        ctx.moveTo(px + 2, py + 8); ctx.lineTo(px + 14, py + 8);
        ctx.stroke();
        // Parachute (if falling)
        if (this.vy > 0.5) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(px + 8, py - 16, 14, Math.PI, 0);
            ctx.lineTo(px + 8, py);
            ctx.moveTo(px + 8 - 14, py - 16);
            ctx.lineTo(px + 8, py);
            ctx.stroke();
        }
    }
}

// ─── Particles ────────────────────────────────────────────────────────────────
let particles = [];

function spawnExplosionParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 5;
        const life = 0.8 + Math.random() * 0.5;
        particles.push({
            x, y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 2,
            life, maxLife: life,
            color, radius: 2 + Math.random() * 3
        });
    }
}

function updateParticles() {
    for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += GRAVITY * 0.3;
        p.vx *= 0.95;
        p.life -= 0.03;
    }
    particles = particles.filter(p => p.life > 0);
}

function drawParticles(ctx) {
    for (const p of particles) {
        const alpha = Math.max(0, p.life / (p.maxLife || 1));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camX, p.y - camY, p.radius, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ─── Airstrike ────────────────────────────────────────────────────────────────
let airstrikes = [];

function launchAirstrike(x) {
    const bombCount = 5;
    for (let i = 0; i < bombCount; i++) {
        const bx = x + (i - 2) * 30 + (Math.random()-0.5)*20;
        projectiles.push(new Projectile({
            x: bx, y: -20,
            vx: 0, vy: 2,
            type: 'airstrike',
            radius: 35, damage: 45
        }));
    }
}

// ─── Game state ───────────────────────────────────────────────────────────────
let teamA = [], teamB = [];
let wind = 0;
let turnTime = 45;
let turnTimer = turnTime;
let timerInterval = null;
let mineEndTurnTimeout = null;
let phase = 'move'; // 'move' | 'waiting' | 'end'
let crateDropTimer = 0;
let gameRunning = false;
let wormCount = 3;

// Turn sequence: slot 0=A[0], 1=B[0], 2=A[1], 3=B[1], ...
// turnSlot advances by 1 each turn, mod (wormCount * 2)
let turnSlot = 0;

const TEAM_NAMES_A = ['Alf', 'Beaker', 'Chuck'];
const TEAM_NAMES_B = ['Xray', 'Yoyo', 'Zap'];

function activeWorm() {
    const team = turnSlot % 2 === 0 ? teamA : teamB;
    const idx  = Math.floor(turnSlot / 2) % team.length;
    // Skip dead worms: find next alive in same team (shouldn't normally be needed
    // since we skip dead slots in advanceTurn, but guard here too)
    return team[idx];
}

function initGame() {
    wormIdCounter = 0;
    projectiles = [];
    mines = [];
    crates = [];
    particles = [];

    generateTerrain();
    initTerrainCanvas();
    rebuildTerrainImage();

    wind = (Math.random() - 0.5) * 2;

    // Place teams
    teamA = [];
    teamB = [];
    const spawnXA = Math.floor(COLS * 0.1);
    const spawnXB = Math.floor(COLS * 0.75);

    for (let i = 0; i < wormCount; i++) {
        const offsetA = (i - (wormCount-1)/2) * 18;
        const wa = new Worm('a', TEAM_NAMES_A[i], (spawnXA + i * 6) * TILE, 0);
        wa.placeOnSurface();
        wa.x = (spawnXA * TILE) + offsetA;
        wa.placeOnSurface();
        teamA.push(wa);

        const wb = new Worm('b', TEAM_NAMES_B[i], (spawnXB + i * 6) * TILE, 0);
        wb.placeOnSurface();
        wb.x = (spawnXB * TILE) + offsetA;
        wb.placeOnSurface();
        wb.facing = -1;
        teamB.push(wb);
    }

    turnSlot = 0;
    phase = 'move';
    gameRunning = true;

    startTurn();
    updateHUD();
    updateWeaponBar();
}

function startTurn() {
    // If the current worm is dead, step forward by 2 (same team, next worm)
    // until we find a live one on this team. Win condition handles the case
    // where the whole team is dead.
    const totalSlots = wormCount * 2;
    let safety = 0;
    while (activeWorm().dead && safety++ < wormCount) {
        turnSlot = (turnSlot + 2) % totalSlots;
    }

    const w = activeWorm();
    wind = (Math.random() - 0.5) * 2;
    turnTimer = turnTime;
    phase = 'move';
    w.justFired = false;

    centerCamOn(w.cx, w.cy);
    updateHUD();
    updateWeaponBar();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (phase !== 'move') return;
        const aw = activeWorm();
        if (aw && aw.ropeState && aw.ropeState.hooked) return; // pause timer while swinging
        turnTimer--;
        updateTimerDisplay();
        if (turnTimer <= 0) {
            clearInterval(timerInterval);
            endTurn();
        }
    }, 1000);
}

function endTurn() {
    if (phase !== 'move') return;
    phase = 'waiting';
    clearInterval(timerInterval);
    if (mineEndTurnTimeout) { clearTimeout(mineEndTurnTimeout); mineEndTurnTimeout = null; }
    setTimeout(advanceTurn, 2000);
}

function advanceTurn() {
    if (phase === 'end' || phase === 'move') return;
    turnSlot = (turnSlot + 1) % (wormCount * 2);

    crateDropTimer++;
    if (crateDropTimer >= 3) {
        crateDropTimer = 0;
        dropCrate();
    }

    startTurn();
}

function dropCrate() {
    const x = Math.floor(Math.random() * (CW - 40)) + 20;
    crates.push(new Crate(x, -30));
}

function checkWinCondition() {
    if (phase === 'end') return;
    const aAlive = teamA.filter(w => !w.dead).length;
    const bAlive = teamB.filter(w => !w.dead).length;

    if (aAlive === 0 || bAlive === 0) {
        phase = 'end';
        gameRunning = false;
        clearInterval(timerInterval);
        setTimeout(() => {
            const winner = aAlive > 0 ? 'Team Red' : 'Team Blue';
            showOverlay(winner + ' Wins!', 'All enemy worms have been eliminated.');
        }, 1200);
    }
}

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};

document.addEventListener('keydown', e => {
    if (!gameRunning) return;
    keys[e.code] = true;

    const w = activeWorm();
    if (!w || w.dead || phase !== 'move') return;

    // Weapon select
    const weaponKeys = {Digit1:'bazooka', Digit2:'grenade', Digit3:'shotgun', Digit4:'airstrike', Digit5:'mine', Digit6:'rope'};
    if (weaponKeys[e.code]) {
        const wep = weaponKeys[e.code];
        if ((w.inventory[wep] || 0) > 0) {
            w.activeWeapon = wep;
            updateWeaponBar();
        }
        return;
    }

    if (e.code === 'Space') {
        e.preventDefault();
        if (w.onGround && !w.ropeState) {
            w.vy = -7;
            w.onGround = false;
        }
    }

    if (e.code === 'Enter') {
        e.preventDefault();
        if (w.activeWeapon === 'rope') {
            if (!w.ropeState) {
                w.fireRope();
            } else if (w.ropeState.hooked) {
                w.releaseRope();
            }
        } else {
            if (w.onGround && !w.ropeState) {
                fireWeapon(w);
            }
        }
    }

    if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (w.ropeState && w.ropeState.hooked) {
            w.adjustRope(-5);
        } else {
            w.aimAngle = Math.max(-89, w.aimAngle - 3);
        }
    }
    if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (w.ropeState && w.ropeState.hooked) {
            w.adjustRope(5);
        } else {
            w.aimAngle = Math.min(0, w.aimAngle + 3);
        }
    }
    if (e.code === 'Tab') {
        e.preventDefault();
        // Skip turn
        endTurn();
    }
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
});

function handleMovement() {
    if (!gameRunning || phase !== 'move') return;
    const w = activeWorm();
    if (!w || w.dead) return;

    const ropeActive = w.ropeState && w.ropeState.hooked;

    if (keys['ArrowLeft']) {
        w.facing = -1;
        if (!ropeActive) {
            w.vx = -2.2;
        } else {
            w.ropeState.angVel = Math.max(-0.06, w.ropeState.angVel - 0.001);
        }
    }
    if (keys['ArrowRight']) {
        w.facing = 1;
        if (!ropeActive) {
            w.vx = 2.2;
        } else {
            w.ropeState.angVel = Math.min(0.06, w.ropeState.angVel + 0.001);
        }
    }
}

function fireWeapon(w) {
    if (w.justFired) return;
    const rad = w.aimAngle * Math.PI / 180;
    const speed = 12;
    const vx = Math.cos(rad) * speed * w.facing;
    const vy = Math.sin(rad) * speed;
    const startX = w.cx;
    const startY = w.cy;

    switch (w.activeWeapon) {
        case 'bazooka':
            projectiles.push(new Projectile({x:startX, y:startY, vx, vy, type:'bazooka', radius:40, damage:55}));
            endTurn();
            break;
        case 'grenade':
            if ((w.inventory.grenade || 0) <= 0) return;
            w.inventory.grenade--;
            projectiles.push(new Projectile({x:startX, y:startY, vx:vx*0.45, vy:vy*0.45 - 2, type:'grenade', radius:35, damage:45, fuse:180}));
            endTurn();
            break;
        case 'shotgun':
            if ((w.inventory.shotgun || 0) <= 0) return;
            w.inventory.shotgun--;
            for (let i = -1; i <= 1; i++) {
                const spread = (Math.random() - 0.5) * 0.15;
                projectiles.push(new Projectile({
                    x:startX, y:startY,
                    vx: vx * 0.7 + spread * 5,
                    vy: vy * 0.7 + spread * 5,
                    type:'shotgun', radius:18, damage:18, trailMax:6
                }));
            }
            endTurn();
            break;
        case 'airstrike':
            if ((w.inventory.airstrike || 0) <= 0) return;
            w.inventory.airstrike--;
            launchAirstrike(startX);
            endTurn();
            break;
        case 'mine':
            if ((w.inventory.mine || 0) <= 0) return;
            w.inventory.mine--;
            mines.push(new Mine(w.cx - 5, w.bottom - 8, w));
            mineEndTurnTimeout = setTimeout(endTurn, 5000);
            break;
    }
    w.justFired = true;
    updateWeaponBar();
    playSfx('fire');
}

// ─── HUD updates ──────────────────────────────────────────────────────────────
function updateHUD() {
    // Team A worms
    const teamAList = document.getElementById('team-a-worms');
    teamAList.innerHTML = '';
    teamA.forEach((w, i) => {
        const el = document.createElement('div');
        el.className = 'worm-entry team-a' + (w === activeWorm() ? ' active-worm' : '') + (w.dead ? ' dead' : '');
        el.innerHTML = `<span>${w.name}</span><div class="worm-hp-bar"><div class="worm-hp-fill" style="width:${w.hp}%"></div></div><span>${w.hp}</span>`;
        teamAList.appendChild(el);
    });

    const teamBList = document.getElementById('team-b-worms');
    teamBList.innerHTML = '';
    teamB.forEach((w, i) => {
        const el = document.createElement('div');
        el.className = 'worm-entry team-b' + (w === activeWorm() ? ' active-worm' : '') + (w.dead ? ' dead' : '');
        el.innerHTML = `<span>${w.name}</span><div class="worm-hp-bar"><div class="worm-hp-fill" style="width:${w.hp}%"></div></div><span>${w.hp}</span>`;
        teamBList.appendChild(el);
    });

    const w = activeWorm();
    document.getElementById('current-turn-label').textContent =
        w ? (turnSlot % 2 === 0 ? '🔴 Red: ' : '🔵 Blue: ') + w.name : '';
    document.getElementById('weapon-label').textContent =
        w ? weaponDisplayName(w.activeWeapon) + (w.inventory[w.activeWeapon] === Infinity ? '' : ` (${w.inventory[w.activeWeapon] || 0})`) : '';
    document.getElementById('wind-label').textContent =
        `Wind: ${wind > 0 ? '→' : '←'} ${Math.abs(wind).toFixed(1)}`;

    updateTimerDisplay();
}

function updateTimerDisplay() {
    const el = document.getElementById('turn-timer');
    el.textContent = turnTimer;
    el.className = turnTimer <= 10 ? 'urgent' : '';
}

function weaponDisplayName(w) {
    return {bazooka:'Bazooka', grenade:'Grenade', shotgun:'Shotgun', airstrike:'Airstrike', mine:'Dynamite', rope:'Ninja Rope'}[w] || w;
}

function updateWeaponBar() {
    const w = activeWorm();
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        const wep = btn.dataset.weapon;
        btn.classList.toggle('active', w ? w.activeWeapon === wep : false);
        btn.classList.toggle('disabled', w ? (w.inventory[wep] || 0) <= 0 : true);
    });
    // Weapon bar click
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.onclick = () => {
            if (!w || !gameRunning || phase !== 'move') return;
            const wep = btn.dataset.weapon;
            if ((w.inventory[wep] || 0) > 0) {
                w.activeWeapon = wep;
                updateWeaponBar();
                updateHUD();
            }
        };
    });
}

// ─── Floating damage numbers ──────────────────────────────────────────────────
function spawnDamageFloat(wx, wy, amount) {
    const container = document.getElementById('canvas-container');
    const el = document.createElement('div');
    el.className = 'damage-float';
    el.textContent = `-${amount}`;
    el.style.left = (wx - camX - 12) + 'px';
    el.style.top  = (wy - camY - 20) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 1300);
}

let pickupMessageTimer = null;

function showPickupMessage(w, weapon, amount) {
    const el = document.getElementById('wind-label');
    el.textContent = `📦 ${w.name} got ${amount}x ${weaponDisplayName(weapon)}!`;
    el.style.color = '#ffdd57';
    clearTimeout(pickupMessageTimer);
    pickupMessageTimer = setTimeout(() => {
        el.style.color = '';
        updateHUD();
    }, 2500);
}

// ─── Overlay / start screen ───────────────────────────────────────────────────
function showOverlay(title, body) {
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-body').textContent = body;
    document.getElementById('overlay').classList.remove('hidden');
}

document.getElementById('overlay-btn').onclick = () => {
    document.getElementById('overlay').classList.add('hidden');
    initGame();
};

document.getElementById('start-btn').onclick = () => {
    wormCount = parseInt(document.getElementById('worm-count').value);
    turnTime  = parseInt(document.getElementById('turn-time').value);
    document.getElementById('start-screen').style.display = 'none';
    initGame();
};

// ─── Sound (simple Web Audio) ─────────────────────────────────────────────────
let audioCtx = null;

function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playSfx(type) {
    try {
        const ctx = getAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'explosion') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(); osc.stop(ctx.currentTime + 0.5);
        } else if (type === 'fire') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(); osc.stop(ctx.currentTime + 0.2);
        }
    } catch(e) {}
}

// ─── Sky / background ─────────────────────────────────────────────────────────
function drawBackground(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, '#1a3a6b');
    grad.addColorStop(0.5, '#87CEEB');
    grad.addColorStop(1, '#b0e0ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (const cl of clouds) {
        ctx.beginPath();
        ctx.arc(cl.x - camX, cl.y - camY, cl.r, 0, Math.PI*2);
        ctx.arc(cl.x - camX + cl.r*0.7, cl.y - camY - cl.r*0.3, cl.r*0.65, 0, Math.PI*2);
        ctx.arc(cl.x - camX - cl.r*0.6, cl.y - camY - cl.r*0.2, cl.r*0.55, 0, Math.PI*2);
        ctx.fill();
    }
}

// Static clouds
const clouds = Array.from({length: 10}, () => ({
    x: Math.random() * CW,
    y: Math.random() * CH * 0.3,
    r: 20 + Math.random() * 30
}));

// ─── Main render loop ─────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = VIEW_W;
canvas.height = VIEW_H;

let lastTime = 0;

function gameLoop(ts) {
    requestAnimationFrame(gameLoop);
    const dt = ts - lastTime;
    lastTime = ts;

    if (!gameRunning) return;
    if (terrainDirty) rebuildTerrainImage();

    handleMovement();

    // Update rope tips (flying hook)
    const w = activeWorm();
    if (w && w.ropeState && !w.ropeState.hooked) {
        w.updateRopeTip();
    }

    // Update worms
    for (const worm of [...teamA, ...teamB]) {
        worm.update();
    }

    // Update projectiles
    for (const p of projectiles) p.update();
    projectiles = projectiles.filter(p => p.active);

    // Update mines
    for (const m of mines) m.update();
    mines = mines.filter(m => m.active);

    // Update crates
    for (const c of crates) c.update();
    crates = crates.filter(c => c.active);

    // Update particles
    updateParticles();

    // Camera follow active worm during move phase
    if (phase === 'move' && w && !w.dead) {
        const tx = w.cx - VIEW_W/2;
        const ty = w.cy - VIEW_H/2;
        camX += (tx - camX) * 0.08;
        camY += (ty - camY) * 0.08;
        clampCam();
    }

    // ── Draw ──
    drawBackground(ctx);

    // Terrain
    ctx.drawImage(terrainCanvas, -camX, -camY);

    // Crates
    for (const c of crates) c.draw(ctx);

    // Mines
    for (const m of mines) m.draw(ctx);

    // Projectiles
    for (const p of projectiles) p.draw(ctx);

    // Worms
    for (const worm of [...teamA, ...teamB]) worm.draw(ctx);

    // Particles
    drawParticles(ctx);

    // Aim angle display
    if (w && !w.dead && phase === 'move' && w.onGround && !w.ropeState) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Aim: ${Math.round(w.aimAngle)}°`, 8, VIEW_H - 8);
    }
}

requestAnimationFrame(gameLoop);
