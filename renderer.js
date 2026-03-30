// renderer.js - 3D Rendering (Painter's algorithm: draw from back to front)
// Depends on: state, colors, DIRS, GAME_WIDTH, GAME_HEIGHT from game.js globals
// Depends on: drawBricks, drawTorch, drawPolygon from this file
// Depends on: renderEnemy, renderItemDrop from entities.js
// Depends on: getCell from movement.js

const MAX_DEPTH = 7;

const depthRects = [
    { l: 0, t: 0, w: 320, h: 240 },
    { l: 30, t: 20, w: 260, h: 200 },
    { l: 80, t: 60, w: 160, h: 120 },
    { l: 110, t: 85, w: 100, h: 70 },
    { l: 130, t: 105, w: 60, h: 30 },
    { l: 140, t: 115, w: 40, h: 10 }
];

function project(x, y, z) {
    const fovScale = 200;
    const nearZ = 0.5;
    const viewY = (0.5 - y) * 2;
    const pZ = z + nearZ;

    return {
        x: (GAME_WIDTH / 2) + (x * fovScale) / pZ,
        y: (GAME_HEIGHT / 2) + (viewY * fovScale) / pZ
    };
}

function drawPolygon(pts, fillStyle, strokeStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawTorch(pts, isSide) {
    const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
    const cy = (pts[0].y * 2 + pts[1].y * 2 + pts[2].y + pts[3].y) / 6;
    const height = Math.abs(pts[0].y - pts[3].y);
    const r = height * 0.1;
    if (r < 1) return;

    const t = Date.now() / 150 + cx * 0.01;
    const flicker = 0.85 + Math.sin(t) * 0.15;

    // Stick
    ctx.strokeStyle = colors.brown;
    ctx.lineWidth = Math.max(1, r * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.5);
    ctx.lineTo(cx, cy + r * 3);
    ctx.stroke();

    const drawFlame = (color, radius, yOffset, blur) => {
        ctx.fillStyle = color;
        if (blur > 0) {
            ctx.shadowColor = colors.yellow;
            ctx.shadowBlur = blur;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.beginPath();

        const points = 7;
        for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
            let currentR = radius;
            if (i % 2 !== 0) currentR *= 0.6;
            const upFactor = Math.max(0, -Math.sin(angle));
            currentR += upFactor * radius * (1 + Math.random() * 0.5);
            currentR *= (0.9 + Math.random() * 0.2);

            const px = cx + Math.cos(angle) * currentR;
            const py = cy + yOffset + Math.sin(angle) * currentR;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    drawFlame(colors.orange, r * flicker, 0, height * 0.4 * flicker);
    drawFlame(colors.white, r * 0.4 * flicker, r * 0.2, 0);
}

function drawBricks(pts, isSide, isDoor, isLocked, isSecret) {
    if (isDoor && !isLocked) {
        const exitColor = isSide ? colors.darkgrey : colors.purple;
        drawPolygon(pts, exitColor, colors.black);

        ctx.strokeStyle = colors.black;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
            const t = i / 4;
            const txTop = pts[0].x + (pts[1].x - pts[0].x) * t;
            const tyTop = pts[0].y + (pts[1].y - pts[0].y) * t;
            const txBot = pts[3].x + (pts[2].x - pts[3].x) * t;
            const tyBot = pts[3].y + (pts[2].y - pts[3].y) * t;
            ctx.moveTo(txTop, tyTop);
            ctx.lineTo(txBot, tyBot);
        }
        ctx.stroke();

        if (isSide) return;

        const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
        const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
        const height = Math.abs(pts[0].y - pts[3].y);

        ctx.fillStyle = colors.yellow;
        ctx.shadowColor = colors.yellow;
        ctx.shadowBlur = 10;
        const fontSize = Math.max(6, Math.floor(height * 0.12));
        ctx.font = `${fontSize}px "Press Start 2P"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("EXIT", cx, cy);
        ctx.shadowBlur = 0;
        return;
    }

    if (isLocked) {
        const doorColor = isSide ? colors.darkgrey : colors.brown;
        drawPolygon(pts, doorColor, colors.black);

        ctx.strokeStyle = colors.black;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
            const t = i / 4;
            const txTop = pts[0].x + (pts[1].x - pts[0].x) * t;
            const tyTop = pts[0].y + (pts[1].y - pts[0].y) * t;
            const txBot = pts[3].x + (pts[2].x - pts[3].x) * t;
            const tyBot = pts[3].y + (pts[2].y - pts[3].y) * t;
            ctx.moveTo(txTop, tyTop);
            ctx.lineTo(txBot, tyBot);
        }
        ctx.stroke();

        if (isSide) return;

        ctx.lineWidth = 4;
        ctx.strokeStyle = colors.grey;
        ctx.beginPath();
        let t1 = 0.2;
        ctx.moveTo(pts[0].x + (pts[3].x - pts[0].x) * t1, pts[0].y + (pts[3].y - pts[0].y) * t1);
        ctx.lineTo(pts[1].x + (pts[2].x - pts[1].x) * t1, pts[1].y + (pts[2].y - pts[1].y) * t1);
        let t2 = 0.8;
        ctx.moveTo(pts[0].x + (pts[3].x - pts[0].x) * t2, pts[0].y + (pts[3].y - pts[0].y) * t2);
        ctx.lineTo(pts[1].x + (pts[2].x - pts[1].x) * t2, pts[1].y + (pts[2].y - pts[1].y) * t2);
        ctx.stroke();

        const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
        const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
        const height = Math.abs(pts[0].y - pts[3].y);
        const r = height * 0.1;

        ctx.fillStyle = colors.yellow;
        ctx.shadowColor = colors.yellow;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        return;
    }

    let mainColor = colors.red;
    let sideColor = colors.brown;

    if (state.level === 2) {
        mainColor = colors.green;
        sideColor = colors.blue;
    } else if (state.level === 3) {
        mainColor = colors.darkgrey;
        sideColor = colors.black;
    } else if (state.level === 4) {
        mainColor = colors.blue;
        sideColor = colors.purple;
    } else if (state.level === 5) {
        mainColor = colors.orange;
        sideColor = colors.brown;
    } else if (state.level === 7) {
        mainColor = colors.brown;
        sideColor = colors.darkgrey;
    } else if (state.level === 10) {
        mainColor = '#1a0a0a';
        sideColor = '#0a0505';
    } else if (state.level === 9) {
        // Cave walls — varied reddish brown
        const hSeed9 = Math.abs(Math.floor(pts[0].x * 11.3 + pts[0].y * 7.7)) % 100;
        const r9 = 80 + (hSeed9 % 30);
        const g9 = 35 + ((hSeed9 * 3) % 15);
        const b9 = 15 + ((hSeed9 * 7) % 10);
        mainColor = `rgb(${r9}, ${g9}, ${b9})`;
        sideColor = `rgb(${Math.floor(r9 * 0.5)}, ${Math.floor(g9 * 0.5)}, ${Math.floor(b9 * 0.5)})`;
    } else if (state.level === 8) {
        // Vary hue per wall using polygon position as seed
        const hSeed = Math.abs(Math.floor(pts[0].x * 7.3 + pts[0].y * 13.1)) % 100;
        const rV = 20 + (hSeed % 12);
        const gV = 18 + ((hSeed * 3) % 10);
        const bV = 38 + ((hSeed * 7) % 18);
        mainColor = `rgb(${rV}, ${gV}, ${bV})`;
        const rS = 8 + (hSeed % 6);
        const gS = 6 + ((hSeed * 3) % 5);
        const bS = 18 + ((hSeed * 7) % 10);
        sideColor = `rgb(${rS}, ${gS}, ${bS})`;
    } else if (state.level === 6) {
        mainColor = colors.yellow;
        sideColor = colors.black;
    } else if (state.level > 4) {
        mainColor = colors.purple;
        sideColor = colors.darkgrey;
    }

    if (isDoor || isLocked) {
        mainColor = isLocked ? colors.grey : colors.lightblue;
        sideColor = isLocked ? colors.darkgrey : colors.blue;
    }

    const baseColor = isSide ? sideColor : mainColor;
    // Level 6: use dark brown outline instead of black to blend with yellow walls
    if (state.level === 9) {
        // Cave walls — jagged uneven edges
        drawPolygon(pts, baseColor, null);
        const cSeed = Math.floor(Math.abs(pts[0].x * 17.3 + pts[0].y * 41.7));
        function cPrng(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }
        ctx.strokeStyle = colors.black;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw each edge with jagged wobble
        for (let e = 0; e < pts.length; e++) {
            const p1 = pts[e];
            const p2 = pts[(e + 1) % pts.length];
            const edgeLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
            const steps = Math.max(3, Math.floor(edgeLen / 8));
            if (e === 0) ctx.moveTo(p1.x, p1.y);
            for (let s = 1; s <= steps; s++) {
                const t = s / steps;
                const mx = p1.x + (p2.x - p1.x) * t;
                const my = p1.y + (p2.y - p1.y) * t;
                // Perpendicular offset for jaggedness
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / len;
                const ny = dx / len;
                const jitter = (cPrng(cSeed + e * 97 + s * 31) - 0.5) * 3;
                if (s < steps) {
                    ctx.lineTo(mx + nx * jitter, my + ny * jitter);
                } else {
                    ctx.lineTo(p2.x, p2.y);
                }
            }
        }
        ctx.closePath();
        ctx.stroke();
    } else {
        const outlineColor = (state.level === 6) ? '#2a1f0a' : colors.black;
        drawPolygon(pts, baseColor, outlineColor);
    }

    // Level 6: aged walls — only on front-facing walls, invisible on side walls
    if (state.level === 6 && !isDoor && !isLocked && !isSide) {
        const w = Math.abs(pts[1].x - pts[0].x) || Math.abs(pts[2].x - pts[3].x);
        const h = Math.abs(pts[3].y - pts[0].y) || Math.abs(pts[2].y - pts[1].y);
        if (w > 8 && h > 8) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.closePath();
            ctx.clip();

            const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
            const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
            const seed = Math.floor(Math.abs(cx) * 31.7 + Math.abs(cy) * 97.3);
            function prng(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }

            // Subtle darkened bottom grime
            const bottomGrad = ctx.createLinearGradient(0, pts[0].y + h * 0.75, 0, pts[0].y + h);
            bottomGrad.addColorStop(0, 'rgba(40, 30, 10, 0)');
            bottomGrad.addColorStop(1, `rgba(40, 30, 10, ${0.06 + prng(seed + 88) * 0.03})`);
            ctx.fillStyle = bottomGrad;
            ctx.fillRect(pts[0].x, pts[0].y + h * 0.75, w, h * 0.25);

            // 1-2 very faint cracks — unique per wall, irregular and craggy
            const numCracks = 1 + (prng(seed + 10) > 0.6 ? 1 : 0);
            for (let c = 0; c < numCracks; c++) {
                const cs = seed * 31 + c * 197;
                let x = cx + (prng(cs + 1) - 0.5) * w * 0.5;
                let y = cy + (prng(cs + 2) - 0.5) * h * 0.4;
                let angle = prng(cs + 3) * Math.PI * 2;
                const segments = 5 + Math.floor(prng(cs + 4) * 6);
                const baseStep = Math.max(w, h) * 0.035;

                ctx.strokeStyle = `rgba(50, 35, 10, ${0.06 + prng(cs + 6) * 0.04})`;
                ctx.lineWidth = 0.3 + prng(cs + 7) * 0.2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                for (let s = 0; s < segments; s++) {
                    // Jagged irregular direction changes
                    angle += (prng(cs + s * 17 + 10) - 0.5) * 2.0;
                    const stepLen = baseStep * (0.3 + prng(cs + s * 23 + 20) * 1.4);
                    x += Math.cos(angle) * stepLen;
                    y += Math.sin(angle) * stepLen;
                    ctx.lineTo(x, y);

                    // Rare tiny branch
                    if (prng(cs + s * 43 + 30) > 0.8) {
                        const ba = angle + (prng(cs + s * 47) > 0.5 ? 1 : -1) * (0.8 + prng(cs + s * 51) * 0.8);
                        const bl = baseStep * (0.2 + prng(cs + s * 59) * 0.3);
                        ctx.lineTo(x + Math.cos(ba) * bl, y + Math.sin(ba) * bl);
                        ctx.moveTo(x, y);
                    }
                }
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    if (isSecret && !isDoor && !isLocked) {
        const row = 2;
        const subdivs = 5;
        const cols = isSide ? 3 : 5;
        let cLeft = 1 / cols;
        let cRight = 2 / cols;
        let rTop = row / subdivs;
        let rBot = (row + 1) / subdivs;

        if (row % 2 === 1) {
            cLeft += (0.5 / cols);
            cRight += (0.5 / cols);
        }

        const lxTop = pts[0].x + (pts[3].x - pts[0].x) * rTop;
        const lyTop = pts[0].y + (pts[3].y - pts[0].y) * rTop;
        const rxTop = pts[1].x + (pts[2].x - pts[1].x) * rTop;
        const ryTop = pts[1].y + (pts[2].y - pts[1].y) * rTop;
        const topLX = lxTop + (rxTop - lxTop) * cLeft;
        const topLY = lyTop + (ryTop - lyTop) * cLeft;
        const topRX = lxTop + (rxTop - lxTop) * cRight;
        const topRY = lyTop + (ryTop - lyTop) * cRight;

        const lxBot = pts[0].x + (pts[3].x - pts[0].x) * rBot;
        const lyBot = pts[0].y + (pts[3].y - pts[0].y) * rBot;
        const rxBot = pts[1].x + (pts[2].x - pts[1].x) * rBot;
        const ryBot = pts[1].y + (pts[2].y - pts[1].y) * rBot;
        const botLX = lxBot + (rxBot - lxBot) * cLeft;
        const botLY = lyBot + (ryBot - lyBot) * cLeft;
        const botRX = lxBot + (rxBot - lxBot) * cRight;
        const botRY = lyBot + (ryBot - lyBot) * cRight;

        let secretShade = '#a00000';
        if (state.level === 2) secretShade = '#00dd55';
        if (state.level === 3) secretShade = '#444444';
        if (state.level === 4) secretShade = '#3344aa';
        if (state.level > 4) secretShade = '#dd55dd';

        drawPolygon([{ x: topLX, y: topLY }, { x: topRX, y: topRY }, { x: botRX, y: botRY }, { x: botLX, y: botLY }], secretShade, secretShade);
    }

    // Level 6: larger bricks with faint mortar lines, no white streaks
    if (state.level === 10) {
        // Dark throne room — red curtains + gold stands
        if (!isDoor && !isLocked) {
            const polyW10 = Math.abs(pts[1].x - pts[0].x) || Math.abs(pts[2].x - pts[3].x);
            const polyH10 = Math.abs(pts[3].y - pts[0].y) || Math.abs(pts[2].y - pts[1].y);
            if (polyW10 > 8 && polyH10 > 8) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let si = 1; si < pts.length; si++) ctx.lineTo(pts[si].x, pts[si].y);
                ctx.closePath();
                ctx.clip();

                const cx10 = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
                const cy10 = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
                const seed10 = Math.floor(Math.abs(cx10 * 29.3 + cy10 * 67.1 + (isSide ? 6007 : 0)));
                function prng10(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }

                // Red curtain drapes — vertical folds across the wall
                const numFolds = 4 + Math.floor(prng10(seed10) * 3);
                for (let f = 0; f < numFolds; f++) {
                    const frac = (f + 0.5) / numFolds;
                    // Interpolate position on wall
                    const topX = pts[0].x + (pts[1].x - pts[0].x) * frac;
                    const topY = pts[0].y + (pts[1].y - pts[0].y) * frac;
                    const botX = pts[3].x + (pts[2].x - pts[3].x) * frac;
                    const botY = pts[3].y + (pts[2].y - pts[3].y) * frac;

                    const foldW = polyW10 / numFolds * 0.8;
                    // Alternating dark/light red for fold depth
                    const lightFold = f % 2 === 0;
                    const r = lightFold ? 120 : 70;
                    const g = lightFold ? 15 : 5;
                    const b = lightFold ? 15 : 5;
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
                    ctx.beginPath();
                    ctx.moveTo(topX - foldW / 2, topY);
                    ctx.lineTo(topX + foldW / 2, topY);
                    ctx.lineTo(botX + foldW / 2, botY);
                    ctx.lineTo(botX - foldW / 2, botY);
                    ctx.closePath();
                    ctx.fill();

                    // Fold highlight
                    if (lightFold) {
                        ctx.strokeStyle = 'rgba(180, 30, 30, 0.2)';
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(topX, topY + 2);
                        ctx.lineTo(botX, botY - 2);
                        ctx.stroke();
                    }
                }

                // Gold curtain rod at top
                ctx.fillStyle = '#aa8822';
                ctx.fillRect(pts[0].x, pts[0].y, polyW10, Math.max(2, polyH10 * 0.03));
                ctx.fillStyle = 'rgba(255, 220, 100, 0.3)';
                ctx.fillRect(pts[0].x, pts[0].y, polyW10, 1);

                // Gold stands/pillars at edges (front walls only)
                if (!isSide && polyW10 > 15) {
                    for (let side = 0; side < 2; side++) {
                        const sx = side === 0 ? pts[0].x + polyW10 * 0.05 : pts[0].x + polyW10 * 0.92;
                        const pillarW = polyW10 * 0.04;

                        // Gold pillar
                        ctx.fillStyle = '#886600';
                        ctx.fillRect(sx, pts[0].y + polyH10 * 0.05, pillarW, polyH10 * 0.9);

                        // Highlight
                        ctx.fillStyle = 'rgba(255, 220, 100, 0.2)';
                        ctx.fillRect(sx, pts[0].y + polyH10 * 0.05, pillarW * 0.3, polyH10 * 0.9);

                        // Gold cap top
                        ctx.fillStyle = '#aa8822';
                        const capY = pts[0].y + polyH10 * 0.03;
                        ctx.beginPath();
                        ctx.arc(sx + pillarW / 2, capY, pillarW * 0.8, 0, Math.PI * 2);
                        ctx.fill();

                        // Flame on top
                        const tNow = Date.now() / 1000;
                        const flicker = 0.7 + Math.sin(tNow * 3 + side * 5) * 0.3;
                        ctx.fillStyle = `rgba(255, 150, 30, ${0.5 * flicker})`;
                        ctx.beginPath();
                        ctx.ellipse(sx + pillarW / 2, capY - pillarW * 0.5, pillarW * 0.4, pillarW * 0.8 * flicker, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = `rgba(255, 255, 100, ${0.4 * flicker})`;
                        ctx.beginPath();
                        ctx.ellipse(sx + pillarW / 2, capY - pillarW * 0.3, pillarW * 0.15, pillarW * 0.4 * flicker, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // Dark vignette at bottom
                const botGrad = ctx.createLinearGradient(0, pts[0].y + polyH10 * 0.7, 0, pts[0].y + polyH10);
                botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
                ctx.fillStyle = botGrad;
                ctx.fillRect(pts[0].x, pts[0].y + polyH10 * 0.7, polyW10, polyH10 * 0.3);

                ctx.restore();
            }
        }
    } else if (state.level === 9) {
        // Rocky cave surface — no brick lines, just rough stone texture
        const polyW9 = Math.abs(pts[1].x - pts[0].x) || Math.abs(pts[2].x - pts[3].x);
        const polyH9 = Math.abs(pts[3].y - pts[0].y) || Math.abs(pts[2].y - pts[1].y);
        if (polyW9 > 4 && polyH9 > 4 && !isDoor && !isLocked) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let si = 1; si < pts.length; si++) ctx.lineTo(pts[si].x, pts[si].y);
            ctx.closePath();
            ctx.clip();

            const cx9 = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
            const cy9 = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
            const seed9 = Math.floor(Math.abs(cx9 * 19.3 + cy9 * 53.7 + (isSide ? 2003 : 0)));
            function prng9r(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }

            // Irregular rocky bumps — varying shades
            for (let r = 0; r < 6 + Math.floor(prng9r(seed9) * 4); r++) {
                const rs = seed9 + r * 43;
                const rx = cx9 + (prng9r(rs + 1) - 0.5) * polyW9 * 1.1;
                const ry = cy9 + (prng9r(rs + 2) - 0.5) * polyH9 * 1.1;
                const rr = Math.max(polyW9, polyH9) * (0.06 + prng9r(rs + 3) * 0.12);
                const light = prng9r(rs + 4) > 0.5;
                ctx.fillStyle = light
                    ? `rgba(130, 70, 30, ${0.06 + prng9r(rs + 5) * 0.06})`
                    : `rgba(25, 12, 5, ${0.08 + prng9r(rs + 6) * 0.06})`;
                ctx.beginPath();
                // Irregular polygon for rocky feel
                const sides = 5 + Math.floor(prng9r(rs + 7) * 3);
                for (let v = 0; v < sides; v++) {
                    const angle = (v / sides) * Math.PI * 2 + prng9r(rs + v * 11) * 0.5;
                    const dist = rr * (0.6 + prng9r(rs + v * 13) * 0.4);
                    const vx = rx + Math.cos(angle) * dist;
                    const vy = ry + Math.sin(angle) * dist * (0.5 + prng9r(rs + v * 17) * 0.5);
                    if (v === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
                }
                ctx.closePath();
                ctx.fill();
            }

            // Faint edge highlight at top
            ctx.strokeStyle = 'rgba(140, 80, 35, 0.08)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.stroke();

            ctx.restore();
        }
    } else if ([6, 8, 10].includes(state.level)) {
        const mortarColor = isSide ? 'rgba(30, 20, 5, 0.3)' : 'rgba(120, 100, 40, 0.25)';
        ctx.strokeStyle = mortarColor;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // 3 rows of large bricks instead of 5
        const rows = 3;
        for (let i = 1; i < rows; i++) {
            const t = i / rows;
            const lx = pts[0].x + (pts[3].x - pts[0].x) * t;
            const ly = pts[0].y + (pts[3].y - pts[0].y) * t;
            const rx = pts[1].x + (pts[2].x - pts[1].x) * t;
            const ry = pts[1].y + (pts[2].y - pts[1].y) * t;
            ctx.moveTo(lx, ly);
            ctx.lineTo(rx, ry);
        }

        // 2-3 vertical divisions per row, offset alternating
        const cols = isSide ? 2 : 3;
        for (let i = 0; i < rows; i++) {
            const rowTTop = i / rows;
            const rowTBot = (i + 1) / rows;
            for (let j = 1; j < cols; j++) {
                let tCol = j / cols;
                if (i % 2 === 1) tCol += (0.5 / cols);
                if (tCol >= 1) continue;

                const lxTop = pts[0].x + (pts[3].x - pts[0].x) * rowTTop;
                const lyTop = pts[0].y + (pts[3].y - pts[0].y) * rowTTop;
                const rxTop = pts[1].x + (pts[2].x - pts[1].x) * rowTTop;
                const ryTop = pts[1].y + (pts[2].y - pts[1].y) * rowTTop;
                const topX = lxTop + (rxTop - lxTop) * tCol;
                const topY = lyTop + (ryTop - lyTop) * tCol;

                const lxBot = pts[0].x + (pts[3].x - pts[0].x) * rowTBot;
                const lyBot = pts[0].y + (pts[3].y - pts[0].y) * rowTBot;
                const rxBot = pts[1].x + (pts[2].x - pts[1].x) * rowTBot;
                const ryBot = pts[1].y + (pts[2].y - pts[1].y) * rowTBot;
                const botX = lxBot + (rxBot - lxBot) * tCol;
                const botY = lyBot + (ryBot - lyBot) * tCol;

                ctx.moveTo(topX, topY);
                ctx.lineTo(botX, botY);
            }
        }
        ctx.stroke();
    } else if (state.level === 9) {
        // Jagged cave walls with rough texture
        if (!isDoor && !isLocked) {
            const polyW = Math.abs(pts[1].x - pts[0].x) || Math.abs(pts[2].x - pts[3].x);
            const polyH = Math.abs(pts[3].y - pts[0].y) || Math.abs(pts[2].y - pts[1].y);
            if (polyW > 6 && polyH > 6) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let si = 1; si < pts.length; si++) ctx.lineTo(pts[si].x, pts[si].y);
                ctx.closePath();
                ctx.clip();

                const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
                const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
                const seed = Math.floor(Math.abs(cx * 23.7 + cy * 71.3 + (isSide ? 3001 : 0)));
                function prng9(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }

                // Vertical gradient — lighter top, darker bottom
                const caveGrad = ctx.createLinearGradient(0, pts[0].y, 0, pts[0].y + polyH);
                caveGrad.addColorStop(0, 'rgba(120, 70, 30, 0.12)');
                caveGrad.addColorStop(0.5, 'rgba(60, 30, 10, 0)');
                caveGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
                ctx.fillStyle = caveGrad;
                ctx.fillRect(pts[0].x, pts[0].y, polyW, polyH);

                // Rough rock patches
                for (let p = 0; p < 5 + Math.floor(prng9(seed) * 3); p++) {
                    const ps = seed + p * 59;
                    const px = cx + (prng9(ps + 1) - 0.5) * polyW * 0.9;
                    const py = cy + (prng9(ps + 2) - 0.5) * polyH * 0.9;
                    const pr = Math.max(polyW, polyH) * (0.04 + prng9(ps + 3) * 0.08);
                    const dark = prng9(ps + 4) > 0.5;
                    ctx.fillStyle = dark ? `rgba(30, 15, 5, ${0.1 + prng9(ps + 5) * 0.08})` : `rgba(140, 80, 30, ${0.06 + prng9(ps + 6) * 0.04})`;
                    ctx.beginPath();
                    ctx.ellipse(px, py, pr, pr * (0.3 + prng9(ps + 7) * 0.7), prng9(ps + 8) * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Jagged cracks
                const numCracks = 1 + Math.floor(prng9(seed + 20) * 2);
                for (let c = 0; c < numCracks; c++) {
                    const cs = seed * 37 + c * 151;
                    let crX = cx + (prng9(cs + 1) - 0.5) * polyW * 0.5;
                    let crY = cy + (prng9(cs + 2) - 0.5) * polyH * 0.4;
                    let angle = prng9(cs + 3) * Math.PI * 2;
                    ctx.strokeStyle = `rgba(30, 15, 5, ${0.08 + prng9(cs + 4) * 0.06})`;
                    ctx.lineWidth = 0.4;
                    ctx.beginPath();
                    ctx.moveTo(crX, crY);
                    for (let s = 0; s < 4; s++) {
                        angle += (prng9(cs + s * 17) - 0.5) * 1.8;
                        crX += Math.cos(angle) * polyW * 0.06;
                        crY += Math.sin(angle) * polyH * 0.06;
                        ctx.lineTo(crX, crY);
                    }
                    ctx.stroke();
                }

                // Stalactites hanging from top
                if (!isSide) {
                    const numStal = 2 + Math.floor(prng9(seed + 40) * 3);
                    for (let s = 0; s < numStal; s++) {
                        const ss = seed + s * 83;
                        const frac = 0.1 + prng9(ss + 1) * 0.8;
                        const tipX = pts[0].x + (pts[1].x - pts[0].x) * frac;
                        const tipY = pts[0].y + polyH * (0.08 + prng9(ss + 2) * 0.18);
                        const baseW = polyW * (0.02 + prng9(ss + 3) * 0.03);
                        ctx.fillStyle = `rgba(60, 30, 12, ${0.3 + prng9(ss + 4) * 0.2})`;
                        ctx.beginPath();
                        ctx.moveTo(tipX - baseW, pts[0].y);
                        ctx.lineTo(tipX, tipY);
                        ctx.lineTo(tipX + baseW, pts[0].y);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Stalagmites rising from bottom
                    const numStalag = 1 + Math.floor(prng9(seed + 60) * 3);
                    for (let s = 0; s < numStalag; s++) {
                        const ss = seed + s * 107;
                        const frac = 0.15 + prng9(ss + 1) * 0.7;
                        const botY = pts[0].y + polyH;
                        const tipX = pts[0].x + (pts[1].x - pts[0].x) * frac;
                        const tipY = botY - polyH * (0.06 + prng9(ss + 2) * 0.12);
                        const baseW = polyW * (0.02 + prng9(ss + 3) * 0.02);
                        ctx.fillStyle = `rgba(50, 25, 10, ${0.25 + prng9(ss + 4) * 0.15})`;
                        ctx.beginPath();
                        ctx.moveTo(tipX - baseW, botY);
                        ctx.lineTo(tipX, tipY);
                        ctx.lineTo(tipX + baseW, botY);
                        ctx.closePath();
                        ctx.fill();
                    }
                }

                ctx.restore();
            }
        }
    } else if (state.level === 8) {
        // Gem quarry walls — carved stone with embedded gems
        if (!isDoor && !isLocked) {
            const polyW = Math.abs(pts[1].x - pts[0].x) || Math.abs(pts[2].x - pts[3].x);
            const polyH = Math.abs(pts[3].y - pts[0].y) || Math.abs(pts[2].y - pts[1].y);
            if (polyW > 6 && polyH > 6) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let si = 1; si < pts.length; si++) ctx.lineTo(pts[si].x, pts[si].y);
                ctx.closePath();
                ctx.clip();

                const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
                const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
                const seed = Math.floor(Math.abs(cx * 31.7 + cy * 97.3 + (isSide ? 4001 : 0)));
                function prng8(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }

                // Vertical gradient — lighter at top, darker at bottom for depth
                const vGrad = ctx.createLinearGradient(0, pts[0].y, 0, pts[0].y + polyH);
                vGrad.addColorStop(0, 'rgba(80, 70, 90, 0.15)');
                vGrad.addColorStop(0.3, 'rgba(50, 40, 60, 0.05)');
                vGrad.addColorStop(0.7, 'rgba(10, 5, 15, 0.05)');
                vGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
                ctx.fillStyle = vGrad;
                ctx.fillRect(pts[0].x, pts[0].y, polyW, polyH);

                // Edge darkening — left and right for 3D inset look
                const edgeW = Math.max(2, polyW * 0.06);
                const leftGrad = ctx.createLinearGradient(pts[0].x, 0, pts[0].x + edgeW, 0);
                leftGrad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
                leftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = leftGrad;
                ctx.fillRect(pts[0].x, pts[0].y, edgeW, polyH);

                const rightGrad = ctx.createLinearGradient(pts[0].x + polyW, 0, pts[0].x + polyW - edgeW, 0);
                rightGrad.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
                rightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = rightGrad;
                ctx.fillRect(pts[0].x + polyW - edgeW, pts[0].y, edgeW, polyH);

                // Top highlight edge
                ctx.fillStyle = 'rgba(100, 90, 120, 0.12)';
                ctx.fillRect(pts[0].x, pts[0].y, polyW, 2);

                // Stone block divisions — 3 rows with slight shade variation
                const blockRows = 3;
                for (let br = 0; br < blockRows; br++) {
                    const t0 = br / blockRows;
                    const t1 = (br + 1) / blockRows;
                    const shade = 25 + Math.floor(prng8(seed + br * 41) * 20);

                    // Slight shade variation per block row
                    ctx.fillStyle = `rgba(${shade}, ${shade - 5}, ${shade + 10}, 0.08)`;
                    ctx.fillRect(pts[0].x, pts[0].y + polyH * t0, polyW, polyH * (t1 - t0));

                    // Block divider line
                    if (br > 0) {
                        ctx.strokeStyle = 'rgba(15, 10, 20, 0.2)';
                        ctx.lineWidth = 1;
                        const ly = pts[0].y + (pts[3].y - pts[0].y) * t0;
                        const ry = pts[1].y + (pts[2].y - pts[1].y) * t0;
                        const lx = pts[0].x + (pts[3].x - pts[0].x) * t0;
                        const rx = pts[1].x + (pts[2].x - pts[1].x) * t0;
                        ctx.beginPath();
                        ctx.moveTo(lx, ly);
                        ctx.lineTo(rx, ry);
                        ctx.stroke();

                        // Light edge below the line
                        ctx.strokeStyle = 'rgba(80, 70, 100, 0.08)';
                        ctx.beginPath();
                        ctx.moveTo(lx, ly + 1);
                        ctx.lineTo(rx, ry + 1);
                        ctx.stroke();
                    }
                }

                // Rough stone texture patches
                for (let p = 0; p < 4 + Math.floor(prng8(seed) * 3); p++) {
                    const ps = seed + p * 67;
                    const px = cx + (prng8(ps + 1) - 0.5) * polyW * 0.9;
                    const py = cy + (prng8(ps + 2) - 0.5) * polyH * 0.9;
                    const pr = Math.max(polyW, polyH) * (0.05 + prng8(ps + 3) * 0.08);
                    ctx.fillStyle = `rgba(15, 10, 25, ${0.08 + prng8(ps + 4) * 0.06})`;
                    ctx.beginPath();
                    ctx.ellipse(px, py, pr, pr * (0.4 + prng8(ps + 5) * 0.6), prng8(ps + 6) * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Embedded gems — colorful faceted shapes that flash
                const tNow = Date.now() / 1000;
                const gemColors = ['#CC44CC', '#0088FF', '#00CC55', '#EEEE77', '#FF7777', '#AAFFEE', '#DD8855'];
                const numGems = 3 + Math.floor(prng8(seed + 50) * 3);
                for (let g = 0; g < numGems; g++) {
                    const gs = seed + g * 113;
                    const t0 = 0.1 + prng8(gs + 1) * 0.8;
                    const t1 = 0.1 + prng8(gs + 2) * 0.8;
                    const lp = { x: pts[0].x + (pts[3].x - pts[0].x) * t1, y: pts[0].y + (pts[3].y - pts[0].y) * t1 };
                    const rp = { x: pts[1].x + (pts[2].x - pts[1].x) * t1, y: pts[1].y + (pts[2].y - pts[1].y) * t1 };
                    const gx = lp.x + (rp.x - lp.x) * t0;
                    const gy = lp.y + (rp.y - lp.y) * t0;
                    const gr = Math.max(polyW, polyH) * (0.03 + prng8(gs + 3) * 0.05);

                    const color = gemColors[Math.floor(prng8(gs + 4) * gemColors.length)];
                    const flash = 0.6 + Math.sin(tNow * 2.5 + gs * 0.7) * 0.4;

                    // Gem glow aura (behind gem)
                    const glowR = gr * 2.5;
                    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, glowR);
                    glow.addColorStop(0, `rgba(180, 100, 255, ${0.08 * flash})`);
                    glow.addColorStop(1, 'rgba(100, 50, 180, 0)');
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(gx, gy, glowR, 0, Math.PI * 2);
                    ctx.fill();

                    // Gem facet — diamond shape
                    ctx.globalAlpha = flash;
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(gx, gy - gr);
                    ctx.lineTo(gx + gr * 0.7, gy);
                    ctx.lineTo(gx, gy + gr * 0.6);
                    ctx.lineTo(gx - gr * 0.7, gy);
                    ctx.closePath();
                    ctx.fill();

                    // Gem highlight facet
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * flash})`;
                    ctx.beginPath();
                    ctx.moveTo(gx, gy - gr);
                    ctx.lineTo(gx + gr * 0.3, gy - gr * 0.2);
                    ctx.lineTo(gx, gy - gr * 0.1);
                    ctx.lineTo(gx - gr * 0.3, gy - gr * 0.2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }

                ctx.restore();
            }
        }
    } else if (state.level === 7) {
        // Bookshelf walls — perspective-correct on front and side walls
        if (!isDoor && !isLocked) {
            const polyW = Math.abs(pts[1].x - pts[0].x) || Math.abs(pts[2].x - pts[3].x);
            const polyH = Math.abs(pts[3].y - pts[0].y) || Math.abs(pts[2].y - pts[1].y);
            if (polyW > 10 && polyH > 10) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let si = 1; si < pts.length; si++) ctx.lineTo(pts[si].x, pts[si].y);
                ctx.closePath();
                ctx.clip();

                const seed = Math.floor(Math.abs(pts[0].x * 31.7 + pts[0].y * 97.3 + (isSide ? 5003 : 0)));
                function prng7(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }

                const bookColors = ['#880000', '#0000AA', '#00CC55', '#664400', '#CC44CC', '#DD8855', '#EEEE77', '#777777', '#AAFFEE'];
                // pts: 0=top-left, 1=top-right, 2=bot-right, 3=bot-left
                // Left edge: pts[0] → pts[3] (top-left to bottom-left)
                // Right edge: pts[1] → pts[2] (top-right to bottom-right)
                const shelves = 4;

                for (let sh = 0; sh < shelves; sh++) {
                    const t0 = sh / shelves;
                    const t1 = (sh + 1) / shelves;

                    // Shelf bottom line — interpolate along left and right edges
                    const slLx = pts[0].x + (pts[3].x - pts[0].x) * t1;
                    const slLy = pts[0].y + (pts[3].y - pts[0].y) * t1;
                    const slRx = pts[1].x + (pts[2].x - pts[1].x) * t1;
                    const slRy = pts[1].y + (pts[2].y - pts[1].y) * t1;

                    // Shelf top line
                    const stLx = pts[0].x + (pts[3].x - pts[0].x) * t0;
                    const stLy = pts[0].y + (pts[3].y - pts[0].y) * t0;
                    const stRx = pts[1].x + (pts[2].x - pts[1].x) * t0;
                    const stRy = pts[1].y + (pts[2].y - pts[1].y) * t0;

                    // Draw shelf plank
                    ctx.strokeStyle = '#2a1500';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(slLx, slLy);
                    ctx.lineTo(slRx, slRy);
                    ctx.stroke();

                    // Draw books — fill between shelf top and bottom lines
                    // Scale book count to wall size — fewer on small/distant walls
                    const scaledBooks = Math.max(3, Math.min(10, Math.floor(polyW / 8)));
                    const numBooks = scaledBooks;
                    let bookIdx = seed + sh * 137;
                    for (let b = 0; b < numBooks; b++) {
                        const bFracL = b / numBooks;
                        const bFracR = (b + 0.85 + prng7(bookIdx) * 0.1) / numBooks;
                        if (bFracR > 1) continue;

                        // Interpolate book corners along the shelf edges
                        const btlX = stLx + (stRx - stLx) * bFracL;
                        const btlY = stLy + (stRy - stLy) * bFracL;
                        const btrX = stLx + (stRx - stLx) * bFracR;
                        const btrY = stLy + (stRy - stLy) * bFracR;
                        const bblX = slLx + (slRx - slLx) * bFracL;
                        const bblY = slLy + (slRy - slLy) * bFracL;
                        const bbrX = slLx + (slRx - slLx) * bFracR;
                        const bbrY = slLy + (slRy - slLy) * bFracR;

                        // Book height variation — some shorter
                        const heightFrac = 0.55 + prng7(bookIdx + 7) * 0.4;
                        const topOffsetL = (bblY - btlY) * (1 - heightFrac);
                        const topOffsetR = (bbrY - btrY) * (1 - heightFrac);

                        const color = bookColors[Math.floor(prng7(bookIdx + 13) * bookColors.length)];
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.moveTo(btlX, btlY + topOffsetL);
                        ctx.lineTo(btrX, btrY + topOffsetR);
                        ctx.lineTo(bbrX, bbrY - 1);
                        ctx.lineTo(bblX, bblY - 1);
                        ctx.closePath();
                        ctx.fill();

                        // Spine line
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
                        ctx.lineWidth = 0.3;
                        const midFrac = (bFracL + bFracR) / 2;
                        const smX = stLx + (stRx - stLx) * midFrac;
                        const smY = stLy + (stRy - stLy) * midFrac;
                        const bmX = slLx + (slRx - slLx) * midFrac;
                        const bmY = slLy + (slRy - slLy) * midFrac;
                        ctx.beginPath();
                        ctx.moveTo(smX, smY + topOffsetL + 1);
                        ctx.lineTo(bmX, bmY - 2);
                        ctx.stroke();

                        bookIdx += 31;
                    }
                }

                ctx.restore();
            }
        }
    } else {
        ctx.strokeStyle = colors.black;
        ctx.lineWidth = 1;
        ctx.beginPath();

        const subdivs = 5;
        for (let i = 1; i < subdivs; i++) {
            const t = i / subdivs;
            const lx = pts[0].x + (pts[3].x - pts[0].x) * t;
            const ly = pts[0].y + (pts[3].y - pts[0].y) * t;
            const rx = pts[1].x + (pts[2].x - pts[1].x) * t;
            const ry = pts[1].y + (pts[2].y - pts[1].y) * t;
            ctx.moveTo(lx, ly);
            ctx.lineTo(rx, ry);
        }

        for (let i = 0; i < subdivs; i++) {
            const rowTTop = i / subdivs;
            const rowTBot = (i + 1) / subdivs;
            const cols = isSide ? 3 : 5;

            for (let j = 1; j < cols; j++) {
                let tCol = j / cols;
                if (i % 2 === 1) {
                    tCol += (0.5 / cols);
                    if (tCol >= 1) continue;
                }

                const lxTop = pts[0].x + (pts[3].x - pts[0].x) * rowTTop;
                const lyTop = pts[0].y + (pts[3].y - pts[0].y) * rowTTop;
                const rxTop = pts[1].x + (pts[2].x - pts[1].x) * rowTTop;
                const ryTop = pts[1].y + (pts[2].y - pts[1].y) * rowTTop;
                const topX = lxTop + (rxTop - lxTop) * tCol;
                const topY = lyTop + (ryTop - lyTop) * tCol;

                const lxBot = pts[0].x + (pts[3].x - pts[0].x) * rowTBot;
                const lyBot = pts[0].y + (pts[3].y - pts[0].y) * rowTBot;
                const rxBot = pts[1].x + (pts[2].x - pts[1].x) * rowTBot;
                const ryBot = pts[1].y + (pts[2].y - pts[1].y) * rowTBot;
                const botX = lxBot + (rxBot - lxBot) * tCol;
                const botY = lyBot + (ryBot - lyBot) * tCol;

                ctx.moveTo(topX, topY);
                ctx.lineTo(botX, botY);
            }
        }
        ctx.stroke();
    }

    if (state.level >= 2 && ![6, 7, 8, 9, 10].includes(state.level) && !isDoor && !isLocked) {
        const seed = (pts[0].x + pts[0].y + pts[3].x) % 100;
        if (seed > 30) {
            ctx.strokeStyle = colors.white;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let v = 1; v <= 3; v++) {
                const vt = (v * 0.25) + (seed % 10) * 0.01;
                const topX = pts[0].x + (pts[1].x - pts[0].x) * vt;
                const topY = pts[0].y + (pts[1].y - pts[0].y) * vt;
                const dropScale = 0.3 + ((seed * v) % 40) * 0.01;
                const botX = pts[0].x + (pts[3].x - pts[0].x) * vt;
                const botY = pts[0].y + (pts[3].y - pts[0].y) * vt;
                const endX = topX + (botX - topX) * dropScale;
                const endY = topY + (botY - topY) * dropScale;
                ctx.moveTo(topX, topY);
                ctx.lineTo(topX + (endX - topX) * 0.5 + 2, topY + (endY - topY) * 0.5);
                ctx.lineTo(endX, endY);
            }
            ctx.stroke();
        }
    }
}

