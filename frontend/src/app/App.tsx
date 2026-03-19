import { Routes, Route } from 'react-router-dom';
import ProjectListPage from '../pages/ProjectListPage';
import ProjectDashboardPage from '../pages/ProjectDashboardPage';
import ProjectComparePage from '../pages/ProjectComparePage';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Routes>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/project/:projectId" element={<ProjectDashboardPage />} />
        <Route path="/compare" element={<ProjectComparePage />} />
      </Routes>
    </div>
  );
}
