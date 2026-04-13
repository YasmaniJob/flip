'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/atoms/button';
import { QrCode, Copy, Check, Download, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

interface QRAttendanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservationId: string;
    title?: string;
}

export function QRAttendanceDialog({ open, onOpenChange, reservationId, title }: QRAttendanceDialogProps) {
    const [copied, setCopied] = useState(false);
    
    // Generate full URL for QR
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const attendanceUrl = `${baseUrl}/asistencia/r/${reservationId}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(attendanceUrl);
            setCopied(true);
            toast.success('Enlace copiado al portapapeles');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Error al copiar el enlace');
        }
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `qr-asistencia-${reservationId}.png`;
                link.click();
                URL.revokeObjectURL(url);
                toast.success('QR descargado correctamente');
            });
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                showCloseButton={false}
                className="sm:max-w-xl p-0 overflow-hidden border border-border bg-background rounded-lg"
            >
                <DialogTitle className="sr-only">Código QR de Asistencia</DialogTitle>
                <DialogDescription className="sr-only">
                    Escanea este código QR para registrar tu asistencia al taller
                </DialogDescription>

                {/* Header */}
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <QrCode className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-tight text-foreground">
                                Código QR de Asistencia
                            </h3>
                            {title && (
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                    {title}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* QR Code Display */}
                <div className="p-10 flex flex-col items-center gap-6">
                    <div className="p-8 bg-white rounded-xl border border-border shadow-sm">
                        <QRCode
                            id="qr-code-svg"
                            value={attendanceUrl}
                            size={240}
                            level="H"
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                    </div>

                    <div className="w-full space-y-3">
                        <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-[0.2em]">
                            Enlace de Asistencia
                        </p>
                        <div className="flex items-center gap-2 p-3 bg-muted/10 border border-border rounded-md">
                            <code className="flex-1 text-[11px] font-mono text-foreground truncate">
                                {attendanceUrl}
                            </code>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCopyLink}
                                className="h-8 w-8 p-0 shrink-0 hover:bg-muted"
                                title="Copiar enlace"
                            >
                                {copied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="w-full pt-2 space-y-3">
                        <Button
                            onClick={handleDownloadQR}
                            variant="outline"
                            className="w-full h-11 font-black text-[10px] uppercase tracking-[0.2em] gap-2 border-border hover:bg-muted rounded-sm"
                        >
                            <Download className="h-4 w-4" />
                            Descargar QR como imagen
                        </Button>
                        
                        <p className="text-[10px] text-center text-muted-foreground/50 font-medium px-6 leading-relaxed">
                            Los participantes pueden escanear este código para registrar su asistencia automáticamente
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
