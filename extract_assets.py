import codecs

with codecs.open('game.js', 'r', 'utf-8') as f:
    content = f.read()

# Find the start and end of the assets block
start_marker = "const skeletonImg = new Image();"
end_marker = "function generateMap(W, H) {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers!")
    exit(1)

assets_content = content[start_idx:end_idx]

# Replace const/let with export const/let
assets_content = assets_content.replace('\nconst ', '\nexport const ')
assets_content = assets_content.replace('\nlet ', '\nexport let ')

if assets_content.startswith('const '):
    assets_content = 'export ' + assets_content

with codecs.open('assets.js', 'w', 'utf-8') as f:
    f.write('// assets.js\n')
    f.write(assets_content)

# Now import statement
import_statement = """
import {
    skeletonImg, skeletonLoaded,
    wraithImg, wraithLoaded,
    potionImg, potionLoaded,
    chestImg, chestLoaded,
    fountainImg, fountainLoaded,
    swordImg, swordLoaded,
    keyImg, keyLoaded,
    blackKeyImg, blackKeyLoaded,
    spikeUpImg, spikeUpLoaded,
    spikeDownImg, spikeDownLoaded
} from './assets.js';
"""

new_game_content = content[:start_idx] + content[end_idx:]

# Insert import at top after the state imports
import_marker = "from './state.js';"
insert_idx = new_game_content.find(import_marker) + len(import_marker)

new_game_content = new_game_content[:insert_idx] + import_statement + new_game_content[insert_idx:]

with codecs.open('game.js', 'w', 'utf-8') as f:
    f.write(new_game_content)

print("Assets extracted successfully!")
