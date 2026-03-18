from PIL import Image

def process_skeleton():
    img_path = r"C:\Users\mirko\.gemini\antigravity\brain\4559d6bc-f83b-4965-9736-4d602bce6032\c64_skeleton_art_1771972114906.png"
    out_path = r"C:\Users\mirko\Downloads\workspace\c64-dungeon\c64_skeleton.png"
    
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    # Replace near-black with transparent
    for item in data:
        # Check if R, G, B are all low
        if item[0] < 30 and item[1] < 30 and item[2] < 30:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(out_path, "PNG")

process_skeleton()
