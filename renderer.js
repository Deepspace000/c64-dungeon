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
    } else if (state.level > 4) {
        mainColor = colors.purple;
        sideColor = colors.darkgrey;
    }

    if (isDoor || isLocked) {
        mainColor = isLocked ? colors.grey : colors.lightblue;
        sideColor = isLocked ? colors.darkgrey : colors.blue;
    }

    const baseColor = isSide ? sideColor : mainColor;
    drawPolygon(pts, baseColor, colors.black);

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

    if (state.level >= 2 && !isDoor && !isLocked) {
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

    if (state.level === 1) {
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
