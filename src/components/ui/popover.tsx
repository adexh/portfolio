import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  children: ReactNode;
  content: ReactNode;
  event?: "click" | "hover";
}

const POPOVER_BASE_WIDTH = 280;

export default function Popover({ children, content, event = "click" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: POPOVER_BASE_WIDTH,
  });

  // Handle outside click
  useEffect(() => {
    if (event === "click") {
      const handler = (e: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [event]);

  // Position popover
  useEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const horizontalMargin = viewportWidth < 640 ? 16 : 24;
      const availableWidth = Math.max(viewportWidth - horizontalMargin * 2, 0);
      const mobileWidth =
        availableWidth > 0
          ? Math.min(POPOVER_BASE_WIDTH, availableWidth)
          : Math.min(POPOVER_BASE_WIDTH, viewportWidth - 8);
      const computedWidth = viewportWidth < 640 ? mobileWidth : POPOVER_BASE_WIDTH;
      const tentativeLeft = rect.left + rect.width / 2 - computedWidth / 2 + window.scrollX;
      const minLeft = horizontalMargin + window.scrollX;
      const maxLeft = window.scrollX + viewportWidth - horizontalMargin - computedWidth;

      setPosition({
        top: rect.bottom + 12 + window.scrollY,
        left: Math.max(minLeft, Math.min(tentativeLeft, maxLeft)),
        width: computedWidth,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const triggerProps =
    event === "hover"
      ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
      : { onClick: () => setOpen((p) => !p) };

  return (
    <>
      <div className="inline-block" ref={triggerRef} {...triggerProps}>
        {children}
      </div>

      {open &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="w-full backdrop-blur-sm bg-black/35 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.3)] shadow-violet-600 p-3 z-[9999]"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
