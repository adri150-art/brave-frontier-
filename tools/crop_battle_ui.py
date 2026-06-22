import os
from PIL import Image

def crop_battle_ui(img_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    pixels = img.load()
    
    visited = set()
    islands = []
    
    # components search
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 5 and (x, y) not in visited: # opacity threshold
                # BFS
                queue = [(x, y)]
                visited.add((x, y))
                min_x, max_x = x, x
                min_y, max_y = y, y
                
                while queue:
                    cx, cy = queue.pop(0)
                    # Check 8 directions
                    for dx in [-1, 0, 1]:
                        for dy in [-1, 0, 1]:
                            if dx == 0 and dy == 0:
                                continue
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < width and 0 <= ny < height:
                                if pixels[nx, ny][3] > 5 and (nx, ny) not in visited:
                                    visited.add((nx, ny))
                                    queue.append((nx, ny))
                                    min_x = min(min_x, nx)
                                    max_x = max(max_x, nx)
                                    min_y = min(min_y, ny)
                                    max_y = max(max_y, ny)
                                    
                # Add bounding box if it's larger than a threshold (filtering noise)
                w = max_x - min_x + 1
                h = max_y - min_y + 1
                if w > 4 and h > 4:
                    islands.append((min_x, min_y, w, h))

    # Sort islands from top-to-bottom, left-to-right
    islands.sort(key=lambda box: (box[1], box[0]))
    
    print(f"Detected {len(islands)} elements in {img_path}")
    for idx, (x, y, w, h) in enumerate(islands):
        cropped = img.crop((x, y, x + w, y + h))
        output_path = os.path.join(output_dir, f"battle_ui_{idx}.png")
        cropped.save(output_path)
        print(f"  Element {idx}: x={x}, y={y}, w={w}, h={h} -> Saved to {output_path}")

if __name__ == '__main__':
    crop_battle_ui(
        '/Users/adriano/Downloads/brave-frontier-web/assets/img combat /battle_ui.png',
        '/Users/adriano/Downloads/brave-frontier-web/assets/img combat /processed'
    )
