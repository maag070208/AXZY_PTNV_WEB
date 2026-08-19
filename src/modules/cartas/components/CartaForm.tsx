import { ITButton, ITFlex, ITGrid, ITInput, ITSelect, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaPlus } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@core/store/store";
import {
  setDraftField,
  setItemField,
} from "@core/store/cartas/cartas.slice";
import { usersApi, type User } from "@core/api/auth.api";
import type { CartaFormErrors } from "../utils/validation";

interface Props {
  onConsumeConsecutivo: () => Promise<void> | void;
  errors?: CartaFormErrors;
}

export default function CartaForm({ onConsumeConsecutivo, errors }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.cartas.draft);
  const item = draft.items[0];
  const [empleados, setEmpleados] = useState<User[]>([]);

  useEffect(() => {
    usersApi.empleados().then(setEmpleados).catch(() => setEmpleados([]));
  }, []);

  const handleField = (field: keyof typeof draft, value: string | number) => {
    dispatch(setDraftField({ field, value }));
  };

  const handleItem = (field: keyof typeof item, value: string) => {
    if (!item) return;
    dispatch(setItemField({ id: item.id, field, value }));
  };

  if (!item) return null;

  const empleadoOptions = empleados.map((u) => ({
    value: u.id,
    label: u.name + (u.puesto ? ` · ${u.puesto}` : ""),
  }));

  return (
    <ITStack direction="column" spacing={6}>
      <ITStack direction="column" spacing={4}>
        <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Encabezado
        </ITText>
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="consecutivo"
              label="Folio (consecutivo)"
              value={draft.consecutivo}
              onChange={(e) => handleField("consecutivo", e.target.value)}
              placeholder="F-MMTO-0000"
              iconRight={
                <ITButton
                  variant="outlined"
                  size="small"
                  color="primary"
                  onClick={onConsumeConsecutivo}
                  title="Generar siguiente consecutivo"
                >
                  <FaPlus size={12} />
                </ITButton>
              }
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="numeroEmpleado"
              label="No. de empleado (quien recibe)"
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
          <ITGrid item xs={12} md={6}>
            <ITInput
              name="departamento"
              label="Departamento"
              value={draft.departamento}
              onChange={(e) => handleField("departamento", e.target.value)}
            />
          </ITGrid>
        </ITGrid>
      </ITStack>

      <ITStack direction="column" spacing={4} className="border-t border-slate-100 pt-4">
        <ITFlex justify="between" align="center">
          <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Recurso TIC
          </ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            1 item permitido
          </ITText>
        </ITFlex>

        <ITStack direction="column" spacing={3} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <ITInput
            name={`desc_${item.id}`}
            label="Descripción general"
            value={item.descripcion}
            onChange={(e) => handleItem("descripcion", e.target.value)}
            placeholder="Ej. CONTROL DE TV"
            required
            error={errors?.descripcion}
          />
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name={`cant_${item.id}`}
                type="number"
                label="Cantidad"
                min={1}
                value={draft.cantidad ?? 1}
                onChange={(e) =>
                  handleField("cantidad", Math.max(1, parseInt(e.target.value || "1", 10)))
                }
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
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
            <ITGrid item xs={12} md={4}>
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
            <ITGrid item xs={12} md={4}>
              <ITInput
                name={`serie_${item.id}`}
                label="No. Serie"
                value={item.numeroSerie}
                onChange={(e) => handleItem("numeroSerie", e.target.value)}
                placeholder="N/A"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name={`eq_${item.id}`}
                label="Nombre del equipo"
                value={item.nombreEquipo}
                onChange={(e) => handleItem("nombreEquipo", e.target.value)}
                placeholder="N/A"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
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
            <ITGrid item xs={12} md={4}>
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
      </ITStack>

      <ITStack direction="column" spacing={4} className="border-t border-slate-100 pt-4">
        <ITText as="h3" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Firmantes
        </ITText>
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="responsableId"
              label="Responsable (EMPLEADO)"
              options={empleadoOptions}
              value={draft.responsableId ?? ""}
              onChange={(e) => handleField("responsableId", e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="encargadoId"
              label="Jefe de área (Encargado · EMPLEADO)"
              options={empleadoOptions}
              value={draft.encargadoId ?? ""}
              onChange={(e) => handleField("encargadoId", e.target.value)}
            />
          </ITGrid>
        </ITGrid>
        <ITInput
          name="deliveryBy"
          label="Entrega (Departamento / Persona que entrega)"
          value={draft.deliveryBy}
          onChange={(e) => handleField("deliveryBy", e.target.value)}
          placeholder="Departamento de Mantenimiento"
        />
      </ITStack>
    </ITStack>
  );
}