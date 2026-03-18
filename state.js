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
    "The Dripping Catacombs",        // Floor 4
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
    4: { wallColor: colors.cyan, floorColor: colors.blue, fogColor: colors.darkgrey, effect: 'water' },
    5: { wallColor: colors.purple, floorColor: colors.black, fogColor: colors.darkgrey, effect: 'clouds' },
    6: { wallColor: colors.lightgrey, floorColor: colors.white, fogColor: colors.grey, effect: 'light bugs' },
    7: { wallColor: colors.blue, floorColor: colors.lightblue, fogColor: colors.cyan, effect: 'water' },
    8: { wallColor: colors.black, floorColor: colors.darkgrey, fogColor: colors.purple, effect: 'mist' },
    9: { wallColor: colors.lightgrey, floorColor: colors.cyan, fogColor: colors.white, effect: 'wind' },
    10: { wallColor: colors.red, floorColor: colors.black, fogColor: colors.darkgrey, effect: 'smoke' },
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
    3: [{ name: "Mimic Chest", hp: 25, attack: 12 }],
    4: [{ name: "Cave Slime", hp: 18, attack: 10 }, { name: "Giant Rat", hp: 12, attack: 12 }],
    5: [{ name: "Crypt Bat", hp: 20, attack: 15 }, { name: "Restless Zombie", hp: 30, attack: 12 }],
    6: [{ name: "Gargoyle", hp: 40, attack: 18 }, { name: "Blind Warden", hp: 50, attack: 22 }],
    7: [{ name: "Ink Elemental", hp: 50, attack: 22 }, { name: "Ghostly Scribe", hp: 35, attack: 28 }],
    8: [{ name: "Minotaur", hp: 70, attack: 28 }, { name: "Obsidian Golem", hp: 90, attack: 24 }],
    9: [{ name: "Chasm Crawler", hp: 80, attack: 35 }, { name: "Echo Wraith", hp: 60, attack: 42 }],
    10: [{ name: "Abyssal Knight", hp: 120, attack: 45 }, { name: "Throne Guard", hp: 100, attack: 40 }],
    11: [{ name: "Deep Dweller", hp: 160, attack: 55 }],
    12: [{ name: "Ruined Sentinel", hp: 200, attack: 70 }, { name: "Undead King", hp: 250, attack: 65 }],
    13: [{ name: "Bloodbat", hp: 180, attack: 85 }, { name: "Bloodstone Golem", hp: 300, attack: 75 }],
    14: [{ name: "Toxic Ooze", hp: 320, attack: 95 }, { name: "The Slime Lord", hp: 450, attack: 110 }],
    15: [{ name: "Vault Guardian", hp: 500, attack: 130 }],
    16: [{ name: "Rusted Automaton", hp: 450, attack: 150 }, { name: "Iron Giant", hp: 700, attack: 160 }],
    17: [{ name: "Shadow Priest", hp: 600, attack: 190 }, { name: "Void Cultist", hp: 500, attack: 210 }],
    18: [{ name: "Skeletal Wyrm", hp: 750, attack: 230 }, { name: "Bone Dragon", hp: 1000, attack: 250 }],
    19: [{ name: "Whispering Terror", hp: 900, attack: 280 }, { name: "Null Entity", hp: 850, attack: 310 }],
    20: [{ name: "The Depth Core", hp: 1500, attack: 400 }]
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
    inventory: ['Rusty Sword', 'Health Potion', 'Rusty Armor'],
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

    // Gemini's new properties tracking 
    levelSwordFound: false,
    levelArmorFound: false,
    torches: []
};
