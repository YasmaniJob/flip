import { motion, AnimatePresence } from "framer-motion";
import { Search, MousePointer2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useMemo } from "react";
import { Resource } from "@/features/inventory/hooks/use-resources";
import { Category } from "@/features/inventory/hooks/use-categories";
import { cn } from "@/lib/utils";

interface InventoryToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    categoryFilter: string;
    onCategoryFilterChange: (value: string) => void;
    categories: Category[];
    resources: Resource[];
    filteredCount: number;
}

// Technical Interactive Sparkline Component
function Sparkline({ color, data }: { color: string, data: number[] }) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const containerRef = useRef<SVGSVGElement>(null);
    const width = 200;
    const height = 40;
    
    const { points, pathData } = useMemo(() => {
        const m = Math.max(...data, 1);
        const pts = data.map((d, i) => ({
            x: (i / (data.length - 1)) * width,
            y: height - (d / m) * height
        }));
        const pd = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
        return { points: pts, pathData: pd };
    }, [data]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const normalizedX = (x / rect.width) * (data.length - 1);
        const index = Math.round(normalizedX);
        setHoverIndex(index);
    };

    return (
        <div className="relative w-full h-10 group/spark" onMouseLeave={() => setHoverIndex(null)}>
            <svg 
                ref={containerRef}
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${width} ${height}`} 
                preserveAspectRatio="none" 
                className="overflow-visible"
                onMouseMove={handleMouseMove}
            >
                <line x1="0" y1={height} x2={width} y2={height} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                
                <motion.path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {hoverIndex !== null && (
                    <>
                        <motion.line
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            x1={points[hoverIndex].x}
                            y1="0"
                            x2={points[hoverIndex].x}
                            y2={height}
                            stroke="rgba(0,0,0,0.2)"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                        />
                        <motion.circle
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            cx={points[hoverIndex].x}
                            cy={points[hoverIndex].y}
                            r="3"
                            fill={color}
                            stroke="white"
                            strokeWidth="1.5"
                        />
                    </>
                )}
            </svg>

            <AnimatePresence>
                {hoverIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        className="absolute bottom-full mb-2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none uppercase tracking-widest border border-white/10"
                        style={{ left: `${(hoverIndex / (data.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                    >
                        VALOR: {data[hoverIndex]}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AnimatedNumber({ value }: { value: number }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="tabular-nums inline-block"
        >
            {value}
        </motion.span>
    );
}

export function InventoryToolbar({
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    categories,
    resources,
    filteredCount,
    categoryFilter,
    onCategoryFilterChange
}: InventoryToolbarProps) {
    const { stats, segments, categoryCounts } = useMemo(() => {
        const counts = {
            total: resources.length,
            available: resources.filter(r => r.status === "disponible").length,
            borrowed: resources.filter(r => r.status === "prestado").length,
            maintenance: resources.filter(r => r.status === "mantenimiento").length,
            retired: resources.filter(r => r.status === "baja").length,
        };

        const segs = [
            { count: counts.available, color: "#10b981", id: "disponible", label: "Disponible", trend: [10, 15, 12, 18, 20, 24] },
            { count: counts.borrowed, color: "#3b82f6", id: "prestado", label: "Prestado", trend: [5, 8, 7, 12, 10, 15] },
            { count: counts.maintenance, color: "#f59e0b", id: "mantenimiento", label: "Reparación", trend: [2, 4, 3, 5, 4, 2] },
            { count: counts.retired, color: "#f43f5e", id: "baja", label: "Baja", trend: [0, 1, 1, 2, 2, 4] },
        ];

        const catCounts = resources.reduce((acc, r) => {
            if (r.categoryId) acc[r.categoryId] = (acc[r.categoryId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { stats: counts, segments: segs, categoryCounts: catCounts };
    }, [resources]);

    const total = stats.total || 1;
    const radius = 38; 
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <div className="flex flex-col md:flex-row gap-0 border border-border overflow-hidden bg-white shadow-none mb-4">
            {/* LEFT SIDE: Metrics + Controls */}
            <div className="flex-1 flex flex-col divide-y divide-border">
                {/* Row 1: Status Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
                    {segments.map((seg) => {
                        const isActive = statusFilter === seg.id;
                        return (
                            <button
                                key={seg.id}
                                onClick={() => onStatusFilterChange(isActive ? "all" : seg.id)}
                                className={cn(
                                    "flex flex-col py-2.5 px-4 group transition-all duration-200 hover:bg-slate-50 text-left relative",
                                    isActive && "bg-slate-50/80"
                                )}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="status-active-bar"
                                        className="absolute top-0 left-0 w-full h-0.5" 
                                        style={{ backgroundColor: seg.color }} 
                                    />
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-[0.15em] transition-colors" style={{ color: isActive ? seg.color : "rgba(0,0,0,0.4)" }}>
                                        {seg.label}
                                    </span>
                                    <MousePointer2 className={cn(
                                        "h-2.5 w-2.5 transition-all duration-300",
                                        isActive ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-12"
                                    )} style={{ color: seg.color }} />
                                </div>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-lg font-black text-foreground leading-none tracking-tight">
                                        <AnimatedNumber value={seg.count} />
                                    </span>
                                </div>
                                <div className="mt-1.5 h-4 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Sparkline color={seg.color} data={seg.trend} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Row 2: Control Strip */}
                <div className="bg-slate-50/30 p-2 flex flex-col md:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 z-10" />
                        <Input
                            type="search"
                            placeholder="Buscar en inventario..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9 pr-20 h-9 rounded-none border-border bg-white hover:border-primary/40 focus-visible:ring-0 focus-visible:border-primary/50 transition-all text-[11px] font-bold uppercase tracking-tight shadow-none placeholder:text-muted-foreground/30"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                            <span className="text-[9px] font-black text-primary/60 bg-primary/5 px-2 py-1 uppercase tracking-widest border border-primary/10">
                                {filteredCount}
                            </span>
                        </div>
                    </div>

                    <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                        <SelectTrigger className="w-full md:w-[180px] h-9 rounded-none border-border bg-white hover:border-primary/40 focus:ring-0 focus:border-primary/50 shadow-none text-[9px] font-black tracking-widest uppercase transition-colors px-3">
                            <SelectValue placeholder="Categorías" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-border shadow-none border bg-white p-1">
                            <SelectItem value="all" className="rounded-none cursor-pointer py-1.5 focus:bg-slate-50">
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">Todas</span>
                            </SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} className="rounded-none cursor-pointer py-1.5 focus:bg-slate-50">
                                    <div className="flex items-center justify-between w-full min-w-[150px]">
                                        <span className="text-[9px] font-black uppercase tracking-widest">{cat.name}</span>
                                        <span className="text-[9px] font-black text-muted-foreground/30 ml-4 tabular-nums">({categoryCounts[cat.id] || 0})</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* RIGHT SIDE: Donut Status */}
            <div className="w-full md:w-[140px] border-l border-border flex flex-col items-center justify-center p-4 bg-slate-50/20 relative">
                <button 
                    onClick={() => onStatusFilterChange("all")}
                    className="relative flex flex-col items-center justify-center w-full active:scale-95 transition-transform"
                >
                    <div className="relative w-24 h-24 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
                            {segments.map((seg) => {
                                const segmentLength = (seg.count / total) * circumference;
                                const offset = accumulatedOffset;
                                accumulatedOffset += segmentLength;
                                if (seg.count === 0) return null;
                                return (
                                    <motion.circle
                                        key={seg.id}
                                        cx="50" cy="50" r={radius}
                                        fill="transparent"
                                        stroke={seg.color}
                                        strokeWidth="6"
                                        strokeDasharray={`${segmentLength} ${circumference}`}
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset: -offset }}
                                        transition={{ duration: 1.2, ease: "circOut" }}
                                    />
                                );
                            })}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Total</span>
                            <span className="text-xl font-black text-foreground tabular-nums tracking-tighter mt-0.5">
                                <AnimatedNumber value={stats.total} />
                            </span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
