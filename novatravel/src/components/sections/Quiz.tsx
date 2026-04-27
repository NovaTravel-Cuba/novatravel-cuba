import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Plane, MapPin, XCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Answers = {
  pasaporte?: string;
  cuando?: string;
  destino?: string;
};

function calcularPuntaje(answers: Answers): number {
  let score = 0;
  if (answers.pasaporte === "si") score += 3;
  else if (answers.pasaporte === "tramitando") score += 1;
  if (answers.cuando === "pronto") score += 3;
  else if (answers.cuando === "6meses") score += 2;
  if (answers.destino === "definido") score += 3;
  else if (answers.destino === "pensando") score += 1;
  return score;
}

function esClientePotencial(score: number): boolean {
  return score >= 5;
}

function getWhatsAppText(answers: Answers): string {
  const pasaporteMap: Record<string, string> = { si: "Sí, lo tengo vigente", tramitando: "En trámite", no: "Aún no" };
  const cuandoMap: Record<string, string> = { pronto: "En el próximo mes", "6meses": "En los próximos 3 meses", sinplanes: "Sin planes concretos aún" };
  const destinoMap: Record<string, string> = { definido: "Sí, ya lo tengo decidido", pensando: "Tengo algunas opciones en mente", nodecidido: "Aún no sé, necesito asesoría" };
  return `Hola NovaTravel, acabo de completar la evaluación de perfil en su web.\n\n✅ Pasaporte: ${pasaporteMap[answers.pasaporte ?? ""] ?? "-"}\n✅ Fecha de viaje: ${cuandoMap[answers.cuando ?? ""] ?? "-"}\n✅ Destino: ${destinoMap[answers.destino ?? ""] ?? "-"}\n\nMe gustaría recibir asesoría.`;
}

interface QuizInternalProps {
  onClose?: () => void;
  destinationContext?: string | null;
}

