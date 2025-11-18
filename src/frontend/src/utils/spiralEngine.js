/**
 * Geo Spiral Engine - 등비수열 나선형 계산 및 렌더링
 */

/**
 * Calculate spiral points based on sequence
 * @param {Object} sequence - Sequence configuration
 * @returns {Array} Array of {x, y, value, angle, radius} points
 */
export function calculateSpiralPoints(sequence) {
  const points = [];
  const { first_term, common_ratio, num_terms, spiral_type, sequence_type } = sequence;

  if (sequence_type === 'fibonacci') {
    return calculateFibonacciSpiral(num_terms);
  }

  if (sequence_type === 'geometric' && common_ratio) {
    return calculateGeometricSpiral(first_term, common_ratio, num_terms, spiral_type);
  }

  return points;
}

/**
 * Calculate geometric spiral points
 */
function calculateGeometricSpiral(firstTerm, ratio, numTerms, spiralType) {
  const points = [];
  const angleIncrement = (2 * Math.PI) / 8; // 45 degrees per term

  for (let n = 0; n < numTerms; n++) {
    const value = firstTerm * Math.pow(ratio, n);
    const angle = n * angleIncrement;

    let radius;
    if (spiralType === 'logarithmic') {
      // Logarithmic spiral: r = a * e^(b*θ)
      const a = 10;
      const b = Math.log(ratio) / angleIncrement;
      radius = a * Math.exp(b * angle);
    } else if (spiralType === 'archimedean') {
      // Archimedean spiral: r = a + b*θ
      const a = 5;
      const b = 5;
      radius = a + b * angle;
    } else {
      // Default to logarithmic
      const a = 10;
      const b = Math.log(ratio) / angleIncrement;
      radius = a * Math.exp(b * angle);
    }

    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    points.push({
      x,
      y,
      value,
      angle,
      radius,
      index: n
    });
  }

  return points;
}

/**
 * Calculate Fibonacci spiral points
 */
function calculateFibonacciSpiral(numTerms) {
  const points = [];
  const angleIncrement = Math.PI / 2; // 90 degrees per term
  let fib1 = 1, fib2 = 1;

  for (let n = 0; n < numTerms; n++) {
    const value = n < 2 ? 1 : fib1 + fib2;
    const angle = n * angleIncrement;
    const radius = value * 3; // Scale factor

    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    points.push({
      x,
      y,
      value,
      angle,
      radius,
      index: n
    });

    if (n >= 2) {
      fib1 = fib2;
      fib2 = value;
    }
  }

  return points;
}

/**
 * Draw spiral on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} points - Spiral points
 * @param {Object} sequence - Sequence configuration
 */
export function drawSpiral(ctx, points, sequence) {
  if (points.length === 0) return;

  // Draw connecting lines
  ctx.beginPath();
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;

  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  // Draw curve (smooth spiral)
  if (points.length > 2) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(118, 75, 162, 0.5)';
    ctx.lineWidth = 3;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Catmull-Rom spline for smooth curves
      const steps = 20;
      for (let t = 0; t < steps; t++) {
        const t_normalized = t / steps;
        const point = catmullRom(p0, p1, p2, p3, t_normalized);

        if (i === 0 && t === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
    }
    ctx.stroke();
  }

  // Draw points
  points.forEach((point, index) => {
    // Point circle
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);

    // Gradient fill
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 6);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, index === points.length - 1 ? '#ff6b6b' : '#667eea');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw value label
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labelX = point.x + Math.cos(point.angle) * 15;
    const labelY = point.y + Math.sin(point.angle) * 15;

    // Background for text
    const text = point.value.toFixed(2);
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(labelX - textWidth / 2 - 3, labelY - 8, textWidth + 6, 16);

    ctx.fillStyle = '#333';
    ctx.fillText(text, labelX, labelY);
  });

  // Draw center point
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#ff6b6b';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw axes
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(-150, 0);
  ctx.lineTo(150, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -150);
  ctx.lineTo(0, 150);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * Catmull-Rom spline interpolation
 */
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  const x = 0.5 * (
    (2 * p1.x) +
    (-p0.x + p2.x) * t +
    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
  );

  const y = 0.5 * (
    (2 * p1.y) +
    (-p0.y + p2.y) * t +
    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
  );

  return { x, y };
}
