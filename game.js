// game.js - Core glue: canvas setup, audio, constants, state, assets, map generation, game loop, init
// This is the main entry point. Other modules (renderer.js, entities.js, combat.js,
// movement.js, effects.js, ui.js, input.js) are loaded via script tags before this file.

// ============================================================
// Canvas Setup
// ============================================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');
minimapCtx.imageSmoothingEnabled = false;

// ============================================================
// Audio Context Setup
// ============================================================
let audioCtx;
let droneOsc = null;
let droneGain = null;
let musicGainNode, sfxGainNode;
let currentMusicContext = null;
let ambientTimerEvent = null;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicGainNode = audioCtx.createGain();
        musicGainNode.gain.value = document.getElementById('vol-music') ? parseFloat(document.getElementById('vol-music').value) : 0.5;
        musicGainNode.connect(audioCtx.destination);
        sfxGainNode = audioCtx.createGain();
        sfxGainNode.gain.value = document.getElementById('vol-sfx') ? parseFloat(document.getElementById('vol-sfx').value) : 0.5;
        sfxGainNode.connect(audioCtx.destination);
    } catch (e) {
        console.warn('Web Audio API not supported', e);
    }
}

function stopMusic() {
    if (currentMusicContext && currentMusicContext.stop) { currentMusicContext.stop(); }
    if (ambientTimerEvent) { clearTimeout(ambientTimerEvent); ambientTimerEvent = null; }
    if (droneOsc) { droneOsc.stop(); droneOsc.disconnect(); droneOsc = null; }
}

function playSplashMusic() {
    stopMusic();
    if (!audioCtx) return;
    let isPlaying = true;
    currentMusicContext = { stop: () => { isPlaying = false; } };
    let noteIdx = 0;
    const tempo = 120;
    const tickTime = 60 / (tempo * 4);
    let nextNoteTime = audioCtx.currentTime + 0.1;

    function schedule() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) { playFugueNote(nextNoteTime); nextNoteTime += tickTime; }
        requestAnimationFrame(schedule);
    }

    function playFugueNote(time) {
        const t = noteIdx % 64;
        let f = 0;
        const dMin = [293.66, 329.63, 349.23, 392.00, 440.00, 466.16, 523.25, 554.37, 587.33];
        if (t < 16) { const motif = [0, 2, 4, 3, 2, 1, 2, 0, 0, 2, 4, 3, 2, 1, 2, 0]; if (motif[t] !== null) f = dMin[motif[t]]; }
        else if (t < 32) { const motif = [1, 3, 5, 4, 3, 2, 3, 1, 1, 3, 5, 4, 3, 2, 3, 1]; if (motif[t - 16] !== null) f = dMin[motif[t - 16]]; }
        else if (t < 48) { const motif = [0, 4, 8, 4, 2, 4, 0, 4, 0, 4, 8, 4, 2, 4, 0, 4]; f = dMin[motif[t - 32]]; }
        else { const motif = [4, 7, 8, 7, 8, 7, 4, 7, 8, 7, 4, 2, 1, 0, 0, 0]; f = dMin[motif[t - 48]]; }
        noteIdx++;
        if (f === 0) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(musicGainNode);
        osc.start(time);
        osc.stop(time + 0.2);
    }
    schedule();
}

function playIntroMusic() {
    stopMusic();
    if (!audioCtx) return;
    let isPlaying = true;
    currentMusicContext = { stop: () => { isPlaying = false; } };
    let noteIdx = 0;
    const tempo = 180;
    const tickTime = 60 / (tempo * 4);
    let nextNoteTime = audioCtx.currentTime + 0.1;

    function schedule() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) { playDimNote(nextNoteTime); nextNoteTime += tickTime; }
        requestAnimationFrame(schedule);
    }

    function playDimNote(time) {
        const dim = [130.81, 155.56, 185.00, 220.00, 261.63, 311.13, 369.99, 440.00, 523.25, 622.25, 739.99, 880.00];
        const idx = Math.floor((Math.sin(noteIdx * 0.1) * 0.5 + 0.5) * (dim.length - 1));
        const idx2 = (idx + (noteIdx % 3)) % dim.length;
        const f = dim[idx2];
        noteIdx++;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
        gain.gain.linearRampToValueAtTime(0, time + 0.4);
        osc.connect(gain);
        gain.connect(musicGainNode);
        osc.start(time);
        osc.stop(time + 0.4);
    }
    schedule();
}

function playGameMusic() {
    stopMusic();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    let droneOsc = audioCtx.createOscillator();
    let droneGain = audioCtx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.value = 55;
    const droneLfo = audioCtx.createOscillator();
    droneLfo.type = 'sine';
    droneLfo.frequency.value = 0.1;
    const droneLfoGain = audioCtx.createGain();
    droneLfoGain.gain.value = 5;
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(droneOsc.frequency);
    droneGain.gain.value = 0.0;
    droneGain.gain.setTargetAtTime(0.3, now, 2.0);
    const droneFilter = audioCtx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 400;
    droneFilter.Q.value = 5;
    droneOsc.connect(droneGain);
    droneGain.connect(droneFilter);
    droneFilter.connect(musicGainNode);

    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; }

    const windSource1 = audioCtx.createBufferSource();
    windSource1.buffer = noiseBuffer;
    windSource1.loop = true;
    const windFilter1 = audioCtx.createBiquadFilter();
    windFilter1.type = 'lowpass';
    windFilter1.frequency.value = 100;
    windFilter1.Q.value = 3;
    const windLFO1 = audioCtx.createOscillator();
    windLFO1.type = 'sine';
    windLFO1.frequency.value = 0.15;
    const windLFOGain1 = audioCtx.createGain();
    windLFOGain1.gain.value = 400;
    windLFO1.connect(windLFOGain1);
    windLFOGain1.connect(windFilter1.frequency);
    const panner1 = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : audioCtx.createPanner();
    if (panner1.pan) panner1.pan.value = -0.6;
    const windGain1 = audioCtx.createGain();
    windGain1.gain.value = 0;
    windGain1.gain.setTargetAtTime(0.2, now, 5.0);
    windSource1.connect(windFilter1);
    windFilter1.connect(panner1);
    panner1.connect(windGain1);
    windGain1.connect(musicGainNode);

    const windSource2 = audioCtx.createBufferSource();
    windSource2.buffer = noiseBuffer;
    windSource2.loop = true;
    const windFilter2 = audioCtx.createBiquadFilter();
    windFilter2.type = 'lowpass';
    windFilter2.frequency.value = 150;
    windFilter2.Q.value = 2;
    const windLFO2 = audioCtx.createOscillator();
    windLFO2.type = 'sine';
    windLFO2.frequency.value = 0.22;
    const windLFOGain2 = audioCtx.createGain();
    windLFOGain2.gain.value = 300;
    windLFO2.connect(windLFOGain2);
    windLFOGain2.connect(windFilter2.frequency);
    const panner2 = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : audioCtx.createPanner();
    if (panner2.pan) panner2.pan.value = 0.6;
    const windGain2 = audioCtx.createGain();
    windGain2.gain.value = 0;
    windGain2.gain.setTargetAtTime(0.15, now, 5.0);
    windSource2.connect(windFilter2);
    windFilter2.connect(panner2);
    panner2.connect(windGain2);
    windGain2.connect(musicGainNode);

    droneLfo.start(); droneOsc.start();
    windSource1.start(); windLFO1.start();
    windSource2.start(); windLFO2.start();

    function triggerRandomAmbientEvent() {
        if (state.appState !== 'playing' && state.appState !== 'low_health') return;
        const eventType = Math.random();
        if (eventType < 0.4) { playDistantHowl(); } else { playDissonantPiano(); }
        const nextDelay = 3000 + Math.random() * 12000;
        ambientTimerEvent = setTimeout(triggerRandomAmbientEvent, nextDelay);
    }
    ambientTimerEvent = setTimeout(triggerRandomAmbientEvent, 2000);

    currentMusicContext = {
        stop: () => {
            droneOsc.stop(); droneLfo.stop();
            windSource1.stop(); windLFO1.stop();
            windSource2.stop(); windLFO2.stop();
        }
    };
}

