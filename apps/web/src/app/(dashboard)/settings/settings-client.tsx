"use client";

import { useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useClassrooms } from "@/features/classrooms/hooks/use-classrooms";
import { useMyInstitution, institutionKeys } from "@/features/institutions/hooks/use-my-institution";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, User as UserIcon, Lock, Trash2, ShieldCheck, Settings2, Sun, Moon, Pencil, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { BrandColorPicker } from "@/components/brand-color-picker";
import { useBrandColor } from "@/components/brand-color-provider";
import { getBrandColor } from "@/lib/brand-color";

type SettingsTab = 'profile' | 'preferences' | 'security' | 'institution' | 'control';
 
const ROLE_LABELS: Record<string, string> = {
    superadmin: 'Super Administrador',
    admin: 'Administrador de Sede',
    pip: 'PIP (Profesor de innovación pedagógica)',
    docente: 'Docente de Aula',
};

export function SettingsClient() {
    const { data: session } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    
    // Redirect legacy tabs to profile
    const rawTab = searchParams.get('tab');
    let activeTab: SettingsTab = 'profile';
    
    if (rawTab === 'security' || rawTab === 'preferences' || rawTab === 'institution' || rawTab === 'control') {
        activeTab = rawTab as SettingsTab;
    }
    
    const user = session?.user as any;
    const hasInstitution = !!user?.institutionId;

    const { data: classrooms } = useClassrooms();
    const { theme, setTheme } = useTheme();

    // Use React Query hook for institution - cached and deduplicated
    const { data: institution, isLoading: isLoadingInstitution } = useMyInstitution();
    
    // Edit name inline
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState("");
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    
    // Change password inline
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: "", newPwd: "", confirm: "" });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Brand color from context
    const { brandColor, setBrandColor } = useBrandColor();
    const [isSavingBrand, setIsSavingBrand] = useState(false);
    const [logoUrl, setLogoUrl] = useState("");
    
    // Local state for permissions matrix (optimistic updates)
    const [localFeatures, setLocalFeatures] = useState<Record<string, any>>({});

    // Update logoUrl and localFeatures when institution loads
    useEffect(() => {
        if (institution?.settings?.logoUrl) {
            setLogoUrl(institution.settings.logoUrl);
        }
        if (institution?.settings) {
            const institutionFeatures = (institution.settings as any)?.features || {};
            setLocalFeatures(institutionFeatures);
            setHasFeatureChanges(false);
        }
    }, [institution]);
    
    // Track changes in features/permissions
    useEffect(() => {
        if (institution?.settings) {
            const institutionFeatures = (institution.settings as any)?.features || {};
            const changed = JSON.stringify(localFeatures) !== JSON.stringify(institutionFeatures);
            setHasFeatureChanges(changed);
        }
    }, [localFeatures, institution]);

    const handleSaveBrand = async (color?: string, logo?: string) => {
        if (!hasInstitution) return;
        setIsSavingBrand(true);
        try {
            const res = await fetch('/api/institutions/my-institution/brand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandColor: color, logoUrl: logo })
            });
            if (res.ok) {
                if (color !== undefined) setBrandColor(color);
                if (logo !== undefined) setLogoUrl(logo);
                queryClient.invalidateQueries({ queryKey: institutionKeys.myInstitution });
                toast.success("Branding actualizado");
            } else {
                throw new Error();
            }
        } catch {
            toast.error("Error al guardar el branding");
        } finally {
            setIsSavingBrand(false);
        }
    };

    const handleSaveBrandColor = async (color: string) => {
        await handleSaveBrand(color, undefined);
    };
    
    // User Settings State
    const [settings, setSettings] = useState<{
        defaultClassroomId?: string;
        defaultShift?: 'morning' | 'afternoon';
        language?: string;
        privacy?: {
            newFriend?: boolean;
            channelFriend?: boolean;
            authenticatorApp?: boolean;
        };
    }>({
        language: 'es',
        privacy: {
            newFriend: true,
            channelFriend: true,
            authenticatorApp: false
        }
    });
    const [originalSettings, setOriginalSettings] = useState<typeof settings | null>(null);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    // Separate state for features/permissions
    const [isSavingFeatures, setIsSavingFeatures] = useState(false);
    const [hasFeatureChanges, setHasFeatureChanges] = useState(false);

    // Fetch user settings
    useEffect(() => {
        if (session?.user) {
            fetch('/api/users/me/settings')
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        const loadedSettings = data ?? {};
                        setSettings(s => ({ ...s, ...loadedSettings }));
                        setOriginalSettings(loadedSettings);
                        setHasChanges(false);
                    }
                })
                .catch(() => {});
        }
    }, [session?.user]);

    // Track changes when settings change
    useEffect(() => {
        if (originalSettings) {
            const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
            setHasChanges(changed);
        }
    }, [settings, originalSettings]);

    const handleSaveSettings = async () => {
        setIsSavingPreferences(true);
        try {
            const res = await fetch('/api/users/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                toast.success("Preferencias guardadas correctamente");
                setOriginalSettings(settings);
                setHasChanges(false);
            } else {
                throw new Error("Error al guardar");
            }
        } catch (error) {
            toast.error("No se pudieron guardar las preferencias");
        } finally {
            setIsSavingPreferences(false);
        }
    };
    
    const handleSaveFeatures = async () => {
        if (!institution) return;
        setIsSavingFeatures(true);
        try {
            const res = await fetch('/api/institutions/my-institution/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features: localFeatures })
            });
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: institutionKeys.myInstitution });
                toast.success("Permisos actualizados correctamente");
                setHasFeatureChanges(false);
            } else {
                throw new Error();
            }
        } catch {
            toast.error("Error al guardar permisos");
        } finally {
            setIsSavingFeatures(false);
        }
    };
    
    const handleDiscardFeatures = () => {
        if (institution?.settings) {
            const institutionFeatures = (institution.settings as any)?.features || {};
            setLocalFeatures(institutionFeatures);
            setHasFeatureChanges(false);
            toast.info("Cambios descartados");
        }
    };

    // Handle changing institution
    const handleChangeInstitution = () => {
        router.push('/onboarding?change=true');
    };
    
    // Start editing name
    const startEditName = () => {
        setEditNameValue(user?.name || "");
        setIsEditingName(true);
    };
    
    // Cancel editing name
    const cancelEditName = () => {
        setIsEditingName(false);
        setEditNameValue("");
    };
    
    // Save new name
    const handleSaveName = async () => {
        if (!editNameValue.trim() || editNameValue.trim() === user?.name) {
            setIsEditingName(false);
            return;
        }
        setIsUpdatingName(true);
        try {
            const res = await fetch('/api/v1/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editNameValue.trim() })
            });
            if (res.ok) {
                toast.success("Nombre actualizado");
                setIsEditingName(false);
                router.refresh();
            } else {
                throw new Error();
            }
        } catch {
            toast.error("Error al actualizar nombre");
        } finally {
            setIsUpdatingName(false);
        }
    };
    
    // Handle key press on name input
    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveName();
        } else if (e.key === 'Escape') {
            cancelEditName();
        }
    };
    
    // Change password
    const handleChangePassword = async () => {
        if (passwordForm.newPwd !== passwordForm.confirm) {
            toast.error("Las contraseñas no coinciden");
            return;
        }
        if (passwordForm.newPwd.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }
        setIsChangingPassword(true);
        try {
            const res = await fetch('/api/v1/users/me/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.newPwd
                })
            });
            if (res.ok) {
                toast.success("Contraseña cambiada correctamente");
                setIsEditingPassword(false);
                setPasswordForm({ current: "", newPwd: "", confirm: "" });
            } else {
                const data = await res.json();
                throw new Error(data.message);
            }
        } catch (err: any) {
            toast.error(err.message || "Error al cambiar contraseña");
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div className="hidden lg:block">
                        <h1 className="text-3xl font-black tracking-tighter text-foreground font-sans">Configuración</h1>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={(val) => router.push(`/settings?tab=${val}`)} className="w-full">
                    <TabsList className="mb-6 bg-transparent border-b border-border rounded-none h-auto p-0">
                        <TabsTrigger 
                            value="profile" 
                            className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-b-2" 
                            style={activeTab === 'profile' ? { borderColor: getBrandColor(brandColor), color: getBrandColor(brandColor) } : undefined}
                        >
                            <UserIcon className="w-3.5 h-3.5" />
                            Perfil
                        </TabsTrigger>
                        <TabsTrigger 
                            value="preferences" 
                            className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-b-2" 
                            style={activeTab === 'preferences' ? { borderColor: getBrandColor(brandColor), color: getBrandColor(brandColor) } : undefined}
                        >
                            <Settings2 className="w-3.5 h-3.5" />
                            Preferencias
                        </TabsTrigger>
                        <TabsTrigger 
                            value="security" 
                            className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-b-2" 
                            style={activeTab === 'security' ? { borderColor: getBrandColor(brandColor), color: getBrandColor(brandColor) } : undefined}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Seguridad
                        </TabsTrigger>
                        {(user?.role === 'admin' || user?.isSuperAdmin) && (
                            <TabsTrigger 
                                value="control" 
                                className="gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:text-primary data-[state=active]:border-b-2" 
                                style={activeTab === 'control' ? { borderColor: getBrandColor(brandColor), color: getBrandColor(brandColor) } : undefined}
                            >
                                <Lock className="w-3.5 h-3.5" />
                                Centro de Control
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Perfil Tab */}
                    <TabsContent value="profile" className="space-y-6 animate-in fade-in duration-300">
                        {/* Account Card */}
                        <div className="bg-background rounded-lg border border-border p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                {/* Avatar */}
                                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-3xl font-black text-primary-foreground shrink-0">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={editNameValue}
                                                    onChange={(e) => setEditNameValue(e.target.value)}
                                                    onKeyDown={handleNameKeyDown}
                                                    autoFocus
                                                    className="h-9 text-lg font-bold max-w-[300px]"
                                                />
                                                <button
                                                    onClick={handleSaveName}
                                                    disabled={isUpdatingName}
                                                    className="p-2 text-white rounded-md transition-colors disabled:opacity-50"
                                                    style={{ backgroundColor: getBrandColor(brandColor) }}
                                                    title="Guardar"
                                                >
                                                    {isUpdatingName ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={cancelEditName}
                                                    disabled={isUpdatingName}
                                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                                                    title="Cancelar"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <h2 className="text-xl font-bold text-foreground">{user?.name || '—'}</h2>
                                                <button
                                                    onClick={startEditName}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                                    title="Editar nombre"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-base text-muted-foreground mb-3">{user?.email || '—'}</p>
                                    
                                    {/* Badge */}
                                    <div className="flex items-center gap-2">
                                        <span 
                                            className={cn(
                                                "inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wide",
                                                !user?.isSuperAdmin && "bg-muted border border-border text-muted-foreground"
                                            )}
                                            style={user?.isSuperAdmin ? { backgroundColor: getBrandColor(brandColor), color: 'white' } : undefined}
                                        >
                                            {user?.isSuperAdmin ? "SuperAdmin" : (ROLE_LABELS[user?.role] || user?.role)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Institution Card */}
                        <div className="bg-background rounded-lg border border-border p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Institución educativa</h2>
                                <button
                                    onClick={handleChangeInstitution}
                                    className="px-5 py-2.5 text-white rounded text-sm font-bold transition-colors active:scale-95"
                                    style={{ backgroundColor: getBrandColor(brandColor) }}
                                >
                                    Cambiar centro educativo
                                </button>
                            </div>

                            {!hasInstitution ? (
                                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                                    <div className="text-4xl mb-4 opacity-50">🏫</div>
                                    <p className="text-base font-medium text-muted-foreground mb-4">
                                        No tienes una institución vinculada.
                                    </p>
                                    <button
                                        onClick={() => router.push('/onboarding')}
                                        className="px-6 py-2.5 text-white rounded-md text-sm font-bold transition-colors active:scale-95"
                                        style={{ backgroundColor: getBrandColor(brandColor) }}
                                    >
                                        Vincular institución
                                    </button>
                                </div>
                            ) : isLoadingInstitution ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : institution ? (
                                <div className="space-y-4">
                                    {/* Header with Icon */}
                                    <div className="flex items-start gap-4 pb-4 border-b border-border">
                                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">
                                            🏫
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold text-foreground">{institution.name}</h3>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-3 pb-4 border-b border-border">
                                        {/* Nivel */}
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-20 shrink-0">Nivel</span>
                                            <span 
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
                                                style={{ backgroundColor: `${getBrandColor(brandColor)}15`, color: getBrandColor(brandColor) }}
                                            >
                                                {institution.nivel}
                                            </span>
                                        </div>

                                        {/* Dirección */}
                                        {institution.settings?.location && (
                                            <div className="flex items-start gap-3">
                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-20 shrink-0 pt-0.5">📍</span>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {institution.settings.location.direccion || 'Dirección no especificada'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {institution.settings.location.distrito}, {institution.settings.location.provincia}, {institution.settings.location.departamento}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Código Modular */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-20 shrink-0">Código</span>
                                        <span className="text-base font-mono font-bold text-foreground tracking-wider">
                                            {institution.codigoModular}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
                                    <p className="text-sm font-bold text-rose-600">Error al cargar datos</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>


                    {/* Preferencias Tab */}
                    <TabsContent value="preferences" className="space-y-8 animate-in fade-in duration-300">
                        {/* Tema */}
                        <div className="bg-background rounded-lg border border-border p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-muted">
                                    {theme === "dark" ? (
                                        <Moon className="w-5 h-5 text-foreground" />
                                    ) : (
                                        <Sun className="w-5 h-5 text-foreground" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-foreground">Tema</p>
                                    <p className="text-sm text-muted-foreground">Personaliza la apariencia de la app</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-1.5 w-fit mx-auto">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-md transition-all font-medium",
                                        theme === "light" 
                                            ? "bg-background shadow-sm text-foreground" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Sun className="w-4 h-4" />
                                    Claro
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-md transition-all font-medium",
                                        theme === "dark" 
                                            ? "bg-background shadow-sm text-foreground" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Moon className="w-4 h-4" />
                                    Oscuro
                                </button>
                                <button
                                    onClick={() => setTheme("system")}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-md transition-all font-medium",
                                        theme === "system" 
                                            ? "bg-background shadow-sm text-foreground" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Settings2 className="w-4 h-4" />
                                    Sistema
                                </button>
                            </div>
                        </div>

                        {/* Color de marca */}
                        {hasInstitution && (
                            <div className="bg-background rounded-lg border border-border p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${getBrandColor(brandColor)}15` }}>
                                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: getBrandColor(brandColor) }} />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-foreground">Color de marca</p>
                                        <p className="text-sm text-muted-foreground">Personaliza el color de la interfaz</p>
                                    </div>
                                </div>
                                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                                    <BrandColorPicker
                                        value={brandColor}
                                        onChange={handleSaveBrandColor}
                                        disabled={isSavingBrand}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Logo de la IE */}
                        {hasInstitution && (
                            <div className="bg-background rounded-lg border border-border p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-muted">
                                        <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-foreground">Logo de la institución</p>
                                        <p className="text-sm text-muted-foreground">URL de la imagen del logo</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Input
                                        value={logoUrl}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        placeholder="https://ejemplo.com/logo.png"
                                        className="h-10 text-sm flex-1"
                                    />
                                    {logoUrl ? (
                                        <>
                                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-white border border-border p-1 shrink-0">
                                                <Image
                                                    src={logoUrl}
                                                    alt="Logo preview"
                                                    width={32}
                                                    height={32}
                                                    className="h-full w-full object-contain"
                                                    unoptimized
                                                />
                                            </div>
                                            <Button
                                                onClick={() => handleSaveBrand(undefined, logoUrl)}
                                                disabled={isSavingBrand}
                                                className="shrink-0"
                                                style={{ backgroundColor: getBrandColor(brandColor) }}
                                            >
                                                {isSavingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={() => logoUrl && handleSaveBrand(undefined, logoUrl)}
                                            disabled={!logoUrl || isSavingBrand}
                                            className="shrink-0"
                                            style={{ backgroundColor: getBrandColor(brandColor) }}
                                        >
                                            {isSavingBrand ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agregar"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Aula principal */}
                        <div className="bg-background rounded-lg border border-border p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-muted">
                                    <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-foreground">Aula principal</p>
                                    <p className="text-sm text-muted-foreground">Acceso rápido predeterminado</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                                <button
                                    onClick={() => setSettings(s => ({ ...s, defaultClassroomId: undefined }))}
                                    className={cn(
                                        "px-4 py-2.5 text-sm font-medium rounded-lg transition-all",
                                        !settings.defaultClassroomId 
                                            ? "text-white shadow-sm" 
                                            : "bg-muted hover:bg-muted/80"
                                    )}
                                    style={!settings.defaultClassroomId ? { backgroundColor: getBrandColor(brandColor) } : undefined}
                                >
                                    Ninguna
                                </button>
                                {classrooms?.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSettings(s => ({ ...s, defaultClassroomId: c.id }))}
                                        className={cn(
                                            "px-4 py-2.5 text-sm font-medium rounded-lg transition-all",
                                            settings.defaultClassroomId === c.id 
                                                ? "text-white shadow-sm" 
                                                : "bg-muted hover:bg-muted/80"
                                        )}
                                        style={settings.defaultClassroomId === c.id ? { backgroundColor: getBrandColor(brandColor) } : undefined}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Turno base */}
                        <div className="bg-background rounded-lg border border-border p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-muted">
                                    <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-foreground">Turno base</p>
                                    <p className="text-sm text-muted-foreground">Franja horaria de trabajo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-1.5 w-fit mx-auto">
                                <button
                                    onClick={() => setSettings(s => ({ ...s, defaultShift: 'morning' }))}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-md transition-all font-medium",
                                        settings.defaultShift === 'morning' 
                                            ? "bg-background shadow-sm text-foreground" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Sun className="w-4 h-4" />
                                    Mañana
                                </button>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, defaultShift: 'afternoon' }))}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2.5 rounded-md transition-all font-medium",
                                        settings.defaultShift === 'afternoon' 
                                            ? "bg-background shadow-sm text-foreground" 
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Moon className="w-4 h-4" />
                                    Tarde
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Floating save button - only for preferences */}
                    {hasChanges && activeTab === 'preferences' && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSavingPreferences}
                                className="px-8 py-3.5 text-white font-bold shadow-lg shadow-black/20 rounded-lg"
                                style={{ backgroundColor: getBrandColor(brandColor) }}
                            >
                                {isSavingPreferences ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                Guardar cambios
                            </Button>
                        </div>
                    )}

                    {/* Seguridad Tab */}
                    <TabsContent value="security" className="space-y-6 animate-in fade-in duration-300">
                        {/* Cambiar Contraseña */}
                        <div className="bg-background rounded-lg border border-border p-6 md:p-8">
                            <div className="mb-6">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Seguridad</h2>
                            </div>

                            <div className="pb-4 border-b border-border">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-md" style={{ backgroundColor: `${getBrandColor(brandColor)}15` }}>
                                        <Lock className="w-5 h-5" style={{ color: getBrandColor(brandColor) }} />
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-foreground">Cambiar contraseña</p>
                                        <p className="text-xs text-muted-foreground">Actualiza tu contraseña de acceso</p>
                                    </div>
                                </div>

                                {isEditingPassword ? (
                                    <div className="space-y-4 bg-muted/50 rounded-lg p-5 ml-11">
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-foreground">Contraseña actual</label>
                                                <Input
                                                    type="password"
                                                    value={passwordForm.current}
                                                    onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                                                    placeholder="••••••••"
                                                    className="h-11"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
                                                <Input
                                                    type="password"
                                                    value={passwordForm.newPwd}
                                                    onChange={(e) => setPasswordForm(p => ({ ...p, newPwd: e.target.value }))}
                                                    placeholder="Mínimo 6 caracteres"
                                                    className="h-11"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
                                                <Input
                                                    type="password"
                                                    value={passwordForm.confirm}
                                                    onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                                    placeholder="Repite la nueva contraseña"
                                                    className="h-11"
                                                />
                                                {passwordForm.confirm && passwordForm.newPwd !== passwordForm.confirm && (
                                                    <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                onClick={() => setIsEditingPassword(false)}
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={handleChangePassword}
                                                disabled={isChangingPassword || !passwordForm.current || !passwordForm.newPwd || !passwordForm.confirm || passwordForm.newPwd !== passwordForm.confirm}
                                                className="flex-1 text-white font-bold"
                                                style={{ backgroundColor: getBrandColor(brandColor) }}
                                            >
                                                {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                Cambiar contraseña
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="ml-11">
                                        <Button
                                            onClick={() => setIsEditingPassword(true)}
                                            className="px-6 py-2.5 text-white font-bold"
                                            style={{ backgroundColor: getBrandColor(brandColor) }}
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            Cambiar contraseña
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Zona de Peligro */}
                        <div className="bg-background rounded-lg border border-rose-200 overflow-hidden">
                            <div className="flex items-center gap-3 p-4 bg-rose-50 border-b border-rose-200">
                                <div className="p-2 bg-rose-100 rounded-md">
                                    <Trash2 className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-rose-700">Zona de peligro</p>
                                    <p className="text-xs text-rose-600">Estas acciones son irreversibles</p>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-foreground">Desactivar cuenta</p>
                                        <p className="text-sm text-muted-foreground">Suspende tu acceso pero conserva los datos</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                    >
                                        Desactivar
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-foreground">Eliminar cuenta</p>
                                        <p className="text-sm text-muted-foreground">Borrado permanente e irreversible</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Centro de Control Tab */}
                    <TabsContent value="control" className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-background rounded-lg border border-border overflow-hidden">
                            <div className="p-6 border-b border-border bg-muted/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md" style={{ backgroundColor: `${getBrandColor(brandColor)}15` }}>
                                        <ShieldCheck className="w-5 h-5" style={{ color: getBrandColor(brandColor) }} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Matriz de Permisos</h2>
                                        <p className="text-xs text-muted-foreground">Define qué roles pueden acceder a cada funcionalidad básica</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasFeatureChanges && (
                                        <Button
                                            onClick={handleDiscardFeatures}
                                            disabled={isSavingFeatures}
                                            variant="outline"
                                            className="h-10 px-4 shrink-0"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Descartar
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleSaveFeatures}
                                        disabled={isSavingFeatures || !hasFeatureChanges}
                                        className="text-white font-bold h-10 px-6 shrink-0"
                                        style={{ backgroundColor: getBrandColor(brandColor) }}
                                    >
                                        {isSavingFeatures ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Guardar Configuración
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted/10">
                                            <th className="p-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border">Funcionalidad</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border">Docente</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border">PIP</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border">Admin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {[
                                            { id: 'reservations', name: 'Reservas de Aula', desc: 'Permitir crear y gestionar reservaciones de espacios (AIP/Laboratorios).' },
                                            { id: 'loans', name: 'Préstamos de Recursos', desc: 'Permitir realizar solicitudes de préstamo de equipos e inventario.' },
                                        ].map((feature) => {
                                            const featureData = localFeatures[feature.id] || { docente: false, pip: true }; 

                                            const toggle = (role: string) => {
                                                setLocalFeatures(prev => ({
                                                    ...prev,
                                                    [feature.id]: {
                                                        ...featureData,
                                                        [role]: !featureData[role]
                                                    }
                                                }));
                                            };

                                            return (
                                                <tr key={feature.id} className="hover:bg-muted/5 transition-colors">
                                                    <td className="p-6">
                                                        <p className="text-sm font-bold text-foreground">{feature.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{feature.desc}</p>
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={featureData.docente}
                                                            onChange={() => toggle('docente')}
                                                            className="w-5 h-5 accent-primary rounded cursor-pointer"
                                                            style={{ accentColor: getBrandColor(brandColor) }}
                                                        />
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={featureData.pip}
                                                            onChange={() => toggle('pip')}
                                                            className="w-5 h-5 accent-primary rounded cursor-pointer"
                                                            style={{ accentColor: getBrandColor(brandColor) }}
                                                        />
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={true}
                                                            disabled
                                                            className="w-5 h-5 bg-muted accent-muted-foreground rounded cursor-not-allowed opacity-50"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
