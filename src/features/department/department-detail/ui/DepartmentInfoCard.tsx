import {
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaTimes, FaUsers } from "react-icons/fa";
import type { Department, Subarea } from "@entities/department";

interface Props {
  dept: Department;
  isAdmin: boolean;
  newSubarea: string;
  onNewSubarea: (value: string) => void;
  onAddSubarea: () => void;
  onRemoveSubarea: (s: Subarea) => void;
}

export default function DepartmentInfoCard({
  dept,
  isAdmin,
  newSubarea,
  onNewSubarea,
  onAddSubarea,
  onRemoveSubarea,
}: Props) {
  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={12} md={5}>
          <ITFlex direction="column" gap={1}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Departamento
            </ITText>
            <ITText className="font-bold uppercase tracking-tight text-slate-800">
              {dept.name}
            </ITText>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={3}>
          <ITFlex direction="column" gap={1}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Estado
            </ITText>
            <ITFlex align="center" gap={2}>
              <ITBadget color={dept.active ? "success" : "danger"} size="small">
                {dept.active ? "Activo" : "Inactivo"}
              </ITBadget>
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={4}>
          <ITFlex direction="column" gap={1}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Usuarios
            </ITText>
            <ITFlex align="center" gap={2} className="text-slate-600">
              <FaUsers size={14} />
              <ITText className="font-bold">{dept._count?.users ?? 0} usuario(s)</ITText>
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12}>
          <ITFlex direction="column" gap={2}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Áreas
            </ITText>
            {dept.subareas.length === 0 ? (
              <ITText className="text-[12px] font-bold text-slate-400">
                Este departamento aún no tiene subáreas.
              </ITText>
            ) : (
              <ITFlex wrap="wrap" gap={2}>
                {dept.subareas.map((s) => (
                  <ITFlex
                    key={s.id}
                    align="center"
                    gap={2}
                    className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200"
                  >
                    <ITText className="text-[11px] font-black uppercase tracking-wide">
                      {s.name}
                    </ITText>
                    {isAdmin && (
                      <FaTimes
                        size={10}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        onClick={() => onRemoveSubarea(s)}
                        title="Eliminar subárea"
                      />
                    )}
                  </ITFlex>
                ))}
              </ITFlex>
            )}
          </ITFlex>
        </ITGrid>

        {isAdmin && (
          <ITGrid item xs={12}>
            <ITFlex gap={2}>
              <ITInput
                name="newSubarea"
                value={newSubarea}
                onChange={(e) => onNewSubarea(e.target.value)}
                placeholder="Nueva subárea…"
                onKeyDown={(e) => e.key === "Enter" && onAddSubarea()}
                className="flex-1"
              />
              <ITButton
                variant="filled"
                color="primary"
                onClick={onAddSubarea}
                disabled={!newSubarea.trim()}
                title="Agregar subárea"
              >
                <ITFlex align="center" gap={1}>
                  <FaPlus size={12} />
                  <ITText className="font-bold text-[11px]">Agregar</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITGrid>
        )}
      </ITGrid>
    </ITCard>
  );
}