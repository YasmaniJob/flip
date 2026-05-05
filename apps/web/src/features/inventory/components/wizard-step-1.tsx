"use client";

import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Check, X, Plus } from "lucide-react";
import {
  useCategories,
  useCreateCategory,
} from "@/features/inventory/hooks/use-categories";
import {
  useAllTemplates,
  useCreateTemplate,
} from "@/features/inventory/hooks/use-resources";
import { WizardLayout } from "@/components/layouts/wizard-layout";
import type { WizardData } from "./resource-wizard";

const STANDARD_CATALOGUE = [
  {
    category: { name: 'Equipos de Cómputo y CRT', icon: '💻', color: '#0052CC' },
    templates: [
      { name: 'Laptop', icon: '💻' },
      { name: 'Tableta MINEDU', icon: '📱' },
      { name: 'Computadora de Escritorio', icon: '🖥️' },
      { name: 'Servidor Escolar', icon: '🗄️' },
    ],
  },
  {
    category: { name: 'Multimedia y Audiovisuales', icon: '📺', color: '#0065FF' },
    templates: [
      { name: 'Proyector Multimedia', icon: '📽️' },
      { name: 'Ecran / Pantalla', icon: '🖼️' },
      { name: 'Pizarra Interactiva', icon: '📟' },
      { name: 'Televisor / Smart TV', icon: '📺' },
      { name: 'Equipo de Sonido', icon: '🔊' },
      { name: 'Micrófono / Megáfono', icon: '🎤' },
    ],
  },
  {
    category: { name: 'Periféricos y Accesorios', icon: '🖱️', color: '#2684FF' },
    templates: [
      { name: 'Teclado', icon: '⌨️' },
      { name: 'Mouse', icon: '🖱️' },
      { name: 'Audífonos con Micrófono', icon: '🎧' },
      { name: 'Cámara Web', icon: '📷' },
      { name: 'Disco Duro Externo', icon: '💾' },
      { name: 'Memoria USB', icon: '🔌' },
    ],
  },
  {
    category: { name: 'Cables, Conectores y Energía', icon: '🔌', color: '#4C9AFF' },
    templates: [
      { name: 'Extensión Eléctrica', icon: '🔌' },
      { name: 'Cable de Poder', icon: '⚡' },
      { name: 'Cable de Red (RJ45)', icon: '🌐' },
      { name: 'Cable de Video (HDMI/VGA)', icon: '🖥️' },
      { name: 'Estabilizador', icon: '⚡' },
      { name: 'UPS', icon: '🔋' },
    ],
  },
  {
    category: { name: 'Redes y Conectividad', icon: '📡', color: '#00B8D9' },
    templates: [
      { name: 'Router / Módem', icon: '📡' },
      { name: 'Switch', icon: '🔀' },
      { name: 'Access Point', icon: '📶' },
      { name: 'Gabinete / Rack', icon: '🗄️' },
    ],
  },
  {
    category: { name: 'Kits Educativos y Robótica', icon: '🤖', color: '#36B37E' },
    templates: [
      { name: 'Kit de Robótica', icon: '🤖' },
      { name: 'Material Base 10', icon: '🧊' },
      { name: 'Kit de Ciencias', icon: '🔬' },
      { name: 'Globo Terráqueo', icon: '🌍' },
    ],
  },
  {
    category: { name: 'Mobiliario Escolar', icon: '🪑', color: '#BF2600' },
    templates: [
      { name: 'Carpeta Unipersonal', icon: '🪑' },
      { name: 'Silla', icon: '🪑' },
      { name: 'Escritorio', icon: '🪞' },
      { name: 'Estante / Armario', icon: '🗄️' },
      { name: 'Pizarra Acrílica', icon: '📝' },
    ],
  },
] as const;

interface WizardStep1Props {
  data: Partial<WizardData>;
  onNext: () => void;
  onCancel: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isMobile?: boolean;
}

interface DbTemplate {
  id: string;
  categoryId: string;
  name: string;
  icon?: string;
  defaultBrand?: string;
  defaultModel?: string;
}

interface CatalogueItem {
  name: string;
  icon: string;
  dbId?: string;
  dbCategoryId?: string;
  dbDefaultBrand?: string;
  dbDefaultModel?: string;
  stdCatName: string;
  stdCatIcon: string;
  stdCatColor: string;
  inDb: boolean;
  isCustom?: boolean;
}

interface CatalogueGroup {
  catName: string;
  catIcon: string;
  catColor: string;
  items: CatalogueItem[];
}

