import cv2
import numpy as np
import base64
import re

def process_fountain():
    input_path = r"C:\Users\mirko\.gemini\antigravity\brain\4559d6bc-f83b-4965-9736-4d602bce6032\fountain_base_1771993092830.png"
    output_path = r"c:\Users\mirko\Downloads\workspace\c64-dungeon\c64_fountain.png"
    
    img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Failed to load image!")
        exit(1)
        
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    # Find pure white pixels or near white frame pixels and make them transparent
    # The frame might be slightly off-white due to anti-aliasing in the original
    white_mask = np.all(img[:, :, :3] > 200, axis=-1)
    img[white_mask, 3] = 0 # Set alpha to 0

    # Resize down to pixel art dimensions
    target_h, target_w = 48, 48
    small_img = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)
    
    # Map to C64 palette (excluding alpha)
    C64_PALETTE = np.array([
        [0, 0, 0], [255, 255, 255], [136, 0, 0], [170, 255, 238],
        [204, 68, 204], [0, 204, 85], [0, 0, 170], [238, 238, 119],
        [221, 136, 85], [102, 68, 0], [255, 119, 119], [51, 51, 51],
        [119, 119, 119], [170, 255, 102], [0, 136, 255], [187, 187, 187]
    ], dtype=np.uint8)
    
    rgb_small = cv2.cvtColor(small_img, cv2.COLOR_BGRA2BGR)
    shape = rgb_small.shape
    pixels = rgb_small.reshape(-1, 3).astype(np.float32)
    palette = C64_PALETTE.astype(np.float32)
    distances = np.sqrt(np.sum((pixels[:, np.newaxis] - palette) ** 2, axis=2))
    closest_indices = np.argmin(distances, axis=1)
    mapped_rgb = C64_PALETTE[closest_indices].reshape(shape)
    
    # Handle alpha
    alpha_channel = small_img[:, :, 3].copy()
    bg_mask = np.all(rgb_small < 50, axis=-1)
    alpha_channel[bg_mask] = 0
    # Also ensure white pixels remain transparent after resize
    white_mask_small = np.all(rgb_small > 200, axis=-1)
    alpha_channel[white_mask_small] = 0
    
    final_small = np.dstack((mapped_rgb, alpha_channel))
    
    # Crop
    coords = cv2.findNonZero(alpha_channel)
    if coords is not None:
        x, y, w_bbox, h_bbox = cv2.boundingRect(coords)
        final_small = final_small[y:y+h_bbox, x:x+w_bbox]
        
    # Scale up
    final_img = cv2.resize(final_small, (final_small.shape[1]*8, final_small.shape[0]*8), interpolation=cv2.INTER_NEAREST)
    cv2.imwrite(output_path, final_img)
    
    # Inject
    retval, buffer = cv2.imencode('.png', final_img)
    f_b64 = base64.b64encode(buffer).decode('utf-8')
    
    with open('game.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
    fountain_pattern = r'const encodedFountainPNG = "data:image/png;base64,.*?";'
    fountain_repl = f'const encodedFountainPNG = "data:image/png;base64,{f_b64}";'
    content = re.sub(fountain_pattern, fountain_repl, content)
    
    with open('game.js', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Fountain processed and injected successfully")

if __name__ == '__main__':
    process_fountain()
