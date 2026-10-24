import { whatsappNumbers } from "@/data/destinations";

/**
 * Reparto consecutivo (round-robin) de números de WhatsApp.
 *
 * Un contador compartido en internet (counterapi.dev) suma 1 cada vez que a un
 * cliente se le muestra el botón de contactar. El número se asigna ANTES de que
 * el botón se active, así es un enlace directo y funciona en cualquier navegador. El número asignado es: contador % cantidad_de_números.
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

/** Enlace directo a un número ya asignado (el botón lo usa como un enlace normal). */
export function whatsAppLinkFor(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
