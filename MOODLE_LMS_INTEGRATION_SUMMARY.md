# Moodle LMS Integration: Thinking Routine Consistency Score

## Project Summary

This implementation provides a comprehensive Moodle block plugin that tracks and scores students' **consistency in applying thinking routines** during their learning activities.

## 🎯 Key Features

### 1. **Automated Activity Tracking**
- Monitors student actions across Moodle activities (quizzes, assignments, forums)
- Captures behavioral patterns in problem-solving approaches
- Session-based tracking with intelligent grouping

### 2. **Multi-Dimensional Consistency Scoring**
The consistency score algorithm evaluates three key dimensions:

#### **Frequency Score** (30% weight)
- Measures how often thinking routines are used
- Encourages regular practice of structured thinking

#### **Adherence Score** (50% weight)
- Evaluates how well students follow expected pattern steps
- Uses Longest Common Subsequence (LCS) algorithm for sequence matching
- Highest weight as it reflects quality of application

#### **Consistency Index** (20% weight)
- Measures regularity of pattern usage over time
- Uses coefficient of variation for statistical analysis
- Rewards daily consistency with bonus points

### 3. **Visual Dashboard**
- Real-time display in Moodle blocks
- Color-coded scores (green/blue/yellow/red)
- Progress bars for individual patterns
- Detailed analytics view

### 4. **RESTful API**
- Two main endpoints:
  - `block_thinkroutine_consistency_get_score`: Retrieve scores
  - `block_thinkroutine_consistency_track_activity`: Log activities
- JSON-based communication
- Token authentication
- Mobile app support

## 📊 Technical Specifications

### Compatibility Matrix
| Component | Version | Status |
|-----------|---------|--------|
| Moodle | 3.7+ | ✅ Tested |
| PHP | 7.1.9+ | ✅ Tested |
| MySQL | 5.7+ | ✅ Tested |
| PostgreSQL | 9.6+ | ✅ Supported |

### Database Schema
4 main tables created:
1. **block_trc_patterns**: Thinking routine pattern definitions (5 defaults)
2. **block_trc_activities**: Student activity log
3. **block_trc_scores**: Calculated consistency scores
4. **block_trc_sessions**: Learning session analytics

### Default Thinking Routines
1. **Problem Decomposition** (Problem Solving, weight: 1.0)
2. **Visual Representation** (Visualization, weight: 1.0)
3. **Systematic Checking** (Reasoning, weight: 0.8)
4. **Pattern Recognition** (Reasoning, weight: 1.2)
5. **Self-Reflection** (Metacognition, weight: 0.9)

## 🚀 Quick Start

### Installation
```bash
# Copy to Moodle blocks directory
cp -r moodle-integration /path/to/moodle/blocks/thinkroutine_consistency

# Trigger installation
php admin/cli/upgrade.php
```

### Basic Usage
```javascript
// Track activity from JavaScript
require(['core/ajax'], function(ajax) {
    ajax.call([{
        methodname: 'block_thinkroutine_consistency_track_activity',
        args: {
            userid: M.cfg.userid,
            courseid: M.cfg.courseid,
            cmid: 123,
            activitytype: 'quiz',
            action: 'create_diagram',
            actiondata: '{}'
        }
    }]);
});
```

```php
// Track activity from PHP
use block_thinkroutine_consistency\activity_tracker;

activity_tracker::track_activity(
    $USER->id,
    $course->id,
    $cm->id,
    'quiz',
    'read_problem',
    ['question_id' => 42]
);
```

## 📁 Project Structure

```
moodle-integration/
├── version.php                          # Plugin version and metadata
├── block_thinkroutine_consistency.php   # Main block class
├── view.php                             # Detailed analytics page
├── styles.css                           # Block styling
│
├── db/
│   ├── install.xml                      # Database schema
│   ├── install.php                      # Post-install script (creates default patterns)
│   ├── upgrade.php                      # Upgrade script
│   ├── access.php                       # Capability definitions
│   ├── services.php                     # Web service definitions
│   └── tasks.php                        # Scheduled task definitions
│
├── classes/
│   ├── consistency_calculator.php       # Core scoring algorithm
│   ├── activity_tracker.php             # Activity logging
│   ├── external/
│   │   ├── get_consistency_score.php    # API: Get scores
│   │   └── track_activity.php           # API: Track activity
│   └── task/
│       └── update_scores.php            # Scheduled score update task
│
├── lang/en/
│   └── block_thinkroutine_consistency.php  # English language strings
│
├── README.md                            # Full documentation
├── INSTALLATION.md                      # Installation guide
└── INTEGRATION_EXAMPLES.md              # Code examples
```

## 🔧 Configuration

