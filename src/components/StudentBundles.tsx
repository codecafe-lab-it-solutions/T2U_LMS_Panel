import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Library, Loader2, Clock, XCircle, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api, getMediaUrl, getErrorMessage, type ApiCourseBundle } from '../services/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import BundleEnrollDialog from './BundleEnrollDialog';
import StudentBundleDetail from './StudentBundleDetail';
import { PENDING_BUNDLE_KEY } from '../lib/publicRoutes';

type Tab = 'mine' | 'browse';
const inr = (n: number | string | null | undefined) => (n != null && Number(n) > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Free');

export default function StudentBundles() {
  const { authToken } = useAppStore();
  const [tab, setTab] = useState<Tab>('mine');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [enrollTarget, setEnrollTarget] = useState<ApiCourseBundle | null>(null);

  const mine = useQuery({
    queryKey: ['my-bundle-enrollments', authToken],
    queryFn: () => api.courseBundles.mine(),
    enabled: !!authToken,
  });
  const catalogue = useQuery({
    queryKey: ['course-bundles'],
    queryFn: () => api.courseBundles.list(),
    staleTime: 60_000,
  });
  // Progress comes from the regular enrolled-courses query — bundle access is just ordinary
  // course enrollments, so the numbers here always match the Courses page.
  const enrolled = useQuery({
    queryKey: ['enrolled-courses', authToken],
    queryFn: () => api.courses.enrolled(),
    enabled: !!authToken,
    staleTime: 60_000,
  });
  const progressByCourse = new Map((enrolled.data ?? []).map(e => [e.course_id, e.completion_percentage ?? 0]));

  const myBundles = mine.data ?? [];
  const takenIds = new Set(myBundles.filter(m => m.payment_status !== 'rejected').map(m => m.bundle_id));
  const browse = (catalogue.data ?? []).filter(b => !takenIds.has(b.id));

  // A logged-out visitor who clicked Enroll on a public bundle page lands here after sign-in:
  // open that bundle's page so they can complete the purchase.
  useEffect(() => {
    let slug: string | null = null;
    try { slug = sessionStorage.getItem(PENDING_BUNDLE_KEY); } catch { /* ignore */ }
    if (!slug) return;
    try { sessionStorage.removeItem(PENDING_BUNDLE_KEY); } catch { /* ignore */ }
    api.courseBundles.get(slug).then(b => setDetailId(b.id)).catch(() => { /* bundle gone */ });
  }, []);

  if (detailId) {
    return (
      <>
        <StudentBundleDetail bundleId={detailId} onBack={() => setDetailId(null)} onEnroll={setEnrollTarget} />
        <BundleEnrollDialog bundle={enrollTarget} onClose={() => setEnrollTarget(null)} />
      </>
    );
  }

  const statusBadge = (s: string) => s === 'approved'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3" />Enrolled</span>
    : s === 'rejected'
      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3" />Payment Rejected</span>
      : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3" />Awaiting Approval</span>;

  const loading = tab === 'mine' ? mine.isLoading : catalogue.isLoading;
  const err = tab === 'mine' ? mine.error : catalogue.error;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pl-1">
        <Library className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">Course Bundles</h2>
          <p className="text-xs text-muted-foreground mt-0.5">One enrollment, every course in the package.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border">
        {(['mine', 'browse'] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all ${tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'mine' ? `My Bundles${myBundles.length ? ` (${myBundles.length})` : ''}` : 'Browse Bundles'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : err ? (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-xs text-red-700 dark:text-red-400"><AlertCircle className="w-4 h-4" />{getErrorMessage(err)}</div>
      ) : tab === 'mine' ? (
        myBundles.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground">You haven’t enrolled in any bundle yet.</p>
            <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => setTab('browse')}>Browse bundles</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myBundles.map(m => {
              const done = m.courses.filter(c => (progressByCourse.get(c.id) ?? 0) === 100).length;
              const avg = m.courses.length ? Math.round(m.courses.reduce((s, c) => s + (progressByCourse.get(c.id) ?? 0), 0) / m.courses.length) : 0;
              return (
                <button key={m.id} type="button" onClick={() => setDetailId(m.bundle_id)}
                  className="text-left rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors p-4 flex items-start gap-3">
                  {m.bundle.thumbnail_url
                    ? <img src={getMediaUrl(m.bundle.thumbnail_url)} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    : <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Library className="w-6 h-6" /></div>}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-foreground">{m.bundle.name}</h3>
                      {statusBadge(m.payment_status)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{m.courses.length} courses{m.payment_status === 'approved' ? ` · ${done} completed` : ''}</p>
                    {m.payment_status === 'approved' && (
                      <div className="flex items-center gap-2"><Progress value={avg} className="h-1.5 flex-1" /><span className="text-[10px] font-mono text-muted-foreground">{avg}%</span></div>
                    )}
                    {m.payment_status === 'rejected' && <p className="text-[11px] text-red-600">{m.payment_note || 'Your payment could not be verified.'}</p>}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary pt-1">View bundle <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : browse.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground rounded-xl border border-dashed border-border">No other bundles available right now.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {browse.map(b => (
            <div key={b.id} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
              <button type="button" onClick={() => setDetailId(b.id)} className="h-28 bg-muted/40 block w-full">
                {b.thumbnail_url ? <img src={getMediaUrl(b.thumbnail_url)} alt={b.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Library className="w-7 h-7" /></div>}
              </button>
              <div className="p-4 flex-1 flex flex-col gap-2">
                <h3 className="font-bold text-sm text-foreground">{b.name}</h3>
                {b.short_desc && <p className="text-[11px] text-muted-foreground line-clamp-2">{b.short_desc}</p>}
                <ul className="text-[11px] text-foreground/80 space-y-0.5">
                  {b.courses.slice(0, 4).map(c => <li key={c.id} className="truncate">• {c.title}</li>)}
                  {b.courses.length > 4 && <li className="text-muted-foreground">+ {b.courses.length - 4} more</li>}
                </ul>
                <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-black text-primary font-mono">{inr(b.price)}</p>
                    {b.courses_total_value > Number(b.price ?? 0) && Number(b.price ?? 0) > 0 && (
                      <p className="text-[10px] text-muted-foreground line-through font-mono">₹{b.courses_total_value.toLocaleString('en-IN')}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-[11px] h-8" onClick={() => setDetailId(b.id)}>View</Button>
                    <Button size="sm" className="text-[11px] h-8" onClick={() => setEnrollTarget(b)}>Enroll</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BundleEnrollDialog bundle={enrollTarget} onClose={() => { setEnrollTarget(null); setTab('mine'); }} />
    </div>
  );
}
