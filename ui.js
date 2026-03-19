// ui.js - UI state updates, inventory management, messages, tooltips, canvas interaction
// Depends on: state, colors, LEVEL_ARMOR, LEVEL_WEAPONS from globals
// Depends on: calcPlayerAttack, calcPlayerDefense from combat.js
// Depends on: render from effects.js
// Depends on: getLevelName from game.js
// Depends on: attackFront from combat.js
// Depends on: playSound from audio section

function showMessage(msg, options = {}) {
    state.animations.push({
        type: 'text',
        text: msg,
        timer: 180,
        color: options.color || colors.yellow,
        flash: options.flash || false
    });
}

// Check if gold debt has been paid off
function checkGoldDebt() {
    if (state.player.gold >= 0 && !state.debtPaidOff) {
        state.debtPaidOff = true;
        showMessage("YOUR DEBT IS PAID! SOMETHING STIRS IN THE DEPTHS...", { color: colors.yellow, flash: true });
        // TODO: Mirko will decide what event occurs here
    }
}

function updateUIState() {
    calcPlayerAttack();
    calcPlayerDefense();

    const titleDisplay = document.getElementById('level-title-display');
    if (titleDisplay) {
        titleDisplay.innerText = `LEVEL ${state.level}: ${getLevelName(state.level)} `;
    }

    if (state.player.hp > state.player.maxHp * 0.15) {
        state.lowHealthWarned = false;
    }

    const hpText = document.getElementById('hp-text');
    const hpFill = document.getElementById('health-bar-fill');
    if (hpText) hpText.innerText = `${state.player.hp}/${state.player.maxHp}`;
    if (hpFill) hpFill.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;

    const goldText = document.getElementById('gold-text');
    if (goldText) {
        if (state.player.gold < 0) {
            goldText.innerText = `-${Math.abs(state.player.gold)}`;
            goldText.style.color = 'var(--c-red)';
        } else {
            goldText.innerText = state.player.gold;
            goldText.style.color = '';
        }
    }

    const qText = document.getElementById('quest-text');
    if (qText) {
        let details = `
            <span style='color:var(--c-green)'>1. Kill 'em all-</span> <span style='color:var(--c-white)'>(Slay all monsters. Total: ${state.quest.slainEnemies}/${state.quest.totalEnemies})</span><br>
            <span style='color:var(--c-green)'>2. Find the Gold Key-</span> <span style='color:var(--c-white)'>(Opens the mystery room).</span><br>
            <span style='color:var(--c-green)'>3. Find the black key-</span> <span style='color:var(--c-white)'>(Unlocks the exit).</span><br>
            <span style='color:var(--c-green)'>4. Find all secret walls-</span> <span style='color:var(--c-white)'>(Found: ${state.quest.secretsFound}/${state.quest.totalSecrets}).</span><br>
            <span style='color:var(--c-green)'>5. Find ${getLevelName(state.level + 1)}.</span><br>
            <span style='color:var(--c-green)'>6. Pay off 1000 gold debt-</span> <span style='color:var(--c-white)'>(${state.player.gold >= 0 ? 'PAID!' : Math.abs(state.player.gold) + ' remaining'}).</span>
        `;
        qText.innerHTML = details;
    }
    const questProg = document.getElementById('quest-progress');
    if (questProg) {
        questProg.innerHTML = "";
    }

    const autoPotionCb = document.getElementById('auto-potion-cb');
    if (autoPotionCb) autoPotionCb.checked = state.settings.autoPotion;

    const invList = document.getElementById('inventory-list');
    if (invList) {
        let itemCounts = {};
        let uniqueItems = [];
        state.inventory.forEach(item => {
            if (!itemCounts[item]) {
                itemCounts[item] = 0;
                uniqueItems.push(item);
            }
            itemCounts[item]++;
        });

        invList.innerHTML = uniqueItems.map(item => {
            let displayItem = itemCounts[item] > 1 ? `${item} (${itemCounts[item]})` : item;
            let idx = state.inventory.indexOf(item);
            return `<li><a href="#" onclick="equipItem(${idx}); return false;" style="color:var(--c-white);text-decoration:none;">${displayItem}</a></li>`;
        }).join('');
    }

    const leftEl = document.querySelector('#left-hand .item');
    const rightEl = document.querySelector('#right-hand .item');
    const armourEl = document.querySelector('#armour-slot .item');
    if (leftEl) leftEl.innerText = state.hands.left || 'EMPTY';
    if (rightEl) rightEl.innerText = state.hands.right || 'EMPTY';
    if (armourEl) armourEl.innerText = state.armorSlot || 'EMPTY';

    const leftSlot = document.getElementById('left-hand');
    const rightSlot = document.getElementById('right-hand');
    const armourSlot = document.getElementById('armour-slot');
    if (leftSlot) leftSlot.onclick = () => { if (state.hands.left) unequipSlot('left'); };
    if (rightSlot) rightSlot.onclick = () => { if (state.hands.right) unequipSlot('right'); };
    if (armourSlot) armourSlot.onclick = () => { if (state.armorSlot) unequipSlot('armour'); };
}

window.unequipSlot = function(slot) {
    if (slot === 'left' && state.hands.left) {
        if (confirm(`Unequip ${state.hands.left}?`)) {
            state.inventory.push(state.hands.left);
            state.hands.left = null;
            calcPlayerAttack();
            updateUIState();
        }
    } else if (slot === 'right' && state.hands.right) {
        if (confirm(`Unequip ${state.hands.right}?`)) {
            state.inventory.push(state.hands.right);
            state.hands.right = null;
            calcPlayerAttack();
            updateUIState();
        }
    } else if (slot === 'armour' && state.armorSlot) {
        if (confirm(`Unequip ${state.armorSlot}?`)) {
            state.inventory.push(state.armorSlot);
            state.armorSlot = null;
            calcPlayerDefense();
            updateUIState();
        }
    }
};

