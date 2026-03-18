import base64
import re

def process_file():
    with open('c64_fountain.png', 'rb') as f:
        f_b64 = base64.b64encode(f.read()).decode('utf-8')
    with open('c64_sword.png', 'rb') as f:
        s_b64 = base64.b64encode(f.read()).decode('utf-8')
        
    with open('game.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace fountain SVG
    fountain_pattern = r'const fountainSVG = `[\s\S]*?fountainImg\.src = "data:image/svg\+xml;base64," \+ btoa\(fountainSVG\);'
    fountain_repl = f'''const encodedFountainPNG = "data:image/png;base64,{f_b64}";
const fountainImg = new Image();
let fountainLoaded = false;
fountainImg.onload = () => {{ fountainLoaded = true; }};
fountainImg.src = encodedFountainPNG;'''
    content = re.sub(fountain_pattern, fountain_repl, content)

    # Replace sword SVG
    sword_pattern = r'const swordSVG = `[\s\S]*?swordImg\.src = "data:image/svg\+xml;base64," \+ btoa\(swordSVG\);'
    sword_repl = f'''const encodedSwordPNG = "data:image/png;base64,{s_b64}";
const swordImg = new Image();
let swordLoaded = false;
swordImg.onload = () => {{ swordLoaded = true; }};
swordImg.src = encodedSwordPNG;'''
    content = re.sub(sword_pattern, sword_repl, content)

    with open('game.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    process_file()
    print("Images injected successfully")
