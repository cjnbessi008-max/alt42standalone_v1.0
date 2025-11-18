# KAIST AI Education System - One-Second Graph

## Overview

This project implements the **One-Second Graph** feature for the KAIST Touch Math Academy AI Education System. The feature visualizes educational concept graphs with a precisely choreographed 1-second animation sequence, displayed on a virtual smartphone interface.

## What is One-Second Graph?

One-Second Graph is an innovative visualization technique that compresses the entire structure of an educational concept graph into a 1-second animated experience. This allows teachers and students to quickly grasp the relationships between concepts in a learning module.

### Animation Timeline

The animation is precisely choreographed over 1000ms (1 second):

- **T=0-250ms**: Nodes appear with fade-in and scale animations
- **T=250-500ms**: Edges draw connecting the concepts
- **T=500-750ms**: Layout stabilizes using force-directed physics
- **T=750-1000ms**: Graph becomes fully interactive

## Features

### 🎨 Virtual Smartphone Display
- Realistic smartphone frame with notch, status bar, and home indicator
- iPhone-inspired design (375x812 viewport)
- Responsive scaling for different screen sizes
- Hardware button details (power, volume)

### 📊 Graph Visualization
- **Vis.js Network**: Powerful graph rendering with physics simulation
- **Framer Motion**: Smooth animations and transitions
- **Interactive**: Hover, zoom, drag, and explore concepts
- **Multi-language**: Supports Korean and English labels

### 🎯 Educational Focus
- Sample data based on fractions learning module
- Concept relationships clearly visualized
- Color-coded node types:
  - **Purple**: Core concepts
  - **Green**: Components
  - **Orange**: Visual representations
  - **Teal**: Advanced concepts

## Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** - Fast build tool
- **Material-UI (MUI)** - UI component library
- **Framer Motion** - Animation library
- **Vis.js** - Network graph visualization
- **Socket.io-client** - Real-time communication (future)

### Styling
- CSS3 with custom animations
- Emotion (CSS-in-JS via MUI)
- Responsive design with mobile-first approach

## Project Structure

```
alt42standalone_v1.0/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphVisualizer/
│   │   │   │   ├── GraphVisualizer.tsx    # Main graph component
│   │   │   │   └── GraphVisualizer.css
│   │   │   └── VirtualSmartphone/
│   │   │       ├── VirtualSmartphone.tsx  # Smartphone frame
│   │   │       └── VirtualSmartphone.css
│   │   ├── data/
│   │   │   └── sampleGraphData.ts         # Sample concept graph
│   │   ├── types/
│   │   │   └── graph.ts                   # TypeScript interfaces
│   │   ├── App.tsx                        # Main application
│   │   ├── main.tsx                       # Entry point
│   │   └── index.css                      # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── tasks/
│   ├── 0001-prd-ai-education-pipeline.md
│   └── 0002-one-second-graph-spec.md
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 16+ (LTS recommended)
- npm or yarn package manager

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Click "Show Graph Animation"** - Launches the 1-second graph animation
2. **Watch the Animation** - Observe the 4-phase animation sequence
3. **Interact with Graph** - After animation completes, you can:
   - Hover over nodes to see tooltips
   - Click and drag nodes to reposition
   - Zoom in/out with mouse wheel
   - Pan by dragging the background
4. **Click "Reset"** - Returns to initial state

## Customization

### Adding Your Own Graph Data

Edit `src/data/sampleGraphData.ts`:

```typescript
export const sampleGraphData: GraphData = {
  nodes: [
    {
      id: '1',
      label: 'Your Concept',
      title: 'Description',
      level: 1,
      color: '#667eea',
    },
    // Add more nodes...
  ],
  edges: [
    {
      id: 'e1',
      from: '1',
      to: '2',
      label: 'relationship',
      arrows: 'to',
    },
    // Add more edges...
  ],
};
```

### Customizing Animation Timing

Edit `GraphVisualizer.tsx` animation phases:

```typescript
const animationPhases: AnimationPhase[] = [
  { name: 'nodes', duration: 250, startTime: 0 },
  { name: 'edges', duration: 250, startTime: 250 },
  { name: 'stabilize', duration: 250, startTime: 500 },
  { name: 'interactive', duration: 250, startTime: 750 },
];
```

### Changing Smartphone Dimensions

Edit `VirtualSmartphone.tsx`:

```typescript
<Paper
  sx={{
    width: 375,    // Change width
    height: 812,   // Change height
    // ... other styles
  }}
>
```

## Integration with LMS

This component is designed to integrate with Learning Management Systems (LMS):

- **Moodle 3.7+**
- **PHP 7.1.9**
- **MySQL 5.7**

### Future Integration Points

1. **Problem Data Endpoint**: Receive graph data from LMS
2. **WebSocket Updates**: Real-time graph updates as AI generates concepts
3. **Progress Tracking**: Save which concepts students have mastered
4. **Adaptive Learning**: Modify graph based on student performance

## Performance Considerations

- **Graph Size**: Optimized for 10-20 nodes (like sample)
- **Large Graphs**: For 50+ nodes, consider hierarchical layout
- **Mobile**: Responsive design works on screens 375px and up
- **Animation**: Uses requestAnimationFrame for smooth 60fps

## Accessibility

- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation supported
- ✅ Screen reader friendly (ARIA labels)
- ✅ High contrast mode compatible
- ✅ Reduced motion support (respects `prefers-reduced-motion`)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Development Roadmap

### Phase 1: MVP (Current)
- ✅ Basic graph visualization
- ✅ 1-second animation sequence
- ✅ Virtual smartphone display
- ✅ Sample fraction data

### Phase 2: LMS Integration
- [ ] Backend API integration
- [ ] WebSocket real-time updates
- [ ] Dynamic graph data from Moodle
- [ ] User authentication

### Phase 3: Advanced Features
- [ ] Multi-language support (Korean/English toggle)
- [ ] Graph editing mode for teachers
- [ ] Export graph as image/PDF
- [ ] Animation speed control
- [ ] Multiple graph layouts (hierarchical, radial, etc.)

### Phase 4: Analytics
- [ ] Track which concepts students click
- [ ] Time spent on each node
- [ ] Learning path visualization
- [ ] Mastery indicators on graph

## Contributing

This project is part of the KAIST Touch Math Academy AI Education System Pipeline. For contribution guidelines, please refer to the main project documentation.

## Related Documents

- [PRD: AI Education System Pipeline](./tasks/0001-prd-ai-education-pipeline.md)
- [One-Second Graph Specification](./tasks/0002-one-second-graph-spec.md)

## License

Proprietary - KAIST Touch Math Academy

## Contact

For questions or support, please contact the KAIST Touch Math Academy development team.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: Initial Development
