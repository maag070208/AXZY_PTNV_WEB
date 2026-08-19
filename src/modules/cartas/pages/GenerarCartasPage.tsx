import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITPage,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaFileSignature, FaLayerGroup } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { cartasApi, type GenerateCartasResult } from "@core/api/cartas.api";
import { deviceTypesApi, type DeviceType } from "@core/api/devices.api";

export default function GenerarCartasPage() {
  const navigate = useNavigate();

  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeId, setTypeId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateCartasResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    deviceTypesApi
      .list()
      .then((list) => {
        if (cancelled) return;
        const active = list.filter((t) => t.active);
        setTypes(active);
        if (active.length) setTypeId(active[0].id);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = async () => {
    if (!typeId || cantidad < 1) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const data = await cartasApi.generate(typeId, cantidad);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const selectedType = types.find((t) => t.id === typeId);

  return (
    <ITPage
      title="Generar cartas por tipo"
      description="Crea plantillas de cartas con folio consecutivo según el tipo"
      backAction={() => navigate("/cartas")}
      icon={<FaFileSignature size={20} />}
      maxWidth="3xl"
    >
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
        {loading ? (
          <ITFlex justify="center" className="py-8">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        ) : (
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={7}>
              <ITSelect
                name="typeId"
                label="Tipo *"
                options={types.map((t) => ({
                  value: t.id,
                  label: `${t.name} · ${t.code}`,
                }))}
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                disabled={types.length === 0}
              />
            </ITGrid>

            <ITGrid item xs={12} md={5}>
              <ITInput
                name="cantidad"
                type="number"
                label="Cantidad *"
                min={1}
                max={100}
                value={cantidad}
                onChange={(e) =>
                  setCantidad(
                    Math.min(100, Math.max(1, parseInt(e.target.value || "1", 10)))
                  )
                }
              />
            </ITGrid>

            <ITGrid item xs={12}>
              <ITFlex justify="end" gap={2}>
                <ITButton variant="outlined" onClick={() => navigate("/cartas")}>
                  Cancelar
                </ITButton>
                <ITButton
                  variant="filled"
                  color="primary"
                  onClick={handleGenerate}
                  disabled={generating || !typeId || cantidad < 1}
                >
                  <ITFlex align="center" gap={1}>
                    <FaLayerGroup size={12} />
                    <ITText className="font-bold text-[11px]">
                      {generating ? "Generando…" : "Generar"}
                    </ITText>
                  </ITFlex>
                </ITButton>
              </ITFlex>
            </ITGrid>
          </ITGrid>
        )}
      </ITCard>

      {result && (
        <ITCard className="p-6 mt-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
          <ITFlex direction="column" gap={3}>
            <ITAlert variant="success" title="Cartas generadas">
              Se generaron {result.cartas.length} plantilla(s) de tipo {result.tipo.name}.
            </ITAlert>
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Folios generados ({result.cartas.length})
              </ITText>
              <ITFlex wrap="wrap" gap={2}>
                {result.cartas.map((c) => (
                  <ITBadget key={c.id} color="primary" size="small">
                    {c.consecutivo}
                  </ITBadget>
                ))}
              </ITFlex>
            </ITFlex>
            <ITFlex justify="end" gap={2}>
              <ITButton variant="filled" color="primary" onClick={() => navigate("/cartas")}>
                <ITFlex align="center" gap={1}>
                  <FaFileSignature size={12} />
                  <ITText className="font-bold text-[11px]">Ir al listado</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        </ITCard>
      )}
    </ITPage>
  );
}