export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20 text-foreground overflow-x-hidden">
      {/* Navigation - Ultra Minimalist Blur */}
      <header className="fixed top-0 z-50 w-full px-12 py-8 bg-transparent">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,101,209,0.4)]">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">Flip</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-16 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
            <Link href="#features" className="hover:text-primary transition-all">Sistemas</Link>
            <Link href="#preview" className="hover:text-primary transition-all">Vista</Link>
            <Link href="#pricing" className="hover:text-primary transition-all">Planes</Link>
          </nav>

          <Link 
            href="https://flip-v2-web.vercel.app/" 
            className="px-8 py-3 bg-foreground text-background text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all shadow-2xl"
          >
            Lanzar App
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* --- HERO SECTION: ANTIGRAVITY STYLE --- */}
        <section className="min-h-screen flex flex-col items-center justify-center relative px-6 overflow-hidden">
          {/* Advanced Orbital Background */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
            <div className="absolute w-[180%] aspect-square orbital-bg opacity-40 animate-spin-slow scale-150" />
            <div className="absolute w-[140%] aspect-square orbital-bg opacity-20 animate-reverse-spin-slow scale-110" />
            <div className="absolute w-[800px] h-[800px] bg-primary/10 rounded-full blur-[180px] animate-pulse" />
            <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
          </div>

          <div className="container mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Zap className="h-3 w-3 fill-primary" />
              New Era of Management
            </div>

            <h1 className="text-huge mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 drop-shadow-2xl">
              FUTuro <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/40">Conectado.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto font-medium leading-relaxed opacity-60">
              Coordinación institucional llevada al límite de la eficiencia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              <Link 
                href="https://flip-v2-web.vercel.app/" 
                className="group relative px-12 py-5 bg-primary text-primary-foreground font-black text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(0,101,209,0.3)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                   Empezar Ahora
                   <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Link>
              <Link 
                href="#tutorial" 
                className="px-12 py-5 border border-foreground/10 text-foreground font-black text-sm rounded-full hover:bg-foreground/5 transition-all"
              >
                Ver Tutorial
              </Link>
            </div>
          </div>
          
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
             <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
          </div>
        </section>

        {/* --- VIDEOTUTORIAL SECTION: IMPACT --- */}
        <section id="tutorial" className="py-60 px-6 relative overflow-hidden bg-foreground/5">
          <div className="container mx-auto">
             <div className="grid lg:grid-cols-2 gap-24 items-center">
                <div className="order-2 lg:order-1">
                   <div className="inline-flex items-center gap-2 mb-8 text-primary font-black uppercase tracking-[0.4em] text-[10px]">
                      <Play className="h-3 w-3 fill-primary" />
                      Domina Flip en 3 minutos
                   </div>
                   <h2 className="text-6xl sm:text-8xl font-black tracking-tighter mb-10 leading-[0.9]">Manual <br/>de Vuelo.</h2>
                   <p className="text-xl text-muted-foreground max-w-md mb-12 font-medium opacity-60 leading-relaxed">
                      Observa cómo la coordinación institucional trasciende hacia la simplicidad absoluta en nuestra guía de alta definición.
                   </p>
                   <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-full border border-primary/20 flex items-center justify-center group cursor-pointer hover:bg-primary hover:border-primary transition-all">
                         <Play className="h-5 w-5 fill-primary group-hover:fill-primary-foreground transition-colors" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Ver demo extendida</span>
                   </div>
                </div>
                
                <div className="order-1 lg:order-2 relative group">
                   <div className="aspect-video glass-card rounded-[3rem] overflow-hidden relative border border-foreground/5 shadow-2xl group-hover:scale-[1.02] transition-transform duration-700">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent opacity-40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="h-24 w-24 bg-background/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-2xl">
                            <Play className="h-8 w-8 fill-primary ml-1" />
                         </div>
                      </div>
                      {/* Decorative internal lines */}
                      <div className="absolute top-8 left-8 flex gap-2">
                         <div className="h-2 w-2 rounded-full bg-red-400/40" />
                         <div className="h-2 w-2 rounded-full bg-yellow-400/40" />
                         <div className="h-2 w-2 rounded-full bg-green-400/40" />
                      </div>
                   </div>
                   {/* Glow behind */}
                   <div className="absolute -inset-10 bg-primary/20 blur-[100px] -z-10 opacity-30 group-hover:opacity-50 transition-opacity" />
                </div>
             </div>
          </div>
        </section>

        {/* --- PRODUCT PILLARS --- */}
        <section id="features" className="py-60 px-6">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {[
                { 
                  title: "Gestión Fluida", 
                  desc: "Arquitectura diseñada para la velocidad absoluta. Sin esperas, sin fricción.",
                  icon: <Zap className="h-8 w-8" />,
                  color: "from-blue-500/20"
                },
                { 
                  title: "Integridad Total", 
                  desc: "Trazabilidad quirúrgica de cada recurso institucional en tiempo real.",
                  icon: <ShieldCheck className="h-8 w-8" />,
                  color: "from-primary/20"
                },
                { 
                  title: "Dashboard Pro", 
                  desc: "Control total mediante una interfaz utilitaria de alto impacto visual.",
                  icon: <BarChart3 className="h-8 w-8" />,
                  color: "from-indigo-500/20"
                }
              ].map((item, i) => (
                <div key={i} className="glass-card glow-border p-12 rounded-[3rem] group hover:-translate-y-2 transition-all duration-500">
                  <div className={`mb-10 h-16 w-16 rounded-2xl bg-gradient-to-br ${item.color} to-transparent flex items-center justify-center text-primary group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter mb-6">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium opacity-60">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- INNOVATION VIEW: APPLE STYLE PREVIEW --- */}
        <section id="preview" className="py-60 px-6 bg-muted/5 relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="container mx-auto text-center mb-32">
            <h2 className="text-5xl sm:text-7xl font-black tracking-tighter mb-8">La Vista del Éxito.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium opacity-60">
              Una plataforma diseñada para coordinadores que exigen lo mejor.
            </p>
          </div>
          
          <div className="container mx-auto max-w-6xl">
            <div className="relative group p-4 border border-foreground/5 rounded-[4rem] bg-foreground/5">
               <div className="bg-background rounded-[3rem] overflow-hidden aspect-video relative shadow-2xl border border-foreground/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-40" />
                  
                  {/* Mockup UI - Premium style */}
                  <div className="p-12 h-full flex flex-col gap-10">
                    <div className="flex justify-between items-center bg-foreground/5 p-6 rounded-3xl border border-foreground/5">
                      <div className="flex gap-4">
                        <div className="h-3 w-3 rounded-full bg-red-500/40" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
                        <div className="h-3 w-3 rounded-full bg-green-500/40" />
                      </div>
                      <div className="h-4 w-40 bg-foreground/10 rounded-full" />
                    </div>
                    
                    <div className="grid grid-cols-12 gap-10 flex-1">
                      <div className="col-span-3 bg-foreground/5 rounded-[2rem] border border-foreground/5" />
                      <div className="col-span-9 grid grid-rows-3 gap-8">
                        <div className="row-span-1 bg-primary/5 rounded-[2rem] border border-primary/10" />
                        <div className="row-span-2 bg-foreground/5 rounded-[2rem] border border-foreground/5" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] group-hover:backdrop-blur-0 transition-all duration-1000" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                     <div className="px-12 py-5 bg-primary text-primary-foreground rounded-full font-black text-sm shadow-2xl cursor-pointer hover:scale-105 transition-transform">
                        Explorar Interfaz en Vivo
                     </div>
                  </div>
               </div>
               
               {/* Decorative glow behind the preview */}
               <div className="absolute -inset-10 bg-primary/20 blur-[100px] -z-10 opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
          </div>
        </section>

        {/* --- CHANGELOG: MINIMALIST LIST --- */}
        <section id="changelog" className="py-60 px-6">
          <div className="container mx-auto max-w-4xl">
             <div className="flex items-end justify-between mb-24 border-b border-foreground/5 pb-12">
               <h2 className="text-6xl font-black tracking-tighter">Novedades.</h2>
               <div className="h-12 w-12 rounded-full border border-foreground/10 flex items-center justify-center">
                 <History className="h-5 w-5 opacity-40" />
               </div>
             </div>
             
             <div className="space-y-16">
               {[
                 { v: "v2.6.0", title: "Módulo de Alta Densidad", date: "Marzo 2026" },
                 { v: "v2.5.0", title: "Next.js 15 Engine", date: "Marzo 2026" },
                 { v: "v2.4.0", title: "Refactor de Préstamos", date: "Febrero 2026" }
               ].map((c, i) => (
                 <div key={i} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:translate-x-2 transition-transform cursor-default">
                    <div className="flex items-center gap-8">
                       <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">{c.v}</span>
                       <h4 className="text-4xl font-black tracking-tighter group-hover:text-primary transition-colors">{c.title}</h4>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground/40">{c.date}</span>
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* --- PRICING: CLEAN CARDS --- */}
        <section id="pricing" className="py-60 px-6 bg-foreground text-background relative overflow-hidden">
          <div className="container mx-auto text-center mb-32 relative z-10">
            <h2 className="text-huge mb-8 text-background">Precios.</h2>
            <p className="text-xl opacity-60 max-w-xl mx-auto font-medium">Inversión tecnológica sin complicaciones.</p>
          </div>
          
          <div className="container mx-auto max-w-6xl grid md:grid-cols-3 gap-8 relative z-10">
            {[
              { name: "Standard", price: "$0", feat: "Inventario básico, 50 recursos, 1 admin.", popular: false },
              { name: "Professional", price: "$49", feat: "Ilimitado, Préstamos, Multi-user, Soporte 24/7.", popular: true },
              { name: "Enterprise", price: "Custom", feat: "Multi-sede, API, Training, SLA dedicado.", popular: false }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`p-16 rounded-[4rem] border transition-all duration-700 flex flex-col ${
                  plan.popular 
                    ? "bg-primary border-primary text-primary-foreground scale-105" 
                    : "bg-background/5 border-background/10 text-background"
                }`}
              >
                <h3 className="text-2xl font-black tracking-tighter mb-2">{plan.name}</h3>
                <div className="text-6xl font-black tracking-tighter mb-10">{plan.price}</div>
                <p className="text-sm font-medium opacity-60 mb-12 flex-1 leading-relaxed">
                  {plan.feat}
                </p>
                <div className={`w-full py-5 rounded-full font-black text-sm text-center transition-all ${
                  plan.popular ? "bg-background text-foreground" : "bg-background/10 text-background border border-background/20 hover:bg-background/20"
                }`}>
                   Empezar
                </div>
              </div>
            ))}
          </div>
          
          {/* Subtle background text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-black text-background/5 -z-10 pointer-events-none select-none">
            FLIP
          </div>
        </section>

        {/* --- FINAL CTA --- */}
        <section className="py-80 px-6 text-center relative overflow-hidden">
           <div className="absolute inset-0 orbital-bg opacity-10 animate-spin-slow" />
           <div className="container mx-auto max-w-4xl relative z-10">
              <h2 className="text-huge mb-16 tracking-[0.02em]">LLEGAMOS <br/>AL FUTURO.</h2>
              <Link 
                href="https://flip-v2-web.vercel.app/" 
                className="inline-flex items-center gap-6 px-16 py-6 bg-primary text-primary-foreground font-black text-2xl rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_30px_60px_rgba(0,101,209,0.4)]"
              >
                Instalar Flip
                <ArrowRight className="h-8 w-8" />
              </Link>
           </div>
        </section>
      </main>

      <footer className="py-20 px-12 border-t border-foreground/5">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
          <div className="flex items-center gap-3 text-foreground/40">
            <Package className="h-5 w-5" />
            <span>© 2026 Flip OS</span>
          </div>
          <div className="flex gap-12">
            <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-primary transition-colors">Github</Link>
            <Link href="#" className="hover:text-primary transition-colors">Discord</Link>
          </div>
          <span>Built for the new web</span>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { 
  Package, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Layers, 
  Search,
  Calendar,
  History,
  Play
} from "lucide-react";
