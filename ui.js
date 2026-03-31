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
            <span style='color:var(--c-green)'>5. Pay off 2500 gold debt-</span> <span style='color:var(--c-white)'>(${state.player.gold >= 0 ? 'PAID!' : Math.abs(state.player.gold) + ' remaining'}).</span><br>
            <span style='color:var(--c-green)'>6. Find ${getLevelName(state.level + 1)}-</span> <span style='color:var(--c-white)'>(Exit to the next level).</span>
        `;
        // NPC Quest display
        if (state.npcQuest && state.npcQuest.active && state.npcQuest.level === state.level) {
            const qStatus = state.npcQuest.complete ? '<span style="color:#00CC55">COMPLETE!</span>' : `Find ${state.npcQuest.item}`;
            details += `<br><span style='color:var(--c-purple)'>7. ${state.npcQuest.npcName}'s Request-</span> <span style='color:var(--c-white)'>(${qStatus}).</span>`;
        }
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
        state.torchEquipped = true;
        state.inventory.splice(idx, 1);
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

    // Weapon equipping — stronger weapon always goes to right hand
    const isWeapon = LEVEL_WEAPONS.some(w => w.name === item);
    if (isWeapon) {
        const itemBonus = (LEVEL_WEAPONS.find(w => w.name === item) || {}).attackBonus || 0;
        const rightBonus = state.hands.right ? (LEVEL_WEAPONS.find(w => w.name === state.hands.right) || {}).attackBonus || 0 : -1;
        const leftBonus = state.hands.left ? (LEVEL_WEAPONS.find(w => w.name === state.hands.left) || {}).attackBonus || 0 : -1;

        if (!state.hands.right && !state.hands.left) {
            // Both empty — equip to right
            state.hands.right = item;
            state.inventory.splice(idx, 1);
        } else if (!state.hands.right) {
            // Right empty
            if (itemBonus >= leftBonus) {
                state.hands.right = item;
            } else {
                state.hands.right = state.hands.left;
                state.hands.left = item;
            }
            state.inventory.splice(idx, 1);
        } else if (!state.hands.left) {
            // Left empty
            if (itemBonus >= rightBonus) {
                state.hands.left = state.hands.right;
                state.hands.right = item;
            } else {
                state.hands.left = item;
            }
            state.inventory.splice(idx, 1);
        } else {
            // Both hands full — replace the weaker one, keep stronger in right
            if (itemBonus >= rightBonus) {
                // New is strongest — put in right, old right to left, old left to inventory
                state.inventory[idx] = state.hands.left;
                state.hands.left = state.hands.right;
                state.hands.right = item;
            } else if (itemBonus >= leftBonus) {
                // New is middle — replace left
                state.inventory[idx] = state.hands.left;
                state.hands.left = item;
            } else {
                // New is weakest — don't equip
                showMessage("Your weapons are already stronger.");
                return;
            }
        }
        updateUIState();
        return;
    }

    // Generic item equip fallback
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

