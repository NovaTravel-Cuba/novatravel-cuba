import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Phone, ShieldCheck, CreditCard, ChevronDown, Check, Info, Plane, MessageCircle, Moon, Sun } from "lucide-react";

function useModalHistory(isOpen: boolean, onClose: () => void) {
  const pushed = useRef(false);
  const ignoreNext = useRef(false);

  useEffect(() => {
    if (isOpen) {
      history.pushState({ novModal: true }, "");
      pushed.current = true;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && pushed.current) {
      pushed.current = false;
      ignoreNext.current = true;
      history.back();
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = () => {
      if (ignoreNext.current) {
        ignoreNext.current = false;
        return;
      }
      if (pushed.current) {
        pushed.current = false;
        onClose();
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [onClose]);
}

function useTheme() {
  const [light, setLight] = useState(() => {
    return localStorage.getItem("novatravel-theme") === "light";
  });

  useEffect(() => {
    if (light) {
      document.documentElement.classList.add("light");
      localStorage.setItem("novatravel-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("novatravel-theme", "dark");
    }
  }, [light]);

  return { light, toggle: () => setLight((v) => !v) };
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { destinations } from "./data/destinations";
import { Quiz, QuizModal } from "./components/sections/Quiz";
import heroImg from "./assets/hero.png";

const queryClient = new QueryClient();

function Navbar({ onContact, lightMode, onToggleTheme }: { onContact: () => void; lightMode: boolean; onToggleTheme: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-md py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <a href="#" className="text-2xl font-serif font-bold text-foreground tracking-wide">
          NovaTravel <span className="text-primary">✈</span>
        </a>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <a href="#destinos" className="text-muted-foreground hover:text-foreground transition-colors">Destinos</a>
          <a href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors">Por qué nosotros</a>
          <a href="#quiz" className="text-muted-foreground hover:text-foreground transition-colors">Evaluación</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          <a href="#pagos" className="text-muted-foreground hover:text-foreground transition-colors">Pagos</a>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-border bg-background/40 hover:bg-secondary transition-colors"
            aria-label={lightMode ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
          >
            {lightMode ? <Moon className="w-4 h-4 text-foreground" /> : <Sun className="w-4 h-4 text-foreground" />}
          </button>
          <Button onClick={onContact} className="hidden sm:inline-flex shadow-lg shadow-primary/20">
            Contactar
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}

function Hero({ onContact }: { onContact: () => void }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]);

  return (
    <section className="relative min-h-[100dvh] flex items-center pt-20 overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/60 bg-gradient-to-b from-transparent to-background z-10" />
        <img src={heroImg} alt="Vista aérea nocturna desde ventana de avión" className="w-full h-full object-cover" />
      </motion.div>

      <div className="container mx-auto px-6 md:px-12 relative z-20 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8 text-primary font-medium text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span>Atención 24/7 Disponible</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-foreground leading-[1.1] mb-6">
            Tu puerta al <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">mundo</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
            Agencia de servicios migratorios. Gestionamos visas, boletos aéreos y contratos de trabajo con acompañamiento personalizado de inicio a fin.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <Button size="lg" onClick={onContact} className="w-full sm:w-auto text-lg h-14 px-8 shadow-xl shadow-primary/20">
              Consultar disponibilidad
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 bg-background/20 backdrop-blur-sm border-border hover:bg-background/40" asChild>
              <a href="#destinos">Ver Destinos</a>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
            <div>
              <div className="text-3xl font-bold text-foreground mb-1">17+</div>
              <div className="text-sm text-muted-foreground">Destinos activos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Con comprobantes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Soporte continuo</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </div>
    </section>
  );
}

const CATEGORIES = [
  { key: "todos", label: "Todos" },
  { key: "visado", label: "Visados" },
  { key: "boleto", label: "Boletos aéreos" },
  { key: "contrato", label: "Contratos laborales" },
  { key: "traslado", label: "Traslados" },
] as const;

function Destinations({ onContact }: { onContact: (dest?: string) => void }) {
  const [selectedDest, setSelectedDest] = useState<typeof destinations[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState<"todos" | "visado" | "boleto" | "contrato" | "traslado">("todos");
  const closeDestModal = () => setSelectedDest(null);
  useModalHistory(!!selectedDest, closeDestModal);

  const filtered = activeCategory === "todos"
    ? destinations
    : destinations.filter((d) => d.category === activeCategory);

  return (
    <section id="destinos" className="py-24 px-6 md:px-12 relative">
      <div className="container mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Nuestros Destinos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Ofrecemos trámites de visado, boletos aéreos y contratos de trabajo para los destinos más solicitados. Todos los servicios incluyen acompañamiento personalizado.
          </p>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  activeCategory === cat.key
                    ? "bg-primary text-background border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="bg-card hover:bg-card/80 border-border transition-all cursor-pointer group h-full overflow-hidden"
                onClick={() => setSelectedDest(dest)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={`https://flagcdn.com/w640/${dest.flagCode}.jpg`}
                    alt={`Bandera de ${dest.country}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-primary bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {dest.type}
                    </span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {dest.country}
                  </h3>
                  <div className="text-base font-serif text-primary/90">
                    {typeof dest.price === "number" ? `USD ${dest.price.toLocaleString()}` : dest.price}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedDest} onOpenChange={(open) => !open && closeDestModal()}>
        <DialogContent className="sm:max-w-lg bg-card border-border p-0 overflow-hidden">
          {selectedDest && (
            <>
              <div className="relative h-40 overflow-hidden">
                <img
                  src={`https://flagcdn.com/w640/${selectedDest.flagCode}.jpg`}
                  alt={`Bandera de ${selectedDest.country}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-card" />
                <div className="absolute bottom-4 left-6">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-serif text-foreground">
                      {selectedDest.country}
                    </DialogTitle>
                    <DialogDescription className="text-primary font-bold text-2xl pt-1">
                      {typeof selectedDest.price === "number" ? `USD ${selectedDest.price.toLocaleString()}` : selectedDest.price}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{selectedDest.type} · {selectedDest.duration}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estructura de pago</div>
                    <div className="font-medium text-foreground text-sm">{selectedDest.paymentStructure}</div>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tiempo estimado</div>
                    <div className="font-medium text-foreground text-sm">{selectedDest.duration}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <Check className="text-primary w-5 h-5" /> Qué incluye
                  </h4>
                  <ul className="space-y-2">
                    {selectedDest.included.map((item, i) => (
                      <li key={i} className="text-muted-foreground text-sm flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedDest.requirements && selectedDest.requirements.length > 0 && (
                  <div>
                    <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                      <Check className="text-primary w-5 h-5" /> Requisitos
                    </h4>
                    <ul className="space-y-2">
                      {selectedDest.requirements.map((item, i) => (
                        <li key={i} className="text-muted-foreground text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedDest.nota && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm text-primary/90">
                    <strong>Nota:</strong> {selectedDest.nota}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedDest(null);
                      const info = `${selectedDest.country} — ${selectedDest.type} (${typeof selectedDest.price === "number" ? `USD ${selectedDest.price.toLocaleString()}` : selectedDest.price})`;
                      onContact(info);
                    }}
                    className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1aaa52] text-white font-semibold py-3.5 px-6 rounded-lg transition-colors shadow-lg text-base"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Consultar por WhatsApp
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function WhyUs() {
  const features = [
    { title: "Soporte 24/7", desc: "Asistencia continua vía WhatsApp en cada etapa del proceso.", icon: Phone },
    { title: "Abogados Migratorios", desc: "Especialistas legales garantizando la viabilidad de tus trámites.", icon: ShieldCheck },
    { title: "Pagos Seguros", desc: "Transacciones transparentes y 100% de los pagos con comprobante.", icon: CreditCard },
    { title: "Gestión Completa", desc: "Nos encargamos de todo el papeleo y reservas necesarias.", icon: Check },
    { title: "Sin Cargos Ocultos", desc: "Precios claros desde el primer día. Pagas lo acordado.", icon: Info },
    { title: "17+ Destinos", desc: "Amplia red de contactos y opciones a nivel mundial.", icon: Plane },
  ];

  return (
    <section id="beneficios" className="py-24 px-6 md:px-12 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-6">Por qué elegir NovaTravel</h2>
          <p className="text-lg text-muted-foreground">
            Tu tranquilidad es nuestra prioridad. Ofrecemos un servicio profesional, transparente y respaldado por expertos legales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-transparent border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    { q: "¿El precio incluye todo?", a: "Sí, nuestros precios incluyen todos los servicios mencionados. No hay cargos ocultos ni sorpresas." },
    { q: "¿Es seguro el proceso?", a: "Totalmente seguro. Todos los pagos realizados emiten un comprobante oficial y trabajamos bajo estrictos estándares de confidencialidad." },
    { q: "¿La visa está garantizada?", a: "Las visas dependen de los consulados, pero nuestro equipo de abogados especializados asegura que tu perfil y documentación tengan las mayores probabilidades de éxito." },
    { q: "¿Cuándo debo pagar?", a: "Depende del país y el trámite. Para la mayoría de las visas es 50% al iniciar y 50% al finalizar. Boletos aéreos requieren pago íntegro." },
    { q: "¿Qué pasa si me falta un requisito?", a: "No te preocupes, te orientamos paso a paso sobre cómo conseguir o sustituir la documentación faltante según la ley." },
    { q: "¿Hacen devoluciones?", a: "Una vez iniciado el proceso consular o emitido un boleto, no hay devoluciones, ya que los fondos se utilizan en los gastos del trámite." },
    { q: "¿Trabajan con urgencias?", a: "Sí, dependiendo del trámite. Contáctanos y evaluaremos la posibilidad de agilizar tu caso." },
  ];

  return (
    <section id="faq" className="py-24 px-6 md:px-12">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-6">Preguntas Frecuentes</h2>
          <p className="text-lg text-muted-foreground">
            Resolvemos tus dudas antes de comenzar el proceso.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-lg bg-card px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:text-primary transition-colors py-6">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function Payments({ onContact }: { onContact: () => void }) {
  return (
    <section id="pagos" className="py-24 px-6 md:px-12 bg-secondary/30 relative">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-10">
          <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Métodos de Pago</h2>
          <p className="text-lg text-muted-foreground">
            Aceptamos múltiples vías para facilitarte el proceso. <strong className="text-foreground font-medium">Importante:</strong> Ningún trámite inicia sin la confirmación del pago correspondiente.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: "💸", name: "Zelle", desc: "Transferencia instantánea" },
            { icon: "💳", name: "PayPal", desc: "El cliente asume comisiones de la plataforma" },
            { icon: "💵", name: "Efectivo USD", desc: "Entrega presencial según disponibilidad" },
            { icon: "🇨🇺", name: "CUP", desc: "Aplica un 5% de recargo sobre el valor del USD" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">{m.icon}</div>
              <div>
                <div className="font-bold text-foreground">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card/50 border border-border rounded-lg p-5 flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Todos los pagos emiten un <strong className="text-foreground">comprobante digital oficial</strong> de NovaTravel. Política de cero cargos ocultos en todo el proceso.
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer({ onContact }: { onContact: () => void }) {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="text-3xl font-serif font-bold text-foreground">
            NovaTravel <span className="text-primary">✈</span>
          </div>
          <div className="flex gap-6 text-muted-foreground">
            <a href="#destinos" className="hover:text-primary transition-colors">Destinos</a>
            <a href="#beneficios" className="hover:text-primary transition-colors">Servicios</a>
            <a href="#quiz" className="hover:text-primary transition-colors">Evaluación</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-8">
          <p>© {new Date().getFullYear()} NovaTravel · Servicios Migratorios Internacionales</p>
          <p className="mt-2 text-xs opacity-70">Operando con seguridad y transparencia.</p>
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp({ onContact }: { onContact: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring" }}
      onClick={onContact}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center group"
      aria-label="Contactar por WhatsApp"
    >
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30"></div>
      <Phone className="w-7 h-7 relative z-10" />
    </motion.button>
  );
}

function FloatingTelegram() {
  const [tooltip, setTooltip] = useState(false);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.3, type: "spring" }}
      className="fixed bottom-24 right-6 z-50 flex items-center gap-2"
    >
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-background border border-border text-foreground text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
        >
          💬 Chatear con Nova IA
        </motion.div>
      )}
      <a
        href="https://t.me/Asistente_Novatravel_Bot"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chatear con el asistente de IA en Telegram"
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        className="relative bg-[#229ED9] hover:bg-[#1a8bbf] text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full bg-[#229ED9] animate-ping opacity-25"></div>
        <svg viewBox="0 0 24 24" className="w-7 h-7 relative z-10 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.67l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.889z"/>
        </svg>
      </a>
    </motion.div>
  );
}

function Home() {
  const [quizOpen, setQuizOpen] = useState(false);
  const [destContext, setDestContext] = useState<string | null>(null);
  const { light, toggle: toggleTheme } = useTheme();

  const closeQuiz = () => { setQuizOpen(false); setDestContext(null); };
  useModalHistory(quizOpen, closeQuiz);

  const openQuiz = (dest?: string) => {
    setDestContext(dest ?? null);
    setQuizOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-background font-sans selection:bg-primary/30 selection:text-foreground">
      <Navbar onContact={() => openQuiz()} lightMode={light} onToggleTheme={toggleTheme} />
      <Hero onContact={() => openQuiz()} />
      <Destinations onContact={openQuiz} />
      <WhyUs />
      <Quiz />
      <Faq />
      <Payments onContact={() => openQuiz()} />
      <Footer onContact={() => openQuiz()} />
      <FloatingWhatsApp onContact={() => openQuiz()} />
      <FloatingTelegram />

      <QuizModal
        open={quizOpen}
        onClose={closeQuiz}
        destinationContext={destContext}
      />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={() => (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-white">
          <h1 className="text-4xl font-serif">404 - Página no encontrada</h1>
          <Button asChild><a href="/">Volver al inicio</a></Button>
        </div>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
