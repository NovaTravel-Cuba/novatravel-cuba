export const WHATSAPP_NUMBERS = [
  "50582336820",
  "50558058460",
  "12694122984",
  "50586185543",
] as const;

export function getRandomWhatsAppNumber(): string {
  const idx = Math.floor(Math.random() * WHATSAPP_NUMBERS.length);
  return WHATSAPP_NUMBERS[idx];
}

export function buildWhatsAppLink(text: string): string {
  const number = getRandomWhatsAppNumber();
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
