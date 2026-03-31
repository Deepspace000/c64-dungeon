// combat.js - Combat system, stats calculation, damage
// Depends on: state, colors, DIRS, LEVEL_ARMOR, LEVEL_WEAPONS, BESTIARY from globals
// Depends on: showMessage from ui.js
// Depends on: playSound, playDeathMusic, initAudio from audio section in game.js
// Depends on: render from effects.js
// Depends on: updateUIState from ui.js
// Depends on: getCell from movement.js

function calcPlayerAttack() {
    let atk = 1;

    // Check both hands for weapons and use the attackBonus from LEVEL_WEAPONS
    [state.hands.left, state.hands.right].forEach(item => {
        if (!item) return;
        const weapon = LEVEL_WEAPONS.find(w => w.name === item);
        if (weapon && weapon.attackBonus > atk) {
            atk = weapon.attackBonus;
        }
    });

    state.player.attack = atk;

    const atkText = document.getElementById('attack-val-text');
    if (atkText) atkText.innerText = state.player.attack;
}

function calcPlayerDefense() {
    let def = state.player.baseDefense || 0;

    if (state.armorSlot) {
        const armorData = LEVEL_ARMOR.find(a => a.name === state.armorSlot);
        if (armorData) {
            def += armorData.defenseBonus;
        }
    }

    state.player.armorDefense = def;

    const defText = document.getElementById('defense-val-text');
    if (defText) defText.innerText = state.player.armorDefense;
}

function takeDamage(amount) {
    state.player.hp -= amount;
    playSound('hit');

    const crt = document.getElementById('crt-container');
    crt.classList.remove('flash-red');
    void crt.offsetWidth;
    crt.classList.add('flash-red');

    if (state.player.hp <= (state.player.maxHp * 0.2) && state.settings.autoPotion) {
        const potIdx = state.inventory.indexOf('Health Potion');
        if (potIdx !== -1) {
            state.inventory.splice(potIdx, 1);
            let hpToAdd = Math.floor(state.player.maxHp / 2);

            if (state.player.hp <= 0) {
                state.player.hp = hpToAdd;
                showMessage("DEATH AVERTED! POTION USED!", { color: colors.green });
            } else {
                state.player.hp = Math.min(state.player.maxHp, state.player.hp + hpToAdd);
                showMessage("AUTO-POTION USED!", { color: colors.green });
            }
        }
    }

    if (state.player.hp <= 0) {
        state.player.hp = 0;
        if (state.appState !== 'dead') {
            state.appState = 'dead';
            state.deathTime = Date.now();
            const deathScreen = document.getElementById('death-screen');
            if (deathScreen) deathScreen.classList.remove('hidden');
            playDeathMusic();
        }
    } else if (state.player.hp <= (state.player.maxHp * 0.15) && !state.lowHealthWarned) {
        state.appState = 'low_health';
        state.lowHealthWarned = true;
    }
    updateUIState();
}

function advanceTurn() {
    state.turnTick++;

    const cell = getCell(state.player.x, state.player.y);
    if (cell === 3) {
        if (state.turnTick % 2 === 0) {
            showMessage("SPIKED!");
            takeDamage(5);
        }
    }
}

