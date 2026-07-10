import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import App from "./app/App.tsx";
import "./styles/index.css";



// PWA Service Worker Register
registerSW({
  immediate: true,
});

createRoot(document.getElementById("root")!).render(
  <App />
);