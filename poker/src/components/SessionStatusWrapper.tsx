import { useEffect, ReactNode } from 'react';
import { useSessionStatus } from '../hooks/useSessionStatus';

interface SessionStatusWrapperProps {
  children: ReactNode;
}

export function SessionStatusWrapper({ children }: SessionStatusWrapperProps) {
  const status = useSessionStatus();

  // Actively hide the Croquet/Multisynq spinner overlay when detected
  useEffect(() => {
    const hideAllOverlays = () => {
      // Hide by ID
      const ids = ['croquet_spinnerOverlay', 'croquet_overlay'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          el.remove();
        }
      });

      // Hide by class
      const classes = ['.croquet_fatal', '.croquet_spinnerOverlay', '.croquet_overlay'];
      classes.forEach(cls => {
        document.querySelectorAll(cls).forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'none';
          htmlEl.style.opacity = '0';
          htmlEl.style.visibility = 'hidden';
          htmlEl.remove();
        });
      });

      // Hide any element with croquet in id or class
      document.querySelectorAll('[id*="croquet"], [class*="croquet"]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = 'none';
        htmlEl.style.opacity = '0';
        htmlEl.style.visibility = 'hidden';
      });

      // Hide fixed position overlays with high z-index (common pattern for loading overlays)
      document.querySelectorAll('div').forEach((el) => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        if (style.position === 'fixed' && zIndex >= 9999 && el.id !== 'root') {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
        }
      });
    };

    // Run immediately and repeatedly for the first few seconds
    hideAllOverlays();
    const interval = setInterval(hideAllOverlays, 100);
    setTimeout(() => clearInterval(interval), 5000);

    // Also observe for any new spinner elements being added
    const observer = new MutationObserver(hideAllOverlays);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // You can optionally show your own loading state here
  // For now, we just render children and hide the default spinner
  return <>{children}</>;
}
