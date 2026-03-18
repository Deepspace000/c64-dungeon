import cv2
import numpy as np

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
    # Calculate distance to each palette color
    shape = img.shape
    pixels = img.reshape(-1, 3).astype(np.float32)
    palette = C64_PALETTE.astype(np.float32)
    
    # Broadcast to find distances
    distances = np.sqrt(np.sum((pixels[:, np.newaxis] - palette) ** 2, axis=2))
    
    # Find closest palette color index
    closest_indices = np.argmin(distances, axis=1)
    
    # Map back to palette colors
    mapped_pixels = C64_PALETTE[closest_indices]
    
    return mapped_pixels.reshape(shape)

# Load the image
input_path = r"C:\Users\mirko\.gemini\antigravity\brain\4559d6bc-f83b-4965-9736-4d602bce6032\wraith_c64_raw_1771986820781.png"
output_path = r"c:\Users\mirko\Downloads\workspace\c64-dungeon\c64_wraith.png"

img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)

if img is None:
    print("Failed to load image!")
    exit(1)

# Ensure it has an alpha channel
if img.shape[2] == 3:
    img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

# Crop the bottom 15% to remove any generated text
h, w = img.shape[:2]
crop_h = int(h * 0.85)
img = img[:crop_h, :]

# Resize targeting roughly 64x64 or similar chunky pixels
# First downscale to get chunky pixels
target_h, target_w = 64, 64
small_img = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)

# Map to C64 palette (excluding alpha for mapping)
rgb_small = cv2.cvtColor(small_img, cv2.COLOR_BGRA2BGR)
mapped_rgb = map_to_palette(rgb_small)

# Put alpha back
alpha_channel = small_img[:, :, 3].copy()

# Simple Chroma key: white background removal
# Since the generator creates near-white backgrounds, let's treat anything above 180,180,180 as transparent to catch compression artifacts
bg_mask = np.all(rgb_small > 180, axis=-1)
alpha_channel[bg_mask] = 0

# Set mapped pixels' alpha
final_small = np.dstack((mapped_rgb, alpha_channel))

# Find bounding box of non-transparent pixels
coords = cv2.findNonZero(alpha_channel)
if coords is not None:
    x, y, w_bbox, h_bbox = cv2.boundingRect(coords)
    # Crop to bounding box
    final_small = final_small[y:y+h_bbox, x:x+w_bbox]

# Scale back up for crisp edges
final_img = cv2.resize(final_small, (final_small.shape[1]*8, final_small.shape[0]*8), interpolation=cv2.INTER_NEAREST)

cv2.imwrite(output_path, final_img)
print(f"Successfully processed image and saved to {output_path}")

# Display dimensions
print(f"Final dimensions: {final_img.shape}")
