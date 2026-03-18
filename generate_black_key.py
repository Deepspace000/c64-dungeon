import cv2
import numpy as np
import base64

# C64 Palette
C64_PALETTE = np.array([
    [0, 0, 0],       # Black
    [255, 255, 255], # White
    [136, 0, 0],     # Red
    [170, 255, 238], # Cyan
    [204, 68, 204],  # Purple
    [0, 204, 85],    # Green
    [0, 0, 170],     # Blue
    [238, 238, 119], # Yellow
    [221, 136, 85],  # Orange
    [102, 68, 0],    # Brown
    [255, 119, 119], # Light Red
    [51, 51, 51],    # Dark Grey
    [119, 119, 119], # Grey
    [170, 255, 102], # Light Green
    [0, 136, 255],   # Light Blue
    [187, 187, 187]  # Light Grey
])

def create_black_key():
    # 32x32 size
    img = np.zeros((32, 32, 4), dtype=np.uint8)
    
    # Use dark grey and light grey for "nano banana" pixel art feel
    dark_col = [51, 51, 51, 255] # Dark Grey
    light_col = [119, 119, 119, 255] # Grey
    hl_col = [187, 187, 187, 255] # Light Grey
    black_col = [0, 0, 0, 255] # True Black outline
    
    # Bow (handle)
    for y in range(4, 14):
        for x in range(12, 20):
            if (x-16)**2 + (y-9)**2 <= 25:
                if (x-16)**2 + (y-9)**2 < 9: # Empty hole
                    img[y, x] = [0,0,0,0]
                else:
                    img[y, x] = light_col
                    
    # Outline Bow
    for y in range(3, 15):
        for x in range(11, 21):
            if np.all(img[y, x] == 0):
                if 16 <= (x-16)**2 + (y-9)**2 <= 36:
                    img[y, x] = black_col
                    
    # Shank (shaft)
    for y in range(14, 28):
        for x in range(14, 18):
            img[y, x] = dark_col
            if x == 14:
                img[y, x] = black_col
            elif x == 17:
                img[y, x] = black_col
            elif x == 15:
                img[y, x] = light_col
                
    # Bit (teeth)
    for y in range(22, 28, 2):
        for x in range(18, 22):
            img[y, x] = dark_col
            if x == 21 or y == 27 or y == 22:
                img[y, x] = black_col
            elif x == 19 and y % 2 == 0:
                img[y, x] = hl_col
                
    # Highlights
    img[5, 16] = hl_col
    img[6, 17] = hl_col
    img[27, 16] = black_col
    
    cv2.imwrite("c64_black_key.png", cv2.cvtColor(img, cv2.COLOR_RGBA2BGRA))
    
    with open("c64_black_key.png", "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
        
    with open("black_key_b64.txt", "w") as f:
        f.write('const encodedBlackKeyPNG = "data:image/png;base64,' + b64 + '";')
        
create_black_key()
