import { HelpCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useState } from 'react';

const faqs = [
    {
        category: 'Orders & Shipping',
        questions: [
            {
                q: 'How long does shipping take?',
                a: 'Standard delivery takes 5-7 business days, Express delivery 2-3 days, and Same Day delivery is available in select cities.'
            },
            {
                q: 'Do you offer free shipping?',
                a: 'Yes! We offer free standard shipping on all orders above ₹999.'
            },
            {
                q: 'Can I track my order?',
                a: 'Absolutely! You\'ll receive a tracking number via email once your order ships. You can also track it from your Orders page.'
            },
            {
                q: 'Can I change my delivery address?',
                a: 'You can change your address before the order is shipped. Contact us immediately at muwas2021@yahoo.com with your order number.'
            }
        ]
    },
    {
        category: 'Returns & Exchanges',
        questions: [
            {
                q: 'What is your return policy?',
                a: 'We offer a 7-day return policy for unopened products in original packaging. Opened perfumes cannot be returned due to hygiene reasons.'
            },
            {
                q: 'How do I initiate a return?',
                a: 'Email us at muwas2021@yahoo.com with your order number and reason for return. We\'ll guide you through the process.'
            },
            {
                q: 'Can I exchange a product?',
                a: 'Yes! We offer exchanges for the same product in different sizes or variants within 7 days of delivery.'
            }
        ]
    },
    {
        category: 'Products',
        questions: [
            {
                q: 'Are your perfumes authentic?',
                a: 'Yes! We source all our perfumes directly from authorized distributors and guarantee 100% authenticity.'
            },
            {
                q: 'How should I store my perfume?',
                a: 'Store perfumes in a cool, dry place away from direct sunlight and heat to maintain their quality and longevity.'
            },
            {
                q: 'What is the shelf life of perfumes?',
                a: 'Unopened perfumes can last 3-5 years. Once opened, use within 1-2 years for best fragrance quality.'
            },
            {
                q: 'Do you offer samples?',
                a: 'We include free samples with orders above ₹1999. You can also purchase sample sets from our Featured collection.'
            }
        ]
    },
    {
        category: 'Payment & Security',
        questions: [
            {
                q: 'What payment methods do you accept?',
                a: 'We accept Credit/Debit cards, UPI, Net Banking, and Cash on Delivery (COD) for eligible orders.'
            },
            {
                q: 'Is my payment information secure?',
                a: 'Yes! We use industry-standard encryption and secure payment gateways (Razorpay) to protect your information.'
            },
            {
                q: 'Can I use multiple payment methods?',
                a: 'Currently, we support one payment method per order. You cannot split payments.'
            },
            {
                q: 'Do you store my card details?',
                a: 'No, we do not store any card details. All payment information is securely processed by our payment gateway.'
            }
        ]
    },
    {
        category: 'Account & Wishlist',
        questions: [
            {
                q: 'Do I need an account to place an order?',
                a: 'Yes, creating an account helps you track orders, save addresses, and manage your wishlist.'
            },
            {
                q: 'How do I reset my password?',
                a: 'Click "Forgot Password" on the login page and follow the instructions sent to your email.'
            },
            {
                q: 'Can I save products for later?',
                a: 'Yes! Use the wishlist feature (heart icon) to save your favorite products for future purchase.'
            },
            {
                q: 'How do I update my profile information?',
                a: 'Log in to your account and go to Profile settings to update your personal information and addresses.'
            }
        ]
    }
];

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-4 flex items-center justify-between text-left hover:text-primary transition"
            >
                <span className="font-medium pr-4">{question}</span>
                <ChevronDown
                    className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="pb-4 text-muted-foreground">
                    {answer}
                </div>
            )}
        </div>
    );
}

export default function FAQ() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <HelpCircle className="h-16 w-16 mx-auto text-primary mb-4" />
                <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                <p className="text-muted-foreground text-lg">
                    Find answers to common questions about our products and services
                </p>
            </div>

            <div className="space-y-6">
                {faqs.map((category, idx) => (
                    <Card key={idx}>
                        <CardHeader>
                            <CardTitle>{category.category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {category.questions.map((faq, qIdx) => (
                                    <FAQItem key={qIdx} question={faq.q} answer={faq.a} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="mt-8 bg-primary/5 border-primary/20">
                <CardContent className="pt-6 text-center">
                    <h3 className="font-semibold text-lg mb-2">Still have questions?</h3>
                    <p className="text-muted-foreground mb-4">
                        Our customer support team is here to help
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="mailto:muwas2021@yahoo.com"
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                        >
                            Email Us
                        </a>
                        <a
                            href="tel:+919894722186"
                            className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition"
                        >
                            Call Us
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
