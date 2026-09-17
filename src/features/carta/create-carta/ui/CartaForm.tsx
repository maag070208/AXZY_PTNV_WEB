import {
  ITBadget,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITSelect,
  ITSegmentedControl,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaIdCard, FaLaptop, FaPenFancy } from "react-icons/fa";
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
import { deviceApi as devicesApi, type Device } from "@entities/device";
import { deviceTypeApi as deviceTypesApi, type DeviceType } from "@entities/device-type";
import { departmentsApi, type Department } from "@entities/department";
import { subareaApi, type Subarea } from "@entities/subarea";
import type { CartaFormErrors } from "@entities/carta";

interface Props {
  errors?: CartaFormErrors;
}

/** Encabezado reutilizable de cada tarjeta de sección del formulario. */
function SectionHeader({
  icon,
  iconClassName,
  title,
  subtitle,
  trailing,
}: {
  icon: React.ReactNode;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <ITFlex align="center" justify="between" gap={3} className="mb-5">
      <ITFlex align="center" gap={3} className="min-w-0">
        <ITFlex
          align="center"
          justify="center"
          className={`h-9 w-9 shrink-0 rounded-xl ${iconClassName ?? "bg-slate-100 text-slate-500"}`}
        >
          {icon}
        </ITFlex>
        <ITFlex direction="column" gap={0.25} className="min-w-0">
          <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">
            {title}
          </ITText>
          {subtitle && (
            <ITText className="text-[10px] text-slate-400">{subtitle}</ITText>
          )}
        </ITFlex>
      </ITFlex>
      {trailing}
    </ITFlex>
  );
}