// ============================================================
// Lost NPC Quest Interaction
// ============================================================
function handleLostNPC(npc) {
    if (npc.questComplete) {
        showMessage(`${npc.name}: "Thank you again, brave adventurer!"`, { color: colors.cyan });
        return;
    }

    if (!npc.questAccepted) {
        // Offer quest
        const dialogues = [
            `Oh adventurer! Thank heavens! I've been stuck here for days. I'm searching for ${npc.questItem}. If you find it and bring it back, I have a reward for you. It's not much, but you'd really help me out!`,
            `Please, adventurer! I've been lost in these depths for so long. I desperately need ${npc.questItem}. Find it for me and I'll reward you handsomely!`,
            `Bless you, adventurer! I thought nobody would come. I need ${npc.questItem} — it's somewhere on this level. Bring it to me and I'll make it worth your while!`,
        ];
        const msg = dialogues[npc.npcLevel % dialogues.length];
        showConfirm(`${npc.name}:\n\n"${msg}"\n\nAccept quest?`, () => {
            npc.questAccepted = true;
            state.npcQuest.active = true;
            showMessage(`Quest accepted: Find ${npc.questItem}!`, { color: colors.yellow });
            if (audioCtx) playSound('powerup');

            // Spawn quest item on the map now
            const map = state.map;
            const W = map[0].length;
            const H = map.length;
            for (let attempts = 0; attempts < 200; attempts++) {
                const ix = Math.floor(Math.random() * (W - 2)) + 1;
                const iy = Math.floor(Math.random() * (H - 2)) + 1;
                if (map[iy][ix] !== 0) continue;
                const distNpc = Math.abs(ix - npc.x) + Math.abs(iy - npc.y);
                const distPlayer = Math.abs(ix - state.player.x) + Math.abs(iy - state.player.y);
                if (distNpc < 5 || distPlayer < 3) continue;
                if (state.items.some(i => i.x === ix && i.y === iy)) continue;
                state.items.push({ x: ix, y: iy, type: 'quest_item', name: npc.questItem });
                break;
            }

            updateUIState();
            render();
        });
    } else {
        // Quest accepted — check if player has the item
        const itemIdx = state.inventory.indexOf(npc.questItem);
        if (itemIdx >= 0) {
            // Complete quest!
            state.inventory.splice(itemIdx, 1);
            npc.questComplete = true;
            state.npcQuest.complete = true;
            state.usedQuestItems.push(npc.questItem);

            // Rewards
            const goldReward = state.level * 20;
            state.player.gold += goldReward;
            state.inventory.push('Health Potion');

            // Random weapon or armor from this level or below
            const rewardLevel = Math.floor(Math.random() * state.level);
            if (Math.random() < 0.5 && LEVEL_WEAPONS[rewardLevel]) {
                state.inventory.push(LEVEL_WEAPONS[rewardLevel].name);
                showMessage(`Quest complete! +${goldReward}g +Potion +${LEVEL_WEAPONS[rewardLevel].name}!`, { color: colors.green });
            } else if (LEVEL_ARMOR[rewardLevel]) {
                state.inventory.push(LEVEL_ARMOR[rewardLevel].name);
                showMessage(`Quest complete! +${goldReward}g +Potion +${LEVEL_ARMOR[rewardLevel].name}!`, { color: colors.green });
            } else {
                showMessage(`Quest complete! +${goldReward}g +Potion!`, { color: colors.green });
            }

            if (audioCtx) playSound('powerup');
            checkGoldDebt();
            updateUIState();
        } else {
            showMessage(`${npc.name}: "Have you found ${npc.questItem} yet? Please hurry!"`, { color: colors.yellow });
        }
    }
}

// ============================================================
// Shadow Merchant Shop
// ============================================================
let shopMode = 'buy'; // 'buy' or 'sell'
let shopMusicPlaying = false;

function openShop() {
    const overlay = document.getElementById('shop-overlay');
    overlay.classList.remove('hidden');
    shopMode = 'buy';
    renderShopItems();
    // Play shop music
    if (typeof playShopMusic === 'function') playShopMusic();
    shopMusicPlaying = true;
}

function closeShop() {
    document.getElementById('shop-overlay').classList.add('hidden');
    if (shopMusicPlaying && typeof playGameMusic === 'function') {
        playGameMusic();
        shopMusicPlaying = false;
    }
}

