"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X, Download, FileSpreadsheet, UploadCloud, ChevronRight, Loader2 } from "lucide-react";
import { CreateStaffInput } from "@flip/shared";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStaff } from "../hooks/use-staff";

// ─── Constants & Types ────────────────────────────────────────────────────────

interface ImportStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const TH = "px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60";

const INSTRUCTIONS = [
    "Descarga la plantilla oficial.",
    "Completa los datos.",
    "Sube el archivo Excel (.xlsx).",
    "Verifica la vista previa.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function exportTemplate() {
    // Dynamic import de XLSX solo cuando se necesita
    const XLSX = await import('xlsx');
    
    const rows = [["Nombre", "DNI", "Email", "Telefono", "Rol"]];
    rows.push(["Director Ejemplo", "10000001", "director@escuela.edu.pe", "900000001", "admin"]);
    rows.push(["Promotor Innovación", "10000002", "pip@escuela.edu.pe", "900000002", "pip"]);
    for (let i = 3; i <= 5; i++) {
        rows.push([`Docente Ejemplo ${i}`, `${10000000 + i}`, `docente${i}@escuela.edu.pe`, `9${String(i).padStart(8, "0")}`, "docente"]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla_personal_flip.xlsx");
}

function parseRole(raw: any): "docente" | "pip" | "admin" | "superadmin" {
    const r = String(raw || "").toLowerCase().trim();
    if (["admin", "superadmin", "pip"].includes(r)) return r as any;
    return "docente";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportStaffDialog({ open, onOpenChange }: ImportStaffDialogProps) {
    const { bulkCreateStaff } = useStaff();
    const [submitting,   setSubmitting]   = useState(false);
    const [previewData,  setPreviewData]  = useState<CreateStaffInput[]>([]);
    const [error,        setError]        = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const [fileName,     setFileName]     = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setPreviewData([]);
            setError(null);
            setSuccessCount(null);
            setFileName(null);
        }
    }, [open]);

    const processFile = async (file: File) => {
        try {
            setError(null);
            setSuccessCount(null);
            setFileName(file.name);
            
            // Dynamic import de XLSX solo cuando se necesita
            const XLSX = await import('xlsx');
            
            const data = await file.arrayBuffer();
            const wb   = XLSX.read(data);
            const json = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]]);
            
            if (json.length === 0) { 
                setError("El archivo está vacío"); 
                return; 
            }

            const mapped: CreateStaffInput[] = json
                .map((row: any) => ({
                    name:  row.Nombre || row.nombre || row.NAME || row.Name || "",
                    dni:   row.DNI   ? String(row.DNI) : undefined,
                    email: row.Email || row.email || row.EMAIL || undefined,
                    phone: row.Telefono || row.telefono || row.Phone || undefined,
                    role:  parseRole(row.Rol || row.rol || row.ROLE || row.Role),
                }))
                .filter((item: any) => item.name);

            if (mapped.length === 0) {
                setError("No se encontraron registros válidos.");
                return;
            }
            setPreviewData(mapped);
        } catch (err) {
            console.error("Error procesando Excel", err);
            setError("Error al leer el archivo Excel");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleImport = async () => {
        setSubmitting(true);
        try {
            const result = await bulkCreateStaff.mutateAsync(previewData);
            setSuccessCount((result as any).length);
            setPreviewData([]);
            setTimeout(() => onOpenChange(false), 2500);
        } catch (err) {
            console.error("Error importando datos", err);
            setError("Error al importar los datos al servidor");
        } finally {
            setSubmitting(false);
        }
    };

    const resetState = () => {
        setPreviewData([]);
        setFileName(null);
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-[680px] p-0 gap-0 overflow-hidden border border-border shadow-none rounded-none"
            >
                <DialogTitle className="sr-only">Importar Personal</DialogTitle>

                {/* Header */}
                <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                            {successCount !== null ? "Importación Completada" : "Importar Personal"}
                        </h2>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            Carga masiva de docentes desde Excel
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-none h-8 w-8" onClick={() => onOpenChange(false)}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    {successCount !== null ? (
                        <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-300 gap-4">
                            <div className="h-14 w-14 border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-foreground uppercase tracking-tight">¡Importación exitosa!</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Se importaron <span className="font-black text-foreground">{successCount}</span> registros.
                                </p>
                                <p className="text-[10px] text-muted-foreground/50 mt-2">Esta ventana se cerrará automáticamente...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Instructions + download */}
                            {!fileName && (
                                <div className="flex gap-3 items-start border border-border bg-muted/20 p-4">
                                    <div className="space-y-1 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Instrucciones</p>
                                        <ol className="space-y-1">
                                            {INSTRUCTIONS.map((instruction, index) => (
                                                <li key={index} className="text-xs text-muted-foreground/70 flex gap-2">
                                                    <span className="font-black text-muted-foreground/40">{index + 1}.</span> {instruction}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                    <Button variant="jiraOutline" size="sm" className="rounded-none shrink-0" onClick={exportTemplate}>
                                        <Download className="h-3.5 w-3.5 mr-2" />
                                        Plantilla
                                    </Button>
                                </div>
                            )}

                            {/* Upload area or File summary */}
                            {!fileName ? (
                                <div className="border border-dashed border-border bg-muted/10 hover:bg-muted/20 transition-colors">
                                    <Label htmlFor="file-upload" className="cursor-pointer block p-10">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="h-12 w-12 border border-border bg-card flex items-center justify-center text-muted-foreground/40">
                                                <UploadCloud className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground uppercase tracking-tight">Haz clic para subir Excel</p>
                                                <p className="text-xs text-muted-foreground/60 mt-1">Formato .xlsx, .xls o .csv</p>
                                            </div>
                                        </div>
                                    </Label>
                                    <Input id="file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                                </div>
                            ) : (
                                <div className="border border-border bg-card p-4 flex items-center gap-3 animate-in fade-in">
                                    <div className="h-10 w-10 border border-border bg-muted/30 flex items-center justify-center text-muted-foreground/60 shrink-0">
                                        <FileSpreadsheet className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-foreground truncate">{fileName}</p>
                                        <p className="text-[10px] text-muted-foreground/60">
                                            {previewData.length > 0 ? `${previewData.length} registros válidos encontrados` : "Procesando..."}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-none h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                        onClick={resetState}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-4 animate-in fade-in">
                                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                    <p className="text-xs font-bold text-destructive">{error}</p>
                                </div>
                            )}

                            {/* Preview table */}
                            {previewData.length > 0 && (
                                <div className="border border-border overflow-hidden animate-in fade-in">
                                    <div className="bg-muted/30 border-b border-border px-4 py-3 flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Vista Previa</span>
                                        <span className="text-[10px] font-black border border-border px-2 py-0.5 text-muted-foreground">
                                            {previewData.length} registros
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto max-h-[240px]">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-10 bg-card border-b border-border">
                                                <tr>
                                                    <th className={TH}>Nombre</th>
                                                    <th className={TH}>DNI</th>
                                                    <th className={TH}>Email</th>
                                                    <th className={TH}>Teléfono</th>
                                                    <th className={TH}>Rol</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {previewData.slice(0, 10).map((row, i) => (
                                                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-2 text-xs font-bold text-foreground truncate max-w-[180px]">{row.name}</td>
                                                        <td className="px-4 py-2 font-mono text-[10px] text-foreground/60">{row.dni ?? "—"}</td>
                                                        <td className="px-4 py-2 text-[10px] text-muted-foreground/70 truncate max-w-[180px]">{row.email ?? "—"}</td>
                                                        <td className="px-4 py-2 font-mono text-[10px] text-foreground/60">{row.phone ?? "—"}</td>
                                                        <td className="px-4 py-2 text-[10px] uppercase font-black tracking-widest text-primary/80">
                                                            <select
                                                                value={row.role}
                                                                onChange={(e) => {
                                                                    const newData = [...previewData];
                                                                    newData[i].role = e.target.value as any;
                                                                    setPreviewData(newData);
                                                                }}
                                                                className="bg-transparent border-none p-0 h-auto outline-none cursor-pointer hover:bg-muted/50 rounded focus:ring-0"
                                                            >
                                                                <option value="docente">DOCENTE</option>
                                                                <option value="admin">ADMIN</option>
                                                                <option value="superadmin">SUPERADMIN</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {previewData.length > 10 && (
                                            <div className="p-3 text-center text-[10px] text-muted-foreground/50 border-t border-border">
                                                ... y {previewData.length - 10} registros más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {successCount === null && (
                    <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
                        <Button variant="ghost" className="rounded-none" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="jira"
                            onClick={handleImport}
                            disabled={submitting || previewData.length === 0}
                            className="rounded-none min-w-[160px]"
                        >
                            {submitting ? (
                                <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Procesando...</>
                            ) : (
                                <>
                                    Importar {previewData.length > 0 ? `${previewData.length} personas` : ""}
                                    <ChevronRight className="h-3.5 w-3.5 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