function playDistantHowl() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const howlOsc = audioCtx.createOscillator();
    const howlGain = audioCtx.createGain();
    howlOsc.type = 'triangle';
    const freqs = [110, 146.8, 164.8, 220];
    howlOsc.frequency.value = freqs[Math.floor(Math.random() * freqs.length)];
    howlGain.gain.setValueAtTime(0, now);
    howlGain.gain.linearRampToValueAtTime(0.23, now + 2);
    howlGain.gain.linearRampToValueAtTime(0, now + 5);
    howlOsc.frequency.linearRampToValueAtTime(howlOsc.frequency.value * 0.95, now + 5);
    howlOsc.connect(howlGain);
    howlGain.connect(musicGainNode);
    howlOsc.start(now);
    howlOsc.stop(now + 5);
}

function playDissonantPiano() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const baseFreqs = [65.41, 73.42, 82.41, 110];
    const baseF = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
    const dissonances = [1.0594, 1.414];
    const dissF = baseF * dissonances[Math.floor(Math.random() * dissonances.length)];
    const attack = 0.05;
    const decay = 3.5;
    const delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.4;
    const feedbackGain = audioCtx.createGain();
    feedbackGain.gain.value = 0.5;
    const delayFilter = audioCtx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1200;
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayFilter);
    delayFilter.connect(delayNode);
    delayNode.connect(musicGainNode);
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.value = baseF;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + attack);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + decay);
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.value = dissF;
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + attack);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + decay);
    osc1.connect(gain1); gain1.connect(musicGainNode); gain1.connect(delayNode);
    osc2.connect(gain2); gain2.connect(musicGainNode); gain2.connect(delayNode);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + decay); osc2.stop(now + decay);
}

function playSound(type) {
    if (!audioCtx || !sfxGainNode) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(sfxGainNode);
    const now = audioCtx.currentTime;

    if (type === 'attack') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'death') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.5);
        const lfo = audioCtx.createOscillator();
        lfo.frequency.value = 10;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.2;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start(now); lfo.stop(now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'miss') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        const delayNode = audioCtx.createDelay();
        delayNode.delayTime.value = 0.25;
        const feedbackGain = audioCtx.createGain();
        feedbackGain.gain.value = 0.3;
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        gain.connect(sfxGainNode);
        delayNode.connect(sfxGainNode);
        gain.connect(delayNode);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
}

function playDeathMusic() {
    stopMusic();
    if (!audioCtx) return;
    currentMusicContext = audioCtx.currentTime;
    const notes = [
        { f: 130.81, d: 1 }, { f: 155.56, d: 1 },
        { f: 196.00, d: 1 }, { f: 130.81, d: 3 },
    ];
    let time = currentMusicContext;
    notes.forEach(n => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = n.f;
        osc.connect(gain);
        gain.connect(musicGainNode);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.5, time + 0.1);
        gain.gain.linearRampToValueAtTime(0, time + n.d - 0.1);
        osc.start(time); osc.stop(time + n.d);
        time += n.d;
    });
}

function playTransitionMusic() {
    stopMusic();
    if (!audioCtx) return;
    let isPlaying = true;
    currentMusicContext = { stop: () => { isPlaying = false; } };
    let noteIdx = 0;
    const tempo = 40;
    const tickTime = 60 / tempo;
    let nextNoteTime = audioCtx.currentTime + 0.1;

    function schedule() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) { playOrganChord(nextNoteTime); nextNoteTime += tickTime; }
        requestAnimationFrame(schedule);
    }

    function playOrganChord(time) {
        const seq = [
            [261.63, 311.13, 369.99],
            [246.94, 293.66, 349.23],
            [233.08, 277.18, 329.63],
            [220.00, 261.63, 311.13]
        ];
        const chord = seq[noteIdx % seq.length];
        const bass = chord[0] / 2;
        for (let f of [...chord, bass]) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.1);
            gain.gain.setValueAtTime(0.2, time + tickTime * 0.8);
            gain.gain.linearRampToValueAtTime(0, time + tickTime * 0.99);
            osc.connect(gain);
            gain.connect(musicGainNode);
            osc.start(time); osc.stop(time + tickTime);
        }
        noteIdx++;
    }
    schedule();
}

// ============================================================
// C64 Colors & Constants
// ============================================================
const colors = {
    black: '#000000', white: '#FFFFFF', red: '#880000', cyan: '#AAFFEE',
    purple: '#CC44CC', green: '#00CC55', blue: '#0000AA', yellow: '#EEEE77',
    orange: '#DD8855', brown: '#664400', lightred: '#FF7777', darkgrey: '#333333',
    grey: '#777777', lightgreen: '#AAFF66', lightblue: '#0088FF', lightgrey: '#BBBBBB'
};

const GAME_WIDTH = 400;
const GAME_HEIGHT = 300;

const DIRS = [
    { dx: 0, dy: -1 }, // N
    { dx: 1, dy: 0 },  // E
    { dx: 0, dy: 1 },  // S
    { dx: -1, dy: 0 }  // W
];

const LEVEL_NAMES = [
    "The Red Chambers", "The Green Depths", "The Shadow Crypts",
    "The Drowning Catacombs", "The Forgotten Crypt", "Halls of the Blind Warden",
    "The Sunken Library", "The Obsidian Labyrinth", "Chasm of Echoes",
    "The Abyssal Throne", "The Lower Depths", "Ruins of the Old Kings",
    "The Bloodstone Mines", "Caverns of the Slime Lord", "The Desolate Vault",
    "Tomb of the Iron Giant", "The Shadowed Sanctum", "Lair of the Bone Dragon",
    "The Whispering Void", "The Heart of the Depths"
];

function getLevelName(level) {
    if (level >= 1 && level <= LEVEL_NAMES.length) return LEVEL_NAMES[level - 1];
    return "Unknown Depths";
}

