# ShadowEcho — Frontend

React dashboard for the ShadowEcho threat intelligence platform. Provides a real-time analyst interface for monitoring alerts, decoding dark web language, profiling threat actors, estimating breach impact, and querying the intelligence database via a built-in chatbot.

---

## Table of contents

- [Pages](#pages)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Build for production](#build-for-production)
- [Project structure](#project-structure)
- [API integration](#api-integration)
- [Environment variables](#environment-variables)
- [Development notes](#development-notes)

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Live metrics, recent alerts, recent signals |
| `/alerts` | Alerts | Alert feed with severity filter and acknowledgment |
| `/decode` | Slang Decoder | Decode dark web coded language and slang |
| `/mirror` | Mirror | Org mention tracking and actor profile search |
| `/impact` | Leak Impact | Breach impact estimator with regulatory risk assessment |
| `/lineup` | Lineup | Cluster similar posts by threat actor behavior |
| `/chat` | Chat | RAG-grounded analyst chatbot with streaming support |

---

## Tech stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool and dev server |
| Tailwind CSS | 3 | Styling |
| React Router | 6 | Client-side routing |
| Recharts | 2 | Charts and data visualizations |
| Lucide React | — | Icons |

---

## Requirements

- Node.js 18+
- npm or yarn
- ShadowEcho backend running on port 8000

---

## Installation

**1. Navigate to the frontend directory**

```bash
cd shadowecho-frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure the backend URL**

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:8000
```

If the backend is exposed via ngrok or a remote server, replace the URL accordingly.

**4. Start the development server**

```bash
npm run dev
```

App available at `http://localhost:5173`

---

## Build for production

```bash
npm run build
```

Output goes to the `dist/` directory. Preview the production build:

```bash
npm run preview
```

---

## Project structure

```
shadowecho-frontend/
├── src/
│   ├── App.tsx                        Root component, router setup
│   ├── main.tsx                       React entry point
│   ├── index.css                      Global styles and Tailwind base
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx              Overview metrics, recent activity
│   │   ├── AlertsPage.tsx             Alert feed and distribution
│   │   ├── DecoderPage.tsx            Slang decoder with dictionary stats
│   │   ├── MirrorPage.tsx             Org profile and mention search
│   │   ├── ImpactPage.tsx             Leak impact estimator
│   │   ├── LineupPage.tsx             Threat actor clustering
│   │   └── ChatPage.tsx               Analyst chatbot
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Sidebar.tsx            Navigation sidebar
│   │   │   └── index.tsx              Shared UI primitives (Card, SectionHeader)
│   │   │
│   │   └── panels/
│   │       ├── AlertFeed.tsx          Recent alert list
│   │       ├── AlertDistribution.tsx  Alert severity chart
│   │       ├── MetricCards.tsx        Stat cards for dashboard overview
│   │       ├── RecentSignals.tsx      Recent signal posts list
│   │       ├── TrendCharts.tsx        Time-series trend charts
│   │       ├── DecoderPanel.tsx       Slang decode input and output
│   │       ├── MirrorPanel.tsx        Org mention search panel
│   │       ├── ImpactPanel.tsx        Impact estimation form and results
│   │       ├── LineupPanel.tsx        Post clustering results
│   │       ├── ChatPanel.tsx          Chat interface with streaming
│   │       └── FeedbackPanel.tsx      Analyst feedback submission
│   │
│   ├── services/
│   │   └── api.ts                     All API fetch functions, typed responses
│   │
│   ├── hooks/
│   │   └── useMonitoringData.ts       Polling hook for live dashboard data
│   │
│   └── types/
│       └── api.ts                     TypeScript interfaces for all API responses
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## API integration

All backend calls go through `src/services/api.ts`. The base URL is read from the `VITE_API_URL` environment variable and defaults to `http://localhost:8000`.

Each function is fully typed against the backend response schemas:

```typescript
import { fetchDashboard, fetchAlerts, submitFeedback } from './services/api';

// Fetch dashboard stats
const dashboard = await fetchDashboard();

// Fetch critical alerts
const alerts = await fetchAlerts(20, 'critical');

// Submit analyst feedback
await submitFeedback(postId, 'real', 'Confirmed credential dump');
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## Development notes

**ngrok compatibility**
All API requests include the `ngrok-skip-browser-warning` header so the app works when the backend is exposed via an ngrok tunnel during development or demos.

**Streaming chat**
The chat page uses SSE (`/api/chat/stream`) to stream tokens from the LLM as they arrive. The `ChatPanel` component handles progressive rendering of the response.

**Live polling**
Dashboard data auto-refreshes using the `useMonitoringData` hook. The polling interval is configurable inside the hook file.

**Connecting to a remote backend**
Update `.env` with the remote URL and restart the dev server:

```env
VITE_API_URL=https://your-ngrok-url.ngrok-free.app
```

CORS is configured on the backend to allow all origins by default. No additional frontend configuration is required.
