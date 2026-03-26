"use client";

import { useState, useEffect, useRef, useDeferredValue } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Filter,
    ChevronDown,
    CheckCircle2,
    MapPin,
    Landmark,
    Building2,
    School,
    Compass,
    Sun,
    Trees,
    Wind,
    Globe,
    Star,
    Cpu,
    Zap
} from "lucide-react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { OnboardingData } from "./types";

const iconMap: Record<string, any> = {
    'LIMA': Landmark, 'AREQUIPA': Building2, 'CUSCO': School, 'PUNO': Compass,
    'PIURA': Sun, 'LA LIBERTAD': Landmark, 'ANCASH': Trees, 'CAJAMARCA': Landmark,
    'JUNIN': Zap, 'LAMBAYEQUE': Wind, 'HUANUCO': Trees, 'SAN MARTIN': Globe,
    'ICA': Sun, 'AYACUCHO': Star, 'LORETO': Globe, 'UCAYALI': Globe,
    'AMAZONAS': Trees, 'APURIMAC': Trees, 'TACNA': MapPin, 'HUANCAVELICA': Landmark,
    'MOQUEGUA': Landmark, 'PASCO': Cpu, 'TUMBES': Sun, 'MADRE DE DIOS': Globe,
};

interface StepInstitucionProps {
    data: OnboardingData;
    updateData: (u: Partial<OnboardingData>) => void;
}

