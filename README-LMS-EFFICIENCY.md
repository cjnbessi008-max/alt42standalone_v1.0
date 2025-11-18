# Moodle LMS Integration & Thought Efficiency Score (TES)

**Version**: 1.0
**Date**: 2025-11-18
**Target LMS**: Moodle 3.7 (MySQL 5.7, PHP 7.1.9)

---

## 🎯 Overview

This repository contains the complete specification and implementation for integrating the AI Education System with **Moodle LMS** and providing a **Thought Efficiency Score (TES)** - a novel metric that measures student learning efficiency based on time, accuracy, and problem-solving approach.

### What is Thought Efficiency Score (TES)?

TES is a comprehensive metric that goes beyond simple accuracy to measure how effectively students learn:

```
TES = (Correctness × 40%) + (Speed × 30%) + (First-Try Success × 20%) + (Consistency × 10%)
```

**Key Benefits**:
- ✅ Identifies students who need help before they fail
- ✅ Recognizes efficient learners, not just correct answers
- ✅ Provides actionable insights for teachers
- ✅ Automatically syncs grades to Moodle Gradebook

---

## 📁 Repository Structure

```
alt42standalone_v1.0/
├── docs/                                      # Comprehensive documentation
│   ├── efficiency-score-model.md             # TES calculation methodology
│   ├── database-schema-lms-efficiency.md     # Database design (7 new tables)
│   ├── lms-integration-architecture.md       # LTI 1.3 integration design
│   ├── api-specification.md                  # REST API endpoints (12 new)
│   └── dashboard-specification.md            # Teacher & student dashboards
│
├── src/                                       # Implementation code
│   └── services/
│       └── efficiency_calculator.py          # TES calculation service
│
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md    # Original PRD
│
└── README-LMS-EFFICIENCY.md                  # This file
```

---

## 🚀 Quick Start

### 1. Read the Documentation

**Start here** (in order):
1. **[Efficiency Score Model](docs/efficiency-score-model.md)** - Understand how TES works
2. **[LMS Integration Architecture](docs/lms-integration-architecture.md)** - See how Moodle connects
3. **[Database Schema](docs/database-schema-lms-efficiency.md)** - Review data structures
4. **[API Specification](docs/api-specification.md)** - Explore endpoints
5. **[Dashboard Specification](docs/dashboard-specification.md)** - View UI designs

### 2. Set Up Database

```bash
# Create PostgreSQL database
createdb ai_education_db

# Run migrations (in order)
psql -U postgres -d ai_education_db -f docs/database-schema-lms-efficiency.md
# (Extract SQL from markdown and execute)
```

### 3. Configure Moodle

**In Moodle Admin Panel**:
1. Go to: **Site administration > Plugins > External tool > Manage tools**
2. Add new tool:
   - Tool name: `AI Education System`
   - Tool URL: `https://your-domain.com/api/lti/launch`
   - LTI version: `1.3`
   - Initiate login URL: `https://your-domain.com/api/lti/login`
   - Public keyset URL: `https://your-domain.com/.well-known/jwks.json`
3. Enable services:
   - ☑ IMS LTI Assignment and Grade Services
   - ☑ Can manage score (for grade passback)

### 4. Install Dependencies

```bash
pip install -r requirements.txt
# (Add: fastapi, sqlalchemy, numpy, pydantic, python-jose, httpx)
```

### 5. Run the Service

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

---

## 📊 Key Features

### 1. Thought Efficiency Score (TES)

**Calculation Components**:
- **Correctness (40%)**: Accuracy of answers
- **Speed (30%)**: Time efficiency vs. cohort median
- **First-Try Success (20%)**: Problems solved without hints/retries
- **Consistency (10%)**: Performance stability across problem types

**Grading Scale**:
| TES Range | Grade | Performance Level |
|-----------|-------|-------------------|
| 90-100    | A     | Excellent Efficiency |
| 80-89     | B     | Good Efficiency |
| 70-79     | C     | Satisfactory Efficiency |
| 60-69     | D     | Below Average Efficiency |
| 0-59      | F     | Poor Efficiency |