const LEVEL_WEAPONS = [
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

const LEVEL_ARMOR = [
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

const BESTIARY = {
    3: [{ name: "Mimic Chest", hp: 25, attack: 12 }],
    4: [{ name: "Cave Slime", hp: 18, attack: 10 }, { name: "Giant Rat", hp: 12, attack: 12 }],
    5: [{ name: "Mimic Chest", hp: 25, attack: 12 }, { name: "Cave Slime", hp: 18, attack: 10 }, { name: "Giant Rat", hp: 12, attack: 12 }, { name: "Wraith", hp: 20, attack: 15 }, { name: "Restless Zombie", hp: 30, attack: 12 }, { name: "Skrronzor the Level Boss", hp: 120, attack: 30, isBoss: true }],
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

// ============================================================
// Game State
// ============================================================
const state = {
    appState: 'splash',
    deathTime: 0,
    turnTick: 0,
    level: 1,
    player: {
        x: 1, y: 1, dir: 0,
        hp: 20, maxHp: 20,
        gold: -1000,
        attack: 1,
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
    debtPaidOff: false,
    levelSwordFound: false,
    levelArmorFound: false,
    torches: []
};

// ============================================================
// Image Assets
// ============================================================
const skeletonImg = new Image(); let skeletonLoaded = false;
skeletonImg.onload = () => { skeletonLoaded = true; }; skeletonImg.src = "c64_skeleton.png";

const robeSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60">
    <path d="M 15 0 Q 20 -2 25 0 L 28 10 L 12 10 Z" fill="#220044"/>
    <path d="M 12 10 Q 15 15 11 20 L 10 45 Q 15 50 18 45 L 18 20 Q 16 15 15 10 Z" fill="#330055"/>
    <path d="M 28 10 Q 25 15 29 20 L 30 45 Q 25 50 22 45 L 22 20 Q 24 15 25 10 Z" fill="#330055"/>
    <path d="M 15 0 Q 20 -2 25 0 Q 27 2 28 5 Q 20 2 12 5 Q 13 2 15 0 Z" fill="#440066"/>
    <path d="M 12 5 Q 15 10 14 13 L 12 10 Z" fill="#440066"/>
    <path d="M 28 5 Q 25 10 26 13 L 28 10 Z" fill="#440066"/>
</svg>`;
const robeImg = new Image(); let robeLoaded = false;
robeImg.onload = () => { robeLoaded = true; };
robeImg.src = 'data:image/svg+xml;base64,' + btoa(robeSVG);

const spiderImg = new Image(); let spiderLoaded = false;
spiderImg.onload = () => { spiderLoaded = true; }; spiderImg.src = 'c64_spider_final.png';

const ghoulImg = new Image(); let ghoulLoaded = false;
ghoulImg.onload = () => { ghoulLoaded = true; }; ghoulImg.src = 'c64_ghoul_final.png';

const wraithImg = new Image(); let wraithLoaded = false;
wraithImg.onload = () => { wraithLoaded = true; }; wraithImg.src = "c64_wraith.png";

const caveSlimeImg = new Image(); let caveSlimeLoaded = false;
caveSlimeImg.onload = () => { caveSlimeLoaded = true; }; caveSlimeImg.src = "cave_slime.png?v=2";

const giantRatImg = new Image(); let giantRatLoaded = false;
giantRatImg.onload = () => { giantRatLoaded = true; }; giantRatImg.src = "giant_rat.png?v=2";

const mimicChestImg = new Image(); let mimicChestLoaded = false;
mimicChestImg.onload = () => { mimicChestLoaded = true; }; mimicChestImg.src = "mimic_chest.png?v=2";

const restlessZombieImg = new Image(); let restlessZombieLoaded = false;
restlessZombieImg.onload = () => { restlessZombieLoaded = true; }; restlessZombieImg.src = "restless_zombie.png?v=2";

const blindWardenImg = new Image(); let blindWardenLoaded = false;
blindWardenImg.onload = () => { blindWardenLoaded = true; }; blindWardenImg.src = "blind_warden.png?v=3";

const gargoyleImg = new Image(); let gargoyleLoaded = false;
gargoyleImg.onload = () => { gargoyleLoaded = true; }; gargoyleImg.src = "gargoyle_asset.png?v=1";

const ghostlyScribeImg = new Image(); let ghostlyScribeLoaded = false;
ghostlyScribeImg.onload = () => { ghostlyScribeLoaded = true; }; ghostlyScribeImg.src = "ghostly_scribe.png?v=3";

const inkElementalImg = new Image(); let inkElementalLoaded = false;
inkElementalImg.onload = () => { inkElementalLoaded = true; }; inkElementalImg.src = "ink_elemental.png?v=1";

const echoWraithImg = new Image(); let echoWraithLoaded = false;
echoWraithImg.onload = () => { echoWraithLoaded = true; }; echoWraithImg.src = "echo_wraith.png?v=3";

const chasmCrawlerImg = new Image(); let chasmCrawlerLoaded = false;
chasmCrawlerImg.onload = () => { chasmCrawlerLoaded = true; }; chasmCrawlerImg.src = "chasm_crawler.png?v=1";

const minotaurImg = new Image(); let minotaurLoaded = false;
minotaurImg.onload = () => { minotaurLoaded = true; }; minotaurImg.src = "minotaur.png?v=2";

const obsidianGolemImg = new Image(); let obsidianGolemLoaded = false;
obsidianGolemImg.onload = () => { obsidianGolemLoaded = true; }; obsidianGolemImg.src = "obsidian_golem.png?v=1";

const abyssalKnightImg = new Image(); let abyssalKnightLoaded = false;
abyssalKnightImg.onload = () => { abyssalKnightLoaded = true; }; abyssalKnightImg.src = "abyssal_knight.png?v=2";

const throneGuardImg = new Image(); let throneGuardLoaded = false;
throneGuardImg.onload = () => { throneGuardLoaded = true; }; throneGuardImg.src = "throne_guard.png?v=1";

const abyssiusImg = new Image(); let abyssiusLoaded = false;
abyssiusImg.onload = () => { abyssiusLoaded = true; }; abyssiusImg.src = "abyssius.png?v=1";

const deepDwellerImg = new Image(); let deepDwellerLoaded = false;
deepDwellerImg.onload = () => { deepDwellerLoaded = true; }; deepDwellerImg.src = "deep_dweller.png?v=2";

const undeadKingImg = new Image(); let undeadKingLoaded = false;
undeadKingImg.onload = () => { undeadKingLoaded = true; }; undeadKingImg.src = "undead_king.png?v=2";

const bloodstoneGolemImg = new Image(); let bloodstoneGolemLoaded = false;
bloodstoneGolemImg.onload = () => { bloodstoneGolemLoaded = true; }; bloodstoneGolemImg.src = "bloodstone_golem.png?v=2";

const slimeLordImg = new Image(); let slimeLordLoaded = false;
slimeLordImg.onload = () => { slimeLordLoaded = true; }; slimeLordImg.src = "slime_lord.png?v=2";

const vaultGuardianImg = new Image(); let vaultGuardianLoaded = false;
vaultGuardianImg.onload = () => { vaultGuardianLoaded = true; }; vaultGuardianImg.src = "vault_guardian.png?v=2";

const ironGiantImg = new Image(); let ironGiantLoaded = false;
ironGiantImg.onload = () => { ironGiantLoaded = true; }; ironGiantImg.src = "iron_giant.png?v=2";

const voidCultistImg = new Image(); let voidCultistLoaded = false;
voidCultistImg.onload = () => { voidCultistLoaded = true; }; voidCultistImg.src = "void_cultist.png?v=2";

const boneDragonImg = new Image(); let boneDragonLoaded = false;
boneDragonImg.onload = () => { boneDragonLoaded = true; }; boneDragonImg.src = "bone_dragon.png?v=2";

const whisperingTerrorImg = new Image(); let whisperingTerrorLoaded = false;
whisperingTerrorImg.onload = () => { whisperingTerrorLoaded = true; }; whisperingTerrorImg.src = "whispering_terror.png?v=2";

const depthCoreImg = new Image(); let depthCoreLoaded = false;
depthCoreImg.onload = () => { depthCoreLoaded = true; }; depthCoreImg.src = "depth_core.png?v=2";

// SVG-based item sprites
const potionImg = new Image(); let potionLoaded = false;
potionImg.onload = () => { potionLoaded = true; };
potionImg.src = 'health_potion.png?v=2';

const chestSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 24"><rect x="0" y="4" width="32" height="20" rx="2" fill="#664400"/><rect x="0" y="4" width="32" height="10" fill="#884400"/><rect x="13" y="10" width="6" height="6" rx="1" fill="#EEEE77"/><rect x="0" y="13" width="32" height="2" fill="#333333"/></svg>`;
const chestImg = new Image(); let chestLoaded = false;
chestImg.onload = () => { chestLoaded = true; };
chestImg.src = 'data:image/svg+xml;base64,' + btoa(chestSVG);

const fountainImg = new Image(); let fountainLoaded = false;
fountainImg.onload = () => { fountainLoaded = true; };
fountainImg.src = "fountain_asset.png?v=38";

const swordImg = new Image(); let swordLoaded = false;
swordImg.onload = () => { swordLoaded = true; };
swordImg.src = "c64_sword.png";

const keyImg = new Image(); let keyLoaded = false;
keyImg.onload = () => { keyLoaded = true; };
keyImg.src = "gold_asset.png?v=38";

const blackKeyImg = new Image(); let blackKeyLoaded = false;
blackKeyImg.onload = () => { blackKeyLoaded = true; };
blackKeyImg.src = "black_asset.png?v=38";

const spikeUpSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <g stroke="#000000" stroke-width="1">
            <path d="M 25 80 L 30 0 L 35 80 Z" fill="#BBBBBB" />
            <path d="M 45 80 L 50 0 L 55 80 Z" fill="#BBBBBB" />
            <path d="M 65 80 L 70 0 L 75 80 Z" fill="#BBBBBB" />
            <rect x="15" y="80" width="70" height="10" fill="#333333" />
        </g>
    </svg>`;
const spikeUpImg = new Image(); let spikeUpLoaded = false;
spikeUpImg.onload = () => { spikeUpLoaded = true; };
spikeUpImg.src = 'data:image/svg+xml;base64,' + btoa(spikeUpSVG);

const spikeDownSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <g stroke="#000000" stroke-width="1">
            <ellipse cx="30" cy="85" rx="8" ry="4" fill="#000000" />
            <ellipse cx="50" cy="85" rx="8" ry="4" fill="#000000" />
            <ellipse cx="70" cy="85" rx="8" ry="4" fill="#000000" />
            <rect x="15" y="80" width="70" height="10" fill="#333333" />
        </g>
    </svg>`;
const spikeDownImg = new Image(); let spikeDownLoaded = false;
spikeDownImg.onload = () => { spikeDownLoaded = true; };
spikeDownImg.src = 'data:image/svg+xml;base64,' + btoa(spikeDownSVG);

// ============================================================
// Map Generation (kept here as it's tightly coupled to state)
// ============================================================
function generateMap(W, H) {
    const map = Array(H).fill(0).map(() => Array(W).fill(1));

    // Simple room/corridor carving
    const rooms = [];
    const roomCount = 5 + Math.floor(Math.random() * 4);

    for (let i = 0; i < roomCount; i++) {
        let rw = 3 + Math.floor(Math.random() * 4);
        let rh = 3 + Math.floor(Math.random() * 4);
        let rx = 1 + Math.floor(Math.random() * (W - rw - 2));
        let ry = 1 + Math.floor(Math.random() * (H - rh - 2));

        for (let y = ry; y < ry + rh; y++) {
            for (let x = rx; x < rx + rw; x++) {
                map[y][x] = 0;
            }
        }
        rooms.push({ x: rx + Math.floor(rw / 2), y: ry + Math.floor(rh / 2) });
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        let from = rooms[i - 1];
        let to = rooms[i];
        let x = from.x, y = from.y;

        while (x !== to.x) {
            map[y][x] = 0;
            x += x < to.x ? 1 : -1;
        }
        while (y !== to.y) {
            map[y][x] = 0;
            y += y < to.y ? 1 : -1;
        }
    }

    // Find safe start point
    let startFound = false;
    for (let y = 1; y < H - 1 && !startFound; y++) {
        for (let x = 1; x < H - 1 && !startFound; x++) {
            if (map[y][x] === 0) {
                state.player.x = x;
                state.player.y = y;
                startFound = true;
            }
        }
    }

    // Place exit door (2) far from start
    let exitPlaced = false;
    for (let y = H - 2; y > 0 && !exitPlaced; y--) {
        for (let x = W - 2; x > 0 && !exitPlaced; x--) {
            if (map[y][x] === 0 && (x !== state.player.x || y !== state.player.y)) {
                map[y][x] = 2;
                exitPlaced = true;
            }
        }
    }

    // Spawn enemies
    state.enemies = [];
    state.items = [];
    state.torches = [];
    let spawned = 0;

    const getOpenness = (cx, cy) => {
        let emptyCount = 0;
        for (let yy = -1; yy <= 1; yy++) {
            for (let xx = -1; xx <= 1; xx++) {
                if (map[cy + yy] && map[cy + yy][cx + xx] === 0) emptyCount++;
            }
        }
        return emptyCount;
    };

    const trySpawnEnemy = (type, lvl) => {
        for (let attempts = 0; attempts < 100; attempts++) {
            let x = Math.floor(Math.random() * (W - 2)) + 1;
            let y = Math.floor(Math.random() * (H - 2)) + 1;
            const distToPlayer = Math.abs(x - state.player.x) + Math.abs(y - state.player.y);
            if (map[y][x] === 0 && distToPlayer >= 3) {
                if (!state.enemies.find(e => e.x === x && e.y === y)) {
                    const openness = getOpenness(x, y);
                    const isRoom = openness >= 6;
                    const isCorridor = openness <= 5;

                    let validPlacement = false;
                    const alwaysInRoom = !['Skeleton', 'Wraith'].includes(type);
                    const isHighLevel = lvl >= 3 || alwaysInRoom;
                    if (isHighLevel && isRoom) validPlacement = true;
                    if (!isHighLevel && isCorridor) validPlacement = true;
                    if (attempts > 80 && !isHighLevel) validPlacement = true;

                    if (validPlacement) {
                        const bestiaryFloor = BESTIARY[state.level];
                        const monsterDef = bestiaryFloor?.find(m => m.name === type);
                        let hp = monsterDef
                            ? Math.ceil(monsterDef.hp * (0.9 + lvl * 0.1))
                            : 10 + (lvl * 4);

                        if (!monsterDef) {
                            if (type === 'Cloaked Skeleton') hp = 10 + (lvl * 5);
                            else if (type === 'Ghoul' || type === 'Spider') hp = Math.ceil((10 + (lvl * 5)) * 1.1);
                        }

                        const extraProps = type === 'Mimic Chest' ? { disguised: true } : {};
                        state.enemies.push({ x, y, hp: hp, maxHp: hp, type: type, level: lvl, state: 'idle', name: type, ...extraProps });
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const levelEnemyPools = {
        1: null,
        2: ['Skeleton', 'Skeleton', 'Wraith'],
        3: ['Cloaked Skeleton', 'Mimic Chest', 'Cloaked Skeleton'],
        4: ['Cave Slime', 'Giant Rat', 'Cave Slime', 'Giant Rat'],
        5: ['Skeleton', 'Wraith', 'Cloaked Skeleton', 'Mimic Chest', 'Cave Slime', 'Giant Rat', 'Wraith', 'Restless Zombie'],
        6: ['Gargoyle', 'Blind Warden', 'Gargoyle'],
        7: ['Ink Elemental', 'Ghostly Scribe', 'Ink Elemental'],
        8: ['Minotaur', 'Obsidian Golem'],
        9: ['Chasm Crawler', 'Echo Wraith'],
        10: ['Abyssal Knight', 'Throne Guard'],

        11: ['Deep Dweller'],
        12: ['Ruined Sentinel', 'Undead King'],
        13: ['Bloodbat', 'Bloodstone Golem', 'Bloodbat'],
        14: ['Toxic Ooze', 'The Slime Lord'],
        15: ['Vault Guardian'],
        16: ['Rusted Automaton', 'Iron Giant'],
        17: ['Shadow Priest', 'Void Cultist'],
        18: ['Skeletal Wyrm', 'Bone Dragon'],
        19: ['Whispering Terror', 'Null Entity'],
        20: ['The Depth Core'],
    };

    let goldKeyDropped = false;

    if (state.level === 1) {
        for (let skLvl = 1; skLvl <= 5; skLvl++) {
            if (trySpawnEnemy('Skeleton', skLvl)) spawned++;
        }
    } else if (state.level >= 6) {
        // Spawn 5 of each unique enemy type for this level (levels 1-5)
        const pool = levelEnemyPools[state.level] || levelEnemyPools[3];
        const uniqueTypes = [...new Set(pool)];
        for (const type of uniqueTypes) {
            for (let lvl = 1; lvl <= 5; lvl++) {
                if (trySpawnEnemy(type, lvl)) spawned++;
            }
        }
        // Plus some random previous monsters
        const allPrevTypes = [];
        for (let l = 2; l < state.level; l++) {
            if (levelEnemyPools[l]) {
                for (const t of levelEnemyPools[l]) allPrevTypes.push(t);
            }
        }
        if (allPrevTypes.length > 0) {
            const numExtra = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numExtra; i++) {
                const type = allPrevTypes[Math.floor(Math.random() * allPrevTypes.length)];
                const lvl = 1 + Math.floor(Math.random() * 5);
                if (trySpawnEnemy(type, lvl)) spawned++;
            }
        }
    } else {
        const pool = levelEnemyPools[state.level] || levelEnemyPools[3];
        const numEnemies = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numEnemies; i++) {
            const type = pool[Math.floor(Math.random() * pool.length)];
            const lvl = 1 + Math.floor(Math.random() * Math.min(state.level, 5));
            if (trySpawnEnemy(type, lvl)) spawned++;
        }

        // Spawn boss on boss levels (every 5th) — force-place in a room
        if (state.level % 5 === 0) {
            const bossEntry = (BESTIARY[state.level] || []).find(e => e.isBoss);
            if (bossEntry) {
                let bossPlaced = false;
                for (let attempts = 0; attempts < 200 && !bossPlaced; attempts++) {
                    let x = Math.floor(Math.random() * (W - 2)) + 1;
                    let y = Math.floor(Math.random() * (H - 2)) + 1;
                    if (map[y][x] === 0 && (x !== state.player.x || y !== state.player.y) &&
                        !state.enemies.find(e => e.x === x && e.y === y)) {
                        state.enemies.push({
                            x, y, hp: bossEntry.hp, maxHp: bossEntry.hp,
                            attack: bossEntry.attack, type: bossEntry.name,
                            level: state.level, state: 'idle', name: bossEntry.name,
                            isBoss: true, dropsGoldKey: true
                        });
                        bossPlaced = true;
                        spawned++;
                    }
                }
            }
        }
    }

    if (state.level === 1) {
        const lvl5 = state.enemies.find(e => e.level === 5);
        if (lvl5) {
            state.items.push({ x: lvl5.x, y: lvl5.y, type: 'key', name: 'Gold Key' });
            goldKeyDropped = true;
        }
    } else if (state.level % 5 === 0) {
        // Boss levels: boss drops the gold key, don't place it on the ground
        goldKeyDropped = state.enemies.some(e => e.dropsGoldKey);
    } else {
        const floorPool = levelEnemyPools[state.level] || levelEnemyPools[3];
        const lvl5Pool = floorPool.filter(t => t !== 'Mimic Chest');
        const nonRepeated = [...new Set(lvl5Pool)];
        const goldKeyCarrier = nonRepeated[Math.floor(Math.random() * nonRepeated.length)];
        if (trySpawnEnemy(goldKeyCarrier, 5)) {
            spawned++;
            const keyBearer = state.enemies[state.enemies.length - 1];
            state.items.push({ x: keyBearer.x, y: keyBearer.y, type: 'key', name: 'Gold Key' });
            goldKeyDropped = true;
        }
    }

    if (!goldKeyDropped) {
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Math.floor(Math.random() * (W - 2)) + 1;
            const y = Math.floor(Math.random() * (H - 2)) + 1;
            if (map[y][x] === 0 && (x !== state.player.x || y !== state.player.y)) {
                state.items.push({ x, y, type: 'key', name: 'Gold Key' });
                break;
            }
        }
    }

    if (state.level >= 2) {
        let fountainPlaced = false;
        for (let attempts = 0; attempts < 500 && !fountainPlaced; attempts++) {
            let x = Math.floor(Math.random() * (W - 2)) + 1;
            let y = Math.floor(Math.random() * (H - 2)) + 1;
            if (map[y][x] === 0 && (x !== state.player.x || y !== state.player.y)) {
                // Only place in open areas (rooms), not corridors
                const openness = getOpenness(x, y);
                if (openness >= 6 || attempts > 400) {
                    state.items.push({ x, y, type: 'fountain', name: 'Save Fountain', persistent: true });
                    fountainPlaced = true;
                }
            }
        }
    }

    // Potions only come from secret walls, monster drops, and chests — no floor spawns

    if (state.level >= 2) {
        const floorPool = levelEnemyPools[state.level] || levelEnemyPools[3];
        const extraCount = state.level === 2 ? 3 : Math.min(4, Math.floor(state.level / 3));
        let extraSpawned = 0;
        for (let att = 0; att < 50 && extraSpawned < extraCount; att++) {
            const type = floorPool[Math.floor(Math.random() * floorPool.length)];
            if (type === 'Mimic Chest') continue;
            const lvl = Math.min(5, Math.floor(Math.random() * Math.min(state.level, 5)) + 1);
            if (trySpawnEnemy(type, lvl)) { extraSpawned++; spawned++; }
        }
    }

    state.quest.totalEnemies = spawned;
    state.quest.slainEnemies = 0;
    state.quest.completed = false;
    state.quest.secretsFound = 0;
    state.quest.totalSecrets = 0;

    // Locked rooms
    const numLockedRooms = 2;
    let roomsCarved = 0;
    let validAnchors = [];

    for (let y = 2; y < H - 2; y++) {
        for (let x = 2; x < W - 2; x++) {
            if (map[y][x] === 1) {
                let floorCount = 0;
                let cdx = 0, cdy = 0;
                if (map[y - 1][x] === 0) { floorCount++; cdy = 1; }
                if (map[y + 1][x] === 0) { floorCount++; cdy = -1; }
                if (map[y][x - 1] === 0) { floorCount++; cdx = 1; }
                if (map[y][x + 1] === 0) { floorCount++; cdx = -1; }

                if (floorCount === 1) {
                    let validRock = true;
                    let centerRoomX = x + cdx * 2;
                    let centerRoomY = y + cdy * 2;

                    for (let ry = centerRoomY - 2; ry <= centerRoomY + 2; ry++) {
                        for (let rx = centerRoomX - 2; rx <= centerRoomX + 2; rx++) {
                            if (rx < 1 || rx >= W - 1 || ry < 1 || ry >= H - 1) { validRock = false; break; }
                            if (map[ry][rx] !== 1 && !(rx === x && ry === y)) { validRock = false; break; }
                        }
                        if (!validRock) break;
                    }
                    if (validRock) {
                        validAnchors.push({ x, y, cdx, cdy, centerRoomX, centerRoomY });
                    }
                }
            }
        }
    }

    validAnchors.sort(() => Math.random() - 0.5);

    for (let i = 0; i < validAnchors.length && roomsCarved < numLockedRooms; i++) {
        let a = validAnchors[i];
        if (map[a.y][a.x] !== 1) continue;
        map[a.y][a.x] = 4;

        for (let ry = a.centerRoomY - 1; ry <= a.centerRoomY + 1; ry++) {
            for (let rx = a.centerRoomX - 1; rx <= a.centerRoomX + 1; rx++) {
                map[ry][rx] = 0;
            }
        }

        if (roomsCarved === 0) {
            const weapon = LEVEL_WEAPONS[Math.min(state.level - 1, LEVEL_WEAPONS.length - 1)];
            state.items.push({ x: a.centerRoomX, y: a.centerRoomY, type: 'weapon', name: weapon.name, attackBonus: weapon.attackBonus });
            const armorData = LEVEL_ARMOR[Math.min(state.level - 1, LEVEL_ARMOR.length - 1)];
            state.items.push({ x: a.centerRoomX + 1, y: a.centerRoomY, type: 'armor', name: armorData.name, defenseBonus: armorData.defenseBonus });
        } else {
            state.items.push({ x: a.centerRoomX, y: a.centerRoomY, type: 'Black Key', name: 'Black Key' });
            if (state.level === 3) {
                state.items.push({ x: a.centerRoomX + 1, y: a.centerRoomY, type: 'torch', name: 'Torch' });
            }
        }
        roomsCarved++;
    }

    if (roomsCarved === 0) {
        map[2][3] = 4;
        map[2][4] = 0; map[2][5] = 0; map[2][6] = 0;
        map[3][4] = 0; map[3][5] = 0; map[3][6] = 0;
        map[4][4] = 0; map[4][5] = 0; map[4][6] = 0;
        for (let yy = 1; yy <= 5; yy++) {
            for (let xx = 3; xx <= 7; xx++) {
                if (map[yy][xx] !== 0 && map[yy][xx] !== 4) map[yy][xx] = 1;
            }
        }
        map[2][2] = 0; map[2][1] = 0;
        state.items.push({ x: 5, y: 3, type: 'Black Key', name: 'Black Key' });
    }

    // Chests at dead ends
    const numChests = Math.floor(Math.random() * 5);
    let deadEnds = [];
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            if (map[y][x] === 0) {
                let walls = 0;
                if (map[y - 1][x] === 1) walls++;
                if (map[y + 1][x] === 1) walls++;
                if (map[y][x - 1] === 1) walls++;
                if (map[y][x + 1] === 1) walls++;
                if (walls >= 3 && (x !== state.player.x || y !== state.player.y)) {
                    deadEnds.push({ x, y });
                }
            }
        }
    }
    deadEnds.sort(() => Math.random() - 0.5);
    let chestsSpawned = 0;
    while (chestsSpawned < numChests && deadEnds.length > 0) {
        let spot = deadEnds.pop();
        if (!state.items.find(i => i.x === spot.x && i.y === spot.y)) {
            state.items.push({ x: spot.x, y: spot.y, type: 'chest', name: 'Chest' });
            chestsSpawned++;
        }
    }

    // Armor only drops in mystery rooms (placed alongside weapon above)

    // Spikes
    const numSpikes = Math.floor(Math.random() * 5) + 1;
    let spikesSpawned = 0;
    let attempts = 0;
    while (spikesSpawned < numSpikes && attempts < 100) {
        attempts++;
        let x = Math.floor(Math.random() * (W - 2)) + 1;
        let y = Math.floor(Math.random() * (H - 2)) + 1;
        if (map[y][x] === 0 && (x !== state.player.x || y !== state.player.y)) {
            map[y][x] = 3;
            spikesSpawned++;
        }
    }

    // Flood-fill reachability
    const reachable = Array(H).fill(0).map(() => Array(W).fill(false));
    const walkable = t => t === 0 || t === 3 || t === 5 || t === 7 || t === 8 || t === 9;
    const queue = [{ x: state.player.x, y: state.player.y }];
    reachable[state.player.y][state.player.x] = true;
    while (queue.length > 0) {
        const { x: fx, y: fy } = queue.shift();
        for (const [dy, dx] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            const nx = fx + dx, ny = fy + dy;
            if (nx > 0 && nx < W-1 && ny > 0 && ny < H-1 && !reachable[ny][nx] && walkable(map[ny][nx])) {
                reachable[ny][nx] = true;
                queue.push({ x: nx, y: ny });
            }
        }
    }

    // Secret walls
    let wallCoords = [];
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            if (map[y][x] === 1) {
                const adjReachable = [[-1,0],[1,0],[0,-1],[0,1]].some(([dy, dx]) => reachable[y+dy]?.[x+dx]);
                if (adjReachable) wallCoords.push({ x, y });
            }
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
                if (map[y + dy][x + dx] === 5) hasAdjacentSecret = true;
            }
        }
        if (!hasAdjacentSecret) {
            map[y][x] = 5;
            placedSecrets++;
        }
    }
    state.quest.totalSecrets = placedSecrets;

    state.turnTick = 0;

    // Fog of war
    state.explored = Array(H).fill(0).map(() => Array(W).fill(false));
    if (typeof revealFog === 'function') revealFog();

    // Mist
    state.mistParticles = [];
    if (state.level === 1 || state.level === 2) {
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
        // Blue mist particles
        for (let i = 0; i < 30; i++) {
            state.mistParticles.push({
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT * 0.5 + Math.random() * (GAME_HEIGHT * 0.5),
                speed: 0.1 + Math.random() * 0.4,
                size: 10 + Math.random() * 30,
                opacity: 0.03 + Math.random() * 0.1
            });
        }
        // Dripping water drops
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
        // Puddles on the floor
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
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT * 0.2 + Math.random() * (GAME_HEIGHT * 0.7),
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
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT * 0.2 + Math.random() * (GAME_HEIGHT * 0.7),
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
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT * 0.1 + Math.random() * (GAME_HEIGHT * 0.8),
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
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT * 0.2 + Math.random() * (GAME_HEIGHT * 0.7),
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
                x: 20 + Math.random() * (GAME_WIDTH - 40),
                y: Math.random() * (GAME_HEIGHT * 0.2),
                speed: 0.8 + Math.random() * 1.5,
                size: 1.5 + Math.random() * 2,
                opacity: 0.3 + Math.random() * 0.4,
                splashTimer: 0
            });
        }
        for (let i = 0; i < 40; i++) {
            state.mistParticles.push({
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT * 0.15 + Math.random() * (GAME_HEIGHT * 0.7),
                speed: 0.3 + Math.random() * 0.9,
                size: 10 + Math.random() * 22,
                opacity: 0.05 + Math.random() * 0.1
            });
        }
    }

    // Level 6 - Halls of the Blind Warden: mist + dust particles
    if (state.level === 6) {
        for (let i = 0; i < 50; i++) {
            state.mistParticles.push({
                x: Math.random() * GAME_WIDTH,
                y: GAME_HEIGHT * 0.15 + Math.random() * (GAME_HEIGHT * 0.75),
                speed: 0.4 + Math.random() * 1.2,
                size: 10 + Math.random() * 25,
                opacity: 0.06 + Math.random() * 0.12
            });
        }
    }

    // Torches for level 3
    if (state.level === 3) {
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                if (map[y][x] === 1) {
                    if (map[y-1][x] === 0 || map[y+1][x] === 0 || map[y][x-1] === 0 || map[y][x+1] === 0) {
                        if (Math.random() < 0.12) {
                            state.torches.push({ x, y });
                        }
                    }
                }
            }
        }
    }

    return map;
}

