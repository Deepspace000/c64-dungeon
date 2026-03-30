import { DIRS, GAME_WIDTH, GAME_HEIGHT, BESTIARY, state } from './state.js';
import { LEVEL_WEAPONS, LEVEL_ARMOR } from './state.js';

// TILE DICTIONARY:
// 0 = Floor
// 1 = Wall
// 2 = Exit Door (Requires Black Key to use)
// 3 = Spike Trap (Damage)
// 4 = Locked Door (Requires Gold Key to open)
// 5 = Secret Wall (Looks like a wall, can walk through)
// 6 = Pit (Impassable - treated as wall in renderer)
// 7 = Water / Slime (Slows movement - treated as floor in renderer with tint)
// 8 = Fountain tile (Healing - treated as floor in renderer)
// 9 = Altar (Grants a random buff or curse - treated as floor)
// 10 = Rubble / Barricade (Impassable - treated as wall)

export function generateMap(W, H) {
    let map = Array(H).fill(0).map(() => Array(W).fill(1));

    // --- 1. CARVE CENTRAL HUB ---
    let cx = Math.floor(W / 2);
    let cy = Math.floor(H / 2);
    for (let y = cy - 2; y <= cy + 2; y++) {
        for (let x = cx - 2; x <= cx + 2; x++) {
            if (x > 0 && x < W - 1 && y > 0 && y < H - 1) map[y][x] = 0;
        }
    }

    // --- 2. CARVE STRUCTURED ROOMS ---
    const numRooms = 5 + Math.floor(Math.random() * 4);
    const rooms = [];
    for (let i = 0; i < numRooms; i++) {
        let rw = 3 + Math.floor(Math.random() * 4);
        let rh = 3 + Math.floor(Math.random() * 4);
        let rx = 2 + Math.floor(Math.random() * (W - rw - 4));
        let ry = 2 + Math.floor(Math.random() * (H - rh - 4));
        rooms.push({ x: rx, y: ry, w: rw, h: rh });
        for (let y = ry; y < ry + rh; y++) {
            for (let x = rx; x < rx + rw; x++) {
                map[y][x] = 0;
            }
        }
    }

    // --- 3. ORGANIC SNAKE-LIKE TUNNELS (Random Walk) ---
    // NOTE: DIRS uses {dx, dy} not {x, y} - fixed from Gemini version
    let walkX = cx;
    let walkY = cy;
    let pathLen = W * H * 0.25;
    for (let i = 0; i < pathLen; i++) {
        let dir = Math.floor(Math.random() * 4);
        let d = DIRS[dir];
        let nx = walkX + d.dx;  // FIXED: d.dx not d.x
        let ny = walkY + d.dy;  // FIXED: d.dy not d.y
        if (nx > 1 && nx < W - 2 && ny > 1 && ny < H - 2) {
            walkX = nx;
            walkY = ny;
            map[walkY][walkX] = 0;
            if (Math.random() < 0.1) {
                if (walkY + 1 < H - 1) map[walkY + 1][walkX] = 0;
                if (walkX + 1 < W - 1) map[walkY][walkX + 1] = 0;
            }
        }
    }

    // --- 4. MYSTERY / BOSS ROOM LOGIC (Requires Gold Key) ---
    const isBossLevel = (state.level % 5 === 0);
    const roomSize = isBossLevel ? 5 : 3;
    const roomEnd = 2 + roomSize - 1;

    for (let y = 2; y <= roomEnd; y++) {
        for (let x = 2; x <= roomEnd; x++) {
            map[y][x] = 0;
        }
    }
    // Walls around locked room
    for (let i = 1; i <= roomEnd + 1; i++) {
        if (i < H) map[1][Math.min(i, W - 1)] = 1;
        if (roomEnd + 1 < H) map[roomEnd + 1][Math.min(i, W - 1)] = 1;
        if (i < W) map[Math.min(i, H - 1)][1] = 1;
        if (i < W) map[Math.min(i, H - 1)][Math.min(roomEnd + 1, W - 1)] = 1;
    }
    let doorX = Math.floor((2 + roomEnd) / 2);
    if (roomEnd + 1 < H) map[roomEnd + 1][doorX] = 4;
    if (roomEnd + 2 < H) map[roomEnd + 2][doorX] = 0;
    if (roomEnd + 3 < H) map[roomEnd + 3][doorX] = 0;

    let lockedRoomCenter = { x: doorX, y: Math.floor((2 + roomEnd) / 2) };

    // --- 5. STARTING POSITION & EXIT ---
    state.player.x = cx;
    state.player.y = cy;

    let exitPlaced = false;
    let exitAttempts = 0;
    while (!exitPlaced && exitAttempts < 500) {
        exitAttempts++;
        let ex = Math.floor(Math.random() * (W - 2)) + 1;
        let ey = Math.floor(Math.random() * (H - 2)) + 1;
        if (map[ey][ex] === 0 && Math.abs(ex - cx) > W / 3 && Math.abs(ey - cy) > H / 3) {
            if (ex > roomEnd + 1 || ey > roomEnd + 1) {
                map[ey][ex] = 2;
                exitPlaced = true;
            }
        }
    }
    // Fallback exit placement if random failed
    if (!exitPlaced) {
        for (let y = H - 2; y > 0 && !exitPlaced; y--) {
            for (let x = W - 2; x > 0 && !exitPlaced; x--) {
                if (map[y][x] === 0 && (x !== cx || y !== cy)) {
                    map[y][x] = 2;
                    exitPlaced = true;
                }
            }
        }
    }

    // --- 6. ENTITY SPAWNING HELPERS ---
    state.enemies = [];
    state.items = [];

    const getEmptySpot = (avoidLockedRoom = false) => {
        for (let attempts = 0; attempts < 200; attempts++) {
            let x = Math.floor(Math.random() * (W - 2)) + 1;
            let y = Math.floor(Math.random() * (H - 2)) + 1;
            const distToPlayer = Math.abs(x - state.player.x) + Math.abs(y - state.player.y);
            if (map[y][x] === 0 && distToPlayer >= 3) {
                if (avoidLockedRoom && x <= roomEnd + 1 && y <= roomEnd + 1) continue;
                let occupied = state.enemies.some(e => e.x === x && e.y === y) ||
                    state.items.some(i => i.x === x && i.y === y);
                if (!occupied) return { x, y };
            }
        }
        return null;
    };

    // --- 7. SPAWN KEYS ---
    // Black Key goes inside the locked vault
    state.items.push({ x: lockedRoomCenter.x, y: lockedRoomCenter.y, type: 'Black Key', name: 'Black Key' });

    // --- 8. SPAWN ENEMIES ---
    // NOTE: Enemy format must be compatible with game renderer:
    // { x, y, hp, maxHp, type: 'Skeleton'|'Wraith'|etc, level: N, state: 'idle', attack: N }
    let spawned = 0;

    const spawnEnemy = (typeName, lvl, hpOverride, attackOverride) => {
        let spot = getEmptySpot(true);
        if (spot) {
            const hp = hpOverride || (10 + lvl * 4);
            const atk = attackOverride || (2 + lvl * 2);
            state.enemies.push({
                x: spot.x, y: spot.y,
                hp, maxHp: hp,
                attack: atk,
                type: typeName,  // Used by renderer to pick sprite
                level: lvl,
                state: 'idle'
            });
            spawned++;
            return state.enemies[state.enemies.length - 1];
        }
        return null;
    };

    if (state.level === 1) {
        for (let i = 1; i <= 5; i++) spawnEnemy('Skeleton', i);
    } else if (state.level === 2) {
        for (let i = 1; i <= 5; i++) spawnEnemy('Skeleton', i);
        for (let i = 1; i <= 4; i++) spawnEnemy('Wraith', i);
        spawnEnemy('Wraith', 5, 25, 10);  // Tough wraith
    } else if (state.level === 3) {
        for (let i = 1; i <= 4; i++) spawnEnemy('Skeleton', i);
        for (let i = 1; i <= 5; i++) spawnEnemy('Wraith', i);
    } else {
        // Level 4+: use BESTIARY, plus Wraiths as filler
        let enemyPool = (BESTIARY[state.level] || BESTIARY[4]).filter(e => !e.isBoss);
        let numEnemies = (state.level === 5) ? 16 : 6 + Math.floor(state.level * 1.5);
        for (let i = 0; i < numEnemies; i++) {
            let template = enemyPool[Math.floor(Math.random() * enemyPool.length)];
            let spot = getEmptySpot(true);
            if (spot) {
                state.enemies.push({
                    x: spot.x, y: spot.y,
                    hp: template.hp, maxHp: template.hp,
                    attack: template.attack,
                    type: template.name,  // Use monster name as type for future renderer support
                    level: state.level,
                    state: 'idle'
                });
                spawned++;
            }
        }
        // Always add some Wraiths too for variety
        const numExtraWraiths = Math.min(state.level, 6);
        for (let i = 0; i < numExtraWraiths; i++) {
            spawnEnemy('Wraith', Math.min(5, Math.floor(Math.random() * state.level) + 1));
        }
    }

    // --- 8.5. PLACE GOLD KEY UNDER TOUGHEST ENEMY (skip on boss levels - boss drops it) ---
    if (!isBossLevel && state.enemies.length > 0) {
        let toughest = state.enemies.reduce((prev, curr) =>
            (prev.hp + prev.attack > curr.hp + curr.attack) ? prev : curr
        );
        state.items.push({ x: toughest.x, y: toughest.y, type: 'key', name: 'Gold Key' });
    }

    // --- 8.6. SPAWN BOSS / ELITE GUARD IN LOCKED ROOM ---
    if (isBossLevel) {
        let bossTemplate = (BESTIARY[state.level] || [{ name: "Unknown Abomination", hp: 100, attack: 25 }]);
        // Use the last entry in the bestiary (the boss entry if it has isBoss flag)
        bossTemplate = bossTemplate[bossTemplate.length - 1];
        const bossY = Math.max(1, lockedRoomCenter.y - 1);
        const bossType = bossTemplate.isBoss ? bossTemplate.name : 'Wraith';
        state.enemies.push({
            x: lockedRoomCenter.x, y: bossY,
            hp: bossTemplate.hp, maxHp: bossTemplate.hp,
            attack: bossTemplate.attack,
            type: bossType,
            level: state.level,
            state: 'idle',
            isBoss: true,
            name: bossTemplate.name,
            dropsGoldKey: true
        });
    } else {
        const bossY = Math.max(1, lockedRoomCenter.y - 1);
        state.enemies.push({
            x: lockedRoomCenter.x, y: bossY,
            hp: 30 + (state.level * 5), maxHp: 30 + (state.level * 5),
            attack: 5 + state.level,
            type: 'Skeleton',
            level: state.level,
            state: 'idle',
            name: 'Elite Guard'
        });
    }

    // --- 9. SPAWN LOOT (Weapons, Armor, Potions, Chests) ---
    let floorWep = LEVEL_WEAPONS[state.level - 1] || LEVEL_WEAPONS[0];
    state.items.push({
        x: Math.min(lockedRoomCenter.x + 1, W - 2),
        y: lockedRoomCenter.y,
        type: 'weapon', name: floorWep.name, attackBonus: floorWep.attackBonus
    });

    // Armor placed in the mystery room next to weapon
    let floorArm = LEVEL_ARMOR[state.level - 1] || LEVEL_ARMOR[0];
    state.items.push({
        x: Math.max(1, lockedRoomCenter.x - 1),
        y: lockedRoomCenter.y,
        type: 'armor', name: floorArm.name, defenseBonus: floorArm.defenseBonus
    });

    // Potions only come from secret walls, monster drops, and chests — no floor spawns

    // Save Fountain (level 2+) - place in open area (room)
    if (state.level >= 2) {
        let fSpot = null;
        for (let attempts = 0; attempts < 300; attempts++) {
            let spot = getEmptySpot(true);
            if (!spot) continue;
            // Check openness - count empty neighbors
            let open = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (map[spot.y + dy] && map[spot.y + dy][spot.x + dx] === 0) open++;
                }
            }
            if (open >= 6 || attempts > 250) { fSpot = spot; break; }
        }
        if (fSpot) state.items.push({ x: fSpot.x, y: fSpot.y, type: 'fountain', name: 'Save Fountain', persistent: true });
    }

    // Chests and Mimics (Level 4+)
    if (state.level >= 4) {
        const numChests = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numChests; i++) {
            let spot = getEmptySpot(true);
            if (spot) {
                if (Math.random() < 0.2) {
                    // Mimic - uses Skeleton sprite, looks like a chest but fights back
                    state.enemies.push({
                        x: spot.x, y: spot.y,
                        hp: 40 + (state.level * 5), maxHp: 40 + (state.level * 5),
                        attack: 15 + state.level,
                        type: 'Skeleton', level: state.level, state: 'idle',
                        isMimic: true, name: 'Mimic'
                    });
                } else {
                    state.items.push({ x: spot.x, y: spot.y, type: 'chest', name: 'Chest' });
                }
            }
        }
    }

    // --- 10. HAZARDS, TRAPS, SECRETS ---
    // Spike traps
    const numSpikes = Math.floor(Math.random() * 5) + 1 + Math.floor(state.level / 2);
    let spikeAttempts = 0;
    let spikesPlaced = 0;
    while (spikesPlaced < numSpikes && spikeAttempts < 200) {
        spikeAttempts++;
        let x = Math.floor(Math.random() * (W - 2)) + 1;
        let y = Math.floor(Math.random() * (H - 2)) + 1;
        if (map[y][x] === 0 && (x !== state.player.x || y !== state.player.y)) {
            if (!(x <= roomEnd + 1 && y <= roomEnd + 1)) {
                map[y][x] = 3;
                spikesPlaced++;
            }
        }
    }

    // Pit traps (tile 6, impassable) - level 3+
    if (state.level >= 3) {
        const numPits = Math.floor(state.level / 2);
        for (let i = 0; i < numPits; i++) {
            let spot = getEmptySpot(true);
            if (spot) map[spot.y][spot.x] = 6;
        }
    }

    // Water/Slime tiles (tile 7, slows) - level 2+
    if (state.level >= 2) {
        const numBlobs = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numBlobs; i++) {
            let spot = getEmptySpot(true);
            if (spot) {
                map[spot.y][spot.x] = 7;
                if (spot.y + 1 < H - 1 && map[spot.y + 1][spot.x] === 0) map[spot.y + 1][spot.x] = 7;
                if (spot.x + 1 < W - 1 && map[spot.y][spot.x + 1] === 0) map[spot.y][spot.x + 1] = 7;
            }
        }
    }

    // Altars (tile 9) - Level 3+
    if (state.level >= 3 && Math.random() > 0.5) {
        let aSpot = getEmptySpot(true);
        if (aSpot) map[aSpot.y][aSpot.x] = 9;
    }

    // Secret walls (~4% of inner walls, not adjacent to each other)
    let wallCoords = [];
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            if (map[y][x] === 1) wallCoords.push({ x, y });
        }
    }
    let targetSecrets = 5 + (state.level - 1);
    for (let i = wallCoords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wallCoords[i], wallCoords[j]] = [wallCoords[j], wallCoords[i]];
    }
    let placedSecrets = 0;
    for (let i = 0; i < wallCoords.length && placedSecrets < targetSecrets; i++) {
        let { x, y } = wallCoords[i];
        let hasAdjacentSecret = false;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (y + dy >= 0 && y + dy < H && x + dx >= 0 && x + dx < W) {
                    if (map[y + dy][x + dx] === 5) hasAdjacentSecret = true;
                }
            }
        }
        if (!hasAdjacentSecret) { map[y][x] = 5; placedSecrets++; }
    }

    // --- 10.5 GENERATE TORCHES (LEVEL 3) ---
    if (state.level === 3) {
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                if (map[y][x] === 1) {
                    // Check if adjacent to floor
                    if (map[y-1][x] === 0 || map[y+1][x] === 0 || map[y][x-1] === 0 || map[y][x+1] === 0) {
                        if (Math.random() < 0.12) { // 12% chance for a torch on exposed walls
                            state.torches.push({x, y});
                        }
                    }
                }
            }
        }
    }

    // --- 11. FINALIZE STATE ---
    state.quest.totalEnemies = state.enemies.length;
    state.quest.slainEnemies = 0;
    state.quest.completed = false;
    state.quest.totalSecrets = placedSecrets;
    state.quest.secretsFound = 0;
    state.quest.goldKeyFound = false;
    state.quest.goldRoomOpened = false;
    state.quest.blackKeyFound = false;

    state.turnTick = 0;
    state.revealedSecrets = {};
    state.torches = [];

    // Fog of war
    state.explored = Array(H).fill(0).map(() => Array(W).fill(false));

    // Mist particles
    state.mistParticles = [];
    const mistLevels = state.level <= 3;
    if (mistLevels) {
        for (let i = 0; i < 40; i++) {
            state.mistParticles.push({
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT / 2 - 20 + Math.random() * (GAME_HEIGHT / 2 + 20),
                speed: 0.2 + Math.random() * 0.8,
                size: 8 + Math.random() * 24,
                opacity: 0.05 + Math.random() * 0.15
            });
        }
    }

    // Level 4 - Drowning Catacombs: drips, puddles, blue mist
    state.drips = [];
    state.puddles = [];
    if (state.level === 4) {
        for (let i = 0; i < 30; i++) {
            state.mistParticles.push({
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT * 0.5 + Math.random() * (GAME_HEIGHT * 0.5),
                speed: 0.1 + Math.random() * 0.4,
                size: 10 + Math.random() * 30,
                opacity: 0.03 + Math.random() * 0.1
            });
        }
        for (let i = 0; i < 12; i++) {
            state.drips.push({
                x: 20 + Math.random() * (GAME_WIDTH - 40),
                y: Math.random() * (GAME_HEIGHT * 0.3),
                speed: 1.0 + Math.random() * 2.0,
                size: 2 + Math.random() * 3,
                opacity: 0.4 + Math.random() * 0.5,
                splashTimer: 0
            });
        }
        for (let i = 0; i < 8; i++) {
            state.puddles.push({
                x: 30 + Math.random() * (GAME_WIDTH - 60),
                y: GAME_HEIGHT * 0.7 + Math.random() * (GAME_HEIGHT * 0.25),
                w: 12 + Math.random() * 30,
                h: 3 + Math.random() * 5,
                shimmer: Math.random() * Math.PI * 2,
                opacity: 0.15 + Math.random() * 0.2
            });
        }
    }

    // Level 5 - The Forgotten Crypt: dark brown/orange mist
    if (state.level === 5) {
        for (let i = 0; i < 45; i++) {
            state.mistParticles.push({
                x: Math.random() * 400,
                y: 60 + Math.random() * 210,
                speed: 0.3 + Math.random() * 1.0,
                size: 12 + Math.random() * 28,
                opacity: 0.06 + Math.random() * 0.1
            });
        }
    }

    // Level 10 - The Abyssal Throne: dark red mist
    if (state.level === 10) {
        for (let i = 0; i < 35; i++) {
            state.mistParticles.push({
                x: Math.random() * 400,
                y: 60 + Math.random() * 210,
                speed: 0.15 + Math.random() * 0.5,
                size: 12 + Math.random() * 25,
                opacity: 0.04 + Math.random() * 0.08
            });
        }
    }

    // Level 9 - Chasm of Echoes: windy brown mist
    if (state.level === 9) {
        for (let i = 0; i < 45; i++) {
            state.mistParticles.push({
                x: Math.random() * 400,
                y: 30 + Math.random() * 240,
                speed: 0.8 + Math.random() * 2.0,
                size: 8 + Math.random() * 20,
                opacity: 0.04 + Math.random() * 0.08
            });
        }
    }

    // Level 8 - The Obsidian Labyrinth: purple mist
    if (state.level === 8) {
        for (let i = 0; i < 35; i++) {
            state.mistParticles.push({
                x: Math.random() * 400,
                y: 60 + Math.random() * 210,
                speed: 0.2 + Math.random() * 0.7,
                size: 10 + Math.random() * 20,
                opacity: 0.05 + Math.random() * 0.08
            });
        }
    }

    // Level 7 - The Sunken Library: damp mist + drips
    if (state.level === 7) {
        for (let i = 0; i < 8; i++) {
            state.drips.push({
                x: 20 + Math.random() * (380),
                y: Math.random() * 60,
                speed: 0.8 + Math.random() * 1.5,
                size: 1.5 + Math.random() * 2,
                opacity: 0.3 + Math.random() * 0.4,
                splashTimer: 0
            });
        }
        for (let i = 0; i < 40; i++) {
            state.mistParticles.push({
                x: Math.random() * 400,
                y: 45 + Math.random() * 210,
                speed: 0.3 + Math.random() * 0.9,
                size: 10 + Math.random() * 22,
                opacity: 0.05 + Math.random() * 0.1
            });
        }
    }

    // Level 6 - Halls of the Blind Warden: mist + dust
    if (state.level === 6) {
        for (let i = 0; i < 50; i++) {
            state.mistParticles.push({
                x: Math.random() * 400,
                y: 45 + Math.random() * 225,
                speed: 0.4 + Math.random() * 1.2,
                size: 10 + Math.random() * 25,
                opacity: 0.06 + Math.random() * 0.12
            });
        }
    }

    return map;
}
