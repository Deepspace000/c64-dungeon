// effects.js - Mist, lighting, animations, minimap, and main render()
// Depends on: state, colors, DIRS, GAME_WIDTH, GAME_HEIGHT, ctx, minimapCtx, minimapCanvas from globals
// Depends on: drawView from renderer.js
// Depends on: project from renderer.js

// Offscreen canvas for lighting
const lightingCanvas = document.createElement('canvas');
lightingCanvas.width = 400;
lightingCanvas.height = 300;
const lightingCtx = lightingCanvas.getContext('2d');

let currentAnimationFrame = null;

function render() {
    if (state.appState !== 'playing' && state.appState !== 'low_health') return;

    ctx.fillStyle = colors.black;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = colors.darkgrey;
    ctx.fillRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);

    drawView();
    if (state.level === 1 || state.level === 2) drawMist();
    drawLighting();
    drawMinimap();
    drawAnimations();

    if (state.appState === 'low_health') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = colors.yellow;
        ctx.shadowColor = colors.black;
        ctx.shadowBlur = 5;
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const warning = "The next hit could mean death! Step back to escape the battle or drink a health potion";
        const maxWidth = GAME_WIDTH * 0.8;
        const words = warning.split(' ');
        let line = '';
        let lines = [];

        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                lines.push(line);
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        let yStart = GAME_HEIGHT / 2 - (lines.length * 15) / 2;
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], GAME_WIDTH / 2, yStart);
            yStart += 16;
        }
        ctx.shadowBlur = 0;
    }

    if (currentAnimationFrame) cancelAnimationFrame(currentAnimationFrame);
    if (state.animations.length > 0 || state.level === 1 || state.level === 2 || state.level === 3) {
        currentAnimationFrame = requestAnimationFrame(render);
    }
}

function drawMinimap() {
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;

    minimapCtx.fillStyle = colors.black;
    minimapCtx.fillRect(0, 0, mw, mh);

    if (state.appState !== 'playing' || !state.map || !state.explored) return;

    const map = state.map;
    const w = map[0].length;
    const h = map.length;

    const ts = Math.floor(mw / w);
    const offX = Math.floor((mw - w * ts) / 2);
    const offY = Math.floor((mh - h * ts) / 2);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (!state.explored[y][x]) continue;
            if (map[y][x] === 0 || map[y][x] === 3) {
                minimapCtx.fillStyle = colors.brown;
                minimapCtx.fillRect(offX + x * ts, offY + y * ts, ts, ts);
            } else if (map[y][x] === 1) {
                minimapCtx.fillStyle = colors.darkgrey;
                minimapCtx.fillRect(offX + x * ts, offY + y * ts, ts, ts);
            } else if (map[y][x] === 2) {
                minimapCtx.fillStyle = colors.lightblue;
                minimapCtx.fillRect(offX + x * ts, offY + y * ts, ts, ts);
            } else if (map[y][x] === 4) {
                minimapCtx.fillStyle = colors.orange;
                minimapCtx.fillRect(offX + x * ts, offY + y * ts, ts, ts);
            }
        }
    }

    const px = state.player.x;
    const py = state.player.y;
    minimapCtx.fillStyle = (Date.now() % 500 < 250) ? colors.yellow : colors.orange;
    minimapCtx.fillRect(offX + px * ts + 1, offY + py * ts + 1, ts - 2, ts - 2);

    for (let item of state.items) {
        if (state.explored[item.y] && state.explored[item.y][item.x]) {
            if (item.type === 'fountain') {
                minimapCtx.fillStyle = colors.cyan;
                minimapCtx.fillRect(offX + item.x * ts + 1, offY + item.y * ts + 1, ts - 2, ts - 2);
            } else if (item.type === 'chest') {
                minimapCtx.fillStyle = colors.yellow;
                minimapCtx.fillRect(offX + item.x * ts + 1, offY + item.y * ts + 1, ts - 2, ts - 2);
            }
        }
    }

    for (let e of state.enemies) {
        if (e.state !== 'dead' && state.explored[e.y] && state.explored[e.y][e.x]) {
            minimapCtx.fillStyle = colors.red;
            minimapCtx.fillRect(offX + e.x * ts + 1, offY + e.y * ts + 1, ts - 2, ts - 2);
        }
    }
}

