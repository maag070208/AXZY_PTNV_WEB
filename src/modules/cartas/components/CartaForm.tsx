import { ITBadget, ITFlex, ITGrid, ITInput, ITSearchSelect, ITSelect, ITStack, ITText, ITDivider } from "@axzydev/axzy_ui_system";
import { FaNetworkWired } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@core/store/store";
import {
  setDraftField,
  setItemField,
} from "@core/store/cartas/cartas.slice";
import { usersApi, type User, type UserRole } from "@core/api/auth.api";
import { devicesApi, deviceTypesApi, type Device, type DeviceType } from "@core/api/devices.api";
import type { CartaFormErrors } from "../utils/validation";
import { isITDeviceCode } from "@core/utils/itDevice";

interface Props {
  errors?: CartaFormErrors;
}

export default function CartaForm({ errors }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.cartas.draft);
  const item = draft.items[0];
  const [empleados, setEmpleados] = useState<User[]>([]);
  const [jefes, setJefes] = useState<User[]>([]);
  const [tipos, setTipos] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingConsecutivo, setLoadingConsecutivo] = useState(false);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    usersApi.empleados().then(setEmpleados).catch(() => setEmpleados([]));
    usersApi
      .empleadosPorRoles(["ADMIN", "GERENTE", "JEFE_DE_AREA"] as UserRole[])
      .then(setJefes)
      .catch(() => setJefes([]));
    deviceTypesApi.list().then(setTipos).catch(() => setTipos([]));
  }, []);

  useEffect(() => {
    devicesApi
      .list({ estado: "DISPONIBLE", typeId: draft.deviceTypeId || undefined })
      .then((res) => setDevices(res.data))
      .catch(() => setDevices([]));
    setSelectedDeviceId("");
    if (item) {
      // Al cambiar el tipo, se descarta el device anterior y los campos derivados
      // del item para que el PDF preview no muestre datos stale.
      dispatch(setItemField({ id: item.id, field: "deviceId", value: "" }));
      dispatch(setItemField({ id: item.id, field: "device", value: null as any }));
      dispatch(setItemField({ id: item.id, field: "controlActivos", value: "" }));
      dispatch(setItemField({ id: item.id, field: "descripcion", value: "" }));
      dispatch(setItemField({ id: item.id, field: "marca", value: "" }));
      dispatch(setItemField({ id: item.id, field: "modelo", value: "" }));
      dispatch(setItemField({ id: item.id, field: "numeroSerie", value: "" }));
      dispatch(setItemField({ id: item.id, field: "nombreEquipo", value: "" }));
    }
  }, [draft.deviceTypeId]);

  const handleField = (field: keyof typeof draft, value: string | number) => {
    dispatch(setDraftField({ field, value }));
  };

  const handleItem = (field: keyof typeof item, value: string) => {
    if (!item) return;
    dispatch(setItemField({ id: item.id, field, value }));
  };

  const handleTypeChange = async (typeId: string) => {
    dispatch(setDraftField({ field: "deviceTypeId", value: typeId }));
    if (!typeId) return;
    setLoadingConsecutivo(true);
    try {
      const res = await deviceTypesApi.peekCarta(typeId);
      dispatch(setDraftField({ field: "consecutivo", value: res.siguiente }));
    } catch {
      /* keep current consecutivo */
    } finally {
      setLoadingConsecutivo(false);
    }
  };

  const handleEmpleadoSelect = (value: string | number) => {
    const u = empleados.find((e) => e.id === String(value));
    if (!u) {
      setSelectedEmpleadoId("");
      return;
    }
    setSelectedEmpleadoId(String(value));

    // Autollenado de la carta a partir del empleado seleccionado
    dispatch(setDraftField({ field: "numeroEmpleado", value: u.numeroEmpleado ?? "" }));
    dispatch(setDraftField({ field: "responsableId", value: u.id })); // quien recibe
    // Snapshot del responsable para que el PDF preview muestre el nombre de
    // quien firma sin esperar a guardar en backend.
    dispatch(
      setDraftField({
        field: "responsable",
        value: {
          id: u.id,
          name: u.name,
          puesto: u.puesto ?? null,
          area: u.department?.name ?? null,
          numeroEmpleado: u.numeroEmpleado ?? null,
        },
      })
    );
    dispatch(
      setDraftField({
        field: "empresa",
        value: u.empresa ?? "Puerto Nuevo Hotel y Villas",
      })
    );
    dispatch(
      setDraftField({
        field: "departamento",
        value: u.department?.name ?? "",
      })
    );

    if (item) {
      dispatch(
        setItemField({
          id: item.id,
          field: "area",
          value: u.department?.name ?? "",
        })
      );
    }
  };

  const handleEncargadoSelect = (value: string | number) => {
    const u = jefes.find((e) => e.id === String(value));
    dispatch(setDraftField({ field: "encargadoId", value: String(value) }));
    if (!u) {
      dispatch(
        setDraftField({
          field: "encargado",
          value: null,
        })
      );
      return;
    }
    // Snapshot del encargado para que el PDF preview muestre el nombre.
    dispatch(
      setDraftField({
        field: "encargado",
        value: {
          id: u.id,
          name: u.name,
          puesto: u.puesto ?? null,
          area: u.department?.name ?? null,
          numeroEmpleado: u.numeroEmpleado ?? null,
        },
      })
    );
  };

  const handleDeviceSelect = (value: string | number) => {
    const dev = devices.find((d) => d.id === String(value));
    if (!dev) {
      setSelectedDeviceId("");
      return;
    }
    setSelectedDeviceId(String(value));
    if (!item) return;

    // Campos planos del item: necesarios para que el PDF preview muestre
    // la información del dispositivo en tiempo real (sin esperar al guardado).
    dispatch(setItemField({ id: item.id, field: "descripcion", value: dev.descripcion }));
    dispatch(setItemField({ id: item.id, field: "marca", value: dev.marca }));
    dispatch(setItemField({ id: item.id, field: "modelo", value: dev.modelo }));
    dispatch(setItemField({ id: item.id, field: "controlActivos", value: dev.controlActivos }));
    dispatch(setItemField({ id: item.id, field: "numeroSerie", value: dev.numeroSerie ?? "N/A" }));
    dispatch(setItemField({ id: item.id, field: "nombreEquipo", value: dev.nombreEquipo ?? "N/A" }));
    // No pisamos area si ya fue autollenada por el empleado; usamos device.area como fallback.
    if (!item.area) {
      dispatch(setItemField({ id: item.id, field: "area", value: dev.area ?? "" }));
    }
    dispatch(setItemField({ id: item.id, field: "deviceId", value: dev.id }));

    // Snapshot con specs TIC para que el bloque "Especificaciones técnicas"
    // del PDF/preview se muestre cuando es un device IT.
    dispatch(
      setItemField({
        id: item.id,
        field: "device",
        value: {
          id: dev.id,
          controlActivos: dev.controlActivos,
          descripcion: dev.descripcion,
          marca: dev.marca,
          modelo: dev.modelo,
          ip: dev.ip ?? null,
          macAddress: dev.macAddress ?? null,
          sistemaOp: dev.sistemaOp ?? null,
          ram: dev.ram ?? null,
          almacenamiento: dev.almacenamiento ?? null,
          type: dev.type
            ? { code: dev.type.code, name: dev.type.name, prefix: dev.type.prefix }
            : undefined,
        } as any,
      })
    );
  };

  if (!item) return null;

  const empleadoOptions = empleados.map((u) => {
    const parts = [
      u.name,
      u.numeroEmpleado ? `#${u.numeroEmpleado}` : null,
      u.puesto ?? null,
      u.department?.name ?? null,
    ].filter(Boolean);
    return { value: u.id, label: parts.join(" · ") };
  });

  const jefeOptions = jefes.map((u) => {
    const parts = [
      u.name,
      u.role,
      u.numeroEmpleado ? `#${u.numeroEmpleado}` : null,
      u.puesto ?? null,
      u.department?.name ?? null,
    ].filter(Boolean);
    return { value: u.id, label: parts.join(" · ") };
  });

  const tipoOptions = tipos.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.prefix})`,
  }));

  const deviceOptions = devices.map((d) => ({
    value: d.id,
    label: `${d.controlActivos} — ${d.descripcion}`,
    sublabel: `${d.marca} ${d.modelo}`,
  }));

  const devicePlaceholder = draft.deviceTypeId
    ? "Buscar por activo, marca o modelo..."
    : "Selecciona primero el tipo de dispositivo";

  return (
    <ITStack direction="column" spacing={5}>
      {/* ── Encabezado ── */}
      <ITStack direction="column" spacing={3}>
        <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Encabezado
        </ITText>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="deviceTypeId"
              label="Tipo de dispositivo"
              options={tipoOptions}
              value={draft.deviceTypeId ?? ""}
              onChange={(e) => handleTypeChange(e.target.value)}
            />
          </ITGrid>
          {draft.deviceTypeId && (
            <ITGrid item xs={12} md={6}>
              <ITInput
                name="consecutivo"
                label="Folio (consecutivo)"
                value={draft.consecutivo}
                onChange={(e) => handleField("consecutivo", e.target.value)}
                placeholder="Auto-generado"
                disabled={loadingConsecutivo}
              />
            </ITGrid>
          )}

          <ITGrid item xs={12}>
            <ITSearchSelect
              name="empleadoId"
              label="Empleado (quien recibe)"
              placeholder="Buscar por nombre, número, puesto o departamento..."
              options={empleadoOptions}
              value={selectedEmpleadoId}
              onChange={handleEmpleadoSelect}
              required
              error={errors?.responsableId}
            />
          </ITGrid>

          {/* Campos autollenados del empleado */}
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="numeroEmpleado"
              label="No. de empleado"
              value={draft.numeroEmpleado}
              onChange={(e) => handleField("numeroEmpleado", e.target.value)}
              placeholder="Selecciona un empleado"
              disabled={!selectedEmpleadoId}
              required
              error={errors?.numeroEmpleado}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="empresa"
              label="Empresa"
              value={draft.empresa}
              onChange={(e) => handleField("empresa", e.target.value)}
              disabled={!selectedEmpleadoId}
              placeholder="Viene del empleado"
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="departamento"
              label="Departamento"
              value={draft.departamento}
              onChange={(e) => handleField("departamento", e.target.value)}
              disabled={!selectedEmpleadoId}
              placeholder="Viene del empleado"
            />
          </ITGrid>
        </ITGrid>
      </ITStack>

      {/* ── Recurso TIC ── */}
      <ITStack direction="column" spacing={3} className="border-t border-slate-100 pt-5">
        <ITFlex justify="between" align="center">
          <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Recurso TIC
          </ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            1 item
          </ITText>
        </ITFlex>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <ITStack direction="column" spacing={3}>
            <ITSearchSelect
              name="deviceSearch"
              label="Buscar dispositivo existente"
              placeholder={devicePlaceholder}
              value={selectedDeviceId}
              onChange={handleDeviceSelect}
              options={deviceOptions}
              disabled={!draft.deviceTypeId}
              error={errors?.deviceId}
            />

            {/* Especificaciones técnicas (TIC) — solo lectura, vienen del Device */}
            {item.device && isITDeviceCode(item.device.type?.code) && (
              <>
                <ITDivider className="my-2" />
                <ITFlex justify="between" align="center">
                  <ITFlex align="center" gap={2}>
                    <FaNetworkWired className="text-slate-400" />
                    <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Especificaciones técnicas (del dispositivo)
                    </ITText>
                  </ITFlex>
                  <ITBadget color="primary" size="small">
                    {item.device.type?.code}
                  </ITBadget>
                </ITFlex>
                <ITGrid container columns={12} spacing={3}>
                  <ITGrid item xs={12} md={6}>
                    <ITInput
                      name={`ip_${item.id}`}
                      label="IP"
                      value={item.device.ip ?? ""}
                      disabled
                      placeholder="Sin IP registrada"
                      onChange={() => {}}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={6}>
                    <ITInput
                      name={`mac_${item.id}`}
                      label="MAC Address"
                      value={item.device.macAddress ?? ""}
                      disabled
                      placeholder="Sin MAC registrada"
                      onChange={() => {}}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={6}>
                    <ITInput
                      name={`so_${item.id}`}
                      label="Sistema Operativo"
                      value={item.device.sistemaOp ?? ""}
                      disabled
                      placeholder="Sin SO registrado"
                      onChange={() => {}}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={6}>
                    <ITInput
                      name={`ram_${item.id}`}
                      label="RAM"
                      value={item.device.ram ?? ""}
                      disabled
                      placeholder="Sin RAM registrada"
                      onChange={() => {}}
                    />
                  </ITGrid>
                  <ITGrid item xs={12}>
                    <ITInput
                      name={`alm_${item.id}`}
                      label="Almacenamiento"
                      value={item.device.almacenamiento ?? ""}
                      disabled
                      placeholder="Sin almacenamiento registrado"
                      onChange={() => {}}
                    />
                  </ITGrid>
                </ITGrid>
                <ITText className="text-[9px] text-slate-400 italic">
                  Estas especificaciones se imprimen en el PDF. Para editarlas,
                  actualiza el dispositivo desde Dispositivos.
                </ITText>
              </>
            )}
          </ITStack>
        </div>
      </ITStack>

      {/* ── Firmantes ── */}
      <ITStack direction="column" spacing={3} className="border-t border-slate-100 pt-5">
        <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Firmantes
        </ITText>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSearchSelect
              name="encargadoId"
              label="Jefe de área (encargado)"
              placeholder="Buscar administrador, gerente o jefe..."
              options={jefeOptions}
              value={draft.encargadoId ?? ""}
              onChange={handleEncargadoSelect}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="deliveryBy"
              label="Entrega (quien entrega)"
              value={draft.deliveryBy}
              onChange={(e) => handleField("deliveryBy", e.target.value)}
              placeholder="Departamento de Mantenimiento"
            />
          </ITGrid>
        </ITGrid>
      </ITStack>
    </ITStack>
  );
}
