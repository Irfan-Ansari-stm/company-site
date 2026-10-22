'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers3 } from 'lucide-react';

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(true); // Default true until checked in client
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only show once per session to prevent repeated blocking on reloads
    try {
      const alreadyShown = sessionStorage.getItem('preloader_shown');
      if (alreadyShown) {
        setIsDone(true);
        onComplete?.();
        return;
      }
    } catch {
      // Ignore sessionStorage errors
    }

    setShouldShow(true);
    setIsDone(false);

    // Quick, crisp load progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDone(true);
            try {
              sessionStorage.setItem('preloader_shown', 'true');
            } catch {}
            onComplete?.();
          }, 250);
          return 100;
        }
        const increment = Math.floor(Math.random() * 20) + 10;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    // Safety timeout: never hang longer than 1.5 seconds under any circumstance
    const safetyTimer = setTimeout(() => {
      clearInterval(interval);
      setIsDone(true);
      onComplete?.();
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, [onComplete]);

  if (!shouldShow || isDone) return null;

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1, y: 0 }}
          exit={{
            y: '-100%',
            opacity: 0.9,
            transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white"
          role="status"
          aria-label="Loading SysMaira Enterprise"
        >
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12)_0,transparent_65%)]" />

          <div className="relative z-10 flex flex-col items-center px-4">
            {/* Logo Icon */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl shadow-violet-500/25"
            >
              <Layers3 className="h-7 w-7" />
            </motion.div>

            {/* Brand Title */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="mt-5 text-2xl font-black tracking-normal text-slate-900 dark:text-white sm:text-3xl"
            >
              SysMaira Enterprise
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-1.5 text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400"
            >
              Engineering Next-Generation Enterprise Systems
            </motion.p>

            {/* Progress bar container */}
            <div className="mt-8 flex w-56 flex-col items-center">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 font-mono text-xs font-bold text-violet-600 dark:text-cyan-300">
                {progress}%
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
