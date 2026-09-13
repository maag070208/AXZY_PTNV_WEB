import { ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";

export type StatCardSize = "sm" | "md" | "lg";

const SIZE_STYLES: Record<StatCardSize, { circle: string; value: string; label: string }> = {
  sm: { circle: "w-8 h-8", value: "text-base", label: "text-[10px]" },
  md: { circle: "w-10 h-10", value: "text-xl", label: "text-[11px]" },
  lg: { circle: "w-12 h-12", value: "text-2xl", label: "text-[11px]" },
};

export interface StatCardProps {
  icon: React.ReactNode;
  circleClass: string;
  value: number | string;
  label: string;
  size?: StatCardSize;
  className?: string;
  onClick?: () => void;
}

export default function StatCard({
  icon,
  circleClass,
  value,
  label,
  size = "sm",
  className,
  onClick,
}: StatCardProps) {
  const styles = SIZE_STYLES[size];
  return (
    <ITCard className={className} onClick={onClick}>
      <ITFlex direction="column" align="center" gap={0.5}>
        <div
          className={`${styles.circle} rounded-full flex items-center justify-center ${circleClass}`}
        >
          {icon}
        </div>
        <ITText className={`${styles.value} font-black text-slate-800 leading-none`}>
          {value}
        </ITText>
        <ITText className={`${styles.label} text-slate-500 uppercase tracking-wider text-center`}>
          {label}
        </ITText>
      </ITFlex>
    </ITCard>
  );
}