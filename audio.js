import { state } from './state.js';

// Audio Context Setup
export let audioCtx;
export let droneOsc = null;
export let droneGain = null;
export let musicGainNode, sfxGainNode;
export let currentMusicContext = null;
export let ambientTimerEvent = null; // Track ambient setTimeout

export function initAudio() {
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

export function stopMusic() {
    if (currentMusicContext && currentMusicContext.stop) {
        currentMusicContext.stop();
    }
    if (ambientTimerEvent) {
        clearTimeout(ambientTimerEvent);
        ambientTimerEvent = null;
    }
    if (droneOsc) {
        droneOsc.stop();
        droneOsc.disconnect();
        droneOsc = null;
    }
}

export function playSplashMusic() {
    stopMusic();
    if (!audioCtx) return;

    let isPlaying = true;
    currentMusicContext = { stop: () => { isPlaying = false; } };

    let noteIdx = 0;
    const tempo = 120; // bpm
    const tickTime = 60 / (tempo * 4); // 16th notes
    let nextNoteTime = audioCtx.currentTime + 0.1;

    function schedule() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            playFugueNote(nextNoteTime);
            nextNoteTime += tickTime;
        }
        requestAnimationFrame(schedule);
    }

    function playFugueNote(time) {
        const t = noteIdx % 64;
        let f = 0;

        // D minor scale: D, E, F, G, A, Bb, C, C#
        const dMin = [293.66, 329.63, 349.23, 392.00, 440.00, 466.16, 523.25, 554.37, 587.33];

        if (t < 16) {
            const motif = [0, 2, 4, 3, 2, 1, 2, 0, 0, 2, 4, 3, 2, 1, 2, 0];
            if (motif[t] !== null) f = dMin[motif[t]];
        } else if (t < 32) {
            const motif = [1, 3, 5, 4, 3, 2, 3, 1, 1, 3, 5, 4, 3, 2, 3, 1];
            if (motif[t - 16] !== null) f = dMin[motif[t - 16]];
        } else if (t < 48) {
            const motif = [0, 4, 8, 4, 2, 4, 0, 4, 0, 4, 8, 4, 2, 4, 0, 4];
            f = dMin[motif[t - 32]];
        } else {
            const motif = [4, 7, 8, 7, 8, 7, 4, 7, 8, 7, 4, 2, 1, 0, 0, 0];
            f = dMin[motif[t - 48]];
        }

        noteIdx++;
        if (f === 0) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square'; // harpsichord
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

export function playIntroMusic() {
    stopMusic();
    if (!audioCtx) return;

    let isPlaying = true;
    currentMusicContext = { stop: () => { isPlaying = false; } };

    let noteIdx = 0;
    const tempo = 180;
    const tickTime = 60 / (tempo * 4); // 32nd notes
    let nextNoteTime = audioCtx.currentTime + 0.1;

    function schedule() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            playDimNote(nextNoteTime);
            nextNoteTime += tickTime;
        }
        requestAnimationFrame(schedule);
    }

    function playDimNote(time) {
        // Diminished 7th chord (C Eb Gb A)
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

export function playGameMusic() {
    stopMusic();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // 1. Core Drone (Low A)
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

    // 2. Parallax Stereo Wind (Two Noise Sources, Panned and LFO'd differently)
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    // Wind Layer 1 (Left, slower LFO)
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
    if (panner1.pan) panner1.pan.value = -0.6; // Left

    const windGain1 = audioCtx.createGain();
    windGain1.gain.value = 0;
    windGain1.gain.setTargetAtTime(0.2, now, 5.0);

    windSource1.connect(windFilter1);
    windFilter1.connect(panner1);
    panner1.connect(windGain1);
    windGain1.connect(musicGainNode);

    // Wind Layer 2 (Right, faster LFO, slightly quieter)
    const windSource2 = audioCtx.createBufferSource();
    windSource2.buffer = noiseBuffer;
    windSource2.loop = true;

    const windFilter2 = audioCtx.createBiquadFilter();
    windFilter2.type = 'lowpass';
    windFilter2.frequency.value = 150;
    windFilter2.Q.value = 2;

    const windLFO2 = audioCtx.createOscillator();
    windLFO2.type = 'sine';
    windLFO2.frequency.value = 0.22; // Out of sync

    const windLFOGain2 = audioCtx.createGain();
    windLFOGain2.gain.value = 300;

    windLFO2.connect(windLFOGain2);
    windLFOGain2.connect(windFilter2.frequency);

    const panner2 = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : audioCtx.createPanner();
    if (panner2.pan) panner2.pan.value = 0.6; // Right

    const windGain2 = audioCtx.createGain();
    windGain2.gain.value = 0;
    windGain2.gain.setTargetAtTime(0.15, now, 5.0);

    windSource2.connect(windFilter2);
    windFilter2.connect(panner2);
    panner2.connect(windGain2);
    windGain2.connect(musicGainNode);

    // Start continuous nodes
    droneLfo.start();
    droneOsc.start();
    windSource1.start();
    windLFO1.start();
    windSource2.start();
    windLFO2.start();

    // 3. Random Ambient Event Generator (3 to 15s)
    function triggerRandomAmbientEvent() {
        if (state.appState !== 'playing' && state.appState !== 'low_health') return;

        const eventType = Math.random();

        if (eventType < 0.4) {
            // Distant Howl
            playDistantHowl();
        } else {
            // Dissonant Echoing Piano Note
            playDissonantPiano();
        }

        // Schedule next random event
        const nextDelay = 3000 + Math.random() * 12000;
        ambientTimerEvent = setTimeout(triggerRandomAmbientEvent, nextDelay);
    }

    // Kick off first event soon
    ambientTimerEvent = setTimeout(triggerRandomAmbientEvent, 2000);

    // Expose cleanup
    currentMusicContext = {
        stop: () => {
            droneOsc.stop();
            droneLfo.stop();
            windSource1.stop();
            windLFO1.stop();
            windSource2.stop();
            windLFO2.stop();
            /* the specific ambient event oscillators clean themselves up */
        }
    };
}

export function playDistantHowl() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    const howlOsc = audioCtx.createOscillator();
    const howlGain = audioCtx.createGain();
    howlOsc.type = 'triangle';

    // Varying low pitches for howl
    const freqs = [110, 146.8, 164.8, 220]; // A2, D3, E3, A3
    howlOsc.frequency.value = freqs[Math.floor(Math.random() * freqs.length)];

    // Slow fade in and out to sound distant
    howlGain.gain.setValueAtTime(0, now);
    howlGain.gain.linearRampToValueAtTime(0.23, now + 2); // 2 sec fade in (increased vol)
    howlGain.gain.linearRampToValueAtTime(0, now + 5);    // 3 sec fade out

    // Modulate pitch slightly for eerie wind/beast effect
    howlOsc.frequency.linearRampToValueAtTime(howlOsc.frequency.value * 0.95, now + 5);

    howlOsc.connect(howlGain);
    howlGain.connect(musicGainNode);

    howlOsc.start(now);
    howlOsc.stop(now + 5);
}

