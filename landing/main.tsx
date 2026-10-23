import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LandingPage from "../src/pages/landing/LandingPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LandingPage />
  </StrictMode>,
);
