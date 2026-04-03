# ShadowEcho — Frontend

React dashboard for the ShadowEcho threat intelligence platform. Provides a real-time analyst interface for monitoring alerts, decoding dark web language, profiling threat actors, estimating breach impact, and querying the intelligence database via a built-in chatbot.

---

## Pages

| Route | Page | Description |
|---|---|---|
| / | Dashboard | Live metrics, recent alerts, recent signals |
| /alerts | Alerts | Alert feed with severity filter and acknowledgment |
| /decode | Slang Decoder | Decode dark web coded language and slang |
| /mirror | Mirror | Org mention tracking and actor profile search |
| /impact | Leak Impact | Breach impact estimator with regulatory risk assessment |
| /lineup | Lineup | Cluster similar posts by threat actor behavior |
| /chat | Chat | RAG-grounded analyst chatbot |

---

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Recharts (charts and graphs)
- Lucide React (icons)

---

## Requirements

- Node.js 18+
- npm or yarn
- ShadowEcho backend running on port 8000

---

## Installation

**1. Navigate to the frontend directory**

```
cd shadowecho-frontend
```

**2. Install dependencies**

```
npm install
```

**3. Configure the backend URL**

Create a `.env` file in the frontend root:

```
VITE_API_URL=http://localhost:8000
```

If the backend is exposed via ngrok or a remote server, replace the URL accordingly.

**4. Start the development server**

```
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Build for Production

```
npm run build
```

Output goes to the `dist/` directory. Serve with any static file server:

```
npm run preview
```

---

## Project Structure

```
shadowecho-frontend/
  src/
    App.tsx                        Root component, router setup
    main.tsx                       React entry point
    index.css                      Global styles and Tailwind base

    pages/
      Dashboard.tsx                Overview metrics, recent activity
      AlertsPage.tsx               Alert feed and distribution
      DecoderPage.tsx              Slang decoder with dictionary stats
      MirrorPage.tsx               Org profile and mention search
      ImpactPage.tsx               Leak impact estimator
      LineupPage.tsx               Threat actor clustering
      ChatPage.tsx                 Analyst chatbot

    components/
      common/
        Sidebar.tsx                Navigation sidebar
        index.tsx                  Shared UI primitives (Card, SectionHeader, etc.)

      panels/
        AlertFeed.tsx              Recent alert list component
        AlertDistribution.tsx      Alert severity chart
        MetricCards.tsx            Stat cards for dashboard overview
        RecentSignals.tsx          Recent signal posts list
        TrendCharts.tsx            Time-series trend charts
        DecoderPanel.tsx           Slang decode input and output
        MirrorPanel.tsx            Org mention search panel
        ImpactPanel.tsx            Impact estimation form and results
        LineupPanel.tsx            Post clustering results
        ChatPanel.tsx              Chat interface with streaming support
        FeedbackPanel.tsx          Analyst feedback submission

    services/
      api.ts                       All API fetch functions, typed responses

    hooks/
      useMonitoringData.ts         Polling hook for live dashboard data

    types/
      api.ts                       TypeScript interfaces for all API responses
```

---

## API Integration

All backend calls go through `src/services/api.ts`. The base URL is read from the `VITE_API_URL` environment variable and defaults to `http://localhost:8000`.

Each function is fully typed against the backend response schemas. Example:

```typescript
import { fetchDashboard, fetchAlerts, submitFeedback } from './services/api';

const dashboard = await fetchDashboard();
const alerts = await fetchAlerts(20, 'critical');
await submitFeedback(postId, 'real', 'Confirmed credential dump');
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| VITE_API_URL | http://localhost:8000 | Backend API base URL |

---

## Development Notes

The frontend includes an ngrok compatibility header (`ngrok-skip-browser-warning`) in all API requests so the app works when the backend is exposed via ngrok tunnel during development or demos.

The chat page supports both standard and streaming (SSE) responses. Streaming is used by default for the chat interface to show tokens as they arrive from the LLM.

Dashboard data polls automatically using the `useMonitoringData` hook. Polling interval is configurable inside the hook.

---

## Connecting to a Remote Backend

If the backend is running on a different machine or exposed via ngrok:

**Update `.env`**

```
VITE_API_URL=https://your-ngrok-url.ngrok-free.app
```

**Restart the dev server after changing `.env`**

```
npm run dev
```

CORS is configured on the backend to allow all origins by default. No additional configuration is needed on the frontend side.
