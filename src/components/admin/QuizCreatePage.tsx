import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, CheckCircle, Type, AlignLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getStoredToken } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

// ── Types ─────────────────────────────────────────────────────────────────────
export type QuestionType = 'mcq' | 'user_input' | 'open_ended';

export interface McqDraft {
  id: string;
  type: 'mcq';
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  marks: string;
}

export interface TextDraft {
  id: string;
  type: 'user_input' | 'open_ended';
  question_text: string;
  correct_answer: string;
  marks: string;
}

export type QuestionDraft = McqDraft | TextDraft;

export function newMcq(): McqDraft {
  return { id: crypto.randomUUID(), type: 'mcq', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: '1' };
}
export function newTextQ(type: 'user_input' | 'open_ended'): TextDraft {
  return { id: crypto.randomUUID(), type, question_text: '', correct_answer: '', marks: '1' };
}

// ── Question type selector icons ──────────────────────────────────────────────
export const Q_TYPES: { value: QuestionType; label: string; icon: any; desc: string }[] = [
  { value: 'mcq', label: 'Multiple Choice', icon: CheckCircle, desc: '4 options, single correct answer' },
  { value: 'user_input', label: 'Short Answer', icon: Type, desc: 'Student types a short answer' },
  { value: 'open_ended', label: 'Open Ended', icon: AlignLeft, desc: 'Essay-style, graded manually' },
];

