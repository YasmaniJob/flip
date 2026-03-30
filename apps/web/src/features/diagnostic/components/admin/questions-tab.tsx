'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, XCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  categoryId: string;
  categoryName: string;
  text: string;
  order: number;
  isCustom: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface QuestionsTabProps {
  institutionId: string;
}

export function DiagnosticQuestionsTab({ institutionId }: QuestionsTabProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    text: '',
  });

  // Fetch questions
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['diagnostic-questions', institutionId],
    queryFn: async () => {
      const res = await fetch(`/api/institutions/${institutionId}/diagnostic/questions`);
      if (!res.ok) throw new Error('Error al cargar preguntas');
      return res.json() as Promise<{ questions: Question[]; categories: Category[] }>;
    },
  });

  // Create/Update mutation
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

  // Delete mutation
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
      toast.success('Pregunta eliminada');
      queryClient.invalidateQueries({ queryKey: ['diagnostic-questions', institutionId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleOpenDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        categoryId: question.categoryId,
        text: question.text,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        categoryId: questionsData?.categories[0]?.id || '',
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

  const handleDelete = (questionId: string) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      deleteMutation.mutate(questionId);
    }
  };

  if (questionsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const questions = questionsData?.questions || [];
  const categories = questionsData?.categories || [];
  const customQuestions = questions.filter(q => q.isCustom);
  const defaultQuestions = questions.filter(q => !q.isCustom);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Preguntas</CardTitle>
              <CardDescription>
                Administra las preguntas del diagnóstico ({questions.length} total, {customQuestions.length} personalizadas)
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Pregunta
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Custom Questions */}
          {customQuestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Preguntas Personalizadas ({customQuestions.length})
              </h3>
              <div className="space-y-2">
                {customQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{question.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {question.categoryName}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Personalizada
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Questions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Preguntas Base ({defaultQuestions.length})
            </h3>
            <div className="space-y-2">
              {defaultQuestions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
                >
                  <HelpCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{question.text}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {question.categoryName}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? 'Modifica los detalles de la pregunta personalizada'
                : 'Crea una nueva pregunta personalizada para el diagnóstico'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Texto de la Pregunta</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Escribe la pregunta aquí..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {formData.text.length}/500 caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
