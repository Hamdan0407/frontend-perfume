import { Link } from 'react-router-dom';
import { Mail, MapPin, Instagram, Facebook, Twitter, Linkedin, TrendingUp } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white text-gray-800 mt-16 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/muwas-logo-nobg.png" alt="Muwas Logo" className="h-10 w-auto" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your destination for luxury fragrances. Discover the perfect scent for every occasion.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/products" className="hover:text-amber-500 transition-colors">Shop All</Link></li>
              <li><Link to="/products?category=parfum" className="hover:text-amber-500 transition-colors">Parfum</Link></li>
              <li><Link to="/products?category=premium attars" className="hover:text-amber-500 transition-colors">Premium Attars</Link></li>
              <li><Link to="/products?category=oud reserve" className="hover:text-amber-500 transition-colors">Oud Reserve</Link></li>
              <li><Link to="/products?category=bakhoor" className="hover:text-amber-500 transition-colors">Bakhoor</Link></li>
              <li><Link to="/products?category=aroma chemicals" className="hover:text-amber-500 transition-colors">Aroma Chemicals</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Customer Service</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/shipping" className="hover:text-amber-500 transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="hover:text-amber-500 transition-colors">Exchange Policy</Link></li>
              <li><Link to="/faq" className="hover:text-amber-500 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-500" />
                <a href="mailto:muwas2021@gmail.com" className="hover:text-amber-500 transition-colors">muwas2021@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <a href="https://wa.me/918247327106" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors">+91 8247327106</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-500 mt-0.5" />
                <span>Ambur, Tamil Nadu, India</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-900">Newsletter</h4>
            <p className="text-sm text-gray-500 mb-4">
              Subscribe for exclusive deals and updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="px-3 py-2 rounded border border-gray-300 flex-1 min-w-0 text-sm text-gray-900"
              />
              <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded transition-colors font-semibold whitespace-nowrap flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Follow Us / Copyright - Dark Section */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h4 className="font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/muwasperfumes/" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-amber-500 p-3 rounded-full transition-colors">
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
              <p>&copy; 2026 Muwas Perfumes. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
