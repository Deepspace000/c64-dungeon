/**
 * state.js - The Core Data Store
 * Holds the global game state, C64 palette, and configuration constants.
 */

export const GAME_WIDTH = 400; // Restored our zoomed size
export const GAME_HEIGHT = 300;

export const colors = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#880000",
    cyan: "#AAFFEE",
    purple: "#CC44CC",
    green: "#00CC55",
    blue: "#0000AA",
    yellow: "#EEEE77",
    orange: "#DD8855",
    brown: "#664400",
    lightred: "#FF7777",
    darkgrey: "#333333",
    grey: "#777777",
    lightgreen: "#AAFF66",
    lightblue: "#0088FF",
    lightgrey: "#BBBBBB"
};

export const DIRS = [
    { dx: 0, dy: -1 }, // N (0)  - Restored to dx/dy for game.js math
    { dx: 1, dy: 0 },  // E (1)
    { dx: 0, dy: 1 },  // S (2)
    { dx: -1, dy: 0 }  // W (3)
];

// Define the atmospheric names for each floor
export const LEVEL_NAMES = [
    "The Red Chambers",              // Floor 1
    "The Green Depths",              // Floor 2
    "The Shadow Crypts",             // Floor 3
    "The Drowning Catacombs",        // Floor 4
    "The Forgotten Crypt",           // Floor 5
    "Halls of the Blind Warden",     // Floor 6
    "The Sunken Library",            // Floor 7
    "The Obsidian Labyrinth",        // Floor 8
    "Chasm of Echoes",               // Floor 9
    "The Abyssal Throne",            // Floor 10
    "The Lower Depths",              // Floor 11
    "Ruins of the Old Kings",        // Floor 12
    "The Bloodstone Mines",          // Floor 13
    "Caverns of the Slime Lord",     // Floor 14
    "The Desolate Vault",            // Floor 15
    "Tomb of the Iron Giant",        // Floor 16
    "The Shadowed Sanctum",          // Floor 17
    "Lair of the Bone Dragon",       // Floor 18
    "The Whispering Void",           // Floor 19
    "The Heart of the Depths"        // Floor 20
];

// Define the unique sword progression per dungeon floor (20 Levels)
export const LEVEL_WEAPONS = [
    { name: "Rusty Sword", attackBonus: 1 },
    { name: "Slightly Less Rusty Sword", attackBonus: 2 },
    { name: "Even Less Rusty Sword", attackBonus: 4 },
    { name: "Mostly Unrusty Sword", attackBonus: 6 },
    { name: "Not Really Shiny Sword", attackBonus: 8 },
    { name: "Fairly Shiny Sword", attackBonus: 11 },
    { name: "Quite Shiny Sword", attackBonus: 14 },
    { name: "Very Shiny Sword", attackBonus: 18 },
    { name: "Sparkling Shiny Sword", attackBonus: 22 },
    { name: "The Perfect Shiny Sword", attackBonus: 30 },
    { name: "Rusty Sword 2", attackBonus: 40 },
    { name: "Slightly Less Rusty Sword 2", attackBonus: 50 },
    { name: "Even Less Rusty Sword 2", attackBonus: 65 },
    { name: "Mostly Unrusty Sword 2", attackBonus: 80 },
    { name: "Not Really Shiny Sword 2", attackBonus: 100 },
    { name: "Fairly Shiny Sword 2", attackBonus: 125 },
    { name: "Quite Shiny Sword 2", attackBonus: 155 },
    { name: "Very Shiny Sword 2", attackBonus: 190 },
    { name: "Sparkling Shiny Sword 2", attackBonus: 230 },
    { name: "The Perfect Shiny Sword 2", attackBonus: 280 }
];

