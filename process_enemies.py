
from PIL import Image

def make_transparent(input_path, output_path, threshold=240):
    print(f"Processing {input_path} -> {output_path}...")
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # If R, G, B are all above threshold, make it transparent
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    # Crop to content to remove excess white space
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"Cropped to {img.size}")
    
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

make_transparent('c64_spider.png', 'c64_spider_final.png')
make_transparent('c64_ghoul.png', 'c64_ghoul_final.png')
