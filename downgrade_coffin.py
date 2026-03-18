from PIL import Image

palette = [
    (0, 0, 0), (255, 255, 255), (136, 0, 0), (170, 255, 238),
    (204, 68, 204), (0, 204, 85), (0, 0, 170), (238, 238, 119),
    (221, 136, 85), (102, 68, 0), (255, 119, 119), (51, 51, 51),
    (119, 119, 119), (170, 255, 102), (0, 136, 255), (187, 187, 187)
]

def closest_color(rgb):
    r, g, b = rgb
    min_dist = float('inf')
    best_color = palette[0]
    for pr, pg, pb in palette:
        dist = (pr - r)**2 + (pg - g)**2 + (pb - b)**2
        if dist < min_dist:
            min_dist = dist
            best_color = (pr, pg, pb)
    return best_color

path = r"C:\Users\mirko\.gemini\antigravity\brain\4559d6bc-f83b-4965-9736-4d602bce6032\death_coffin_1771901866879.png"

try:
    print("Opening image...")
    img = Image.open(path).convert('RGB')
    
    width, height = img.size
    aspect = height / width
    new_w = 320
    new_h = int(new_w * aspect)
    img = img.resize((new_w, new_h), Image.Resampling.NEAREST)

    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            pixels[x, y] = closest_color(pixels[x, y])
            
    out_path = r"c:\Users\mirko\Downloads\workspace\c64-dungeon\coffin.png"
    img.save(out_path)
    print(f"Saved to {out_path}")
except Exception as e:
    print(f"Error: {e}")
