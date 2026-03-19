// movement.js - Player movement, navigation, fog of war, auto-loot
// Depends on: state, DIRS, GAME_WIDTH, GAME_HEIGHT from globals
// Depends on: showMessage, updateUIState from ui.js
// Depends on: playSound, playTransitionMusic, playGameMusic from audio section
// Depends on: render from effects.js
// Depends on: advanceTurn, takeDamage from combat.js
// Depends on: generateMap from game.js

function getCell(x, y) {
    if (y >= 0 && y < state.map.length && x >= 0 && x < state.map[y].length) {
        return state.map[y][x];
    }
    return 1;
}

function checkAutoLoot() {
    const px = state.player.x;
    const py = state.player.y;

    for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        if (item.x === px && item.y === py) {
            if (item.type === 'fountain') {
                if (!item.used) {
                    item.used = true;
                    state.player.hp = state.player.maxHp;
                    playSound('powerup');
                    showMessage("HEALTH RESTORED! GAME SAVED", { timer: 120, color: colors.cyan });
                    updateUIState();
                    localStorage.setItem('c64_dungeon_save_v2', JSON.stringify(state));
                }
                continue;
            } else if (item.type === 'gold') {
                state.player.gold += item.amount;
                showMessage(`Found ${item.amount} Gold!`);
                checkGoldDebt();
            } else if (item.type === 'key' || item.type === 'Black Key') {
                state.inventory.push(item.name);
                showMessage(`Found ${item.name}!`);
                if (item.name === 'Gold Key') state.quest.goldKeyFound = true;
                if (item.name === 'Black Key') state.quest.blackKeyFound = true;
            } else if (item.type === 'Health Potion') {
                state.inventory.push(item.name);
                showMessage(`Found ${item.name}!`, { timer: 120 });
            } else if (item.type === 'chest') {
                const goldAmount = Math.floor(Math.random() * 20) + 10;
                state.player.gold += goldAmount;
                state.inventory.push('Health Potion');
                showMessage(`Opened Chest! Found ${goldAmount} Gold and a Health Potion!`);
                checkGoldDebt();
            } else {
                state.inventory.push(item.name);
                showMessage(`Found ${item.name}!`);
            }
            state.items.splice(i, 1);
            playSound('hit');
            updateUIState();
        }
    }
}

function revealFog() {
    if (!state.explored) return;
    const px = state.player.x;
    const py = state.player.y;
    for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
            if (state.explored[py + yy] && state.explored[py + yy][px + xx] !== undefined) {
                state.explored[py + yy][px + xx] = true;
            }
        }
    }
}

function handleMove(nx, ny) {
    const cell = getCell(nx, ny);
    const liveEnemyAhead = !!state.enemies.find(e => e.x === nx && e.y === ny && e.state !== 'dead' && !e.disguised);

    if (!liveEnemyAhead) {
        state.animations = state.animations.filter(a => a.type !== 'text');
    }

    if (cell === 0 || cell === 3) {
        if (!liveEnemyAhead) {
            state.player.x = nx;
            state.player.y = ny;
            playSound('step');
            revealFog();
            checkAutoLoot();
            advanceTurn();
            state.enemies.forEach(e => {
                if (e.type === 'Mimic Chest' && e.disguised && e.state !== 'dead') {
                    const dist = Math.abs(e.x - state.player.x) + Math.abs(e.y - state.player.y);
                    if (dist <= 2) {
                        e.disguised = false;
                        showMessage("IT'S A MIMIC!", { color: colors.red, flash: true });
                        playSound('hit');
                        const ambushDmg = Math.max(1, 4 + e.level * 2 - state.player.armorDefense);
                        setTimeout(() => { takeDamage(ambushDmg); render(); }, 400);
                    }
                }
            });
            render();
        }
    } else if (cell === 4) {
        const keyIdx = state.inventory.indexOf('Gold Key');
        if (keyIdx !== -1) {
            state.map[ny][nx] = 0;
            state.quest.goldRoomOpened = true;
            playSound('hit');
            showMessage("UNLOCKED DOOR");
            updateUIState();
            render();
        } else {
            showMessage("LOCKED. NEEDS A GOLD KEY.");
        }
    } else if (cell === 2) {
        const keyIdx = state.inventory.indexOf('Black Key');
        if (keyIdx !== -1) {
            state.inventory.splice(keyIdx, 1);
            state.appState = 'transition';
            state.transitionReady = false;
            state.level++;

            updateUIState();

            const transScreen = document.getElementById('transition-screen');
            const prompt = document.getElementById('transition-prompt');
            const transMsg = document.getElementById('transition-message');
            if (transScreen) transScreen.classList.remove('hidden');
            if (prompt) prompt.classList.add('hidden');

            // Custom transition messages after boss levels
            if (transMsg) {
                if (state.level === 6) {
                    transMsg.innerText = "You have completed level 5 and are making headway into the deepest depths. You are now 1/4 of the way into the depths. Congrats on defeating the boss and good luck- the next 5 levels will be more challenging, but the loot will be better! - Unknown Mage";
                } else {
                    transMsg.innerText = "You descend further into the depths...";
                }
            }

            playTransitionMusic();

            setTimeout(() => {
                if (state.appState === 'transition') {
                    if (prompt) prompt.classList.remove('hidden');
                    state.transitionReady = true;
                }
            }, 3000);
            render();
        } else {
            showMessage("EXIT LOCKED. FIND THE BLACK KEY.");
        }
    }
}

function nextLevel() {
    document.getElementById('transition-screen').classList.add('hidden');

    state.inventory = state.inventory.filter(item => item !== 'Gold Key' && item !== 'Black Key');

    let w = 27, h = 27;
    if (state.level === 5) {
        w = 51; h = 51; // Boss level - biggest map yet
    } else if (state.level === 2) {
        w = 31; h = 31;
    } else if (state.level > 2) {
        w = Math.min(51, 31 + (state.level - 2) * 6);
        h = Math.min(51, 31 + (state.level - 2) * 6);
    }

    state.map = generateMap(w, h);
    state.appState = 'playing';
    playGameMusic();
    render();
}

window.warpToLevel = function (targetLevel) {
    if (state.appState !== 'splash') return;

    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) splashScreen.style.display = 'none';

    if (typeof audioCtx === 'undefined' || !audioCtx) {
        initAudio();
    }

    state.level = targetLevel;
    state.player.hp = 20;
    state.player.maxHp = 20;
    state.player.gold = -1000;
    state.debtPaidOff = false;
    state.inventory = ['Rusty Sword', 'Health Potion'];
    state.hands.left = null;
    state.hands.right = null;

    let w = 27, h = 27;
    if (state.level === 5) {
        w = 51; h = 51;
    } else if (state.level === 2) {
        w = 31; h = 31;
    } else if (state.level > 2) {
        w = Math.min(51, 31 + (state.level - 2) * 6);
        h = Math.min(51, 31 + (state.level - 2) * 6);
    }

    state.map = generateMap(w, h);
    state.appState = 'playing';
    playGameMusic();
    updateUIState();
    render();
};

function moveForward(amount) {
    const d = DIRS[state.player.dir];
    const nx = state.player.x + d.dx * amount;
    const ny = state.player.y + d.dy * amount;
    handleMove(nx, ny);
}

function turn(amount) {
    state.player.dir = (state.player.dir + amount + 4) % 4;
}

function strafe(amount) {
    const sideDir = (state.player.dir + amount + 4) % 4;
    const d = DIRS[sideDir];
    const nx = state.player.x + d.dx;
    const ny = state.player.y + d.dy;
    handleMove(nx, ny);
}
