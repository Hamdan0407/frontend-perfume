import { Truck, Package, Clock, MapPin, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function ShippingInfo() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Shipping Information</h1>
                <p className="text-muted-foreground text-lg">
                    Fast, reliable delivery to your doorstep
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Delivery Options
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border-l-4 border-primary pl-4">
                            <h3 className="font-semibold text-lg">Standard Delivery</h3>
                            <p className="text-muted-foreground">5-7 business days</p>
                            <p className="text-primary font-semibold">₹99 (Free on orders above ₹999)</p>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-4">
                            <h3 className="font-semibold text-lg">Express Delivery</h3>
                            <p className="text-muted-foreground">2-3 business days</p>
                            <p className="text-orange-600 font-semibold">₹199</p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                            <h3 className="font-semibold text-lg">Same Day Delivery</h3>
                            <p className="text-muted-foreground">Available in select cities</p>
                            <p className="text-green-600 font-semibold">₹299</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order Processing
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium">Order Confirmation</p>
                                    <p className="text-sm text-muted-foreground">
                                        You'll receive an email confirmation immediately after placing your order
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium">Processing Time</p>
                                    <p className="text-sm text-muted-foreground">
                                        Orders are processed within 1-2 business days
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-medium">Shipping Notification</p>
                                    <p className="text-sm text-muted-foreground">
                                        Track your order with the tracking number sent via email
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Delivery Coverage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">We deliver across India to the following areas:</p>
                        <ul className="grid md:grid-cols-2 gap-2 text-sm">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                All major cities
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Tier 2 & Tier 3 cities
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Remote areas (additional charges may apply)
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Cash on Delivery available
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Important Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Delivery times are estimates and may vary during peak seasons</li>
                            <li>• Someone must be present to receive the package</li>
                            <li>• Please ensure your address is complete and accurate</li>
                            <li>• For international shipping, please contact customer support</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
