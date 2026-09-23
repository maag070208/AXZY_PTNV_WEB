import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import "@axzydev/axzy_ui_system/dist/index.css";
import "@shared/i18n/config";
import { store } from "@app/store";
import ToastProvider from "@app/toast/ToastProvider";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "@app/index.css";

if (!localStorage.getItem("it-theme-dark-mode")) {
  localStorage.setItem("it-theme-dark-mode", "light");
}

const customTheme = {
  primary: "#0D5777",    // Azul oscuro principal del logo (texto y contorno superior)
  secondary: "#1A7499",  // Azul medio del logo (agua)
  danger: "#BA1A1A",     // Se mantiene el color de peligro original
  info: "#512bbb",       // Se mantiene el color de información original
  success: "#4ADE80",    // Se mantiene el color de éxito original
  layout: {
    sidebarBg: "#ffffff",  // Fondo blanco para la barra lateral
    sidebarText: "#54634d", // Texto oscuro para la barra lateral (mantenido)
    navbarBg: "#0D5777",   // Azul oscuro del logo como fondo de la barra de navegación
    navbarText: "#ffffff", // Texto blanco sobre fondo azul oscuro
  },
  table: {
    headerBg: "#F0F4F7",   // Tono muy claro derivado del azul claro para cabeceras
    headerText: "#0D5777", // Texto de cabecera en el azul oscuro principal
    rowBg: "#ffffff",     // Fondo de fila blanco
    rowText: "#1B1B1F",    // Texto de fila oscuro (mantenido)
  },
};
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ITThemeProvider theme={customTheme} showFab={false} density={1}>
        <ToastProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ToastProvider>
      </ITThemeProvider>
    </Provider>
  </React.StrictMode>
);