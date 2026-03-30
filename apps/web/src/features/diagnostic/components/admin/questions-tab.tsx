'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, X, Check, FileQuestion, Layers, AlertCircle, Sparkles, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { ActionConfirm } from '@/components/molecules/action-confirm';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface Question {
  id: string;
  categoryId: string;
  categoryName: string;
  text: string;
  order: number;
  isActive: boolean;
  isCustom: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface DiagnosticResponse {
  categories: Category[];
  activeQuestions: Question[];
  catalogQuestions: Question[];
  importedBaseQuestionIds: string[];
}

interface QuestionsTabProps {
  institutionId: string;
}

export function DiagnosticQuestionsTab({ institutionId }: QuestionsTabProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    categoryId: '',
    text: '',
  });

  // Fetch questions
  const { data, isLoading, isError, refetch } = useQuery<DiagnosticResponse>({
    queryKey: ['diagnostic-questions', institutionId],
    queryFn: async () => {
      const res = await fetch(`/api/institutions/${institutionId}/diagnostic/questions`);
      if (!res.ok) throw new Error('Error al cargar preguntas');
      return res.json();
    },
  });

  // Create/Update mutation (Only Custom Questions)
  const saveMutation = useMutation({
    mutationFn: async (data: { categoryId: string; text: string; questionId?: string }) => {
      const url = data.questionId
        ? `/api/institutions/${institutionId}/diagnostic/questions/${data.questionId}`
        : `/api/institutions/${institutionId}/diagnostic/questions`;
      
      const res = await fetch(url, {
        method: data.questionId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: data.categoryId,
          text: data.text,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar pregunta');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingQuestion ? 'Pregunta actualizada' : 'Pregunta creada');
      queryClient.invalidateQueries({ queryKey: ['diagnostic-questions', institutionId] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle active/inactive mutation (Only Custom Questions)
  const toggleActiveMutation = useMutation({
    mutationFn: async (vars: { questionId: string; isActive: boolean }) => {
      const res = await fetch(
        `/api/institutions/${institutionId}/diagnostic/questions/${vars.questionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: vars.isActive }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar pregunta');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isActive ? 'Pregunta activada' : 'Pregunta desactivada');
      queryClient.invalidateQueries({ queryKey: ['diagnostic-questions', institutionId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation (Hard delete Custom OR Remove Base from Settings)
  const deleteMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const res = await fetch(
        `/api/institutions/${institutionId}/diagnostic/questions/${questionId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar pregunta');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Pregunta removida correctamente');
      queryClient.invalidateQueries({ queryKey: ['diagnostic-questions', institutionId] });
      setDeletingQuestion(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setDeletingQuestion(null);
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (questionIds: string[]) => {
      const res = await fetch(
        `/api/institutions/${institutionId}/diagnostic/questions/import`,
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds })
        }
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al importar preguntas');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Preguntas importadas al cuestionario');
      queryClient.invalidateQueries({ queryKey: ['diagnostic-questions', institutionId] });
      setIsImportDialogOpen(false);
      setSelectedImportIds([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });


  const handleOpenDialog = (question?: Question) => {
    if (question && !question.isCustom) return; // Safeguard

    if (question) {
      setEditingQuestion(question);
      setFormData({
        categoryId: question.categoryId,
        text: question.text,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        categoryId: data?.categories[0]?.id || '',
        text: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
    setFormData({ categoryId: '', text: '' });
  };

  const handleSave = () => {
    if (!formData.text.trim()) {
      toast.error('El texto de la pregunta es requerido');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Debes seleccionar una categoría');
      return;
    }

    saveMutation.mutate({
      ...formData,
      questionId: editingQuestion?.id,
    });
  };

  const handleDelete = () => {
    if (deletingQuestion) {
      deleteMutation.mutate(deletingQuestion.id);
    }
  };

  const handleToggleActive = (questionId: string, currentActive: boolean) => {
    toggleActiveMutation.mutate({
      questionId,
      isActive: !currentActive,
    });
  };

  const handleImport = () => {
    if (selectedImportIds.length === 0) {
      toast.error('Selecciona al menos una pregunta para importar');
      return;
    }
    importMutation.mutate(selectedImportIds);
  };

  const activeQuestions = data?.activeQuestions || [];
  const categories = data?.categories || [];
  const activeCount = activeQuestions.filter(q => q.isActive).length;

  const validCatalogQuestions = useMemo(() => {
    if (!data || !data.catalogQuestions) return [];
    const importedBase = data.importedBaseQuestionIds || [];
    return data.catalogQuestions.filter(q => !importedBase.includes(q.id));
  }, [data]);

  const questionsByCategory = useMemo(() => {
    const grouped: Record<string, Question[]> = {};
    categories.forEach(cat => grouped[cat.id] = []);
    activeQuestions.forEach(q => {
      if (!grouped[q.categoryId]) {
        grouped[q.categoryId] = [];
      }
      grouped[q.categoryId].push(q);
    });
    return grouped;
  }, [activeQuestions, categories]);

  const catalogByCategory = useMemo(() => {
    const grouped: Record<string, Question[]> = {};
    categories.forEach(cat => grouped[cat.id] = []);
    validCatalogQuestions.forEach(q => {
      if (!grouped[q.categoryId]) {
        grouped[q.categoryId] = [];
      }
      grouped[q.categoryId].push(q);
    });
    return grouped;
  }, [validCatalogQuestions, categories]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-50/20 border border-rose-200 rounded-lg p-6 text-center shadow-none">
        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-3" />
        <p className="text-rose-900 font-bold text-sm uppercase tracking-tight">Error al cargar preguntas</p>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          className="mt-4 rounded-md border-border shadow-none font-black uppercase tracking-widest text-[11px] h-9"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-foreground uppercase">Gestión de Preguntas</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="bg-card hover:bg-muted/50 text-foreground border-border rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9"
          >
            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
            Importar Cuestionario
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Nueva Pregunta
          </Button>
        </div>
      </div>

      {emptyState(activeQuestions.length, handleOpenDialog, () => setIsImportDialogOpen(true))}

      {/* Categories and Questions */}
      {activeQuestions.length > 0 && (
        <div className="space-y-10">
          {categories.map(category => {
            const catQuestions = questionsByCategory[category.id] || [];
            if (catQuestions.length === 0) return null;

            return (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-foreground uppercase">{category.name}</h3>
                    {category.description && (
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{category.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catQuestions.map(question => (
                    <div
                      key={question.id}
                      className={cn(
                        "bg-card/40 border rounded-lg p-4 hover:bg-card/60 transition-all group flex flex-col justify-between shadow-none relative min-h-[120px]",
                        question.isActive ? "border-border hover:border-primary/40" : "border-muted-foreground/20 opacity-75"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-md bg-card border flex items-center justify-center shadow-none shrink-0 mt-0.5",
                            question.isActive ? "border-border text-primary" : "border-muted text-muted-foreground"
                          )}>
                            <FileQuestion className="h-4 w-4" />
                          </div>
                          <div className="space-y-2">
                            <h4 className={cn(
                              "font-bold text-[13px] leading-snug",
                              question.isActive ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {question.text}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2">
                              {question.isCustom ? (
                                <span className="text-[9px] bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                  Personalizada
                                </span>
                              ) : (
                                <span className="text-[9px] bg-purple-500/10 text-purple-600 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                                  Pregunta Base
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Toggles and Actions */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {/* Only show isActive toggle for Custom Questions */}
                          {question.isCustom && (
                            <div className="flex items-center gap-2 bg-background border border-border px-2 py-1 rounded-md mb-1">
                              <Label htmlFor={`toggle-${question.id}`} className={cn(
                                "text-[10px] font-black uppercase tracking-widest cursor-pointer",
                                question.isActive ? "text-primary" : "text-muted-foreground"
                              )}>
                                {question.isActive ? 'Activa' : 'Inactiva'}
                              </Label>
                              <Switch
                                id={`toggle-${question.id}`}
                                checked={question.isActive}
                                onCheckedChange={() => handleToggleActive(question.id, question.isActive)}
                                disabled={toggleActiveMutation.isPending}
                                className="data-[state=checked]:bg-primary h-5 w-9 [&_span]:h-4 [&_span]:w-4 [&_span]:data-[state=checked]:translate-x-4"
                              />
                            </div>
                          )}
                          
                          <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {question.isCustom && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(question)}
                                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingQuestion(question)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-md"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Import Modal */}
      <Dialog open={isImportDialogOpen} onOpenChange={(val) => {
        if (!val) {
          setIsImportDialogOpen(false);
          setSelectedImportIds([]);
        }
      }}>
        <DialogContent showCloseButton={false} className="max-w-2xl p-0 flex flex-col overflow-hidden border border-border shadow-none rounded-sm bg-background max-h-[85vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Catálogo de Preguntas</DialogTitle>
          </DialogHeader>

          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-border bg-card/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground tracking-tight uppercase">
                  Catálogo de Preguntas
                </h3>
              </div>
            </div>
            <button 
              onClick={() => setIsImportDialogOpen(false)}
              className="p-2 rounded-sm hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-muted/5">
            {validCatalogQuestions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                 <div className="w-12 h-12 bg-card border rounded-full flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-primary" />
                 </div>
                 <p className="text-sm font-bold uppercase tracking-widest">¡Excelente!</p>
                 <p className="text-xs font-medium mt-1">Ya has importado todas las preguntas base disponibles.</p>
              </div>
            ) : (
              categories.map(category => {
                const cats = catalogByCategory[category.id] || [];
                if (cats.length === 0) return null;

                const allSelected = cats.every(q => selectedImportIds.includes(q.id));

                const toggleCategory = () => {
                   if (allSelected) {
                      setSelectedImportIds(prev => prev.filter(id => !cats.find(c => c.id === id)));
                   } else {
                      const newIds = new Set(selectedImportIds);
                      cats.forEach(c => newIds.add(c.id));
                      setSelectedImportIds(Array.from(newIds));
                   }
                };

                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/50">
                       <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">{category.name}</h4>
                       </div>
                       <Button variant="ghost" size="sm" onClick={toggleCategory} className="text-[10px] font-bold h-6 uppercase tracking-widest text-primary hover:bg-primary/10">
                         {allSelected ? 'Desmarcar Todas' : 'Seleccionar Todas'}
                       </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                       {cats.map(question => (
                          <div 
                             key={question.id} 
                             onClick={() => {
                               setSelectedImportIds(prev => 
                                 prev.includes(question.id) 
                                   ? prev.filter(id => id !== question.id)
                                   : [...prev, question.id]
                               );
                             }}
                             className={cn(
                               "flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all bg-background hover:bg-muted/30",
                               selectedImportIds.includes(question.id) ? "border-primary/50 bg-primary/5" : "border-border"
                             )}
                          >
                             <div className="mt-0.5">
                               <Checkbox 
                                 checked={selectedImportIds.includes(question.id)} 
                                 className="pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                               />
                             </div>
                             <p className="text-[13px] font-medium leading-snug">{question.text}</p>
                          </div>
                       ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 p-5 border-t border-border bg-card/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
               {selectedImportIds.length} Seleccionadas
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsImportDialogOpen(false)}
                className="text-[11px] font-black uppercase tracking-widest h-10 px-6 rounded-sm hover:bg-muted text-muted-foreground"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedImportIds.length === 0 || importMutation.isPending}
                className="h-10 px-8 rounded-sm font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-none flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Inbox className="h-3.5 w-3.5" />
                )}
                Importar {selectedImportIds.length > 0 && `(${selectedImportIds.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Create/Edit Modal - Jira Single Column Style */}
      <Dialog open={isDialogOpen} onOpenChange={(val) => {
        if (!val) handleCloseDialog();
      }}>
        <DialogContent showCloseButton={false} className="max-w-xl p-0 flex flex-col overflow-hidden border border-border shadow-none rounded-sm bg-background">
          <DialogHeader className="sr-only">
            <DialogTitle>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
          </DialogHeader>

          {/* Header */}
          <div className="shrink-0 px-6 py-5 border-b border-border bg-card/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                <FileQuestion className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground tracking-tight uppercase">
                  {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta Personalizada'}
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                  {editingQuestion ? 'Modifica los detalles del registro' : 'Configura una pregunta para el diagnóstico'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleCloseDialog}
              className="p-2 rounded-sm hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
            <div className="space-y-3">
              <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                Categoría de Evaluación <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger id="category" className="h-11 rounded-sm border-border bg-background shadow-none font-bold text-sm">
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border shadow-md">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="font-medium text-sm rounded-sm">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="text" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                Enunciado de la Pregunta <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Ej: ¿Puedo crear presentaciones interactivas usando herramientas digitales?"
                className="min-h-[120px] text-sm rounded-sm border-border focus:ring-4 focus:ring-primary/5 focus:border-primary/50 bg-background shadow-none font-bold placeholder:text-muted-foreground/30 transition-all resize-none block w-full outline-none"
                maxLength={500}
              />
              <div className="flex justify-end mt-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {formData.text.length} / 500 CARACTERES
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 p-5 border-t border-border bg-muted/10 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleCloseDialog}
              className="text-[11px] font-black uppercase tracking-widest h-10 px-6 rounded-sm hover:bg-muted text-muted-foreground"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.text.trim() || !formData.categoryId || saveMutation.isPending}
              className="h-10 px-8 rounded-sm font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-none flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {editingQuestion ? 'Guardar Cambios' : 'Crear Registro'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ActionConfirm
        open={!!deletingQuestion}
        onOpenChange={(open) => !open && setDeletingQuestion(null)}
        title={!deletingQuestion?.isCustom ? "¿Quitar del cuestionario?" : "¿Confirmar eliminación?"}
        description={!deletingQuestion?.isCustom 
          ? `Estás por quitar la pregunta base "${deletingQuestion?.text}" de tu cuestionario. Podrás volver a importarla luego.`
          : `Estás por eliminar permanentemente una pregunta personalizada del módulo de diagnóstico.`}
        onConfirm={handleDelete}
        confirmText={!deletingQuestion?.isCustom ? "Quitar pregunta" : "Eliminar permanentemente"}
        cancelText="Mantenimiento"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function emptyState(count: number, handleOpenDialog: () => void, handleOpenImport: () => void) {
  if (count > 0) return null;
  return (
    <div className="bg-card/30 border border-dashed border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="max-w-xs space-y-2">
        <h3 className="font-black text-sm uppercase tracking-tight text-foreground">Sin preguntas activas</h3>
        <p className="text-[11px] text-muted-foreground font-medium mb-6">
          Comienza importando las preguntas base o crea las tuyas propias.
        </p>
      </div>
      <div className="flex gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleOpenImport}
          className="bg-card hover:bg-muted/50 text-foreground border-border rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-10 px-6"
        >
          <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
          Importar Cuestionario
        </Button>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-10 px-6"
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          Crear pregunta
        </Button>
      </div>
    </div>
  );
}