export default function CartaForm({ errors }: Props) {
  const { t: tt } = useTranslation("cartas");
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.cartas.draft);
  const item = draft.items[0];
  const [empleados, setEmpleados] = useState<User[]>([]);
  const [jefes, setJefes] = useState<User[]>([]);
  const [tipos, setTipos] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [busyEmpleados, setBusyEmpleados] = useState(false);
  const [busyJefes, setBusyJefes] = useState(false);
  const [busyDevices, setBusyDevices] = useState(false);
  const [departamentos, setDepartamentos] = useState<Department[]>([]);
  const [subareas, setSubareas] = useState<Subarea[]>([]);
  const [busySubareas, setBusySubareas] = useState(false);

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

  const buscarDispositivos = async (q?: string, typeId?: string) => {
    const scopeTypeId = typeId ?? draft.deviceTypeId;
    if (!scopeTypeId) {
      setDevices([]);
      return;
    }
    setBusyDevices(true);
    try {
      const res = await devicesApi.list({
        typeId: scopeTypeId,
        estado: "DISPONIBLE",
        disponibleParaCarta: true,
        q: q || undefined,
      });
      setDevices(res.data);
    } catch {
      setDevices([]);
    } finally {
      setBusyDevices(false);
    }
  };

  const buscarDepartamentos = async () => {
    try {
      const data = await departmentsApi.list();
      setDepartamentos(data);
    } catch {
      setDepartamentos([]);
    }
  };

  const buscarSubareas = async (departmentId: string) => {
    setBusySubareas(true);
    try {
      const data = await subareaApi.list({ departmentId });
      setSubareas(data);
    } catch {
      setSubareas([]);
    } finally {
      setBusySubareas(false);
    }
  };

  useEffect(() => {
    buscarEmpleados();
    buscarJefes();
    deviceTypesApi.list().then(setTipos).catch(() => setTipos([]));
    buscarDepartamentos();
  }, []);

  useEffect(() => {
    if (!draft.departmentId) {
      setSubareas([]);
      return;
    }
    buscarSubareas(draft.departmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.departmentId]);

  const itemId = item?.id;

  useEffect(() => {
    if (!itemId) return;
    dispatch(setItemField({ id: itemId, field: "controlActivos", value: "" }));
    dispatch(setItemField({ id: itemId, field: "descripcion", value: "" }));
    dispatch(setItemField({ id: itemId, field: "marca", value: "" }));
    dispatch(setItemField({ id: itemId, field: "modelo", value: "" }));
    dispatch(setItemField({ id: itemId, field: "numeroSerie", value: "" }));
    dispatch(setItemField({ id: itemId, field: "nombreEquipo", value: "" }));
    setSelectedDeviceId("");
    // Recarga las unidades disponibles del tipo recién elegido — el select
    // de "buscar dispositivo existente" está vacío hasta que este tipo tiene
    // un valor, así que aquí es donde debe refrescarse.
    buscarDispositivos(undefined, draft.deviceTypeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.deviceTypeId, itemId, dispatch]);

  const handleField = (field: keyof typeof draft, value: string | number) => {
    dispatch(setDraftField({ field, value }));
  };

  const handleTypeChange = (typeId: string) => {
    // El folio (consecutivo) lo genera el backend al guardar — el front es
    // agnóstico a él. Solo se registra el tipo para filtrar dispositivos.
    dispatch(setDraftField({ field: "deviceTypeId", value: typeId }));
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

  const handleAsignacionChange = (value: string) => {
    const tipo = value as "PERSONAL" | "DEPARTAMENTO";
    dispatch(setDraftField({ field: "responsableTipo", value: tipo }));
    if (tipo === "DEPARTAMENTO") {
      // La carta se asigna a un departamento: se descartan los datos del empleado.
      setSelectedEmpleadoId("");
      dispatch(setDraftField({ field: "responsableId", value: null }));
      dispatch(setDraftField({ field: "responsable", value: null }));
      dispatch(setDraftField({ field: "numeroEmpleado", value: "" }));
    } else {
      dispatch(setDraftField({ field: "departmentId", value: null }));
      dispatch(setDraftField({ field: "department", value: null }));
      dispatch(setDraftField({ field: "subareaId", value: null }));
      dispatch(setDraftField({ field: "subarea", value: null }));
    }
  };

  const handleDepartmentSelect = (value: string | number) => {
    const dept = departamentos.find((d) => d.id === String(value));
    // Al cambiar de departamento la subárea elegida deja de aplicar — se
    // limpia siempre, se recarga con las de este departamento en el efecto.
    dispatch(setDraftField({ field: "subareaId", value: null }));
    dispatch(setDraftField({ field: "subarea", value: null }));
    if (!dept) {
      dispatch(setDraftField({ field: "departmentId", value: null }));
      dispatch(setDraftField({ field: "department", value: null }));
      setSubareas([]);
      return;
    }
    dispatch(setDraftField({ field: "departmentId", value: dept.id }));
    dispatch(
      setDraftField({
        field: "department",
        value: {
          id: dept.id,
          name: dept.name,
        },
      })
    );
    // El departamento se autocompleta con el elegido para que la barra del
    // PDF muestre, por ejemplo, "Carta responsiva del Departamento de RECEPCION".
    dispatch(
      setDraftField({
        field: "departamento",
        value: dept.name,
      })
    );
  };

  const handleSubareaSelect = (value: string | number) => {
    const s = subareas.find((sa) => sa.id === String(value));
    dispatch(setDraftField({ field: "subareaId", value: s?.id ?? null }));
    dispatch(
      setDraftField({
        field: "subarea",
        value: s ? { id: s.id, name: s.name } : null,
      })
    );
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

  const esDepartamento =
    draft.responsableTipo === "DEPARTAMENTO" || Boolean(draft.departmentId);

  const departamentoOptions = departamentos.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const subareaOptions = subareas.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const cardClass =
    "bg-white dark:bg-slate-900 p-6 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-[24px]";

  return (
    <ITStack direction="column" spacing={5}>
      {/* ── Encabezado / asignación ── */}
      <div className={cardClass}>
        <SectionHeader
          icon={<FaIdCard size={14} />}
          iconClassName="bg-indigo-100 text-indigo-600"
          title={tt("form.header")}
          subtitle={tt("form.headerHint")}
        />

        <ITStack direction="column" spacing={3}>
          <ITFlex align="center" gap={3} wrap="wrap">
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("form.asignacion")}
            </ITText>
            <ITSegmentedControl
              value={esDepartamento ? "DEPARTAMENTO" : "PERSONAL"}
              onChange={handleAsignacionChange}
              options={[
                { value: "PERSONAL", label: tt("form.asignacionPersonal") },
                { value: "DEPARTAMENTO", label: tt("form.asignacionDepartamento") },
              ]}
            />
          </ITFlex>

          {esDepartamento ? (
            <ITStack direction="column" spacing={3}>
              <ITSearchSelect
                name="departmentId"
                label={tt("form.department")}
                placeholder={tt("form.departmentPlaceholder")}
                options={departamentoOptions}
                value={draft.departmentId ?? ""}
                onChange={handleDepartmentSelect}
                required
                error={errors?.departmentId ? dyn(tt)(errors.departmentId) : undefined}
              />
              <ITSearchSelect
                name="subareaId"
                label={tt("form.subarea")}
                placeholder={
                  !draft.departmentId
                    ? tt("form.subareaPlaceholderFirst")
                    : tt("form.subareaPlaceholder")
                }
                options={subareaOptions}
                value={draft.subareaId ?? ""}
                onChange={handleSubareaSelect}
                isLoading={busySubareas}
                disabled={!draft.departmentId}
              />
            </ITStack>
          ) : (
            <ITGrid container columns={12} spacing={3}>
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

              {/* Campos autollenados del empleado. La columna del formulario
                  comparte ancho con la vista previa y puede quedar angosta
                  (hasta ~370px en ventanas medianas) sin importar qué tan
                  ancha esté la ventana del navegador — por eso van en una
                  sola columna en vez de dividirse por breakpoint. */}
              <ITGrid item xs={12}>
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
              <ITGrid item xs={12}>
                <ITInput
                  name="empresa"
                  label={tt("form.company")}
                  value={draft.empresa}
                  onChange={(e) => handleField("empresa", e.target.value)}
                  disabled={!selectedEmpleadoId}
                  placeholder={tt("form.companyPlaceholder")}
                />
              </ITGrid>
              <ITGrid item xs={12}>
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
          )}
        </ITStack>
      </div>

      {/* ── Recurso TIC ── */}
      <div className={cardClass}>
        <SectionHeader
          icon={<FaLaptop size={14} />}
          iconClassName="bg-emerald-100 text-emerald-600"
          title={tt("form.recursoTic")}
          subtitle={tt("form.recursoTicHint")}
          trailing={
            <ITBadget color="secondary" size="sm" variant="outlined">
              {tt("form.itemCount")}
            </ITBadget>
          }
        />

        <ITStack direction="column" spacing={3}>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12}>
              <ITSelect
                name="deviceTypeId"
                label={tt("form.deviceType")}
                options={tipoOptions}
                value={draft.deviceTypeId ?? ""}
                onChange={(e) => handleTypeChange(e.target.value)}
              />
            </ITGrid>
            <ITGrid item xs={12}>
              <ITSearchSelect
                name="deviceSearch"
                label={tt("form.deviceSearch")}
                placeholder={devicePlaceholder}
                value={selectedDeviceId}
                onChange={handleDeviceSelect}
                onSearch={buscarDispositivos}
                isLoading={busyDevices}
                options={deviceOptions}
                disabled={!draft.deviceTypeId}
                error={errors?.deviceId ? dyn(tt)(errors.deviceId) : undefined}
              />
            </ITGrid>
          </ITGrid>
        </ITStack>
      </div>

      {/* ── Firmantes ── */}
      <div className={cardClass}>
        <SectionHeader
          icon={<FaPenFancy size={14} />}
          iconClassName="bg-amber-100 text-amber-600"
          title={tt("form.signers")}
          subtitle={tt("form.signersHint")}
        />
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12}>
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
          <ITGrid item xs={12}>
            <ITInput
              name="deliveryBy"
              label={tt("form.deliveryBy")}
              value={draft.deliveryBy}
              onChange={(e) => handleField("deliveryBy", e.target.value)}
              placeholder={tt("form.deliveryByPlaceholder")}
            />
          </ITGrid>
        </ITGrid>
      </div>
    </ITStack>
  );
}