export function WizardStep1({
  data,
  onNext,
  onCancel,
  isFullscreen,
  onToggleFullscreen,
  isMobile,
}: WizardStep1Props) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    data.templateId ? new Set([data.templateId]) : new Set(),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<{ catName: string; name: string; icon: string }[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("📦");

  const { data: categories = [] } = useCategories();
  const { data: allTemplates = [], isLoading: templatesLoading } =
    useAllTemplates();
  const createCategoryMutation = useCreateCategory();
  const createTemplateMutation = useCreateTemplate();

  const catalogue: CatalogueGroup[] = useMemo(() => {
    return STANDARD_CATALOGUE.map((stdGroup) => {
      const groupCustomTemplates = customTemplates.filter(t => t.catName === stdGroup.category.name);
      const allTpls = [
        ...stdGroup.templates.map(t => ({ ...t, isCustom: false })), 
        ...groupCustomTemplates.map(t => ({ ...t, isCustom: true }))
      ];

      const items: CatalogueItem[] = allTpls.map((tpl) => {
        const matchingCat = categories.find(
          (c) => c.name.toLowerCase() === stdGroup.category.name.toLowerCase(),
        );
        const dbMatch = matchingCat
          ? allTemplates.find(
              (t: DbTemplate) =>
                t.categoryId === matchingCat.id &&
                t.name.toLowerCase() === tpl.name.toLowerCase(),
            )
          : undefined;

        return {
          name: tpl.name,
          icon: tpl.icon,
          dbId: dbMatch?.id,
          dbCategoryId: dbMatch?.categoryId,
          dbDefaultBrand: dbMatch?.defaultBrand,
          dbDefaultModel: dbMatch?.defaultModel,
          stdCatName: stdGroup.category.name,
          stdCatIcon: stdGroup.category.icon,
          stdCatColor: stdGroup.category.color,
          inDb: !!dbMatch,
          isCustom: tpl.isCustom,
        };
      });

      return {
        catName: stdGroup.category.name,
        catIcon: stdGroup.category.icon,
        catColor: stdGroup.category.color,
        items,
      };
    });
  }, [allTemplates, categories, customTemplates]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return catalogue;
    const q = searchQuery.toLowerCase();
    return catalogue
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            g.catName.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [catalogue, searchQuery]);

  const itemKey = (item: CatalogueItem): string =>
    item.dbId ?? `std:${item.stdCatName}||${item.name}`;

  const toggleItem = (item: CatalogueItem) => {
    const key = itemKey(item);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedKeys(new Set());
  const selectionCount = selectedKeys.size;

  const handleSave = async () => {
    if (isCreating || selectionCount === 0) return;

    const selected: CatalogueItem[] = [];
    for (const group of catalogue) {
      for (const item of group.items) {
        if (selectedKeys.has(itemKey(item))) selected.push(item);
      }
    }

    const allInDb = selected.every((i) => i.inDb);

    if (allInDb) {
      onNext();
      return;
    }

    setIsCreating(true);
    try {
      const catIdCache = new Map<string, string>();

      // 1. Resolver/Crear las categorías necesarias (secuencial para evitar duplicados en la misma categoría)
      for (const item of selected) {
        if (!item.inDb && !catIdCache.has(item.stdCatName)) {
          const existing = categories.find(
            (c) => c.name.toLowerCase() === item.stdCatName.toLowerCase(),
          );
          if (existing) {
            catIdCache.set(item.stdCatName, existing.id);
          } else {
            const created = await createCategoryMutation.mutateAsync({
              name: item.stdCatName,
              icon: item.stdCatIcon,
            });
            catIdCache.set(item.stdCatName, created.id);
          }
        }
      }

      // 2. Crear todos los templates en paralelo para máxima velocidad
      const templatesToCreate = selected.filter(item => !item.inDb);
      await Promise.all(
        templatesToCreate.map(item => 
          createTemplateMutation.mutateAsync({
            name: item.name,
            categoryId: catIdCache.get(item.stdCatName)!,
            icon: item.icon,
          })
        )
      );

      onNext();
    } catch (err) {
      console.error("Error al activar subcategorías", err);
      setIsCreating(false);
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-background relative">
        {isCreating && (
          <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Activando Catálogo</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Configurando los recursos...</p>
          </div>
        )}
        <div className="shrink-0 px-4 pt-2 pb-3 border-b border-border/40">
          <div className="mb-3">
            <h3 className="text-base font-black text-foreground">
              Seleccionar Categoría
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecciona el tipo de recurso que vas a registrar.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full h-11 pl-10 pr-10 text-sm bg-card border border-border rounded-lg shadow-none focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground/50 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => {
                const selectedInGroup = group.items.filter((i) =>
                  selectedKeys.has(itemKey(i)),
                ).length;
                const isGroupSelected = selectedInGroup > 0;

                return (
                  <button
                    key={group.catName}
                    onClick={() => {
                      if (isGroupSelected) {
                        group.items.forEach((item) => {
                          const key = itemKey(item);
                          if (selectedKeys.has(key)) {
                            setSelectedKeys((prev) => {
                              const next = new Set(prev);
                              next.delete(key);
                              return next;
                            });
                          }
                        });
                      } else {
                        const firstInDb = group.items.find((i) => i.inDb);
                        const itemToSelect = firstInDb || group.items[0];
                        if (itemToSelect) {
                          setSelectedKeys(
                            (prev) => new Set([...prev, itemKey(itemToSelect)]),
                          );
                        }
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                      isGroupSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted/30",
                    )}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center text-lg rounded-lg"
                      style={{ backgroundColor: `${group.catColor}20` }}
                    >
                      {group.catIcon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-foreground">
                        {group.catName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.items.length} tipos
                      </p>
                    </div>
                    {isGroupSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 p-4 pb-6 border-t border-border/40 bg-card">
          {selectionCount > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-md border border-primary/20">
                {selectionCount} seleccionado{selectionCount !== 1 ? "s" : ""}
              </span>
              <button
                onClick={clearSelection}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={selectionCount === 0 || isCreating}
            className="w-full h-12 text-sm font-bold"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <WizardLayout
      title="Nuevo Recurso"
      description="Registra un nuevo equipo, mobiliario o software en el inventario escolar."
      onClose={onCancel}
      isFullscreen={isFullscreen}
      onToggleFullscreen={onToggleFullscreen}
    >
      {isCreating && (
        <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Activando Catálogo</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Configurando los recursos seleccionados...</p>
        </div>
      )}
      <div className="shrink-0 px-8 pt-5 pb-3 border-b border-border bg-muted/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
              Seleccionar Subcategoría
            </h3>
            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">
              Selecciona el tipo de recurso que vas a registrar.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar subcategoría..."
            className="w-full h-9 pl-9 pr-9 text-xs bg-card border border-border rounded-none shadow-none focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground/50 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        {templatesLoading ? (
          <div className="space-y-8 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-muted rounded-none" />
                  <div className="w-48 h-3 bg-muted rounded-none" />
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="h-[88px] border border-border/50 bg-card/30 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-none" />
                      <div className="w-16 h-2 bg-muted rounded-none" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredGroups.map((group) => {
              const selectedInGroup = group.items.filter((i) =>
                selectedKeys.has(itemKey(i)),
              ).length;

              return (
                <div key={group.catName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-7 h-7 flex items-center justify-center text-sm rounded-none"
                      style={{ backgroundColor: `${group.catColor}20` }}
                    >
                      {group.catIcon}
                    </div>
                    <h3
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: group.catColor }}
                    >
                      {group.catName}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                    {selectedInGroup > 0 && (
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                        {selectedInGroup} ✓
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {group.items.map((item) => {
                      const key = itemKey(item);
                      const isSelected = selectedKeys.has(key);

                      return (
                        <button
                          key={item.name}
                          onClick={() => toggleItem(item)}
                          className={cn(
                            "relative p-2 rounded-none text-left transition-all group shadow-none border",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : item.inDb
                                ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-900/20 hover:border-primary/30 hover:bg-primary/5"
                                : "border-dashed border-border bg-card/50 hover:border-primary/40 hover:bg-muted/20",
                          )}
                        >
                          {isSelected ? (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-none bg-primary border border-primary flex items-center justify-center shadow-none">
                              <Check className="h-2 w-2 text-white stroke-[3]" />
                            </div>
                          ) : item.inDb ? (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                          ) : (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-none border border-border bg-card opacity-0 group-hover:opacity-100 transition-opacity shadow-none" />
                          )}

                          {item.isCustom && !item.inDb && (
                            <div 
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomTemplates(prev => prev.filter(t => !(t.catName === group.catName && t.name === item.name)));
                                setSelectedKeys(prev => {
                                  const next = new Set(prev);
                                  next.delete(key);
                                  return next;
                                });
                              }}
                              className="absolute top-1 left-1 w-4 h-4 rounded-sm bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors z-10 opacity-0 group-hover:opacity-100"
                              title="Eliminar subcategoría personalizada"
                            >
                              <X className="h-2.5 w-2.5" />
                            </div>
                          )}

                          <div className="flex flex-col items-center gap-1.5 pt-1">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-none flex items-center justify-center text-lg border shadow-none",
                                isSelected
                                  ? "bg-primary/10 border-primary/20"
                                  : item.inDb
                                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50"
                                    : "bg-muted/40 border-border/50",
                              )}
                            >
                              {item.icon}
                            </div>
                            <p
                              className={cn(
                                "text-[9px] font-black uppercase tracking-tight text-center w-full truncate",
                                isSelected
                                  ? "text-primary"
                                  : item.inDb
                                    ? "text-foreground"
                                    : "text-foreground/50",
                              )}
                            >
                              {item.name}
                            </p>
                            {isSelected ? (
                              <span className="text-[7px] font-black uppercase tracking-widest text-primary">
                                seleccionado
                              </span>
                            ) : item.inDb ? (
                              <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                ● activo
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                    
                    {isAddingCustom === group.catName ? (
                      <div className="col-span-full mt-2 p-3 bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in zoom-in-95">
                        <div className="flex-1 w-full">
                          <input 
                            type="text" 
                            autoFocus
                            value={customName}
                            onChange={e => setCustomName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && customName.trim()) {
                                setCustomTemplates(prev => [...prev, { catName: group.catName, name: customName.trim(), icon: customIcon || "📦" }]);
                                const newKey = `std:${group.catName}||${customName.trim()}`;
                                setSelectedKeys(prev => new Set([...prev, newKey]));
                                setIsAddingCustom(null);
                              } else if (e.key === 'Escape') {
                                setIsAddingCustom(null);
                              }
                            }}
                            placeholder="Nombre de la subcategoría..."
                            className="w-full h-9 px-3 text-xs bg-background border border-border focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                        <div>
                          <input 
                            type="text" 
                            value={customIcon}
                            onChange={e => setCustomIcon(e.target.value)}
                            className="w-12 h-9 text-center text-sm bg-background border border-border focus:outline-none focus:border-primary transition-colors"
                            title="Ícono (Emoji)"
                          />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsAddingCustom(null)} 
                            className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground w-full sm:w-auto"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (!customName.trim()) return;
                              setCustomTemplates(prev => [...prev, { catName: group.catName, name: customName.trim(), icon: customIcon || "📦" }]);
                              const newKey = `std:${group.catName}||${customName.trim()}`;
                              setSelectedKeys(prev => new Set([...prev, newKey]));
                              setIsAddingCustom(null);
                            }}
                            disabled={!customName.trim()}
                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsAddingCustom(group.catName);
                          setCustomName("");
                          setCustomIcon("📦");
                        }}
                        className="relative p-2 rounded-none text-left transition-all group shadow-none border border-dashed border-border bg-card/30 hover:border-primary/50 hover:bg-muted/20 flex flex-col items-center justify-center gap-1.5 h-full min-h-[88px]"
                      >
                        <div className="w-8 h-8 rounded-none flex items-center justify-center text-lg border border-dashed border-border/50 bg-muted/20 group-hover:bg-primary/5 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                          <Plus className="h-4 w-4" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-tight text-center w-full truncate text-muted-foreground group-hover:text-primary transition-colors">
                          Añadir Nuevo
                        </p>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredGroups.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Sin resultados para &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 p-5 border-t border-border bg-muted/10 flex items-center justify-between z-10">
        <Button
          variant="outline"
          onClick={onCancel}
          className="font-black uppercase tracking-widest text-[10px] h-10 px-6 min-w-[120px]"
        >
          Cancelar
        </Button>
        <div className="flex items-center gap-3">
          {selectionCount > 0 && (
            <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-2 duration-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 border border-primary/20">
                {selectionCount} seleccionada{selectionCount !== 1 ? "s" : ""}
              </span>
              <button
                onClick={clearSelection}
                className="p-1 hover:bg-muted/30 transition-colors"
                title="Limpiar selección"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={selectionCount === 0 || isCreating}
            variant="default"
            className="h-10 px-8 font-black uppercase tracking-widest text-[11px]"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Activando...
              </>
            ) : (
              "Guardar Selección"
            )}
          </Button>
        </div>
      </div>

    </WizardLayout>
  );
}
