// entities.js - Enemy and item drop rendering
// Depends on: state, colors, GAME_WIDTH, GAME_HEIGHT, ctx from globals
// Depends on: project from renderer.js
// Depends on: all sprite image variables from game.js (assets section)

function renderEnemy(x, z, enemy) {
    if (z < 0) return;

    const pTop = project(x, 0.8, z);
    const pBot = project(x, 0, z);

    let h = pBot.y - pTop.y;
    let w = h * 0.5;

    const origH = h;
    if (enemy.type === 'Spider') {
        w = h * 1.37;
    } else if (enemy.type === 'Cave Slime') {
        w = origH * 1.5;
        h = origH * 0.55;
    } else if (enemy.type === 'Mimic Chest') {
        w = h * 1.0;
    } else if (enemy.type === 'Gargoyle') {
        w = h * 1.2;
    } else if (enemy.type === 'Ink Elemental') {
        w = h * 0.9;
    } else if (enemy.type === 'Obsidian Golem') {
        w = h * 0.7;
    } else if (enemy.type === 'Chasm Crawler') {
        w = h * 1.5;
    }

    // Bosses are rendered 2x bigger and wider
    if (enemy.isBoss) {
        h = h * 2;
        w = w * 2;
    }

    let yOff = 0;

    if (enemy.state === 'dead') {
        const t = (15 - enemy.deathTimer) / 15;
        h = h * (1 - t * 0.8);
        yOff = pBot.y - pTop.y - h;
    } else if (enemy.type === 'Cave Slime') {
        yOff = (origH - h) + Math.sin(Date.now() / 200 + enemy.x * 2) * 2;
    } else if (!enemy.disguised) {
        yOff = Math.sin(Date.now() / 300 + enemy.x + enemy.y) * 5;
    }

    const SPRITE_MAP = {
        'Skeleton':          { img: skeletonImg,        loaded: skeletonLoaded },
        'Cloaked Skeleton':  { img: skeletonImg,        loaded: skeletonLoaded },
        'Wraith':            { img: wraithImg,           loaded: wraithLoaded },
        'Spider':            { img: spiderImg,           loaded: spiderLoaded },
        'Ghoul':             { img: ghoulImg,            loaded: ghoulLoaded },
        'Cave Slime':        { img: caveSlimeImg,        loaded: caveSlimeLoaded },
        'Giant Rat':         { img: giantRatImg,         loaded: giantRatLoaded },
        'Crypt Bat':         { img: wraithImg,           loaded: wraithLoaded,    filter: 'brightness(0.4) sepia(1) hue-rotate(10deg)' },
        'Restless Zombie':   { img: restlessZombieImg,   loaded: restlessZombieLoaded },
        'Gargoyle':          { img: gargoyleImg,         loaded: gargoyleLoaded },
        'Blind Warden':      { img: blindWardenImg,      loaded: blindWardenLoaded },
        'Ink Elemental':     { img: inkElementalImg,     loaded: inkElementalLoaded },
        'Ghostly Scribe':    { img: ghostlyScribeImg,    loaded: ghostlyScribeLoaded },
        'Minotaur':          { img: minotaurImg,         loaded: minotaurLoaded },
        'Obsidian Golem':    { img: obsidianGolemImg,    loaded: obsidianGolemLoaded },
        'Chasm Crawler':     { img: chasmCrawlerImg,     loaded: chasmCrawlerLoaded },
        'Echo Wraith':       { img: echoWraithImg,       loaded: echoWraithLoaded },
        'Abyssal Knight':    { img: abyssalKnightImg,    loaded: abyssalKnightLoaded },
        'Throne Guard':      { img: throneGuardImg,      loaded: throneGuardLoaded },
        'Deep Dweller':      { img: deepDwellerImg,      loaded: deepDwellerLoaded },
        'Ruined Sentinel':   { img: skeletonImg,         loaded: skeletonLoaded,  filter: 'brightness(0.5) sepia(1) saturate(0.5)' },
        'Undead King':       { img: undeadKingImg,       loaded: undeadKingLoaded },
        'Bloodbat':          { img: wraithImg,           loaded: wraithLoaded,    filter: 'hue-rotate(330deg) brightness(0.6) saturate(4)' },
        'Bloodstone Golem':  { img: bloodstoneGolemImg,  loaded: bloodstoneGolemLoaded },
        'Toxic Ooze':        { img: caveSlimeImg,        loaded: caveSlimeLoaded, filter: 'hue-rotate(60deg) saturate(4) brightness(0.8)' },
        'The Slime Lord':    { img: slimeLordImg,        loaded: slimeLordLoaded },
        'Vault Guardian':    { img: vaultGuardianImg,    loaded: vaultGuardianLoaded },
        'Rusted Automaton':  { img: skeletonImg,         loaded: skeletonLoaded,  filter: 'sepia(1) hue-rotate(10deg) saturate(2) brightness(0.8)' },
        'Iron Giant':        { img: ironGiantImg,        loaded: ironGiantLoaded },
        'Shadow Priest':     { img: ghoulImg,            loaded: ghoulLoaded,     filter: 'brightness(0.3) hue-rotate(270deg) saturate(3)' },
        'Void Cultist':      { img: voidCultistImg,      loaded: voidCultistLoaded },
        'Skeletal Wyrm':     { img: skeletonImg,         loaded: skeletonLoaded,  filter: 'hue-rotate(120deg) saturate(3) brightness(0.7)' },
        'Bone Dragon':       { img: boneDragonImg,       loaded: boneDragonLoaded },
        'Whispering Terror': { img: whisperingTerrorImg, loaded: whisperingTerrorLoaded },
        'Null Entity':       { img: wraithImg,           loaded: wraithLoaded,    filter: 'invert(1) brightness(0.5)' },
        'The Depth Core':    { img: depthCoreImg,        loaded: depthCoreLoaded },
        'Skrronzor the Level Boss': { img: skeletonImg, loaded: skeletonLoaded, filter: 'brightness(1.2) sepia(0.5) hue-rotate(340deg) saturate(2)' },
        'Abyssius, Lord of the Abyss': { img: abyssiusImg, loaded: abyssiusLoaded },
    };

    let imgToDraw = skeletonImg;
    let isLoaded = skeletonLoaded;
    let spriteFilter = null;

    if (enemy.type === 'Mimic Chest') {
        if (enemy.disguised) {
            imgToDraw = chestImg; isLoaded = chestLoaded;
        } else {
            imgToDraw = mimicChestImg; isLoaded = mimicChestLoaded;
        }
    } else {
        const entry = SPRITE_MAP[enemy.type] || SPRITE_MAP['Skeleton'];
        imgToDraw = entry.img;
        isLoaded = entry.loaded;
        spriteFilter = entry.filter || null;
    }

    // Draw gold key peeking out under enemy that carries it
    if (enemy.state !== 'dead') {
        const hasKey = state.items.some(i => i.name === 'Gold Key' && i.x === enemy.x && i.y === enemy.y);
        if (hasKey && keyLoaded) {
            const keyW = w * 0.6;
            const keyH = keyW * 0.4;
            // Draw at enemy's feet, slightly offset
            ctx.drawImage(keyImg, pTop.x - keyW * 0.1, pBot.y - keyH * 1.2, keyW, keyH);
        }
    }

    if (isLoaded) {
        if (enemy.name === 'Cloaked Skeleton') {
            ctx.filter = 'brightness(0.6) sepia(1) hue-rotate(220deg) saturate(3)';
        } else if (spriteFilter) {
            ctx.filter = spriteFilter;
        }

        ctx.drawImage(imgToDraw, pTop.x - w / 2, pTop.y + yOff, w, h);
        ctx.filter = 'none';

        if (enemy.name === 'Cloaked Skeleton' && robeLoaded) {
            ctx.drawImage(robeImg, pTop.x - w / 2, pTop.y + yOff, w, h);
        }

        if (enemy.state === 'hit') {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(pTop.x - w / 2, pTop.y + yOff, w, h);
        }

        enemy.screenBounds = { x: pTop.x - w / 2, y: pTop.y + yOff, w: w, h: h, diff: enemy.level - state.player.attack };
    }

    if (enemy.state !== 'dead' && !enemy.disguised) {
        const text = `LVL ${enemy.level} ${(enemy.name || enemy.type).toUpperCase()}`;

        const dangerDiff = enemy.level - state.player.attack;
        let dangerColor = colors.white;
        if (dangerDiff === 0) dangerColor = colors.lightblue;
        else if (dangerDiff === 1) dangerColor = colors.yellow;
        else if (dangerDiff === 2) dangerColor = colors.red;
        else if (dangerDiff >= 3) dangerColor = colors.purple;

        ctx.font = '8px "Press Start 2P"';
        const txtWidth = ctx.measureText(text).width;

        const boxX = pTop.x - txtWidth / 2 - 4;
        const boxY = pTop.y + yOff - 20;
        const boxW = txtWidth + 8;
        const boxH = 14;

        ctx.fillStyle = colors.black;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = dangerColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = dangerColor;
        ctx.fillText(text, pTop.x, boxY + 10);

        const barW = boxW;
        const barH = 4;
        const barY = boxY + boxH + 2;

        ctx.fillStyle = colors.black;
        ctx.fillRect(boxX, barY, barW, barH);

        const hpPerc = Math.max(0, enemy.hp / enemy.maxHp);
        ctx.fillStyle = colors.red;
        ctx.fillRect(boxX + 1, barY + 1, (barW - 2) * hpPerc, barH - 2);

        enemy.screenBounds = { x: boxX, y: boxY, w: boxW, h: boxH, diff: dangerDiff };
    } else {
        enemy.screenBounds = null;
    }
}

