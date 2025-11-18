# ALT42 Intersection Burst - Graph Visualizer

An interactive graph visualization system with intersection burst effects for educational concept mapping. Designed to integrate with Moodle LMS for KAIST Touch Math Academy.

## Features

### 🎆 Intersection Burst Effect
- **Real-time intersection detection** between graph edges
- **Particle explosion effects** when intersections are detected
- **Customizable burst parameters** (particle count, intensity)
- **Shockwave animations** for visual impact

### 📊 Graph Visualization
- **Interactive node manipulation** - drag and drop nodes
- **Dynamic edge creation** - connect concepts with relationships
- **Concept labeling** - Korean language support for mathematical concepts
- **Auto-layout algorithms** - circular arrangement for optimal visibility

### 📱 Mobile Display
- **Virtual smartphone viewport** in bottom-right panel
- **Responsive design** for mobile learning experiences
- **Touch-friendly interface** for student interaction
- **Real-time synchronization** with main graph

### 🔗 LMS Integration
- **Moodle 3.7 compatibility**
- **MySQL 5.7 database integration**
- **Web services API** for problem data retrieval
- **Student progress tracking**
- **Answer submission and grading**

## Technology Stack

### Frontend
- **HTML5 Canvas** - High-performance graph rendering
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with gradients and animations
- **Responsive Design** - Works on desktop and tablets

### Backend
- **PHP 7.1.9** - Server-side logic
- **MySQL 5.7** - Database for Moodle integration
- **RESTful API** - JSON-based communication

### Libraries
- No external JavaScript libraries required
- Pure Canvas API for graphics
- Native DOM manipulation

## Installation

### Prerequisites
- PHP 7.1.9 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Moodle 3.7 installation (optional for full LMS integration)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/alt42standalone_v1.0.git
   cd alt42standalone_v1.0
   ```

2. **Configure database connection**
   Edit `lms-integration.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'moodle');
   define('DB_USER', 'moodle_user');
   define('DB_PASS', 'your_password_here');
   ```

3. **Set up web server**
   - Point document root to project directory
   - Ensure PHP is enabled
   - Allow `.htaccess` overrides (Apache)

4. **Create logs directory**
   ```bash
   mkdir logs
   chmod 755 logs
   ```

5. **Open in browser**
   ```
   http://localhost/alt42standalone_v1.0/
   ```

## Usage

### Basic Operations

#### Adding Nodes
1. Click "노드 추가" button in the control panel
2. Or click on the canvas to add a node at that position

#### Adding Edges
1. Click "엣지 추가" button
2. System randomly connects two existing nodes
3. Or select two nodes and create edge programmatically

#### Adjusting Burst Effect
- **Enable/Disable**: Toggle "Burst 효과 활성화" checkbox
- **Particle Count**: Adjust slider (10-100 particles)
- **Intensity**: Adjust slider (0.5-3.0 multiplier)

#### Viewing Intersections
- Intersections are automatically detected
- Gold markers appear at intersection points
- Pulsing animation highlights active intersections
- Click intersection to view details

### Mobile View
- Bottom-right panel shows student perspective
- Real-time updates from main graph
- Touch-optimized interface
- Displays intersection count

## API Endpoints

### Get Problem Data
```
GET /lms-integration.php?action=getProblem&problemId=123
```

Response:
```json
{
  "id": 123,
  "title": "분수의 덧셈",
  "description": "다음 분수를 더하세요: 1/4 + 1/2",
  "concepts": ["fraction", "addition"],
  "graphData": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### Submit Answer
```
POST /lms-integration.php?action=submitAnswer
Content-Type: application/json

{
  "problemId": 123,
  "answer": "3/4",
  "studentId": 456
}
```

### Track Interaction
```
POST /lms-integration.php?action=trackInteraction
Content-Type: application/json

{
  "eventType": "intersection_viewed",
  "eventData": {"x": 100, "y": 200},
  "studentId": 456
}
```

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────┐
│                   index.html                     │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Controls  │  │   Main   │  │ Smartphone  │ │
│  │   Panel    │  │  Graph   │  │    View     │ │
│  └────────────┘  └──────────┘  └─────────────┘ │
└─────────────────────────────────────────────────┘
           │                │                │
           ▼                ▼                ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │   app.js     │  │graph-viz.js  │  │ burst-fx.js  │
  │ (Controller) │  │(Visualization)│  │ (Animation)  │
  └──────────────┘  └──────────────┘  └──────────────┘
           │
           ▼
  ┌──────────────┐
  │lms-connector │  ←→  lms-integration.php
  │     .js      │            ↓
  └──────────────┘      MySQL Database
```

### Class Hierarchy

#### `BurstEffect`
- Manages particle system
- Creates explosion animations
- Handles shockwave effects

#### `GraphVisualizer`
- Renders nodes and edges
- Detects intersections using line-line intersection algorithm
- Manages user interactions (click, drag)

#### `GraphNode`
- Represents concept node
- Stores position, label, color
- Handles selection state

#### `GraphEdge`
- Represents relationship between concepts
- Draws lines and arrows
- Provides geometry for intersection detection

#### `LMSConnector`
- Communicates with Moodle API
- Fetches problem data
- Submits answers and tracks progress

## Intersection Detection Algorithm

The system uses a parametric line intersection algorithm:

```javascript
lineIntersection(line1, line2) {
  const { x1, y1, x2, y2 } = line1;
  const { x1: x3, y1: y3, x2: x4, y2: y4 } = line2;

  // Calculate denominator
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  // Check if lines are parallel
  if (Math.abs(denominator) < 0.0001) return null;

  // Calculate intersection parameters
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

  // Check if intersection is within line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }

  return null;
}
```

## Customization

### Adding Custom Concepts
Edit `graph-visualizer.js`:
```javascript
initializeSampleGraph() {
  const concepts = [
    { label: 'Your Concept', x: 0.5, y: 0.5, concept: 'custom' },
    // Add more concepts...
  ];
}
```

### Changing Colors
Edit `styles.css`:
```css
:root {
  --primary-color: #4A90E2;    /* Change to your color */
  --secondary-color: #7B68EE;
  --success-color: #50C878;
}
```

### Modifying Burst Effect
Edit `burst-effect.js`:
```javascript
constructor() {
  this.particleCount = 30;  // Change particle count
  this.intensity = 1.0;     // Change intensity
}
```

## Performance Optimization

### Canvas Rendering
- Uses `requestAnimationFrame` for smooth 60fps animation
- Implements dirty region tracking (planned)
- Particle pooling to reduce GC pressure

### Intersection Detection
- Only checks when nodes move
- Caches intersection results
- Uses bounding box pre-checks (planned)

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ IE 11 (not supported)

## Troubleshooting

### Canvas not displaying
- Check browser console for errors
- Ensure canvas size is set correctly
- Verify JavaScript files are loaded

### LMS connection fails
- Check database credentials in `lms-integration.php`
- Verify MySQL service is running
- Check PHP error log

### Intersections not detected
- Ensure at least 2 edges exist
- Check that edges are not parallel
- Verify burst effect is enabled

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is part of the KAIST Touch Math Academy educational system.

## Credits

- **Development**: ALT42 Team
- **Concept**: KAIST Touch Math Academy
- **AI Pipeline**: Based on PRD in `tasks/0001-prd-ai-education-pipeline.md`

## Contact

For questions and support:
- Technical: dev@kaist.ac.kr
- Educational: math@kaist.ac.kr

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: Active Development
