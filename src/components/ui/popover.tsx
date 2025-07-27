import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  children: ReactNode;
  content: ReactNode;
  event?: "click" | "hover";
}

export default function Popover({ children, content, event = "click" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

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
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
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
              // transform: "translateX(-50%)",
            }}
            className="max-w-64 backdrop-blur-sm bg-black/35  rounded-lg  shadow-[0_0_15px_rgba(0,0,0,0.3)] shadow-violet-600 p-3 z-[9999]"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
