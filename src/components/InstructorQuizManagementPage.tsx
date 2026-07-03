import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getStoredToken } from '../services/api';
import { Plus, Trash2, Edit2, HelpCircle, Loader2, Clock, BookOpen, FileQuestion } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InstructorQuizManagementPage() {
  const { setActiveTab, setActiveQuizId, authToken } = useAppStore();
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: quizzes = [], isLoading } = useQuery<any[]>({
    queryKey: ['instructor-quizzes', authToken],
    queryFn: () => api.quizzes.list(),
    enabled: !!getStoredToken(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.quizzes.delete(id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instructor-quizzes'] }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" /> Quiz Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Create and manage quizzes for your courses</p>
        </div>
        <Button onClick={() => setActiveTab('instructor-quiz-create')} className="h-9 bg-primary text-white text-xs font-bold gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Create Quiz
        </Button>
      </div>

      {isLoading ? (
        <div className="p-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading quizzes…
        </div>
      ) : quizzes.length === 0 ? (
        <div className="p-16 text-center space-y-3">
          <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-semibold text-foreground">No quizzes yet</p>
          <p className="text-xs text-muted-foreground">Create your first quiz to get started.</p>
          <Button onClick={() => setActiveTab('instructor-quiz-create')} className="mt-2 h-8 bg-primary text-white text-xs font-bold gap-1">
            <Plus className="w-3.5 h-3.5" /> Create Quiz
          </Button>
        </div>
      ) : (
        <Card className="border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                  {['Quiz Title', 'Course', 'Module', 'Questions', 'Time Limit', 'Pass %', 'Attempts', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {quizzes.map((qz: any) => (
                  <tr key={qz.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground truncate">{qz.title}</p>
                          {qz.is_final_assessment && (
                            <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">FINAL</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{qz.course?.title ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-[10px]">
                      {qz.module ? `Ch ${qz.module.order_index}: ${qz.module.title}` : 'Course-level'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FileQuestion className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono font-bold text-foreground">{qz._count?.questions ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {qz.time_limit_mins ? (
                        <span className="flex items-center justify-center gap-1 font-mono text-muted-foreground">
                          <Clock className="w-3 h-3" />{qz.time_limit_mins}m
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-foreground">{qz.passing_score ?? 60}%</td>
                    <td className="px-4 py-3 text-center font-mono text-foreground">{qz.max_attempts ?? 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="sm" variant="outline"
                          onClick={() => { setActiveQuizId(qz.id); setActiveTab('instructor-quiz-edit'); }}
                          className="h-7 text-[10px] gap-1 font-bold">
                          <Edit2 className="w-3 h-3" /> Edit
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => { if (confirm(`Delete "${qz.title}"?`)) deleteMutation.mutate(qz.id); }}
                          disabled={deletingId === qz.id}
                          className="h-7 text-[10px] gap-1 font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500/10">
                          {deletingId === qz.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