### 2. Moodle LTI 1.3 Integration

**Authentication Flow**:
1. Student clicks "Launch" in Moodle course
2. LTI 1.3 OIDC handshake (secure, industry-standard)
3. User mapped to internal account (auto-created if needed)
4. Session established with Moodle context

**Grade Passback**:
- Automatic sync after module completion
- Real-time updates to Moodle Gradebook
- Manual sync option for teachers
- Retry logic for failed submissions

### 3. Teacher Analytics Dashboard

**Key Metrics**:
- Cohort average TES
- Performance distribution (A-F breakdown)
- Component analysis (which skills need work?)
- At-risk student alerts
- Week-over-week trends

**AI-Generated Insights**:
- "Charlie's TES dropped 13 points - schedule tutoring"
- "Overall speed declining 15% - review engagement"
- "50% of students struggle with subtraction - add practice"

### 4. Student Dashboard

**Student-Friendly View**:
- Current TES with encouraging message
- Strengths highlighted (positive reinforcement)
- Areas to improve with actionable tips
- Progress chart showing improvement over time
- Topic-level performance breakdown

---

## 🔧 Technical Specifications

### Database
- **DBMS**: PostgreSQL 15+ (JSONB support required)
- **New Tables**: 7 (lms_integrations, lms_user_mappings, efficiency_scores, etc.)
- **Indexes**: 15+ for query optimization
- **Partitioning**: Ready for 1M+ records

### API
- **Framework**: FastAPI (Python)
- **Protocol**: REST with JWT authentication
- **Endpoints**: 12 new endpoints
  - 3 for LTI authentication
  - 6 for efficiency scoring
  - 3 for LMS management
- **Rate Limits**: Configurable per endpoint

### Frontend
- **Framework**: React 18+
- **UI Library**: Material-UI or Ant Design
- **Charts**: Recharts or Chart.js
- **Responsive**: Desktop, tablet, mobile

### Performance Targets
- TES calculation: **< 100ms** per student
- Dashboard load: **< 2 seconds** for 100 students
- Grade passback: **< 500ms** per sync
- API rate: **100 req/sec** sustained

---

## 📖 API Examples

### Calculate TES Score

```bash
curl -X POST https://your-domain.com/api/efficiency/calculate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-uuid-1234",
    "module_id": "module-fractions-uuid"
  }'
```

**Response**:
```json
{
  "tes_score": 96.00,
  "tes_percentile": 95,
  "tes_grade": "A",
  "components": {
    "correctness": {"score": 95.00, "weight": 0.40},
    "speed": {"score": 100.00, "weight": 0.30},
    "first_try_success": {"score": 90.00, "weight": 0.20},
    "consistency": {"score": 100.00, "weight": 0.10}
  },
  "cohort_context": {
    "cohort_avg_tes": 72.00,
    "student_percentile": 95
  }
}
```

### Get Teacher Dashboard

```bash
curl https://your-domain.com/api/efficiency/dashboard/module-fractions-uuid \
  -H "Authorization: Bearer {token}"
```