function QuizInternal({ onClose, destinationContext }: QuizInternalProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const score = calcularPuntaje(answers);
  const calificado = esClientePotencial(score);

  const waText = destinationContext
    ? `Hola NovaTravel, me interesa el servicio para ${destinationContext}.\n\n${getWhatsAppText(answers)}`
    : getWhatsAppText(answers);

  const waLink = buildWhatsAppLink(waText);

  return (
    <div className="w-full">
      <div className="h-1 bg-muted rounded-t-lg overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "33%" }}
          animate={{ width: step >= 4 ? "100%" : `${(step / 3) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="p-6 md:p-8 min-h-[320px] flex flex-col justify-center">
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
              <RadioGroup
                onValueChange={(val) => setAnswers({ ...answers, pasaporte: val })}
                value={answers.pasaporte}
                className="grid gap-3"
              >
                {[
                  { value: "si", label: "Sí, lo tengo vigente" },
                  { value: "tramitando", label: "Estoy en trámite" },
                  { value: "no", label: "Aún no lo tengo" },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    className={`flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg border transition-colors cursor-pointer ${answers.pasaporte === opt.value ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/40"}`}
                    onClick={() => setAnswers({ ...answers, pasaporte: opt.value })}
                  >
                    <RadioGroupItem value={opt.value} id={`p-${opt.value}`} />
                    <Label htmlFor={`p-${opt.value}`} className="text-base cursor-pointer flex-1 text-white">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button onClick={handleNext} disabled={!answers.pasaporte} className="w-full mt-2">
                Siguiente <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <Plane className="text-primary shrink-0" />
                ¿Cuándo planeas viajar?
              </h3>
              <RadioGroup
                onValueChange={(val) => setAnswers({ ...answers, cuando: val })}
                value={answers.cuando}
                className="grid gap-3"
              >
                {[
                  { value: "pronto", label: "En el próximo mes" },
                  { value: "6meses", label: "En los próximos 3 meses" },
                  { value: "sinplanes", label: "Sin planes concretos aún" },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    className={`flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg border transition-colors cursor-pointer ${answers.cuando === opt.value ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/40"}`}
                    onClick={() => setAnswers({ ...answers, cuando: opt.value })}
                  >
                    <RadioGroupItem value={opt.value} id={`t-${opt.value}`} />
                    <Label htmlFor={`t-${opt.value}`} className="text-base cursor-pointer flex-1 text-white">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button onClick={handleNext} disabled={!answers.cuando} className="w-full mt-2">
                Siguiente <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <MapPin className="text-primary shrink-0" />
                ¿Tienes un destino definido?
              </h3>
              <RadioGroup
                onValueChange={(val) => setAnswers({ ...answers, destino: val })}
                value={answers.destino}
                className="grid gap-3"
              >
                {[
                  { value: "definido", label: "Sí, ya lo tengo decidido" },
                  { value: "pensando", label: "Tengo algunas opciones en mente" },
                  { value: "nodecidido", label: "No, necesito asesoría para elegir" },
                ].map((opt) => (
                  <div
                    key={opt.value}
                    className={`flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg border transition-colors cursor-pointer ${answers.destino === opt.value ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/40"}`}
                    onClick={() => setAnswers({ ...answers, destino: opt.value })}
                  >
                    <RadioGroupItem value={opt.value} id={`d-${opt.value}`} />
                    <Label htmlFor={`d-${opt.value}`} className="text-base cursor-pointer flex-1 text-white">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button onClick={handleNext} disabled={!answers.destino} className="w-full mt-2">
                Ver resultado <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === 4 && calificado && (
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

          {step === 4 && !calificado && (
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
            Responde 3 preguntas para conocer si podemos atenderte.
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

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const score = calcularPuntaje(answers);
  const calificado = esClientePotencial(score);
  const waLink = buildWhatsAppLink(getWhatsAppText(answers));

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
              initial={{ width: "33%" }}
              animate={{ width: step >= 4 ? "100%" : `${(step / 3) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <CardContent className="p-8 md:p-12 min-h-[300px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h3 className="text-2xl font-medium text-white flex items-center gap-3">
                    <CheckCircle2 className="text-primary shrink-0" /> ¿Tienes pasaporte vigente?
                  </h3>
                  <RadioGroup onValueChange={(val) => setAnswers({ ...answers, pasaporte: val })} value={answers.pasaporte} className="grid gap-4">
                    {[{ value: "si", label: "Sí, lo tengo vigente" }, { value: "tramitando", label: "Estoy en trámite" }, { value: "no", label: "Aún no lo tengo" }].map((opt) => (
                      <div key={opt.value} onClick={() => setAnswers({ ...answers, pasaporte: opt.value })} className={`flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg border transition-colors cursor-pointer ${answers.pasaporte === opt.value ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/50"}`}>
                        <RadioGroupItem value={opt.value} id={`sp-${opt.value}`} />
                        <Label htmlFor={`sp-${opt.value}`} className="text-lg cursor-pointer flex-1">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button onClick={handleNext} disabled={!answers.pasaporte} className="w-full mt-8">
                    Siguiente <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h3 className="text-2xl font-medium text-white flex items-center gap-3">
                    <Plane className="text-primary shrink-0" /> ¿Cuándo planeas viajar?
                  </h3>
                  <RadioGroup onValueChange={(val) => setAnswers({ ...answers, cuando: val })} value={answers.cuando} className="grid gap-4">
                    {[{ value: "pronto", label: "En el próximo mes" }, { value: "6meses", label: "En los próximos 3 meses" }, { value: "sinplanes", label: "Sin planes concretos aún" }].map((opt) => (
                      <div key={opt.value} onClick={() => setAnswers({ ...answers, cuando: opt.value })} className={`flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg border transition-colors cursor-pointer ${answers.cuando === opt.value ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/50"}`}>
                        <RadioGroupItem value={opt.value} id={`st-${opt.value}`} />
                        <Label htmlFor={`st-${opt.value}`} className="text-lg cursor-pointer flex-1">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button onClick={handleNext} disabled={!answers.cuando} className="w-full mt-8">
                    Siguiente <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h3 className="text-2xl font-medium text-white flex items-center gap-3">
                    <MapPin className="text-primary shrink-0" /> ¿Tienes un destino definido?
                  </h3>
                  <RadioGroup onValueChange={(val) => setAnswers({ ...answers, destino: val })} value={answers.destino} className="grid gap-4">
                    {[{ value: "definido", label: "Sí, ya lo tengo decidido" }, { value: "pensando", label: "Tengo algunas opciones en mente" }, { value: "nodecidido", label: "No, necesito asesoría para elegir" }].map((opt) => (
                      <div key={opt.value} onClick={() => setAnswers({ ...answers, destino: opt.value })} className={`flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg border transition-colors cursor-pointer ${answers.destino === opt.value ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/50"}`}>
                        <RadioGroupItem value={opt.value} id={`sd-${opt.value}`} />
                        <Label htmlFor={`sd-${opt.value}`} className="text-lg cursor-pointer flex-1">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button onClick={handleNext} disabled={!answers.destino} className="w-full mt-8">
                    Ver resultado <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {step === 4 && calificado && (
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

              {step === 4 && !calificado && (
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
