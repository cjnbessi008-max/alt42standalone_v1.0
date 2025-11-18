# 규칙 예제 모음

## 1. 검증 규칙 (Validation Rules)

### 예제 1: 간단한 점수 검증 ✅ (낮은 복잡도)
```javascript
if (score >= 0 && score <= 100) {
  return true;
}
return false;
```
**복잡도**: 낮음 (조건 2개)

---

### 예제 2: 복잡한 입력 검증 ⚠️ (중간 복잡도)
```javascript
if (email.includes('@') && email.includes('.')) {
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    if (age >= 18 && age <= 100) {
      return true;
    }
  }
}
return false;
```
**복잡도**: 중간 (조건 7개, 중첩 3레벨)
**경고**: 중첩 깊이가 높음

---

## 2. 계산 규칙 (Calculation Rules)

### 예제 3: 점수 계산 ✅ (낮은 복잡도)
```javascript
const finalScore = midterm * 0.3 + final * 0.4 + homework * 0.3;
return finalScore;
```
**복잡도**: 없음

---

### 예제 4: 복잡한 성적 계산 ⚠️ (중간 복잡도)
```javascript
let totalScore = 0;

if (attendance.rate > 0.8) {
  totalScore += attendance.bonus;
}

if (homework.submitted === homework.total) {
  totalScore += homework.bonus;
}

totalScore += (midterm * 0.3) + (final * 0.4) + (quiz * 0.2) + (participation * 0.1);

if (totalScore > 100) {
  totalScore = 100;
}

return totalScore;
```
**복잡도**: 중간 (조건 4개, 엔티티 8개)
**경고**: 많은 엔티티 참조

---

## 3. 진행 규칙 (Progression Rules)

### 예제 5: 단순 진행 조건 ✅ (낮은 복잡도)
```javascript
if (completedLessons >= requiredLessons) {
  return 'next_level';
}
return 'current_level';
```
**복잡도**: 낮음

---

### 예제 6: 복잡한 레벨업 조건 ❌ (높은 복잡도)
```javascript
if (student.level.current < student.level.max) {
  if (student.experience.total >= student.experience.required) {
    if (student.achievements.completed.length >= 3) {
      if (student.skills.mastered.count > 5 || student.mentor.approved) {
        if (student.assessment.score >= 80 && student.assessment.attempts <= 3) {
          if (!student.restrictions.active && student.payment.status === 'paid') {
            return 'level_up_approved';
          }
        }
      }
    }
  }
}
return 'level_up_denied';
```
**복잡도**: 매우 높음 (조건 10개, 중첩 6레벨, 엔티티 12개)
**경고**:
- 매우 깊은 중첩
- 많은 조건
- 많은 엔티티 참조

**개선 방법**:
```javascript
// 조건을 분리하여 가독성 개선
const hasRoomToGrow = student.level.current < student.level.max;
const hasEnoughExperience = student.experience.total >= student.experience.required;
const hasAchievements = student.achievements.completed.length >= 3;
const hasSkillsOrApproval = student.skills.mastered.count > 5 || student.mentor.approved;
const passedAssessment = student.assessment.score >= 80 && student.assessment.attempts <= 3;
const noRestrictions = !student.restrictions.active;
const hasPaidStatus = student.payment.status === 'paid';

if (!hasRoomToGrow) return 'max_level_reached';
if (!hasEnoughExperience) return 'insufficient_experience';
if (!hasAchievements) return 'achievements_required';
if (!hasSkillsOrApproval) return 'skills_or_approval_required';
if (!passedAssessment) return 'assessment_failed';
if (!noRestrictions || !hasPaidStatus) return 'account_issue';

return 'level_up_approved';
```

---

## 4. 피드백 규칙 (Feedback Rules)

### 예제 7: 간단한 피드백 ✅ (낮은 복잡도)
```javascript
if (score >= 90) {
  return '훌륭합니다!';
} else if (score >= 70) {
  return '잘했습니다!';
} else {
  return '더 노력하세요.';
}
```
**복잡도**: 낮음

---

### 예제 8: 상세한 피드백 ⚠️ (중간 복잡도)
```javascript
let feedback = '';

if (score >= 90 && effort.level === 'high') {
  feedback = '뛰어난 성과입니다!';
} else if (score >= 70) {
  if (improvement.rate > 0.2) {
    feedback = '크게 향상되었습니다!';
  } else {
    feedback = '꾸준히 노력하고 있습니다.';
  }
} else if (score >= 50) {
  if (attendance.rate < 0.7) {
    feedback = '출석률을 높여보세요.';
  } else {
    feedback = '좀 더 집중이 필요합니다.';
  }
} else {
  feedback = '개별 상담이 필요합니다.';
}

return feedback;
```
**복잡도**: 중간 (조건 8개, 중첩 3레벨)

---

## 5. 순환 참조 예제 (피해야 할 패턴)

### 예제 9: 순환 참조 🔴 (매우 높은 복잡도)
```javascript
function calculateScore(student) {
  if (student.score < 50) {
    student.score = calculateScore(student);  // 무한 루프 위험!
  }
  return student.score;
}
```
**복잡도**: 매우 높음 (순환 참조 감지)
**경고**: 순환 참조로 인한 무한 루프 위험

**개선 방법**:
```javascript
function calculateScore(student, depth = 0) {
  if (depth > 10) return student.score;  // 재귀 깊이 제한

  if (student.score < 50 && student.bonusAvailable) {
    return student.score + student.bonus;
  }
  return student.score;
}
```

---

## 복잡도 감소 팁

### 1. 조기 반환 (Early Return) 사용
❌ **나쁜 예**:
```javascript
if (condition1) {
  if (condition2) {
    if (condition3) {
      return 'success';
    }
  }
}
return 'failure';
```

✅ **좋은 예**:
```javascript
if (!condition1) return 'failure';
if (!condition2) return 'failure';
if (!condition3) return 'failure';
return 'success';
```

### 2. 조건을 변수로 추출
❌ **나쁜 예**:
```javascript
if (user.age >= 18 && user.hasLicense && !user.isSuspended && user.payment.current) {
  // ...
}
```

✅ **좋은 예**:
```javascript
const isEligible = user.age >= 18;
const hasValidLicense = user.hasLicense && !user.isSuspended;
const hasPaid = user.payment.current;

if (isEligible && hasValidLicense && hasPaid) {
  // ...
}
```

### 3. 규칙 분리
대규모 조건은 여러 개의 작은 규칙으로 분리하세요.
