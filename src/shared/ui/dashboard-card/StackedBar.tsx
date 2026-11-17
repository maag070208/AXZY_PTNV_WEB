interface Segment {
  key: string;
  value: number;
  color: string;
}

/** Barra fina apilada y redondeada; sin datos muestra la pista gris. */
export default function StackedBar({ segments, label }: { segments: Segment[]; label?: string }) {
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div className="flex h-2 gap-[3px]" role="img" aria-label={label}>
      {shown.length === 0 ? (
        <div className="h-full flex-1 rounded-full" style={{ background: "#eef0f4" }} />
      ) : (
        shown.map((s) => <div key={s.key} className="h-full rounded-full" style={{ flexGrow: s.value, background: s.color }} />)
      )}
    </div>
  );
}