function renderFloor(x, z, mapX, mapY) {
    if (z < 0) return;

    const xl = x - 0.5;
    const xr = x + 0.5;
    const zf = z;
    const zb = z + 1;

    const p1 = project(xl, 0, zf);
    const p2 = project(xr, 0, zf);
    const p3 = project(xr, 0, zb);
    const p4 = project(xl, 0, zb);

    if (state.level === 10) {
        // Dark marble throne room floor
        const t = Date.now() / 1000;
        drawPolygon([p1, p2, p3, p4], '#0a0505', null);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p4.y - p1.y);
        if (w > 3 && h > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.clip();

            const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
            const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
            const seed = Math.abs((mapX * 37) ^ (mapY * 13));

            // Dark red marble veins
            ctx.strokeStyle = `rgba(80, 10, 10, ${0.15 + (seed % 10) * 0.01})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.3, cy);
            ctx.quadraticCurveTo(cx, cy - h * 0.2, cx + w * 0.3, cy + h * 0.1);
            ctx.stroke();

            // Faint gold inlay cross pattern
            ctx.strokeStyle = 'rgba(150, 120, 40, 0.06)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p3.x, p3.y);
            ctx.moveTo(p2.x, p2.y); ctx.lineTo(p4.x, p4.y);
            ctx.stroke();

            // Tile border
            ctx.strokeStyle = 'rgba(40, 10, 10, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    } else if (state.level === 8) {
        // Gemstone quarry floor — dark stone with sparkling gems
        const t = Date.now() / 1000;
        drawPolygon([p1, p2, p3, p4], '#0a0a10', null);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p4.y - p1.y);
        if (w > 3 && h > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.clip();

            const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
            const cy = (p1.y + p2.y + p3.y + p4.y) / 4;
            const seed = Math.abs((mapX * 37) ^ (mapY * 13));
            function prng8f(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }

            // Dark rough stone base patches
            for (let s = 0; s < 3; s++) {
                const ss = seed + s * 53;
                const sx = cx + (prng8f(ss + 1) - 0.5) * w;
                const sy = cy + (prng8f(ss + 2) - 0.5) * h;
                const shade = 12 + Math.floor(prng8f(ss + 3) * 15);
                ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 3})`;
                ctx.beginPath();
                ctx.ellipse(sx, sy, w * 0.2, h * 0.15, prng8f(ss + 4) * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }

            // Small embedded floor gems — sparkle with time
            const gemColors = ['#CC44CC', '#0088FF', '#00CC55', '#EEEE77', '#FF7777', '#AAFFEE'];
            const numGems = 2 + Math.floor(prng8f(seed + 10) * 3);
            for (let g = 0; g < numGems; g++) {
                const gs = seed + g * 97;
                const gx = cx + (prng8f(gs + 1) - 0.5) * w * 0.8;
                const gy = cy + (prng8f(gs + 2) - 0.5) * h * 0.8;
                const gr = Math.max(w, h) * (0.04 + prng8f(gs + 3) * 0.04);
                const sparkle = 0.5 + Math.sin(t * 2 + gs) * 0.3;

                const color = gemColors[Math.floor(prng8f(gs + 4) * gemColors.length)];
                ctx.globalAlpha = sparkle;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(gx, gy - gr);
                ctx.lineTo(gx + gr * 0.6, gy);
                ctx.lineTo(gx, gy + gr * 0.5);
                ctx.lineTo(gx - gr * 0.6, gy);
                ctx.closePath();
                ctx.fill();

                // Highlight
                ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.4})`;
                ctx.beginPath();
                ctx.arc(gx - gr * 0.15, gy - gr * 0.3, gr * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Tile edge
            ctx.strokeStyle = 'rgba(30, 20, 40, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    } else if (state.level === 7) {
        // Animated water floor — dark blue-green with active shimmering
        const t = Date.now() / 1000;
        drawPolygon([p1, p2, p3, p4], '#081828', null);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p4.y - p1.y);
        if (w > 2 && h > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.clip();

            const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
            const cy = (p1.y + p2.y + p3.y + p4.y) / 4;

            // Multiple overlapping waves for lively water
            const wave1 = Math.sin(t * 2.0 + mapX * 2.3 + mapY * 1.7) * 0.5 + 0.5;
            const wave2 = Math.sin(t * 1.3 + mapX * 1.1 + mapY * 3.1) * 0.5 + 0.5;
            const wave3 = Math.sin(t * 3.0 + mapX * 0.7 + mapY * 2.3) * 0.5 + 0.5;

            // Animated base color pulse
            const waterAlpha = 0.12 + wave1 * 0.1 + wave3 * 0.05;
            ctx.fillStyle = `rgba(20, 70, 110, ${waterAlpha})`;
            ctx.fillRect(p1.x, p1.y, w, h);

            // Moving highlight — travels across the tile
            const hlX = cx + Math.sin(t * 1.0 + mapX * 1.5) * w * 0.35;
            const hlY = cy + Math.cos(t * 0.7 + mapY * 1.2) * h * 0.3;
            const hlR = Math.max(w, h) * 0.35;
            const hlAlpha = 0.08 + wave2 * 0.08;
            const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
            hlGrad.addColorStop(0, `rgba(80, 170, 220, ${hlAlpha})`);
            hlGrad.addColorStop(0.6, `rgba(50, 130, 190, ${hlAlpha * 0.3})`);
            hlGrad.addColorStop(1, 'rgba(30, 100, 160, 0)');
            ctx.fillStyle = hlGrad;
            ctx.fillRect(hlX - hlR, hlY - hlR, hlR * 2, hlR * 2);

            // Second moving highlight — only on larger nearby tiles
            if (w > 15) {
                const hl2X = cx + Math.cos(t * 0.8 + mapY * 2) * w * 0.25;
                const hl2Y = cy + Math.sin(t * 1.2 + mapX * 1.8) * h * 0.2;
                const hl2R = hlR * 0.6;
                const hl2Grad = ctx.createRadialGradient(hl2X, hl2Y, 0, hl2X, hl2Y, hl2R);
                hl2Grad.addColorStop(0, `rgba(100, 190, 230, ${hlAlpha * 0.6})`);
                hl2Grad.addColorStop(1, 'rgba(60, 140, 200, 0)');
                ctx.fillStyle = hl2Grad;
                ctx.fillRect(hl2X - hl2R, hl2Y - hl2R, hl2R * 2, hl2R * 2);
            }

            // Wavy ripple lines — scale count to tile size
            ctx.lineWidth = 0.5;
            const numRipples = w > 20 ? 3 : w > 10 ? 2 : 1;
            for (let r = 0; r < numRipples; r++) {
                const ripAlpha = 0.06 + wave1 * 0.04 + (r % 2) * 0.02;
                ctx.strokeStyle = `rgba(80, 170, 210, ${ripAlpha})`;
                const ry = cy + (r - 1.5) * h * 0.25 + Math.sin(t * 1.5 + r * 2.5 + mapX) * 2;
                ctx.beginPath();
                ctx.moveTo(p1.x, ry);
                const cp1x = p1.x + w * 0.25;
                const cp1y = ry + Math.sin(t * 2.0 + r * 1.7) * 3;
                const cp2x = p1.x + w * 0.75;
                const cp2y = ry + Math.sin(t * 1.8 + r * 2.1 + 1) * 3;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x + w, ry + Math.sin(t * 1.3 + r) * 1.5);
                ctx.stroke();
            }

            // Tile edge
            ctx.strokeStyle = 'rgba(10, 30, 50, 0.25)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    } else if (state.level === 6) {
        // Cobblestone floor — dark base with lighter stones
        drawPolygon([p1, p2, p3, p4], '#1a1510', null);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p4.y - p1.y);
        if (w > 3 && h > 1) {
            const seed = Math.abs((mapX * 37) ^ (mapY * 13));
            function prng6(s) { return Math.abs(((s * 1103515245 + 12345) | 0) % 10000) / 10000; }

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.clip();

            const cx = (p1.x + p2.x + p3.x + p4.x) / 4;
            const cy = (p1.y + p2.y + p3.y + p4.y) / 4;

            // Pack cobblestones densely to cover the tile
            const numStones = 6 + Math.floor(prng6(seed) * 4);
            for (let s = 0; s < numStones; s++) {
                const ss = seed + s * 71;
                const sx = cx + (prng6(ss + 1) - 0.5) * w * 1.1;
                const sy = cy + (prng6(ss + 2) - 0.5) * h * 1.1;
                const srx = w * (0.1 + prng6(ss + 3) * 0.15);
                const sry = srx * (0.4 + prng6(ss + 5) * 0.4);
                const shade = 30 + Math.floor(prng6(ss + 4) * 30);

                // Stone fill
                ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade - 5})`;
                ctx.beginPath();
                ctx.ellipse(sx, sy, srx, sry, prng6(ss + 6) * Math.PI, 0, Math.PI * 2);
                ctx.fill();

                // Dark mortar gap
                ctx.strokeStyle = '#0d0a05';
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // Subtle highlight on top edge
                ctx.strokeStyle = `rgba(80, 70, 50, 0.15)`;
                ctx.lineWidth = 0.4;
                ctx.beginPath();
                ctx.ellipse(sx, sy - sry * 0.15, srx * 0.85, sry * 0.7, prng6(ss + 6) * Math.PI, Math.PI, Math.PI * 2);
                ctx.stroke();
            }

            // Grid outline for tile boundary
            ctx.strokeStyle = '#0d0a05';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    } else if (state.level === 1) {
        drawPolygon([p1, p2, p3, p4], 'transparent', colors.black);
    } else if (state.level >= 2) {
        const seed = Math.abs((mapX * 37) ^ (mapY * 13)) % 100;
        if (seed > 40) {
            const tx = xl + 0.2 + (seed % 60) * 0.01;
            const tz = zf + 0.2 + (seed % 50) * 0.01;
            const gBase = project(tx, 0, tz);
            const gTop1 = project(tx - 0.1, 0.1, tz);
            const gTop2 = project(tx + 0.1, 0.15, tz);
            const gTop3 = project(tx, 0.2, tz);

            ctx.strokeStyle = colors.green;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(gBase.x, gBase.y);
            ctx.lineTo(gTop1.x, gTop1.y);
            ctx.moveTo(gBase.x, gBase.y);
            ctx.lineTo(gTop2.x, gTop2.y);
            ctx.moveTo(gBase.x, gBase.y);
            ctx.lineTo(gTop3.x, gTop3.y);
            ctx.stroke();
        }
    }
}

