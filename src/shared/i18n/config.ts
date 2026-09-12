import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import auditEn from "./locales/en/audit.json";
import authEn from "./locales/en/auth.json";
import cartasEn from "./locales/en/cartas.json";
import commonEn from "./locales/en/common.json";
import departmentsEn from "./locales/en/departments.json";
import deviceTypesEn from "./locales/en/device-types.json";
import deviceEn from "./locales/en/device.json";
import employeesEn from "./locales/en/employees.json";
import homeEn from "./locales/en/home.json";
import inventoryEn from "./locales/en/inventory.json";
import locationsEn from "./locales/en/locations.json";
import notificationsEn from "./locales/en/notifications.json";
import reportsEn from "./locales/en/reports.json";
import salidasEn from "./locales/en/salidas.json";
import ticketsEn from "./locales/en/tickets.json";
import usersEn from "./locales/en/users.json";

import auditEs from "./locales/es/audit.json";
import authEs from "./locales/es/auth.json";
import cartasEs from "./locales/es/cartas.json";
import commonEs from "./locales/es/common.json";
import departmentsEs from "./locales/es/departments.json";
import deviceTypesEs from "./locales/es/device-types.json";
import deviceEs from "./locales/es/device.json";
import employeesEs from "./locales/es/employees.json";
import homeEs from "./locales/es/home.json";
import inventoryEs from "./locales/es/inventory.json";
import locationsEs from "./locales/es/locations.json";
import notificationsEs from "./locales/es/notifications.json";
import reportsEs from "./locales/es/reports.json";
import salidasEs from "./locales/es/salidas.json";
import ticketsEs from "./locales/es/tickets.json";
import usersEs from "./locales/es/users.json";

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
  "locations",
  "inventory",
  "reports",
  "salidas",
  "notifications",
  "audit",
] as const;

export const resources = {
  en: {
    common: commonEn,
    device: deviceEn,
    "device-types": deviceTypesEn,
    auth: authEn,
    home: homeEn,
    cartas: cartasEn,
    tickets: ticketsEn,
    users: usersEn,
    employees: employeesEn,
    departments: departmentsEn,
    locations: locationsEn,
    inventory: inventoryEn,
    reports: reportsEn,
    salidas: salidasEn,
    notifications: notificationsEn,
    audit: auditEn,
  },
  es: {
    common: commonEs,
    device: deviceEs,
    "device-types": deviceTypesEs,
    auth: authEs,
    home: homeEs,
    cartas: cartasEs,
    tickets: ticketsEs,
    users: usersEs,
    employees: employeesEs,
    departments: departmentsEs,
    locations: locationsEs,
    inventory: inventoryEs,
    reports: reportsEs,
    salidas: salidasEs,
    notifications: notificationsEs,
    audit: auditEs,
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