function drawMist() {
    if (state.level === 1) {
        ctx.fillStyle = 'rgba(80, 0, 0, 0.3)';
    } else if (state.level === 2) {
        ctx.fillStyle = 'rgba(0, 80, 0, 0.3)';
    }
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < state.mistParticles.length; i++) {
        let p = state.mistParticles[i];

        if (state.level === 1) {
            p.x -= (p.speed * 0.45);
            if (p.x + p.size < 0) {
                p.x = GAME_WIDTH;
                p.y = GAME_HEIGHT / 2 - 20 + Math.random() * (GAME_HEIGHT / 2 + 20);
            }
        } else if (state.level === 2) {
            p.x += (p.speed * 0.45);
            if (p.x - p.size > GAME_WIDTH) {
                p.x = -p.size * 2;
                p.y = GAME_HEIGHT / 2 - 20 + Math.random() * (GAME_HEIGHT / 2 + 20);
            }
        }

        ctx.fillStyle = `rgba(180, 180, 180, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size * 2, p.size);
        ctx.fillRect(p.x - 4, p.y + p.size / 2, 4, 4);
        ctx.fillRect(p.x + p.size * 2, p.y + p.size / 4, 8, 4);
    }
}

function drawLighting() {
    if (state.level !== 3) return;

    const hasTorchEquipped = state.hands.left === 'Torch' || state.hands.right === 'Torch';
    const ambientDark = hasTorchEquipped ? 0.3 : 0.82;

    lightingCtx.globalCompositeOperation = 'source-over';
    lightingCtx.fillStyle = `rgba(0, 0, 0, ${ambientDark})`;
    lightingCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    lightingCtx.globalCompositeOperation = 'destination-out';

    const lightRadius = hasTorchEquipped ? GAME_HEIGHT * 1.5 : GAME_HEIGHT * 1.0;
    let pLight = lightingCtx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT - 20, 0, GAME_WIDTH / 2, GAME_HEIGHT - 20, lightRadius);
    pLight.addColorStop(0, 'rgba(0,0,0,1)');
    pLight.addColorStop(0.5, 'rgba(0,0,0,0.7)');
    pLight.addColorStop(1, 'rgba(0,0,0,0)');
    lightingCtx.fillStyle = pLight;
    lightingCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const { x: px, y: py, dir } = state.player;
    const forward = DIRS[dir];
    const right = DIRS[(dir + 1) % 4];

    for (let t of state.torches) {
        const dx = t.x - px;
        const dy = t.y - py;

        const tz = forward.dx * dx + forward.dy * dy;
        const tx = right.dx * dx + right.dy * dy;

        if (tz >= 0 && tz <= MAX_DEPTH && Math.abs(tx) <= 6) {
            const p = project(tx, 0.4, tz);
            const flicker = 0.92 + Math.sin(Date.now() / 150 + tx * tz) * 0.08;
            const rMask = (500 / (tz + 0.5)) * flicker;

            let tLight = lightingCtx.createRadialGradient(p.x, p.y, rMask * 0.05, p.x, p.y, rMask);
            tLight.addColorStop(0, 'rgba(0,0,0,1)');
            tLight.addColorStop(0.45, 'rgba(0,0,0,0.5)');
            tLight.addColorStop(0.8, 'rgba(0,0,0,0.15)');
            tLight.addColorStop(1, 'rgba(0,0,0,0)');

            lightingCtx.fillStyle = tLight;
            lightingCtx.fillRect(p.x - rMask, p.y - rMask, rMask * 2, rMask * 2);
        }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(lightingCanvas, 0, 0);
}

function drawAnimations() {
    let textOffsetY = GAME_HEIGHT / 2;

    for (let a of state.animations) {
        if (a.type === 'swipe') {
            const t = a.timer / 10;
            ctx.strokeStyle = a.color || colors.white;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(100 + (1 - t) * 120, 50 + (1 - t) * 140);
            ctx.lineTo(80 + (1 - t) * 120, 70 + (1 - t) * 140);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(220 - (1 - t) * 120, 50 + (1 - t) * 140);
            ctx.lineTo(240 - (1 - t) * 120, 70 + (1 - t) * 140);
            ctx.stroke();
        } else if (a.type === 'text') {
            let textColor = a.color || colors.yellow;
            if (a.flash) {
                if (a.timer % 60 < 30) {
                    textColor = 'transparent';
                }
            }

            ctx.fillStyle = textColor;
            ctx.font = '16px "Press Start 2P"';
            ctx.textAlign = 'center';

            const maxWidth = GAME_WIDTH * 0.6;
            const words = a.text.split(' ');
            let line = '';
            let lines = [];

            for (let i = 0; i < words.length; i++) {
                let testLine = line + words[i] + ' ';
                let metrics = ctx.measureText(testLine);
                let testWidth = metrics.width;
                if (testWidth > maxWidth && i > 0) {
                    lines.push(line);
                    line = words[i] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            const lineHeight = 20;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], GAME_WIDTH / 2, textOffsetY);
                textOffsetY += lineHeight;
            }
            textOffsetY += lineHeight * 0.5;
        }
    }
}