export function StepInstitucion({ data, updateData }: StepInstitucionProps) {
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query);
    const [isManualMode, setIsManualMode] = useState(false);
    const [selectedDep, setSelectedDep] = useState("");
    const [selectedProv, setSelectedProv] = useState("");
    const [selectedDist, setSelectedDist] = useState("");
    const [showDeptGrid, setShowDeptGrid] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside handler for mobile dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDeptGrid(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Carousel state
    // Queries with caching for better performance
    const { data: departamentos = [] } = useQuery({
        queryKey: ['departamentos'],
        queryFn: async () => {
            const res = await fetch('/api/institutions/departamentos');
            if (!res.ok) throw new Error('Failed to fetch departments');
            const json = await res.json();
            return json.data || json;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes - departamentos don't change
        gcTime: 30 * 60 * 1000, // 30 minutes in cache
    });

    const { data: provincias = [] } = useQuery({
        queryKey: ['provincias', selectedDep],
        queryFn: async () => {
            if (!selectedDep) return [];
            const res = await fetch(`/api/institutions/provincias?departamento=${encodeURIComponent(selectedDep)}`);
            if (!res.ok) throw new Error('Failed to fetch provinces');
            const json = await res.json();
            return json.data || json;
        },
        enabled: !!selectedDep,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes in cache
    });

    const { data: distritos = [] } = useQuery({
        queryKey: ['distritos', selectedDep, selectedProv],
        queryFn: async () => {
            if (!selectedDep || !selectedProv) return [];
            const res = await fetch(`/api/institutions/distritos?departamento=${encodeURIComponent(selectedDep)}&provincia=${encodeURIComponent(selectedProv)}`);
            if (!res.ok) throw new Error('Failed to fetch districts');
            const json = await res.json();
            return json.data || json;
        },
        enabled: !!selectedDep && !!selectedProv,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes in cache
    });

    // Handle lazy loading with useInfiniteQuery and caching
    const {
        data: searchPages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching: isSearching
    } = useInfiniteQuery({
        queryKey: ['search-institutions', deferredQuery, selectedDep, selectedProv, selectedDist, data.nivel],
        queryFn: async ({ pageParam = 0 }) => {
            if (deferredQuery.length < 3 && !selectedDep) return { items: [], total: 0 };
            const nivel = data.nivel === 'primaria' ? 'Primaria' : 'Secundaria';
            
            const params = new URLSearchParams({
                q: deferredQuery,
                nivel,
                limit: '20',
                offset: pageParam.toString()
            });

            if (selectedDep) params.append('departamento', selectedDep);
            if (selectedProv) params.append('provincia', selectedProv);
            if (selectedDist) params.append('distrito', selectedDist);

            const res = await fetch(`/api/institutions/search?${params.toString()}`);
            if (!res.ok) throw new Error('Search failed');
            const json = await res.json();
            return json.data || json;
        },
        getNextPageParam: (lastPage, allPages) => {
            const currentTotal = allPages.reduce((acc, page) => acc + (page.items?.length || 0), 0);
            return currentTotal < (lastPage.total || 0) ? currentTotal : undefined;
        },
        enabled: deferredQuery.length >= 3 || !!selectedDep,
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000, // 5 minutes - search results can be cached
        gcTime: 15 * 60 * 1000, // 15 minutes in cache
    });

    const searchResults = searchPages?.pages.flatMap(p => p.items || []) || [];
    const totalResults = searchPages?.pages[0]?.total || 0;

    // Carousel refs
    const carouselRef = useRef<HTMLDivElement>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const selectInstitution = (ie: any) => {
        updateData({
            institution: {
                codigoModular: ie.codigoModular,
                nombre: ie.nombre,
                departamento: ie.departamento,
                provincia: ie.provincia,
                distrito: ie.distrito,
                direccion: ie.direccion
            },
            isManual: false
        });
    };

    if (isManualMode) {
        return (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-background rounded-xl border-2 border-border overflow-hidden">
                    {/* Header */}
                    <div className="bg-muted/30 px-8 py-6 border-b-2 border-border flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <School size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground tracking-tight">Registro Manual</h2>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Ingresa los detalles de tu institución</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsManualMode(false)}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center gap-2"
                        >
                            <ChevronDown size={18} className="rotate-90" />
                            Cancelar
                        </button>
                    </div>

                    {/* Form Body */}
                    <div className="p-8 space-y-8">
                        {/* Name Section */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">
                                Nombre de la Institución <span className="text-destructive">*</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <Building2 size={20} />
                                </div>
                                <input
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border bg-background text-base font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-muted-foreground/30"
                                    placeholder="Ej. I.E. 10450 San Juan"
                                    autoFocus
                                    onChange={(e) => updateData({
                                        institution: {
                                            ...data.institution,
                                            nombre: e.target.value,
                                            codigoModular: data.institution?.codigoModular?.startsWith('MAN-') 
                                                ? data.institution.codigoModular 
                                                : `MAN-${Math.floor(Math.random() * 10000)}`,
                                            departamento: data.institution?.departamento || "",
                                            provincia: data.institution?.provincia || "",
                                            distrito: data.institution?.distrito || "",
                                            direccion: data.institution?.direccion || ""
                                        },
                                        isManual: true
                                    })}
                                />
                            </div>
                        </div>

                        {/* Location Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Departamento</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                                        <MapPin size={18} />
                                    </div>
                                    <input
                                        className="w-full pl-11 pr-4 py-3 rounded-lg border-2 border-border bg-background text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        placeholder="Ej. Lima"
                                        defaultValue={data.institution?.departamento}
                                        onChange={(e) => updateData({ 
                                            institution: { ...data.institution, departamento: e.target.value, nombre: data.institution?.nombre || "", codigoModular: data.institution?.codigoModular || "", provincia: data.institution?.provincia || "", distrito: data.institution?.distrito || "", direccion: data.institution?.direccion || "" } 
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Provincia</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                                        <MapPin size={18} />
                                    </div>
                                    <input
                                        className="w-full pl-11 pr-4 py-3 rounded-lg border-2 border-border bg-background text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        placeholder="Ej. Yauyos"
                                        defaultValue={data.institution?.provincia}
                                        onChange={(e) => updateData({ 
                                            institution: { ...data.institution, provincia: e.target.value, nombre: data.institution?.nombre || "", codigoModular: data.institution?.codigoModular || "", departamento: data.institution?.departamento || "", distrito: data.institution?.distrito || "", direccion: data.institution?.direccion || "" }
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Distrito</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
                                        <MapPin size={18} />
                                    </div>
                                    <input
                                        className="w-full pl-11 pr-4 py-3 rounded-lg border-2 border-border bg-background text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        placeholder="Ej. Catahuasi"
                                        defaultValue={data.institution?.distrito}
                                        onChange={(e) => updateData({ 
                                            institution: { ...data.institution, distrito: e.target.value, nombre: data.institution?.nombre || "", codigoModular: data.institution?.codigoModular || "", departamento: data.institution?.departamento || "", provincia: data.institution?.provincia || "", direccion: data.institution?.direccion || "" }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Note */}
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex gap-3 items-start">
                            <Zap size={18} className="text-primary shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-primary/80 leading-relaxed">
                                Estas registrando una institución de forma manual. Asegúrate de que los datos sean correctos para facilitar la gestión posterior.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto w-full">
            <div className="bg-muted/30 p-6 md:p-8 rounded-lg border border-border">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[400px] lg:h-[58vh] lg:max-h-[650px] h-full">
                    {/* SIDEBAR: DEPARTMENTS (DESKTOP) */}
                    <aside className="hidden lg:block w-64 shrink-0 border-r border-border/50 pr-6">
                        <div className="flex flex-col h-full space-y-4">
                            <div className="shrink-0 flex items-center justify-between">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Regiones</label>
                                {selectedDep && (
                                    <button
                                        onClick={() => { setSelectedDep(""); setSelectedProv(""); setSelectedDist(""); }}
                                        className="text-[10px] font-bold text-primary hover:underline hover:opacity-80 transition-all"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-3">
                                {departamentos.map((d: string) => {
                                    const isSelected = selectedDep === d;
                                    const IconComponent = iconMap[d.toUpperCase()] || Landmark;
                                    return (
                                        <button
                                            key={d}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedDep("");
                                                    setSelectedProv("");
                                                    setSelectedDist("");
                                                } else {
                                                    setSelectedDep(d);
                                                    setSelectedProv("");
                                                    setSelectedDist("");
                                                }
                                            }}
                                            className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-all
                                        ${isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                }
                                    `}
                                        >
                                            <IconComponent size={16} className={isSelected ? 'text-primary-foreground' : 'text-primary'} />
                                            <span className="truncate">{d}</span>
                                            {isSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    <div className="lg:hidden relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDeptGrid(!showDeptGrid)}
                            className={`
                        w-full flex items-center justify-between px-5 py-4 rounded-lg border-2 transition-all font-bold
                        ${selectedDep ? 'bg-primary/5 border-primary text-primary' : 'bg-background border-border text-foreground'}
                    `}
                        >
                            <div className="flex items-center gap-3">
                                <Filter size={20} />
                                <span>{selectedDep ? `Región: ${selectedDep}` : 'Selecciona tu región'}</span>
                            </div>
                            <ChevronDown size={20} className={`transition-transform duration-200 ${showDeptGrid ? 'rotate-180' : ''}`} />
                        </button>

                        {showDeptGrid && (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 p-3 rounded-lg border-2 border-border bg-background shadow-lg grid grid-cols-2 gap-1.5 animate-in slide-in-from-top-2 duration-200 max-h-64 overflow-y-auto">
                                {departamentos.map((d: string) => (
                                    <button
                                        key={d}
                                        onClick={() => { setSelectedDep(d); setSelectedProv(""); setSelectedDist(""); setShowDeptGrid(false); }}
                                        className={`p-2.5 rounded-md border text-xs font-bold uppercase transition-all ${selectedDep === d ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted/30 border-border text-foreground hover:bg-muted'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                        <div className="shrink-0 space-y-3 mb-2 relative z-10">
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                                    <Search size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Escribe el nombre o código modular..."
                                    className="w-full pl-14 pr-14 py-4 rounded-lg border-2 border-border bg-background text-base font-bold focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-muted-foreground/30 placeholder:font-medium"
                                    autoFocus
                                />
                                {isSearching && (
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        <span className="h-6 w-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin inline-block" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="shrink-0 transition-all duration-300 flex flex-col justify-end">
                            {selectedDep && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="relative flex items-center group/carousel">
                                        <div
                                            ref={carouselRef}
                                            className="flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-none pr-1 scroll-smooth w-full"
                                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                        >
                                            {!selectedProv ? (
                                                <>
                                                    <button
                                                        onClick={() => { setSelectedProv(""); setSelectedDist(""); }}
                                                        className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-sm text-[11px] font-bold uppercase transition-all ${!selectedProv ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                                                    >
                                                        TODAS LAS PROVINCIAS
                                                    </button>
                                                    {provincias.map((p: string) => (
                                                        <button
                                                            key={p}
                                                            onClick={() => { setSelectedProv(p); setSelectedDist(""); }}
                                                            className="shrink-0 whitespace-nowrap px-3 py-1 rounded-sm text-[11px] font-bold uppercase bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setSelectedProv("")}
                                                        className="shrink-0 whitespace-nowrap px-2 py-1 rounded-sm text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1"
                                                    >
                                                        <ChevronDown size={12} className="rotate-90" />
                                                        CAMBIAR PROVINCIA
                                                    </button>
                                                    <div className="w-px h-4 bg-border/50 mx-1 self-center" />
                                                    <button
                                                        onClick={() => setSelectedDist("")}
                                                        className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-sm text-[11px] font-bold uppercase transition-all ${!selectedDist ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                                                    >
                                                        TODOS LOS DISTRITOS
                                                    </button>
                                                    {distritos.map((d: string) => (
                                                        <button
                                                            key={d}
                                                            onClick={() => setSelectedDist(d)}
                                                            className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-sm text-[11px] font-bold uppercase transition-all ${selectedDist === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                                                        >
                                                            {d}
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 space-y-4 pt-2">
                            <div className="shrink-0 flex items-center justify-between border-b-2 border-border pb-3">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">
                                    {searchResults.length > 0
                                        ? `Mostrando ${searchResults.length} de ${totalResults} instituciones`
                                        : 'Instituciones'}
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-scroll overflow-x-hidden custom-scrollbar pr-2 -mr-2 flex flex-col min-h-0">
                                {searchResults.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-4">
                                        {searchResults.map((ie: any, index: number) => {
                                            const isSelected = data.institution?.codigoModular === ie.codigoModular;
                                            return (
                                                <motion.button
                                                    key={ie.codigoModular}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.2, delay: index % 20 * 0.02 }}
                                                    onClick={() => selectInstitution(ie)}
                                                    className={`group text-left p-5 rounded-lg border-2 transition-all flex flex-col gap-3 relative overflow-hidden ${isSelected
                                                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                                                        : 'border-border bg-background hover:border-primary/40'
                                                        }`}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-0 right-0 p-2">
                                                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                                <CheckCircle2 size={12} strokeWidth={3} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-start gap-4">
                                                        <p className={`font-bold text-sm leading-tight transition-colors ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                                                            {ie.nombre}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-center w-full mt-auto pt-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                                            <MapPin size={10} className="text-primary/60" />
                                                            <span className="truncate max-w-[120px]">{ie.distrito}, {ie.provincia}</span>
                                                        </div>
                                                        <span className={`shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${isSelected ? 'bg-primary/10 text-primary' : 'text-muted-foreground bg-muted'}`}>
                                                            {ie.codigoModular}
                                                        </span>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}

                                        {/* Sentinel for infinite scroll */}
                                        <div ref={observerTarget} className="h-4 w-full" />

                                        {/* Loading states for next page */}
                                        {isFetchingNextPage && (
                                            <>
                                                {[1, 2, 3].map(i => (
                                                    <div key={`loading-${i}`} className="p-16 rounded-lg border-2 border-border/40 animate-pulse bg-muted/10" />
                                                ))}
                                            </>
                                        )}

                                        {/* Manual registration ALWAYS at the end of results if they exist */}
                                        {!hasNextPage && (
                                            <motion.button
                                                key={`manual-${selectedDep}-${selectedProv}-${query}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                onClick={() => setIsManualMode(true)}
                                                className="text-left p-5 rounded-lg border-2 border-dashed border-border/60 bg-muted/5 hover:bg-primary/5 hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-2 group text-center"
                                            >
                                                <div className="h-10 w-10 rounded-full bg-background border-2 border-border flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-all">
                                                    <Building2 size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">¿No encuentras tu colegio?</p>
                                                    <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Regístralo manualmente en segundos.</p>
                                                </div>
                                            </motion.button>
                                        )}
                                    </div>
                                ) : (
                                    (!isSearching && (query.length >= 3 || selectedDep)) ? (
                                        <motion.div
                                            key="no-results"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="py-12 px-6 border-2 border-dashed border-border/60 rounded-xl bg-muted/5 text-center flex flex-col items-center gap-4"
                                        >
                                            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground/40">
                                                <Search size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-lg font-bold text-foreground">Sin coincidencias</h4>
                                                <p className="text-xs font-medium text-muted-foreground max-w-xs mx-auto">Prueba refinando la ubicación o usa el código modular de 7 dígitos.</p>
                                            </div>
                                            <button
                                                onClick={() => setIsManualMode(true)}
                                                className="px-6 py-2 bg-foreground text-background rounded-md text-[10px] font-black hover:opacity-90 transition-all uppercase tracking-wider mt-2"
                                            >
                                                REGISTRAR COLEGIO MANUALMENTE
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty-state"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="w-full flex-1 p-12 text-center border-2 border-border border-dashed rounded-xl bg-muted/5 flex flex-col items-center justify-center min-h-[200px]"
                                        >
                                            <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mb-3 text-muted-foreground/30">
                                                <Compass size={20} />
                                            </div>
                                            <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-[0.2em] leading-relaxed">
                                                Explora por región o busca por nombre
                                            </p>
                                        </motion.div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