**Response**: See [API Specification](docs/api-specification.md#34-get-apiefficiencydashboardmodule_id)

---

## 🔒 Security

### LTI 1.3 Security
- ✅ JWT signature verification (RS256)
- ✅ Nonce validation (prevents replay attacks)
- ✅ Token expiration checks
- ✅ Issuer and audience validation

### Data Privacy
- TES scores visible only to:
  - The student themselves
  - Their assigned teachers
  - Course administrators
- Anonymized cohort comparisons
- GDPR/FERPA compliant (configurable)

### Authentication
- Session tokens: JWT with 1-hour expiry
- HTTPS only (TLS 1.2+)
- CSRF protection via state parameter
- Rate limiting per endpoint

---

## 🧪 Testing

### Unit Tests

```bash
pytest tests/test_efficiency_calculator.py
pytest tests/test_lti_authentication.py
```

### Integration Tests

```bash
pytest tests/test_lti_integration.py
pytest tests/test_grade_passback.py
```

### Manual Testing Checklist

- [ ] Launch from Moodle as student
- [ ] Launch from Moodle as teacher
- [ ] Complete module and verify grade in Moodle
- [ ] Test expired JWT rejection
- [ ] Test invalid signature rejection
- [ ] Test dashboard load with 100 students
- [ ] Test mobile responsive design

---

## 📈 Implementation Roadmap

### Phase 1: LTI Authentication (Weeks 1-2)
- ✅ Design complete
- [ ] Implement `/lti/login` endpoint
- [ ] Implement `/lti/launch` endpoint
- [ ] Build JWT validation
- [ ] Create user mapping logic

### Phase 2: TES Calculation (Weeks 3-4)
- ✅ Design complete
- ✅ Implementation complete (`src/services/efficiency_calculator.py`)
- [ ] Unit tests (70%+ coverage)
- [ ] Integration with API endpoints

### Phase 3: Grade Passback (Weeks 5-6)
- ✅ Design complete
- [ ] Implement OAuth2 client for Moodle
- [ ] Build AGS grade submission
- [ ] Add retry logic for failures

### Phase 4: Dashboards (Weeks 7-10)
- ✅ Design complete
- [ ] Implement teacher dashboard (React)
- [ ] Implement student dashboard (React)
- [ ] Chart components
- [ ] Mobile responsive design

### Phase 5: Testing & Launch (Weeks 11-12)
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation finalization
- [ ] Pilot deployment with 50 students

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: "JWT signature verification failed"
- **Solution**: Re-fetch Moodle's public keys from JWKS endpoint
- **Check**: Ensure Moodle tool configuration has correct keyset URL

**Issue**: "Insufficient data for TES calculation"
- **Cause**: Student has < 10 attempts
- **Solution**: Display "Gathering data..." message until threshold reached

**Issue**: "Grade passback failed - 401 Unauthorized"
- **Cause**: OAuth2 access token expired
- **Solution**: Request new token from Moodle token endpoint

**Issue**: "Session expired"
- **Cause**: JWT session token expired (1 hour TTL)
- **Solution**: Redirect to Moodle for re-launch

---

## 🤝 Contributing

### Code Style
- Python: PEP 8 (use `black` formatter)
- SQL: Lowercase with underscores
- JavaScript: ESLint with Airbnb config

### Commit Message Format
```
feat: add TES calculation service
fix: handle missing AGS endpoint gracefully
docs: update API specification with new endpoints
test: add unit tests for efficiency calculator
```

### Pull Request Process
1. Create feature branch: `feature/tes-dashboard`
2. Implement changes with tests
3. Update documentation
4. Submit PR with description

---

## 📞 Support

### Documentation
- **Efficiency Model**: [docs/efficiency-score-model.md](docs/efficiency-score-model.md)
- **API Docs**: [docs/api-specification.md](docs/api-specification.md)
- **Database Schema**: [docs/database-schema-lms-efficiency.md](docs/database-schema-lms-efficiency.md)

### Contact
- **Email**: admin@kaist.ac.kr (placeholder)
- **Issues**: GitHub Issues
- **Slack**: #ai-education-system (placeholder)

---

## 📝 License

Copyright © 2025 KAIST Touch Math Academy
All rights reserved.

---

## 🎓 Research & Publications

This Thought Efficiency Score (TES) methodology is based on educational research in:
- Cognitive load theory
- Time-on-task metrics
- Formative assessment
- Learning analytics

**Future Work**:
- Predictive modeling of final exam performance using TES
- Adaptive learning pathways based on TES components
- Multi-subject TES aggregation

---

## 🙏 Acknowledgments

- **LTI Specification**: IMS Global Learning Consortium
- **Moodle Community**: For LTI 1.3 implementation guidance
- **KAIST Faculty**: For pedagogical insights on efficiency metrics

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Status**: Design Complete - Ready for Implementation
