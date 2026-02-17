import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* About */}
          <div>
            <img src="/muwas-logo.jfif" alt="MUWAS" className="h-10 w-auto object-contain mb-4" />
            <p className="text-gray-300 text-sm leading-relaxed">
              Your destination for luxury fragrances. Discover the perfect scent for every occasion.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/products" className="hover:text-amber-400 transition-colors">Shop All</Link></li>
              <li><Link to="/products?category=Men" className="hover:text-amber-400 transition-colors">Men's Fragrances</Link></li>
              <li><Link to="/products?category=Women" className="hover:text-amber-400 transition-colors">Women's Fragrances</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-amber-400 transition-colors">Featured</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/shipping" className="hover:text-amber-400 transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="hover:text-amber-400 transition-colors">Returns & Exchange</Link></li>
              <li><Link to="/faq" className="hover:text-amber-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-400" />
                <a href="tel:+919876543210" className="hover:text-amber-400 transition-colors">+91 9876 543 210</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-400" />
                <a href="mailto:muwas2021@gmail.com" className="hover:text-amber-400 transition-colors">muwas2021@gmail.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-400 mt-0.5" />
                <span>123 Fragrance Lane,<br />Perfume City, PC 12345</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Newsletter</h4>
            <p className="text-sm text-gray-300 mb-4">
              Subscribe for exclusive deals and updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="px-3 py-2 rounded text-gray-900 flex-1 min-w-0 text-sm"
              />
              <button className="bg-amber-500 hover:bg-amber-600 px-6 py-2 rounded transition-colors font-semibold whitespace-nowrap flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="border-t border-slate-700 mt-8 pt-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a href="https://instagram.com/muwasperfumes" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-amber-500 p-3 rounded-full transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-slate-800 hover:bg-amber-500 p-3 rounded-full transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-slate-800 hover:bg-amber-500 p-3 rounded-full transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="bg-slate-800 hover:bg-amber-500 p-3 rounded-full transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="text-center text-sm text-gray-400">
              <p>&copy; 2026 MUWAS. All rights reserved.</p>
              <p className="mt-2">
                <a href="#" className="hover:text-amber-400">Privacy Policy</a> •
                <a href="#" className="hover:text-amber-400 mx-2">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
