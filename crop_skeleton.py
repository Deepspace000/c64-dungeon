from PIL import Image

def crop_skeleton():
    img_path = r"C:\Users\mirko\Downloads\workspace\c64-dungeon\c64_skeleton.png"
    out_path = r"C:\Users\mirko\Downloads\workspace\c64-dungeon\c64_skeleton_cropped.png"
    
    img = Image.open(img_path)
    
    # Let's see the size
    width, height = img.size
    print(f"Original size: {width}x{height}")
    
    # We want to crop off the bottom part where the text is.
    # The text is likely at the very bottom. Let's crop the bottom 20%.
    crop_height = int(height * 0.8)
    
    # Crop box is (left, upper, right, lower)
    box = (0, 0, width, crop_height)
    cropped_img = img.crop(box)
    
    cropped_img.save(out_path, "PNG")
    print(f"Saved cropped image to {out_path}")

crop_skeleton()
