# Moodle Difficulty Prediction Plugin

**Version:** 1.0.0
**Compatible with:** Moodle 3.7, PHP 7.1.9, MySQL 5.7
**Author:** KAIST Touch Math Academy
**License:** GNU GPL v3 or later

## Overview

This Moodle plugin automatically predicts the reasoning difficulty level of questions in your Moodle LMS based on multi-factor analysis. It integrates seamlessly with Moodle's question bank and quiz system to provide:

- **Automatic Difficulty Prediction**: Analyzes question characteristics to predict difficulty (1-5 scale)
- **Performance Tracking**: Updates predictions based on actual student performance
- **Adaptive Learning**: Enables adaptive quizzes based on predicted difficulty levels
- **Analytics Dashboard**: Provides insights into question difficulty distribution and student mastery

## Key Features

✅ **PHP 7.1.9 Compatible** - Works with legacy PHP versions
✅ **MySQL 5.7 Compatible** - Optimized for MySQL 5.7 database
✅ **Multi-Factor Algorithm** - Analyzes complexity, cognitive load, historical data, and question type
✅ **Real-Time Updates** - Automatically refines predictions as students answer questions
✅ **REST API** - Programmatic access to difficulty predictions and analytics
✅ **Bilingual Support** - English and Korean language packs included
✅ **Event-Driven** - Automatically triggers on question creation/update and quiz submission

## Quick Start

### Installation

1. **Download the plugin:**
   ```bash
   cd /path/to/moodle
   git clone <repository-url> local/difficulty_prediction
   ```

2. **Install via Moodle:**
   - Navigate to **Site Administration → Notifications**
   - Moodle will detect the new plugin and prompt you to install it
   - Click **Upgrade Moodle database now**

3. **Configure settings:**
   - Go to **Site Administration → Plugins → Local plugins → Difficulty Prediction**
   - Adjust algorithm weights and thresholds as needed

### Basic Usage

#### Automatic Prediction

Difficulty is automatically predicted when:
- A new question is created
- An existing question is updated
- Students submit quiz attempts (triggers performance updates)

#### Manual Prediction

```php
use local_difficulty_prediction\difficulty_predictor;

// Predict difficulty for a question
$prediction = difficulty_predictor::predict($questionid);

echo "Difficulty Level: " . $prediction->predicted_level;
echo "Confidence: " . ($prediction->confidence_score * 100) . "%";
```

#### View Analytics

Navigate to a course, then:
- **Reports → Difficulty Analytics** to view course-wide difficulty distribution
- Click on individual questions to see performance metrics

## Architecture

### Database Schema

The plugin creates three main tables:

1. **`mdl_question_difficulty`** - Stores predicted and actual difficulty levels
2. **`mdl_question_performance`** - Tracks individual student performance
3. **`mdl_difficulty_config`** - Configuration for prediction algorithms

### Prediction Algorithm

The difficulty prediction uses a weighted multi-factor model:

```
predicted_difficulty =
    (complexity_score × 0.40) +
    (cognitive_load_score × 0.30) +
    (historical_score × 0.20) +
    (question_type_score × 0.10)
```

**Factors:**
- **Complexity** (40%): Number of operations, nesting depth, variables
- **Cognitive Load** (30%): Text readability, number of concepts, abstraction level
- **Historical Data** (20%): Past student performance on similar questions
- **Question Type** (10%): Inherent difficulty of question format

### Adaptive Refinement

After students attempt questions, actual difficulty is calculated:

```
actual_difficulty = 1 - (success_rate) + (normalized_time × 0.3)
```

Predictions are updated using exponential moving average:

```
updated_difficulty = (0.7 × actual) + (0.3 × predicted)
```

## REST API

### Endpoints

#### **POST** `/local/difficulty_prediction/api.php?action=predict`

Predict difficulty for a question.

**Request:**
```json
{
    "questionid": 12345,
    "force_recalculate": false
}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "questionid": 12345,
        "predicted_difficulty": 0.68,
        "predicted_level": 4,
        "confidence_score": 0.85,
        "features": {
            "complexity_score": 0.72,
            "cognitive_load_score": 0.65,
            "historical_score": 0.70,
            "question_type_score": 0.50
        }
    }
}
```

#### **GET** `/local/difficulty_prediction/api.php?action=analytics&courseid=10`

Get difficulty analytics for a course.

**Response:**
```json
{
    "status": "success",
    "data": {
        "total_questions": 150,
        "distribution": {
            "1": 25,
            "2": 40,
            "3": 45,
            "4": 30,
            "5": 10
        },
        "avg_difficulty": 2.8,
        "accuracy_rate": 0.82
    }
}
```