window.equipItem = function (idx) {
    if (state.appState === 'low_health') {
        state.appState = 'playing';
    }

    const item = state.inventory[idx];

    if (item === 'Black Key' || item === 'Gold Key') {
        showMessage("CANNOT EQUIP KEY");
        return;
    }

    if (item === 'Torch') {
        if (!state.hands.left) {
            state.hands.left = item;
            state.inventory.splice(idx, 1);
        } else if (!state.hands.right) {
            state.hands.right = item;
            state.inventory.splice(idx, 1);
        } else {
            state.inventory[idx] = state.hands.right;
            state.hands.right = item;
        }
        showMessage('TORCH EQUIPPED — LIGHT RESTORED!', { color: '#FFB347' });
        updateUIState();
        return;
    }

    if (item === 'Health Potion') {
        state.inventory.splice(idx, 1);
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.floor(state.player.maxHp / 2));
        showMessage("HEALED");
        updateUIState();
        render();
        return;
    }

    if (item === 'Super Potion') {
        state.inventory.splice(idx, 1);
        state.player.hp = state.player.maxHp;
        showMessage("100% HEALED!");
        updateUIState();
        render();
        return;
    }

    if (LEVEL_ARMOR.some(a => a.name === item)) {
        const oldArmor = state.armorSlot;
        state.armorSlot = item;
        if (oldArmor) {
            state.inventory[idx] = oldArmor;
        } else {
            state.inventory.splice(idx, 1);
        }
        updateUIState();
        return;
    }

    if (item === 'Slightly Less Rusty Sword') {
        let hasRusty = false;
        if (state.hands.right === 'Rusty Sword') {
            state.hands.left = 'Rusty Sword';
            state.hands.right = item;
            hasRusty = true;
        } else if (state.hands.left === 'Rusty Sword') {
            state.hands.right = 'Rusty Sword';
            state.hands.left = item;
            hasRusty = true;
        }

        if (hasRusty) {
            state.inventory.splice(idx, 1);
            updateUIState();
            return;
        }
    }

    if (!state.hands.right) {
        state.hands.right = item;
        state.inventory.splice(idx, 1);
    } else if (!state.hands.left) {
        state.hands.left = item;
        state.inventory.splice(idx, 1);
    } else {
        const old = state.hands.right;
        state.hands.right = item;
        state.inventory[idx] = old;
    }
    updateUIState();
};

// Tooltip and click interaction
const crtContainer = document.getElementById('crt-container');
let tooltipDiv = null;

function pointInPolygon(point, vs) {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

crtContainer.addEventListener('click', (e) => {
    if (state.appState !== 'playing' && state.appState !== 'low_health') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (let enemy of state.enemies) {
        if (enemy.screenBounds && enemy.state !== 'dead') {
            const b = enemy.screenBounds;
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                attackFront();
                return;
            }
        }
    }

    let point = { x: mx, y: my };
    for (let w of state.visibleSecretWalls) {
        if (pointInPolygon(point, w.poly)) {
            if (!state.revealedSecrets[`${w.mapX},${w.mapY}`]) {
                state.revealedSecrets[`${w.mapX},${w.mapY}`] = true;
                state.quest.secretsFound = (state.quest.secretsFound || 0) + 1;

                let extraMsg = "";
                if (state.quest.secretsFound === state.quest.totalSecrets && state.quest.totalSecrets > 0) {
                    state.player.gold += 100;
                    extraMsg = " ALL SECRETS FOUND! +100G!";
                    checkGoldDebt();
                }

                showMessage("You found a secret..." + extraMsg, { color: colors.cyan });
                if (audioCtx) playSound('powerup');

                state.map[w.mapY][w.mapX] = 0;
                state.items.push({ x: w.mapX, y: w.mapY, type: 'Health Potion', name: 'Health Potion' });

                render();
                return;
            }
        }
    }
});

crtContainer.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let hovering = null;
    for (let enemy of state.enemies) {
        if (enemy.screenBounds && enemy.state !== 'dead') {
            const b = enemy.screenBounds;
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                hovering = enemy;
                break;
            }
        }
    }

    if (hovering) {
        if (!tooltipDiv) {
            tooltipDiv = document.createElement('div');
            tooltipDiv.style.position = 'absolute';
            tooltipDiv.style.backgroundColor = 'var(--c-black)';
            tooltipDiv.style.border = '2px solid var(--c-white)';
            tooltipDiv.style.color = 'var(--c-white)';
            tooltipDiv.style.padding = '5px';
            tooltipDiv.style.fontSize = '10px';
            tooltipDiv.style.pointerEvents = 'none';
            tooltipDiv.style.zIndex = '100';
            crtContainer.appendChild(tooltipDiv);
        }

        const diff = hovering.screenBounds.diff;
        let msg = "A weak creature.";
        if (diff === 0) msg = "An even match.";
        else if (diff === 1) msg = "Looks tough. Be careful.";
        else if (diff === 2) msg = "Very dangerous!";
        else if (diff >= 3) msg = "This one looks VERY dangerous, AVOID at all costs!";

        tooltipDiv.innerText = msg;
        tooltipDiv.style.left = (e.clientX - rect.left + 15) + 'px';
        tooltipDiv.style.top = (e.clientY - rect.top + 15) + 'px';
    } else {
        if (tooltipDiv) {
            tooltipDiv.remove();
            tooltipDiv = null;
        }
    }
});
