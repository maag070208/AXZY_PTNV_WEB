import { ITCard, ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { roleLabel, type User } from "@entities/user";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { i18n } from "@shared/i18n";

interface Props {
  user: User;
}

export default function UserHeaderCard({ user }: Props) {
  return (
    <ITCard className="mb-6">
      <ITFlex align="center" gap={6} wrap="wrap">
        <ITFlex align="center" gap={3} className="min-w-0">
          <ProfileAvatar name={user.name} size="lg" />
          <ITFlex direction="column" gap={0.5} className="min-w-0">
            <ITText className="truncate text-[15px] font-bold text-slate-800">{user.name}</ITText>
            <ITText className="text-[12px] text-slate-500">@{user.username}</ITText>
          </ITFlex>
        </ITFlex>
        <ITStack direction="column" spacing={1}>
          <ITText className="text-[12px] font-semibold text-slate-500">
            {i18n.t("common:labels.role")}
          </ITText>
          <ITText className="text-[12px] font-bold text-slate-700">
            {roleLabel(user.role)}
          </ITText>
        </ITStack>
        {user.employeeNumber && (
          <ITStack direction="column" spacing={1}>
            <ITText className="text-[12px] font-semibold text-slate-500">
              {i18n.t("common:labels.employeeNo")}
            </ITText>
            <ITText className="text-[12px] font-bold text-slate-700">
              {user.employeeNumber}
            </ITText>
          </ITStack>
        )}
      </ITFlex>
    </ITCard>
  );
}
