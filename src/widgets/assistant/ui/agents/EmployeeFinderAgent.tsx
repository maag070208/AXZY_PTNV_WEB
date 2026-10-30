import { useEffect, useMemo, useState } from "react";
import { ITFlex, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usersApi, personLabel, type User } from "@entities/user";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import OptionChip from "@shared/ui/option-chip/OptionChip";

interface Props {
  /** Cierra el panel (al salir hacia una pantalla, o al terminar). */
  onDone: () => void;
}

/**
 * Busca a una persona y ofrece lo que se puede hacer con ella desde Personal:
 * ver su expediente, editarla o darla de baja. No crea ni modifica nada aquí:
 * lleva a la pantalla donde eso se hace (con su permiso ya validado por la ruta).
 */
export default function EmployeeFinderAgent({ onDone }: Props) {
  const { t } = useTranslation("employees");
  const navigate = useNavigate();
  const [people, setPeople] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Todas las personas (incluidas las inactivas): en Personal también se dan de alta/baja.
  useEffect(() => {
    let alive = true;
    usersApi
      .people()
      .then((rows) => alive && setPeople(rows))
      .catch(() => alive && setPeople([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Filtro local: nombre, usuario, número de empleado o puesto.
  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people
      .filter((p) => !needle || `${p.name} ${p.username} ${p.employeeNumber ?? ""} ${p.jobTitle ?? ""}`.toLowerCase().includes(needle))
      .slice(0, 25)
      .map((p) => ({ value: p.id, label: personLabel(p) }));
  }, [people, query]);

  const go = (path: string) => {
    navigate(path);
    onDone();
  };

  return (
    <ITFlex direction="column" gap={3} className="h-full min-h-0 px-4 py-4">
      <ITText className="!text-[13px] font-semibold">{t("bot.searchTitle")}</ITText>
      <ITSearchSelect
        name="employeeFinder"
        placeholder={t("bot.searchPlaceholder")}
        options={options}
        isLoading={loading}
        onSearch={(value) => setQuery(value ?? "")}
        onChange={(value) => {
          const person = people.find((p) => p.id === String(value));
          if (person) setSelected(person);
        }}
      />

      {selected ? (
        <ITFlex direction="column" gap={2} className="mt-1">
          <ITFlex align="center" gap={2} className="rounded-2xl bg-[color-mix(in_srgb,currentColor_5%,transparent)] px-3 py-2.5">
            <ProfileAvatar name={selected.name} size="md" />
            <ITFlex direction="column" gap={0} className="min-w-0">
              <ITText className="truncate !text-[13px] font-bold">{selected.name}</ITText>
              <ITText muted className="truncate !text-[11.5px]">
                {[selected.employeeNumber ? `#${selected.employeeNumber}` : null, selected.jobTitle].filter(Boolean).join(" · ")}
              </ITText>
            </ITFlex>
          </ITFlex>

          <ITText muted className="!text-[11px] font-bold uppercase tracking-[0.06em]">
            {t("bot.actionsTitle")}
          </ITText>
          <ITFlex wrap="wrap" gap={1.5}>
            <OptionChip emoji="🗂️" label={t("bot.openRecord")} onClick={() => go(`/employees/${selected.id}`)} />
            <OptionChip emoji="✏️" label={t("bot.edit")} onClick={() => go(`/employees/${selected.id}/edit`)} />
            <OptionChip
              emoji="🔎"
              label={t("bot.searchAnother")}
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
            />
          </ITFlex>
          <ITText muted className="!text-[11.5px] leading-snug">
            {t("bot.deactivateHint")}
          </ITText>
        </ITFlex>
      ) : (
        <ITText muted className="!text-[12px]">
          {t("bot.pickHint")}
        </ITText>
      )}
    </ITFlex>
  );
}
