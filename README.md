# 3D Insight Mode for Moodle

An interactive 3D geometry visualization plugin for Moodle LMS that displays problems in a virtual smartphone interface with full rotation and touch controls.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Moodle](https://img.shields.io/badge/moodle-3.7+-orange)
![PHP](https://img.shields.io/badge/php-7.1.9+-purple)
![License](https://img.shields.io/badge/license-GPL--3.0-green)

## Features

- **Virtual Smartphone Interface**: Displays 3D problems in a realistic smartphone UI positioned in the bottom-right corner
- **Interactive 3D Visualization**: Powered by Three.js for smooth, hardware-accelerated graphics
- **Full Rotation Controls**: Mouse and touch support for exploring 3D models from any angle
- **Multiple Geometry Types**: Cubes, spheres, cylinders, pyramids, platonic solids, and custom geometries
- **Moodle Integration**: Seamlessly integrates with Moodle courses and tracks student interactions
- **Mobile-Friendly**: Responsive design with touch gestures (rotate, pinch-to-zoom)
- **Draggable Interface**: Move the smartphone to any position on screen
- **Progress Tracking**: Records rotation count, time spent, and student attempts
- **Customizable**: Configurable camera angles, colors, and geometry parameters

## Screenshots

### Virtual Smartphone Interface
The 3D Insight Mode appears as a virtual smartphone in the corner of your screen, containing interactive 3D geometry problems.

### 3D Rotation
Students can rotate and examine geometric shapes from all angles to better understand their properties.

## Quick Start

### For Administrators

1. **Install the plugin**:
   ```bash
   cd /path/to/moodle/blocks/
   git clone <repository-url> 3dinsight
   ```

2. **Build frontend assets**:
   ```bash
   cd 3dinsight/webapp/
   npm install
   npm run build
   ```

3. **Install in Moodle**:
   - Log in as admin
   - Navigate to Site Administration → Notifications
   - Follow the installation wizard

4. **Add to a course**:
   - Go to any course
   - Turn editing on
   - Add the "3D Insight Mode" block

For detailed installation instructions, see [INSTALLATION.md](docs/INSTALLATION.md).

### For Teachers

1. Add the 3D Insight Mode block to your course
2. Create 3D problems using the database or API
3. Students will see the virtual smartphone interface with interactive 3D models
4. Track student progress through attempt logs

See [USAGE.md](docs/USAGE.md) for detailed usage instructions.

### For Students

1. Look for the virtual smartphone interface in the bottom-right corner
2. Select a problem from the dropdown menu
3. Interact with the 3D model:
   - **Desktop**: Click and drag to rotate, scroll to zoom
   - **Mobile**: Touch and drag to rotate, pinch to zoom
4. Drag the smartphone to reposition it on your screen

## System Requirements

### Server
- Moodle 3.7 or higher
- PHP 7.1.9 or higher
- MySQL 5.7 or higher
- Node.js 14.x+ (for building)

### Client
- Modern browser with WebGL support
- Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- Recommended: 1920×1080 resolution or higher

## Technology Stack

### Frontend
- **Three.js**: 3D rendering engine
- **Webpack**: Module bundler
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Responsive styling with animations

### Backend
- **PHP**: Moodle plugin API
- **MySQL**: Data persistence
- **REST API**: AJAX communication

## Project Structure

```
alt42standalone_v1.0/
├── moodle-plugin/
│   └── block_3dinsight/          # Moodle plugin files
│       ├── block_3dinsight.php   # Main block class
│       ├── version.php            # Plugin metadata
│       ├── lib.php                # Helper functions
│       ├── api.php                # REST API endpoint
│       ├── lang/en/               # Language files
│       └── db/                    # Database schema
├── webapp/                        # Frontend application
│   ├── src/
│   │   ├── components/            # UI components
│   │   │   ├── App3DInsight.js   # Main app
│   │   │   ├── SmartphoneContainer.js  # Virtual smartphone
│   │   │   ├── Scene3D.js        # Three.js scene
│   │   │   └── ProblemSelector.js
│   │   ├── services/              # API services
│   │   │   └── MoodleAPI.js
│   │   ├── utils/                 # Utilities
│   │   │   └── GeometryFactory.js
│   │   └── styles/                # CSS
│   ├── public/                    # Static assets
│   ├── dist/                      # Built files
│   ├── package.json
│   └── webpack.config.js
├── docs/                          # Documentation
│   ├── INSTALLATION.md
│   ├── CONFIGURATION.md
│   └── USAGE.md
└── README.md
```

## Supported Geometry Types

- **Basic Shapes**: Cube, Sphere, Cylinder, Cone, Pyramid
- **Advanced**: Torus, Prism (n-sided)
- **Platonic Solids**: Tetrahedron, Octahedron, Dodecahedron, Icosahedron
- **Custom**: Define your own with vertices and faces

## Configuration Options

### Global Settings
- Enable/disable rotation
- Default camera angle (isometric, front, top, side)
- Smartphone position (bottom-right, bottom-left, top-right, top-left)

### Per-Problem Settings
- Geometry type and parameters
- Color scheme
- Difficulty level (1-5)
- Problem description and title

See [CONFIGURATION.md](docs/CONFIGURATION.md) for detailed configuration options.

## API Endpoints

The plugin provides REST API endpoints for:

- `get_problems` - Fetch all problems for a course
- `get_problem` - Fetch a specific problem
- `save_attempt` - Record a new student attempt
- `update_attempt` - Update an existing attempt
- `get_config` - Fetch course configuration

Example:
```javascript
const response = await fetch(
  '/blocks/3dinsight/api.php?action=get_problems&courseid=1'
);
const data = await response.json();
```

## Database Schema

### Tables Created

1. **mdl_block_3dinsight_problems**: Stores 3D geometry problems
2. **mdl_block_3dinsight_attempts**: Tracks student attempts and interactions
3. **mdl_block_3dinsight_config**: Course-level configuration

See [INSTALLATION.md](docs/INSTALLATION.md) for detailed schema information.

## Development

### Building from Source

```bash
# Install dependencies
cd webapp/
npm install

# Development mode with live reload
npm run dev

# Production build
npm run build

# Serve standalone demo
npm run serve
```

### Running Tests

```bash
# Frontend tests
cd webapp/
npm test

# Moodle PHP unit tests
cd /path/to/moodle/
php admin/tool/phpunit/cli/init.php
vendor/bin/phpunit blocks/3dinsight/tests/
```

### Code Style

- **PHP**: Follow Moodle coding guidelines
- **JavaScript**: ESLint with recommended rules
- **CSS**: BEM methodology

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Roadmap

### Version 1.1 (Planned)
- [ ] Built-in problem editor UI
- [ ] Import/export problem sets
- [ ] Gradebook integration
- [ ] Analytics dashboard

### Version 2.0 (Future)
- [ ] AR mode for mobile devices
- [ ] Multiplayer collaboration
- [ ] Animation sequences
- [ ] Custom shader support

## Troubleshooting

### Common Issues

**Problem**: 3D models not rendering
- Check browser WebGL support: https://get.webgl.org/
- Clear browser cache
- Check JavaScript console for errors

**Problem**: Smartphone not appearing
- Verify plugin installation
- Check file permissions
- Purge Moodle cache

See [INSTALLATION.md](docs/INSTALLATION.md#troubleshooting) for more solutions.

## Performance

- Optimized for 60 FPS rendering
- Lazy loading of 3D models
- Efficient geometry caching
- Mobile-optimized touch handlers

**Recommended Limits**:
- Max polygon count: 10,000 faces
- Max problems per course: 100
- Auto-save interval: 30 seconds

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full support |
| Firefox | 88+     | ✅ Full support |
| Safari  | 14+     | ✅ Full support |
| Edge    | 90+     | ✅ Full support |
| Mobile Safari | 14+ | ✅ Full support |
| Chrome Mobile | 90+ | ✅ Full support |

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Credits

### Libraries Used
- [Three.js](https://threejs.org/) - 3D graphics library
- [Webpack](https://webpack.js.org/) - Module bundler

### Inspiration
Built for educational institutions to enhance geometry learning through interactive 3D visualization.

## Support

- **Documentation**: See `/docs` directory
- **Issues**: Open an issue on GitHub
- **Moodle Forums**: Post in the Moodle plugins forum

## Changelog

### Version 1.0.0 (2024-11-18)
- Initial release
- Virtual smartphone interface
- Interactive 3D visualization with Three.js
- Mouse and touch rotation controls
- Multiple geometry types support
- Moodle integration with progress tracking
- Responsive design
- Database schema and API

## Authors

- Developed for Moodle LMS integration
- Compatible with Moodle 3.7+ (MySQL 5.7, PHP 7.1.9)

## Acknowledgments

Special thanks to:
- The Three.js community for excellent 3D graphics tools
- Moodle developers for the extensible plugin architecture
- Educational institutions using this tool to enhance learning

---

Made with ❤️ for better geometry education