function renderSpikes(x, z) {
    if (z < 0) return;

    const pBot = project(x, 0, z);
    const pTop = project(x, 0.8, z);

    let h = pBot.y - pTop.y;
    let w = h;

    const isUp = (state.turnTick % 2 === 0);

    if (isUp && spikeUpLoaded) {
        ctx.drawImage(spikeUpImg, pBot.x - w / 2, pBot.y - h, w, h);
    } else if (!isUp && spikeDownLoaded) {
        ctx.drawImage(spikeDownImg, pBot.x - w / 2, pBot.y - h * 0.5, w, h * 0.5);
    }
}

function renderBlock(x, z, mapX, mapY, cellType) {
    const isDoor = cellType === 2;
    const isLocked = cellType === 4;
    const isSecret = cellType === 5;
    const hasTorch = state.torches && state.torches.find(t => t.x === mapX && t.y === mapY);

    const xl = x - 0.5;
    const xr = x + 0.5;
    const zf = z;
    const zb = z + 1;

    if (zb < 0) return;

    if (zf >= 0) {
        const p1 = project(xl, 1, zf);
        const p2 = project(xr, 1, zf);
        const p3 = project(xr, 0, zf);
        const p4 = project(xl, 0, zf);

        drawBricks([p1, p2, p3, p4], false, isDoor, isLocked, isSecret);
        if (hasTorch && cellType === 1) drawTorch([p1, p2, p3, p4], false);

        if (isSecret && !state.revealedSecrets[`${mapX},${mapY}`]) {
            state.visibleSecretWalls.push({ poly: [p1, p2, p3, p4], mapX, mapY });
        }
    }

    if (x < 0) {
        const p1 = project(xr, 1, zf);
        const p2 = project(xr, 1, zb);
        const p3 = project(xr, 0, zb);
        const p4 = project(xr, 0, zf);

        drawBricks([p1, p2, p3, p4], true, isDoor, isLocked, isSecret);
        if (hasTorch && cellType === 1) drawTorch([p1, p2, p3, p4], true);

        if (isSecret && !state.revealedSecrets[`${mapX},${mapY}`]) {
            state.visibleSecretWalls.push({ poly: [p1, p2, p3, p4], mapX, mapY });
        }
    }

    if (x > 0) {
        const p1 = project(xl, 1, zb);
        const p2 = project(xl, 1, zf);
        const p3 = project(xl, 0, zf);
        const p4 = project(xl, 0, zb);

        drawBricks([p1, p2, p3, p4], true, isDoor, isLocked, isSecret);
        if (hasTorch && cellType === 1) drawTorch([p1, p2, p3, p4], true);

        if (isSecret && !state.revealedSecrets[`${mapX},${mapY}`]) {
            state.visibleSecretWalls.push({ poly: [p1, p2, p3, p4], mapX, mapY });
        }
    }
}

