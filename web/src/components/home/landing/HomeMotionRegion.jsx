/*
 * Copyright (c) 2026 燧弘华创
 * Project: token-factory
 */

import React, { useEffect, useRef } from 'react';

/** One motion region owns CSS and native SVG animation visibility. */
export default function HomeMotionRegion({
  paused = false,
  reveal = false,
  children,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reveal && !root.dataset.revealed) root.dataset.revealed = 'pending';
    let visible = false;
    const sync = () => {
      const stopped =
        paused || preference.matches || document.hidden || !visible;
      root.dataset.motion = stopped ? 'paused' : 'playing';
      if (reveal && (paused || preference.matches))
        root.dataset.revealed = 'static';
      root.querySelectorAll('svg').forEach((svg) => {
        if (stopped) svg.pauseAnimations?.();
        else svg.unpauseAnimations?.();
      });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && root.dataset.revealed === 'pending')
          root.dataset.revealed = 'true';
        sync();
      },
      { threshold: 0.01 },
    );
    observer.observe(root);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      root.querySelectorAll('svg').forEach((svg) => svg.pauseAnimations?.());
    };
  }, [paused, reveal]);
  return (
    <div
      className='hc-motion-region'
      data-motion='paused'
      data-reveal={reveal || undefined}
      ref={ref}
    >
      {children}
    </div>
  );
}
