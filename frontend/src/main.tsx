import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initPerformanceMonitoring } from "./lib/performance";
import { registerServiceWorker } from "./lib/service-worker";

// Initialize performance monitoring
if (process.env.NODE_ENV === "development") {
  initPerformanceMonitoring();
}

// Register service worker for caching
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