// Define the unique armor progression per dungeon floor to soak incoming damage
export const LEVEL_ARMOR = [
    { name: "Rusty Armor", defenseBonus: 1 },
    { name: "Slightly Less Rusty Armor", defenseBonus: 2 },
    { name: "Even Less Rusty Armor", defenseBonus: 3 },
    { name: "Mostly Unrusty Armor", defenseBonus: 5 },
    { name: "Not Really Shiny Armor", defenseBonus: 7 },
    { name: "Fairly Shiny Armor", defenseBonus: 9 },
    { name: "Quite Shiny Armor", defenseBonus: 12 },
    { name: "Very Shiny Armor", defenseBonus: 16 },
    { name: "Sparkling Shiny Armor", defenseBonus: 20 },
    { name: "The Perfect Shiny Armor", defenseBonus: 25 },
    { name: "Rusty Armor 2", defenseBonus: 35 },
    { name: "Slightly Less Rusty Armor 2", defenseBonus: 45 },
    { name: "Even Less Rusty Armor 2", defenseBonus: 55 },
    { name: "Mostly Unrusty Armor 2", defenseBonus: 70 },
    { name: "Not Really Shiny Armor 2", defenseBonus: 85 },
    { name: "Fairly Shiny Armor 2", defenseBonus: 105 },
    { name: "Quite Shiny Armor 2", defenseBonus: 130 },
    { name: "Very Shiny Armor 2", defenseBonus: 160 },
    { name: "Sparkling Shiny Armor 2", defenseBonus: 195 },
    { name: "The Perfect Shiny Armor 2", defenseBonus: 240 }
];

// Define the visual aesthetic for each floor using the C64 palette
export const LEVEL_THEMES = {
    1: { wallColor: colors.red, floorColor: colors.darkgrey, fogColor: colors.black, effect: 'smoke' },
    2: { wallColor: colors.green, floorColor: colors.darkgrey, fogColor: colors.black, effect: 'water' },
    3: { wallColor: colors.darkgrey, floorColor: colors.black, fogColor: colors.black, effect: 'mist' },
    4: { wallColor: colors.blue, floorColor: colors.darkgrey, fogColor: colors.purple, effect: 'water' },
    5: { wallColor: colors.orange, sideColor: colors.brown, floorColor: colors.black, fogColor: colors.darkgrey, effect: 'clouds' },
    6: { wallColor: colors.yellow, sideColor: colors.black, floorColor: colors.darkgrey, fogColor: colors.brown, effect: 'bright light' },
    7: { wallColor: colors.brown, sideColor: colors.darkgrey, floorColor: colors.blue, fogColor: colors.cyan, effect: 'water' },
    8: { wallColor: colors.darkgrey, sideColor: colors.black, floorColor: colors.black, fogColor: colors.purple, effect: 'gems' },
    9: { wallColor: colors.brown, sideColor: colors.darkgrey, floorColor: colors.darkgrey, fogColor: colors.brown, effect: 'cave' },
    10: { wallColor: colors.darkgrey, sideColor: colors.black, floorColor: colors.black, fogColor: colors.red, effect: 'throne' },
    11: { wallColor: colors.brown, floorColor: colors.darkgrey, fogColor: colors.black, effect: 'slime' },
    12: { wallColor: colors.yellow, floorColor: colors.brown, fogColor: colors.orange, effect: 'sandstorm' },
    13: { wallColor: colors.lightred, floorColor: colors.red, fogColor: colors.black, effect: 'smoke' },
    14: { wallColor: colors.green, floorColor: colors.lightgreen, fogColor: colors.darkgrey, effect: 'slime' },
    15: { wallColor: colors.grey, floorColor: colors.white, fogColor: colors.lightgrey, effect: 'clouds' },
    16: { wallColor: colors.orange, floorColor: colors.darkgrey, fogColor: colors.brown, effect: 'wind' },
    17: { wallColor: colors.purple, floorColor: colors.darkgrey, fogColor: colors.black, effect: 'mist' },
    18: { wallColor: colors.white, floorColor: colors.lightgrey, fogColor: colors.grey, effect: 'smoke' },
    19: { wallColor: colors.black, floorColor: colors.purple, fogColor: colors.darkgrey, effect: 'light bugs' },
    20: { wallColor: colors.red, floorColor: colors.orange, fogColor: colors.yellow, effect: 'smoke' }
};

