import React from 'react';

interface PixelAgentAvatarProps {
  size?: number;
  className?: string;
}

// 12x12 Pixel Art Grid representing the cute retro pixel agent avatar from the reference image
const PIXEL_GRID: (string | null)[][] = [
  [null, null, null, '#fbcfe8', '#f472b6', '#ec4899', '#ec4899', '#f472b6', '#fbcfe8', null, null, null],
  [null, null, '#fbcfe8', '#ec4899', '#db2777', '#be185d', '#be185d', '#db2777', '#ec4899', '#fbcfe8', null, null],
  [null, '#fbcfe8', '#ec4899', '#db2777', '#be185d', '#f472b6', '#f472b6', '#be185d', '#db2777', '#ec4899', '#fbcfe8', null],
  ['#fbcfe8', '#ec4899', '#db2777', '#be185d', '#ffffff', '#db2777', '#db2777', '#ffffff', '#be185d', '#db2777', '#ec4899', '#fbcfe8'],
  ['#f472b6', '#db2777', '#be185d', '#be185d', '#ffffff', '#be185d', '#be185d', '#ffffff', '#be185d', '#be185d', '#db2777', '#f472b6'],
  ['#ec4899', '#db2777', '#be185d', '#be185d', '#db2777', '#f472b6', '#f472b6', '#db2777', '#be185d', '#be185d', '#db2777', '#ec4899'],
  ['#ec4899', '#db2777', '#be185d', '#db2777', '#ec4899', '#fbcfe8', '#fbcfe8', '#ec4899', '#db2777', '#be185d', '#db2777', '#ec4899'],
  ['#f472b6', '#ec4899', '#db2777', '#be185d', '#be185d', '#db2777', '#db2777', '#be185d', '#be185d', '#db2777', '#ec4899', '#f472b6'],
  ['#fbcfe8', '#ec4899', '#db2777', '#be185d', '#f472b6', '#ec4899', '#ec4899', '#f472b6', '#be185d', '#db2777', '#ec4899', '#fbcfe8'],
  [null, '#fbcfe8', '#ec4899', '#db2777', '#be185d', '#be185d', '#be185d', '#be185d', '#db2777', '#ec4899', '#fbcfe8', null],
  [null, null, '#fbcfe8', '#ec4899', '#db2777', '#be185d', '#be185d', '#db2777', '#ec4899', '#fbcfe8', null, null],
  [null, null, null, '#fbcfe8', '#f472b6', '#ec4899', '#ec4899', '#f472b6', '#fbcfe8', null, null, null],
];

export default function PixelAgentAvatar({ size = 56, className = '' }: PixelAgentAvatarProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 12 12" 
        width={size} 
        height={size} 
        style={{ shapeRendering: 'crispEdges' }}
        className="w-full h-full drop-shadow-sm"
      >
        {PIXEL_GRID.map((row, y) =>
          row.map((color, x) =>
            color ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={color}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
