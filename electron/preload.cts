/**
 * Puente mínimo entre el ERP (renderer, sin Node) y el proceso principal,
 * expuesto como `window.desktop` (tipado en `web/src/shared/lib/desktop.ts`).
 * Corre con `sandbox: true`: no puede importar archivos locales, por eso los
 * canales van como literales (los mismos que en `main.cts`).
 */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

interface DesktopNotification {
  id?: string;
  title: string;
  body?: string;
  route?: string;
}

type NotificationClick = Pick<DesktopNotification, "id" | "route">;

contextBridge.exposeInMainWorld("desktop", {
  notify: (notification: DesktopNotification) => ipcRenderer.send("desktop:notify", notification),
  onNotificationClick: (callback: (click: NotificationClick) => void) => {
    const listener = (_event: IpcRendererEvent, click: NotificationClick) => callback(click);
    ipcRenderer.on("desktop:notification-click", listener);
    return () => {
      ipcRenderer.removeListener("desktop:notification-click", listener);
    };
  },
});
