import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import toast from '../utils/toast';
import api from '../api/axios';

export default function BulkInquiryModal({ isOpen, onOpenChange }) {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        quantity: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('contact', {
                name: formData.name,
                email: formData.email,
                subject: `Bulk Pricing Inquiry - ${formData.quantity} units`,
                message: `Quantity: ${formData.quantity}\n\nMessage: ${formData.message}`
            });
            toast.success('Inquiry sent successfully! We will contact you soon.');
            onOpenChange(false);
            setFormData({ name: '', email: '', quantity: '', message: '' });
            setShowForm(false);
        } catch (error) {
            toast.error('Failed to send inquiry. Please try again.');
            console.error('Bulk inquiry error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            onOpenChange(open);
            if (!open) setTimeout(() => setShowForm(false), 300);
        }}>
            <DialogContent className="sm:max-w-[500px]">
                {!showForm ? (
                    <div className="py-6 text-center">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-center">Bulk Pricing</DialogTitle>
                            <DialogDescription className="text-center mt-4 text-sm">
                                Looking to order in large quantities for your business, events, or gifting?
                                We offer special discounted rates for bulk orders.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-8">
                            <Button size="lg" onClick={() => setShowForm(true)} className="px-8 bg-black hover:bg-black/90 text-white">
                                Contact Us for Bulk Pricing
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Bulk Pricing Inquiry</DialogTitle>
                            <DialogDescription>
                                Fill out the form below and our team will get back to you with a custom quote.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name</label>
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Approx. Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none"
                                        placeholder="e.g. 50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none"
                                    placeholder="Tell us about your requirements..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                                    Back
                                </Button>
                                <Button type="submit" disabled={loading} className="flex-1 bg-black hover:bg-black/90 text-white">
                                    {loading ? 'Sending...' : 'Submit Inquiry'}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
