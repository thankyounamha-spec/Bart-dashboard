import { useState, useRef, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {visible && content && (
        <div
          className={`absolute z-50 px-2.5 py-1.5 text-xs font-mono bg-gray-800 border border-gray-600 text-gray-200 rounded-md shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
