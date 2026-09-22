import { ITButton, ITFlex, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaHistory, FaPencilAlt, FaUserShield } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserHeaderCard } from "@features/user/user-history";
import { UserDetailCards, useUserDetail } from "@features/user/user-detail";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["users", "common"]);

  const { user, loading, notFound } = useUserDetail(id);

  if (loading) {
    return (
      <ITPage
        title={tt("detail.title")}
        loading
        backAction={() => navigate(-1)}
        icon={<FaUserShield size={20} />}
        breadcrumbs={[
          { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
          { label: tt("detail.breadcrumb") },
        ]}
      >
        <ITFlex justify="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!user || notFound) {
    return (
      <ITPage
        title={tt("detail.title")}
        backAction={() => navigate(-1)}
        icon={<FaUserShield size={20} />}
        breadcrumbs={[
          { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
          { label: tt("detail.breadcrumb") },
        ]}
      >
        <ITText className="text-slate-400">{tt("detail.notFound")}</ITText>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={tt("detail.title")}
      description={user.name}
      backAction={() => navigate(-1)}
      icon={<FaUserShield size={20} />}
      breadcrumbs={[
        { label: tt("list.breadcrumb"), onClick: () => navigate("/usuarios") },
        { label: tt("detail.breadcrumb") },
      ]}
      actions={
        <ITFlex align="center" gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            size="lg"
            onClick={() => navigate(`/usuarios/${id}/historial`)}
          >
            <ITFlex align="center" gap={1}>
              <FaHistory size={11} />
              <ITText className="font-bold text-[11px]">{tt("detail.historyButton")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            size="lg"
            onClick={() => navigate(`/usuarios/${id}/editar`)}
          >
            <ITFlex align="center" gap={1}>
              <FaPencilAlt size={11} />
              <ITText className="font-bold text-[11px]">{tt("detail.editButton")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <UserHeaderCard user={user} />
      <UserDetailCards user={user} />
    </ITPage>
  );
}