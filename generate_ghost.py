from PIL import Image, ImageDraw

def create_ghost():
    width = 100
    height = 100
    # Transparent background
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Ghost Body
    d.pieslice([20, 20, 80, 80], 180, 0, fill=(200, 200, 230, 200)) # Top dome
    d.rectangle([20, 50, 80, 90], fill=(200, 200, 230, 200)) # Core body

    # Wavy bottom frills
    for i in range(3):
        x = 20 + (i * 20)
        d.pieslice([x, 80, x + 20, 100], 0, 180, fill=(200, 200, 230, 200))

    # Eyes
    d.ellipse([35, 35, 45, 50], fill=(0, 0, 0, 255))
    d.ellipse([55, 35, 65, 50], fill=(0, 0, 0, 255))
    d.ellipse([38, 38, 42, 45], fill=(255, 255, 255, 255)) # Eye glint
    d.ellipse([58, 38, 62, 45], fill=(255, 255, 255, 255)) # Eye glint

    # Mouth (sad/spooky wail)
    d.ellipse([45, 60, 55, 75], fill=(0, 0, 0, 200))

    # Save to file
    out_path = 'ghost_asset.png'
    img.save(out_path)
    print(f"Ghost asset saved to {out_path}")

    # Convert to base64 to inject
    import base64
    with open(out_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
    with open('ghost_b64.txt', 'w') as out:
        out.write(encoded_string)

create_ghost()
