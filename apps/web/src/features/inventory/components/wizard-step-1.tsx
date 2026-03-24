"use client";

import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Check, X } from "lucide-react";
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

// ─── Standard catalogue ────────────────────────────────────────────────────────
const STANDARD_CATALOGUE = [
  {
    category: { name: "Equipos Portátiles", icon: "💻", color: "#0052CC" },
    templates: [
      { name: "Laptop", icon: "💻" },
      { name: "Tablet", icon: "📱" },
      { name: "Chromebook", icon: "🖥️" },
    ],
  },
  {
    category: { name: "Displays y Multimedia", icon: "📺", color: "#0065FF" },
    templates: [
      { name: "Proyector", icon: "📽️" },
      { name: "Televisor", icon: "📺" },
      { name: "Monitor", icon: "🖥️" },
    ],
  },
  {
    category: { name: "Periféricos", icon: "🎧", color: "#2684FF" },
    templates: [
      { name: "Mouse", icon: "🖱️" },
      { name: "Teclado", icon: "⌨️" },
      { name: "Auriculares", icon: "🎧" },
      { name: "Webcam", icon: "📷" },
    ],
  },
  {
    category: { name: "Red e Infraestructura", icon: "📡", color: "#00B8D9" },
    templates: [
      { name: "Switch", icon: "🔀" },
      { name: "Router", icon: "📡" },
      { name: "Access Point", icon: "📶" },
    ],
  },
  {
    category: { name: "Almacenamiento", icon: "💾", color: "#36B37E" },
    templates: [
      { name: "Disco Duro Externo", icon: "💾" },
      { name: "Memoria USB", icon: "🔌" },
    ],
  },
  {
    category: { name: "Protección Eléctrica", icon: "🔋", color: "#FFAB00" },
    templates: [
      { name: "UPS", icon: "🔋" },
      { name: "Regleta", icon: "🔌" },
      { name: "Estabilizador", icon: "⚡" },
    ],
  },
  {
    category: { name: "Mobiliario", icon: "🪑", color: "#BF2600" },
    templates: [
      { name: "Silla", icon: "🪑" },
      { name: "Mesa", icon: "🪞" },
      { name: "Estante", icon: "🗄️" },
    ],
  },
  {
    category: { name: "Equipos de Audio", icon: "🎵", color: "#6554C0" },
    templates: [
      { name: "Micrófono", icon: "🎤" },
      { name: "Parlante", icon: "🔊" },
      { name: "Amplificador", icon: "📻" },
    ],
  },
  {
    category: { name: "Kits Educativos", icon: "🤖", color: "#00875A" },
    templates: [
      { name: "Kit de Robótica", icon: "🤖" },
      { name: "Impresora 3D", icon: "🖨️" },
      { name: "Drone", icon: "🚁" },
    ],
  },
  {
    category: { name: "Mantenimiento", icon: "🧰", color: "#505F79" },
    templates: [
      { name: "Herramienta", icon: "🔧" },
      { name: "Kit de Limpieza", icon: "🧹" },
    ],
  },
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface WizardStep1Props {
  data: Partial<WizardData>;
  onNext: () => void;
  onCancel: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface DbTemplate {
  id: string;
  categoryId: string;
  name: string;
  icon?: string;
  defaultBrand?: string;
  defaultModel?: string;
}

// Unified item: either it exists in DB (has id/categoryId) or it's standard-only
interface CatalogueItem {
  name: string;
  icon: string;
  // If exists in DB:
  dbId?: string;
  dbCategoryId?: string;
  dbDefaultBrand?: string;
  dbDefaultModel?: string;
  // Standard-catalogue parent
  stdCatName: string;
  stdCatIcon: string;
  stdCatColor: string;
  inDb: boolean;
}

interface CatalogueGroup {
  catName: string;
  catIcon: string;
  catColor: string;
  items: CatalogueItem[];
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function WizardStep1({
  data,
  onNext,
  onCancel,
  isFullscreen,
  onToggleFullscreen,
}: WizardStep1Props) {
  // Multi-select: key = dbId (if in DB) OR "std:catName||tplName"
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    data.templateId ? new Set([data.templateId]) : new Set(),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: allTemplates = [], isLoading: templatesLoading } = useAllTemplates();
  const createCategoryMutation = useCreateCategory();
  const createTemplateMutation = useCreateTemplate();

  // ── Build unified catalogue (standard + DB) ──────────────────────────────────
  const catalogue: CatalogueGroup[] = useMemo(() => {
    return STANDARD_CATALOGUE.map((stdGroup) => {
      const items: CatalogueItem[] = stdGroup.templates.map((tpl) => {
        // Find a matching DB template by name (case-insensitive) within any
        // category whose name matches the standard category
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
        };
      });

      return {
        catName: stdGroup.category.name,
        catIcon: stdGroup.category.icon,
        catColor: stdGroup.category.color,
        items,
      };
    });
  }, [allTemplates, categories]);

  // ── Filter by search ─────────────────────────────────────────────────────────
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

  // ── Key helpers ──────────────────────────────────────────────────────────────
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

    // Collect selected items
    const selected: CatalogueItem[] = [];
    for (const group of catalogue) {
      for (const item of group.items) {
        if (selectedKeys.has(itemKey(item))) selected.push(item);
      }
    }

    // If ALL selected items already exist in DB, proceed directly
    const allInDb = selected.every((i) => i.inDb);

    if (allInDb) {
      onNext(); // Empty payload, step 2 is removed
      return;
    }

    // Some need to be created in DB first
    setIsCreating(true);
    try {
      const catIdCache = new Map<string, string>();

      for (const item of selected) {
        let categoryId = item.dbCategoryId;

        if (!item.inDb) {
          // Ensure category exists
          if (!categoryId) {
            categoryId = catIdCache.get(item.stdCatName);
            if (!categoryId) {
              const existing = categories.find(
                (c) => c.name.toLowerCase() === item.stdCatName.toLowerCase(),
              );
              if (existing) {
                categoryId = existing.id;
              } else {
                const newCat = await createCategoryMutation.mutateAsync({
                  name: item.stdCatName,
                  icon: item.stdCatIcon,
                  color: item.stdCatColor,
                });
                categoryId = newCat.id;
              }
              catIdCache.set(item.stdCatName, categoryId);
            }
          }

          // Create template
          await createTemplateMutation.mutateAsync({
            categoryId: categoryId!,
            name: item.name,
            icon: item.icon,
          });
        }
      }

      onNext(); // Empty payload, step 2 is removed
    } catch (err) {
      console.error("Error al activar subcategorías", err);
      setIsCreating(false);
    }
  };

  return (
    <WizardLayout
      title="Nuevo Recurso"
      description="Registra un nuevo recurso en el inventario."
      onClose={onCancel}
      isFullscreen={isFullscreen}
      onToggleFullscreen={onToggleFullscreen}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
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

        {/* Search */}
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

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        {templatesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {filteredGroups.map((group) => {
              const selectedInGroup = group.items.filter((i) =>
                selectedKeys.has(itemKey(i)),
              ).length;

              return (
                <div key={group.catName}>
                  {/* Category separator */}
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

                  {/* Templates grid */}
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
                                // In DB but not selected: subtle green tint, solid border
                                ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-900/20 hover:border-primary/30 hover:bg-primary/5"
                                // Not in DB: dashed border, muted
                                : "border-dashed border-border bg-card/50 hover:border-primary/40 hover:bg-muted/20",
                          )}
                        >
                          {/* Top-right indicator */}
                          {isSelected ? (
                            // Checked: filled blue checkbox
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-none bg-primary border border-primary flex items-center justify-center shadow-none">
                              <Check className="h-2 w-2 text-white stroke-[3]" />
                            </div>
                          ) : item.inDb ? (
                            // In DB, not selected: green dot
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                          ) : (
                            // Not in DB: empty box hint on hover
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-none border border-border bg-card opacity-0 group-hover:opacity-100 transition-opacity shadow-none" />
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
                            {/* State label */}
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

      {/* ── Footer ────────────────────────────────────────────────────────── */}
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