function drawView() {
    state.visibleSecretWalls = [];

    const { x: px, y: py, dir } = state.player;
    const forward = DIRS[dir];
    const right = DIRS[(dir + 1) % 4];

    for (let z = MAX_DEPTH; z >= 0; z--) {
        const xOrder = [-6, 6, -5, 5, -4, 4, -3, 3, -2, 2, -1, 1, 0];
        for (let x of xOrder) {
            const mapX = px + forward.dx * z + right.dx * x;
            const mapY = py + forward.dy * z + right.dy * x;

            const cell = getCell(mapX, mapY);

            if (cell === 0 || cell === 3) {
                renderFloor(x, z, mapX, mapY);
            }

            if (cell === 1 || cell === 2 || cell === 4 || cell === 5) {
                renderBlock(x, z, mapX, mapY, cell);
            } else if (cell === 3) {
                renderSpikes(x, z);
            }
        }

        for (let item of state.items) {
            const dx = item.x - px;
            const dy = item.y - py;
            const itemZ = forward.dx * dx + forward.dy * dy;
            const itemX = right.dx * dx + right.dy * dy;
            if (itemZ === z && Math.abs(itemX) <= 6) {
                renderItemDrop(itemX, itemZ, item);
            }
        }

        for (let e of state.enemies) {
            const dx = e.x - px;
            const dy = e.y - py;
            const ez = forward.dx * dx + forward.dy * dy;
            const ex = right.dx * dx + right.dy * dy;
            if (ez === z && Math.abs(ex) <= 6) {
                renderEnemy(ex, ez, e);
            }
        }
    }
}
