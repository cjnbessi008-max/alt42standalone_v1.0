# Changelog
All notable changes to the Relation Thermo project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-18

### Added
- Initial release of Relation Thermo
- Moodle 3.7 activity module plugin
- Virtual smartphone interface displayed in bottom-right corner
- Interactive thermometer visualization for confidence levels
- Support for 5 set relation types:
  - Subset (A ⊆ B)
  - Superset (A ⊇ B)
  - Equal (A = B)
  - Disjoint (A ∩ B = ∅)
  - Intersect (A ∩ B ≠ ∅)
- MySQL 5.7 database schema
- REST API endpoints for LMS integration
- Real-time feedback system
- Progress tracking and grading
- Korean and English language support
- Comprehensive documentation:
  - Installation guide
  - User guide
  - Technical documentation

### Features
- **Student Interface**:
  - Responsive smartphone-style UI
  - Animated thermometer for confidence input
  - Immediate feedback on answers
  - Progress bar and completion statistics
  - Final results with accuracy visualization

- **Teacher Tools**:
  - Easy activity creation through Moodle interface
  - Configurable problem count (1-50)
  - Three difficulty levels
  - Optional time limits
  - Automatic grade calculation and integration with Moodle gradebook

- **Technical**:
  - PHP 7.1.9 compatible
  - MySQL 5.7 with JSON column support
  - Vanilla JavaScript (ES5) - no framework dependencies
  - Cross-browser compatible (IE11+, Chrome, Firefox, Safari)
  - Mobile responsive design

### Database Schema
- `rt_problems`: Problem storage with JSON sets
- `rt_responses`: Student response tracking
- `rt_progress`: User progress aggregation
- `rt_thermo_settings`: Thermometer customization

### Security
- SQL injection protection via Moodle DB API
- XSS prevention with proper escaping
- CSRF token validation
- Capability-based access control

### Performance
- Optimized database indexes
- Efficient SQL queries with JOINs
- Client-side caching with sessionStorage
- Minimal external dependencies

## [Unreleased]

### Planned Features
- Admin dashboard for analytics
- CSV export for student data
- Custom set input by teachers
- Gamification elements (badges, leaderboards)
- Mobile native app (Phase 2)
- Integration with other LMS platforms (Canvas, Blackboard)
- AI-generated problem suggestions
- Collaborative learning modes

### Known Issues
- None reported

### To Do
- [ ] Add unit tests (PHPUnit)
- [ ] Add integration tests (Behat)
- [ ] Performance benchmarking
- [ ] Accessibility audit (WCAG 2.1)
- [ ] Browser compatibility testing matrix
- [ ] Load testing for concurrent users

---

## Version History

### Version Numbering
- **Major.Minor.Patch** (e.g., 1.0.0)
- **Major**: Breaking changes, major new features
- **Minor**: New features, backwards compatible
- **Patch**: Bug fixes, small improvements

### Support Matrix

| Version | Moodle | PHP   | MySQL | Status      |
|---------|--------|-------|-------|-------------|
| 1.0.0   | 3.7+   | 7.1.9+| 5.7+  | Active      |

---

**Maintained by**: KAIST Touch Math Academy
**License**: MIT
**Repository**: [GitHub URL]
