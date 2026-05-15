with open('frontend/src/components/Navbar.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the missing unclosed div
open('frontend/src/components/Navbar.jsx', 'w', encoding='utf-8').write(text.replace('      </nav>', '        </div>\n      </nav>'))
print('Done!')
