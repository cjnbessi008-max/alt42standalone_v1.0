# 🎨 Vector Blend LMS

An interactive educational web application for teaching vector mathematics through color blending. Students manipulate 2D vectors and see the results visualized as blended RGB colors.

## 📱 Features

- **Interactive Vector Manipulation**: Drag and adjust vectors on a canvas
- **Real-time Color Blending**: See how vector magnitudes affect color mixing
- **Educational Problems**: Progressive problem sets from beginner to advanced
- **Mobile Frame Preview**: Desktop view includes a virtual smartphone frame (bottom-right)
- **LMS Integration**: Ready for integration with Learning Management Systems via LTI
- **Responsive Design**: Works on desktop and mobile devices
- **Korean & English Support**: Bilingual interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Navigate to project directory
cd vector-blend-lms

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

## 🎮 How to Use

### For Students

1. **Read the Problem**: Each problem explains what you need to achieve
2. **Manipulate Vectors**: Drag the colored dots (vector endpoints) on the canvas
3. **Watch the Blend**: See how the result color changes based on vector magnitudes
4. **Check Your Answer**: Click "Check Answer" to validate your solution
5. **Use Hints**: If stuck, click "Show Hint" for guidance

### For Teachers/Administrators

#### Adding New Problems

Problems are defined in JSON files in `/public/problems/`. Example:

```json
{
  "id": "my-problem-set",
  "title": "My Custom Problem Set",
  "problems": [
    {
      "id": "prob-001",
      "type": "color-matching",
      "difficulty": "beginner",
      "title": "Mix Red and Blue",
      "description": "Create purple by mixing vectors",
      "instructions": "Adjust the vectors to create the target color",
      "initialVectors": [
        {
          "x": 3,
          "y": 0,
          "color": { "r": 255, "g": 0, "b": 0 },
          "label": "Red Vector",
          "id": "v1"
        }
      ],
      "targetColor": { "r": 180, "g": 0, "b": 180 },
      "colorTolerance": 40,
      "hint": "Red + Blue = Purple"
    }
  ]
}
```

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 (no framework dependencies)
- **State Management**: React Hooks (useState, useEffect)

### Project Structure

```
vector-blend-lms/
├── src/
│   ├── components/
│   │   ├── MobileFrame/         # Mobile phone frame UI
│   │   ├── VectorCanvas/        # Interactive vector canvas
│   │   ├── ColorDisplay/        # Color result display
│   │   └── ProblemDisplay/      # Problem information UI
│   ├── engine/
│   │   ├── vector.ts            # Vector mathematics
│   │   └── color.ts             # Color blending algorithms
│   ├── services/
│   │   ├── lmsApi.ts            # LMS integration API
│   │   └── problemValidator.ts  # Answer validation
│   ├── types/                   # TypeScript type definitions
│   └── App.tsx                  # Main application
└── public/
    └── problems/                # Problem set JSON files
```

## 🎓 Educational Concepts

### Vector Mathematics

- **Vector Addition**: Visualize how adding vectors creates a resultant vector
- **Magnitude & Direction**: Understand vector properties through manipulation
- **Component Form**: Work with x and y components of 2D vectors

### Color Theory

- **RGB Color Model**: Learn how Red, Green, Blue combine
- **Weighted Blending**: Vector magnitudes determine color mixing ratios
- **Additive Color Mixing**: See primary colors blend into secondary colors

## 🔌 LMS Integration

The app supports LTI (Learning Tools Interoperability) integration with LMS systems like:

- Moodle 3.7+
- Canvas
- Blackboard
- Custom LMS platforms

### Integration Steps

1. **Configure Environment**:

```env
VITE_MOCK_MODE=false
VITE_LMS_API_ENDPOINT=https://your-lms.com/api
```

2. **LTI Launch Parameters**:

The app reads standard LTI parameters:
- `user_id`: Student identifier
- `context_id`: Course identifier
- `resource_link_id`: Assignment identifier
- `lis_outcome_service_url`: Grade passback URL

3. **Grade Submission**:

Grades are automatically submitted back to the LMS when students complete problems.

## 🧪 Development Mode

By default, the app runs in **mock mode** for easy development:

- No real LMS connection required
- Problems loaded from local JSON files
- Progress saved to localStorage
- Mock student context provided

## 📊 Problem Types

1. **vector-addition**: Practice adding vectors together
2. **color-matching**: Create a target color by blending
3. **target-vector**: Reach a specific vector position
4. **free-exploration**: Open-ended experimentation

## 🎨 Color Blending Algorithm

The app uses **magnitude-weighted RGB blending**:

```typescript
// Each vector contributes based on its magnitude
resultColor = (v1.magnitude * v1.color + v2.magnitude * v2.color + ...)
              / totalMagnitude
```

This creates intuitive color mixing where:
- Longer vectors have more influence on the final color
- Zero-length vectors don't contribute
- Equal magnitudes produce average colors

## 🛠️ Customization

### Adjusting Canvas

```typescript
<VectorCanvas
  width={400}           // Canvas width
  height={400}          // Canvas height
  scale={40}            // Pixels per unit
  gridSize={1}          // Grid spacing
  readonly={false}      // Allow/prevent interaction
/>
```

### Mobile Frame Position

```typescript
<MobileFrame
  position="bottom-right"  // or "bottom-left", "center"
  showFrame={true}         // Show/hide phone frame
>
```

## 🐛 Troubleshooting

### Vectors Not Dragging

- Check if `readonly` prop is set to `false` on VectorCanvas
- Ensure mouse events are not blocked by CSS

### Problems Not Loading

- Verify JSON file exists in `/public/problems/`
- Check browser console for fetch errors
- Validate JSON syntax

### Mobile Frame Not Showing

- Check viewport width (frame only shows on desktop > 768px)
- Try different `position` props

## 📝 License

MIT License - Feel free to use for educational purposes

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Built with ❤️ for math education**

벡터 학습을 재미있게! 🎓✨
