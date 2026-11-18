'use client';

import React from 'react';
import { PeerCursor } from '@/types';
import { Navigation } from 'lucide-react';

interface PeerCursorsProps {
  cursors: PeerCursor[];
}

export const PeerCursors: React.FC<PeerCursorsProps> = ({ cursors }) => {
  return (
    <>
      {cursors.map((peer) => (
        <div
          key={peer.id}
          style={{
            transform: `translate(${peer.x}px, ${peer.y}px)`,
          }}
          className="absolute top-0 left-0 pointer-events-none z-50 transition-transform duration-75 ease-out flex items-start gap-1"
        >
          <Navigation
            style={{ color: peer.color, fill: peer.color }}
            className="w-4 h-4 -rotate-45 drop-shadow-md"
          />
          <div
            style={{ backgroundColor: peer.color }}
            className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold shadow-md whitespace-nowrap"
          >
            {peer.name}
          </div>
        </div>
      ))}
    </>
  );
};
