'use client';

import { useEffect, useRef } from 'react';
import { incrementViews } from '@/lib/data-client';

type ViewTrackerProps = {
  articleSlug: string;
};

export default function ViewTracker({ articleSlug }: ViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent double-tracking in development mode (React StrictMode)
    if (hasTracked.current) return;

    const trackView = async () => {
      try {
        // Check localStorage for view tracking
        const viewKey = `article-view-${articleSlug}`;
        const lastViewTime = localStorage.getItem(viewKey);
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        // If user hasn't viewed this article, or it's been more than 24 hours
        if (!lastViewTime || (now - parseInt(lastViewTime)) > twentyFourHours) {
          // Mark as tracked immediately to prevent race conditions
          hasTracked.current = true;
          localStorage.setItem(viewKey, now.toString());

          // Call the proper incrementViews function that maintains view history
          await incrementViews(articleSlug);

          console.log(`View tracked for article: ${articleSlug}`);
        } else {
          console.log(`View already tracked for article: ${articleSlug} (within 24h window)`);
        }
      } catch (error) {
        console.error('Error tracking article view:', error);
      }
    };

    trackView();
  }, [articleSlug]);

  // This component doesn't render anything
  return null;
}
