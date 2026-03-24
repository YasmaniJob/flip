import Link from "next/link";
import { 
  Package, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Layers, 
  Search,
  Calendar,
  Users,
  Play,
  History,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      {/* Ultra-minimalist Navigation */}
      <header className="fixed top-0 z-50 w-full px-8 py-6 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold tracking-tighter text-foreground uppercase">Flip</span>
          </div>
          
          <nav className="hidden sm:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
            <Link href="#features" className="hover:text-foreground transition-colors">Producto</Link>
            <Link href="#preview" className="hover:text-foreground transition-colors">Experiencia</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Precios</Link>
            <Link href="#changelog" className="hover:text-foreground transition-colors">Novedades</Link>
          </nav>

          <Link 
            href="https://flip-v2-web.vercel.app/" 
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-wider rounded-full hover:brightness-110 transition-all shadow-xl"
          >
            Acceder
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* --- HERO SECTION --- */}
        <section className="min-h-screen flex flex-col items-center justify-center relative px-6 overflow-hidden">
          {/* Orbital Particle Background */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[140%] aspect-square orbital-bg opacity-30 scale-150 animate-in fade-in zoom-in duration-1000" />
            <div className="absolute w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] animate-float-subtle" />
          </div>

          <div className="container mx-auto text-center max-w-5xl relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Package className="h-8 w-8 text-primary" />
              <span className="text-2xl font-black tracking-tighter text-foreground uppercase tracking-widest">Flip</span>
            </div>

            <h1 className="text-huge font-black tracking-tighter text-foreground mb-8 text-pretty max-w-[15ch] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
              Experimenta el control con el <span className="text-transparent bg-clip-text bg-gradient-to-br from-foreground via-foreground/90 to-primary/60 text-primary">Resource Manager</span> de próxima generación
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
              La plataforma definitiva para gestionar inventario, recursos y coordinación escolar de forma inteligente.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              <Link 
                href="https://flip-v2-web.vercel.app/" 
                className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground font-black text-sm rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,101,209,0.3)]"
              >
                <Package className="h-4 w-4" />
                Comenzar con Flip
              </Link>
              <Link 
                href="#tutorial" 
                className="w-full sm:w-auto px-10 py-4 bg-muted/20 backdrop-blur-md border border-foreground/5 text-foreground font-bold text-sm rounded-full hover:bg-muted/40 transition-all"
              >
                Ver Tutorial
              </Link>
            </div>
          </div>
        </section>

        {/* --- PRODUCT PILLARS --- */}
        <section id="features" className="py-40 px-6 border-t border-border/50">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 block">Construye el nuevo camino</span>
                <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-foreground mb-10 leading-[0.95]">
                  Integridad total en cada recurso.
                </h2>
                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed mb-12 font-medium">
                  Flip reinventa la gestión escolar con una arquitectura diseñada para la velocidad y la precisión absoluta. Nada se pierde, todo bajo un control impecable.
                </p>
                <div className="space-y-10">
                  {[
                    { title: "Inventario Centralizado", desc: "Control de activos en tiempo real con trazabilidad completa de cada movimiento.", icon: <Layers className="h-5 w-5" /> },
                    { title: "Préstamos Inteligentes", desc: "Sistema de reservas sin fricción para laptops, proyectores y espacios compartidos.", icon: <Calendar className="h-5 w-5" /> },
                    { title: "Dashboard Unificado", desc: "Toda la información operativa crítica en una sola vista profesional y utilitaria.", icon: <BarChart3 className="h-5 w-5" /> }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="mt-1 bg-muted p-3.5 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-foreground text-xl mb-2">{item.title}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-muted/30 rounded-[4rem] border border-border/50 overflow-hidden flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
                  <Package className="h-40 w-40 text-primary opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-1000" />
                  {/* Decorative orbital elements */}
                  <div className="absolute w-[85%] h-[85%] border border-primary/10 rounded-full animate-spin-slow" />
                  <div className="absolute w-[65%] h-[65%] border border-primary/5 rounded-full animate-reverse-spin-slow" />
                  <div className="absolute w-[45%] h-[45%] border border-primary/20 rounded-full opacity-20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- VIDEO TUTORIAL --- */}
        <section id="tutorial" className="py-40 px-6 bg-foreground text-background overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute inset-0 orbital-bg grayscale invert" />
          </div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-5">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 block">Manual de vuelo</span>
                <h2 className="text-5xl sm:text-6xl font-black tracking-tighter mb-8 leading-[0.95]">
                  Aprende a dominar Flip.
                </h2>
                <p className="text-lg text-muted-foreground max-w-sm mb-12">
                  Mira cómo transformar la coordinación de tu colegio en menos de 5 minutos con nuestra guía interactiva.
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full border border-background/20 flex items-center justify-center">
                    <Play className="h-4 w-4 fill-background" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest">Ver demo extendida</span>
                </div>
              </div>
              <div className="lg:col-span-7">
                <div className="aspect-video bg-muted/10 rounded-[3rem] border border-background/10 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent opacity-20" />
                  <div className="h-20 w-20 bg-background text-foreground rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer">
                    <Play className="h-6 w-6 ml-1 fill-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- DASHBOARD PREVIEW --- */}
        <section id="preview" className="py-40 px-6 bg-muted/20">
          <div className="container mx-auto text-center mb-24">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 block">Experiencia de usuario</span>
            <h2 className="text-huge font-black tracking-tighter text-foreground mb-6">Diseñado para el despegue.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Una interfaz utilitaria, veloz y elegante que empodera a los coordinadores escolares para actuar con precisión quirúrgica.
            </p>
          </div>
          <div className="container mx-auto max-w-6xl">
            <div className="bg-background border border-border/50 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] overflow-hidden aspect-video relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90 flex flex-col items-center justify-end p-16 translate-y-6 group-hover:translate-y-0 transition-transform duration-700">
                <div className="bg-primary text-primary-foreground px-10 py-4 rounded-full font-black text-sm shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform">
                  <Search className="h-4 w-4" />
                  Explorar la Interfaz
                </div>
              </div>
              {/* Mockup content representation */}
              <div className="p-12 grid grid-cols-12 gap-8 h-full opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000">
                <div className="col-span-3 bg-muted/50 rounded-3xl border border-border/40" />
                <div className="col-span-9 space-y-8">
                  <div className="h-24 bg-muted/50 rounded-3xl border border-border/40" />
                  <div className="grid grid-cols-3 gap-8">
                    <div className="h-48 bg-muted/50 rounded-3xl border border-border/40 shadow-sm" />
                    <div className="h-48 bg-muted/50 rounded-3xl border border-border/40 shadow-sm" />
                    <div className="h-48 bg-muted/50 rounded-3xl border border-border/40 shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- CHANGELOG SECTION --- */}
        <section id="changelog" className="py-40 px-6 border-t border-border/50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-20">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 block">Evolución constante</span>
              <h2 className="text-5xl font-black tracking-tighter text-foreground">Bitácora de cambios.</h2>
            </div>
            <div className="space-y-4">
              {[
                { version: "v2.4.0", date: "Marzo 2024", title: "Refactor de Préstamos", updates: ["Nuevo motor de búsqueda ultra rápido", "Filtros por estado de equipo", "Mejoras en UI para móviles"] },
                { version: "v2.3.5", date: "Febrero 2024", title: "Integridad de Datos", updates: ["Auditoría completa de movimientos", "Nuevos reportes exportables en PDF", "Corrección de concurrencia en reservas"] },
                { version: "v2.2.0", date: "Enero 2024", title: "Lanzamiento Dashboard", updates: ["Primera versión del panel centralizado", "Soporte multi-sede", "Dashboard optimizado para coordinadores"] }
              ].map((change, i) => (
                <div key={i} className="group p-8 border border-border/50 rounded-[2rem] hover:bg-muted/30 transition-all duration-500">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <History className="h-5 w-5 text-primary" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{change.version} — {change.date}</span>
                        <h4 className="text-2xl font-black tracking-tighter text-foreground">{change.title}</h4>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                       Actualizado
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {change.updates.map((u, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary opacity-40" />
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PRICING SECTION --- */}
        <section id="pricing" className="py-40 px-6 bg-muted/10">
          <div className="container mx-auto text-center mb-24">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 block">Inversión en eficiencia</span>
            <h2 className="text-6xl font-black tracking-tighter text-foreground mb-6 leading-[0.9]">Planes para cada institución.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
              Escala tu infraestructura educativa con transparencia total y sin costos ocultos.
            </p>
          </div>
          <div className="container mx-auto max-w-6xl grid md:grid-cols-3 gap-8">
            {[
              { 
                name: "Básico", 
                price: "$0", 
                desc: "Para pequeñas escuelas que inician su digitalización.",
                features: ["Gestión de inventario básico", "Hasta 50 recursos", "1 usuario administrador", "Soporte vía email"],
                cta: "Empezar Gratis",
                popular: false
              },
              { 
                name: "Pro", 
                price: "$49", 
                desc: "La solución completa para instituciones en crecimiento.",
                features: ["Inventario ilimitado", "Préstamos inteligentes", "Multi-usuario", "Reportes avanzados PDF", "Soporte prioritario 24/7"],
                cta: "Probar Versión Pro",
                popular: true
              },
              { 
                name: "Institucional", 
                price: "Custom", 
                desc: "Para redes educativas y universidades de gran escala.",
                features: ["Soporte multi-sede", "API de integración", "Despliegue On-premise", "Capacitación dedicada", "SLA personalizado"],
                cta: "Contactar Ventas",
                popular: false
              }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`relative p-10 rounded-[3rem] border transition-all duration-700 flex flex-col ${
                  plan.popular 
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_40px_80px_rgba(0,101,209,0.25)] scale-105 z-10" 
                    : "bg-background border-border/50 hover:border-primary/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-full">
                    RECOMENDADO
                  </div>
                )}
                <div className="mb-10">
                  <h3 className="text-2xl font-black tracking-tighter mb-4">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest opacity-60`}>
                      {plan.price !== "Custom" ? "/ mes" : ""}
                    </span>
                  </div>
                  <p className={`text-sm font-medium leading-relaxed opacity-80 min-h-[3rem]`}>
                    {plan.desc}
                  </p>
                </div>
                <div className="space-y-6 mb-12 flex-1">
                  {plan.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-4 text-sm font-bold tracking-tight">
                      <CheckCircle2 className={`h-4 w-4 ${plan.popular ? "text-primary-foreground" : "text-primary"} opacity-60`} />
                      {feat}
                    </div>
                  ))}
                </div>
                <Link 
                  href="#" 
                  className={`w-full py-5 rounded-full font-black text-sm text-center transition-all ${
                    plan.popular 
                      ? "bg-background text-foreground hover:scale-105 shadow-2xl" 
                      : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* --- TECHNICAL EXCELLENCE --- */}
        <section id="tech" className="py-40 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 mb-12 border-b border-border/50 pb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground">Construido con Integridad</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-20">
              {[
                { 
                  title: "Rendimiento por diseño", 
                  desc: "Cada click en Flip es instantáneo. Optimizamos cada milisegundo para que el tiempo escolar se enfoque en lo pedagógico.",
                  icon: <Zap className="h-6 w-6 text-primary" />
                },
                { 
                  title: "Seguridad absoluta", 
                  desc: "Tus datos están protegidos con estándares de encriptación modernos. La privacidad de la institución no es negociable.",
                  icon: <ShieldCheck className="h-6 w-6 text-primary" />
                },
                { 
                  title: "Siempre disponible", 
                  desc: "Flip funciona donde tú estés. En la web, en el aula o en movimiento. Conectividad sin interrupciones ni tiempos muertos.",
                  icon: <Layers className="h-6 w-6 text-primary" />
                },
                { 
                  title: "Claridad de datos", 
                  desc: "Reportes automáticos, precisos y listos para auditorías. Toma decisiones basadas en hechos reales y data estructurada.",
                  icon: <BarChart3 className="h-6 w-6 text-primary" />
                }
              ].map((item, i) => (
                <div key={i} className="space-y-6 group">
                  <h3 className="text-2xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-40 px-6 relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 -z-10 orbital-bg opacity-20 animate-pulse pointer-events-none grayscale invert" />
          <div className="container mx-auto text-center max-w-4xl relative z-10">
            <h2 className="text-6xl sm:text-7xl font-black tracking-tighter mb-12 leading-[0.9]">
              ¿Listo para el despegue?
            </h2>
            <Link 
              href="https://flip-v2-web.vercel.app/" 
              className="px-14 py-5 bg-background text-foreground font-black text-xl rounded-full hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-6 shadow-2xl"
            >
              Comenzar prueba gratuita
              <ArrowRight className="h-6 w-6" />
            </Link>
            <p className="mt-12 text-sm font-bold uppercase tracking-[0.3em] opacity-40">Sin tarjeta de crédito. Setup instantáneo.</p>
          </div>
        </section>
      </main>

      {/* --- FULL STRUCTURED FOOTER --- */}
      <footer className="bg-muted/10 border-t border-border/50 pt-32 pb-16 px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-32">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-10">
                <Package className="h-8 w-8 text-primary" />
                <span className="text-xl font-black tracking-tighter uppercase text-foreground">Flip</span>
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed font-bold lowercase tracking-tight">
                Optimizando la infraestructura educativa mediante software de élite. Experimenta el futuro de la coordinación hoy.
              </p>
            </div>
            
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-16">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground mb-10">Producto</h4>
                <ul className="space-y-5 text-sm font-bold text-muted-foreground/60 tracking-tight">
                  <li><Link href="#features" className="hover:text-primary transition-colors">Funciones</Link></li>
                  <li><Link href="#preview" className="hover:text-primary transition-colors">Experiencia</Link></li>
                  <li><Link href="#tech" className="hover:text-primary transition-colors">Integridad</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground mb-10">Recursos</h4>
                <ul className="space-y-5 text-sm font-bold text-muted-foreground/60 tracking-tight">
                  <li><Link href="#" className="hover:text-primary transition-colors">Docs</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Soporte</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Términos</Link></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground mb-10">Conectar</h4>
                <ul className="space-y-5 text-sm font-bold text-muted-foreground/60 tracking-tight">
                  <li><Link href="#" className="hover:text-primary transition-colors">Twitter</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Discord</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Github</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-16 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
            <span>© 2026 Flip. Todos los derechos reservados.</span>
            <div className="flex items-center gap-4">
               <span>Hecho con integridad por el equipo de Flip</span>
               <span className="h-1 w-1 bg-primary/20 rounded-full" />
               <span className="text-primary/40">Built the new way</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