export const BESTIARY = {
    // HP formula: (4 + level) × weapon_DMG × 2 (since playerDmg = atk × 2)
    // Lv1: 5 hits × DMG 2 = 10 HP | Lv5: 9 hits × DMG 16 = 144 HP | Lv10: 14 hits × DMG 60 = 840 HP
    1: [{ name: "Skeleton", hp: 10, attack: 4 }, { name: "Wraith", hp: 10, attack: 5 }],
    2: [{ name: "Skeleton", hp: 24, attack: 6 }, { name: "Wraith", hp: 24, attack: 7 }, { name: "Cloaked Skeleton", hp: 24, attack: 8 }],
    3: [{ name: "Mimic Chest", hp: 56, attack: 10 }, { name: "Cloaked Skeleton", hp: 56, attack: 10 }],
    4: [{ name: "Cave Slime", hp: 96, attack: 14 }, { name: "Giant Rat", hp: 96, attack: 16 }],
    5: [{ name: "Mimic Chest", hp: 144, attack: 18 }, { name: "Cave Slime", hp: 144, attack: 16 }, { name: "Giant Rat", hp: 144, attack: 18 }, { name: "Wraith", hp: 144, attack: 17 }, { name: "Restless Zombie", hp: 144, attack: 16 }, { name: "Skrronzor the Level Boss", hp: 432, attack: 35, isBoss: true }],
    6: [{ name: "Gargoyle", hp: 220, attack: 24 }, { name: "Blind Warden", hp: 220, attack: 26 }],
    7: [{ name: "Ink Elemental", hp: 308, attack: 28 }, { name: "Ghostly Scribe", hp: 308, attack: 30 }],
    8: [{ name: "Minotaur", hp: 432, attack: 34 }, { name: "Obsidian Golem", hp: 432, attack: 32 }],
    9: [{ name: "Chasm Crawler", hp: 572, attack: 38 }, { name: "Echo Wraith", hp: 572, attack: 40 }],
    10: [{ name: "Abyssal Knight", hp: 840, attack: 48 }, { name: "Throne Guard", hp: 840, attack: 45 }, { name: "Abyssius, Lord of the Abyss", hp: 2520, attack: 95, isBoss: true }],
    11: [{ name: "Deep Dweller", hp: 1200, attack: 58 }],
    12: [{ name: "Ruined Sentinel", hp: 1600, attack: 68 }, { name: "Undead King", hp: 1600, attack: 72 }],
    13: [{ name: "Bloodbat", hp: 2210, attack: 80 }, { name: "Bloodstone Golem", hp: 2210, attack: 78 }],
    14: [{ name: "Toxic Ooze", hp: 2700, attack: 92 }, { name: "The Slime Lord", hp: 2700, attack: 95 }],
    15: [{ name: "Vault Guardian", hp: 3800, attack: 105 }, { name: "The Vault Keeper", hp: 11400, attack: 190, isBoss: true }],
    16: [{ name: "Rusted Automaton", hp: 5000, attack: 120 }, { name: "Iron Giant", hp: 5000, attack: 125 }],
    17: [{ name: "Shadow Priest", hp: 6510, attack: 140 }, { name: "Void Cultist", hp: 6510, attack: 145 }],
    18: [{ name: "Skeletal Wyrm", hp: 8360, attack: 165 }, { name: "Bone Dragon", hp: 8360, attack: 170 }],
    19: [{ name: "Whispering Terror", hp: 10580, attack: 190 }, { name: "Null Entity", hp: 10580, attack: 195 }],
    20: [{ name: "The Depth Core", hp: 40320, attack: 380, isBoss: true }]
};

export const state = {
    // Restored Original Structure (Option A)
    appState: 'splash', // splash, intro, playing, dead, transition
    transitionReady: false,
    deathTime: 0,
    turnTick: 0,
    level: 1,
    player: {
        x: 1, y: 1, dir: 0,
        hp: 20, maxHp: 20,
        gold: 0,
        attack: 1,
        // Gemini's New Stats Integrated here safely
        baseDefense: 0,
        armorDefense: 1,
        potionsDrunk: 0
    },
    map: [],
    enemies: [],
    items: [],
    inventory: ['Rusty Sword', 'Health Potion'],
    hands: { left: null, right: null },
    armorSlot: null,
    animations: [],
    visibleSecretWalls: [],
    revealedSecrets: {},
    quest: {
        totalEnemies: 0,
        slainEnemies: 0,
        completed: false,
        totalSecrets: 0,
        secretsFound: 0,
        goldKeyFound: false,
        goldRoomOpened: false,
        blackKeyFound: false
    },
    settings: {
        autoPotion: false,
        generationMode: 'static'
    },
    mistParticles: [],
    drips: [],
    puddles: [],

    // Gemini's new properties tracking
    levelSwordFound: false,
    levelArmorFound: false,
    torches: []
};
