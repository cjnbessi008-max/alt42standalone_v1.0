# Changelog

All notable changes to the Concept Detection plugin will be documented in this file.

## [1.0.0] - 2025-11-18

### Added
- Initial release of Concept Detection plugin for Moodle 3.7
- Automatic concept detection from course content (quizzes, assignments, sections)
- Student behavior analysis algorithm
  - Attempt counting
  - Time spent tracking
  - Score pattern analysis
  - Behavioral pattern detection (quick exits, repeated failures, score decline)
- Teacher dashboard with course-level overview
  - Summary statistics cards
  - Concepts table with difficulty indicators
  - Student struggle identification
- Concept detail page
  - Struggling students list
  - Individual student metrics (attempts, time, score, confidence)
  - Educational recommendations
- Multi-language support (English and Korean)
- Configurable thresholds
  - Time threshold (default: 60 seconds)
  - Attempts threshold (default: 3 attempts)
  - Score threshold (default: 60%)
- Database schema with four main tables
  - Concepts storage
  - Student tracking
  - Event logging
  - Analysis results
- Responsive CSS styling for mobile and desktop
- Role-based access control
  - View capability for teachers
  - Manage capability for administrators
  - Report viewing capability at course level

### Features
- Real-time behavior tracking
- Confidence scoring (0-100%)
- Pattern-based analysis with multiple detection algorithms
- Automatic difficulty estimation
- Keyword-based concept matching
- Hierarchical concept support (parent-child relationships)

### Security
- Input validation and sanitization
- Capability checks on all pages
- SQL injection prevention using parameterized queries
- XSS protection with proper output encoding

### Performance
- Indexed database queries
- Efficient activity filtering
- Session-based time calculation with gap detection
- Caching support for repeated queries

### Documentation
- Comprehensive README.md with installation and usage guide
- Quick installation guide (INSTALL.md)
- Inline code documentation
- Database schema documentation

## Future Enhancements (Planned)

### [1.1.0] - Scheduled Automated Analysis
- Cron job for periodic student analysis
- Background processing for large courses
- Email notifications for teachers

### [1.2.0] - Enhanced Analytics
- Machine learning-based difficulty estimation
- Predictive analytics for student struggles
- Advanced visualization (charts, graphs)
- Export functionality (CSV, PDF)

### [1.3.0] - Integration Features
- REST API for external tools
- LTI integration support
- Webhooks for real-time notifications

### [2.0.0] - AI-Powered Recommendations
- Integration with AI models for personalized recommendations
- Natural language processing for concept extraction
- Automated intervention suggestions
- Student-facing feedback interface

## Bug Fixes

None reported yet (initial release)

## Known Issues

None at release

## Upgrade Notes

This is the initial release. No upgrade path required.

## Contributors

- KAIST Touch Math Academy Development Team

## License

GNU GPL v3 or later
