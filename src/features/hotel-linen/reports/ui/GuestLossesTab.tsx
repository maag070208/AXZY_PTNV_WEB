import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITFlex, ITGrid, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { receptionApi, reportApi, type GuestLossReport, type HotelRoomOption } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import type { ReportDoc } from "@shared/lib/reportDoc";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { FaUserSlash } from "react-icons/fa";
import { defaultFrom, fmt, fmtDateTime, fmtDay, money, productLabel, todayStr } from "../lib";
import { ExportBar, PeriodFields, ReportTable, type ExportPdf, type ReportCol } from "./common";

type Row = GuestLossReport["rows"][number];

/** Pérdidas por huésped (baja motivo G): por huésped / habitación / fecha, con artículos, piezas, costo y cobro. */
export default function GuestLossesTab({ exportPdf }: { exportPdf: ExportPdf }) {
  const { t } = useTranslation("hotel-linen-report");
  const tt = dyn(t);
  const [rooms, setRooms] = useState<HotelRoomOption[]>([]);
  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState<GuestLossReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    receptionApi
      .rooms()
      .then(setRooms)
      .catch((e: Error) => setError(e.message));
  }, []);

  // El nombre se consulta con una pausa corta para no pedir en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      reportApi
        .guestLosses({ from, to, roomId, guestName: guestName.trim() })
        .then((r) => {
          setReport(r);
          setError(null);
        })
        .catch((e: Error) => setError(e.message));
    }, 300);
    return () => clearTimeout(timer);
  }, [from, to, roomId, guestName]);

  const itemsText = (r: Row) => r.items.map((i) => `${fmt(i.quantity)} × ${productLabel(i.product)}`).join(", ");
  const amount = (n: number | null) => (n === null ? "—" : money(n));
  const sourceText = (r: Row) => (r.source ? (r.source.ref ? `${tt(`guestLosses.source.${r.source.type}`)} ${r.source.ref}` : tt(`guestLosses.source.${r.source.type}`)) : t("guestLosses.sourceDirect"));

  const doc = useMemo<ReportDoc | null>(() => {
    if (!report) return null;
    return {
      title: t("guestLosses.title"),
      subtitle: `${fmtDay(report.from)} – ${fmtDay(report.to)}`,
      columns: [
        { key: "date", label: t("guestLosses.date") },
        { key: "folio", label: t("guestLosses.folio") },
        { key: "guest", label: t("guestLosses.guest") },
        { key: "room", label: t("guestLosses.room") },
        { key: "items", label: t("guestLosses.items") },
        { key: "pieces", label: t("guestLosses.pieces"), align: "right" },
        { key: "cost", label: t("guestLosses.cost"), align: "right" },
        { key: "chargeStatus", label: t("guestLosses.chargeStatus") },
        { key: "chargeAmount", label: t("guestLosses.chargeAmount"), align: "right" },
        { key: "source", label: t("guestLosses.sourceLabel") },
        { key: "status", label: t("guestLosses.status") },
      ],
      rows: [
        ...report.rows.map((r) => ({
          date: fmtDateTime(r.date),
          folio: r.folio,
          guest: r.guestName ?? "—",
          room: r.room?.number ?? "—",
          items: itemsText(r),
          pieces: fmt(r.pieces),
          cost: money(r.cost),
          chargeStatus: tt(`guestLosses.charge.${r.chargeStatus}`),
          chargeAmount: amount(r.chargeAmount),
          source: sourceText(r),
          status: tt(`guestLosses.statusName.${r.status}`),
        })),
        {
          date: t("guestLosses.totals"), folio: "", guest: "", room: "", items: "",
          pieces: fmt(report.total.pieces), cost: money(report.total.cost), chargeStatus: "",
          chargeAmount: money(report.total.chargeAmount), source: "", status: "",
        },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, t]);

  const columns: ReportCol<Row>[] = [
    { key: "date", label: t("guestLosses.date"), width: 160, value: (r) => r.date, render: (r) => fmtDateTime(r.date) },
    { key: "folio", label: t("guestLosses.folio"), width: 120, value: (r) => r.folio },
    { key: "guest", label: t("guestLosses.guest"), width: 170, value: (r) => r.guestName ?? "—" },
    { key: "room", label: t("guestLosses.room"), width: 90, value: (r) => r.room?.number ?? "—" },
    { key: "items", label: t("guestLosses.items"), width: 280, value: itemsText },
    { key: "pieces", label: t("guestLosses.pieces"), numeric: true, width: 90, value: (r) => r.pieces, render: (r) => fmt(r.pieces) },
    { key: "cost", label: t("guestLosses.cost"), numeric: true, width: 110, value: (r) => r.cost, render: (r) => money(r.cost) },
    { key: "chargeStatus", label: t("guestLosses.chargeStatus"), width: 130, value: (r) => tt(`guestLosses.charge.${r.chargeStatus}`) },
    { key: "chargeAmount", label: t("guestLosses.chargeAmount"), numeric: true, width: 120, value: (r) => r.chargeAmount ?? 0, render: (r) => amount(r.chargeAmount) },
    { key: "source", label: t("guestLosses.sourceLabel"), width: 150, value: sourceText },
    { key: "status", label: t("guestLosses.status"), width: 130, value: (r) => tt(`guestLosses.statusName.${r.status}`) },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}
      <ITGrid container columns={12} spacing={3}>
        <ITGrid item xs={12} md={4}>
          <ITSelect
            name="guestLossRoomFilter"
            label={t("guestLosses.room")}
            options={[{ value: "", label: t("guestLosses.allRooms") }, ...rooms.map((r) => ({ value: r.id, label: r.number }))]}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <ITInput name="guestLossGuestFilter" label={t("guestLosses.guest")} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
        </ITGrid>
      </ITGrid>
      <ITFlex justify="between" align="end">
        <PeriodFields from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ExportBar doc={doc} fileName={`blancos-perdidas-huesped-${from}-${to}`} exportPdf={exportPdf} />
      </ITFlex>
      {report && (
        <>
          <div className="grid !grid-cols-2 gap-4 md:!grid-cols-4">
            <KpiTile label={t("guestLosses.totalPieces")} value={fmt(report.total.pieces)} icon={<FaUserSlash size={14} />} tone={report.total.pieces > 0 ? "amber" : "neutral"} hint={money(report.total.cost)} />
          </div>
          <PanelCard title={t("guestLosses.title")} description={t("guestLosses.totalsNote")}>
            <ReportTable
              rows={report.rows}
              empty={t("guestLosses.none")}
              columns={columns}
              totals={[
                { label: t("guestLosses.pieces"), value: fmt(report.total.pieces) },
                { label: t("guestLosses.cost"), value: money(report.total.cost) },
                { label: t("guestLosses.chargeAmount"), value: money(report.total.chargeAmount) },
              ]}
            />
          </PanelCard>
          {report.total.events > 0 && (
            <PanelCard title={t("guestLosses.byCharge")}>
              <ReportTable
                rows={report.byChargeStatus}
                columns={[
                  { key: "status", label: t("guestLosses.chargeStatus"), width: 200, value: (g) => tt(`guestLosses.charge.${g.status}`) },
                  { key: "events", label: t("guestLosses.events"), numeric: true, value: (g) => g.events, render: (g) => fmt(g.events) },
                  { key: "pieces", label: t("guestLosses.pieces"), numeric: true, value: (g) => g.pieces, render: (g) => fmt(g.pieces) },
                  { key: "cost", label: t("guestLosses.cost"), numeric: true, value: (g) => g.cost, render: (g) => money(g.cost) },
                  { key: "chargeAmount", label: t("guestLosses.chargeAmount"), numeric: true, value: (g) => g.chargeAmount, render: (g) => money(g.chargeAmount) },
                ]}
              />
            </PanelCard>
          )}
        </>
      )}
    </ITFlex>
  );
}
