# Product Requirements Document: Math Concept Game System for Elementary Students

## 1. Introduction/Overview

### Core Concept
**"Math concepts are living beings."**

This is a revolutionary approach to math education where abstract mathematical concepts are personified as collectible "concept spirits" (개념 정령) that grow as children master each stage. Every concept transforms from "I hate it → It's okay → It's fun → I love it" through emotional connection and tactile experience.

### Background
Elementary students often develop math anxiety due to abstract symbols and formulas. This system addresses the root cause by:
- Starting with **sensory experiences** before introducing symbols
- Using **0-10% mathematical notation** (operation-focused, sensation-focused)
- Creating **emotional bonds** with personified math concepts
- Providing **stage-by-stage growth loops** that build confidence incrementally

### Problem Statement
Current math education:
- Introduces formulas too early, triggering anxiety
- Lacks emotional connection to abstract concepts
- Focuses on correctness over understanding
- Doesn't provide incremental confidence building

### Solution
A gamified, card-collection system where:
1. Each math concept is a collectible "spirit character"
2. Students progress through 5 stages: Sensation → Pattern Discovery → Real-world Application → Basic Use → Concept Mastery
3. Completion earns points to collect concept cards
4. Characters grow and provide encouraging feedback
5. Displayed in a **virtual smartphone widget** (bottom-right of PC screen)
6. Synchronized with **Moodle LMS** problem sets

### Goal
Transform math anxiety into math affection through emotional engagement, sensory learning, and incremental mastery for elementary students (grades 1-6).

---

## 2. Core Game Structure

### 2.1 5-Stage Growth Loop (All Games)

Every concept follows this progression:

| Stage | Name | Focus | Notation Level | Goal |
|-------|------|-------|----------------|------|
| **1** | Sensation Stage | Daily life connection, pure manipulation | 0% | Feel it with hands/eyes |
| **2** | Pattern Discovery | "Oh, this is the rule!" | 0-5% | Discover natural patterns |
| **3** | Situational Response | Use concept in real scenarios | 5% | Apply without thinking |
| **4** | Simple Application | Concept messages (no formulas) | 10% | Light conceptual understanding |
| **5** | Concept Card Acquired | True friendship with concept | 10% | Emotional ownership |

### 2.2 Card Collection System

**Cards = Concept Spirits**

Each card contains:
- **Character Name**: Friendly nickname (e.g., "Frani the Fraction Fairy")
- **Growth Level**: 1-5, unlocked through mastery
- **Concept Alias**: Child-friendly description
- **Emotional Expression**: "You divided that so well today!"
- **Learning Log Integration**: Synced with LMS progress

**Example Cards:**
- 🍕 Fractions → "Frani the Slice Fairy"
- 💰 Decimals → "Coni the Coin Spirit"
- 🎨 Ratios → "Rio the Paint Spirit"
- ⏰ Time → "Timmy the Bus Spirit"
- 🏠 Geometry → "Dimo the Room Designer"
- 🎵 Sequences → "Roop the Rhythm Spirit"
- 🍦 Division → "Scoop the Ice Cream Ghost"
- 🌡️ Graphs → "Weathering the Temperature Spirit"
- 🎒 Units → "Packer the Backpack Spirit"
- 🎲 Probability → "Fork the Choice Spirit"
- 📖 Word Problems → "Chatlin the Story Spirit"
- 📝 Explanations → "Order the Logic Spirit"

### 2.3 Point & Progression System

**Point Flow:**
```
Mission Clear → Sensation Points Awarded
     ↓
Sensation → Understanding → Familiarity → Conceptualization
     ↓
Natural Growth Without Pressure
```

**Progression:**
- Stage completion = Points earned
- Points accumulate → Card unlocked
- Card collected → Spirit grows (with visual evolution)
- Spirit provides emotional feedback (not just correctness)

---

## 3. Game Catalog (12 Concept Games)

### 🍕 Game 1: Fraction Fairy Frani - "Share & Eat Adventure"

**Concept:** Fractions (분수)
**Spirit:** Frani the Slice Fairy (조각요정 프라니)

**Stage Flow:**
1. **Sensation**: Drag finger to divide pizza/cake/watermelon into equal pieces
2. **Pattern**: "When pieces are equal, the fairy smiles!"
3. **Situation**: "Help 3 friends share this fairly!"
4. **Application**: Text hint: "Counting pieces makes it easier!" (no fractions notation)
5. **Card Acquired**: "Frani Lv.1 – Equal Division Master"

