'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/atoms/button';
import { Download, Loader2 } from 'lucide-react';
import { AttendancePDFDocument } from './attendance-pdf-document';
import { toast } from 'sonner';

interface AttendancePDFGeneratorProps {
    reservation: {
        id: string;
        date: Date;
        startTime: string;
        endTime: string;
        classroomName?: string;
        purpose?: string;
    };
    attendees: Array<{
        id: string;
        staffName: string;
        staffRole: string;
        status: 'presente' | 'ausente';
    }>;
    tasks?: Array<{
        id: string;
        description: string;
        status: 'pending' | 'completed';
    }>;
    institutionName?: string;
    variant?: 'default' | 'outline' | 'ghost';
    className?: string;
}

export function AttendancePDFGenerator({
    reservation,
    attendees,
    tasks,
    institutionName,
    variant = 'outline',
    className,
}: AttendancePDFGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const doc = (
                <AttendancePDFDocument
                    reservation={reservation}
                    attendees={attendees}
                    tasks={tasks}
                    institutionName={institutionName}
                />
            );

            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `asistencia-${reservation.id}-${new Date().getTime()}.pdf`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success('PDF descargado correctamente');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error al generar el PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={handleDownload}
            disabled={isGenerating}
            variant={variant}
            className={className}
            title="Descargar lista de asistencia en PDF"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline ml-2">Generando...</span>
                </>
            ) : (
                <>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">PDF</span>
                </>
            )}
        </Button>
    );
}
