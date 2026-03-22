
import { Check, Package } from 'lucide-react';
import { Resource } from '../../types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ResourceChecklistItemProps {
    resource: Resource;
    isReceived: boolean;
    onToggle: (id: string, received: boolean) => void;
}

export function ResourceChecklistItem({ resource, isReceived, onToggle }: ResourceChecklistItemProps) {
    const formattedId = (resource.internalId || '').split('-').pop()?.replace(/^0+/, '').padStart(2, '0') || resource.internalId || '';

    return (
        <div
            onClick={() => onToggle(resource.id, !isReceived)}
            className={cn(
                "flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors",
                isReceived
                    ? "bg-muted/10 border-primary"
                    : "bg-card hover:bg-muted/30 border-border"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "h-10 w-10 rounded-md flex items-center justify-center transition-colors",
                    isReceived ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                    {isReceived ? <Check className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
                <div>
                    <p className={cn("font-medium text-sm", isReceived && "text-emerald-900")}>
                        {resource.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {resource.brand} {resource.model} • {formattedId}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isReceived ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary uppercase font-bold tracking-wider text-[10px] border-primary/20 rounded-sm">
                        Recibido
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-muted-foreground uppercase font-bold tracking-wider text-[10px] border-border rounded-sm">
                        Pendiente
                    </Badge>
                )}
            </div>
        </div>
    );
}