**Key Features:**
- NO mention of numerator/denominator initially
- Wrong divisions = fairy frowns with cute feedback ("This piece is too small~")
- Visual feedback emphasizes equality/inequality
- Tactile, intuitive slicing experience

**Technical:**
- Canvas-based draggable dividing lines
- Visual comparison of piece sizes
- Feedback animations (fairy expressions)

---

### 💰 Game 2: Decimal Coin Spirit Coni - "Café Calculation Challenge"

**Concept:** Decimals (소수)
**Spirit:** Coni the Coin Spirit (동전정령 코니)

**Stage Flow:**
1. **Sensation**: Drag coins to pay for items (850 won coffee)
2. **Pattern**: "Small coins add up to big money!"
3. **Situation**: "Buy this 850 won coffee!"
4. **Application**: Intuitive hint: "0.1 feels like 10 won!" (no place value explanation)
5. **Card Acquired**: "Coni Lv.1 – Decimal Sense Awakened!"

**Key Features:**
- Physical coin dragging (10 won, 50 won, 100 won, 500 won)
- Visual total updates as coins added
- Real-world café context

**Technical:**
- Drag-and-drop coin UI
- Running total display
- Purchase validation

---

### 🎨 Game 3: Ratio Paint Spirit Rio - "Juice Color Matching"

**Concept:** Ratio & Proportion (비율)
**Spirit:** Rio the Paint Spirit (색물감 정령 리오)

**Stage Flow:**
1. **Sensation**: Pour water vs. juice → color changes
2. **Pattern**: Color intensity changes with ratio
3. **Situation**: "Match the recipe color!"
4. **Application**: Adjust ratio to match target color
5. **Card Acquired**: "Rio Lv.1 – Ratio Color Master"

**Key Features:**
- Visual color mixing feedback
- Recipe comparison (target color vs. created color)
- Immediate visual consequence of ratios

**Technical:**
- Color blending algorithm based on ratios
- Slider or pour controls
- Visual recipe card for target

---

### 🏠 Game 4: Geometry Designer Dimo - "Room Decoration"

**Concept:** Area & Perimeter (넓이와 둘레)
**Spirit:** Dimo the Shape Spirit (도형정령 디모)

**Stage Flow:**
1. **Sensation**: Stick tiles to fill floor gaps
2. **Pattern**: Edges = perimeter, filled space = area
3. **Situation**: Arrange furniture in limited space
4. **Application**: Spatial awareness without formulas
5. **Card Acquired**: "Dimo Lv.1 – Space Designer"

**Key Features:**
- Tile-based grid system
- Furniture placement mechanics
- Visual perimeter highlighting

**Technical:**
- Grid-based drag-and-drop
- Area calculation visualization
- Furniture collision detection

---

### 🎵 Game 5: Sequence Rhythm Spirit Roop - "Pattern Music"

**Concept:** Patterns & Sequences (규칙과 수열)
**Spirit:** Roop the Rhythm Spirit (리듬정령 루프)

**Stage Flow:**
1. **Sensation**: Tap along with rhythm pattern
2. **Pattern**: Discover the repeating rule
3. **Situation**: "What note comes next?"
4. **Application**: Verbalize the pattern rule
5. **Card Acquired**: "Roop Lv.1 – Pattern Finder"

**Key Features:**
- Audio-visual rhythm patterns
- Prediction challenges
- Pattern recognition rewards

**Technical:**
- Audio playback system
- Timing-based input validation
- Visual pattern representation

---

### 🍦 Game 6: Division Ice Cream Ghost Scoop - "Fair Sharing"

**Concept:** Division & Remainders (나눗셈과 나머지)
**Spirit:** Scoop the Ice Cream Ghost (아이스크림 귀신 스쿱)

**Stage Flow:**
1. **Sensation**: Distribute ice cream scoops to children
2. **Pattern**: Leftover scoops = remainder
3. **Situation**: Open boxes (10-scoop boxes) to get more
4. **Application**: Intuitive understanding without algorithm
5. **Card Acquired**: "Scoop Lv.1 – Fair Distributor"

**Key Features:**
- Drag ice cream scoops to children
- Visual remainder highlighting
- Box-opening for groups of 10