function renderShopItems() {
    const list = document.getElementById('shop-item-list');
    const goldDisplay = document.getElementById('shop-gold');
    goldDisplay.innerText = `Gold: ${state.player.gold}`;

    // Update tab styles
    document.getElementById('shop-tab-buy').classList.toggle('active', shopMode === 'buy');
    document.getElementById('shop-tab-sell').classList.toggle('active', shopMode === 'sell');

    list.innerHTML = '';

    if (shopMode === 'buy') {
        // Weapons levels 1-9 (levels 7-9 cost 5x more)
        for (let i = 0; i < 9; i++) {
            const w = LEVEL_WEAPONS[i];
            const basePrice = (i + 1) * 20;
            const price = (i >= 6) ? Math.floor(basePrice * 2.5) : basePrice;
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <span class="shop-item-name">${w.name}</span>
                <span class="shop-item-stats">ATK +${w.attackBonus}</span>
                <span class="shop-item-price">${price}g</span>
                <button class="shop-buy-btn" onclick="shopBuy('${w.name}', ${price})">BUY</button>
            `;
            list.appendChild(div);
        }
        // Armor levels 1-9 (levels 7-9 cost 5x more)
        for (let i = 0; i < 9; i++) {
            const a = LEVEL_ARMOR[i];
            const basePrice = (i + 1) * 20;
            const price = (i >= 6) ? Math.floor(basePrice * 2.5) : basePrice;
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <span class="shop-item-name">${a.name}</span>
                <span class="shop-item-stats">DEF +${a.defenseBonus}</span>
                <span class="shop-item-price">${price}g</span>
                <button class="shop-buy-btn" onclick="shopBuy('${a.name}', ${price})">BUY</button>
            `;
            list.appendChild(div);
        }
        // Health Potions
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <span class="shop-item-name">Health Potion</span>
            <span class="shop-item-stats">Heals 50% HP</span>
            <span class="shop-item-price">20g</span>
            <button class="shop-buy-btn" onclick="shopBuy('Health Potion', 20)">BUY</button>
        `;
        list.appendChild(div);
    } else {
        // Sell mode — show player inventory only (not equipped items)
        if (state.inventory.length === 0) {
            list.innerHTML = '<div style="color:#666; font-size:7px; padding:10px; text-align:center;">Nothing to sell.</div>';
            return;
        }

        // Show equipped items as info only (no sell button)
        if (state.hands.right) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.style.opacity = '0.5';
            div.innerHTML = `<span class="shop-item-name">${state.hands.right} [Equipped R]</span><span class="shop-item-stats" style="color:#FF7777;">Unequip to sell</span>`;
            list.appendChild(div);
        }
        if (state.hands.left) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.style.opacity = '0.5';
            div.innerHTML = `<span class="shop-item-name">${state.hands.left} [Equipped L]</span><span class="shop-item-stats" style="color:#FF7777;">Unequip to sell</span>`;
            list.appendChild(div);
        }
        if (state.armorSlot) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.style.opacity = '0.5';
            div.innerHTML = `<span class="shop-item-name">${state.armorSlot} [Worn]</span><span class="shop-item-stats" style="color:#FF7777;">Unequip to sell</span>`;
            list.appendChild(div);
        }

        if (state.inventory.length === 0) {
            // Only equipped items shown above, nothing sellable
            return;
        }

        // Inventory items
        for (let i = 0; i < state.inventory.length; i++) {
            const item = state.inventory[i];
            if (item === 'Gold Key' || item === 'Black Key') continue;

            let stats = '';
            let price = 10;
            const wIdx = LEVEL_WEAPONS.findIndex(w => w.name === item);
            const aIdx = LEVEL_ARMOR.findIndex(a => a.name === item);
            if (wIdx >= 0) {
                stats = `ATK +${LEVEL_WEAPONS[wIdx].attackBonus}`;
                price = Math.floor((wIdx + 1) * 20 * 0.6);
            } else if (aIdx >= 0) {
                stats = `DEF +${LEVEL_ARMOR[aIdx].defenseBonus}`;
                price = Math.floor((aIdx + 1) * 20 * 0.6);
            } else if (item === 'Health Potion') {
                stats = 'Heals 50% HP';
                price = 10;
            } else if (item === 'Super Potion') {
                stats = 'Full heal';
                price = 25;
            }

            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <span class="shop-item-name">${item}</span>
                <span class="shop-item-stats">${stats}</span>
                <span class="shop-item-price">${price}g</span>
                <button class="shop-sell-btn" onclick="shopSellInventory(${i}, ${price})">SELL</button>
            `;
            list.appendChild(div);
        }
    }
}