// ── MCQ editor ────────────────────────────────────────────────────────────────
export function McqEditor({ q, onChange }: { q: McqDraft; onChange: (q: McqDraft) => void }) {
  const set = (k: keyof McqDraft, v: any) => onChange({ ...q, [k]: v });
  const OPTIONS: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Options — click the circle to mark as correct answer</p>
      <div className="space-y-2">
        {OPTIONS.map(opt => {
          const key = `option_${opt.toLowerCase()}` as keyof McqDraft;
          const isCorrect = q.correct_option === opt;
          return (
            <div key={opt} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-500/8' : 'border-border bg-muted/10 hover:border-border/80'}`}>
              <button type="button" title={`Mark Option ${opt} as correct answer`}
                onClick={() => set('correct_option', opt)}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-black text-[10px] ${isCorrect ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-500'}`}>
                {isCorrect ? '✓' : opt}
              </button>
              <span className={`text-[10px] font-bold ${isCorrect ? 'text-emerald-600' : 'text-muted-foreground'} shrink-0 w-3`}>{opt}</span>
              <Input placeholder={`Option ${opt}`} value={q[key] as string}
                onChange={e => set(key, e.target.value)}
                className="h-7 text-xs bg-transparent border-0 p-0 focus-visible:ring-0 shadow-none flex-1" />
              {isCorrect && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wide shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded">Correct</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Text answer editor ────────────────────────────────────────────────────────
export function TextEditor({ q, onChange }: { q: TextDraft; onChange: (q: TextDraft) => void }) {
  return (
    <div className="space-y-2">
      {q.type === 'user_input' ? (
        <div className="space-y-1.5">
          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Expected Answer</Label>
          <Input placeholder="Correct short answer (used for auto-grading)" value={q.correct_answer}
            onChange={e => onChange({ ...q, correct_answer: e.target.value })}
            className="h-8 text-xs bg-muted/20" />
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-dashed border-border/50 bg-muted/10">
          <p className="text-[11px] text-muted-foreground">Open-ended question — manually graded by instructor. No auto-grading.</p>
        </div>
      )}
    </div>
  );
}

// ── QuestionCard ──────────────────────────────────────────────────────────────
export function QuestionCard({ q, index, onChange, onDelete }: {
  q: QuestionDraft;
  index: number;
  onChange: (q: QuestionDraft) => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border/50">
        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">Q{index + 1}</span>
        <div className="flex gap-1">
          {Q_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.value} type="button" title={t.label}
                onClick={() => {
                  if (t.value === 'mcq') onChange(newMcq());
                  else onChange({ ...newTextQ(t.value as 'user_input' | 'open_ended'), question_text: q.question_text, marks: q.marks, id: q.id });
                }}
                className={`px-2 h-6 rounded-md text-[9px] font-bold flex items-center gap-1 transition-colors ${q.type === t.value ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:text-foreground'}`}>
                <Icon className="w-2.5 h-2.5" />{t.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input placeholder="Marks" type="number" min={1} value={q.marks}
            onChange={e => onChange({ ...q, marks: e.target.value } as QuestionDraft)}
            className="h-6 w-16 text-[10px] bg-background text-right px-2" />
          <span className="text-[9px] text-muted-foreground">pts</span>
          <button type="button" title="Delete question" onClick={onDelete}
            className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <textarea placeholder="Question text…" rows={2} value={q.question_text}
          aria-label="Question text" title="Question text"
          onChange={e => onChange({ ...q, question_text: e.target.value } as QuestionDraft)}
          className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
        {q.type === 'mcq'
          ? <McqEditor q={q as McqDraft} onChange={onChange as (q: McqDraft) => void} />
          : <TextEditor q={q as TextDraft} onChange={onChange as (q: TextDraft) => void} />}
      </div>
    </div>
  );
}

// ── Main QuizCreatePage ───────────────────────────────────────────────────────
export default function QuizCreatePage({ onBack }: { onBack: () => void }) {
  const setActiveTab = useAppStore(s => s.setActiveTab);

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ['courses-list'],
    queryFn: () => api.courses.list(),
    enabled: !!getStoredToken(),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz fields
  const [courseId, setCourseId] = useState('');
  const [moduleId, setModuleId] = useState('');

  // Load modules when course is selected
  const { data: courseModules = [] } = useQuery<any[]>({
    queryKey: ['course-modules', courseId],
    queryFn: () => api.courses.modules.list(courseId),
    enabled: !!courseId && !!getStoredToken(),
  });

  useEffect(() => { setModuleId(''); }, [courseId]);
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

  // Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([newMcq()]);

  const totalMarks = questions.reduce((s, q) => s + (parseInt(q.marks) || 0), 0);

  const updateQuestion = (i: number, q: QuestionDraft) => setQuestions(prev => { const n = [...prev]; n[i] = q; return n; });
  const deleteQuestion = (i: number) => setQuestions(prev => prev.filter((_, j) => j !== i));
  const addQuestion = (type: QuestionType) => {
    if (type === 'mcq') setQuestions(prev => [...prev, newMcq()]);
    else setQuestions(prev => [...prev, newTextQ(type as 'user_input' | 'open_ended')]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) { setError('Please select a course.'); return; }
    if (!title.trim()) { setError('Quiz title is required.'); return; }
    if (questions.some(q => !q.question_text.trim())) { setError('All questions must have question text.'); return; }

    setSaving(true);
    setError(null);

    try {
      const examDatetime = examDate ? `${examDate}T${examTime || '00:00'}:00` : undefined;
      const deadlineDatetime = examEndDate ? `${examEndDate}T${examEndTime || '23:59'}:00` : undefined;

      // 1. Create quiz
      const quiz = await api.quizzes.create({
        course_id: courseId,
        module_id: moduleId || undefined,
        title: title.trim(),
        description: description || undefined,
        passing_score: parseInt(passingScore) || 0,
        total_marks: totalMarks,
        max_attempts: parseInt(maxAttempts) || 1,
        time_limit_mins: timeLimitMins ? parseInt(timeLimitMins) : undefined,
        exam_date: examDatetime,
        deadline: deadlineDatetime,
        show_answers: showAnswers,
        is_final_assessment: isFinalAssessment,
      });

      // 2. Create questions
      for (const q of questions) {
        await api.quizzes.questions.create(quiz.id, {
          question_type: q.type,
          question_text: q.question_text,
          marks: parseInt(q.marks) || 1,
          ...(q.type === 'mcq' ? {
            option_a: (q as McqDraft).option_a,
            option_b: (q as McqDraft).option_b,
            option_c: (q as McqDraft).option_c,
            option_d: (q as McqDraft).option_d,
            correct_option: (q as McqDraft).correct_option,
          } : {}),
          ...(q.type === 'user_input' ? { correct_answer: (q as TextDraft).correct_answer } : {}),
        });
      }

      setActiveTab('quiz-management');
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} title="Back"
          className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-foreground">Create Quiz</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} total marks
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {error && <span className="text-xs text-red-500 font-semibold max-w-xs truncate">{error}</span>}
          <Button type="submit" disabled={saving} className="h-9 px-5 bg-primary text-white font-bold text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : 'Save Quiz'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: questions */}
        <div className="lg:col-span-2 space-y-4">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i}
              onChange={qq => updateQuestion(i, qq)}
              onDelete={() => deleteQuestion(i)} />
          ))}

          {/* Add question buttons */}
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

        {/* Right: quiz settings */}
        <div className="space-y-5">
          {/* Course + basic */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Course *</Label>
                <select value={courseId} onChange={e => setCourseId(e.target.value)} title="Course" required
                  className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                  <option value="">Select course…</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {courseId && (
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Chapter (optional)</Label>
                  <select value={moduleId} onChange={e => setModuleId(e.target.value)} title="Chapter"
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none">
                    <option value="">Course-level quiz (no chapter)</option>
                    {courseModules.map((m: any) => (
                      <option key={m.id} value={m.id}>Ch {m.order_index}: {m.title}</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-muted-foreground">Assign to a chapter or leave blank for course-level</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Quiz Title *</Label>
                <Input placeholder="e.g. Module 1 Final Assessment" value={title} onChange={e => setTitle(e.target.value)}
                  className="h-9 text-xs bg-muted/20" required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Description</Label>
                <textarea placeholder="Quiz instructions for students…" rows={2}
                  aria-label="Quiz description" title="Quiz description"
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Passing %</Label>
                  <Input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(e.target.value)}
                    className="h-8 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Max Attempts</Label>
                  <Input type="number" min={1} value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)}
                    className="h-8 text-xs bg-muted/20" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-muted-foreground uppercase">Time Limit (mins)</Label>
                <Input type="number" min={1} placeholder="Leave empty for no limit" value={timeLimitMins}
                  onChange={e => setTimeLimitMins(e.target.value)} className="h-8 text-xs bg-muted/20" />
              </div>
            </CardContent>
          </Card>

          {/* Exam scheduling */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Exam Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">Exam Start</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Date</Label>
                  <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
                    className="h-8 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Time</Label>
                  <Input type="time" value={examTime} onChange={e => setExamTime(e.target.value)}
                    className="h-8 text-xs bg-muted/20" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide pt-1">Exam End (Deadline)</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Date</Label>
                  <Input type="date" value={examEndDate} onChange={e => setExamEndDate(e.target.value)}
                    className="h-8 text-xs bg-muted/20" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Time</Label>
                  <Input type="time" value={examEndTime} onChange={e => setExamEndTime(e.target.value)}
                    className="h-8 text-xs bg-muted/20" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground">After end date/time, the quiz disappears from the student dashboard.</p>
            </CardContent>
          </Card>

          {/* Options */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold">Options</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showAnswers} onChange={e => setShowAnswers(e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                <div>
                  <p className="text-xs font-semibold">Show answers after submission</p>
                  <p className="text-[10px] text-muted-foreground">Students see correct answers after completing</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFinalAssessment} onChange={e => setIsFinalAssessment(e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                <div>
                  <p className="text-xs font-semibold">Final assessment</p>
                  <p className="text-[10px] text-muted-foreground">Marks course as complete on passing</p>
                </div>
              </label>

              <div className="border-t border-border/40 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">Total marks</span>
                  <span className="font-black text-foreground text-base">{totalMarks}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground font-semibold">Pass mark</span>
                  <span className="font-bold text-emerald-500">{Math.ceil(totalMarks * parseInt(passingScore || '0') / 100)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
