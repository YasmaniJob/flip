export type Step = 'nivel' | 'institucion' | 'confirmacion';

export interface OnboardingData {
    nivel: 'primaria' | 'secundaria' | null;
    institution: {
        codigoModular: string;
        nombre: string;
        departamento: string;
        provincia: string;
        distrito: string;
        direccion?: string;
    } | null;
    isManual?: boolean;
}

export const STEPS: Step[] = ['nivel', 'institucion', 'confirmacion'];

export const STEP_META: Record<Step, { title: string; subtitle: string }> = {
    nivel: {
        title: '¿En qué nivel educativo enseñas?',
        subtitle: 'Esto nos ayuda a personalizar tu experiencia en Flip.',
    },
    institucion: {
        title: '¿Cuál es tu institución educativa?',
        subtitle: '',
    },
    confirmacion: {
        title: '¡Todo listo para empezar!',
        subtitle: 'Revisa que tu información sea correcta antes de configurar tu espacio.',
    },
};
