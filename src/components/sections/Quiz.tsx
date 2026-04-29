import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, CalendarDays, MapPin, XCircle, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { destinations } from "@/data/destinations";

type Answers = {
  pasaporte?: string;
  paisInteres?: string;
  mesViaje?: string;
  nombre?: string;
};

const PROCESSING_DAYS: Record<string, number> = {
  nicaragua: 7,
  guyana: 1,
  surinam: 1,
  mexico: 15,
  dominicana: 1,
  panama: 60,
  brasil: 3,
  uruguay: 7,
  espana: 75,
  chile: 45,
  peru: 30,
  colombia: 75,
  argentina: 60,
  turquia: 7,
  rusia: 7,
  emiratos: 5,
  elsalvador: 60,
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SIN_FECHA = "Sin fecha concreta aún";
const NO_SEGURO_PAIS = "No estoy seguro";

function getProcessingDaysForCountry(country?: string | null): number {
  if (!country || country === NO_SEGURO_PAIS) return 0;
  const dest = destinations.find((d) => d.country === country);
  if (!dest) return 0;
  return PROCESSING_DAYS[dest.id] ?? 0;
}

function buildMonthOptions(country?: string | null): { value: string; label: string }[] {
  const days = getProcessingDaysForCountry(country);
  const start = new Date();
  start.setDate(start.getDate() + days + 7);
  start.setDate(1);
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value: label, label });
  }
  return options;
}

function calcularPuntaje(answers: Answers, destinationContext?: string | null): number {
  let score = 0;
  if (answers.pasaporte === "si") score += 3;
  else if (answers.pasaporte === "tramitando") score += 1;

  const pais = destinationContext || answers.paisInteres;
  if (pais && pais !== NO_SEGURO_PAIS) score += 3;

  if (answers.mesViaje && answers.mesViaje !== SIN_FECHA) score += 3;

  return score;
}

function esClientePotencial(score: number): boolean {
  return score >= 5;
}

function getWhatsAppText(answers: Answers, score: number, destinationContext?: string | null): string {
  const pasaporteMap: Record<string, string> = {
    si: "Sí, lo tengo vigente",
    tramitando: "En trámite",
    no: "Aún no",
  };

  const paisFinal = destinationContext || answers.paisInteres || "Por definir";
  const nombre = answers.nombre?.trim() || "Cliente";
  const mes = answers.mesViaje || "Por definir";

  const lines = [
    `Hola NovaTravel, soy *${nombre}* y acabo de completar la evaluación de perfil en su web.`,
    ``,
    `🌍 *País de interés:* ${paisFinal}`,
    `📘 *Pasaporte:* ${pasaporteMap[answers.pasaporte ?? ""] ?? "-"}`,
    `📅 *Mes estimado de viaje:* ${mes}`,
    `⭐ *Puntaje del perfil:* ${score}/9`,
    ``,
    `Me gustaría recibir asesoría para iniciar mi proceso. Gracias.`,
  ];
  return lines.join("\n");
}

interface QuizInternalProps {
  onClose?: () => void;
  destinationContext?: string | null;
}

