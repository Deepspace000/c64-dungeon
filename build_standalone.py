import os
import re

def build_standalone():
    print("Building standalone_dungeon.html...")
    
    # Check if files exist
    required_files = ['index.html', 'style.css', 'game.js']
    for f in required_files:
        if not os.path.exists(f):
            print(f"Error: {f} not found in current directory.")
            return

    # Read the core HTML structure
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Read the CSS
    with open('style.css', 'r', encoding='utf-8') as f:
        css_content = f.read()

    # Read the JS
    with open('game.js', 'r', encoding='utf-8') as f:
        js_content = f.read()

    # Replace <link rel="stylesheet" href="style.css"> with inline <style>
    style_tag = f"<style>\n{css_content}\n</style>"
    html_content = re.sub(r'<link[^>]*href=["\']style\.css["\'][^>]*>', style_tag, html_content)

    # Replace <script src="game.js"></script> with inline <script>
    script_tag = f"<script>\n{js_content}\n</script>"
    html_content = re.sub(r'<script[^>]*src=["\']game\.js["\'][^>]*></script>', script_tag, html_content)

    # Write the bundled file
    output_filename = 'standalone_dungeon.html'
    with open(output_filename, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"Successfully generated {output_filename}!")

if __name__ == '__main__':
    build_standalone()
