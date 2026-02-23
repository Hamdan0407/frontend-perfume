import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 bg-white text-gray-800">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b pb-4">Privacy Policy</h1>

            <div className="space-y-8 text-sm leading-relaxed">
                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us when you create an account, make a purchase, or contact our support. This includes your name, email address, phone number, shipping address, and payment information handled securely via Stripe.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">2. How We Use Your Information</h2>
                    <p>We use your information to process orders, communicate about your purchases, and improve our services. We do not sell your personal data to third parties.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">3. Cookies & Tracking</h2>
                    <p>Muwas.in uses cookies to maintain your shopping cart and session. These help us provide a seamless shopping experience and analyze site traffic via standard web tools.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">4. Data Security</h2>
                    <p>We implement industry-standard security measures to protect your sensitive data. Your password is encrypted, and payment details are processed directly by Stripe using their secure infrastructure.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">5. Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:muwas2021@yahoo.com" className="text-amber-600 hover:underline">muwas2021@yahoo.com</a>.</p>
                </section>

                <div className="mt-12 pt-8 border-t">
                    <Link to="/" className="text-amber-600 font-medium hover:underline">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