window.shopBuy = function(itemName, price) {
    // Can't spend more than you've earned — gold can't go below -2500 (starting debt)
    const availableGold = state.player.gold - (-2500); // how much above starting debt
    if (availableGold < price) {
        showMessage("You can't afford that! Earn more gold first.", { color: colors.red });
        return;
    }
    state.player.gold -= price;
    state.inventory.push(itemName);
    showMessage(`Bought ${itemName}!`, { color: colors.green });
    if (audioCtx) playSound('powerup');
    checkGoldDebt();
    updateUIState();
    renderShopItems();
};

window.shopSellInventory = function(idx, price) {
    const item = state.inventory[idx];
    state.inventory.splice(idx, 1);
    state.player.gold += price;
    showMessage(`Sold ${item} for ${price}g`, { color: colors.yellow });
    if (audioCtx) playSound('hit');
    checkGoldDebt();
    updateUIState();
    renderShopItems();
};

window.shopSellEquipped = function(hand, price) {
    const item = state.hands[hand];
    state.hands[hand] = null;
    state.player.gold += price;
    showMessage(`Sold ${item} for ${price}g`, { color: colors.yellow });
    if (audioCtx) playSound('hit');
    calcPlayerAttack();
    checkGoldDebt();
    updateUIState();
    renderShopItems();
};

window.shopSellArmor = function(price) {
    const item = state.armorSlot;
    state.armorSlot = null;
    state.player.gold += price;
    showMessage(`Sold ${item} for ${price}g`, { color: colors.yellow });
    if (audioCtx) playSound('hit');
    calcPlayerDefense();
    checkGoldDebt();
    updateUIState();
    renderShopItems();
};

// ============================================================
// Depths Map — illustrated map with level markers
let depthsMapZoom = 1.5;
let depthsMapScrollY = 0;
const depthsMapBg = new Image();
depthsMapBg.src = 'depths_map_bg.png';

