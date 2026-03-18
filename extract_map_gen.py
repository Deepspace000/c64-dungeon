import codecs

with codecs.open('game.js', 'r', 'utf-8') as f:
    content = f.read()

start_marker = "function generateMap(W, H) {"
end_marker = "function calcPlayerAttack() {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    import_statement = "import { generateMap } from './map_generator.js';\n"
    
    # insert import statement after audio.js import
    audio_marker = "from './audio.js';"
    insert_idx = content.find(audio_marker) + len(audio_marker)
    
    if insert_idx != -1:
        new_content = content[:insert_idx] + "\n" + import_statement + content[insert_idx:start_idx] + content[end_idx:]
        
        with codecs.open('game.js', 'w', 'utf-8') as f:
            f.write(new_content)
        print("Successfully removed generateMap and added import in game.js")
    else:
        print("Couldn't find audio import marker")
else:
    print("Couldn't find generateMap boundaries")