### Enable Web Services
1. Site administration → Advanced features → Enable web services
2. Site administration → Plugins → Web services → Manage protocols → Enable REST
3. Site administration → Plugins → Web services → External services → Add service
4. Add functions:
   - `block_thinkroutine_consistency_get_score`
   - `block_thinkroutine_consistency_track_activity`

### Set Permissions
Default role capabilities:
- **Students**: `viewown`, `myaddinstance`
- **Teachers**: `viewall`, `addinstance`
- **Managers**: All capabilities including `managepatterns`

### Configure Scheduled Task
- **Task**: Update consistency scores
- **Schedule**: Daily at 2:00 AM (configurable)
- **Path**: Site administration → Server → Scheduled tasks

## 📈 Scoring Algorithm Details

### Formula
```
Final Score = (Frequency × 0.3) + (Adherence × 0.5) + (Consistency × 0.2)
```

### Frequency Calculation
```
frequency_score = min(100, (uses_per_day × 100))
```
Where `uses_per_day = total_uses / days_in_period`

### Adherence Calculation
```
adherence_score = (LCS_length / max_sequence_length) × 100
```
Uses Longest Common Subsequence to match actual steps vs. expected steps

### Consistency Index
```
coefficient_of_variation = std_dev / mean
consistency_score = max(0, 100 - (CV × 50))
+ daily_consistency_bonus
```

## 🔌 Integration Points

### JavaScript Integration
- Quiz modules
- Assignments
- Custom activities
- Real-time tracking

### PHP Integration
- Activity modules
- Course formats
- Custom plugins
- Batch processing

### External Systems
- Python applications
- Node.js services
- Mobile apps
- Analytics platforms

## 📊 Use Cases

### For Educators
1. Monitor student thinking patterns
2. Identify students struggling with structured thinking
3. Measure effectiveness of teaching methods
4. Provide targeted interventions

### For Students
1. Visualize own learning patterns
2. Develop consistent problem-solving habits
3. Track improvement over time
4. Receive feedback on thinking routines

### For Researchers
1. Study learning behavior patterns
2. Analyze effectiveness of thinking routines
3. Correlate consistency with learning outcomes
4. Export data for external analysis

## 🎓 Pedagogical Foundation

Based on established educational research:
- **Visible Thinking Routines** (Project Zero, Harvard)
- **Metacognitive Strategies** (Flavell, 1979)
- **Problem-Solving Heuristics** (Polya, 1945)
- **Structured Learning Approaches**

## 📝 Future Enhancements

### Phase 2 (Planned)
- [ ] Machine learning pattern detection
- [ ] Automatic pattern recommendation
- [ ] Peer comparison analytics
- [ ] Adaptive learning pathways
- [ ] Integration with LTI 1.3
- [ ] Mobile app for real-time tracking
- [ ] Gamification elements
- [ ] Teacher dashboard improvements

### Phase 3 (Roadmap)
- [ ] AI-powered pattern generation
- [ ] Predictive analytics for interventions
- [ ] Multi-language support (Korean, Japanese, Chinese)
- [ ] Integration with external assessment tools
- [ ] Video-based activity tracking
- [ ] Collaborative thinking routines

## 🤝 Contributing

This plugin is part of the KAIST Touch Math Academy AI Education System Pipeline project. For the broader project context, see `tasks/0001-prd-ai-education-pipeline.md`.

## 📄 License

GNU General Public License v3.0 or later

## 📞 Support

For issues or questions:
- Review the detailed documentation in `moodle-integration/README.md`
- Check installation guide: `moodle-integration/INSTALLATION.md`
- See code examples: `moodle-integration/INTEGRATION_EXAMPLES.md`

---

## ✅ Implementation Checklist

- [x] Database schema design (MySQL 5.7 compatible)
- [x] Core consistency calculator algorithm
- [x] Activity tracking system
- [x] Moodle block UI
- [x] Web services API (REST)
- [x] Scheduled task for score updates
- [x] Default thinking routine patterns
- [x] Capability and permission system
- [x] Language strings (English)
- [x] Detailed view page
- [x] CSS styling
- [x] Comprehensive documentation
- [x] Installation guide
- [x] Integration examples (JavaScript, PHP, Python, Node.js)
- [x] API documentation

## 🎉 Ready for Deployment

This implementation is production-ready and can be installed on any Moodle 3.7+ instance with PHP 7.1.9+ and MySQL 5.7+.

---

**Project**: AI Education System Pipeline
**Component**: Moodle LMS Integration - Thinking Routine Consistency Score
**Version**: 1.0.0
**Date**: 2025-11-18
**Copyright**: KAIST Touch Math Academy
