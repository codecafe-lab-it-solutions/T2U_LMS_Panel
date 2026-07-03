import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function QuizTakingPage({ quizId, onBack }: { quizId: string; onBack: () => void }) {
  const [answers, setAnswers] = useState<Record<string, { selected_option?: string; text_answer?: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { data: quiz, isLoading } = useQuery<any>({
    queryKey: ['quiz-detail', quizId],
    queryFn: () => api.quizzes.get(quizId),
  });

  // Fetch existing result to check attempt count
  const { data: myResult, isLoading: loadingResult } = useQuery<any>({
    queryKey: ['quiz-my-result', quizId],
    queryFn: () => api.quizzes.myResult(quizId),
    enabled: !!quizId,
  });

  // Initialize timer once quiz loads
  useEffect(() => {
    if (quiz?.time_limit_mins) {
      setTimeLeft(quiz.time_limit_mins * 60);
    }
  }, [quiz]);

  // Countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const t = setTimeout(() => setTimeLeft(prev => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted]);

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.quizzes.submit(quizId, data),
    onSuccess: (res: any) => {
      setResult(res);
      setSubmitted(true);
    },
  });

  const handleSubmit = useCallback(() => {
    const answerList = (quiz?.questions ?? []).map((q: any) => ({
      question_id: q.id,
      ...(answers[q.id] ?? {}),
    }));
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    submitMutation.mutate({ answers: answerList, time_taken_secs: timeTaken });
  }, [quiz, answers, startTime, submitMutation]);

  // Auto-submit when timer hits zero
  useEffect(() => {
    if (timeLeft === 0 && !submitted) handleSubmit();
  }, [timeLeft, submitted, handleSubmit]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isLoading || loadingResult) return (
    <div className="flex items-center justify-center p-20 gap-2 text-muted-foreground text-xs">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading quiz…
    </div>
  );

  if (!quiz) return <div className="p-10 text-center text-sm text-muted-foreground">Quiz not found.</div>;

  // ── Max attempts exhausted — show previous result ──────────────────────────
  const attemptsUsed = myResult?.attempt_count ?? 0;
  const maxAttempts = quiz.max_attempts ?? 1;
  const attemptsExhausted = attemptsUsed >= maxAttempts && !submitted;

  if (attemptsExhausted && myResult) {
    const pct = myResult.total_marks > 0 ? Math.round(myResult.score / myResult.total_marks * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="outline" size="sm" onClick={onBack} className="h-8 text-xs gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Quizzes
        </Button>
        <div className="text-center space-y-4 py-8">
          {myResult.passed
            ? <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            : <XCircle className="w-16 h-16 text-rose-500 mx-auto" />}
          <div>
            <h2 className="text-2xl font-black text-foreground">{myResult.passed ? 'Quiz Passed' : 'Quiz Result'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{quiz.title}</p>
          </div>
          <div className="flex justify-center gap-6 text-center">
            <div><div className="text-3xl font-black font-mono text-primary">{myResult.score}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Score</div></div>
            <div><div className="text-3xl font-black font-mono text-muted-foreground">/{myResult.total_marks}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Total</div></div>
            <div><div className={`text-3xl font-black font-mono ${myResult.passed ? 'text-emerald-500' : 'text-rose-500'}`}>{pct}%</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Percentage</div></div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
            All {maxAttempts} attempt{maxAttempts !== 1 ? 's' : ''} used · No more attempts available
          </div>
          <p className="text-[11px] text-muted-foreground">
            Last attempted: {new Date(myResult.attempted_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
          </p>
        </div>
        <Button onClick={onBack} className="w-full" variant="outline">Back to Quizzes</Button>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4 py-8">
          {result.passed
            ? <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            : <XCircle className="w-16 h-16 text-rose-500 mx-auto" />}
          <div>
            <h2 className="text-2xl font-black text-foreground">{result.passed ? 'Quiz Passed!' : 'Quiz Failed'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{quiz.title}</p>
          </div>
          <div className="flex justify-center gap-6 text-center">
            <div><div className="text-3xl font-black font-mono text-primary">{result.score}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Score</div></div>
            <div><div className="text-3xl font-black font-mono text-muted-foreground">/{result.total_marks}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Total</div></div>
            <div><div className={`text-3xl font-black font-mono ${result.passed ? 'text-emerald-500' : 'text-rose-500'}`}>{result.total_marks > 0 ? Math.round(result.score / result.total_marks * 100) : 0}%</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Percentage</div></div>
          </div>
          <p className="text-xs text-muted-foreground">Passing mark: {result.passing_marks}/{result.total_marks}</p>
          {result.max_attempts > 1 && (
            <p className="text-xs text-muted-foreground">
              Attempt {result.attempts_used} of {result.max_attempts}
              {result.attempts_used < result.max_attempts
                ? <span className="text-primary font-semibold"> · {result.max_attempts - result.attempts_used} attempt{result.max_attempts - result.attempts_used !== 1 ? 's' : ''} remaining</span>
                : <span className="text-rose-500 font-semibold"> · No more attempts</span>}
            </p>
          )}
        </div>

        {quiz.show_answers && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Answer Review</h3>
            {(quiz.questions ?? []).map((q: any, i: number) => {
              const ans = answers[q.id];
              const isCorrect = q.question_type === 'mcq'
                ? ans?.selected_option === q.correct_option
                : q.question_type === 'user_input'
                  ? ans?.text_answer?.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase()
                  : null;
              return (
                <Card key={q.id} className={`border ${isCorrect === true ? 'border-emerald-500/30' : isCorrect === false ? 'border-rose-500/30' : 'border-border'}`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      {isCorrect === true && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                      {isCorrect === false && <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                      <p className="text-xs font-semibold text-foreground">Q{i+1}. {q.question_text}</p>
                    </div>
                    {q.question_type === 'mcq' && (
                      <div className="pl-6 text-xs space-y-1">
                        <p>Your answer: <span className={`font-bold ${ans?.selected_option === q.correct_option ? 'text-emerald-500' : 'text-rose-500'}`}>{ans?.selected_option ? `Option ${ans.selected_option}: ${q[`option_${ans.selected_option.toLowerCase()}`]}` : 'Not answered'}</span></p>
                        {ans?.selected_option !== q.correct_option && <p>Correct: <span className="font-bold text-emerald-500">Option {q.correct_option}: {q[`option_${q.correct_option.toLowerCase()}`]}</span></p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Button onClick={onBack} className="w-full" variant="outline">Back to Quizzes</Button>
      </div>
    );
  }

  // ── Quiz taking screen ────────────────────────────────────────────────────
  const questions = quiz.questions ?? [];
  const answered = Object.keys(answers).filter(k => answers[k]?.selected_option || answers[k]?.text_answer).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border pb-3 pt-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 text-xs gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <div>
              <h2 className="text-sm font-black text-foreground">{quiz.title}</h2>
              <p className="text-[10px] text-muted-foreground">
                {questions.length} questions · {answered} answered
                {maxAttempts > 1 && ` · Attempt ${attemptsUsed + 1} of ${maxAttempts}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${timeLeft < 60 ? 'text-rose-500 border-rose-500/30 bg-rose-500/10 animate-pulse' : 'text-foreground border-border bg-muted/40'}`}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="h-9 px-5 bg-primary text-white font-bold text-sm"
            >
              {submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : 'Submit Quiz'}
            </Button>
          </div>
        </div>
        {submitMutation.isError && (
          <p className="text-xs text-rose-500 mt-2">Failed to submit: {(submitMutation.error as any)?.message}</p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-5 pb-10">
        {questions.map((q: any, i: number) => {
          const ans = answers[q.id] ?? {};
          const setAns = (patch: any) => setAnswers(prev => ({ ...prev, [q.id]: { ...prev[q.id], ...patch } }));
          return (
            <Card key={q.id} className="border border-border bg-card shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question_text}</p>
                </div>
                {q.marks > 1 && <p className="text-[10px] text-muted-foreground pl-10">{q.marks} marks</p>}

                {q.question_type === 'mcq' && (
                  <div className="pl-10 space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                      const key = `option_${opt.toLowerCase()}` as const;
                      const text = q[key];
                      if (!text) return null;
                      const selected = ans.selected_option === opt;
                      return (
                        <button key={opt} type="button" onClick={() => setAns({ selected_option: opt })}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left text-xs transition-all ${selected ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border hover:border-primary/40 hover:bg-muted/30 text-foreground'}`}>
                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black shrink-0 ${selected ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground'}`}>{opt}</span>
                          {text}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.question_type === 'user_input' && (
                  <div className="pl-10">
                    <input type="text" placeholder="Type your answer here…" value={ans.text_answer ?? ''}
                      onChange={e => setAns({ text_answer: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:border-primary" />
                  </div>
                )}

                {q.question_type === 'open_ended' && (
                  <div className="pl-10">
                    <textarea placeholder="Write your answer here…" rows={4} value={ans.text_answer ?? ''}
                      onChange={e => setAns({ text_answer: e.target.value })}
                      className="w-full p-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:border-primary resize-none" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom submit */}
      <div className="sticky bottom-0 bg-background border-t border-border pt-3 pb-4">
        <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="w-full h-11 bg-primary text-white font-bold text-sm">
          {submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : `Submit Quiz (${answered}/${questions.length} answered)`}
        </Button>
      </div>
    </div>
  );
}
