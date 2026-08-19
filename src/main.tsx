import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import "@axzydev/axzy_ui_system/dist/index.css";
import { store } from "@core/store/store";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

if (!localStorage.getItem("it-theme-dark-mode")) {
  localStorage.setItem("it-theme-dark-mode", "light");
}

const customTheme = {
  primary: "#10b981",
  secondary: "#54634d",
  danger: "#BA1A1A",
  info: "#512bbb",
  success: "#4ADE80",
  layout: {
    sidebarBg: "#ffffff",
    sidebarText: "#54634d",
    navbarBg: "#ffffff",
    navbarText: "#1B1B1F",
  },
  table: {
    headerBg: "#ffffff",
    headerText: "#1B1B1F",
    rowBg: "#ffffff",
    rowText: "#1B1B1F",
  },
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ITThemeProvider theme={customTheme} showFab={false}>
        <HashRouter>
          <App />
        </HashRouter>
      </ITThemeProvider>
    </Provider>
  </React.StrictMode>
);