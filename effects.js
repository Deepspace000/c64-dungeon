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
    if (state.level === 4) {
        drawPuddles();
        drawBlueMist();
        drawDrips();
    }
    if (state.level === 5) drawCryptMist();
    if (state.level === 6) { drawBrightLight(); }
    if (state.level === 7) { drawSunkenWater(); drawDrips(); }
    if (state.level === 8) drawObsidianMist();
    if (state.level === 10) drawThroneRoom();
    if (state.level === 9) drawCaveWind();
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
    if (state.animations.length > 0 || state.level === 1 || state.level === 2 || state.level === 3 || state.level === 4) {
        currentAnimationFrame = requestAnimationFrame(render);
    }
}

// Minimap zoom state: false = full map, true = zoomed on player
if (typeof state.minimapZoomed === 'undefined') state.minimapZoomed = false;

function drawMinimap() {
    const mw = minimapCanvas.width;
    const mh = minimapCanvas.height;

    minimapCtx.fillStyle = colors.black;
    minimapCtx.fillRect(0, 0, mw, mh);

    if (state.appState !== 'playing' || !state.map || !state.explored) return;

    const map = state.map;
    const mapW = map[0].length;
    const mapH = map.length;
    const px = state.player.x;
    const py = state.player.y;

    let ts, offX, offY, viewX0, viewY0, viewX1, viewY1;

    if (state.minimapZoomed) {
        // Zoomed: 4px per tile, centered on player
        ts = 4;
        const tilesVisibleX = Math.floor(mw / ts);
        const tilesVisibleY = Math.floor(mh / ts);
        viewX0 = Math.max(0, px - Math.floor(tilesVisibleX / 2));
        viewY0 = Math.max(0, py - Math.floor(tilesVisibleY / 2));
        viewX1 = Math.min(mapW, viewX0 + tilesVisibleX);
        viewY1 = Math.min(mapH, viewY0 + tilesVisibleY);
        // Recalculate start if we hit the edge
        viewX0 = Math.max(0, viewX1 - tilesVisibleX);
        viewY0 = Math.max(0, viewY1 - tilesVisibleY);
        offX = Math.floor((mw - (viewX1 - viewX0) * ts) / 2);
        offY = Math.floor((mh - (viewY1 - viewY0) * ts) / 2);
    } else {
        // Full map view
        ts = Math.max(1, Math.floor(Math.min(mw / mapW, mh / mapH)));
        viewX0 = 0; viewY0 = 0;
        viewX1 = mapW; viewY1 = mapH;
        offX = Math.floor((mw - mapW * ts) / 2);
        offY = Math.floor((mh - mapH * ts) / 2);
    }

    for (let y = viewY0; y < viewY1; y++) {
        for (let x = viewX0; x < viewX1; x++) {
            if (!state.explored[y][x]) continue;
            const dx = (x - viewX0) * ts + offX;
            const dy = (y - viewY0) * ts + offY;
            if (map[y][x] === 0 || map[y][x] === 3) {
                minimapCtx.fillStyle = colors.brown;
                minimapCtx.fillRect(dx, dy, ts, ts);
            } else if (map[y][x] === 1) {
                minimapCtx.fillStyle = colors.darkgrey;
                minimapCtx.fillRect(dx, dy, ts, ts);
            } else if (map[y][x] === 2) {
                minimapCtx.fillStyle = colors.lightblue;
                minimapCtx.fillRect(dx, dy, ts, ts);
            } else if (map[y][x] === 4) {
                minimapCtx.fillStyle = colors.orange;
                minimapCtx.fillRect(dx, dy, ts, ts);
            }
        }
    }

    // Draw player - always visible with a blinking dot
    const playerDx = (px - viewX0) * ts + offX;
    const playerDy = (py - viewY0) * ts + offY;
    const playerSize = Math.max(ts, 3);
    minimapCtx.fillStyle = (Date.now() % 500 < 250) ? colors.yellow : colors.orange;
    minimapCtx.fillRect(playerDx, playerDy, playerSize, playerSize);

    for (let item of state.items) {
        if (item.x >= viewX0 && item.x < viewX1 && item.y >= viewY0 && item.y < viewY1) {
            if (state.explored[item.y] && state.explored[item.y][item.x]) {
                const dx = (item.x - viewX0) * ts + offX;
                const dy = (item.y - viewY0) * ts + offY;
                if (item.type === 'fountain') {
                    minimapCtx.fillStyle = colors.cyan;
                    minimapCtx.fillRect(dx, dy, ts, ts);
                } else if (item.type === 'chest') {
                    minimapCtx.fillStyle = colors.yellow;
                    minimapCtx.fillRect(dx, dy, ts, ts);
                }
            }
        }
    }

    for (let e of state.enemies) {
        if (e.x >= viewX0 && e.x < viewX1 && e.y >= viewY0 && e.y < viewY1) {
            if (e.state !== 'dead' && state.explored[e.y] && state.explored[e.y][e.x]) {
                const dx = (e.x - viewX0) * ts + offX;
                const dy = (e.y - viewY0) * ts + offY;
                minimapCtx.fillStyle = e.isBoss ? colors.purple : colors.red;
                minimapCtx.fillRect(dx, dy, ts, ts);
            }
        }
    }

    // Zoom indicator
    minimapCtx.fillStyle = colors.lightgrey;
    minimapCtx.font = '7px "Press Start 2P"';
    minimapCtx.fillText(state.minimapZoomed ? '[-]' : '[+]', mw - 22, mh - 3);
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

function drawBlueMist() {
    // Blue-tinted fog overlay
    ctx.fillStyle = 'rgba(0, 40, 100, 0.25)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Drifting blue mist particles
    for (let i = 0; i < state.mistParticles.length; i++) {
        let p = state.mistParticles[i];
        p.x += p.speed * 0.3;
        if (p.x - p.size > GAME_WIDTH) {
            p.x = -p.size * 2;
            p.y = GAME_HEIGHT * 0.5 + Math.random() * (GAME_HEIGHT * 0.5);
        }
        ctx.fillStyle = `rgba(80, 140, 220, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size * 2, p.size);
        ctx.fillRect(p.x - 3, p.y + p.size / 2, 3, 3);
        ctx.fillRect(p.x + p.size * 2, p.y + p.size / 4, 6, 3);
    }
}

function drawDrips() {
    for (let d of state.drips) {
        if (d.splashTimer > 0) {
            // Splash ripple at landing point
            const progress = d.splashTimer / 15;
            const rippleR = 3 + (1 - progress) * 8;
            ctx.strokeStyle = `rgba(100, 180, 255, ${progress * 0.6})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(d.splashX, d.splashY, rippleR, rippleR * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            d.splashTimer -= 1;
            if (d.splashTimer <= 0) {
                // Reset drip to top
                d.x = 20 + Math.random() * (GAME_WIDTH - 40);
                d.y = Math.random() * 10;
            }
        } else {
            // Falling water drop
            d.y += d.speed;

            // Teardrop shape
            ctx.fillStyle = `rgba(100, 180, 255, ${d.opacity})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
            // Streak above
            ctx.strokeStyle = `rgba(100, 180, 255, ${d.opacity * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y - d.size);
            ctx.lineTo(d.x, d.y - d.size - 4 - d.speed * 2);
            ctx.stroke();

            // Hit the floor zone
            if (d.y > GAME_HEIGHT * 0.65 + Math.random() * GAME_HEIGHT * 0.2) {
                d.splashX = d.x;
                d.splashY = d.y;
                d.splashTimer = 15;
            }
        }
    }
}

function drawPuddles() {
    const t = Date.now() / 1000;
    for (let p of state.puddles) {
        p.shimmer += 0.02;
        const shimmerAlpha = p.opacity + Math.sin(p.shimmer) * 0.05;

        // Dark water puddle
        ctx.fillStyle = `rgba(20, 60, 120, ${shimmerAlpha})`;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Light reflection highlight
        ctx.fillStyle = `rgba(100, 180, 255, ${shimmerAlpha * 0.4 + Math.sin(t + p.x) * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(p.x - p.w * 0.15, p.y - p.h * 0.1, p.w * 0.2, p.h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawThroneRoom() {
    const t = Date.now() / 1000;

    // Dark red atmospheric overlay
    ctx.fillStyle = 'rgba(40, 5, 5, 0.08)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Slow dark red mist
    for (let i = 0; i < state.mistParticles.length; i++) {
        let p = state.mistParticles[i];
        p.x += p.speed * 0.2;
        p.y += Math.sin(t * 0.3 + i * 0.5) * 0.2;
        if (p.x - p.size * 4 > GAME_WIDTH) {
            p.x = -p.size * 5;
            p.y = GAME_HEIGHT * 0.3 + Math.random() * (GAME_HEIGHT * 0.6);
        }
        const mistAlpha = 0.06 + p.opacity * 0.06;
        const r = p.size * 3.5;
        const mistGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        mistGrad.addColorStop(0, `rgba(80, 10, 10, ${mistAlpha})`);
        mistGrad.addColorStop(0.5, `rgba(50, 5, 5, ${mistAlpha * 0.4})`);
        mistGrad.addColorStop(1, 'rgba(30, 0, 0, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    }

    // Flickering firelight glow from gold stands
    const flicker1 = 0.6 + Math.sin(t * 4) * 0.2 + Math.sin(t * 7) * 0.1;
    const flicker2 = 0.6 + Math.sin(t * 3.5 + 2) * 0.2 + Math.sin(t * 6 + 1) * 0.1;

    // Left fire glow
    const glowL = ctx.createRadialGradient(GAME_WIDTH * 0.15, GAME_HEIGHT * 0.3, 0, GAME_WIDTH * 0.15, GAME_HEIGHT * 0.3, 80);
    glowL.addColorStop(0, `rgba(255, 120, 20, ${0.04 * flicker1})`);
    glowL.addColorStop(1, 'rgba(200, 60, 0, 0)');
    ctx.fillStyle = glowL;
    ctx.fillRect(0, 0, GAME_WIDTH * 0.4, GAME_HEIGHT * 0.6);

    // Right fire glow
    const glowR = ctx.createRadialGradient(GAME_WIDTH * 0.85, GAME_HEIGHT * 0.3, 0, GAME_WIDTH * 0.85, GAME_HEIGHT * 0.3, 80);
    glowR.addColorStop(0, `rgba(255, 120, 20, ${0.04 * flicker2})`);
    glowR.addColorStop(1, 'rgba(200, 60, 0, 0)');
    ctx.fillStyle = glowR;
    ctx.fillRect(GAME_WIDTH * 0.6, 0, GAME_WIDTH * 0.4, GAME_HEIGHT * 0.6);
}

function drawCaveWind() {
    const t = Date.now() / 1000;

    // Dusty brown atmosphere
    ctx.fillStyle = 'rgba(60, 30, 15, 0.06)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Fast-moving windy mist — reddish brown
    for (let i = 0; i < state.mistParticles.length; i++) {
        let p = state.mistParticles[i];
        // Wind gusts — faster horizontal movement with turbulence
        p.x += p.speed * 0.8 + Math.sin(t * 2 + i * 0.3) * 0.5;
        p.y += Math.sin(t * 1.5 + i * 0.9) * 0.8 + Math.cos(t * 0.7 + i * 1.4) * 0.4;
        if (p.x - p.size * 4 > GAME_WIDTH) {
            p.x = -p.size * 6;
            p.y = GAME_HEIGHT * 0.1 + Math.random() * (GAME_HEIGHT * 0.8);
        }
        const mistAlpha = 0.12 + p.opacity * 0.12;
        const r = p.size * 4;
        // Stretched horizontally for wind effect
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(2.2, 0.5);
        const mistGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        mistGrad.addColorStop(0, `rgba(140, 75, 30, ${mistAlpha})`);
        mistGrad.addColorStop(0.5, `rgba(100, 50, 20, ${mistAlpha * 0.4})`);
        mistGrad.addColorStop(1, 'rgba(60, 30, 10, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.restore();
    }

    // Dust particles blown by wind
    for (let i = 0; i < 25; i++) {
        const baseX = ((i * 157 + 31) % GAME_WIDTH);
        const baseY = ((i * 89 + 47) % GAME_HEIGHT);
        const dx = baseX + (t * 40 + i * 50) % (GAME_WIDTH + 20) - 10;
        const dy = baseY + Math.sin(t * 2 + i * 1.7) * 8;
        const wrappedX = ((dx % (GAME_WIDTH + 20)) + GAME_WIDTH + 20) % (GAME_WIDTH + 20) - 10;
        const alpha = 0.25 + Math.sin(t * 1.5 + i) * 0.12;
        ctx.fillStyle = `rgba(180, 120, 60, ${alpha})`;
        ctx.fillRect(wrappedX, dy, 2, 1.5);
    }
}

function drawObsidianMist() {
    const t = Date.now() / 1000;

    // Dark purple ambient overlay
    ctx.fillStyle = 'rgba(30, 10, 40, 0.08)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Purple mist drifting
    for (let i = 0; i < state.mistParticles.length; i++) {
        let p = state.mistParticles[i];
        p.x += p.speed * 0.35;
        p.y += Math.sin(t * 0.5 + i * 0.6) * 0.3;
        if (p.x - p.size * 4 > GAME_WIDTH) {
            p.x = -p.size * 6;
            p.y = GAME_HEIGHT * 0.2 + Math.random() * (GAME_HEIGHT * 0.7);
        }
        const mistAlpha = 0.06 + p.opacity * 0.08;
        const r = p.size * 3.5;
        const mistGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        mistGrad.addColorStop(0, `rgba(100, 40, 140, ${mistAlpha})`);
        mistGrad.addColorStop(0.5, `rgba(70, 20, 100, ${mistAlpha * 0.4})`);
        mistGrad.addColorStop(1, 'rgba(40, 10, 60, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    }

    // Occasional gem sparkle flashes
    for (let i = 0; i < 8; i++) {
        const sparkPhase = (t * 0.8 + i * 1.3) % 3;
        if (sparkPhase < 0.3) {
            const sx = ((i * 173 + 29) % GAME_WIDTH);
            const sy = ((i * 97 + 41) % GAME_HEIGHT);
            const sparkAlpha = (0.3 - sparkPhase) * 1.5;
            ctx.fillStyle = `rgba(200, 150, 255, ${sparkAlpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawSunkenWater() {
    const t = Date.now() / 1000;

    // Blue-green atmospheric tint on lower half
    const waterOverlay = ctx.createLinearGradient(0, GAME_HEIGHT * 0.4, 0, GAME_HEIGHT);
    waterOverlay.addColorStop(0, 'rgba(10, 40, 60, 0)');
    waterOverlay.addColorStop(0.5, 'rgba(10, 40, 60, 0.06)');
    waterOverlay.addColorStop(1, 'rgba(10, 50, 80, 0.12)');
    ctx.fillStyle = waterOverlay;
    ctx.fillRect(0, GAME_HEIGHT * 0.4, GAME_WIDTH, GAME_HEIGHT * 0.6);

    // Drifting mist — damp library fog
    for (let i = 0; i < state.mistParticles.length; i++) {
        let p = state.mistParticles[i];
        p.x += p.speed * 0.4;
        p.y += Math.sin(t * 0.5 + i * 0.8) * 0.4;
        if (p.x - p.size * 4 > GAME_WIDTH) {
            p.x = -p.size * 6;
            p.y = GAME_HEIGHT * 0.2 + Math.random() * (GAME_HEIGHT * 0.6);
        }
        const mistAlpha = 0.08 + p.opacity * 0.1;
        const r = p.size * 4;
        const mistGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        mistGrad.addColorStop(0, `rgba(60, 120, 150, ${mistAlpha})`);
        mistGrad.addColorStop(0.5, `rgba(40, 90, 120, ${mistAlpha * 0.4})`);
        mistGrad.addColorStop(1, 'rgba(20, 60, 90, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    }

    // Floating paper/book debris on water surface
    for (let i = 0; i < 12; i++) {
        const baseX = ((i * 157 + 23) % GAME_WIDTH);
        const baseY = GAME_HEIGHT * 0.55 + ((i * 83 + 41) % (GAME_HEIGHT * 0.4));
        const dx = baseX + Math.sin(t * 0.2 + i * 1.9) * 10;
        const dy = baseY + Math.sin(t * 0.3 + i * 1.3) * 3;
        const rot = Math.sin(t * 0.15 + i * 2.7) * 0.3;
        const alpha = 0.15 + Math.sin(t * 0.5 + i) * 0.05;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(rot);
        // Small page/parchment
        ctx.fillStyle = `rgba(180, 170, 140, ${alpha})`;
        ctx.fillRect(-2, -1.5, 4, 3);
        ctx.strokeStyle = `rgba(100, 90, 60, ${alpha * 0.5})`;
        ctx.lineWidth = 0.3;
        ctx.strokeRect(-2, -1.5, 4, 3);
        ctx.restore();
    }

    // Occasional ripple circles on the water
    for (let i = 0; i < 5; i++) {
        const phase = (t * 0.3 + i * 1.7) % 3;
        if (phase < 2) {
            const rx = ((i * 211 + 67) % GAME_WIDTH);
            const ry = GAME_HEIGHT * 0.55 + ((i * 127 + 19) % (GAME_HEIGHT * 0.35));
            const rippleR = 2 + phase * 6;
            const rippleAlpha = (1 - phase / 2) * 0.12;
            ctx.strokeStyle = `rgba(100, 180, 220, ${rippleAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.ellipse(rx, ry, rippleR, rippleR * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

function drawCryptMist() {
    const t = Date.now() / 1000;

    // Dark warm ambient overlay
    ctx.fillStyle = 'rgba(60, 30, 10, 0.08)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Drifting dark brown/orange mist
    for (let i = 0; i < state.mistParticles.length; i++) {
        let p = state.mistParticles[i];
        p.x += p.speed * 0.5;
        p.y += Math.sin(t * 0.6 + i * 0.6) * 0.5 + Math.cos(t * 0.25 + i * 1.3) * 0.2;
        if (p.x - p.size * 4 > GAME_WIDTH) {
            p.x = -p.size * 7;
            p.y = GAME_HEIGHT * 0.15 + Math.random() * (GAME_HEIGHT * 0.75);
        }
        const mistAlpha = 0.08 + p.opacity * 0.1;
        const r = p.size * 4.5;

        // Alternate between dark brown and burnt orange mist
        const isBrown = (i % 3 !== 0);
        const cr = isBrown ? 80 : 160;
        const cg = isBrown ? 45 : 80;
        const cb = isBrown ? 15 : 10;

        const mistGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        mistGrad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${mistAlpha})`);
        mistGrad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${mistAlpha * 0.4})`);
        mistGrad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = mistGrad;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);

        // Secondary blob
        const r2 = r * 0.5;
        const ox = p.x + p.size * 2;
        const oy = p.y - p.size * 0.3 + Math.sin(t * 0.5 + i) * 1.5;
        const mistGrad2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, r2);
        mistGrad2.addColorStop(0, `rgba(${cr + 20}, ${cg + 10}, ${cb}, ${mistAlpha * 0.5})`);
        mistGrad2.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = mistGrad2;
        ctx.fillRect(ox - r2, oy - r2, r2 * 2, r2 * 2);
    }
}

function drawBrightLight() {
    const t = Date.now() / 1000;

    // Warm ambient haze — old dusty hall
    ctx.fillStyle = 'rgba(180, 160, 100, 0.12)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Drifting mist — cool blue-grey wisps contrasting the warm yellow walls
    for (let i = 0; i < state.mistParticles.length; i++) {
        let p = state.mistParticles[i];
        p.x += p.speed * 0.6;
        p.y += Math.sin(t * 0.8 + i * 0.7) * 0.6 + Math.cos(t * 0.3 + i * 1.1) * 0.3;
        if (p.x - p.size * 4 > GAME_WIDTH) {
            p.x = -p.size * 8;
            p.y = GAME_HEIGHT * 0.2 + Math.random() * (GAME_HEIGHT * 0.7);
        }
        const mistAlpha = 0.1 + p.opacity * 0.12;
        const r = p.size * 5;
        // Cool blue-grey mist blob
        const mistGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        mistGrad.addColorStop(0, `rgba(140, 160, 190, ${mistAlpha})`);
        mistGrad.addColorStop(0.5, `rgba(130, 150, 180, ${mistAlpha * 0.4})`);
        mistGrad.addColorStop(1, 'rgba(120, 140, 170, 0)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
        // Secondary offset blob for volume
        const r2 = r * 0.6;
        const ox = p.x + p.size * 2;
        const oy = p.y - p.size * 0.5 + Math.sin(t * 0.6 + i) * 2;
        const mistGrad2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, r2);
        mistGrad2.addColorStop(0, `rgba(150, 165, 195, ${mistAlpha * 0.5})`);
        mistGrad2.addColorStop(1, 'rgba(130, 150, 180, 0)');
        ctx.fillStyle = mistGrad2;
        ctx.fillRect(ox - r2, oy - r2, r2 * 2, r2 * 2);
    }

    // Sunlight rays — warm golden shafts, very subtle
    ctx.save();

    // Ray 1 — main sunbeam
    const pulse1 = 0.7 + Math.sin(t * 0.8) * 0.3;
    const grad1 = ctx.createLinearGradient(GAME_WIDTH * 0.8, 0, GAME_WIDTH * 0.2, GAME_HEIGHT);
    grad1.addColorStop(0, `rgba(255, 220, 120, ${0.12 * pulse1})`);
    grad1.addColorStop(0.5, `rgba(240, 200, 100, ${0.06 * pulse1})`);
    grad1.addColorStop(1, 'rgba(220, 180, 80, 0)');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH * 0.7, 0);
    ctx.lineTo(GAME_WIDTH * 0.85, 0);
    ctx.lineTo(GAME_WIDTH * 0.35, GAME_HEIGHT);
    ctx.lineTo(GAME_WIDTH * 0.15, GAME_HEIGHT);
    ctx.fill();

    // Ray 2 — thinner secondary
    const pulse2 = 0.6 + Math.sin(t * 1.1 + 2) * 0.4;
    const grad2 = ctx.createLinearGradient(GAME_WIDTH * 0.5, 0, GAME_WIDTH * 0.1, GAME_HEIGHT * 0.8);
    grad2.addColorStop(0, `rgba(255, 210, 110, ${0.08 * pulse2})`);
    grad2.addColorStop(1, 'rgba(230, 190, 90, 0)');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH * 0.45, 0);
    ctx.lineTo(GAME_WIDTH * 0.55, 0);
    ctx.lineTo(GAME_WIDTH * 0.15, GAME_HEIGHT * 0.8);
    ctx.lineTo(GAME_WIDTH * 0.0, GAME_HEIGHT * 0.8);
    ctx.fill();

    ctx.restore();

    // Floating sunlight particles — glowing motes drifting lazily
    for (let i = 0; i < 25; i++) {
        // Each particle orbits slowly with unique phase
        const baseX = ((i * 137 + 41) % GAME_WIDTH);
        const baseY = ((i * 89 + 17) % GAME_HEIGHT);
        const dx = baseX + Math.sin(t * 0.3 + i * 2.1) * 15 + Math.cos(t * 0.2 + i * 1.3) * 8;
        const dy = baseY + Math.sin(t * 0.25 + i * 1.7) * 10 + Math.cos(t * 0.15 + i * 0.9) * 5;
        const sparkle = 0.3 + Math.sin(t * 1.5 + i * 0.9) * 0.2;
        const size = 1.5 + Math.sin(t * 0.8 + i * 1.4) * 0.8;

        // Warm golden glow
        const glowR = size + 4;
        const glow = ctx.createRadialGradient(dx, dy, 0, dx, dy, glowR);
        glow.addColorStop(0, `rgba(255, 230, 150, ${sparkle})`);
        glow.addColorStop(0.5, `rgba(255, 220, 120, ${sparkle * 0.3})`);
        glow.addColorStop(1, 'rgba(255, 210, 100, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(dx - glowR, dy - glowR, glowR * 2, glowR * 2);

        // Bright core
        ctx.fillStyle = `rgba(255, 250, 220, ${sparkle * 1.5})`;
        ctx.fillRect(dx - size * 0.4, dy - size * 0.4, size * 0.8, size * 0.8);
    }
}

function drawLighting() {
    if (state.level !== 3) return;

    const hasTorchEquipped = state.torchEquipped || state.hands.left === 'Torch' || state.hands.right === 'Torch';
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
