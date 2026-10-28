"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Door } from "@/components/door";
import { saveRound, type RoundFormState } from "./actions";

type Side = "left" | "right";

export type DoorValues = {
  label: string;
  description: string;
  revealTitle: string;
  revealText: string;
  videoUrl: string;
  imageUrl: string;
  color: string;
};

export type RoundValues = {
  title: string;
  active: boolean;
  badSide: Side | null;
  left: DoorValues;
  right: DoorValues;
};

const emptyDoor = (color: string): DoorValues => ({
  label: "",
  description: "",
  revealTitle: "",
  revealText: "",
  videoUrl: "",
  imageUrl: "",
  color,
});

export const emptyRound: RoundValues = {
  title: "",
  active: true,
  badSide: null,
  left: emptyDoor("#b91c1c"),
  right: emptyDoor("#1d4ed8"),
};

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 outline-none placeholder:text-muted/60 focus:border-accent";

export function RoundForm({ roundId, initial }: { roundId: number | null; initial: RoundValues }) {
  const [state, formAction, pending] = useActionState<RoundFormState, FormData>(
    saveRound.bind(null, roundId),
    {},
  );
  const [values, setValues] = useState(initial);
  const [preview, setPreview] = useState(false);

  const setDoor = (side: Side, patch: Partial<DoorValues>) =>
    setValues((v) => ({ ...v, [side]: { ...v[side], ...patch } }));

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Titre du round" error={errors.title}>
          <input
            name="title"
            className={input}
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            placeholder="Ex : Les vacances"
          />
        </Field>
        <label className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            name="active"
            className="size-4 accent-[var(--accent)]"
            checked={values.active}
            onChange={(e) => setValues((v) => ({ ...v, active: e.target.checked }))}
          />
          Round actif
        </label>
      </div>

      {errors.badSide && <p className="text-sm text-danger">{errors.badSide}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        {(["left", "right"] as const).map((side, i) => (
          <DoorFields
            key={side}
            side={side}
            number={i + 1}
            values={values[side]}
            errors={errors}
            isBad={values.badSide === side}
            onBad={() => setValues((v) => ({ ...v, badSide: side }))}
            onChange={(patch) => setDoor(side, patch)}
          />
        ))}
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Aperçu</h2>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-2"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? "Fermer les portes" : "Ouvrir les portes"}
          </button>
        </div>
        <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
          {(["left", "right"] as const).map((side, i) => {
            const door = values[side];
            return (
              <Door
                key={side}
                number={(i + 1) as 1 | 2}
                label={door.label || "Dilemme…"}
                description={door.description}
                color={door.color}
                open={preview}
                onOpen={() => setPreview(true)}
                behind={
                  <div className="flex h-full flex-col items-center justify-center gap-2 py-3 pr-3 pl-[24%] text-center">
                    {door.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- URL libre saisie dans l'admin
                      <img src={door.imageUrl} alt="" className="max-h-[40%] w-full rounded object-cover" />
                    )}
                    <p className="font-display font-extrabold">{door.revealTitle || (door.videoUrl ? "▶ Vidéo" : "Surprise…")}</p>
                    {door.revealText && <p className="text-xs opacity-80">{door.revealText}</p>}
                  </div>
                }
              />
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-6 py-2.5 font-semibold text-accent-ink hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link href="/admin" className="rounded-lg border border-border px-6 py-2.5 hover:bg-surface-2">
          Annuler
        </Link>
        {state.message && <p className="text-danger">{state.message}</p>}
      </div>
    </form>
  );
}

function DoorFields({
  side,
  number,
  values,
  errors,
  isBad,
  onBad,
  onChange,
}: {
  side: Side;
  number: number;
  values: DoorValues;
  errors: Record<string, string>;
  isBad: boolean;
  onBad: () => void;
  onChange: (patch: Partial<DoorValues>) => void;
}) {
  const name = (field: keyof DoorValues) => `${side}.${field}`;
  const bind = (field: keyof DoorValues) => ({
    name: name(field),
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [field]: e.target.value }),
  });

  return (
    <fieldset
      className={`space-y-4 rounded-xl border bg-surface p-4 ${isBad ? "border-danger/70" : "border-border"}`}
    >
      <legend className="flex items-center gap-2 px-2 font-display text-lg font-bold">
        <span className="size-3 rounded-full" style={{ background: values.color }} />
        Porte {number}
      </legend>

      <label
        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
          isBad ? "border-danger bg-danger/10 text-danger" : "border-border hover:bg-surface-2"
        }`}
      >
        <input
          type="radio"
          name="badSide"
          value={side}
          checked={isBad}
          onChange={onBad}
          className="size-4 accent-[var(--danger)]"
        />
        <span className="font-semibold">{isBad ? "☠ C'est la mauvaise porte" : "Désigner comme mauvaise porte"}</span>
      </label>

      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Devant la porte</p>
      <Field label="Dilemme (écrit sur la porte)" error={errors[name("label")]}>
        <input className={input} placeholder="Ex : Une semaine aux Maldives" {...bind("label")} />
      </Field>
      <Field label="Précision (sous la porte)" error={errors[name("description")]}>
        <input className={input} placeholder="Ex : Sans téléphone." {...bind("description")} />
      </Field>
      <Field label="Couleur" error={errors[name("color")]}>
        <div className="flex items-center gap-3">
          <input type="color" className="h-10 w-14 cursor-pointer rounded border border-border bg-background" {...bind("color")} />
          <code className="text-sm text-muted">{values.color}</code>
        </div>
      </Field>

      <p className="pt-2 text-xs font-semibold tracking-wider text-muted uppercase">Derrière la porte</p>
      <Field label="Vidéo" error={errors[name("videoUrl")]} group>
        <VideoInput name={name("videoUrl")} value={values.videoUrl} onChange={(videoUrl) => onChange({ videoUrl })} />
      </Field>
      <Field label="Titre de révélation" error={errors[name("revealTitle")]}>
        <input className={input} placeholder="Optionnel. Ex : Paradis absolu" {...bind("revealTitle")} />
      </Field>
      <Field label="Texte de révélation" error={errors[name("revealText")]}>
        <textarea className={`${input} min-h-20`} placeholder="Optionnel" {...bind("revealText")} />
      </Field>
      <Field label="Image de fond derrière la porte (URL)" error={errors[name("imageUrl")]}>
        <input type="url" className={input} placeholder="https://…" {...bind("imageUrl")} />
      </Field>
    </fieldset>
  );
}

function VideoInput({ name, value, onChange }: { name: string; value: string; onChange: (url: string) => void }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function upload(file: File) {
    setError(null);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.setRequestHeader("x-filename", encodeURIComponent(file.name));
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      const body = JSON.parse(xhr.responseText || "{}") as { url?: string; error?: string };
      if (xhr.status === 200 && body.url) onChange(body.url);
      else setError(body.error ?? "Échec de l'upload");
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Échec de l'upload");
    };
    xhr.send(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          name={name}
          className={`${input} min-w-0 flex-1`}
          placeholder="https://…/video.mp4 ou uploader un fichier"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <label
          className={`cursor-pointer rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-2 ${
            progress !== null ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {progress !== null ? `Upload… ${progress} %` : "Uploader"}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/ogg,.m4v"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {progress !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      {value && progress === null && (
        <video src={value} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black" />
      )}
    </div>
  );
}

function Field({
  label,
  error,
  group,
  children,
}: {
  label: string;
  error?: string;
  group?: boolean;
  children: React.ReactNode;
}) {
  // `group` : le contenu a ses propres contrôles, on évite d'imbriquer des <label>
  const Wrapper = group ? "div" : "label";
  return (
    <Wrapper className="block space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-sm text-danger">{error}</span>}
    </Wrapper>
  );
}
