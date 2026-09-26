import { ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { roleLabel, type User } from "@entities/user";

interface Props {
  user: User;
}

export default function UserHeaderCard({ user }: Props) {
  return (
    <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 mb-6">
      <ITFlex gap={6} wrap="wrap">
        <ITStack direction="column" spacing={1}>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Username
          </ITText>
          <ITText className="text-[12px] font-black text-slate-700">
            @{user.username}
          </ITText>
        </ITStack>
        <ITStack direction="column" spacing={1}>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Rol
          </ITText>
          <ITText className="text-[12px] font-bold text-slate-700">
            {roleLabel(user.role)}
          </ITText>
        </ITStack>
        {user.employeeNumber && (
          <ITStack direction="column" spacing={1}>
            <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              No. Empleado
            </ITText>
            <ITText className="text-[12px] font-bold text-slate-700">
              {user.employeeNumber}
            </ITText>
          </ITStack>
        )}
      </ITFlex>
    </ITFlex>
  );
}