**Technical:**
- Object distribution mechanics
- Remainder visualization
- Grouping system (boxes of 10)

---

### ⏰ Game 7: Time Bus Spirit Timmy - "Bus Schedule"

**Concept:** Time & Duration (시간)
**Spirit:** Timmy the Bus Spirit (버스정령 티미)

**Stage Flow:**
1. **Sensation**: Rotate analog clock → bus moves
2. **Pattern**: 60-seat bus → 60 minutes feeling
3. **Situation**: "How many minutes until arrival?"
4. **Application**: Time estimation practice
5. **Card Acquired**: "Timmy Lv.1 – Time Tracker"

**Key Features:**
- Interactive analog clock
- Visual bus movement synchronized with time
- Seat counting = minute counting

**Technical:**
- Draggable clock hands
- Bus position animation
- Time calculation display

---

### 🎒 Game 8: Unit Packer Spirit - "Backpack Packing"

**Concept:** Measurement Units (단위)
**Spirit:** Packer the Backpack Spirit (짐꾸리기 정령 팩커)

**Stage Flow:**
1. **Sensation**: Pack 1kg/500g items into backpack
2. **Pattern**: Different weights feel different
3. **Situation**: Measure with ruler (drag to measure)
4. **Application**: Volume measurement (pour water into cups)
5. **Card Acquired**: "Packer Lv.1 – Measurement Master"

**Key Features:**
- Weight-based packing challenges
- Ruler dragging for length
- Liquid volume visualization

**Technical:**
- Weight constraint system
- Ruler measurement tool
- Volume container visualization

---

### 🎲 Game 9: Probability Choice Spirit Fork - "Decision Tree"

**Concept:** Probability & Combinations (경우의 수)
**Spirit:** Fork the Choice Spirit (선택정령 포크)

**Stage Flow:**
1. **Sensation**: Each choice branches into multiple paths
2. **Pattern**: Tree-like visualization of possibilities
3. **Situation**: Roulette for probability feeling
4. **Application**: Counting all possible outcomes
5. **Card Acquired**: "Fork Lv.1 – Possibility Explorer"

**Key Features:**
- Visual decision tree branching
- Roulette probability visualization
- Path counting

**Technical:**
- Tree diagram generation
- Roulette animation with probability weights
- Path enumeration

---

### 🌡️ Game 10: Graph Weather Spirit - "Temperature Tracker"

**Concept:** Graphs & Data (그래프)
**Spirit:** Weathering the Temperature Spirit (날씨정령 웨더링)

**Stage Flow:**
1. **Sensation**: Input temperature → graph animates
2. **Pattern**: Graph shape shows trends
3. **Situation**: Create your own graph from data
4. **Application**: Read and interpret graph patterns
5. **Card Acquired**: "Weathering Lv.1 – Data Visualizer"

**Key Features:**
- Interactive graph creation
- Animated graph drawing
- Temperature input system

**Technical:**
- Chart.js or D3.js for graphs
- Input form for data points
- Animation transitions

---

### 📖 Game 11: Word Problem Story Spirit Chatlin - "Story Breaker"

**Concept:** Word Problem Comprehension (문제 읽기)
**Spirit:** Chatlin the Story Spirit (스토리정령 챗린)

**Stage Flow:**
1. **Sensation**: Long problem auto-splits into chat messages
2. **Pattern**: Conditions highlighted by color
3. **Situation**: Identify what's being asked
4. **Application**: Natural understanding without anxiety
5. **Card Acquired**: "Chatlin Lv.1 – Story Reader"

**Key Features:**
- Chat-style problem presentation
- Color-coded conditions
- Step-by-step revelation

**Technical:**
- NLP-based problem parsing
- Chat UI component
- Highlight system for key information

---

### 📝 Game 12: Explanation Logic Spirit Order - "Story Sequencer"

**Concept:** Logical Explanation (서술형)
**Spirit:** Order the Logic Spirit (논리정령 오더)

**Stage Flow:**
1. **Sensation**: Drag cards to arrange in order
2. **Pattern**: Logical sequence creates a story
3. **Situation**: Explain your reasoning
4. **Application**: Student creates their own story
5. **Card Acquired**: "Order Lv.1 – Logic Builder"

**Key Features:**
- Slide card sequencing
- Drag-and-drop ordering
- Reason explanation prompts

