# LMS Solution Comparison Frontend

React + TypeScript frontend for the LMS Solution Comparison System.

## Features

- User authentication (login/register)
- Problem browsing and solving
- Solution submission
- AI-powered solution comparison
- Visual diff viewer
- Role-based access (Student/Teacher)
- Teacher problem management

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   └── Layout.tsx   # Main layout with navigation
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ProblemList.tsx
│   │   ├── ProblemDetail.tsx
│   │   ├── ComparisonPage.tsx
│   │   ├── MySolutions.tsx
│   │   ├── TeacherProblems.tsx
│   │   └── CreateProblem.tsx
│   ├── services/        # API and state management
│   │   ├── api.ts       # API client
│   │   └── authStore.ts # Auth state (Zustand)
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── styles/          # Global styles
│   │   └── index.css    # Tailwind CSS
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Key Features

### For Students

1. **Browse Problems**: View all available problems with difficulty and type badges
2. **Solve Problems**: Submit solutions with optional explanations
3. **View Comparisons**: Get AI-powered feedback comparing your solution with the model solution
4. **Track Progress**: View all submitted solutions and their feedback

### For Teachers

1. **Create Problems**: Add new problems with descriptions and model solutions
2. **Manage Problems**: Edit and delete existing problems
3. **Set Difficulty**: Assign difficulty levels and problem types
4. **Provide Model Solutions**: Add reference solutions for AI comparison

### AI Comparison Features

- Similarity score (0-100%)
- Detailed feedback
- List of strengths
- List of improvements
- Visual side-by-side diff
- Approach, accuracy, and completeness analysis

## Technologies

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **Zustand**: State management
- **TanStack Query**: Data fetching
- **Axios**: HTTP client
- **Tailwind CSS**: Styling
- **React Markdown**: Markdown rendering
- **React Diff Viewer**: Side-by-side comparison

## API Integration

The frontend communicates with the FastAPI backend at `http://localhost:8000/api`.

Authentication uses JWT tokens stored in localStorage and automatically included in requests.

## Environment

The Vite dev server proxies `/api` requests to the backend at `http://localhost:8000`.

See `vite.config.ts` for proxy configuration.
