import React from 'react';
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

const App: React.FC = () => (
  <BrowserRouter>
    <div className="flex h-screen grid-bg scan" style={{ backgroundColor: '#071018', color: '#edf5f1' }}>
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-[1520px] px-5 py-5 xl:px-6">
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
        </div>
        <ChatbotFloating />
      </main>
    </div>
  </BrowserRouter>
);

export default App;
