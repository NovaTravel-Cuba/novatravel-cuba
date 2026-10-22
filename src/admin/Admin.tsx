import { useEffect, useState, type ReactNode } from "react";
import type { DestCategory, Destination } from "@/data/destinations";
import { destinationImage } from "@/data/destinations";
import {
  DATA_PATH,
  GitHubError,
  checkWriteAccess,
  commitFiles,
  loadSiteText,
  resizeToJpegBase64,
} from "./github";

interface SiteData {
  whatsapp: string[];
  destinations: Destination[];
}

const TOKEN_KEY = "novatravel-admin-token";
const CATEGORIES: { key: DestCategory; label: string }[] = [
  { key: "visado", label: "Visado" },
  { key: "boleto", label: "Boleto aéreo" },
  { key: "contrato", label: "Contrato laboral" },
  { key: "traslado", label: "Traslado" },
];

const inputCls =
  "w-full bg-background border border-border rounded-md px-3 py-2.5 text-foreground text-base focus:outline-none focus:border-primary";
const btnCls = "px-4 py-2.5 rounded-md font-semibold text-sm transition-opacity disabled:opacity-50";
const primaryBtn = `${btnCls} bg-primary text-background`;
const ghostBtn = `${btnCls} border border-border text-foreground`;

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "paquete";
const toLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function blankDest(): Destination {
  return {
    id: "",
    country: "",
    flag: "",
    flagCode: "",
    category: "visado",
    type: "",
    price: "",
    paymentStructure: "",
    duration: "",
    included: [],
    requirements: [],
    nota: null,
    image: "",
  };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [tokenInput, setTokenInput] = useState("");
  const [data, setData] = useState<SiteData | null>(null);
  const [baseText, setBaseText] = useState("");
  const [pending, setPending] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ index: number; draft: Destination; lines: { inc: string; req: string; price: string } } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const fail = (e: unknown) => {
    const text =
      e instanceof GitHubError && (e.status === 401 || e.status === 403 || e.status === 404)
        ? "El token no es válido o no tiene permiso sobre este repositorio."
        : e instanceof Error
          ? e.message
          : "Ocurrió un error";
    setMsg({ kind: "err", text });
  };

  async function load(tk: string, remember = true) {
    setBusy(true);
    setMsg(null);
    try {
      if (!(await checkWriteAccess(tk))) throw new Error("Este token no tiene permiso de escritura en el repositorio.");
      const text = await loadSiteText(tk);
      setData(JSON.parse(text));
      setBaseText(text);
      setPending({});
      setDirty(false);
      setToken(tk);
      if (remember) localStorage.setItem(TOKEN_KEY, tk);
    } catch (e) {
      fail(e);
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  // Entrar automáticamente si ya hay token guardado en este dispositivo
  useEffect(() => {
    if (token) void load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setTokenInput("");
    setData(null);
    setMsg(null);
  }

  function update(next: SiteData) {
    setData(next);
    setDirty(true);
    setMsg(null);
  }

  function startEdit(index: number) {
    if (!data) return;
    const d = index === -1 ? blankDest() : data.destinations[index];
    setEditing({
      index,
      draft: { ...d },
      lines: { inc: d.included.join("\n"), req: d.requirements.join("\n"), price: String(d.price) },
    });
  }

  function applyEdit() {
    if (!data || !editing) return;
    const { draft, lines, index } = editing;
    if (!draft.country.trim()) return setMsg({ kind: "err", text: "Escribe el nombre del país o destino." });
    if (!draft.type.trim()) return setMsg({ kind: "err", text: "Escribe el tipo de servicio (ej. Visa, Boleto aéreo)." });
    const priceText = lines.price.trim();
    if (!priceText) return setMsg({ kind: "err", text: "Escribe el precio (número) o la palabra Variable." });

    const next: Destination = {
      ...draft,
      country: draft.country.trim(),
      type: draft.type.trim(),
      flagCode: draft.flagCode.trim().toLowerCase(),
      price: /^\d+(\.\d+)?$/.test(priceText) ? Number(priceText) : priceText,
      included: toLines(lines.inc),
      requirements: toLines(lines.req),
      nota: draft.nota?.trim() ? draft.nota.trim() : null,
    };
    const list = [...data.destinations];
    if (index === -1) {
      let id = slug(next.country);
      if (list.some((d) => d.id === id)) id = `${id}-${Date.now().toString(36)}`;
      next.id = id;
      list.push(next);
    } else {
      list[index] = next;
    }
    update({ ...data, destinations: list });
    setEditing(null);
  }

  function remove(index: number) {
    if (!data) return;
    const d = data.destinations[index];
    if (!confirm(`¿Eliminar el paquete "${d.country} — ${d.type}"?`)) return;
    update({ ...data, destinations: data.destinations.filter((_, i) => i !== index) });
  }

  function move(index: number, dir: -1 | 1) {
    if (!data) return;
    const j = index + dir;
    if (j < 0 || j >= data.destinations.length) return;
    const list = [...data.destinations];
    [list[index], list[j]] = [list[j], list[index]];
    update({ ...data, destinations: list });
  }

  async function pickImage(file: File | undefined) {
    if (!file || !editing) return;
    try {
      const b64 = await resizeToJpegBase64(file);
      const name = `uploads/${slug(editing.draft.country || "paquete")}-${Date.now().toString(36)}.jpg`;
      setPending((p) => ({ ...p, [name]: b64 }));
      setEditing({ ...editing, draft: { ...editing.draft, image: name } });
    } catch {
      setMsg({ kind: "err", text: "No se pudo leer esa imagen. Prueba con otra (JPG o PNG)." });
    }
  }

  async function save() {
    if (!data) return;
    setBusy(true);
    setMsg(null);
    try {
      const current = await loadSiteText(token);
      if (current !== baseText) {
        throw new Error("Los datos cambiaron desde otro dispositivo. Pulsa «Recargar» y vuelve a aplicar tus cambios.");
      }
      const numbers = data.whatsapp.map((n) => n.replace(/\D/g, "")).filter(Boolean);
      if (numbers.length === 0) throw new Error("Debe haber al menos un número de WhatsApp.");
      const clean: SiteData = { whatsapp: numbers, destinations: data.destinations };
      const text = JSON.stringify(clean, null, 2) + "\n";

      const used = new Set(clean.destinations.map((d) => d.image).filter(Boolean) as string[]);
      const files = [{ path: DATA_PATH, content: text, encoding: "utf-8" as const }];
      for (const [name, b64] of Object.entries(pending)) {
        if (used.has(name)) files.push({ path: `public/${name}`, content: b64, encoding: "base64" as const });
      }
      await commitFiles(token, files, "Admin: actualización de paquetes");
      setData(clean);
      setBaseText(text);
      setPending({});
      setDirty(false);
      setMsg({ kind: "ok", text: "Guardado. La web se actualizará sola en 1 o 2 minutos." });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  const imgSrc = (d: Destination) =>
    d.image && pending[d.image] ? `data:image/jpeg;base64,${pending[d.image]}` : destinationImage(d);

  // ---------- Pantalla de acceso ----------
  if (!data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">
          <h1 className="text-3xl font-serif">Administración <span className="text-primary">NovaTravel</span></h1>
          <p className="text-sm text-muted-foreground">
            Pega tu token de acceso de GitHub. Se guarda solo en este dispositivo y sirve para guardar los cambios en la web.
          </p>
          <input
            type="password"
            autoComplete="off"
            className={inputCls}
            placeholder="ghp_… o github_pat_…"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value.trim())}
          />
          <button className={`${primaryBtn} w-full`} disabled={busy || !tokenInput} onClick={() => load(tokenInput)}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
          {msg && <p className={msg.kind === "err" ? "text-destructive text-sm" : "text-primary text-sm"}>{msg.text}</p>}
          <a href={import.meta.env.BASE_URL} className="block text-center text-sm text-muted-foreground hover:text-primary">
            ← Volver a la web
          </a>
        </div>
      </div>
    );
  }

  // ---------- Formulario de edición ----------
  if (editing) {
    const { draft, lines } = editing;
    const set = (patch: Partial<Destination>) => setEditing({ ...editing, draft: { ...draft, ...patch } });
    const setLines = (patch: Partial<typeof lines>) => setEditing({ ...editing, lines: { ...lines, ...patch } });
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-5">
          <h1 className="text-2xl font-serif">{editing.index === -1 ? "Nuevo paquete" : `Editar: ${draft.country}`}</h1>

          <Field label="Imagen del paquete" hint="Si no subes imagen se muestra la bandera del país. Las fotos se reducen automáticamente.">
            <div className="space-y-2">
              <img src={imgSrc(draft)} alt="" className="h-40 w-full rounded-md object-cover bg-card" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
              <input type="file" accept="image/*" onChange={(e) => pickImage(e.target.files?.[0])} className="text-sm" />
              {draft.image && (
                <button className={ghostBtn} onClick={() => set({ image: "" })}>Quitar imagen (usar bandera)</button>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="País o destino"><input className={inputCls} value={draft.country} onChange={(e) => set({ country: e.target.value })} /></Field>
            <Field label="Categoría">
              <select className={inputCls} value={draft.category} onChange={(e) => set({ category: e.target.value as DestCategory })}>
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Emoji de bandera" hint="Ej. 🇵🇦 (aparece en el cuestionario)"><input className={inputCls} value={draft.flag} onChange={(e) => set({ flag: e.target.value })} /></Field>
            <Field label="Código de país (2 letras)" hint="Ej. pa. Sirve para la bandera por defecto"><input className={inputCls} maxLength={2} value={draft.flagCode} onChange={(e) => set({ flagCode: e.target.value })} /></Field>
            <Field label="Tipo de servicio" hint="Ej. Visa de turismo"><input className={inputCls} value={draft.type} onChange={(e) => set({ type: e.target.value })} /></Field>
            <Field label="Precio en USD" hint="Un número (2600) o la palabra Variable"><input className={inputCls} inputMode="decimal" value={lines.price} onChange={(e) => setLines({ price: e.target.value })} /></Field>
            <Field label="Forma de pago"><input className={inputCls} value={draft.paymentStructure} onChange={(e) => set({ paymentStructure: e.target.value })} /></Field>
            <Field label="Duración del trámite"><input className={inputCls} value={draft.duration} onChange={(e) => set({ duration: e.target.value })} /></Field>
          </div>

          <Field label="Qué incluye el paquete" hint="Una cosa por línea">
            <textarea className={inputCls} rows={5} value={lines.inc} onChange={(e) => setLines({ inc: e.target.value })} />
          </Field>
          <Field label="Requisitos del cliente" hint="Uno por línea (puede quedar vacío)">
            <textarea className={inputCls} rows={5} value={lines.req} onChange={(e) => setLines({ req: e.target.value })} />
          </Field>
          <Field label="Nota (opcional)">
            <textarea className={inputCls} rows={2} value={draft.nota ?? ""} onChange={(e) => set({ nota: e.target.value })} />
          </Field>

          {msg && <p className={msg.kind === "err" ? "text-destructive text-sm" : "text-primary text-sm"}>{msg.text}</p>}
          <div className="flex gap-3 sticky bottom-0 bg-background py-3">
            <button className={primaryBtn} onClick={applyEdit}>Aceptar</button>
            <button className={ghostBtn} onClick={() => { setEditing(null); setMsg(null); }}>Cancelar</button>
          </div>
          <p className="text-xs text-muted-foreground">«Aceptar» solo guarda en esta pantalla. Para publicar, pulsa «Guardar y publicar» en la lista.</p>
        </div>
      </div>
    );
  }

  // ---------- Lista principal ----------
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-serif">Administración <span className="text-primary">NovaTravel</span></h1>
          <div className="flex gap-2">
            <a href={import.meta.env.BASE_URL} className={ghostBtn}>Ver web</a>
            <button className={ghostBtn} onClick={logout}>Salir</button>
          </div>
        </header>

        {msg && (
          <p className={`rounded-md border px-3 py-2 text-sm ${msg.kind === "err" ? "border-destructive text-destructive" : "border-primary text-primary"}`}>{msg.text}</p>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif">Paquetes ({data.destinations.length})</h2>
            <button className={primaryBtn} onClick={() => startEdit(-1)}>+ Nuevo paquete</button>
          </div>
          <ul className="space-y-3">
            {data.destinations.map((d, i) => (
              <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <img src={imgSrc(d)} alt="" className="h-14 w-20 shrink-0 rounded object-cover bg-background" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.flag} {d.country}</p>
                  <p className="truncate text-sm text-muted-foreground">{d.type} · {typeof d.price === "number" ? `USD ${d.price.toLocaleString()}` : d.price}</p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  <button className={ghostBtn} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
                  <button className={ghostBtn} onClick={() => move(i, 1)} aria-label="Bajar">↓</button>
                  <button className={ghostBtn} onClick={() => startEdit(i)}>Editar</button>
                  <button className={`${ghostBtn} text-destructive`} onClick={() => remove(i)}>Borrar</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-serif">Números de WhatsApp</h2>
          <p className="text-sm text-muted-foreground">Uno por línea, con código de país y sin signos (ej. 50582336820). Los clientes se reparten en este orden, uno para cada número y vuelve a empezar.</p>
          <textarea
            className={inputCls}
            rows={Math.max(3, data.whatsapp.length + 1)}
            value={data.whatsapp.join("\n")}
            onChange={(e) => update({ ...data, whatsapp: e.target.value.split("\n") })}
          />
        </section>

        <div className="sticky bottom-0 flex flex-wrap gap-3 bg-background py-3">
          <button className={primaryBtn} disabled={busy || !dirty} onClick={save}>
            {busy ? "Guardando…" : dirty ? "Guardar y publicar" : "Sin cambios"}
          </button>
          <button className={ghostBtn} disabled={busy} onClick={() => { if (!dirty || confirm("Se perderán los cambios sin guardar. ¿Recargar?")) void load(token); }}>
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}
