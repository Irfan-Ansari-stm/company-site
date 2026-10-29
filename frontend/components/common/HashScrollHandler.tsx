'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function HashScrollHandler() {
  const pathname = usePathname();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scrollToHash = (hashStr?: string) => {
      const rawHash = hashStr !== undefined ? hashStr : window.location.hash;
      if (!rawHash) return;

      const targetId = decodeURIComponent(rawHash.replace(/^#/, ''));
      if (!targetId) return;

      const attemptScroll = (retryCount = 0) => {
        const element = document.getElementById(targetId);

        if (element) {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          element.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start',
          });
        } else if (retryCount < 5) {
          // If destination section is still rendering after page transition, retry with exponential backoff
          const delay = (retryCount + 1) * 75;
          retryTimeoutRef.current = setTimeout(() => {
            attemptScroll(retryCount + 1);
          }, delay);
        }
      };

      // Initial RAF execution
      requestAnimationFrame(() => attemptScroll(0));
    };

    // 1. Check hash on mount and pathname change
    scrollToHash();

    // 2. Listen to hashchange & popstate events
    const handleHashChange = () => {
      scrollToHash();
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // 3. Intercept clicks on links pointing to current page with hash
    const handleDocumentClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Check if href is a hash link or points to current page + hash
      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        window.history.pushState(null, '', href);
        scrollToHash(href);
      } else if (href.includes('#')) {
        const [targetPath, hashPart] = href.split('#');
        const currentPath = window.location.pathname;

        // If targetPath is empty or matches current pathname
        if (
          targetPath === '' ||
          targetPath === currentPath ||
          (targetPath.endsWith('/') && targetPath.slice(0, -1) === currentPath) ||
          (currentPath.endsWith('/') && currentPath.slice(0, -1) === targetPath)
        ) {
          e.preventDefault();
          const newUrl = `${currentPath}#${hashPart}`;
          window.history.pushState(null, '', newUrl);
          scrollToHash(`#${hashPart}`);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, [pathname]);

  return null;
}

