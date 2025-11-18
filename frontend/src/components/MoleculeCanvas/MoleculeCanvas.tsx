import React, { useEffect, useRef, useState } from 'react';
import type { Molecule } from '../../types';
import { getColorForNumber, isDivisor } from '../../utils/divisor';

interface MoleculeCanvasProps {
  targetNumber: number;
  divisors: number[];
  onDivisorFound?: (divisor: number) => void;
  foundDivisors?: number[];
}

const MoleculeCanvas: React.FC<MoleculeCanvasProps> = ({
  targetNumber,
  divisors,
  onDivisorFound,
  foundDivisors = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [draggedMolecule, setDraggedMolecule] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize molecules
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create target molecule (center, larger)
    const targetMolecule: Molecule = {
      id: 'target',
      number: targetNumber,
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      radius: 40,
      color: getColorForNumber(targetNumber),
    };

    // Create divisor molecules (scattered around)
    const divisorMolecules: Molecule[] = divisors.map((num, index) => {
      const angle = (index / divisors.length) * Math.PI * 2;
      const distance = 150;

      return {
        id: `divisor-${num}`,
        number: num,
        x: width / 2 + Math.cos(angle) * distance,
        y: height / 2 + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 25,
        color: getColorForNumber(num),
      };
    });

    setMolecules([targetMolecule, ...divisorMolecules]);
  }, [targetNumber, divisors]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw molecules
      setMolecules((prevMolecules) => {
        const updated = prevMolecules.map((molecule) => {
          if (molecule.id === 'target' || molecule.isDragging) {
            return molecule;
          }

          let { x, y, vx, vy } = molecule;

          // Apply physics
          x += vx;
          y += vy;

          // Bounce off walls
          if (x - molecule.radius < 0 || x + molecule.radius > canvas.width) {
            vx = -vx;
            x = Math.max(molecule.radius, Math.min(canvas.width - molecule.radius, x));
          }

          if (y - molecule.radius < 0 || y + molecule.radius > canvas.height) {
            vy = -vy;
            y = Math.max(molecule.radius, Math.min(canvas.height - molecule.radius, y));
          }

          // Attraction to target if it's a divisor
          const target = prevMolecules.find(m => m.id === 'target');
          if (target && isDivisor(molecule.number, target.number)) {
            const dx = target.x - x;
            const dy = target.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 100) {
              const force = 0.1;
              vx += (dx / distance) * force;
              vy += (dy / distance) * force;
            }
          }

          // Apply friction
          vx *= 0.98;
          vy *= 0.98;

          return { ...molecule, x, y, vx, vy };
        });

        // Draw molecules
        updated.forEach((molecule) => {
          drawMolecule(ctx, molecule, foundDivisors.includes(molecule.number));
        });

        // Draw connections
        const target = updated.find(m => m.id === 'target');
        if (target) {
          updated.forEach((molecule) => {
            if (
              molecule.id !== 'target' &&
              isDivisor(molecule.number, target.number) &&
              foundDivisors.includes(molecule.number)
            ) {
              drawConnection(ctx, target, molecule);
            }
          });
        }

        return updated;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [foundDivisors]);

  const drawMolecule = (
    ctx: CanvasRenderingContext2D,
    molecule: Molecule,
    isFound: boolean
  ) => {
    // Draw molecule circle
    ctx.beginPath();
    ctx.arc(molecule.x, molecule.y, molecule.radius, 0, Math.PI * 2);
    ctx.fillStyle = isFound ? '#4CAF50' : molecule.color;
    ctx.fill();

    // Draw border
    ctx.strokeStyle = isFound ? '#2E7D32' : '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw number
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${molecule.radius * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(molecule.number.toString(), molecule.x, molecule.y);

    // Draw glow effect for target
    if (molecule.id === 'target') {
      ctx.beginPath();
      ctx.arc(molecule.x, molecule.y, molecule.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawConnection = (
    ctx: CanvasRenderingContext2D,
    from: Molecule,
    to: Molecule
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  // Mouse/touch handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked molecule
    const clicked = molecules.find((m) => {
      const dx = m.x - x;
      const dy = m.y - y;
      return Math.sqrt(dx * dx + dy * dy) < m.radius;
    });

    if (clicked && clicked.id !== 'target') {
      setDraggedMolecule(clicked.id);
      setMolecules((prev) =>
        prev.map((m) =>
          m.id === clicked.id ? { ...m, isDragging: true, vx: 0, vy: 0 } : m
        )
      );
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggedMolecule) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMolecules((prev) =>
      prev.map((m) => (m.id === draggedMolecule ? { ...m, x, y } : m))
    );
  };

  const handlePointerUp = () => {
    if (!draggedMolecule) return;

    const draggedMol = molecules.find((m) => m.id === draggedMolecule);
    const target = molecules.find((m) => m.id === 'target');

    if (draggedMol && target) {
      const dx = target.x - draggedMol.x;
      const dy = target.y - draggedMol.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if molecule is close to target
      if (distance < target.radius + draggedMol.radius + 20) {
        // Check if it's a valid divisor
        if (
          isDivisor(draggedMol.number, target.number) &&
          !foundDivisors.includes(draggedMol.number)
        ) {
          onDivisorFound?.(draggedMol.number);
        }
      }
    }

    setMolecules((prev) =>
      prev.map((m) =>
        m.id === draggedMolecule ? { ...m, isDragging: false } : m
      )
    );
    setDraggedMolecule(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={500}
      className="touch-none cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-inner"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};

export default MoleculeCanvas;