**Technical:**
- Card sorting interface
- Sequence validation
- Text input for reasoning

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────┐
│         PC Screen (Bottom-Right Widget)         │
│    ┌────────────────────────────────────┐      │
│    │   Virtual Smartphone Container     │      │
│    │  ┌──────────────────────────────┐  │      │
│    │  │   Game Interface (HTML5)     │  │      │
│    │  │   - Canvas/WebGL rendering   │  │      │
│    │  │   - Touch-like interactions  │  │      │
│    │  │   - Card collection display  │  │      │
│    │  └──────────────────────────────┘  │      │
│    └────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
                    ↕ REST API
┌─────────────────────────────────────────────────┐
│           PHP 7.1.9 Backend                     │
│  - Game logic controllers                       │
│  - Progress tracking                            │
│  - Point & card management                      │
│  - Moodle integration layer                     │
└───────────┬─────────────────────┬───────────────┘
            │                     │
    ┌───────▼──────┐      ┌──────▼────────┐
    │  MySQL 5.7   │      │  Moodle LMS   │
    │  - Cards     │      │  - Problems   │
    │  - Progress  │      │  - Students   │
    │  - Points    │      │  - Sync data  │
    └──────────────┘      └───────────────┘
```

### 4.2 Technology Stack

**Frontend:**
- HTML5 Canvas / WebGL for interactive games
- JavaScript (ES6+) / TypeScript
- CSS3 for virtual smartphone styling
- Libraries:
  - Fabric.js or Konva.js (canvas manipulation)
  - GSAP (animations)
  - Howler.js (audio for rhythm game)
  - Chart.js (graph game)

**Backend:**
- PHP 7.1.9 (Legacy constraint)
- RESTful API architecture
- Session management for student state

**Database:**
- MySQL 5.7
- Tables:
  - `concept_cards` (card definitions)
  - `student_cards` (collected cards per student)
  - `student_progress` (stage completion per game)
  - `game_sessions` (active game state)
  - `points_log` (point transactions)

**Integration:**
- Moodle Web Services API
- Problem type detection → Auto-launch corresponding game
- Completion → Send points/progress back to Moodle

### 4.3 Virtual Smartphone Widget

**Design:**
- Fixed position: bottom-right corner of PC screen
- Dimensions: ~375px × 667px (iPhone 8 size)
- Always visible overlay (z-index: 9999)
- Minimizable to icon when not in use
- Notification badge for new cards/missions

**Interaction:**
- Click to maximize/minimize
- Mouse interactions simulate touch
- Drag-and-drop with mouse
- Scroll within widget boundary

**Implementation:**
```html
<div id="math-spirit-widget" class="smartphone-container">
  <div class="smartphone-screen">
    <div class="game-canvas-container">
      <!-- Game-specific content loads here -->
    </div>
    <div class="card-collection-button">🎴</div>
  </div>
</div>
```

### 4.4 Database Schema (MySQL 5.7)

```sql
-- Concept Cards Definition
CREATE TABLE concept_cards (
    card_id INT PRIMARY KEY AUTO_INCREMENT,
    concept_name VARCHAR(50) NOT NULL, -- 'fractions', 'decimals', etc.
    spirit_name VARCHAR(100) NOT NULL, -- 'Frani the Slice Fairy'
    spirit_alias VARCHAR(100), -- Child-friendly description
    max_level INT DEFAULT 5,
    unlock_points_required INT DEFAULT 100,
    card_image_url VARCHAR(255),
    description_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Card Collection
CREATE TABLE student_cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    card_id INT NOT NULL,
    current_level INT DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP NULL,
    FOREIGN KEY (card_id) REFERENCES concept_cards(card_id),
    UNIQUE KEY unique_student_card (student_id, card_id)
);

-- Student Progress per Game
CREATE TABLE student_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    card_id INT NOT NULL,
    current_stage INT DEFAULT 1, -- 1-5
    stage_1_completed BOOLEAN DEFAULT FALSE,
    stage_2_completed BOOLEAN DEFAULT FALSE,
    stage_3_completed BOOLEAN DEFAULT FALSE,
    stage_4_completed BOOLEAN DEFAULT FALSE,
    stage_5_completed BOOLEAN DEFAULT FALSE,
    total_points_earned INT DEFAULT 0,
    last_played_at TIMESTAMP NULL,
    FOREIGN KEY (card_id) REFERENCES concept_cards(card_id),
    UNIQUE KEY unique_student_game (student_id, card_id)
);

