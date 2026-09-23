import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import accessEn from "./locales/en/access.json";
import auditEn from "./locales/en/audit.json";
import authEn from "./locales/en/auth.json";
import cartasEn from "./locales/en/cartas.json";
import actasEn from "./locales/en/actas.json";
import commonEn from "./locales/en/common.json";
import departmentsEn from "./locales/en/departments.json";
import subareasEn from "./locales/en/subareas.json";
import deviceTypesEn from "./locales/en/device-types.json";
import deviceEn from "./locales/en/device.json";
import employeesEn from "./locales/en/employees.json";
import homeEn from "./locales/en/home.json";
import inventoryEn from "./locales/en/inventory.json";
import inventarioEn from "./locales/en/inventario.json";
import notificationsEn from "./locales/en/notifications.json";
import reportsEn from "./locales/en/reports.json";
import salidasEn from "./locales/en/salidas.json";
import ticketsEn from "./locales/en/tickets.json";
import usersEn from "./locales/en/users.json";
import catalogEn from "./locales/en/catalog.json";

import accessEs from "./locales/es/access.json";
import auditEs from "./locales/es/audit.json";
import authEs from "./locales/es/auth.json";
import cartasEs from "./locales/es/cartas.json";
import actasEs from "./locales/es/actas.json";
import commonEs from "./locales/es/common.json";
import departmentsEs from "./locales/es/departments.json";
import subareasEs from "./locales/es/subareas.json";
import deviceTypesEs from "./locales/es/device-types.json";
import deviceEs from "./locales/es/device.json";
import employeesEs from "./locales/es/employees.json";
import homeEs from "./locales/es/home.json";
import inventoryEs from "./locales/es/inventory.json";
import inventarioEs from "./locales/es/inventario.json";
import notificationsEs from "./locales/es/notifications.json";
import reportsEs from "./locales/es/reports.json";
import salidasEs from "./locales/es/salidas.json";
import ticketsEs from "./locales/es/tickets.json";
import usersEs from "./locales/es/users.json";
import catalogEs from "./locales/es/catalog.json";

export const defaultNS = "common" as const;

export const NS_LIST = [
  "common",
  "device",
  "device-types",
  "auth",
  "home",
  "cartas",
  "tickets",
  "users",
  "employees",
  "departments",
  "subareas",
  "inventory",
  "inventario",
  "reports",
  "salidas",
  "notifications",
  "audit",
  "catalog",
  "actas",
  "access",
] as const;

export const resources = {
  en: {
    common: commonEn,
    device: deviceEn,
    "device-types": deviceTypesEn,
    auth: authEn,
    home: homeEn,
    cartas: cartasEn,
    actas: actasEn,
    tickets: ticketsEn,
    users: usersEn,
    employees: employeesEn,
    departments: departmentsEn,
    subareas: subareasEn,
    inventory: inventoryEn,
    inventario: inventarioEn,
    reports: reportsEn,
    salidas: salidasEn,
    notifications: notificationsEn,
    audit: auditEn,
    catalog: catalogEn,
    access: accessEn,
  },
  es: {
    common: commonEs,
    device: deviceEs,
    "device-types": deviceTypesEs,
    auth: authEs,
    home: homeEs,
    cartas: cartasEs,
    actas: actasEs,
    tickets: ticketsEs,
    users: usersEs,
    employees: employeesEs,
    departments: departmentsEs,
    subareas: subareasEs,
    inventory: inventoryEs,
    inventario: inventarioEs,
    reports: reportsEs,
    salidas: salidasEs,
    notifications: notificationsEs,
    audit: auditEs,
    catalog: catalogEs,
    access: accessEs,
  },
} as const;

const STORAGE_KEY = "ptnv-language";

const storedLanguage =
  typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;

i18n.use(initReactI18next).init({
  resources,
  lng: storedLanguage ?? "es",
  fallbackLng: "es",
  defaultNS,
  ns: NS_LIST,
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, lng);
  }
});

export default i18n;