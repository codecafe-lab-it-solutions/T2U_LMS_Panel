import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Loader2, Save, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '../services/api';
import { QuestionCard, QuestionDraft, McqDraft, TextDraft, newMcq, newTextQ, Q_TYPES, QuestionType } from './admin/QuizCreatePage';

export default function QuizEditPage({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Quiz settings
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState('60');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [timeLimitMins, setTimeLimitMins] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [examEndDate, setExamEndDate] = useState('');
  const [examEndTime, setExamEndTime] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);
  const [isFinalAssessment, setIsFinalAssessment] = useState(false);

  // Questions: existing (with id from DB) vs new drafts
  const [questions, setQuestions] = useState<(QuestionDraft & { _dbId?: string; _deleted?: boolean; _dirty?: boolean })[]>([]);

  const { data: quiz, isLoading } = useQuery<any>({
    queryKey: ['quiz-detail-edit', quizId],
    queryFn: () => api.quizzes.get(quizId),
  });

  // Prefill when quiz loads
  useEffect(() => {
    if (!quiz) return;
    setTitle(quiz.title ?? '');
    setDescription(quiz.description ?? '');
    setPassingScore(String(quiz.passing_score ?? 60));
    setMaxAttempts(String(quiz.max_attempts ?? 1));
    setTimeLimitMins(quiz.time_limit_mins ? String(quiz.time_limit_mins) : '');
    setShowAnswers(quiz.show_answers ?? false);
    setIsFinalAssessment(quiz.is_final_assessment ?? false);
    if (quiz.exam_date) {
      const d = new Date(quiz.exam_date);
      setExamDate(d.toISOString().split('T')[0]);
      setExamTime(d.toTimeString().slice(0, 5));
    }
    if (quiz.deadline) {
      const d = new Date(quiz.deadline);
      setExamEndDate(d.toISOString().split('T')[0]);
      setExamEndTime(d.toTimeString().slice(0, 5));
    }

    // Map DB questions to draft format
    const mapped = (quiz.questions ?? []).map((q: any) => {
      if (q.question_type === 'mcq') {
        return {
          id: crypto.randomUUID(),
          _dbId: q.id,
          type: 'mcq' as const,
          question_text: q.question_text ?? '',
          option_a: q.option_a ?? '',
          option_b: q.option_b ?? '',
          option_c: q.option_c ?? '',
          option_d: q.option_d ?? '',
          correct_option: q.correct_option ?? 'A',
          marks: String(q.marks ?? 1),
        } as McqDraft & { _dbId: string };
      } else {
        return {
          id: crypto.randomUUID(),
          _dbId: q.id,
          type: q.question_type as 'user_input' | 'open_ended',
          question_text: q.question_text ?? '',
          correct_answer: q.correct_answer ?? '',
          marks: String(q.marks ?? 1),
        } as TextDraft & { _dbId: string };
      }
    });
    setQuestions(mapped);
  }, [quiz]);

  const totalMarks = questions.filter((q: any) => !q._deleted).reduce((s, q) => s + (parseInt(q.marks) || 0), 0);

  const updateQuestion = (i: number, q: QuestionDraft) =>
    setQuestions(prev => { const n = [...prev]; n[i] = { ...q, _dbId: (n[i] as any)._dbId, _dirty: true }; return n; });

  const deleteQuestion = (i: number) => {
    setQuestions(prev => {
      const q = prev[i] as any;
      if (q._dbId) {
        // Mark for deletion
        const n = [...prev];
        n[i] = { ...n[i], _deleted: true } as any;
        return n;
      }
      return prev.filter((_, j) => j !== i);
    });
  };

  const addQuestion = (type: QuestionType) => {
    if (type === 'mcq') setQuestions(prev => [...prev, { ...newMcq(), _dirty: true } as any]);
    else setQuestions(prev => [...prev, { ...newTextQ(type as 'user_input' | 'open_ended'), _dirty: true } as any]);
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError(null); setSuccess(false);
    try {
      // 1. Update quiz metadata
      const examDatetime = examDate ? `${examDate}T${examTime || '00:00'}:00` : null;
      const deadlineDatetime = examEndDate ? `${examEndDate}T${examEndTime || '23:59'}:00` : null;
      await api.quizzes.update(quizId, {
        title: title.trim(),
        description: description || undefined,
        passing_score: parseInt(passingScore) || 60,
        total_marks: totalMarks,
        max_attempts: parseInt(maxAttempts) || 1,
        time_limit_mins: timeLimitMins ? parseInt(timeLimitMins) : null,
        exam_date: examDatetime,
        deadline: deadlineDatetime,
        show_answers: showAnswers,
        is_final_assessment: isFinalAssessment,
      });

      // 2. Process questions
      for (const q of questions) {
        const dbQ = q as any;
        if (dbQ._deleted && dbQ._dbId) {
          await api.quizzes.questions.delete(quizId, dbQ._dbId);
        } else if (dbQ._dbId && dbQ._dirty) {
          const patch: any = {
            question_type: q.type,
            question_text: q.question_text,
            marks: parseInt(q.marks) || 1,
          };
          if (q.type === 'mcq') {
            const mq = q as McqDraft;
            Object.assign(patch, { option_a: mq.option_a, option_b: mq.option_b, option_c: mq.option_c, option_d: mq.option_d, correct_option: mq.correct_option });
          } else if (q.type === 'user_input') {
            patch.correct_answer = (q as TextDraft).correct_answer;
          }
          await api.quizzes.questions.update(quizId, dbQ._dbId, patch);
        } else if (!dbQ._dbId && !dbQ._deleted) {
          const payload: any = { question_type: q.type, question_text: q.question_text, marks: parseInt(q.marks) || 1 };
          if (q.type === 'mcq') {
            const mq = q as McqDraft;
            Object.assign(payload, { option_a: mq.option_a, option_b: mq.option_b, option_c: mq.option_c, option_d: mq.option_d, correct_option: mq.correct_option });
          } else if (q.type === 'user_input') {
            payload.correct_answer = (q as TextDraft).correct_answer;
          }
          await api.quizzes.questions.create(quizId, payload);
        }
      }

      qc.invalidateQueries({ queryKey: ['instructor-quizzes'] });
      qc.invalidateQueries({ queryKey: ['quiz-detail-edit', quizId] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return (
    <div className="p-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading quiz…
    </div>
  );

  const visibleQuestions = questions.filter((q: any) => !q._deleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-5">
        <Button variant="outline" size="sm" onClick={onBack} className="h-8 text-xs gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-foreground">Edit Quiz</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{visibleQuestions.length} question{visibleQuestions.length !== 1 ? 's' : ''} · {totalMarks} total marks</p>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-rose-500 font-semibold max-w-xs truncate">{error}</span>}
          {success && <span className="text-xs text-emerald-500 font-semibold">Saved!</span>}
          <Button onClick={handleSave} disabled={saving} className="h-9 px-5 bg-primary text-white font-bold text-sm gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Changes</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: questions */}
        <div className="lg:col-span-2 space-y-4">
          {visibleQuestions.map((q, visIdx) => {
            const realIdx = questions.indexOf(q);
            return (
              <QuestionCard key={q.id} q={q} index={visIdx}
                onChange={qq => updateQuestion(realIdx, qq)}
                onDelete={() => deleteQuestion(realIdx)} />
            );
          })}
          <div className="flex gap-2 flex-wrap">
            {Q_TYPES.map(t => {
              const Icon = t.icon;
              return (
                <Button key={t.value} type="button" size="sm" onClick={() => addQuestion(t.value)}
                  className="h-8 text-xs bg-muted/40 text-foreground border border-dashed border-border hover:bg-muted font-semibold">
                  <Plus className="w-3 h-3 mr-1" /><Icon className="w-3 h-3 mr-1" />{t.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Right: settings */}
        <div className="space-y-5">
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Quiz Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9 text-xs bg-muted/20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description</Label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                  aria-label="Description" className="w-full p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Passing %</Label>
                  <Input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(e.target.value)} className="h-8 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Max Attempts</Label>
                  <Input type="number" min={1} value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} className="h-8 text-xs bg-muted/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Time Limit (mins)</Label>
                <Input type="number" min={1} placeholder="No limit" value={timeLimitMins} onChange={e => setTimeLimitMins(e.target.value)} className="h-8 text-xs bg-muted/20" />
              </div>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showAnswers} onChange={e => setShowAnswers(e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span className="text-xs font-semibold">Show answers after submission</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isFinalAssessment} onChange={e => setIsFinalAssessment(e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span className="text-xs font-semibold">Final assessment</span>
                </label>
              </div>
              <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Total marks</span>
                <span className="font-black text-foreground text-base">{totalMarks}</span>
              </div>
            </CardContent>
          </Card>

          {/* Exam Schedule */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Exam Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">Exam Start</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Date</Label>
                  <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="h-8 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Time</Label>
                  <Input type="time" value={examTime} onChange={e => setExamTime(e.target.value)} className="h-8 text-xs bg-muted/20" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide pt-1">Exam End (Deadline)</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Date</Label>
                  <Input type="date" value={examEndDate} onChange={e => setExamEndDate(e.target.value)} className="h-8 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Time</Label>
                  <Input type="time" value={examEndTime} onChange={e => setExamEndTime(e.target.value)} className="h-8 text-xs bg-muted/20" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground">After the end date/time, students cannot start or submit this quiz.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