function attackFront() {
    if (!audioCtx) initAudio();

    const d = DIRS[state.player.dir];
    const tx = state.player.x + d.dx;
    const ty = state.player.y + d.dy;

    let hit = false;
    for (let i = 0; i < state.enemies.length; i++) {
        const e = state.enemies[i];
        if (e.x === tx && e.y === ty && e.state !== 'dead') {

            if (e.hp === e.maxHp) {
                const dangerDiff = e.level - state.player.attack;
                let diffMsg = 'EASY';
                let diffColor = colors.white;

                if (dangerDiff === 0 || dangerDiff === 1) {
                    diffMsg = 'MODERATE DIFFICULTY';
                    diffColor = colors.lightblue;
                } else if (dangerDiff === 2) {
                    diffMsg = 'HARD';
                    diffColor = colors.lightred;
                } else if (dangerDiff >= 3) {
                    diffMsg = 'VERY HARD';
                    diffColor = colors.purple;
                }

                showMessage(diffMsg, { color: diffColor, flash: true });
            }

            if (Math.random() < 0.1) {
                showMessage("MISS");
                playSound('miss');
            } else {
                playSound('attack');
                state.animations.push({ type: 'swipe', timer: 10, color: colors.white });

                const leftWeapon = state.hands.left ? LEVEL_WEAPONS.find(w => w.name === state.hands.left) : null;
                const rightWeapon = state.hands.right ? LEVEL_WEAPONS.find(w => w.name === state.hands.right) : null;
                let isDualWielding = leftWeapon && rightWeapon && state.hands.left !== state.hands.right;

                if (isDualWielding) {
                    state.animations.push({ type: 'swipe', timer: 15, color: colors.cyan });
                }

                // Unarmed = weak punch, equipped = weapon damage
                const isUnarmed = !state.hands.left && !state.hands.right;
                let playerDmg = isUnarmed ? 1 : state.player.attack * 2;
                let offHandDmg = 0;
                if (isDualWielding) {
                    const offHandBonus = Math.min(leftWeapon.attackBonus, rightWeapon.attackBonus);
                    offHandDmg = Math.floor(offHandBonus * 0.5);
                }
                let totalDmg = playerDmg + offHandDmg;

                let finalDmg = Math.max(1, totalDmg);

                e.hp -= finalDmg;

                e.state = 'hit';
                setTimeout(() => { if (e.state === 'hit') e.state = 'idle'; render(); }, 200);

                state.animations.push({ type: 'text', text: `-${finalDmg}`, timer: 40, color: colors.lightred });

                if (e.hp <= 0) {
                    e.state = 'dead';
                    e.deathTimer = 15;
                    playSound('death');

                    const droppedGold = Math.floor(Math.random() * 15) + 1;
                    state.items.push({ x: e.x, y: e.y, type: 'gold', amount: droppedGold });

                    if (e.level >= 3 && e.level <= 5) {
                        state.items.push({ x: e.x, y: e.y, type: 'Health Potion', name: 'Health Potion' });
                    }

                    // Boss drops the gold key
                    if (e.dropsGoldKey) {
                        state.items.push({ x: e.x, y: e.y, type: 'key', name: 'Gold Key' });
                        setTimeout(() => showMessage("THE BOSS DROPPED A GOLD KEY!"), 500);
                    }

                    state.quest.slainEnemies++;
                    if (!state.quest.completed && state.quest.slainEnemies >= state.quest.totalEnemies) {
                        state.quest.completed = true;
                        state.player.gold += 50;
                        state.inventory.push('Super Potion');
                        setTimeout(() => showMessage("QUEST COMPLETE! +50G +SUPER POTION"), 1000);
                        checkGoldDebt();
                    }

                    updateUIState();
                }
                hit = true;
            }

            if (e.hp > 0) {
                setTimeout(() => {
                    if (Math.random() < 0.2) {
                        showMessage("ENEMY MISS");
                        playSound('miss');
                    } else {
                        let finalEnemyDmg;

                        // Use the enemy's own attack stat (set at spawn)
                        const eAtk = e.attack || 4;
                        const variance = 0.7 + Math.random() * 0.6;
                        finalEnemyDmg = Math.max(1, Math.ceil(eAtk * variance * 0.15));
                        let mitigatedDmg = Math.max(1, finalEnemyDmg - state.player.armorDefense);
                        takeDamage(mitigatedDmg);
                        render();
                    }
                }, 300);
            }
            break;
        }
    }

    if (!hit) {
        playSound('attack');
        state.animations.push({ type: 'swipe', timer: 10 });
    }
    render();
}

function wait() {
    if (!audioCtx) initAudio();
    advanceTurn();
    render();
}