function drawDepthsMap() {
    const canvas = document.getElementById('depths-map-canvas');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    if (!state.highestLevel || state.level > state.highestLevel) {
        state.highestLevel = state.level;
    }
    const highest = state.highestLevel || state.level;

    // Level marker positions mapped onto the background image (1024x1024 source)
    // Positioned to match the art — top=level1, bottom=level20
    const imgW = 1024, imgH = 1024;
    const levelPositions = [
        { x: 200, y: 60 },   // 1 - top left area
        { x: 700, y: 90 },   // 2 - top right
        { x: 350, y: 170 },  // 3 - left mid-top
        { x: 600, y: 200 },  // 4 - right mid-top
        { x: 450, y: 280 },  // 5 - center (boss)
        { x: 200, y: 350 },  // 6 - left
        { x: 700, y: 380 },  // 7 - right
        { x: 350, y: 440 },  // 8 - left mid
        { x: 600, y: 480 },  // 9 - right mid
        { x: 450, y: 550 },  // 10 - center (boss)
        { x: 250, y: 620 },  // 11 - left
        { x: 650, y: 650 },  // 12 - right
        { x: 400, y: 710 },  // 13 - left mid
        { x: 550, y: 750 },  // 14 - right mid
        { x: 500, y: 810 },  // 15 - center (boss)
        { x: 300, y: 860 },  // 16 - left
        { x: 700, y: 880 },  // 17 - right
        { x: 400, y: 920 },  // 18 - left
        { x: 600, y: 950 },  // 19 - right
        { x: 500, y: 990 },  // 20 - center bottom (final boss)
    ];

    // Scale positions to canvas
    const scaleX = W / imgW;
    const scaleY = H / imgH;

    // Auto-center on current level
    const curPos = levelPositions[state.level - 1];
    const targetScrollX = curPos.x * scaleX - W / 2;
    const targetScrollY = curPos.y * scaleY - H / 2;

    // Only auto-center on first open (not while dragging)
    if (!state._depthsMapOpened) {
        depthsMapScrollX = targetScrollX;
        depthsMapScrollY = targetScrollY;
        depthsMapZoom = 1.8;
        state._depthsMapOpened = true;
    }

    // Clear
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);

    c.save();
    c.translate(W / 2, H / 2);
    c.scale(depthsMapZoom, depthsMapZoom);
    c.translate(-W / 2 - depthsMapScrollX, -H / 2 - depthsMapScrollY);

    // Draw background image
    if (depthsMapBg.complete) {
        c.drawImage(depthsMapBg, 0, 0, W, H);
    } else {
        c.fillStyle = '#1a1510';
        c.fillRect(0, 0, W, H);
    }

    // Darken undiscovered areas (fog of war from current level down)
    const curLevelY = levelPositions[Math.min(highest - 1, 19)].y * scaleY;
    if (curLevelY < H) {
        const fogGrad = c.createLinearGradient(0, curLevelY, 0, curLevelY + 60 * scaleY);
        fogGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        c.fillStyle = fogGrad;
        c.fillRect(0, curLevelY, W, H - curLevelY);
        // Solid dark below
        c.fillStyle = 'rgba(0, 0, 0, 0.7)';
        c.fillRect(0, curLevelY + 60 * scaleY, W, H);
    }

    // Draw level markers
    for (let i = 0; i < 20; i++) {
        const lvl = i + 1;
        const pos = levelPositions[i];
        const px = pos.x * scaleX;
        const py = pos.y * scaleY;
        const completed = lvl < highest;
        const current = lvl === state.level;
        const discovered = lvl <= highest;
        const isBoss = lvl % 5 === 0;

        // Connection line to next level
        if (i < 19) {
            const nextPos = levelPositions[i + 1];
            const nx = nextPos.x * scaleX;
            const ny = nextPos.y * scaleY;
            if (discovered) {
                c.strokeStyle = completed ? 'rgba(0, 200, 85, 0.4)' : 'rgba(200, 180, 100, 0.3)';
                c.lineWidth = 1.5;
                c.setLineDash([3, 3]);
                c.beginPath();
                c.moveTo(px, py);
                c.lineTo(nx, ny);
                c.stroke();
                c.setLineDash([]);
            }
        }

        if (discovered) {
            // Marker size reflects dungeon size
            let mapSize = 27;
            if (lvl === 1) mapSize = 27;
            else if (lvl === 5) mapSize = 51;
            else if (lvl === 2) mapSize = 31;
            else mapSize = Math.min(51, 31 + (lvl - 2) * 6);
            const markerR = Math.max(8, Math.floor(mapSize / 4)) + (isBoss ? 4 : 0);

            // Glow behind marker
            if (current) {
                const glow = c.createRadialGradient(px, py, 0, px, py, markerR * 2.5);
                glow.addColorStop(0, 'rgba(255, 200, 50, 0.3)');
                glow.addColorStop(1, 'rgba(255, 200, 50, 0)');
                c.fillStyle = glow;
                c.beginPath();
                c.arc(px, py, markerR * 2.5, 0, Math.PI * 2);
                c.fill();
            }

            // Marker circle
            c.beginPath();
            c.arc(px, py, markerR, 0, Math.PI * 2);
            c.fillStyle = current ? 'rgba(40, 0, 0, 0.85)' : completed ? 'rgba(0, 20, 0, 0.85)' : 'rgba(20, 18, 12, 0.85)';
            c.fill();
            c.strokeStyle = current ? '#FF7777' : completed ? '#00CC55' : '#887755';
            c.lineWidth = current ? 2 : 1;
            c.stroke();

            if (isBoss) {
                c.strokeStyle = '#CC44CC';
                c.lineWidth = 1.5;
                c.beginPath();
                c.arc(px, py, markerR + 2, 0, Math.PI * 2);
                c.stroke();
            }

            // Level number
            c.font = `${isBoss ? 6 : 5}px "Press Start 2P"`;
            c.textAlign = 'center';
            c.fillStyle = current ? '#EEEE77' : completed ? '#00CC55' : '#ccc';
            c.fillText(`${lvl}`, px, py + 2);

            // Name label below
            const name = (typeof LEVEL_NAMES !== 'undefined' && LEVEL_NAMES[i]) ? LEVEL_NAMES[i] : '';
            c.font = '3px "Press Start 2P"';
            c.fillStyle = 'rgba(0,0,0,0.7)';
            c.fillRect(px - 30, py + markerR + 1, 60, 8);
            c.fillStyle = current ? '#EEEE77' : completed ? '#00CC55' : '#998';
            c.fillText(name, px, py + markerR + 7);

            // Pulsing player dot on current
            if (current) {
                const t = Date.now() / 400;
                const pulse = 3 + Math.sin(t) * 1.5;
                c.fillStyle = '#EEEE77';
                c.beginPath();
                c.arc(px, py, pulse, 0, Math.PI * 2);
                c.fill();
            }
        } else {
            // Undiscovered — dark circle with ?
            const markerR = 8;
            c.beginPath();
            c.arc(px, py, markerR, 0, Math.PI * 2);
            c.fillStyle = 'rgba(0, 0, 0, 0.6)';
            c.fill();
            c.strokeStyle = 'rgba(30, 25, 15, 0.4)';
            c.lineWidth = 0.5;
            c.stroke();

            c.font = '5px "Press Start 2P"';
            c.textAlign = 'center';
            c.fillStyle = 'rgba(50, 40, 25, 0.5)';
            c.fillText('?', px, py + 2);
        }
    }

    c.restore();

    // UI bar
    c.fillStyle = 'rgba(0,0,0,0.8)';
    c.fillRect(0, H - 14, W, 14);
    c.font = '5px "Press Start 2P"';
    c.textAlign = 'center';
    c.fillStyle = '#888';
    c.fillText(`Level ${state.level}/20  |  Scroll: Zoom  |  Drag: Pan  |  M: Close`, W / 2, H - 4);
}

