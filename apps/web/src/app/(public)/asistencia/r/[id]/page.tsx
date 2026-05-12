import { db } from '@/lib/db';
import { classroomReservations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { AttendanceIdentificationForm } from '@/features/reservations/components/attendance-identification-form';
import { AuthenticatedCheckIn } from '@/features/reservations/components/authenticated-check-in';
import { CheckCircle2, Calendar, Clock, MapPin, Users, QrCode } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const reservation = await db.query.classroomReservations.findFirst({
        where: eq(classroomReservations.id, id),
    });

    return {
        title: `Asistencia: ${reservation?.title || 'Taller BeeClass'}`,
        description: 'Registra tu asistencia al taller pedagógico de BeeClass',
    };
}

export default async function PublicAttendancePage({ params }: PageProps) {
    const { id } = await params;
    
    // Check session for authenticated users
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Fetch reservation details server-side
    const reservation = await db.query.classroomReservations.findFirst({
      where: eq(classroomReservations.id, id),
      with: {
          classroom: true,
          staff: true,
      }
    });

    if (!reservation) {
        notFound();
    }

    const reservationDate = new Date(reservation.createdAt || new Date()).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <div className="min-h-screen bg-[#fdfdfd] dark:bg-[#0a0a0a] flex flex-col items-center py-12 px-6 sm:px-8">
            {/* Minimal Header */}
            <div className="w-full max-w-5xl flex items-center justify-between mb-16 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-none border border-primary">
                        <QrCode className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase leading-none">FLIP</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-50">
                            Asistencia Digital Institucional
                        </p>
                    </div>
                </div>
                
                {!session && (
                    <Link 
                        href="/login" 
                        className="h-10 px-8 border border-border rounded-none flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95 shadow-none"
                    >
                        Ya tengo cuenta
                    </Link>
                )}
            </div>

            <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                {/* Information Column */}
                <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-none">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Identificación Obligatoria</span>
                        </div>
                        <h2 className="text-5xl sm:text-6xl font-black text-foreground uppercase tracking-tighter leading-[0.85]">
                            {reservation.title || 'Sesión de Aprendizaje'}
                        </h2>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-md">
                            Para registrar tu asistencia, por favor confirma tus datos en el formulario. Si ya tienes cuenta, el sistema los reconocerá automáticamente.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-start gap-5 p-6 bg-card border border-border/60 rounded-none group hover:border-primary/20 transition-all shadow-none">
                            <div className="w-12 h-12 bg-muted/50 rounded-none flex items-center justify-center group-hover:bg-primary/5 transition-colors border border-border/20">
                                <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Fecha del evento</p>
                                <p className="text-lg font-black text-foreground uppercase tracking-tight leading-none">{reservationDate}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5 p-6 bg-card border border-border/60 rounded-none group hover:border-primary/20 transition-all shadow-none">
                            <div className="w-12 h-12 bg-muted/50 rounded-none flex items-center justify-center group-hover:bg-primary/5 transition-colors border border-border/20">
                                <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Ubicación física</p>
                                <p className="text-lg font-black text-foreground uppercase tracking-tight leading-none">{reservation.classroom?.name || 'Aula Designada'}</p>
                            </div>
                        </div>

                        {reservation.staff && (
                            <div className="flex items-start gap-5 p-6 bg-card border border-border/60 rounded-none group hover:border-primary/20 transition-all shadow-none">
                                <div className="w-12 h-12 bg-muted/50 rounded-none flex items-center justify-center group-hover:bg-primary/5 transition-colors border border-border/20">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1.5">Responsable</p>
                                    <p className="text-lg font-black text-foreground uppercase tracking-tight leading-none">{reservation.staff.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Always show the Form */}
                <div className="lg:sticky lg:top-12">
                    <AttendanceIdentificationForm 
                        reservationId={id} 
                        initialData={session?.user ? {
                            dni: session.user.dni || '',
                            name: session.user.name || '',
                            email: session.user.email || '',
                        } : undefined}
                    />
                </div>
            </main>

            <footer className="mt-32 pb-12 w-full max-w-5xl text-center">
                <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-[0.5em]">
                    FLIP INNOVACIÓN &bull; beeclass.io &bull; {new Date().getFullYear()}
                </p>
            </footer>
        </div>
    );
}
