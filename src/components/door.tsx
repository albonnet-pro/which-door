"use client";

type DoorProps = {
  label: string;
  description?: string | null;
  color: string;
  number: 1 | 2;
  open: boolean;
  dimmed?: boolean;
  disabled?: boolean;
  onOpen?: () => void;
  behind?: React.ReactNode;
};

export function Door({ label, description, color, number, open, dimmed, disabled, onOpen, behind }: DoorProps) {
  return (
    <div className={`door flex flex-col gap-3 ${open ? "is-open" : ""} ${dimmed ? "is-dimmed" : ""}`}>
      <div className="door-frame">
        <div className="door-behind">{behind}</div>
        <button
          type="button"
          className="door-leaf block w-full text-left disabled:cursor-default"
          style={{ "--door-color": color } as React.CSSProperties}
          onClick={onOpen}
          disabled={disabled || open}
          aria-label={`Ouvrir la porte ${number} : ${label}`}
        >
          <span className="absolute inset-x-[14%] top-[10%] z-10 flex h-[32%] flex-col items-center justify-center gap-1 text-center">
            <span className="font-display text-[clamp(0.65rem,1.6vw,0.85rem)] font-bold tracking-[0.3em] text-white/70 uppercase">
              Porte {number}
            </span>
            <span className="font-display text-[clamp(0.9rem,2.8vw,1.75rem)] leading-tight font-extrabold text-balance text-white drop-shadow-[0_2px_4px_rgb(0_0_0/0.5)]">
              {label}
            </span>
          </span>
          <span className="door-knob" />
        </button>
      </div>
      {description && (
        <p className="min-h-[2.5em] text-center text-[clamp(0.8rem,2vw,1rem)] text-balance text-muted">{description}</p>
      )}
    </div>
  );
}
