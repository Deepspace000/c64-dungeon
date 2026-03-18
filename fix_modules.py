"""
Comprehensive fix for modularization issues in The Deepest Depths.

Issues found:
1. levelNames[] and getLevelName() accidentally ended up in assets.js
   but are still called from game.js -> move them back into game.js
2. assets.js should only contain image/SVG asset definitions
"""

# Step 1: Remove levelNames and getLevelName from assets.js
with open('assets.js', 'r', encoding='utf-8') as f:
    assets_content = f.read()

# Find and remove the levelNames block and getLevelName function from assets.js
lines = assets_content.split('\n')
new_lines = []
skip_until_closing_bracket = False
skip_function = False

i = 0
while i < len(lines):
    line = lines[i]
    
    # Skip the levelNames array
    if 'export const levelNames' in line or 'const levelNames' in line:
        # Skip until we find the closing ];
        while i < len(lines) and '];' not in lines[i]:
            i += 1
        i += 1  # skip the ]; line too
        # Skip any blank line after
        while i < len(lines) and lines[i].strip() == '':
            i += 1
        continue
    
    # Skip the getLevelName function
    if 'function getLevelName' in line:
        # Skip until closing }
        brace_count = 0
        while i < len(lines):
            brace_count += lines[i].count('{') - lines[i].count('}')
            i += 1
            if brace_count <= 0:
                break
        # Skip any blank line after
        while i < len(lines) and lines[i].strip() == '':
            i += 1
        continue
    
    new_lines.append(line)
    i += 1

with open('assets.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("[OK] Removed levelNames and getLevelName from assets.js")

# Step 2: Add levelNames and getLevelName back into game.js right after the imports
with open('game.js', 'r', encoding='utf-8') as f:
    game_content = f.read()

level_names_block = """
const levelNames = [
    "The Deepest Depths", // 0
    "The Red Chambers",   // 1
    "Green Depths",       // 2
    "Shadow Crypts",      // 3
    "Obsidian Labyrinth", // 4
    "The Bone Vaults",    // 5
    "The Abyss"           // 6+
];

function getLevelName(lvl) {
    if (lvl < levelNames.length) return levelNames[lvl];
    return "The Abyss";
}
"""

# Insert right after the last import block
# Find the line after "from './audio.js';"
insert_marker = "from './audio.js';"
insert_idx = game_content.find(insert_marker)
if insert_idx == -1:
    print("ERROR: Could not find audio.js import marker!")
    exit(1)
insert_idx = insert_idx + len(insert_marker)

# Check if levelNames already exists in game.js (avoid double-adding)
if 'const levelNames' not in game_content and 'levelNames' not in game_content.split(insert_marker)[0]:
    game_content = game_content[:insert_idx] + "\n" + level_names_block + game_content[insert_idx:]
    print("[OK] Added levelNames and getLevelName back to game.js")
else:
    print("[WARN] levelNames already exists in game.js, skipping")

with open('game.js', 'w', encoding='utf-8') as f:
    f.write(game_content)

print("\n[OK] All fixes applied successfully!")
print("\nVerification:")

# Quick verification
with open('game.js', 'r', encoding='utf-8') as f:
    g = f.read()
    
checks = [
    ("import from state.js", "from './state.js'" in g),
    ("import from assets.js", "from './assets.js'" in g),
    ("import from audio.js", "from './audio.js'" in g),
    ("getLevelName defined", "function getLevelName" in g),
    ("levelNames defined", "const levelNames" in g),
    ("init() called at end", "init();" in g),
    ("warpToLevel on window", "window.warpToLevel" in g),
]

for name, ok in checks:
    print(f"  {'[OK]' if ok else '[FAIL]'} {name}")
