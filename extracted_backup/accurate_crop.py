from PIL import Image

def analyze_and_crop():
    img_path = r"C:\Users\mirko\Downloads\workspace\c64-dungeon\c64_skeleton.png"
    out_path = r"C:\Users\mirko\Downloads\workspace\c64-dungeon\c64_skeleton.png" # Overwrite original
    
    img = Image.open(img_path)
    width, height = img.size
    
    # Analyze row by row from the bottom
    # We look for a gap of transparent rows to separate the text from the skeleton.
    row_has_pixels = []
    
    for y in range(height):
        has_pixels = False
        for x in range(width):
            pixel = img.getpixel((x, y))
            if pixel[3] > 0: # Not fully transparent
                has_pixels = True
                break
        row_has_pixels.append(has_pixels)
        
    print(f"Total height: {height}")
    
    # We expect some blank rows near the bottom separating text from the skeleton.
    # Start from bottom:
    
    # Step 1: go up past the text
    y = height - 1
    while y >= 0 and row_has_pixels[y] == False:
        y -= 1
        
    print(f"Bottom of text is at {y}")
    
    # Step 2: go up past the text until we hit transparency
    while y >= 0 and row_has_pixels[y] == True:
        y -= 1
        
    print(f"Top of text is at {y}")
    
    # Step 3: this gap should be the space between text and skeleton
    # Crop at y
    if y > 0:
        print(f"Cropping at {y}")
        cropped = img.crop((0, 0, width, y))
        cropped.save(out_path, "PNG")
        print("Done.")
    else:
        print("Couldn't find crop point.")

analyze_and_crop()
