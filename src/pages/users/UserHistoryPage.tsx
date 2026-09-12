import { ITFlex, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaUserShield } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserHeaderCard,
  UserHistoryTimeline,
  useUserHistory,
} from "@features/user/user-history";

export default function UserHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["users", "common"]);

  const { user, history, loading } = useUserHistory(id);

  if (loading) {
    return (
      <ITPage
        title={tt("history.title")}
        loading
        backAction={() => navigate(-1)}
        icon={<FaUserShield size={20} />}
        breadcrumbs={[
          { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
          { label: tt("history.breadcrumb") },
        ]}
      >
        <ITFlex justify="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!user) {
    return (
      <ITPage
        title={tt("history.title")}
        backAction={() => navigate(-1)}
        icon={<FaUserShield size={20} />}
        breadcrumbs={[
          { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
          { label: tt("history.breadcrumb") },
        ]}
      >
        <ITText className="text-slate-400">Usuario no encontrado</ITText>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={tt("history.historyTitle")}
      description={user.name}
      backAction={() => navigate(-1)}
      icon={<FaUserShield size={20} />}
      breadcrumbs={[
        { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
        { label: user.name },
      ]}
    >
      <UserHeaderCard user={user} />
      <UserHistoryTimeline history={history} />
    </ITPage>
  );
}