import { Link } from 'react-router-dom';

export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 bg-white text-gray-800">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 border-b pb-4">Terms of Service</h1>

            <div className="space-y-8 text-sm leading-relaxed">
                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">1. Acceptance of Terms</h2>
                    <p>By accessing and using Muwas.in, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this site.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">2. Product Quality & Variations</h2>
                    <p>As our products (Perfumes, Attars, and Aroma Chemicals) involve natural and chemical blends, minor variations in scent or color may occur between batches. These variations do not constitute a defect.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">3. Orders and Payments</h2>
                    <p>All orders are subject to availability. We reserve the right to refuse or cancel any order. Payments must be made in full through our integrated secure payment gateway before dispatch.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">4. Returns and Exchanges</h2>
                    <p>Due to the personal nature of fragrance products, returns are generally not accepted unless the item is damaged or incorrectly delivered. Please refer to our <Link to="/returns" className="text-amber-600 hover:underline">Exchange Policy</Link> for details.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-slate-800">5. Limitation of Liability</h2>
                    <p>Muwas.in shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our products or website.</p>
                </section>

                <div className="mt-12 pt-8 border-t">
                    <Link to="/" className="text-amber-600 font-medium hover:underline">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
