import Link from "next/link";
import { Package, ArrowRight, Download } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      {/* Minimalist Navigation */}
      <header className="fixed top-0 z-50 w-full px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-foreground rounded-sm p-1">
              <Package className="h-5 w-5 text-background" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Flip</span>
          </div>
          
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Producto</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Blog</Link>
          </nav>

          <Link 
            href="https://flip-v2-web.vercel.app/" 
            className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-sm font-bold rounded-full hover:bg-foreground/90 transition-all"
          >
            Entrar
            <Download className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 pt-20">
        {/* Orbital Particle Background */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[1200px] h-[1200px] orbital-bg animate-pulse opacity-40" />
          <div className="absolute w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-float-subtle" />
        </div>

        <div className="container mx-auto text-center max-w-5xl relative z-10">
          {/* Logo Badge */}
          <div className="flex items-center justify-center gap-2.5 mb-10 opacity-80 scale-110">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground uppercase tracking-widest">Flip</span>
          </div>

          <h1 className="text-huge font-black text-foreground mb-8 text-pretty">
            Experience control with the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">next-generation</span> LMS
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            La plataforma definitiva para gestionar inventario, recursos y coordinación escolar de forma inteligente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link 
              href="https://flip-v2-web.vercel.app/" 
              className="w-full sm:w-auto px-8 py-3.5 bg-foreground text-background font-bold rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              Comenzar ahora
              <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#" 
              className="w-full sm:w-auto px-8 py-3.5 bg-muted/50 border border-border/50 text-foreground font-bold rounded-full hover:bg-muted transition-all"
            >
              Explorar funciones
            </Link>
          </div>
        </div>
      </main>

      {/* Minimalist Footer Overlay */}
      <footer className="fixed bottom-0 w-full px-6 py-6 pointer-events-none">
        <div className="container mx-auto flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
          <span>Flip © 2026</span>
          <div className="flex gap-4 pointer-events-auto">
            <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Github</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
