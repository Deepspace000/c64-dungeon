import codecs

with codecs.open('game.js', 'r', 'utf-8') as f:
    content = f.read()

start_marker = "// Audio Context Setup"
end_marker = "function generateMap(W, H) {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    exit(1)

audio_content = content[start_idx:end_idx]

# Add exports
audio_content = audio_content.replace('let audioCtx;', 'export let audioCtx;')
audio_content = audio_content.replace('let droneOsc = null;', 'export let droneOsc = null;')
audio_content = audio_content.replace('let droneGain = null;', 'export let droneGain = null;')
audio_content = audio_content.replace('let musicGainNode, sfxGainNode;', 'export let musicGainNode, sfxGainNode;')
audio_content = audio_content.replace('let currentMusicContext = null;', 'export let currentMusicContext = null;')
audio_content = audio_content.replace('let ambientTimerEvent = null;', 'export let ambientTimerEvent = null;')

audio_content = audio_content.replace('\nfunction ', '\nexport function ')
if audio_content.startswith('function '):
    audio_content = 'export ' + audio_content

audio_js = "import { state } from './state.js';\n\n" + audio_content

new_game_content = content[:start_idx] + content[end_idx:]

import_statement = """
import {
    initAudio, stopMusic, playSplashMusic, playIntroMusic, playGameMusic,
    playSound, playDeathMusic, playTransitionMusic,
    musicGainNode, sfxGainNode, audioCtx
} from './audio.js';
"""

import_marker = "from './assets.js';"
insert_idx = new_game_content.find(import_marker) + len(import_marker)

new_game_content = new_game_content[:insert_idx] + import_statement + new_game_content[insert_idx:]

with codecs.open('audio.js', 'w', 'utf-8') as f:
    f.write(audio_js)

with codecs.open('game.js', 'w', 'utf-8') as f:
    f.write(new_game_content)

print("Audio extracted successfully!")
