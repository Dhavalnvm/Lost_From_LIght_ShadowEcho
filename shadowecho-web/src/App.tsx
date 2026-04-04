import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import ChatbotFloating from './components/ui/ChatbotFloating';
import ChatPage from './pages/ChatPage';
import AnalyzeView from './views/AnalyzeView';
import AlertsView from './views/AlertsView';
import AnalyticsView from './views/AnalyticsView';
import DashboardView from './views/DashboardView';
import LineupView from './views/LineupView';
import MirrorView from './views/MirrorView';
import ReportView from './views/ReportView';

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 text-slate-900">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/alerts" element={<AlertsView />} />
              <Route path="/decode" element={<AnalyzeView />} />
              <Route path="/mirror" element={<MirrorView />} />
              <Route path="/impact" element={<AnalyticsView />} />
              <Route path="/lineup" element={<LineupView />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/report" element={<ReportView />} />
            </Routes>
          </div>
          <ChatbotFloating />
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
