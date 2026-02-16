import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

export default function RatingModal({ isOpen, onClose, product, orderId, onSuccess }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/reviews', {
                orderId,
                productId: product.id,
                rating,
                title,
                comment
            });

            toast.success('Review submitted successfully!');
            onSuccess?.();
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setHoverRating(0);
        setTitle('');
        setComment('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Rate {product?.name}</DialogTitle>
                    <DialogDescription>
                        Share your experience with this product
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-10 w-10 ${star <= (hoverRating || rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {rating === 0 ? 'Click to rate' :
                                rating === 1 ? 'Poor' :
                                    rating === 2 ? 'Fair' :
                                        rating === 3 ? 'Good' :
                                            rating === 4 ? 'Very Good' : 'Excellent'}
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Review Title (Optional)
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={100}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="Summarize your experience"
                        />
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Your Review (Optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={2000}
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Tell us more about your experience..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {comment.length}/2000 characters
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || rating === 0}>
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
