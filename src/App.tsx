import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@modules/auth/pages/LoginPage";
import PrivateRoutes from "@modules/auth/components/PrivateRoutes";
import HomePage from "@modules/home/pages/HomePage";
import CartasListPage from "@modules/cartas/pages/CartasListPage";
import CartaEditorPage from "@modules/cartas/pages/CartaEditorPage";
import DevolverCartaPage from "@modules/cartas/pages/DevolverCartaPage";
import GenerarCartasPage from "@modules/cartas/pages/GenerarCartasPage";
import DevicesListPage from "@modules/devices/pages/DevicesListPage";
import DeviceFormPage from "@modules/devices/pages/DeviceFormPage";
import DeviceTypesListPage from "@modules/device-types/pages/DeviceTypesListPage";
import DeviceTypeFormPage from "@modules/device-types/pages/DeviceTypeFormPage";
import DepartmentsPage from "@modules/departments/pages/DepartmentsPage";
import DepartmentDetailPage from "@modules/departments/pages/DepartmentDetailPage";
import EmployeesListPage from "@modules/employees/pages/EmployeesListPage";
import ReportesPage from "@modules/reports/pages/ReportesPage";
import UsersListPage from "@modules/users/pages/UsersListPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoutes />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/cartas" element={<CartasListPage />} />
        <Route path="/cartas/nueva" element={<CartaEditorPage />} />
        <Route path="/cartas/generar" element={<GenerarCartasPage />} />
        <Route path="/cartas/:id/devolver" element={<DevolverCartaPage />} />

        <Route path="/dispositivos" element={<DevicesListPage />} />
        <Route path="/dispositivos/nuevo" element={<DeviceFormPage />} />
        <Route path="/dispositivos/:id/editar" element={<DeviceFormPage />} />
        <Route path="/dispositivos/tipos" element={<DeviceTypesListPage />} />
        <Route path="/dispositivos/tipos/nuevo" element={<DeviceTypeFormPage />} />
        <Route path="/dispositivos/tipos/:id/editar" element={<DeviceTypeFormPage />} />

        <Route path="/departamentos" element={<DepartmentsPage />} />
        <Route path="/departamentos/:id" element={<DepartmentDetailPage />} />
        <Route path="/empleados" element={<EmployeesListPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/usuarios" element={<UsersListPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}