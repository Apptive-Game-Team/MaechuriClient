import React, { useState, useEffect } from 'react';

interface AssetRendererProps {
  imageUrl: string;
  size: number;
  position: { x: number; y: number };
  scaleMultiplier?: number; // New prop for dynamic scaling
}

export const AssetRenderer: React.FC<AssetRendererProps> = ({ imageUrl, size, position, scaleMultiplier = 1.3 }) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      if (naturalWidth > 0 && naturalHeight > 0) {
        const targetLongSide = scaleMultiplier * size; // Use scaleMultiplier here
        let scaleFactor;

        if (naturalWidth >= naturalHeight) {
          scaleFactor = targetLongSide / naturalWidth;
        } else {
          scaleFactor = targetLongSide / naturalHeight;
        }
        
        setDimensions({
          width: naturalWidth * scaleFactor,
          height: naturalHeight * scaleFactor,
        });
      } else {
        console.warn(`Could not load dimensions for image: ${imageUrl}`);
      }
    };

    img.onerror = () => {
      console.error(`Failed to load image: ${imageUrl}`);
    };
  }, [imageUrl, size, scaleMultiplier]); // Add scaleMultiplier to dependency array

  if (!dimensions) {
    return null;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x * size + (size - dimensions.width) / 2, // Center horizontally
    top: position.y * size + (size - dimensions.height), // Align bottom
    width: dimensions.width,
    height: dimensions.height,
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: '100% 100%',
    backgroundPosition: 'center',
    imageRendering: 'pixelated',
    zIndex: Math.floor(position.y * size + size), // Basic z-indexing
  };

  return <div style={style} />;
};