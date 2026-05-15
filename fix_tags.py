
import sys

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Fix currentNotifications useMemo closing (already fixed but double checking)
    # Fix low stock span (already fixed but double checking)
    
    # Fix line 2069 (1-indexed)
    target_idx = 2068 # 0-indexed
    if len(lines) > target_idx and "fontSize: '1" in lines[target_idx]:
        print(f"Fixing line {target_idx + 1}")
        lines[target_idx] = "                                     <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>\n"
        lines.insert(target_idx + 1, "                                       ({product.variants.length} {product.variants.length > 1 ? 'variants' : 'variant'})\n")
        lines.insert(target_idx + 2, "                                     </span>\n")
    else:
        print(f"Could not find target at line {target_idx + 1}. Content: {lines[target_idx] if len(lines) > target_idx else 'N/A'}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

if __name__ == "__main__":
    fix_file(sys.argv[1])
