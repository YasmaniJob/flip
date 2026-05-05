"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateComment, useDeleteComment } from "../hooks/use-comments";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { ActionConfirm } from "@/components/molecules/action-confirm";
import type { IncidentComment } from "../types";

interface IncidentCommentsProps {
  incidentId: string;
  comments: Array<IncidentComment & {
    author: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export function IncidentComments({ incidentId, comments }: IncidentCommentsProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState("");
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const createComment = useCreateComment(incidentId);
  const deleteComment = useDeleteComment(incidentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error("El comentario no puede estar vacío");
      return;
    }

    try {
      await createComment.mutateAsync({ content: newComment });
      setNewComment("");
      toast.success("Comentario agregado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al agregar comentario");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId);
      toast.success("Comentario eliminado");
      setDeletingComment(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar comentario");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">
          Comentarios ({comments.length})
        </h2>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Agrega un comentario o actualización..."
          className="min-h-[100px] rounded-none border-border resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={createComment.isPending || !newComment.trim()}
            className="rounded-none"
          >
            Agregar Comentario
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 border border-dashed border-border">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground/60">
              No hay comentarios aún. Sé el primero en comentar.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = session?.user?.id === comment.authorId;
            const canDelete = session?.user?.role === 'admin' || 
                            session?.user?.role === 'pip' || 
                            session?.user?.isSuperAdmin ||
                            isAuthor;

            return (
              <div
                key={comment.id}
                className="bg-card border border-border p-4 space-y-3"
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {comment.author.name}
                        </p>
                        {comment.isResolutionComment && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-green-300 bg-green-50 text-green-700">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Resolución
                          </span>
                        )}
                        {comment.isEdited && (
                          <span className="text-[9px] text-muted-foreground/60">
                            (editado)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {canDelete && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-none border border-transparent hover:border-destructive/20 hover:bg-destructive/5 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="pl-11">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      {deletingComment && (
        <ActionConfirm
          open={!!deletingComment}
          onOpenChange={(open) => !open && setDeletingComment(null)}
          title="¿Eliminar comentario?"
          description="Esta acción no se puede deshacer. El comentario será eliminado permanentemente."
          onConfirm={() => handleDelete(deletingComment)}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
          isLoading={deleteComment.isPending}
        />
      )}
    </div>
  );
}
