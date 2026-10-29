import { LottieLoader } from "@shared/ui/lottie-loader";
import { ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaUserShield } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserHeaderCard,
  UserHistoryTimeline,
  useUserHistory,
} from "@features/user/user-history";
import { UserPermissionsPanel } from "@features/user/user-permissions";
import { usePermission } from "@entities/user";
import { i18n } from "@shared/i18n";
import { useGoBack } from "@shared/lib/useGoBack";

export default function UserHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["users", "common"]);
  const canManagePermissions = usePermission("users.permissions") !== "NONE";

  const { user, history, loading } = useUserHistory(id);

  if (loading) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={tt("history.title")}
        loading
        backAction={() => goBack("/users")}
        icon={<FaUserShield size={20} />}
        breadcrumbs={[
          { label: tt("list.breadcrumb"), onClick: () => navigate("/users") },
          { label: tt("history.breadcrumb") },
        ]}
      >
        <ITFlex justify="center">
          <LottieLoader size="lg" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!user) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={tt("history.title")}
        backAction={() => goBack("/users")}
        icon={<FaUserShield size={20} />}
        breadcrumbs={[
          { label: tt("list.breadcrumb"), onClick: () => navigate("/users") },
          { label: tt("history.breadcrumb") },
        ]}
      >
        <ITText className="text-slate-400">{i18n.t("users:history.notFound")}</ITText>
      </ITPage>
    );
  }

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={tt("history.historyTitle")}
      description={user.name}
      backAction={() => goBack("/users")}
      icon={<FaUserShield size={20} />}
      breadcrumbs={[
        { label: tt("list.breadcrumb"), onClick: () => navigate("/users") },
        { label: user.name },
      ]}
    >
      <UserHeaderCard user={user} />
      {canManagePermissions && id && <UserPermissionsPanel userId={id} />}
      <UserHistoryTimeline history={history} />
    </ITPage>
  );
}