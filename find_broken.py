
import sys

def find_broken_lines(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if "${((" in line or "style={{ fontSize: '1" in line or "className={`" in line and "`}" not in line:
            # Check if it's actually broken (missing closing backtick or something)
            if "{" in line and "}" not in line and i < len(lines) - 1 and "}" not in lines[i+1]:
                 print(f"{i+1}: {line.strip()}")
            elif "${((" in line:
                 print(f"{i+1}: {line.strip()}")

if __name__ == "__main__":
    find_broken_lines(sys.argv[1])
