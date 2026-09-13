import { ITBadget, ITFlex, ITGrid, ITInput, ITSearchSelect, ITSelect, ITStack, ITText, ITDivider } from "@axzydev/axzy_ui_system";
import { FaNetworkWired } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@app/store";
import {
  setDraftField,
  setItemField,
} from "@entities/carta";
import { usersApi, type User, type UserRole } from "@entities/user";
import { type Device } from "@entities/device";
import { deviceTypeApi as deviceTypesApi, type DeviceType } from "@entities/device-type";
import type { CartaFormErrors } from "@entities/carta";

interface Props {
  errors?: CartaFormErrors;
}

export default function CartaForm({ errors }: Props) {
  const { t: tt } = useTranslation("cartas");
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.cartas.draft);
  const item = draft.items[0];
  const [empleados, setEmpleados] = useState<User[]>([]);
  const [jefes, setJefes] = useState<User[]>([]);
  const [tipos, setTipos] = useState<DeviceType[]>([]);
  const [devices] = useState<Device[]>([]);
  const [loadingConsecutivo, setLoadingConsecutivo] = useState(false);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [busyEmpleados, setBusyEmpleados] = useState(false);
  const [busyJefes, setBusyJefes] = useState(false);

  const buscarEmpleados = async (q?: string) => {
    setBusyEmpleados(true);
    try {
      const res = await usersApi.empleados(undefined, q || undefined);
      setEmpleados(res);
    } catch {
      setEmpleados([]);
    } finally {
      setBusyEmpleados(false);
    }
  };

  const buscarJefes = async (q?: string) => {
    setBusyJefes(true);
    try {
      const res = await usersApi.empleadosPorRoles(
        ["ADMIN", "GERENTE", "JEFE_DE_AREA"] as UserRole[],
        undefined,
        q || undefined
      );
      setJefes(res);
    } catch {
      setJefes([]);
    } finally {
      setBusyJefes(false);
    }
  };

  useEffect(() => {
    buscarEmpleados();
    buscarJefes();
    deviceTypesApi.list().then(setTipos).catch(() => setTipos([]));
  }, []);

  const itemId = item?.id;

  useEffect(() => {
    if (!itemId) return;
    dispatch(setItemField({ id: itemId, field: "controlActivos", value: "" }));
    dispatch(setItemField({ id: itemId, field: "descripcion", value: "" }));
    dispatch(setItemField({ id: itemId, field: "marca", value: "" }));
    dispatch(setItemField({ id: itemId, field: "modelo", value: "" }));
    dispatch(setItemField({ id: itemId, field: "numeroSerie", value: "" }));
    dispatch(setItemField({ id: itemId, field: "nombreEquipo", value: "" }));
  }, [draft.deviceTypeId, itemId, dispatch]);

  const handleField = (field: keyof typeof draft, value: string | number) => {
    dispatch(setDraftField({ field, value }));
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

    dispatch(setDraftField({ field: "numeroEmpleado", value: u.numeroEmpleado ?? "" }));
    dispatch(setDraftField({ field: "responsableId", value: u.id })); // quien recibe
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

    dispatch(setItemField({ id: item.id, field: "descripcion", value: dev.descripcion }));
    dispatch(setItemField({ id: item.id, field: "marca", value: dev.marca }));
    dispatch(setItemField({ id: item.id, field: "modelo", value: dev.modelo }));
    dispatch(setItemField({ id: item.id, field: "controlActivos", value: dev.controlActivos }));
    dispatch(setItemField({ id: item.id, field: "numeroSerie", value: dev.numeroSerie ?? "N/A" }));
    dispatch(setItemField({ id: item.id, field: "nombreEquipo", value: dev.nombreEquipo ?? "N/A" }));
    if (!item.area) {
      dispatch(setItemField({ id: item.id, field: "area", value: dev.area ?? "" }));
    }
    dispatch(setItemField({ id: item.id, field: "deviceId", value: dev.id }));

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
          numeroSerie: dev.numeroSerie ?? null,
          nombreEquipo: dev.nombreEquipo ?? null,
          type: dev.type
            ? { code: dev.type.code, name: dev.type.name, prefix: dev.type.prefix, fieldConfig: dev.type.fieldConfig }
            : undefined,
        } as any,
      })
    );
  };

  if (!item) return null;

  const deviceFieldEnabled = (field: keyof NonNullable<DeviceType["fieldConfig"]>) =>
    Boolean(item.device?.type?.fieldConfig?.[field]?.enabled);
  const showConfiguredFields = ["ip", "macAddress", "sistemaOp", "ram", "almacenamiento"]
    .some((field) => deviceFieldEnabled(field as keyof NonNullable<DeviceType["fieldConfig"]>));

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
    ? tt("form.devicePlaceholderActive")
    : tt("form.devicePlaceholderFirst");

  return (
    <ITStack direction="column" spacing={5}>
      {/* ── Encabezado ── */}
      <ITStack direction="column" spacing={3}>
        <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          {tt("form.header")}
        </ITText>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="deviceTypeId"
              label={tt("form.deviceType")}
              options={tipoOptions}
              value={draft.deviceTypeId ?? ""}
              onChange={(e) => handleTypeChange(e.target.value)}
            />
          </ITGrid>
          {draft.deviceTypeId && (
            <ITGrid item xs={12} md={6}>
              <ITInput
                name="consecutivo"
                label={tt("form.folio")}
                value={draft.consecutivo}
                onChange={(e) => handleField("consecutivo", e.target.value)}
                placeholder={tt("form.folioPlaceholder")}
                disabled={loadingConsecutivo}
              />
            </ITGrid>
          )}

          <ITGrid item xs={12}>
            <ITSearchSelect
              name="empleadoId"
              label={tt("form.employee")}
              placeholder={tt("form.employeePlaceholder")}
              options={empleadoOptions}
              value={selectedEmpleadoId}
              onChange={handleEmpleadoSelect}
              onSearch={buscarEmpleados}
              isLoading={busyEmpleados}
              required
              error={errors?.responsableId ? dyn(tt)(errors.responsableId) : undefined}
            />
          </ITGrid>

          {/* Campos autollenados del empleado */}
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="numeroEmpleado"
              label={tt("form.employeeNo")}
              value={draft.numeroEmpleado}
              onChange={(e) => handleField("numeroEmpleado", e.target.value)}
              placeholder={tt("form.employeeNoPlaceholder")}
              disabled={!selectedEmpleadoId}
              required
              error={errors?.numeroEmpleado ? dyn(tt)(errors.numeroEmpleado) : undefined}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="empresa"
              label={tt("form.company")}
              value={draft.empresa}
              onChange={(e) => handleField("empresa", e.target.value)}
              disabled={!selectedEmpleadoId}
              placeholder={tt("form.companyPlaceholder")}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="departamento"
              label={tt("form.department")}
              value={draft.departamento}
              onChange={(e) => handleField("departamento", e.target.value)}
              disabled={!selectedEmpleadoId}
              placeholder={tt("form.departmentPlaceholder")}
            />
          </ITGrid>
        </ITGrid>
      </ITStack>

      {/* ── Recurso TIC ── */}
      <ITStack direction="column" spacing={3} className="border-t border-slate-100 pt-5">
        <ITFlex justify="between" align="center">
          <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {tt("form.recursoTic")}
          </ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {tt("form.itemCount")}
          </ITText>
        </ITFlex>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <ITStack direction="column" spacing={3}>
            <ITSearchSelect
              name="deviceSearch"
              label={tt("form.deviceSearch")}
              placeholder={devicePlaceholder}
              value={selectedDeviceId}
              onChange={handleDeviceSelect}
              options={deviceOptions}
              disabled={!draft.deviceTypeId}
              error={errors?.deviceId ? dyn(tt)(errors.deviceId) : undefined}
            />

            {/* Especificaciones técnicas (TIC) — solo lectura, vienen del Device */}
            {item.device && showConfiguredFields && (
              <>
                <ITDivider className="my-2" />
                <ITFlex justify="between" align="center">
                  <ITFlex align="center" gap={2}>
                    <FaNetworkWired className="text-slate-400" />
                    <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      {tt("form.specTitle")}
                    </ITText>
                  </ITFlex>
                  <ITBadget color="primary" size="small">
                    {item.device.type?.code}
                  </ITBadget>
                </ITFlex>
                <ITGrid container columns={12} spacing={3}>
                  {deviceFieldEnabled("ip") && <ITGrid item xs={12} md={6}>
                    <ITInput
                      name={`ip_${item.id}`}
                      label={tt("form.specIp")}
                      value={item.device.ip ?? ""}
                      disabled
                      placeholder={tt("form.specIpPlaceholder")}
                      onChange={() => {}}
                    />
                  </ITGrid>}
                  {deviceFieldEnabled("macAddress") && <ITGrid item xs={12} md={6}>
                    <ITInput
                      name={`mac_${item.id}`}
                      label={tt("form.specMac")}
                      value={item.device.macAddress ?? ""}
                      disabled
                      placeholder={tt("form.specMacPlaceholder")}
                      onChange={() => {}}
                    />
                  </ITGrid>}
                  {deviceFieldEnabled("sistemaOp") && <ITGrid item xs={12} md={6}>
                    <ITInput
                      name={`so_${item.id}`}
                      label={tt("form.specSo")}
                      value={item.device.sistemaOp ?? ""}
                      disabled
                      placeholder={tt("form.specSoPlaceholder")}
                      onChange={() => {}}
                    />
                  </ITGrid>}
                  {deviceFieldEnabled("ram") && <ITGrid item xs={12} md={6}>
                    <ITInput
                      name={`ram_${item.id}`}
                      label={tt("form.specRam")}
                      value={item.device.ram ?? ""}
                      disabled
                      placeholder={tt("form.specRamPlaceholder")}
                      onChange={() => {}}
                    />
                  </ITGrid>}
                  {deviceFieldEnabled("almacenamiento") && <ITGrid item xs={12}>
                    <ITInput
                      name={`alm_${item.id}`}
                      label={tt("form.specStorage")}
                      value={item.device.almacenamiento ?? ""}
                      disabled
                      placeholder={tt("form.specStoragePlaceholder")}
                      onChange={() => {}}
                    />
                  </ITGrid>}
                </ITGrid>
                <ITText className="text-[9px] text-slate-400 italic">
                  {tt("form.specHint")}
                </ITText>
              </>
            )}
          </ITStack>
        </div>
      </ITStack>

      {/* ── Firmantes ── */}
      <ITStack direction="column" spacing={3} className="border-t border-slate-100 pt-5">
        <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          {tt("form.signers")}
        </ITText>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSearchSelect
              name="encargadoId"
              label={tt("form.areaHead")}
              placeholder={tt("form.areaHeadPlaceholder")}
              options={jefeOptions}
              value={draft.encargadoId ?? ""}
              onChange={handleEncargadoSelect}
              onSearch={buscarJefes}
              isLoading={busyJefes}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="deliveryBy"
              label={tt("form.deliveryBy")}
              value={draft.deliveryBy}
              onChange={(e) => handleField("deliveryBy", e.target.value)}
              placeholder={tt("form.deliveryByPlaceholder")}
            />
          </ITGrid>
        </ITGrid>
      </ITStack>
    </ITStack>
  );
}