// ============================================================
// Game Loop
// ============================================================
function gameLoop() {
    let needsRender = false;

    for (let i = state.animations.length - 1; i >= 0; i--) {
        state.animations[i].timer--;
        needsRender = true;
        if (state.animations[i].timer <= 0) {
            state.animations.splice(i, 1);
        }
    }

    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const e = state.enemies[i];
        if (e.state === 'dead') {
            e.deathTimer--;
            needsRender = true;
            if (e.deathTimer <= 0) {
                state.enemies.splice(i, 1);
            }
        }
    }

    // Always render on levels with ambient effects (mist, particles, drips)
    const hasAmbientEffects = state.level >= 4;
    if (needsRender || hasAmbientEffects) render();
    requestAnimationFrame(gameLoop);
}

// ============================================================
// Initialization
// ============================================================
function init() {
    bindControls();
    updateUIState();

    const btnStart = document.getElementById('btn-start');
    // In-game confirm dialog
    const confirmOverlay = document.getElementById('confirm-overlay');
    const confirmText = document.getElementById('confirm-text');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
    let confirmCallback = null;

    window.showConfirm = function(message, onYes) {
        confirmText.innerText = message;
        confirmOverlay.classList.remove('hidden');
        confirmCallback = onYes;
    };

    confirmYes.addEventListener('click', () => {
        confirmOverlay.classList.add('hidden');
        if (confirmCallback) confirmCallback();
        confirmCallback = null;
    });

    confirmNo.addEventListener('click', () => {
        confirmOverlay.classList.add('hidden');
        confirmCallback = null;
    });

    // Save game with name input
    const saveOverlay = document.getElementById('save-overlay');
    const saveNameInput = document.getElementById('save-name-input');
    const saveConfirmBtn = document.getElementById('save-confirm');
    const saveCancelBtn = document.getElementById('save-cancel');

    window.saveGame = function(name) {
        const saveData = {
            name: name || 'Unnamed Save',
            date: new Date().toISOString(),
            level: state.level,
            state: JSON.parse(JSON.stringify(state))
        };
        let saves = JSON.parse(localStorage.getItem('c64_dungeon_saves') || '[]');
        saves.push(saveData);
        // Sort newest first, keep only 5
        saves.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (saves.length > 5) saves = saves.slice(0, 5);
        localStorage.setItem('c64_dungeon_saves', JSON.stringify(saves));
        localStorage.setItem('c64_dungeon_save_v2', JSON.stringify(state));
    };

    window.loadMostRecentSave = function() {
        // Try named saves first, fall back to quicksave
        let saves = JSON.parse(localStorage.getItem('c64_dungeon_saves') || '[]');
        if (saves.length > 0) {
            // Sort by date descending
            saves.sort((a, b) => new Date(b.date) - new Date(a.date));
            return saves[0];
        }
        const qs = localStorage.getItem('c64_dungeon_save_v2');
        if (qs) {
            return { name: 'Quicksave', date: new Date().toISOString(), state: JSON.parse(qs) };
        }
        return null;
    };

    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            if (state.appState !== 'playing' && state.appState !== 'menu' && state.appState !== 'low_health') return;
            saveNameInput.value = '';
            saveOverlay.classList.remove('hidden');
            saveNameInput.focus();
        });
    }

    saveConfirmBtn.addEventListener('click', () => {
        const name = saveNameInput.value.trim() || 'Unnamed Save';
        saveGame(name);
        saveOverlay.classList.add('hidden');
        showConfirm(`Game saved as "${name}"!`, () => {});
    });

    saveNameInput.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Prevent game controls while typing
        if (e.code === 'Enter') saveConfirmBtn.click();
        if (e.code === 'Escape') saveCancelBtn.click();
    });

    saveCancelBtn.addEventListener('click', () => {
        saveOverlay.classList.add('hidden');
    });

    // Depths map close on click
    const depthsMapOverlay = document.getElementById('depths-map-overlay');
    if (depthsMapOverlay) {
        depthsMapOverlay.addEventListener('click', () => {
            depthsMapOverlay.classList.add('hidden');
        });
    }

    const btnExit = document.getElementById('btn-exit');
    if (btnExit) {
        btnExit.addEventListener('click', () => {
            showConfirm('Are you sure you want to exit? All unsaved progress will be lost.', () => {
                location.reload();
            });
        });
    }

    const btnLoad = document.getElementById('btn-load');
    const splashScreen = document.getElementById('splash-screen');
    const introScreen = document.getElementById('intro-screen');
    const infoOverlay = document.getElementById('info-overlay');
    const btnInfo = document.getElementById('btn-info');
    const btnCloseInfo = document.getElementById('btn-close-info');

    const btnMenu = document.getElementById('btn-menu');
    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            state.appState = 'menu';
            splashScreen.style.display = 'flex';
            document.getElementById('btn-resume').classList.remove('hidden');
            playSplashMusic();
        });
    }

    const btnRestart = document.getElementById('btn-restart-level');
    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            if (state.appState !== 'playing') return;
            const currentLevel = state.level;
            const currentGold = state.player.gold;
            const currentDebt = state.debtPaidOff;
            state.map = generateMap(
                currentLevel === 5 ? 51 : currentLevel === 2 ? 31 : currentLevel > 2 ? Math.min(51, 31 + (currentLevel - 2) * 6) : 27,
                currentLevel === 5 ? 51 : currentLevel === 2 ? 31 : currentLevel > 2 ? Math.min(51, 31 + (currentLevel - 2) * 6) : 27
            );
            // Preserve gold/debt across restart
            state.player.gold = currentGold;
            state.debtPaidOff = currentDebt;
            updateUIState();
            render();
            showMessage("LEVEL RESTARTED!");
        });
    }

    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
        btnResume.addEventListener('click', () => {
            splashScreen.style.display = 'none';
            state.appState = 'playing';
            playGameMusic();
        });
    }

    const btnSound = document.getElementById('btn-sound');
    const soundOverlay = document.getElementById('sound-overlay');
    const btnCloseSound = document.getElementById('btn-close-sound');

    if (btnSound) {
        btnSound.addEventListener('click', () => {
            soundOverlay.classList.remove('hidden');
            initAudio();
        });
    }
    if (btnCloseSound) {
        btnCloseSound.addEventListener('click', () => { soundOverlay.classList.add('hidden'); });
    }

    const btnSettings = document.getElementById('btn-settings');
    const settingsOverlay = document.getElementById('settings-overlay');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const genModeSelect = document.getElementById('gen-mode-select');
    const screenSizeSelect = document.getElementById('screen-size-select');

    if (btnSettings) { btnSettings.addEventListener('click', () => { settingsOverlay.classList.remove('hidden'); }); }
    if (btnCloseSettings) { btnCloseSettings.addEventListener('click', () => { settingsOverlay.classList.add('hidden'); }); }

    if (genModeSelect) {
        state.settings.generationMode = 'static';
        genModeSelect.value = state.settings.generationMode;
        genModeSelect.addEventListener('change', (e) => { state.settings.generationMode = e.target.value; });
    }

    const btnApplySettings = document.getElementById('btn-apply-settings');
    if (btnApplySettings && screenSizeSelect) {
        const appContainer = document.querySelector('.app-container');
        btnApplySettings.addEventListener('click', () => {
            if (appContainer) {
                appContainer.classList.remove('scale-1x', 'scale-2x', 'scale-3x');
                appContainer.classList.add(`scale-${screenSizeSelect.value}`);
            }
            settingsOverlay.classList.add('hidden');
        });
    }

    const volMusic = document.getElementById('vol-music');
    if (volMusic) { volMusic.addEventListener('input', (e) => { if (musicGainNode) musicGainNode.gain.value = parseFloat(e.target.value); }); }

    const volSfx = document.getElementById('vol-sfx');
    if (volSfx) { volSfx.addEventListener('input', (e) => { if (sfxGainNode) sfxGainNode.gain.value = parseFloat(e.target.value); }); }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            splashScreen.style.display = 'none';
            state.appState = 'intro';
            introScreen.classList.remove('hidden');
            initAudio();
            playIntroMusic();
        });
    }

    const loadOverlay = document.getElementById('load-overlay');
    const loadSaveList = document.getElementById('load-save-list');
    const loadCancelBtn = document.getElementById('load-cancel');

    function loadSaveState(saveData) {
        try {
            Object.assign(state, saveData.state);
            splashScreen.style.display = 'none';
            loadOverlay.classList.add('hidden');
            state.appState = 'playing';
            initAudio();
            playGameMusic();
            render();
            updateUIState();
            showMessage("GAME LOADED.");
        } catch (e) {
            console.error("Failed to load save", e);
        }
    }

    function showLoadScreen() {
        let saves = JSON.parse(localStorage.getItem('c64_dungeon_saves') || '[]');
        // Also check for legacy quicksave
        const qs = localStorage.getItem('c64_dungeon_save_v2');
        if (saves.length === 0 && !qs) {
            showConfirm("No saves found!", () => {});
            return;
        }
        saves.sort((a, b) => new Date(b.date) - new Date(a.date));

        loadSaveList.innerHTML = '';
        if (saves.length === 0 && qs) {
            // Legacy quicksave only
            const entry = document.createElement('div');
            entry.className = 'load-save-entry';
            entry.innerHTML = '<div><span class="load-save-name">Quicksave (Legacy)</span></div>';
            entry.addEventListener('click', () => {
                loadSaveState({ name: 'Quicksave', state: JSON.parse(qs) });
            });
            loadSaveList.appendChild(entry);
        }

        for (let i = 0; i < saves.length; i++) {
            const s = saves[i];
            const d = new Date(s.date);
            const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const levelName = (typeof LEVEL_NAMES !== 'undefined' && LEVEL_NAMES[s.level - 1]) ? LEVEL_NAMES[s.level - 1] : 'Level ' + s.level;

            const entry = document.createElement('div');
            entry.className = 'load-save-entry';
            entry.innerHTML = `<div>
                <div class="load-save-name">${i + 1}. ${s.name}</div>
                <div class="load-save-info">Lv${s.level} ${levelName} - ${dateStr}</div>
            </div>`;
            entry.addEventListener('click', () => {
                loadSaveState(s);
            });
            loadSaveList.appendChild(entry);
        }

        loadOverlay.classList.remove('hidden');
    }

    if (btnLoad) {
        btnLoad.addEventListener('click', () => showLoadScreen());
    }

    loadCancelBtn.addEventListener('click', () => {
        loadOverlay.classList.add('hidden');
    });

    const startupOverlay = document.getElementById('startup-overlay');
    if (startupOverlay) {
        startupOverlay.addEventListener('click', () => {
            startupOverlay.style.display = 'none';
            if (!audioCtx) { initAudio(); playSplashMusic(); }
        });
    }

    if (introScreen) {
        introScreen.addEventListener('click', () => {
            if (state.appState === 'intro') {
                introScreen.classList.add('hidden');
                state.appState = 'playing';
                playGameMusic();
                render();
                showTutorialIfNeeded();
            }
        });
    }

    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const tutorialCloseBtn = document.getElementById('tutorial-close-btn');
    const tutorialNoShow = document.getElementById('tutorial-no-show');

    function closeTutorial() {
        if (tutorialNoShow && tutorialNoShow.checked) { localStorage.setItem('tdd_tutorial_seen', 'true'); }
        if (tutorialOverlay) tutorialOverlay.classList.add('hidden');
    }

    window.showTutorialIfNeeded = function() {
        if (state.level !== 1) return;
        if (localStorage.getItem('tdd_tutorial_seen') === 'true') return;
        if (tutorialOverlay) tutorialOverlay.classList.remove('hidden');
    };

    if (tutorialCloseBtn) tutorialCloseBtn.addEventListener('click', closeTutorial);
    if (tutorialOverlay) {
        tutorialOverlay.addEventListener('click', (e) => { if (e.target === tutorialOverlay) closeTutorial(); });
    }

    const autoPotionCb = document.getElementById('auto-potion-cb');
    if (autoPotionCb) {
        autoPotionCb.addEventListener('change', (e) => { state.settings.autoPotion = e.target.checked; });
    }

    if (btnInfo) { btnInfo.addEventListener('click', () => { infoOverlay.classList.remove('hidden'); }); }
    if (btnCloseInfo) { btnCloseInfo.addEventListener('click', () => { infoOverlay.classList.add('hidden'); }); }

    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
        gameCanvas.addEventListener('click', () => {
            if (state.appState === 'low_health') state.appState = 'playing';
            if (state.appState === 'playing') attackFront();
        });
    }

    const attackBtn = document.getElementById('attack-btn');
    if (attackBtn) {
        attackBtn.addEventListener('click', () => {
            if (state.appState === 'low_health') state.appState = 'playing';
            if (state.appState === 'playing') attackFront();
        });
    }

    const waitBtn = document.getElementById('wait-btn');
    if (waitBtn) {
        waitBtn.addEventListener('click', () => {
            if (state.appState === 'low_health') state.appState = 'playing';
            if (state.appState === 'playing') wait();
        });
    }

    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) {
        deathScreen.addEventListener('click', () => {
            if (state.appState === 'dead' && Date.now() - state.deathTime > 3000) location.reload();
        });
    }

    const transitionScreen = document.getElementById('transition-screen');
    if (transitionScreen) {
        transitionScreen.addEventListener('click', () => {
            if (state.appState === 'transition' && state.transitionReady) nextLevel();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (state.appState === 'dead') {
            if (Date.now() - state.deathTime > 3000) location.reload();
        }
        if (state.appState === 'transition' && state.transitionReady) {
            nextLevel();
        }
    });

    render();
    gameLoop();
}

// ============================================================
// Boot (called from index.html after all scripts are loaded)
// ============================================================
function boot() {
    state.map = generateMap(27, 27);
    init();
}
