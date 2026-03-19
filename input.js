// input.js - Keyboard and button bindings
// Depends on: state, DIRS from globals
// Depends on: moveForward, turn, strafe from movement.js
// Depends on: attackFront, wait from combat.js
// Depends on: showMessage from ui.js
// Depends on: render from effects.js
// Depends on: getCell from movement.js

function bindControls() {
    // Minimap zoom toggle
    const mmCanvas = document.getElementById('minimap-canvas');
    if (mmCanvas) {
        mmCanvas.style.cursor = 'pointer';
        mmCanvas.addEventListener('click', () => {
            state.minimapZoomed = !state.minimapZoomed;
            if (typeof render === 'function') render();
        });
    }

    function interactOrMove() {
        const d = DIRS[state.player.dir];
        const tx = state.player.x + d.dx;
        const ty = state.player.y + d.dy;
        const targetCell = getCell(tx, ty);

        let enemyInFront = false;
        for (let e of state.enemies) {
            if (e.x === tx && e.y === ty && e.state !== 'dead') {
                enemyInFront = true;
                break;
            }
        }

        if (enemyInFront) {
            attackFront();
        } else if (targetCell === 5) {
            if (!state.revealedSecrets[`${tx},${ty}`]) {
                state.revealedSecrets[`${tx},${ty}`] = true;
                state.quest.secretsFound = (state.quest.secretsFound || 0) + 1;

                let extraMsg = "";
                if (state.quest.secretsFound === state.quest.totalSecrets && state.quest.totalSecrets > 0) {
                    state.player.gold += 100;
                    extraMsg = " ALL SECRETS FOUND! +100G!";
                    checkGoldDebt();
                }

                showMessage("You found a secret..." + extraMsg, { color: colors.cyan });
                if (audioCtx) playSound('powerup');

                state.map[ty][tx] = 0;
                state.items.push({ x: tx, y: ty, type: 'Health Potion', name: 'Health Potion' });
                render();
            }
        } else {
            moveForward(1);
        }
    }

    const keyMap = {
        'KeyW': () => interactOrMove(),
        'Space': () => interactOrMove(),
        'KeyS': () => moveForward(-1),
        'KeyA': () => turn(-1),
        'KeyD': () => { if (state.appState === 'playing') turn(1); },
        'KeyQ': () => { if (state.appState === 'playing') strafe(-1); },
        'KeyE': () => { if (state.appState === 'playing') strafe(1); },
        'KeyZ': () => { if (state.appState === 'playing') wait(); }
    };

    window.addEventListener('keydown', (e) => {
        const tutOverlay = document.getElementById('tutorial-overlay');
        if (tutOverlay && !tutOverlay.classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')) {
            tutOverlay.querySelector('#tutorial-close-btn')?.click();
            e.preventDefault();
            return;
        }

        if (state.appState === 'intro') {
            document.getElementById('intro-screen').classList.add('hidden');
            state.appState = 'playing';
            playGameMusic();
            render();
            showTutorialIfNeeded();
            return;
        }

        if (state.appState === 'transition' && state.transitionReady) {
            nextLevel();
            return;
        }

        if (state.appState === 'low_health') {
            state.appState = 'playing';
        }

        if (state.appState !== 'playing') return;
        if (keyMap[e.code]) {
            keyMap[e.code]();
            updateUI(e.code);
            render();
        }
    });

    window.addEventListener('keyup', (e) => {
        const btnId = 'btn-' + e.key.toLowerCase();
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.remove('active');
    });

    document.querySelectorAll('.ctrl-btn').forEach(btn => {
        btn.addEventListener('mousedown', () => {
            if (state.appState === 'low_health') state.appState = 'playing';

            const code = 'Key' + btn.id.split('-')[1].toUpperCase();
            if (state.appState === 'playing') {
                if (keyMap[code]) {
                    keyMap[code]();
                    render();
                }
            }
        });
    });
}

function updateUI(code) {
    const char = code.replace('Key', '').toLowerCase();
    const btn = document.getElementById('btn-' + char);
    if (btn) btn.classList.add('active');
}
