import React, { useRef, useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";

const MIN_WIDTH = 180;
const MAX_WIDTH = 420;

const Sidebar = ({ width, onResize, linkSearch }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width || 240);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const delta = clientX - startXRef.current;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));
      onResize && onResize(next);
    };
    const handleUp = () => {
      if (isDragging) setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, onResize]);

  const startDrag = (e) => {
    setIsDragging(true);
    startXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
    startWidthRef.current = width || 240;
    e.preventDefault();
  };

  return (
    <div
      className="h-full flex flex-col bg-white border-r select-none relative"
      style={{ width: width || 240, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
    >
      <div className="px-4 py-3 border-b font-semibold">Collabify</div>
      <nav className="flex-1 overflow-auto">
        <ul className="py-2">
          <li>
            <RouterLink className="block px-4 py-2 hover:bg-gray-50" to="/documents">Documents</RouterLink>
          </li>
          <li>
            <RouterLink className="block px-4 py-2 hover:bg-gray-50" to={{ pathname: "/collaborators", search: linkSearch ?? (typeof window !== 'undefined' ? window.location.search : '') }}>Collaborators</RouterLink>
          </li>
          <li>
            <RouterLink className="block px-4 py-2 hover:bg-gray-50" to={{ pathname: "/tasks", search: linkSearch ?? (typeof window !== 'undefined' ? window.location.search : '') }}>Tasks</RouterLink>
          </li>
          <li>
            <RouterLink className="block px-4 py-2 hover:bg-gray-50" to="/profile">Profile</RouterLink>
          </li>
          <li>
            <RouterLink className="block px-4 py-2 hover:bg-gray-50" to="/settings">Settings</RouterLink>
          </li>
        </ul>
      </nav>
      <div
        className={`w-1 cursor-col-resize bg-transparent hover:bg-gray-300 ${isDragging ? 'bg-gray-400' : ''}`}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{ position: 'absolute', top: 0, right: -2, bottom: 0 }}
      />
    </div>
  );
};

export default Sidebar;
