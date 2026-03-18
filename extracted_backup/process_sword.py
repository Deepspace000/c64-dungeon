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
], dtype=np.uint8)

def map_to_palette(img):
    shape = img.shape
    pixels = img.reshape(-1, 3).astype(np.float32)
    palette = C64_PALETTE.astype(np.float32)
    distances = np.sqrt(np.sum((pixels[:, np.newaxis] - palette) ** 2, axis=2))
    closest_indices = np.argmin(distances, axis=1)
    mapped_pixels = C64_PALETTE[closest_indices]
    return mapped_pixels.reshape(shape)

input_path = r"C:\Users\mirko\.gemini\antigravity\brain\4559d6bc-f83b-4965-9736-4d602bce6032\sword_base_1771993218846.png"
output_path = r"c:\Users\mirko\Downloads\workspace\c64-dungeon\c64_sword.png"

img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)

if img is None:
    print("Failed to load image!")
    exit(1)

if img.shape[2] == 3:
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# Slightly longer aspect ratio for sword: 64x32
target_h, target_w = 64, 48
small_img = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)

rgb_small = cv2.cvtColor(small_img, cv2.COLOR_BGRA2BGR)
mapped_rgb = map_to_palette(rgb_small)

alpha_channel = small_img[:, :, 3].copy()
bg_mask = np.all(rgb_small < 50, axis=-1)
alpha_channel[bg_mask] = 0

final_small = np.dstack((mapped_rgb, alpha_channel))

coords = cv2.findNonZero(alpha_channel)
if coords is not None:
    x, y, w_bbox, h_bbox = cv2.boundingRect(coords)
    final_small = final_small[y:y+h_bbox, x:x+w_bbox]

final_img = cv2.resize(final_small, (final_small.shape[1]*8, final_small.shape[0]*8), interpolation=cv2.INTER_NEAREST)

cv2.imwrite(output_path, final_img)
print(f"Successfully processed image and saved to {output_path}")

retval, buffer = cv2.imencode('.png', final_img)
png_as_text = base64.b64encode(buffer).decode('utf-8')
print("BASE64 DATA:")
print("data:image/png;base64," + png_as_text)