export function playDissonantPiano() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Pick a low base frequency
    const baseFreqs = [65.41, 73.42, 82.41, 110]; // C2, D2, E2, A2
    const baseF = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];

    // Dissonant interval (minor second, flat five, etc.)
    const dissonances = [1.0594, 1.414]; // x * 2^(1/12) (minor 2nd), x * 2^(6/12) (tritone)
    const dissF = baseF * dissonances[Math.floor(Math.random() * dissonances.length)];

    // Shared piano envelope
    const attack = 0.05;
    const decay = 3.5;

    // Echo/Delay network
    const delayNode = audioCtx.createDelay();
    delayNode.delayTime.value = 0.4; // 400ms echo

    const feedbackGain = audioCtx.createGain();
    feedbackGain.gain.value = 0.5; // Echo fades out slowly

    const delayFilter = audioCtx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1200; // Muffle echo slightly

    // Connect delay ring
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayFilter);
    delayFilter.connect(delayNode);
    delayNode.connect(musicGainNode);

    // Synth 1: Root Tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.value = baseF;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + attack);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + decay);

    // Synth 2: Dissonant Tone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.value = dissF;
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + attack);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + decay);

    // Route dry signals and to delay
    osc1.connect(gain1);
    gain1.connect(musicGainNode);
    gain1.connect(delayNode);

    osc2.connect(gain2);
    gain2.connect(musicGainNode);
    gain2.connect(delayNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + decay);
    osc2.stop(now + decay);
}

export function playSound(type) {
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
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'death') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.5);

        // Tremolo
        const lfo = audioCtx.createOscillator();
        lfo.frequency.value = 10;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.2;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start(now);
        lfo.stop(now + 0.5);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'miss') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        // Echo for footsteps
        const delayNode = audioCtx.createDelay();
        delayNode.delayTime.value = 0.25;
        const feedbackGain = audioCtx.createGain();
        feedbackGain.gain.value = 0.3; // quiet echo
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);

        // Connect both the dry signal and the delay signal to output
        gain.connect(sfxGainNode);
        delayNode.connect(sfxGainNode);
        gain.connect(delayNode);

        osc.start(now);
        osc.stop(now + 0.1);
    }
}

export function playDeathMusic() {
    stopMusic();
    if (!audioCtx) return;
    currentMusicContext = audioCtx.currentTime;

    // Funereal 8-bit minor dirge (C minor)
    const notes = [
        { f: 130.81, d: 1 }, // C3
        { f: 155.56, d: 1 }, // Eb3
        { f: 196.00, d: 1 }, // G3
        { f: 130.81, d: 3 }, // C3
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

        osc.start(time);
        osc.stop(time + n.d);
        time += n.d;
    });
}

export function playTransitionMusic() {
    stopMusic();
    if (!audioCtx) return;

    let isPlaying = true;
    currentMusicContext = { stop: () => { isPlaying = false; } };

    let noteIdx = 0;
    const tempo = 40; // very slow and creeping
    const tickTime = 60 / tempo; // quarter notes
    let nextNoteTime = audioCtx.currentTime + 0.1;

    function schedule() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            playOrganChord(nextNoteTime);
            nextNoteTime += tickTime;
        }
        requestAnimationFrame(schedule);
    }

    function playOrganChord(time) {
        // Creepy diminished descending sequence
        const seq = [
            [261.63, 311.13, 369.99], // C dim (C, Eb, Gb)
            [246.94, 293.66, 349.23], // B dim (B, D, F)
            [233.08, 277.18, 329.63], // Bb dim (Bb, Db, E)
            [220.00, 261.63, 311.13]  // A dim (A, C, Eb)
        ];

        const chord = seq[noteIdx % seq.length];
        const bass = chord[0] / 2;

        for (let f of [...chord, bass]) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth'; // organ bite
            osc.frequency.value = f;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.1);
            gain.gain.setValueAtTime(0.2, time + tickTime * 0.8);
            gain.gain.linearRampToValueAtTime(0, time + tickTime * 0.99);

            osc.connect(gain);
            gain.connect(musicGainNode);

            osc.start(time);
            osc.stop(time + tickTime);
        }
        noteIdx++;
    }
    schedule();
}

