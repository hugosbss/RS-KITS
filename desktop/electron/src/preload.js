"use strict";
/* Preload do RS KITS Desktop — ponte segura entre o renderer (Next.js) e o
   processo principal (janela da segunda tela, versões, modo desktop). */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rskits", {
  /** true quando rodando dentro do executável desktop */
  isDesktop: true,
  appVersion: process.env.npm_package_version || "0.0.0",
  backendPort: () => ipcRenderer.invoke("rskits:info").then((info) => info.backendPort),
  openSecondScreen: () => ipcRenderer.send("open-second-screen"),
  onSecondScreenOpened: (cb) => {
    const listener = () => cb();
    ipcRenderer.on("second-screen-opened", listener);
    return () => ipcRenderer.removeListener("second-screen-opened", listener);
  },
  onOpenDelivery: (cb) => {
    const listener = (_e, athleteId) => cb(athleteId);
    ipcRenderer.on("open-delivery", listener);
    return () => ipcRenderer.removeListener("open-delivery", listener);
  },
});