-- Points Transaction Log
CREATE TABLE points_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    card_id INT NOT NULL,
    points_earned INT NOT NULL,
    stage_completed INT, -- 1-5, or NULL if just practice
    reason VARCHAR(255), -- 'Stage 2 completion', 'Perfect score bonus'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES concept_cards(card_id)
);

-- Game Sessions (for resuming)
CREATE TABLE game_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    student_id INT NOT NULL,
    card_id INT NOT NULL,
    current_stage INT NOT NULL,
    session_data JSON, -- Game-specific state
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES concept_cards(card_id)
);

-- Moodle Integration Sync
CREATE TABLE moodle_sync (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    problem_type VARCHAR(50), -- Maps to concept_name
    problem_id INT,
    game_triggered BOOLEAN DEFAULT FALSE,
    completion_synced BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 Moodle Integration

**Trigger Flow:**
1. Student encounters problem in Moodle
2. Moodle detects problem type (fraction, decimal, etc.)
3. JavaScript injection → Open widget with specific game
4. Student completes game stages
5. Backend sends completion + points to Moodle via Web Services
6. Moodle updates student grade/progress

**API Endpoints:**
```
POST /api/moodle/trigger
  - Receives problem type & student ID from Moodle
  - Returns game launch URL

POST /api/moodle/complete
  - Sends completion data back to Moodle
  - Parameters: student_id, problem_id, score, completion_status
```

---

## 5. User Experience Flow

### 5.1 First-Time Student Experience

1. **Widget Introduction**
   - Animated widget appears with friendly mascot
   - "Hi! I'm here to help you love math!"
   - Brief tutorial (swipe, tap, drag demonstration)

2. **First Game Launch**
   - Student encounters fraction problem in Moodle
   - Widget bounces to get attention
   - "Let's play with Frani the Slice Fairy!"

3. **Stage 1: Pure Sensation**
   - No explanations, just "Divide this pizza!"
   - Tactile feedback, visual responses
   - Success = happy fairy animation + encouraging words

4. **Progressive Unlock**
   - Stage 1 complete → Points appear
   - "You earned 20 sensation points!"
   - Progress bar toward card unlock

5. **Card Collection Moment**
   - Celebratory animation
   - "You've unlocked Frani Lv.1!"
   - Card flips to reveal character art
   - Spirit speaks: "We're friends now!"

### 5.2 Returning Student Experience

1. **Widget greets with collected spirits**
   - "Welcome back! Your spirits missed you!"
   - Display current cards & levels

2. **Continue or new challenge**
   - Resume incomplete stages
   - Or start new concept game

3. **Level-up moments**
   - Spirit character evolves visually
   - New abilities/messages unlock
   - Celebration animation

### 5.3 Navigation

**Widget Menu:**
- 🎮 Play Games (list of 12 games)
- 🎴 My Cards (collection view)
- 📊 Progress (stages completed per game)
- ⚙️ Settings (sound, language)

**In-Game UI:**
- Current stage indicator (1-5)
- Points earned this session
- Hint button (gentle, non-intrusive)
- Exit button (saves progress automatically)

---

## 6. Emotional Design Principles

### 6.1 Emotional Progression

```
Hate/Fear → Curiosity → Enjoyment → Love
    ↓           ↓          ↓          ↓
  Avoid      Explore     Play      Master
```

**Design Techniques:**
- **Stage 1**: Zero pressure, pure play → Dissolve fear
- **Stage 2**: "Aha!" moments → Build curiosity
- **Stage 3**: Real-world relevance → Show usefulness
- **Stage 4**: Gentle introduction of terms → Not scary
- **Stage 5**: Ownership & pride → "This is MY concept"

### 6.2 Feedback Language

**Avoid:**
- ❌ "Wrong!"
- ❌ "Incorrect answer"
- ❌ "Try again" (cold tone)

**Use:**
- ✅ "Hmm, let's adjust this a bit!"
- ✅ "Almost there! The fairy feels it's close!"
- ✅ "What if we made it a little different?"
- ✅ "You're experimenting! That's awesome!"

**Celebration:**
- 🎉 "You did it! Frani is dancing!"
- 🎉 "Incredible! You found the pattern!"
- 🎉 "You're a [concept] master now!"

### 6.3 Character Personality

Each spirit has distinct personality:
- **Frani (Fractions)**: Gentle, encourages fairness
- **Coni (Decimals)**: Cheerful, loves shopping
- **Rio (Ratios)**: Artistic, talks about beauty
- **Dimo (Geometry)**: Organized, likes tidiness
- **Roop (Sequences)**: Musical, rhythmic speech
- **Scoop (Division)**: Generous, caring
- **Timmy (Time)**: Punctual, helpful
- **Packer (Units)**: Adventurous, practical
- **Fork (Probability)**: Curious, asks questions
- **Weathering (Graphs)**: Observant, thoughtful
- **Chatlin (Stories)**: Friendly, clarifies
- **Order (Logic)**: Wise, structured

---

## 7. Success Metrics

### 7.1 Primary KPIs

1. **Emotional Shift**
   - **Pre-test**: "How do you feel about [concept]?" (1-5 scale)
   - **Post-test**: Same question after 1 month
   - **Target**: 60% of students improve by 2+ points

2. **Engagement Rate**
   - **Metric**: % of students who voluntarily replay games
   - **Target**: >40% replay rate

3. **Stage Completion Rate**
   - **Metric**: % reaching Stage 5 (card acquisition)
   - **Target**: >70% complete all stages per game

4. **Concept Retention**
   - **Metric**: Test scores 2 weeks after game completion
   - **Target**: 80% retention vs. 50% traditional methods

5. **Math Anxiety Reduction**
   - **Metric**: Standard math anxiety questionnaire
   - **Target**: 30% reduction in anxiety scores

### 7.2 Secondary Metrics

6. **Time to Mastery**
   - **Metric**: Average time from Stage 1 to Stage 5
   - **Target**: <2 hours per concept

7. **Teacher Satisfaction**
   - **Metric**: Teacher survey on student behavior change
   - **Target**: 80% report positive attitude change

8. **System Usage**
   - **Metric**: Daily active students
   - **Target**: 60% of enrolled students use weekly

9. **Card Collection Rate**
   - **Metric**: Average cards per student
   - **Target**: >8 cards collected within semester

10. **Moodle Integration Success**
    - **Metric**: Auto-trigger success rate
    - **Target**: >95% successful launches

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Sprint 1-2: Core Infrastructure**
- Set up PHP 7.1.9 + MySQL 5.7 environment
- Database schema implementation
- Virtual smartphone widget framework
- Basic API structure

**Deliverables:**
- Working widget UI container
- Database with sample data
- API authentication & session management

### Phase 2: First Prototype (Weeks 5-8)

**Sprint 3-4: Fraction Game (Frani)**
- Implement all 5 stages for fraction game
- Canvas-based slicing mechanics
- Point system & progress tracking
- Card unlock animation

**Deliverables:**
- Fully playable Fraction game
- Card collection UI
- Progress dashboard

### Phase 3: Core Systems (Weeks 9-12)

**Sprint 5-6: Points & Card System**
- Complete card management backend
- Spirit character dialogue system
- Level-up mechanics
- Collection view UI

**Deliverables:**
- All 12 cards defined in database
- Character progression system
- Emotional feedback system

### Phase 4: Game Expansion (Weeks 13-20)

**Sprint 7-10: Implement 4 More Games**
- Decimal game (Coni)
- Ratio game (Rio)
- Geometry game (Dimo)
- Time game (Timmy)

**Deliverables:**
- 5 total games fully playable
- Consistent UX across games

### Phase 5: Integration (Weeks 21-24)

**Sprint 11-12: Moodle Integration**
- Web Services API setup
- Problem type detection
- Auto-launch mechanism
- Bi-directional sync (completion → Moodle)

**Deliverables:**
- Working Moodle integration
- Sync dashboard for teachers

### Phase 6: Completion (Weeks 25-30)

**Sprint 13-15: Remaining Games**
- Implement remaining 7 games
- Polish all interactions
- Bug fixes & optimization

**Deliverables:**
- All 12 games complete
- Performance optimized
- Cross-browser tested

### Phase 7: Pilot & Iteration (Weeks 31-36)

**Sprint 16-18: Beta Testing**
- Pilot with 2-3 classrooms
- Collect student feedback
- Measure emotional metrics
- Iterate based on data

**Deliverables:**
- Beta-tested system
- User feedback report
- Iteration plan

---

## 9. Technical Considerations

### 9.1 Performance

**Optimization Strategies:**
- Lazy loading: Load games only when triggered
- Asset caching: Cache sprites, sounds locally
- Canvas optimization: Use requestAnimationFrame, object pooling
- Database indexing: Index student_id, card_id heavily

**Target Performance:**
- Widget load time: <1 second
- Game initialization: <2 seconds
- Interaction response: <100ms
- 60 FPS for animations

### 9.2 Browser Compatibility

**Supported:**
- Chrome 70+ (primary target)
- Firefox 65+
- Safari 12+
- Edge 79+ (Chromium)

**Not Supported:**
- Internet Explorer (any version)
- Mobile browsers (future phase)

### 9.3 Accessibility

**Features:**
- Keyboard navigation support
- Screen reader compatibility for card text
- High contrast mode option
- Adjustable text size for instructions
- Color-blind friendly palettes

### 9.4 Security

**Measures:**
- Session-based authentication
- SQL injection prevention (prepared statements)
- XSS protection (sanitize all inputs)
- CORS restrictions
- Rate limiting on API endpoints

### 9.5 Scalability

**Current Target:**
- 500-1000 concurrent students
- 10,000 total students
- 100,000+ game sessions/month

**Future Scaling:**
- Database read replicas for high-traffic
- CDN for static game assets
- Redis caching for session data
- Horizontal PHP scaling via load balancer

---

## 10. Open Questions

### High Priority

1. **Moodle Version & API Access**
   - What version of Moodle is in use?
   - Do we have Web Services enabled?
   - What authentication method (token, OAuth)?

2. **Student Authentication**
   - How do students log in? (Moodle SSO, separate accounts?)
   - Age range & grade levels?

3. **Existing Moodle Problem Structure**
   - How are problems categorized currently?
   - Can we tag problems with concept types?

4. **Deployment Environment**
   - Server specs (PHP 7.1.9 hosting)?
   - MySQL database access credentials?
   - Domain/subdomain for widget?

### Medium Priority

5. **Character Art Assets**
   - Who will create the 12 spirit character illustrations?
   - Animation requirements (sprite sheets, SVG)?

6. **Audio Requirements**
   - Background music for each game?
   - Sound effects budget?
   - Voice acting for spirits?

7. **Localization**
   - Korean only, or English support?
   - Bilingual spirits?

8. **Teacher Dashboard**
   - Do teachers need an admin view?
   - What analytics are required?

### Low Priority

9. **Mobile Support Timeline**
   - When should responsive mobile version launch?

10. **Social Features**
    - Should students see friends' card collections?
    - Leaderboards or competitive elements?

---

## 11. Risks & Mitigation

### Risk 1: Technical Constraint (PHP 7.1.9)
**Impact:** High
**Mitigation:**
- Use well-supported libraries compatible with PHP 7.1
- Plan migration path to PHP 8+ in future
- Heavy lifting done in frontend (JavaScript)

### Risk 2: Moodle Integration Complexity
**Impact:** Medium
**Mitigation:**
- Start with manual launch option (fallback)
- Incremental integration (phase by phase)
- Test with Moodle sandbox first

### Risk 3: Student Engagement Lower Than Expected
**Impact:** High
**Mitigation:**
- Extensive playtesting with real students
- A/B test different emotional feedback styles
- Iterate quickly based on engagement data

### Risk 4: Browser Compatibility Issues
**Impact:** Medium
**Mitigation:**
- Polyfills for older browsers
- Progressive enhancement approach
- Clear browser requirements communicated to schools

### Risk 5: Character Design Not Resonating
**Impact:** Medium
**Mitigation:**
- User research with target age group
- Iterate designs based on student feedback
- Allow character customization (future)

---

## 12. Appendices

### Appendix A: Glossary

- **Concept Spirit (개념 정령)**: Personified character representing a math concept
- **Sensation Stage**: First learning stage focused on tactile/visual experience
- **Card Collection**: Gamification mechanic where students collect character cards
- **Virtual Smartphone Widget**: Fixed UI container in bottom-right of PC screen
- **5-Stage Loop**: Progression system (Sensation → Pattern → Situation → Application → Mastery)
- **LMS Sync**: Bidirectional data exchange between game system and Moodle

### Appendix B: API Specification

**Base URL:** `https://[domain]/api/v1/`

**Authentication:** Session-based (cookies)

**Endpoints:**

```
# Student Authentication
POST /auth/login
  Body: { student_id, password }
  Returns: { success, session_token, student_name }

# Game Launch
GET /games/{concept_name}/launch
  Params: student_id, stage (optional)
  Returns: { game_config, current_progress, session_id }

# Progress Save
POST /games/{concept_name}/progress
  Body: { session_id, stage, points_earned, completion_data }
  Returns: { success, total_points, card_unlocked }

# Card Collection
GET /cards/student/{student_id}
  Returns: { cards: [{ card_id, level, acquired_at, spirit_name }] }

# Moodle Integration
POST /moodle/trigger
  Body: { moodle_user_id, problem_type, problem_id }
  Returns: { widget_url, game_name }

POST /moodle/complete
  Body: { session_id, moodle_problem_id, score, completion_status }
  Returns: { success, synced_to_moodle }
```

### Appendix C: Game-Specific Technical Notes

**Fraction Game (Frani):**
- Canvas library: Fabric.js for line drawing
- Physics: Detect equal divisions using area calculation
- Feedback: Facial expression sprite sheet (9 emotions)

**Decimal Game (Coni):**
- Coin sprites: PNG assets (10, 50, 100, 500 won)
- Drag-and-drop: HTML5 Drag API or Interact.js
- Total calculation: Real-time JavaScript sum

**Ratio Game (Rio):**
- Color mixing: RGB interpolation algorithm
- Sliders: Custom CSS range inputs
- Target color: JSON config with RGB values

**Geometry Game (Dimo):**
- Grid system: CSS Grid or Canvas tile rendering
- Collision detection: AABB (Axis-Aligned Bounding Box)
- Furniture: SVG assets for scalability

**Rhythm Game (Roop):**
- Audio: Howler.js for timing accuracy
- Patterns: JSON sequence definitions
- Input timing: requestAnimationFrame timestamps

**Division Game (Scoop):**
- Object pooling: Reuse scoop sprites for performance
- Distribution algorithm: Simple modulo for remainder
- Box opening: Click event → spawn 10 scoops

**Time Game (Timmy):**
- Clock: SVG-based draggable hands
- Bus animation: CSS transform translate
- Time calculation: JavaScript Date API

**Unit Game (Packer):**
- Weight system: Constraint satisfaction problem
- Ruler: Custom canvas drawing with measurements
- Volume: Animated fill using CSS transitions

**Probability Game (Fork):**
- Tree visualization: D3.js or custom SVG generation
- Roulette: Canvas arc drawing with rotation animation
- Probability calculation: Combinatorics algorithms

**Graph Game (Weathering):**
- Charting: Chart.js for simplicity
- Input: Form with number inputs for data points
- Animation: Chart.js built-in animations

**Word Problem Game (Chatlin):**
- NLP: Simple regex-based sentence splitting
- Highlighting: Span tags with CSS classes
- Chat UI: Scrollable div with message bubbles

**Logic Game (Order):**
- Card sorting: Sortable.js for drag-and-drop ordering
- Validation: Compare student order to correct sequence
- Explanation: Textarea with character limit

---

## Document Control

- **Version**: 1.0.0
- **Author**: AI Agent (Claude) based on user specification
- **Created**: 2025-11-20
- **Status**: Draft for Review
- **Target Audience**: Development Team, Teachers, Product Stakeholders
- **Next Review**: After initial feedback

---

## Summary

This Math Concept Game System transforms elementary math education by:

1. **Personifying concepts** as collectible spirit characters
2. **Eliminating formula anxiety** through sensory-first learning (0-10% notation)
3. **Building emotional connection** through 5-stage growth loops
4. **Gamifying mastery** via card collection and character progression
5. **Integrating seamlessly** with Moodle LMS via virtual smartphone widget
6. **Targeting emotional transformation**: Hate → Curiosity → Love

**Core Innovation**: Math concepts are not abstract enemies—they are living friends that grow with the child.

**Technical Foundation**: PHP 7.1.9 + MySQL 5.7 + HTML5 Canvas + Moodle Integration

**Ultimate Goal**: Math anxiety prevention through emotional, sensory-based concept familiarity.
