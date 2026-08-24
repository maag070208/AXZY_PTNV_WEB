import { ITFlex, ITGrid, ITInput, ITSearchSelect, ITSelect, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@core/store/store";
import {
  setDraftField,
  setItemField,
} from "@core/store/cartas/cartas.slice";
import { usersApi, type User } from "@core/api/auth.api";
import { devicesApi, deviceTypesApi, type Device, type DeviceType } from "@core/api/devices.api";
import type { CartaFormErrors } from "../utils/validation";

interface Props {
  errors?: CartaFormErrors;
}

export default function CartaForm({ errors }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.cartas.draft);
  const item = draft.items[0];
  const [empleados, setEmpleados] = useState<User[]>([]);
  const [tipos, setTipos] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingConsecutivo, setLoadingConsecutivo] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    usersApi.empleados().then(setEmpleados).catch(() => setEmpleados([]));
    deviceTypesApi.list().then(setTipos).catch(() => setTipos([]));
    devicesApi
      .list({ estado: "DISPONIBLE" })
      .then((res) => setDevices(res.data))
      .catch(() => setDevices([]));
  }, []);

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

  const handleDeviceSelect = (value: string | number) => {
    const dev = devices.find((d) => d.id === String(value));
    if (!dev) {
      setSelectedDeviceId("");
      return;
    }
    setSelectedDeviceId(String(value));
    if (!item) return;
    dispatch(setItemField({ id: item.id, field: "descripcion", value: dev.descripcion }));
    dispatch(setItemField({ id: item.id, field: "marca", value: dev.marca }));
    dispatch(setItemField({ id: item.id, field: "modelo", value: dev.modelo }));
    dispatch(setItemField({ id: item.id, field: "numeroSerie", value: dev.numeroSerie ?? "" }));
    dispatch(setItemField({ id: item.id, field: "nombreEquipo", value: dev.nombreEquipo ?? "" }));
    dispatch(setItemField({ id: item.id, field: "controlActivos", value: dev.controlActivos }));
    dispatch(setItemField({ id: item.id, field: "area", value: dev.area }));
  };

  if (!item) return null;

  const empleadoOptions = empleados.map((u) => ({
    value: u.id,
    label: u.name + (u.puesto ? ` · ${u.puesto}` : ""),
  }));

  const tipoOptions = tipos.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.prefix})`,
  }));

  const deviceOptions = devices.map((d) => ({
    value: d.id,
    label: `${d.controlActivos} — ${d.descripcion}`,
    sublabel: `${d.marca} ${d.modelo}`,
  }));

  return (
    <ITStack direction="column" spacing={5}>
      {/* ── Encabezado ── */}
      <ITStack direction="column" spacing={3}>
        <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Encabezado
        </ITText>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12}>
            <ITSelect
              name="deviceTypeId"
              label="Tipo de dispositivo"
              options={tipoOptions}
              value={draft.deviceTypeId ?? ""}
              onChange={(e) => handleTypeChange(e.target.value)}
            />
          </ITGrid>
          {draft.deviceTypeId && (
            <ITGrid item xs={12}>
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
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="numeroEmpleado"
              label="No. de empleado"
              value={draft.numeroEmpleado}
              onChange={(e) => handleField("numeroEmpleado", e.target.value)}
              placeholder="N/A"
              required
              error={errors?.numeroEmpleado}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="empresa"
              label="Empresa"
              value={draft.empresa}
              onChange={(e) => handleField("empresa", e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITInput
              name="departamento"
              label="Departamento"
              value={draft.departamento}
              onChange={(e) => handleField("departamento", e.target.value)}
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
              placeholder="Buscar por activo, marca o modelo..."
              value={selectedDeviceId}
              onChange={handleDeviceSelect}
              options={deviceOptions}
            />

            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={12}>
                <ITInput
                  name={`desc_${item.id}`}
                  label="Descripción general"
                  value={item.descripcion}
                  onChange={(e) => handleItem("descripcion", e.target.value)}
                  placeholder="Ej. CONTROL DE TV"
                  required
                  error={errors?.descripcion}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name={`marca_${item.id}`}
                  label="Marca"
                  value={item.marca}
                  onChange={(e) => handleItem("marca", e.target.value)}
                  placeholder="STEREN"
                  required
                  error={errors?.marca}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name={`modelo_${item.id}`}
                  label="Modelo"
                  value={item.modelo}
                  onChange={(e) => handleItem("modelo", e.target.value)}
                  placeholder="RM-115"
                  required
                  error={errors?.modelo}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name={`act_${item.id}`}
                  label="Control de activos"
                  value={item.controlActivos}
                  onChange={(e) => handleItem("controlActivos", e.target.value)}
                  placeholder="TBE-0001"
                  required
                  error={errors?.controlActivos}
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name={`serie_${item.id}`}
                  label="No. Serie"
                  value={item.numeroSerie}
                  onChange={(e) => handleItem("numeroSerie", e.target.value)}
                  placeholder="N/A"
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name={`eq_${item.id}`}
                  label="Nombre del equipo"
                  value={item.nombreEquipo}
                  onChange={(e) => handleItem("nombreEquipo", e.target.value)}
                  placeholder="N/A"
                />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput
                  name={`area_${item.id}`}
                  label="Área"
                  value={item.area}
                  onChange={(e) => handleItem("area", e.target.value)}
                  placeholder="MANTENIMIENTO"
                />
              </ITGrid>
            </ITGrid>
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
            <ITSelect
              name="responsableId"
              label="Responsable (quien recibe)"
              options={empleadoOptions}
              value={draft.responsableId ?? ""}
              onChange={(e) => handleField("responsableId", e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="encargadoId"
              label="Jefe de área (encargado)"
              options={empleadoOptions}
              value={draft.encargadoId ?? ""}
              onChange={(e) => handleField("encargadoId", e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12}>
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
