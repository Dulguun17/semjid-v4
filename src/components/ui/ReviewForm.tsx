"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Send } from 'lucide-react';

export function ReviewForm({ roomId }: { roomId?: string }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId || 'general',
          fname: name.trim(),
          rating: parseInt(rating),
          comment: comment.trim(),
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Review submission error:', responseData);
        throw new Error(responseData.error || 'Failed to submit review');
      }

      console.log('✅ Review submitted:', responseData);

      // Reset form
      setName('');
      setComment('');
      setRating(5);
      alert('✅ आपकी समीक्षा सफलतापूर्वक जमा की गई! (Your review was submitted successfully!)');
      
      // Reload to show new review
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit review. Please try again.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="focus:outline-none"
              >
                <Star
                  size={24}
                  className={i <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded h-24"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-teal text-white px-4 py-2 rounded hover:bg-teal-dark disabled:opacity-50"
        >
          <Send size={16} />
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
