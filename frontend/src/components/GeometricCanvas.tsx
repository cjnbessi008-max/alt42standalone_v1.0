import React, { useRef, useEffect } from 'react';
import { Point } from '../types';

interface GeometricCanvasProps {
    vertices: Point[];
    color?: string;
    fillColor?: string;
    showLabels?: boolean;
    highlightRatios?: boolean;
    label?: string;
    scale?: number;
}

const GeometricCanvas: React.FC<GeometricCanvasProps> = ({
    vertices,
    color = '#3b82f6',
    fillColor = 'rgba(59, 130, 246, 0.1)',
    showLabels = true,
    highlightRatios = false,
    label = '',
    scale = 1,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || vertices.length < 3) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate bounding box for normalization
        const xs = vertices.map(v => v.x);
        const ys = vertices.map(v => v.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const shapeWidth = maxX - minX;
        const shapeHeight = maxY - minY;

        const padding = 40;
        const scaleX = (canvas.width - 2 * padding) / shapeWidth;
        const scaleY = (canvas.height - 2 * padding) / shapeHeight;
        const finalScale = Math.min(scaleX, scaleY) * scale;

        // Transform vertices to canvas coordinates
        const transformedVertices = vertices.map(v => ({
            x: (v.x - minX) * finalScale + padding,
            y: (v.y - minY) * finalScale + padding,
        }));

        // Draw shape
        ctx.beginPath();
        ctx.moveTo(transformedVertices[0].x, transformedVertices[0].y);
        for (let i = 1; i < transformedVertices.length; i++) {
            ctx.lineTo(transformedVertices[i].x, transformedVertices[i].y);
        }
        ctx.closePath();

        // Fill
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = color;
        ctx.lineWidth = highlightRatios ? 3 : 2;
        ctx.stroke();

        // Draw vertices
        transformedVertices.forEach((vertex, index) => {
            ctx.beginPath();
            ctx.arc(vertex.x, vertex.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();

            // Draw labels
            if (showLabels) {
                ctx.fillStyle = '#1f2937';
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(
                    String.fromCharCode(65 + index), // A, B, C, ...
                    vertex.x + 10,
                    vertex.y - 10
                );
            }
        });

        // Draw side lengths if highlighting ratios
        if (highlightRatios) {
            ctx.fillStyle = '#dc2626';
            ctx.font = 'bold 12px sans-serif';

            for (let i = 0; i < transformedVertices.length; i++) {
                const v1 = transformedVertices[i];
                const v2 = transformedVertices[(i + 1) % transformedVertices.length];
                const midX = (v1.x + v2.x) / 2;
                const midY = (v1.y + v2.y) / 2;

                // Calculate actual distance
                const dx = vertices[(i + 1) % vertices.length].x - vertices[i].x;
                const dy = vertices[(i + 1) % vertices.length].y - vertices[i].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                ctx.fillText(distance.toFixed(1), midX, midY);
            }
        }

        // Draw shape label
        if (label) {
            ctx.fillStyle = color;
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(label, 10, 25);
        }
    }, [vertices, color, fillColor, showLabels, highlightRatios, label, scale]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="border-2 border-gray-300 rounded-lg bg-white"
        />
    );
};

export default GeometricCanvas;
