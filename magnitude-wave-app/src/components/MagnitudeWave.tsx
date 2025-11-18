import { useEffect, useRef, useState } from 'react';

interface MagnitudeWaveProps {
  magnitude: number;
  width?: number;
  height?: number;
  color?: string;
}

export const MagnitudeWave: React.FC<MagnitudeWaveProps> = ({
  magnitude,
  width = 400,
  height = 300,
  color = '#4F46E5',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Calculate wave parameters
      const amplitude = Math.min((magnitude / 100) * (height / 3), height / 2.5);
      const frequency = 0.02;
      const verticalOffset = height / 2;

      // Draw wave
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      for (let x = 0; x < width; x++) {
        const y = verticalOffset + amplitude * Math.sin(frequency * x + phase);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Draw magnitude text
      ctx.fillStyle = color;
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`크기: ${magnitude.toFixed(1)}`, width / 2, 40);

      // Draw amplitude indicator
      ctx.fillStyle = 'rgba(79, 70, 229, 0.1)';
      ctx.fillRect(0, verticalOffset - amplitude, width, amplitude * 2);

      // Update phase for animation
      setPhase((prev) => prev + 0.05);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [magnitude, width, height, color, phase]);

  return (
    <div className="flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          숫자가 클수록 물결의 진폭이 커집니다
        </p>
      </div>
    </div>
  );
};
