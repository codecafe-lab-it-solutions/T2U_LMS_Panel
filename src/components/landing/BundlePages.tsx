import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, Library, Loader2, Clock } from 'lucide-react';
import { api, getMediaUrl, getErrorMessage } from '../../services/api';
import { navigatePublic, bundlePath, coursePath } from '../../lib/publicRoutes';
import { NotFoundState } from './CoursePage';

const inr = (n: number | string | null | undefined) => (n != null && Number(n) > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Free');

// Shared switch so the listing page clearly separates Individual Courses from Bundles.
export function CatalogSwitch({ active }: { active: 'courses' | 'bundles' }) {
  const cls = (on: boolean) => `px-6 py-2 rounded-full font-semibold text-sm transition-all ${on ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'}`;
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <button type="button" className={cls(active === 'courses')} onClick={() => navigatePublic('/courses')}>Individual Courses</button>
      <button type="button" className={cls(active === 'bundles')} onClick={() => navigatePublic('/course-bundles')}>Course Bundles</button>
    </div>
  );
}

export function BundlesPage({ onBackToHome }: { onBackToHome: () => void }) {
  const { data: bundles = [], isLoading, error } = useQuery({
    queryKey: ['course-bundles'],
    queryFn: () => api.courseBundles.list(),
    staleTime: 60_000,
  });

  return (
    <section className="pt-10 pb-20 bg-[#12031e] text-white min-h-screen">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
        <button type="button" onClick={onBackToHome} className="flex items-center gap-2 text-xs text-white/55 hover:text-orange-400 font-semibold transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Home Page
        </button>
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Course Bundles</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">Enroll once and unlock a whole learning path — every course in the bundle, one price.</p>
        </div>
        <CatalogSwitch active="bundles" />

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-white/60"><Loader2 className="w-5 h-5 animate-spin" />Loading bundles…</div>
        ) : error ? (
          <p className="text-center py-20 text-red-300 text-sm">{getErrorMessage(error)}</p>
        ) : bundles.length === 0 ? (
          <div className="text-center py-20">
            <Library className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-white/50 text-lg">No bundles are available right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigatePublic(bundlePath(b.slug))}
                className="text-left rounded-[20px] border border-white/10 bg-[#1e0d2f] overflow-hidden hover:border-white/40 hover:-translate-y-1 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col"
              >
                <div className="h-40 bg-gradient-to-br from-violet-700 to-fuchsia-700 relative">
                  {b.thumbnail_url && <img src={getMediaUrl(b.thumbnail_url)} alt={b.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />}
                  {b.is_featured && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-orange-500 text-[10px] font-bold">Featured</span>}
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h2 className="text-lg font-black leading-tight">{b.name}</h2>
                  {b.short_desc && <p className="text-xs text-white/60 line-clamp-2">{b.short_desc}</p>}
                  <ul className="text-xs text-white/80 space-y-1">
                    {b.courses.slice(0, 3).map(c => <li key={c.id} className="truncate">• {c.title}</li>)}
                    {b.courses.length > 3 && <li className="text-white/50">+ {b.courses.length - 3} more courses</li>}
                  </ul>
                  <div className="mt-auto pt-3 border-t border-white/10 flex items-end justify-between">
                    <div>
                      <p className="text-xl font-black font-mono text-orange-400">{inr(b.price)}</p>
                      {Number(b.price ?? 0) > 0 && b.courses_total_value > Number(b.price) && (
                        <p className="text-[10px] text-white/40 line-through font-mono">₹{b.courses_total_value.toLocaleString('en-IN')}</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-orange-400 flex items-center gap-1">View bundle <ArrowRight className="w-3.5 h-3.5" /></span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function BundlePage({ slug, onBack, onEnroll, onEnquire }: {
  slug: string;
  onBack: () => void;
  onEnroll: () => void;
  onEnquire: () => void;
}) {
  const { data: bundle, isLoading, error } = useQuery({
    queryKey: ['course-bundle', slug],
    queryFn: () => api.courseBundles.get(slug),
    retry: false,
  });

  if (isLoading) return <section className="bg-[#12031e] min-h-[70vh] flex items-center justify-center gap-3 text-white/60"><Loader2 className="w-5 h-5 animate-spin" />Loading bundle…</section>;
  if (error || !bundle || !bundle.is_active) {
    if (error && !/not found/i.test(getErrorMessage(error))) {
      return <section className="bg-[#12031e] min-h-[70vh] flex items-center justify-center text-red-300 text-sm px-4">{getErrorMessage(error)}</section>;
    }
    return <NotFoundState what="Bundle" onBack={onBack} />;
  }

  const price = bundle.price != null ? Number(bundle.price) : 0;
  const saving = bundle.courses_total_value - price;

  return (
    <section className="pt-10 pb-20 bg-[#12031e] text-white min-h-screen">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs text-white/55 hover:text-orange-400 font-semibold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> All bundles
        </button>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6 min-w-0">
            {bundle.thumbnail_url && <img src={getMediaUrl(bundle.thumbnail_url)} alt={bundle.name} className="w-full max-h-[340px] object-cover rounded-3xl border border-white/10" />}
            <div>
              <span className="text-[11px] font-extrabold tracking-widest text-orange-400 uppercase">Course Bundle</span>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight mt-1">{bundle.name}</h1>
              {bundle.short_desc && <p className="text-white/70 mt-2">{bundle.short_desc}</p>}
            </div>
            {bundle.description && <div className="prose prose-invert max-w-none text-white/80 text-sm leading-relaxed whitespace-pre-line">{bundle.description}</div>}

            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-widest mb-3">Included courses ({bundle.course_count})</h2>
              <div className="space-y-3">
                {bundle.courses.map((c, i) => (
                  <button key={c.id} type="button" onClick={() => c.slug && navigatePublic(coursePath(c.slug))}
                    className="w-full text-left flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1e0d2f] hover:border-orange-400/60 p-3 transition-colors">
                    <span className="w-7 h-7 rounded-full bg-orange-500/15 text-orange-400 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    {c.thumbnail_url && <img src={getMediaUrl(c.thumbnail_url)} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0 hidden sm:block" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{c.title}</p>
                      <p className="text-[11px] text-white/50 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{c._count?.modules ?? 0} chapters</span>
                        {c.duration_hrs ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_hrs} hrs</span> : null}
                      </p>
                    </div>
                    {Number(c.price ?? 0) > 0 && <span className="text-xs text-white/40 line-through font-mono shrink-0">₹{Number(c.price).toLocaleString('en-IN')}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside>
            <div className="lg:sticky lg:top-24 rounded-3xl border border-white/10 bg-[#1e0d2f] p-5 space-y-4">
              <div>
                <p className="text-3xl font-black font-mono text-orange-400">{inr(bundle.price)}</p>
                {price > 0 && saving > 0 && <p className="text-xs text-emerald-400 font-semibold mt-1">Save ₹{saving.toLocaleString('en-IN')} vs buying separately</p>}
              </div>
              <p className="text-xs text-white/60">{bundle.course_count} courses · one enrollment · access to everything in the bundle</p>
              {bundle.my_enrollment?.payment_status === 'approved' ? (
                <p className="text-sm font-bold text-emerald-400">You’re enrolled in this bundle.</p>
              ) : bundle.my_enrollment?.payment_status === 'pending' ? (
                <p className="text-sm font-bold text-amber-400">Your request is awaiting approval.</p>
              ) : (
                <button type="button" onClick={onEnroll} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                  Enroll in Bundle <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button type="button" onClick={onEnquire} className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/5 text-sm font-semibold">Request a callback</button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
