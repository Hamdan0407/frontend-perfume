import { RotateCcw, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function ReturnsExchange() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Exchange Policy</h1>
                <p className="text-muted-foreground text-lg">
                    We want you to love your purchase. If not, we're here to help.
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5" />
                            Exchange Eligibility
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            We offer a <span className="font-semibold text-foreground">7-day exchange policy</span> from the date of delivery.
                        </p>
                        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                Eligible for Exchange:
                            </h3>
                            <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5" />
                                    Unopened and unused products in original packaging
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5" />
                                    Products with manufacturing defects
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5" />
                                    Wrong product delivered
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5" />
                                    Damaged during shipping
                                </li>
                            </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                                Not Eligible for Exchange:
                            </h3>
                            <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                                <li className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5" />
                                    Opened or used perfumes (hygiene reasons)
                                </li>
                                <li className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5" />
                                    Products without original packaging
                                </li>
                                <li className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5" />
                                    Sale or clearance items
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Exchange Policy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            We offer exchanges for the same product in a different size or variant within 7 days.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <span className="font-bold text-primary">1</span>
                                </div>
                                <div>
                                    <p className="font-medium">Contact Us</p>
                                    <p className="text-sm text-muted-foreground">
                                        Email us at muwas2021@yahoo.com with your order number
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <span className="font-bold text-primary">2</span>
                                </div>
                                <div>
                                    <p className="font-medium">Get Approval</p>
                                    <p className="text-sm text-muted-foreground">
                                        We'll review and approve your exchange request
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <span className="font-bold text-primary">3</span>
                                </div>
                                <div>
                                    <p className="font-medium">Ship Back</p>
                                    <p className="text-sm text-muted-foreground">
                                        Send the product back using our prepaid shipping label
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <span className="font-bold text-primary">4</span>
                                </div>
                                <div>
                                    <p className="font-medium">Receive Exchange</p>
                                    <p className="text-sm text-muted-foreground">
                                        Your exchange will be shipped within 2-3 business days
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>


                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Need Help?</strong> Contact our customer support at{' '}
                            <a href="mailto:muwas2021@yahoo.com" className="underline">
                                muwas2021@yahoo.com
                            </a>{' '}
                            or call +91-9894722186
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
