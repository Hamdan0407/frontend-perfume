const fs = require('fs');

const text = fs.readFileSync('src/components/Navbar.jsx', 'utf-8');

const sIdx = text.indexOf('{/* Row 1:');
const eIdx = text.indexOf('        {/* Row 2:');

const row1 = text.substring(sIdx, eIdx);

const m1 = row1.match(/(\{\/\* Mobile Menu Trigger \*\/\}[\s\S]*?<\/div>)\n\s*<\/div>/);
const mobileMenu = m1 ? m1[1] : '';

const m2 = row1.match(/(\{\/\* Center: Logo \*\/\}[\s\S]*?<\/div>)/);
const logo = m2 ? m2[1] : '';

const m3 = row1.match(/(\{\/\* Search Icon \*\/\}[\s\S]*?<\/button>)/);
const searchIcon = m3 ? m3[1] : '';

const m4 = row1.match(/(\{\/\* Desktop: Auth \+ Cart \*\/\}[\s\S]*?(?=\s*\{\/\* Mobile: Cart icon))/);
let desktopAuth = m4 ? m4[1] : '';
desktopAuth = desktopAuth.replace('absolute right-0', 'absolute left-0');

const m5 = row1.match(/(\{\/\* Mobile: Cart icon[\s\S]*?\n\s*\}\))/);
const mobileCart = m5 ? m5[1] : '';

const newRow1 = `{/* Row 1: Profile/Cart/Menu (left) | Logo (center) | Search (right) */}
        <div className="grid grid-cols-3 items-center h-[72px]">

          {/* Left: Mobile Menu + Auth/Cart */}
          <div className="flex items-center gap-3 justify-self-start">
            <div className="md:hidden flex items-center">
  ${mobileMenu.split('\n').join('\n  ')}
            </div>

${desktopAuth}

${mobileCart}
          </div>

          <div className="flex justify-center justify-self-center">
${logo.replace('{/* Center: Logo */}', '').trim()}
          </div>

          {/* Right: Search */}
          <div className="flex items-center gap-3 justify-self-end justify-end">
${searchIcon}
          </div>
        </div>

`;

const newText = text.substring(0, sIdx) + newRow1 + text.substring(eIdx);

fs.writeFileSync('src/components/Navbar.jsx', newText);
console.log('Fixed completely!');
