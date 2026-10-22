import site from "./site.json";

export type DestCategory = "visado" | "boleto" | "contrato" | "traslado";

export interface Destination {
  id: string;
  country: string;
  flag: string;
  flagCode: string;
  category: DestCategory;
  type: string;
  price: number | string;
  paymentStructure: string;
  duration: string;
  included: string[];
  requirements: string[];
  nota: string | null;
  /** Ruta relativa (ej. "uploads/panama.jpg") o URL completa. Vacío = bandera. */
  image?: string;
}

// Los datos viven en src/data/site.json y se editan desde /admin.html
export const destinations = site.destinations as unknown as Destination[];
export const whatsappNumbers = site.whatsapp as string[];

export function destinationImage(d: Pick<Destination, "image" | "flagCode">): string {
  if (d.image) {
    return /^https?:\/\//.test(d.image) ? d.image : `${import.meta.env.BASE_URL}${d.image}`;
  }
  return `https://flagcdn.com/w640/${d.flagCode}.jpg`;
}