function renderItemDrop(x, z, item) {
    if (z < 0) return;

    const pBot = project(x, 0, z);
    const pTop = project(x, 0.4, z);

    let h = pBot.y - pTop.y;
    let w = h;

    if (item.type === 'fountain') {
        if (fountainLoaded) {
            const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
            const drawW = w * 1.5 * pulse;
            const drawH = h * 1.95 * pulse;
            ctx.drawImage(fountainImg, pTop.x - drawW / 2, pBot.y - drawH, drawW, drawH);
        }
    } else if (item.type === 'weapon') {
        if (swordLoaded) {
            ctx.drawImage(swordImg, pTop.x - w * 0.5, pTop.y - h * 0.5, w, h * 1.5);
        }
    } else if (item.type === 'Health Potion' || item.type === 'Super Potion') {
        if (potionLoaded) {
            ctx.drawImage(potionImg, pTop.x - w / 2, pTop.y, w, h);
        }
    } else if (item.type === 'chest') {
        if (chestLoaded) {
            ctx.drawImage(chestImg, pTop.x - w * 0.75, pTop.y + h * 0.2, w * 1.5, h * 0.8);
        }
    } else if (item.type === 'key' || item.type === 'Black Key') {
        if (item.type === 'key' && keyLoaded) {
            ctx.drawImage(keyImg, pTop.x - w * 0.25, pTop.y + h * 0.4, w * 0.5, h * 0.6);
        } else if (item.type === 'Black Key' && blackKeyLoaded) {
            ctx.drawImage(blackKeyImg, pTop.x - w * 0.4, pTop.y + h * 0.2, w * 0.8, h * 0.8);
        }
    } else {
        ctx.fillStyle = (item.type === 'gold') ? colors.yellow : colors.orange;
        ctx.beginPath();
        ctx.arc(pTop.x, pBot.y - h / 4, h / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.white;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