See [docs/api-reference.md](docs/api-reference.md) for complete API documentation.

## Configuration

### Plugin Settings

Configure at **Site Administration → Plugins → Local plugins → Difficulty Prediction**:

| Setting | Default | Description |
|---------|---------|-------------|
| Enable auto prediction | ✅ Enabled | Automatically predict on question create/update |
| Complexity weight | 0.40 | Weight for complexity analysis |
| Cognitive load weight | 0.30 | Weight for cognitive load analysis |
| Historical data weight | 0.20 | Weight for past performance data |
| Question type weight | 0.10 | Weight for question type |
| Min attempts threshold | 10 | Minimum attempts before using actual difficulty |
| Cache TTL | 3600 sec | How long to cache predictions |

### Algorithm Tuning

Weights should sum to 1.0 for optimal results. Adjust based on your use case:

- **More emphasis on content**: Increase complexity + cognitive load weights
- **More emphasis on data**: Increase historical weight (requires sufficient attempts)
- **Balanced approach**: Use default weights (recommended)

## Scheduled Tasks

Two scheduled tasks run automatically:

1. **Update Difficulties** (Daily at 2 AM)
   - Batch updates predictions based on new performance data
   - Processes up to 500 questions per run

2. **Cleanup Old Performance** (Weekly on Sunday at 3 AM)
   - Archives performance data older than 2 years
   - Maintains database performance

## Development

### File Structure

```
local/difficulty_prediction/
├── version.php                    # Plugin metadata
├── settings.php                   # Admin settings
├── lib.php                        # Library functions
├── db/
│   ├── install.xml               # Database schema
│   ├── access.php                # Capabilities
│   ├── events.php                # Event observers
│   ├── services.php              # Web services
│   └── tasks.php                 # Scheduled tasks
├── classes/
│   ├── feature_extractor.php     # Feature extraction
│   ├── difficulty_predictor.php  # Main prediction engine
│   ├── performance_tracker.php   # Performance tracking
│   ├── api_controller.php        # REST API controller
│   ├── observer.php              # Event observer
│   └── task/
│       ├── update_difficulties.php
│       └── cleanup_old_performance.php
├── lang/
│   ├── en/                       # English strings
│   └── ko/                       # Korean strings
└── tests/
    └── difficulty_predictor_test.php
```

### Running Tests

```bash
cd /path/to/moodle
php admin/tool/phpunit/cli/init.php
vendor/bin/phpunit --group local_difficulty_prediction
```

### Extending the Plugin

See [docs/developer-guide.md](docs/developer-guide.md) for:
- Adding new feature extractors
- Customizing the prediction algorithm
- Creating custom analytics reports
- Integrating with external ML models

## Troubleshooting

### Common Issues

**Issue:** Predictions have low confidence scores
**Solution:** Ensure questions have sufficient attempts (min 10). Adjust `min_attempts_threshold` setting.

**Issue:** Predictions seem inaccurate
**Solution:** Check algorithm weights. Consider training on a sample set and adjusting weights based on accuracy metrics.

**Issue:** Performance data not updating
**Solution:** Verify event observers are enabled. Check scheduled task logs.

**Issue:** Database errors on installation
**Solution:** Ensure MySQL 5.7+ is installed. Check database user permissions.

### Debug Mode

Enable debug mode in config.php:
```php
$CFG->debug = DEBUG_DEVELOPER;
$CFG->debugdisplay = 1;
```

Check logs at **Site Administration → Reports → Logs**.

## Support

- **Documentation**: [docs/](docs/)
- **Issue Tracker**: GitHub Issues
- **Email**: support@kaist.ac.kr

## License

This plugin is licensed under the GNU General Public License v3.0 or later.

See [LICENSE](LICENSE) for details.

## Credits

Developed by **KAIST Touch Math Academy** for the AI Education System Pipeline project.

### Contributors
- Architecture & Algorithm Design
- PHP/MySQL Implementation
- Moodle Integration
- Documentation

### Research References
- Item Response Theory (IRT)
- Bloom's Taxonomy for Cognitive Complexity
- Flesch Reading Ease Formula
- Educational Measurement Standards

## Changelog

### Version 1.0.0 (2025-11-18)
- Initial release
- Multi-factor difficulty prediction algorithm
- Automatic performance tracking and updates
- REST API for external integration
- English and Korean language support
- Moodle 3.7 compatibility
- PHP 7.1.9 compatibility
- MySQL 5.7 compatibility

---

**Made with ❤️ for better education**