// Zoom + drag handlers for depths map
let depthsMapScrollX = 0;
let depthsMapDragging = false;
let depthsMapDragStartX = 0;
let depthsMapDragStartY = 0;
let depthsMapDragScrollX = 0;
let depthsMapDragScrollY = 0;

(function() {
    const mc = document.getElementById('depths-map-canvas');
    if (!mc) return;

    mc.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        depthsMapZoom = Math.max(0.5, Math.min(3.0, depthsMapZoom + delta));
        drawDepthsMap();
    }, { passive: false });

    mc.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        depthsMapDragging = true;
        depthsMapDragStartX = e.clientX;
        depthsMapDragStartY = e.clientY;
        depthsMapDragScrollX = depthsMapScrollX;
        depthsMapDragScrollY = depthsMapScrollY;
        mc.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!depthsMapDragging) return;
        depthsMapScrollX = depthsMapDragScrollX - (e.clientX - depthsMapDragStartX) / depthsMapZoom;
        depthsMapScrollY = depthsMapDragScrollY - (e.clientY - depthsMapDragStartY) / depthsMapZoom;
        drawDepthsMap();
    });

    window.addEventListener('mouseup', () => {
        if (depthsMapDragging) {
            depthsMapDragging = false;
            mc.style.cursor = 'grab';
        }
    });

    mc.style.cursor = 'grab';

    // Prevent overlay click-to-close when clicking on canvas
    mc.addEventListener('click', (e) => {
        e.stopPropagation();
    });
})();
