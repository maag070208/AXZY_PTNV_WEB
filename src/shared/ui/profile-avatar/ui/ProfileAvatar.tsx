import { useState } from "react";

const SIZE_MAP = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
} as const;

export interface ProfileAvatarProps {
  fotoUrl?: string | null;
  initials: string;
  alt?: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

/**
 * Avatar circular con fallback garantizado a iniciales.
 *
 * Bypassea al `ITAvatar` del kit porque su rama de fallback usa un ternario
 * mutuamente excluyente (`src ? <img onError=hide> : <span>initials</span>`):
 * cuando el `<img>` falla, la `<span>` de iniciales no se renderiza y el
 * contenedor queda en blanco. Aquí siempre se renderizan las iniciales como
 * capa de fondo y el `<img>` como overlay; en error de carga el `<img>` se
 * desmonta y las iniciales permanecen visibles.
 */
export default function ProfileAvatar({
  fotoUrl,
  initials,
  alt,
  size = "xl",
  className,
}: ProfileAvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImg = !!fotoUrl && !errored;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-primary-600 text-white font-bold tracking-wide flex-shrink-0 ${SIZE_MAP[size]} ${className ?? ""}`}
      role={alt ? "img" : undefined}
      aria-label={alt}
    >
      <span className="absolute inset-0 flex items-center justify-center select-none">
        {initials.slice(0, 2).toUpperCase()}
      </span>
      {showImg && (
        <img
          src={fotoUrl!}
          alt={alt ?? ""}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}