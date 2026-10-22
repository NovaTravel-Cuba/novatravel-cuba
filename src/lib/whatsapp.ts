import { whatsappNumbers } from "@/data/destinations";

/**
 * Reparto consecutivo (round-robin) de números de WhatsApp.
 *
 * Un contador compartido en internet (counterapi.dev) suma 1 cada vez que un
 * cliente pulsa el botón. El número asignado es: contador % cantidad_de_números.
 * Así: cliente 1 → número 1, cliente 2 → número 2, ... y vuelve a empezar.
 *
 * Si el contador no responde (sin internet, bloqueo, etc.) se usa un respaldo
 * local en el dispositivo para que el botón nunca falle.
 */
const COUNTER_URL = "https://api.counterapi.dev/v1/novatravel-cuba-wa/turno/up";
const LOCAL_KEY = "novatravel-wa-turno";
const TIMEOUT_MS = 3500;

function numbers(): readonly string[] {
  return whatsappNumbers.length > 0 ? whatsappNumbers : ["50582336820"];
}

async function nextTurn(): Promise<number> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(COUNTER_URL, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const n = Number(data?.count ?? data?.value);
      if (Number.isFinite(n)) return n - 1; // el primer cliente recibe el número 0
    }
  } catch {
    /* se usa el respaldo local */
  }
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    // Primer uso sin contador: empezar en un punto al azar para no cargar siempre el primer número
    const n = saved === null ? Math.floor(Math.random() * numbers().length) : Number(saved) + 1;
    localStorage.setItem(LOCAL_KEY, String(n));
    return n;
  } catch {
    return Math.floor(Math.random() * numbers().length);
  }
}

export async function getNextWhatsAppNumber(): Promise<string> {
  const list = numbers();
  const turn = await nextTurn();
  return list[((turn % list.length) + list.length) % list.length];
}

/** Enlace sin asignación de turno (solo como href de respaldo). */
export function fallbackWhatsAppLink(text: string): string {
  return `https://wa.me/${numbers()[0]}?text=${encodeURIComponent(text)}`;
}

/**
 * Abre WhatsApp con el siguiente número de la rotación.
 * La pestaña se abre al instante (dentro del toque del usuario, para que el móvil
 * no la bloquee) y luego se redirige al número asignado.
 */
export async function openWhatsApp(text: string): Promise<void> {
  const win = window.open("", "_blank");
  if (win) {
    win.opener = null;
    try {
      win.document.write(
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0b0b0f;color:#fff">Conectando con un asesor…</body>',
      );
    } catch {
      /* ignorar */
    }
  }
  const number = await getNextWhatsAppNumber();
  const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  if (win) win.location.href = url;
  else window.location.href = url;
}
