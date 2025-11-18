# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-11-18

### Added

#### Core Features
- **Graph Renderer with Extrema Tremor Fix**
  - Adaptive sampling algorithm for increased point density near extrema
  - Quadratic interpolation for precise extrema location
  - Catmull-Rom spline rendering for ultra-smooth curves
  - Multi-criteria extrema detection using first and second derivatives
  - Numerical stability improvements

- **Virtual Smartphone Display**
  - iOS-style smartphone frame with notch
  - Status bar with time and icons
  - Home indicator
  - Responsive design
  - 3D floating animation effect

- **Moodle LMS Integration**
  - MySQL 5.7 database connectivity
  - Moodle 3.7 question bank integration
  - Custom math problems table
  - Session management
  - Student answer submission and evaluation
  - Real-time problem updates

#### API Endpoints
- `GET /api/problems.php?problem_id={id}` - Get problem data
- `GET /api/problems.php?action=check_updates&session_id={id}` - Check for updates
- `POST /api/problems.php?action=submit_answer` - Submit student answer
- `GET /api/problems.php?action=get_session_info&session_id={id}` - Get session info

#### Database Schema
- `math_problems` - Store math function problems
- `student_sessions` - Track user sessions
- `student_submissions` - Record student answers
- `problem_access_log` - Analytics and tracking
- `users` - User management (synced with Moodle)

#### UI Components
- Left control panel with problem information
- Manual function input with math function parser
- Extrema list display
- Hints system
- Anti-tremor toggle for debugging
- Export graph to PNG functionality

#### Developer Tools
- Comprehensive database handler with prepared statements
- Moodle integration layer
- Configuration management
- Logging system
- Error handling
- CORS support

### Technical Details

#### Extrema Tremor Fix Implementation
1. **Adaptive Sampling** (graphRenderer.js:104)
   - Dynamic step size based on derivative magnitude
   - 5x more points near extrema (where |f'(x)| < 0.1)

2. **Quadratic Interpolation** (graphRenderer.js:202)
   - 3-point parabolic fit for sub-pixel accuracy
   - Reduces position error from ~0.1 to ~0.001

3. **Catmull-Rom Splines** (graphRenderer.js:358)
   - Bezier curve interpolation with tension=0.5
   - Eliminates linear interpolation artifacts

4. **Numerical Stability** (graphRenderer.js:145)
   - Multiple detection criteria (derivative crossing + second derivative test)
   - Prominence filtering to avoid false positives
   - Configurable thresholds

#### Performance Optimizations
- Canvas high-DPI support with automatic scaling
- Efficient point caching
- Selective re-rendering
- Database query optimization with indexes
- Prepared statements for SQL injection prevention

### Supported Math Functions
- Trigonometric: `sin`, `cos`, `tan`
- Algebraic: `sqrt`, `abs`, `pow`
- Exponential/Logarithmic: `exp`, `log`
- Constants: `PI`, `E`

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### PHP Requirements
- PHP 7.1.9+
- MySQL 5.7+
- Extensions: mysqli, json

### Configuration Options
- Sampling rate: 100-1000 points (default: 300)
- Smoothing factor: 0.0-1.0 (default: 0.3)
- Derivative threshold: 0.0001-0.01 (default: 0.001)
- Anti-tremor: enabled/disabled (default: enabled)

### Known Limitations
- Function parser supports single variable (x) only
- Graph viewport is 2D only
- Requires JavaScript enabled
- Desktop browsers recommended for best experience

### Documentation
- README.md - Main documentation
- INSTALL.md - Installation guide
- API documentation in README.md
- Inline code comments

### Security
- SQL injection protection via prepared statements
- XSS prevention headers
- CSRF protection ready (configurable)
- Input validation and sanitization
- Secure session management

---

## Future Enhancements (Planned)

### Version 1.1.0
- [ ] Multi-variable function support
- [ ] 3D graph rendering
- [ ] Animation of function transformations
- [ ] More extrema detection algorithms
- [ ] Export to multiple formats (SVG, PDF)
- [ ] Dark mode support

### Version 1.2.0
- [ ] Real-time collaborative solving
- [ ] Step-by-step solution display
- [ ] Interactive derivative visualization
- [ ] Touch/gesture support for mobile
- [ ] Offline mode with service workers

### Version 2.0.0
- [ ] WebGL acceleration
- [ ] Machine learning-based extrema prediction
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Plugin system for custom functions

---

## Bug Fixes

None yet - this is the initial release!

---

## Contributors

- Development Team
- KAIST Touch Math Academy

## License

Educational use only.
