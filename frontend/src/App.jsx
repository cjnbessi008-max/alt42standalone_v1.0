import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import DailyHighlightsPage from './pages/DailyHighlightsPage'
import ModulesPage from './pages/ModulesPage'
import ModuleDetailPage from './pages/ModuleDetailPage'
import HighlightDetailPage from './pages/HighlightDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="daily" element={<DailyHighlightsPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="modules/:moduleId" element={<ModuleDetailPage />} />
        <Route path="highlights/:highlightId" element={<HighlightDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App
