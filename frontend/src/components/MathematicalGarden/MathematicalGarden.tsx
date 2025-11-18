import React, { useState, useEffect, useRef } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { GardenObject, ObjectType } from '@/types';
import './MathematicalGarden.css';
import FlowerObject from './objects/FlowerObject';
import TreeObject from './objects/TreeObject';
import BushObject from './objects/BushObject';

interface MathematicalGardenProps {
  numbers: number[];
  layout?: 'grid' | 'circular' | 'linear' | 'random';
  objectType?: ObjectType;
  onObjectClick?: (obj: GardenObject, index: number) => void;
  showLabels?: boolean;
  animationType?: 'fade' | 'grow' | 'bounce' | 'slide';
}

const MathematicalGarden: React.FC<MathematicalGardenProps> = ({
  numbers,
  layout = 'grid',
  objectType = 'flower',
  onObjectClick,
  showLabels = true,
  animationType = 'grow',
}) => {
  const [gardenObjects, setGardenObjects] = useState<GardenObject[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate garden objects from numbers
  useEffect(() => {
    const objects: GardenObject[] = numbers.map((num, index) => {
      const position = calculatePosition(index, numbers.length, layout);
      const color = getColorForNumber(num, index);

      return {
        id: index,
        type: objectType,
        position,
        size: Math.max(20, Math.min(num * 15, 100)), // Size based on value
        color,
        value: num,
        label: showLabels ? num.toString() : undefined,
        interactive: true,
      };
    });

    setGardenObjects(objects);
  }, [numbers, layout, objectType, showLabels]);

  // Calculate position based on layout
  const calculatePosition = (
    index: number,
    total: number,
    layout: string
  ): { x: number; y: number } => {
    const containerWidth = 350;
    const containerHeight = 700;
    const padding = 40;

    switch (layout) {
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(total));
        const rows = Math.ceil(total / cols);
        const cellWidth = (containerWidth - padding * 2) / cols;
        const cellHeight = (containerHeight - padding * 2) / rows;
        const col = index % cols;
        const row = Math.floor(index / cols);
        return {
          x: padding + col * cellWidth + cellWidth / 2,
          y: padding + row * cellHeight + cellHeight / 2,
        };
      }

      case 'circular': {
        const radius = Math.min(containerWidth, containerHeight) / 2 - 60;
        const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
        return {
          x: containerWidth / 2 + Math.cos(angle) * radius,
          y: containerHeight / 2 + Math.sin(angle) * radius,
        };
      }

      case 'linear': {
        const spacing = (containerWidth - padding * 2) / (total - 1 || 1);
        return {
          x: padding + index * spacing,
          y: containerHeight / 2,
        };
      }

      case 'random': {
        return {
          x: padding + Math.random() * (containerWidth - padding * 2),
          y: padding + Math.random() * (containerHeight - padding * 2),
        };
      }

      default:
        return { x: 50, y: 50 };
    }
  };

  // Get color based on number value
  const getColorForNumber = (num: number, index: number): string => {
    const colors = [
      '#FF6B6B', // red
      '#4ECDC4', // cyan
      '#FFE66D', // yellow
      '#A06CD5', // purple
      '#FF85B3', // pink
      '#7EC850', // green
      '#FF9A76', // orange
      '#6C5CE7', // indigo
    ];

    // Color based on value ranges
    if (num <= 3) return colors[4]; // pink for small
    if (num <= 5) return colors[2]; // yellow for medium-small
    if (num <= 7) return colors[1]; // cyan for medium
    if (num <= 9) return colors[5]; // green for medium-large
    return colors[0]; // red for large

    // Or use index-based coloring
    // return colors[index % colors.length];
  };

  // Handle object click
  const handleObjectClick = (obj: GardenObject, index: number) => {
    setSelectedIndex(index);
    if (onObjectClick) {
      onObjectClick(obj, index);
    }
  };

  // Render garden object based on type
  const renderObject = (obj: GardenObject, index: number) => {
    const isSelected = selectedIndex === index;
    const delay = index * 100; // Stagger animation

    const commonProps = {
      object: obj,
      isSelected,
      onClick: () => handleObjectClick(obj, index),
      delay,
      animationType,
    };

    switch (obj.type) {
      case 'flower':
        return <FlowerObject key={obj.id} {...commonProps} />;
      case 'tree':
        return <TreeObject key={obj.id} {...commonProps} />;
      case 'bush':
        return <BushObject key={obj.id} {...commonProps} />;
      default:
        return <FlowerObject key={obj.id} {...commonProps} />;
    }
  };

  return (
    <div className="mathematical-garden" ref={containerRef}>
      {/* Sky Background */}
      <div className="garden-sky">
        <div className="garden-sun"></div>
        <div className="garden-cloud cloud-1"></div>
        <div className="garden-cloud cloud-2"></div>
      </div>

      {/* Ground */}
      <div className="garden-ground"></div>

      {/* Garden Objects */}
      <div className="garden-objects-container">
        {gardenObjects.map((obj, index) => renderObject(obj, index))}
      </div>

      {/* Selected Info */}
      {selectedIndex !== null && gardenObjects[selectedIndex] && (
        <div className="garden-selected-info animate-slide-up">
          <div className="info-number">
            {gardenObjects[selectedIndex].value}
          </div>
          <div className="info-label">Selected Number</div>
        </div>
      )}
    </div>
  );
};

export default MathematicalGarden;
