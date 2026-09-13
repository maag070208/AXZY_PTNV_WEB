import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaCheck } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const STEPS = ["stepUpload", "stepReview", "stepConfirm"] as const;

export default function ImportStepper({ stage }: { stage: number }) {
  const { t: tt } = useTranslation(["device"]);

  return (
    <ITFlex className="mb-6">
      {STEPS.map((key, index) => {
        const step = index + 1;
        const done = step < stage;
        const active = step === stage;
        return (
          <ITFlex align="center" key={key} className="flex-1">
            <ITFlex align="center" gap={2}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-colors ${
                  active
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow"
                    : done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <FaCheck size={12} /> : step}
              </div>
              <ITText
                className={`text-[11px] font-black uppercase tracking-widest ${
                  active
                    ? "text-emerald-700"
                    : done
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                {tt(`import.${key}`)}
              </ITText>
            </ITFlex>
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 mx-3 h-[2px] rounded-full ${
                  step < stage ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </ITFlex>
        );
      })}
    </ITFlex>
  );
}