# Linear Combo Layer - AI Education System

🎨 Interactive visualization of linear combinations with color-coded vector layers for educational purposes.

## Overview

Linear Combo Layer is a React-based visualization component that helps students understand linear combinations of vectors through interactive, color-coded layers. Built as part of the KAIST Touch Math Academy AI Education System Pipeline.

## Features

- **Interactive Vector Manipulation**: Adjust vector components, colors, and opacity in real-time
- **Color-Coded Layers**: Each vector is represented with a unique color that blends to show the combination result
- **Real-time Visualization**: See the linear combination result update instantly as you modify vectors
- **Educational Interface**: Clear visual feedback with labels, formulas, and hover effects
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Rendering**: HTML5 Canvas API
- **Styling**: CSS3 with responsive design

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:3000`

## Project Structure

```
alt42standalone_v1.0/
├── src/
│   ├── components/
│   │   └── visualization/
│   │       ├── LinearComboLayer.tsx    # Main visualization component
│   │       └── VectorControls.tsx      # Interactive controls
│   ├── types/
│   │   └── vector.ts                   # TypeScript type definitions
│   ├── utils/
│   │   ├── vectorMath.ts               # Vector mathematics utilities
│   │   └── colorBlending.ts            # Color blending algorithms
│   ├── styles/
│   │   └── App.css                     # Application styles
│   ├── App.tsx                         # Main application component
│   └── main.tsx                        # Entry point
├── public/                             # Static assets
├── index.html                          # HTML template
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript configuration
└── vite.config.ts                      # Vite configuration
```

## Usage

### Basic Example

```tsx
import { LinearComboLayer } from './components/visualization/LinearComboLayer';
import { VectorLayer } from './types/vector';

const layers: VectorLayer[] = [
  {
    id: 'v1',
    vector: { x: 3, y: 2 },
    color: '#FF6B6B',
    opacity: 0.7,
    label: 'v1',
  },
  {
    id: 'v2',
    vector: { x: 1, y: 4 },
    color: '#4ECDC4',
    opacity: 0.7,
    label: 'v2',
  },
];

function MyComponent() {
  return <LinearComboLayer layers={layers} />;
}
```

### Configuration Options

```tsx
const config = {
  width: 600,          // Canvas width in pixels
  height: 600,         // Canvas height in pixels
  scale: 40,           // Scale factor for vectors
  showGrid: true,      // Show coordinate grid
  showAxes: true,      // Show X and Y axes
  showLabels: true,    // Show vector labels
  gridSpacing: 1,      // Grid spacing in units
};

<LinearComboLayer layers={layers} config={config} />
```

## Mathematical Background

### Linear Combination

A linear combination of vectors **v₁, v₂, ..., vₙ** with coefficients **c₁, c₂, ..., cₙ** is:

```
Result = c₁v₁ + c₂v₂ + ... + cₙvₙ
```

In this implementation, all coefficients default to 1, so:

```
Result = v₁ + v₂ + ... + vₙ
```

### Color Blending

Colors are blended using alpha compositing to visually represent the combination of vector layers. The blended color provides an intuitive understanding of how vectors combine.

## Features in Detail

### Vector Visualization
- Each vector is drawn from the origin (0,0)
- Vectors are color-coded and labeled
- Arrowheads indicate direction
- Hover effects highlight individual vectors

### Interactive Controls
- Adjust X and Y components with number inputs
- Change vector colors with color picker
- Modify opacity with slider (0.0 - 1.0)
- Add or remove vector layers dynamically
- Rename vector labels

### Result Display
- Dashed line shows the linear combination result
- Blended color represents combined layers
- Formula display shows the mathematical representation
- Real-time updates as vectors change

## Integration with Moodle LMS

While this is a standalone React application, it can be integrated with Moodle 3.7+ through:

1. **IFrame Embedding**: Embed the built application in Moodle course pages
2. **LTI Integration**: Use Learning Tools Interoperability (future work)
3. **API Communication**: Connect to Moodle's REST API for user data and problem sets

### Example Moodle Integration

```php
// Moodle block or activity
<iframe
  src="https://your-domain.com/linear-combo-layer"
  width="100%"
  height="800px"
  frameborder="0">
</iframe>
```

## Future Enhancements

- [ ] Weighted linear combinations (custom coefficients)
- [ ] 3D vector visualization
- [ ] Animation of vector operations
- [ ] Export to image/PDF
- [ ] Problem sets and quizzes
- [ ] Student progress tracking
- [ ] Moodle LTI integration
- [ ] Touch/gesture controls for mobile
- [ ] Undo/Redo functionality
- [ ] Saved presets and examples

## Educational Use Cases

1. **Linear Algebra Courses**: Visualize vector addition and linear combinations
2. **Physics Education**: Show force vectors and resultant forces
3. **Computer Graphics**: Demonstrate basis vectors and transformations
4. **Problem-Based Learning**: Interactive exercises with immediate feedback

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

This project is part of the KAIST Touch Math Academy AI Education System Pipeline. For contributions or issues, please refer to the project documentation.

## License

Copyright © 2025 KAIST Touch Math Academy

## Acknowledgments

Built with:
- React 18
- TypeScript 5
- Vite 5
- HTML5 Canvas API

## Contact

For questions or support regarding the AI Education System Pipeline, please refer to the main project documentation.

---

**Note**: This is the initial implementation of the Linear Combo Layer feature. The full AI Education System Pipeline includes additional components for AI-powered problem generation, student analytics, and automated grading.
