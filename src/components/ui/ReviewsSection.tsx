"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, User } from 'lucide-react';
import { ReviewForm } from './ReviewForm';

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
  room_id?: string;
};

export function ReviewsSection({ roomId }: { roomId?: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (roomId) {
        query = query.eq('room_id', roomId);
      }
      const { data } = await query;
      setReviews(data || []);
      setLoading(false);
    };

    fetchReviews();
  }, [roomId]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Guest Reviews</h2>

      {reviews.length > 0 && (
        <div className="mb-6 flex items-center gap-2">
          <div className="flex">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                size={20}
                className={i <= Math.round(averageRating) ? "text-yellow-400 fill-current" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
          <span className="text-gray-600">({reviews.length} reviews)</span>
        </div>
      )}

      <div className="space-y-6">
        {reviews.map(review => (
          <div key={review.id} className="border-b pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-500" />
              </div>
              <div>
                <p className="font-semibold">{review.name}</p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star
                      key={i}
                      size={14}
                      className={i <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-gray-700">{review.comment}</p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
      )}

      <div className="mt-8">
        <ReviewForm roomId={roomId} />
      </div>
    </div>
  );
}
