# Linear Combo Layer - Examples and Use Cases

This document provides practical examples and educational use cases for the Linear Combo Layer visualization component.

## Table of Contents

1. [Basic Vector Addition](#basic-vector-addition)
2. [Physics: Force Vectors](#physics-force-vectors)
3. [Custom Configurations](#custom-configurations)
4. [Educational Scenarios](#educational-scenarios)
5. [Advanced Examples](#advanced-examples)

---

## Basic Vector Addition

### Example 1: Two Perpendicular Vectors

Visualize how two perpendicular vectors combine to form a diagonal resultant.

```tsx
const perpendicularVectors: VectorLayer[] = [
  {
    id: 'horizontal',
    vector: { x: 4, y: 0 },
    color: '#FF6B6B',
    opacity: 0.8,
    label: 'East',
  },
  {
    id: 'vertical',
    vector: { x: 0, y: 3 },
    color: '#4ECDC4',
    opacity: 0.8,
    label: 'North',
  },
];

// Result: (4, 3) - Northeast direction
// Magnitude: 5 units (3-4-5 triangle)
```

**Learning Objective**: Students understand that perpendicular vectors form right triangles, and can apply the Pythagorean theorem.

### Example 2: Opposing Vectors

Show how vectors in opposite directions can cancel each other out.

```tsx
const opposingVectors: VectorLayer[] = [
  {
    id: 'forward',
    vector: { x: 5, y: 2 },
    color: '#FF6B6B',
    opacity: 0.7,
    label: 'Force A',
  },
  {
    id: 'backward',
    vector: { x: -3, y: -1 },
    color: '#4ECDC4',
    opacity: 0.7,
    label: 'Force B',
  },
];

// Result: (2, 1) - Reduced magnitude
```

**Learning Objective**: Demonstrate vector subtraction and how forces in opposite directions reduce the net effect.

---

## Physics: Force Vectors

### Example 3: Equilibrium

Three forces in equilibrium (sum to zero).

```tsx
const equilibriumForces: VectorLayer[] = [
  {
    id: 'f1',
    vector: { x: 3, y: 0 },
    color: '#E74C3C',
    opacity: 0.7,
    label: 'F₁',
  },
  {
    id: 'f2',
    vector: { x: -1.5, y: 2.598 }, // 120° from F₁
    color: '#3498DB',
    opacity: 0.7,
    label: 'F₂',
  },
  {
    id: 'f3',
    vector: { x: -1.5, y: -2.598 }, // 240° from F₁
    color: '#2ECC71',
    opacity: 0.7,
    label: 'F₃',
  },
];

// Result: (0, 0) - Perfect equilibrium
```

**Learning Objective**: Introduce concepts of equilibrium and balanced forces in physics.

### Example 4: Inclined Plane

Forces on an object on an inclined plane.

```tsx
const inclinedPlane: VectorLayer[] = [
  {
    id: 'gravity',
    vector: { x: 0, y: -5 },
    color: '#E74C3C',
    opacity: 0.8,
    label: 'Weight',
  },
  {
    id: 'normal',
    vector: { x: -2.165, y: 3.75 }, // Normal force (30° incline)
    color: '#3498DB',
    opacity: 0.8,
    label: 'Normal',
  },
  {
    id: 'friction',
    vector: { x: 2.165, y: 1.25 }, // Friction force
    color: '#F39C12',
    opacity: 0.8,
    label: 'Friction',
  },
];
```

**Learning Objective**: Decompose forces on inclined planes, understand normal force and friction.

---

## Custom Configurations

### Example 5: High-Precision Grid

For detailed mathematical work requiring precise coordinates.

```tsx
const precisionConfig: ComboLayerConfig = {
  width: 800,
  height: 800,
  scale: 60,           // Larger scale for precision
  showGrid: true,
  showAxes: true,
  showLabels: true,
  gridSpacing: 0.5,    // Finer grid
};

<LinearComboLayer
  layers={myVectors}
  config={precisionConfig}
/>
```

### Example 6: Presentation Mode

Large, clear visualization for classroom presentations.

```tsx
const presentationConfig: ComboLayerConfig = {
  width: 1000,
  height: 800,
  scale: 50,
  showGrid: false,     // Cleaner look
  showAxes: true,
  showLabels: true,
  gridSpacing: 2,
};
```

---

## Educational Scenarios

### Scenario 1: Guided Discovery

**Objective**: Students discover that vector addition is commutative (v₁ + v₂ = v₂ + v₁)

**Activity**:
1. Start with two vectors: (3, 2) and (1, 4)
2. Show that the result is (4, 6)
3. Ask students to predict what happens if we swap the vectors
4. Demonstrate that the order doesn't matter

```tsx
// Setup
const scenario1: VectorLayer[] = [
  { id: 'a', vector: { x: 3, y: 2 }, color: '#FF6B6B', opacity: 0.7, label: 'a' },
  { id: 'b', vector: { x: 1, y: 4 }, color: '#4ECDC4', opacity: 0.7, label: 'b' },
];

// Result is always (4, 6) regardless of order
```

### Scenario 2: Problem-Based Learning

**Problem**: A boat travels at 5 m/s due east. The current flows at 3 m/s due north. What is the boat's actual velocity?

```tsx
const boatProblem: VectorLayer[] = [
  {
    id: 'boat',
    vector: { x: 5, y: 0 },
    color: '#2980B9',
    opacity: 0.8,
    label: 'Boat',
  },
  {
    id: 'current',
    vector: { x: 0, y: 3 },
    color: '#27AE60',
    opacity: 0.8,
    label: 'Current',
  },
];

// Result: (5, 3)
// Magnitude: √(5² + 3²) = √34 ≈ 5.83 m/s
// Direction: arctan(3/5) ≈ 31° north of east
```

### Scenario 3: Vector Decomposition

**Objective**: Decompose a vector into horizontal and vertical components

```tsx
const decomposition: VectorLayer[] = [
  {
    id: 'horizontal',
    vector: { x: 4, y: 0 },
    color: '#E74C3C',
    opacity: 0.6,
    label: 'x-component',
  },
  {
    id: 'vertical',
    vector: { x: 0, y: 3 },
    color: '#3498DB',
    opacity: 0.6,
    label: 'y-component',
  },
];

// Students learn that any vector (4, 3) can be split into
// horizontal and vertical components
```

---

## Advanced Examples

### Example 7: Multiple Vectors (Complex System)

Demonstrate a complex system with many vectors.

```tsx
const complexSystem: VectorLayer[] = [
  { id: 'v1', vector: { x: 2, y: 3 }, color: '#E74C3C', opacity: 0.6, label: 'v₁' },
  { id: 'v2', vector: { x: -1, y: 2 }, color: '#3498DB', opacity: 0.6, label: 'v₂' },
  { id: 'v3', vector: { x: 3, y: -1 }, color: '#2ECC71', opacity: 0.6, label: 'v₃' },
  { id: 'v4', vector: { x: -2, y: -2 }, color: '#F39C12', opacity: 0.6, label: 'v₄' },
  { id: 'v5', vector: { x: 1, y: 1 }, color: '#9B59B6', opacity: 0.6, label: 'v₅' },
];

// Result: (3, 3)
// Students see how many small vectors combine
```

### Example 8: Zero Vector Result

Create a system where all vectors cancel out.

```tsx
const zeroResult: VectorLayer[] = [
  { id: 'v1', vector: { x: 2, y: 3 }, color: '#E74C3C', opacity: 0.7, label: 'v₁' },
  { id: 'v2', vector: { x: -2, y: -3 }, color: '#3498DB', opacity: 0.7, label: 'v₂' },
];

// Result: (0, 0) - Zero vector
// Perfect cancellation
```

### Example 9: Circular Pattern

Vectors arranged in a circular pattern.

```tsx
const circularPattern: VectorLayer[] = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI * 2) / 8;
  const magnitude = 2;
  return {
    id: `v${i}`,
    vector: {
      x: magnitude * Math.cos(angle),
      y: magnitude * Math.sin(angle),
    },
    color: `hsl(${(i * 360) / 8}, 70%, 50%)`,
    opacity: 0.7,
    label: `v${i + 1}`,
  };
});

// Result: Approximately (0, 0) due to symmetry
// Shows that symmetric forces cancel out
```

---

## Integration with Problem Sets

### Problem Template

```tsx
interface VectorProblem {
  id: string;
  title: string;
  description: string;
  initialVectors: VectorLayer[];
  targetResult: Vector2D;
  hints: string[];
}

const problem1: VectorProblem = {
  id: 'prob-001',
  title: 'Find the Missing Vector',
  description: 'Add a third vector to make the result equal to (5, 5)',
  initialVectors: [
    { id: 'v1', vector: { x: 2, y: 3 }, color: '#FF6B6B', opacity: 0.7, label: 'v₁' },
    { id: 'v2', vector: { x: 1, y: 1 }, color: '#4ECDC4', opacity: 0.7, label: 'v₂' },
  ],
  targetResult: { x: 5, y: 5 },
  hints: [
    'Current sum is (3, 4)',
    'You need to add (2, 1) to reach the target',
  ],
};
```

---

## Testing and Validation

### Unit Test Example

```tsx
import { linearCombination } from './utils/vectorMath';

describe('Linear Combination', () => {
  it('should correctly combine two vectors', () => {
    const result = linearCombination({
      coefficients: [1, 1],
      vectors: [
        { x: 3, y: 2 },
        { x: 1, y: 4 },
      ],
    });

    expect(result).toEqual({ x: 4, y: 6 });
  });

  it('should handle zero vectors', () => {
    const result = linearCombination({
      coefficients: [1, 1],
      vectors: [
        { x: 2, y: 3 },
        { x: -2, y: -3 },
      ],
    });

    expect(result).toEqual({ x: 0, y: 0 });
  });
});
```

---

## Performance Considerations

- **Optimal Layer Count**: 2-10 layers for best visual clarity
- **Canvas Size**: 600x600 to 1000x1000 pixels depending on display
- **Update Frequency**: Debounce rapid changes to prevent rendering lag
- **Mobile Devices**: Reduce canvas size and layer count for better performance

---

## Accessibility

- Use high-contrast colors for colorblind users
- Provide text alternatives for vector values
- Ensure keyboard navigation for controls
- Add aria-labels to interactive elements

---

## Best Practices

1. **Start Simple**: Begin with 2-3 vectors for new learners
2. **Use Distinct Colors**: Make each vector easily distinguishable
3. **Moderate Opacity**: 0.6-0.8 works well for most cases
4. **Clear Labels**: Use descriptive names (not just v1, v2, v3)
5. **Appropriate Scale**: Adjust scale so vectors fill ~50-70% of canvas
6. **Show Work**: Display the formula and calculation steps
7. **Immediate Feedback**: Update visualization in real-time

---

## Additional Resources

- [Linear Algebra Basics](https://en.wikipedia.org/wiki/Linear_algebra)
- [Vector Addition](https://en.wikipedia.org/wiki/Euclidean_vector#Addition_and_subtraction)
- [Physics Force Vectors](https://www.khanacademy.org/science/physics/forces-newtons-laws)

---

**Happy Teaching and Learning! 🎓**