function QuizInternal({ onClose, destinationContext }: QuizInternalProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});

  const hasContext = !!destinationContext;
  const totalSteps = hasContext ? 3 : 4;

  const score = calcularPuntaje(answers, destinationContext);
  const calificado = esClientePotencial(score);
  const waLink = buildWhatsAppLink(getWhatsAppText(answers, score, destinationContext));

  const monthOptions = useMemo(
    () => buildMonthOptions(destinationContext || answers.paisInteres),
    [destinationContext, answers.paisInteres],
  );

  const visibleStep =
    step >= 5 ? totalSteps : hasContext && step >= 2 ? step - 1 : step;
  const progress = `${(visibleStep / totalSteps) * 100}%`;

  const goNextFrom = (currentStep: number) => {
    if (currentStep === 1) setStep(hasContext ? 3 : 2);
    else if (currentStep === 2) setStep(3);
    else if (currentStep === 3) setStep(4);
    else if (currentStep === 4) setStep(5);
  };

  const goBackFrom = (currentStep: number) => {
    if (currentStep === 4) setStep(3);
    else if (currentStep === 3) setStep(hasContext ? 1 : 2);
    else if (currentStep === 2) setStep(1);
  };

  const pickPasaporte = (val: string) => {
    setAnswers((a) => ({ ...a, pasaporte: val }));
    goNextFrom(1);
  };
  const pickPais = (val: string) => {
    setAnswers((a) => ({ ...a, paisInteres: val, mesViaje: undefined }));
    goNextFrom(2);
  };
  const pickMes = (val: string) => {
    setAnswers((a) => ({ ...a, mesViaje: val }));
    goNextFrom(3);
  };

  const datosCompletos = !!answers.nombre?.trim();

  const paisLabel = destinationContext || answers.paisInteres || "";
  const procDays = getProcessingDaysForCountry(paisLabel);
  const procHint =
    paisLabel && paisLabel !== NO_SEGURO_PAIS
      ? procDays <= 1
        ? `Para ${paisLabel} la gestión es prácticamente inmediata.`
        : procDays < 30
        ? `Para ${paisLabel} la gestión toma aprox. ${procDays} días.`
        : `Para ${paisLabel} la gestión toma aprox. ${Math.round(procDays / 30)} ${Math.round(procDays / 30) === 1 ? "mes" : "meses"}.`
      : "Mostramos los próximos meses disponibles.";

  return (
    <div className="w-full">
      <div className="h-1 bg-muted rounded-t-lg overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: progress }}
          animate={{ width: progress }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <div className="p-6 md:p-8 min-h-[320px] flex flex-col justify-center">
        {step === 4 ? (
          <div key="step4" className="space-y-5">
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <User className="text-primary shrink-0" />
              Datos para tu asesor
            </h3>
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-white text-sm">Tu nombre</Label>
              <Input
                id="nombre"
                placeholder="Ej. María Pérez"
                value={answers.nombre ?? ""}
                onChange={(e) => setAnswers({ ...answers, nombre: e.target.value })}
                className="bg-secondary/50 border-border text-white"
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Destino: <span className="text-white font-medium">{paisLabel || "Por definir"}</span></p>
              <p>Mes estimado: <span className="text-white font-medium">{answers.mesViaje || "Por definir"}</span></p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => goBackFrom(4)} className="flex-1">
                Atrás
              </Button>
              <Button onClick={() => goNextFrom(4)} disabled={!datosCompletos} className="flex-1">
                Ver resultado <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : step === 2 ? (
          <div key="step2" className="space-y-5">
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <MapPin className="text-primary shrink-0" />
              ¿A qué país quieres viajar?
            </h3>
            <select
              value={answers.paisInteres ?? ""}
              onChange={(e) => pickPais(e.target.value)}
              className="w-full h-11 px-3 rounded-md bg-secondary/50 border border-border text-white text-base focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Selecciona un país</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.country} className="bg-card text-white">
                  {d.flag} {d.country}
                </option>
              ))}
              <option value={NO_SEGURO_PAIS} className="bg-card text-white">Aún no estoy seguro</option>
            </select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => goBackFrom(2)} className="flex-1">
                Atrás
              </Button>
            </div>
          </div>
        ) : step === 3 ? (
          <div key="step3" className="space-y-5">
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <CalendarDays className="text-primary shrink-0" />
              ¿En qué mes te gustaría viajar?
            </h3>
            <p className="text-sm text-muted-foreground">{procHint}</p>
            <select
              value={answers.mesViaje ?? ""}
              onChange={(e) => pickMes(e.target.value)}
              className="w-full h-11 px-3 rounded-md bg-secondary/50 border border-border text-white text-base focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Selecciona un mes</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value} className="bg-card text-white">
                  {m.label}
                </option>
              ))}
              <option value={SIN_FECHA} className="bg-card text-white">{SIN_FECHA}</option>
            </select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => goBackFrom(3)} className="flex-1">
                Atrás
              </Button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <CheckCircle2 className="text-primary shrink-0" />
                  ¿Tienes pasaporte vigente?
                </h3>
                <RadioGroup value={answers.pasaporte} className="grid gap-3">
                  {[
                    { value: "si", label: "Sí, lo tengo vigente" },
                    { value: "tramitando", label: "Estoy en trámite" },
                    { value: "no", label: "Aún no lo tengo" },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      className={`flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg border transition-colors cursor-pointer ${answers.pasaporte === opt.value ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/40"}`}
                      onClick={() => pickPasaporte(opt.value)}
                    >
                      <RadioGroupItem value={opt.value} id={`p-${opt.value}`} />
                      <Label htmlFor={`p-${opt.value}`} className="text-base cursor-pointer flex-1 text-white">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </motion.div>
            )}

            {step === 5 && calificado && (
              <motion.div
                key="resultado-apto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-white">¡Excelente perfil!</h3>
                <p className="text-muted-foreground">
                  Tu perfil califica para iniciar el proceso migratorio. Un asesor de NovaTravel puede atenderte de inmediato.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg shadow-[#25D366]/20 text-lg"
                >
                  <MessageCircle className="w-6 h-6" />
                  Hablar con un asesor ahora
                </a>
                {onClose && (
                  <button onClick={onClose} className="text-sm text-muted-foreground hover:text-white transition-colors mt-2">
                    Cerrar
                  </button>
                )}
              </motion.div>
            )}

            {step === 5 && !calificado && (
              <motion.div
                key="resultado-no-apto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-2xl font-serif text-white">Aún no estás listo</h3>
                <p className="text-muted-foreground leading-relaxed">
                  En este momento tu perfil aún no cumple los requisitos mínimos para iniciar un trámite migratorio con NovaTravel. Te recomendamos comenzar por obtener tu pasaporte y definir tu destino antes de contactarnos.
                </p>
                <div className="bg-secondary/40 border border-border rounded-lg p-4 text-left space-y-2">
                  <p className="text-sm font-semibold text-white">Pasos sugeridos:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Iniciar el trámite de tu pasaporte en las oficinas de inmigración</li>
                    <li>• Investigar destinos disponibles en nuestra sección de destinos</li>
                    <li>• Volver a completar la evaluación cuando tengas todo listo</li>
                  </ul>
                </div>
                {onClose && (
                  <Button variant="outline" onClick={onClose} className="w-full">
                    Entendido, lo tengo en cuenta
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface QuizModalProps {
  open: boolean;
  onClose: () => void;
  destinationContext?: string | null;
}

export function QuizModal({ open, onClose, destinationContext }: QuizModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-serif text-white">
            Evaluación de perfil
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Responde unas preguntas para conocer si podemos atenderte.
          </p>
        </DialogHeader>
        <QuizInternal onClose={onClose} destinationContext={destinationContext} />
      </DialogContent>
    </Dialog>
  );
}

export function Quiz() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});

  const totalSteps = 4;
  const score = calcularPuntaje(answers, null);
  const calificado = esClientePotencial(score);
  const waLink = buildWhatsAppLink(getWhatsAppText(answers, score, null));

  const monthOptions = useMemo(
    () => buildMonthOptions(answers.paisInteres),
    [answers.paisInteres],
  );

  const visibleStep = step >= 5 ? totalSteps : step;
  const progress = `${(visibleStep / totalSteps) * 100}%`;

  const datosCompletos = !!answers.nombre?.trim();

  const pickPasaporte = (val: string) => { setAnswers((a) => ({ ...a, pasaporte: val })); setStep(2); };
  const pickPais = (val: string) => { setAnswers((a) => ({ ...a, paisInteres: val, mesViaje: undefined })); setStep(3); };
  const pickMes = (val: string) => { setAnswers((a) => ({ ...a, mesViaje: val })); setStep(4); };

  const paisLabel = answers.paisInteres || "";
  const procDays = getProcessingDaysForCountry(paisLabel);
  const procHint =
    paisLabel && paisLabel !== NO_SEGURO_PAIS
      ? procDays <= 1
        ? `Para ${paisLabel} la gestión es prácticamente inmediata.`
        : procDays < 30
        ? `Para ${paisLabel} la gestión toma aprox. ${procDays} días.`
        : `Para ${paisLabel} la gestión toma aprox. ${Math.round(procDays / 30)} ${Math.round(procDays / 30) === 1 ? "mes" : "meses"}.`
      : "Mostramos los próximos meses disponibles.";

  return (
    <section className="py-24 px-6 md:px-12 bg-muted/30 relative overflow-hidden" id="quiz">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-4">¿Calificas para viajar?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Completa esta evaluación rápida y descubre si tu perfil está listo para iniciar el proceso migratorio con nosotros.
          </p>
        </div>

        <Card className="bg-background/40 backdrop-blur-md border-primary/20 shadow-xl overflow-hidden">
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: progress }}
              animate={{ width: progress }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <CardContent className="p-8 md:p-12 min-h-[300px] flex flex-col justify-center">
            {step === 2 ? (
              <div key="s-step2" className="space-y-5">
                <h3 className="text-2xl font-medium text-white flex items-center gap-3">
                  <MapPin className="text-primary shrink-0" /> ¿A qué país quieres viajar?
                </h3>
                <select
                  value={answers.paisInteres ?? ""}
                  onChange={(e) => pickPais(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-secondary/50 border border-border text-white text-base focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>Selecciona un país</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.country} className="bg-card text-white">
                      {d.flag} {d.country}
                    </option>
                  ))}
                  <option value={NO_SEGURO_PAIS} className="bg-card text-white">Aún no estoy seguro</option>
                </select>
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                  Atrás
                </Button>
              </div>
            ) : step === 3 ? (
              <div key="s-step3" className="space-y-5">
                <h3 className="text-2xl font-medium text-white flex items-center gap-3">
                  <CalendarDays className="text-primary shrink-0" /> ¿En qué mes te gustaría viajar?
                </h3>
                <p className="text-sm text-muted-foreground">{procHint}</p>
                <select
                  value={answers.mesViaje ?? ""}
                  onChange={(e) => pickMes(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-secondary/50 border border-border text-white text-base focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>Selecciona un mes</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value} className="bg-card text-white">
                      {m.label}
                    </option>
                  ))}
                  <option value={SIN_FECHA} className="bg-card text-white">{SIN_FECHA}</option>
                </select>
                <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                  Atrás
                </Button>
              </div>
            ) : step === 4 ? (
              <div key="s-step4" className="space-y-5">
                <h3 className="text-2xl font-medium text-white flex items-center gap-3">
                  <User className="text-primary shrink-0" /> Datos para tu asesor
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="nombre-section" className="text-white">Tu nombre</Label>
                  <Input
                    id="nombre-section"
                    placeholder="Ej. María Pérez"
                    value={answers.nombre ?? ""}
                    onChange={(e) => setAnswers({ ...answers, nombre: e.target.value })}
                    className="bg-secondary/50 border-border text-white"
                  />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Destino: <span className="text-white font-medium">{paisLabel || "Por definir"}</span></p>
                  <p>Mes estimado: <span className="text-white font-medium">{answers.mesViaje || "Por definir"}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    Atrás
                  </Button>
                  <Button onClick={() => setStep(5)} disabled={!datosCompletos} className="flex-1">
                    Ver resultado <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h3 className="text-2xl font-medium text-white flex items-center gap-3">
                      <CheckCircle2 className="text-primary shrink-0" /> ¿Tienes pasaporte vigente?
                    </h3>
                    <RadioGroup value={answers.pasaporte} className="grid gap-4">
                      {[{ value: "si", label: "Sí, lo tengo vigente" }, { value: "tramitando", label: "Estoy en trámite" }, { value: "no", label: "Aún no lo tengo" }].map((opt) => (
                        <div key={opt.value} onClick={() => pickPasaporte(opt.value)} className={`flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg border transition-colors cursor-pointer ${answers.pasaporte === opt.value ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/50"}`}>
                          <RadioGroupItem value={opt.value} id={`sp-${opt.value}`} />
                          <Label htmlFor={`sp-${opt.value}`} className="text-lg cursor-pointer flex-1">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </motion.div>
                )}

                {step === 5 && calificado && (
                  <motion.div key="resultado-apto" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-3xl font-serif text-white">¡Excelente perfil!</h3>
                    <p className="text-lg text-muted-foreground">
                      Tu perfil califica para iniciar el proceso migratorio. Un asesor puede atenderte de inmediato.
                    </p>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg shadow-[#25D366]/20 text-lg"
                    >
                      <MessageCircle className="w-6 h-6" />
                      Hablar con un asesor por WhatsApp
                    </a>
                  </motion.div>
                )}

                {step === 5 && !calificado && (
                  <motion.div key="resultado-no-apto" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
                      <XCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-3xl font-serif text-white">Aún no estás listo</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Tu perfil aún no cumple los requisitos mínimos para iniciar un trámite. Te recomendamos gestionar tu pasaporte y definir tu destino antes de contactarnos.
                    </p>
                    <div className="bg-secondary/40 border border-border rounded-lg p-4 text-left space-y-2">
                      <p className="text-sm font-semibold text-white">Pasos sugeridos:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Iniciar trámite de pasaporte en inmigración</li>
                        <li>• Explorar nuestros destinos disponibles</li>
                        <li>• Completar la evaluación nuevamente cuando estés listo</li>
                      </ul>
                    </div>
                    <Button variant="outline" onClick={() => { setStep(1); setAnswers({}); }} className="w-full">
                      Volver a intentarlo
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
