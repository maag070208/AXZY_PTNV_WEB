import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@modules/auth/pages/LoginPage";
import PrivateRoutes from "@modules/auth/components/PrivateRoutes";
import HomePage from "@modules/home/pages/HomePage";
import CartasListPage from "@modules/cartas/pages/CartasListPage";
import CartaEditorPage from "@modules/cartas/pages/CartaEditorPage";
import CartaDetailPage from "@modules/cartas/pages/CartaDetailPage";
import DevolverCartaPage from "@modules/cartas/pages/DevolverCartaPage";
import InventoryIndexPage from "@modules/inventory/pages/InventoryIndexPage";
import InventoryMovementsPage from "@modules/inventory/pages/InventoryMovementsPage";
import NewInventoryMovementPage from "@modules/inventory/pages/NewInventoryMovementPage";
import LocationsPage from "@modules/inventory/pages/LocationsPage";
import GenerarCartasPage from "@modules/cartas/pages/GenerarCartasPage";
import DevicesListPage from "@modules/devices/pages/DevicesListPage";
import DeviceFormPage from "@modules/devices/pages/DeviceFormPage";
import DeviceDetailPage from "@modules/devices/pages/DeviceDetailPage";
import DeviceTypesListPage from "@modules/device-types/pages/DeviceTypesListPage";
import DeviceTypeFormPage from "@modules/device-types/pages/DeviceTypeFormPage";
import DepartmentsPage from "@modules/departments/pages/DepartmentsPage";
import DepartmentDetailPage from "@modules/departments/pages/DepartmentDetailPage";
import EmployeesListPage from "@modules/employees/pages/EmployeesListPage";
import EmployeeFormPage from "@modules/employees/pages/EmployeeFormPage";
import ReportesPage from "@modules/reports/pages/ReportesPage";
import UsersListPage from "@modules/users/pages/UsersListPage";
import UserFormPage from "@modules/users/pages/UserFormPage";
import UserHistoryPage from "@modules/users/pages/UserHistoryPage";
import TicketsListPage from "@modules/tickets/pages/TicketsListPage";
import NewTicketPage from "@modules/tickets/pages/NewTicketPage";
import TicketDetailPage from "@modules/tickets/pages/TicketDetailPage";
import NotificationsPage from "@modules/notifications/pages/NotificationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoutes />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/cartas" element={<CartasListPage />} />
        <Route path="/cartas/nueva" element={<CartaEditorPage />} />
        <Route path="/cartas/generar" element={<GenerarCartasPage />} />
        <Route path="/cartas/:id" element={<CartaDetailPage />} />
        <Route path="/cartas/:id/devolver" element={<DevolverCartaPage />} />

        <Route path="/tickets" element={<TicketsListPage />} />
        <Route path="/tickets/nuevo" element={<NewTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />

        <Route path="/dispositivos" element={<DevicesListPage />} />
        <Route path="/dispositivos/nuevo" element={<DeviceFormPage />} />
        <Route path="/dispositivos/:id" element={<DeviceDetailPage />} />
        <Route path="/dispositivos/:id/editar" element={<DeviceFormPage />} />
        <Route path="/dispositivos/tipos" element={<DeviceTypesListPage />} />
        <Route path="/dispositivos/tipos/nuevo" element={<DeviceTypeFormPage />} />
        <Route path="/dispositivos/tipos/:id/editar" element={<DeviceTypeFormPage />} />

        <Route path="/inventario" element={<InventoryIndexPage />} />
        <Route path="/inventario/movimientos" element={<InventoryMovementsPage />} />
        <Route path="/inventario/movimientos/nuevo" element={<NewInventoryMovementPage />} />
        <Route path="/inventario/ubicaciones" element={<LocationsPage />} />

        <Route path="/departamentos" element={<DepartmentsPage />} />
        <Route path="/departamentos/:id" element={<DepartmentDetailPage />} />
        <Route path="/empleados" element={<EmployeesListPage />} />
        <Route path="/empleados/:id/editar" element={<EmployeeFormPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/usuarios" element={<UsersListPage />} />
        <Route path="/usuarios/nuevo" element={<UserFormPage />} />
        <Route path="/usuarios/:id/editar" element={<UserFormPage />} />
        <Route path="/usuarios/:id/historial" element={<UserHistoryPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}