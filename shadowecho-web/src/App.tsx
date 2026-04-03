// src/App.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Fixed:
//   - All import paths now match the actual src/ folder structure.
//   - Sidebar is in components/common/Sidebar, pages are in pages/.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/layout/Topbar';
import DashboardView from './views/DashboardView';
import AlertsView from './views/AlertsView';
import AnalyzeView from './views/AnalyzeView';
import MirrorView from './views/MirrorView';
import AnalyticsView from './views/AnalyticsView';
import LineupView from './views/LineupView';
import ChatPage from './pages/ChatPage';
import ReportView from './views/ReportView';
import ChatbotFloating from './components/ui/ChatbotFloating';

const App: React.FC = () => (
  <BrowserRouter>
    <div className="flex h-screen bg-bg-base text-text-primary grid-bg scan">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <div className="h-[calc(100vh-56px)] overflow-auto">
          <div className="max-w-7xl mx-auto px-5 py-5">
          <Routes>
            <Route path="/"        element={<DashboardView />} />
            <Route path="/alerts"  element={<AlertsView />} />
            <Route path="/decode"  element={<AnalyzeView />} />
            <Route path="/mirror"  element={<MirrorView />} />
            <Route path="/impact"  element={<AnalyticsView />} />
            <Route path="/lineup"  element={<LineupView />} />
            <Route path="/chat"    element={<ChatPage />} />
            <Route path="/report"  element={<ReportView />} />
          </Routes>
          </div>
        </div>
        <ChatbotFloating />
      </main>
    </div>
  </BrowserRouter>
);

export default App;