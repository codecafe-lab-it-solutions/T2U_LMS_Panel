import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, CheckCircle2, AlertCircle, Library, BadgePercent } from 'lucide-react';
import { api, getMediaUrl, getErrorMessage, type ApiCourseBundle } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PaymentMethodPicker from './PaymentMethodPicker';

// Confirm-and-pay dialog for a course bundle. Mirrors the single-course payment flow in
// StudentCourses: the student submits proof, an admin approves, and only then does access to
// every included course materialise. A free bundle (no price) skips the payment fields.
export default function BundleEnrollDialog({ bundle, onClose }: { bundle: ApiCourseBundle | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [txnId, setTxnId] = useState('');
  const [referral, setReferral] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [shotUrl, setShotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: settings } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['public-settings'],
    queryFn: () => api.platformSettings.getPublic(),
    enabled: !!bundle,
    staleTime: 300_000,
  });

  // What THIS student pays right now (distributor price / referral discount), computed by the
  // server so the dialog and the invoice can never disagree.
  const refTrim = referral.trim();
  const { data: pricing, isFetching: pricingLoading } = useQuery({
    queryKey: ['bundle-pricing', bundle?.id, refTrim],
    queryFn: () => api.courseBundles.pricing(bundle!.id, refTrim || undefined),
    enabled: !!bundle,
    staleTime: 30_000,
  });
  const price = pricing?.final_price ?? (bundle?.price != null ? Number(bundle.price) : 0);

  const mut = useMutation({
    mutationFn: () => api.courseBundles.enroll(bundle!.id, {
      transaction_id: txnId.trim() || undefined,
      screenshot_url: shotUrl || undefined,
      referral_code: referral.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bundle-enrollments'] });
      qc.invalidateQueries({ queryKey: ['course-bundles'] });
      qc.invalidateQueries({ queryKey: ['course-bundle'] });
      reset();
      onClose();
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  function reset() {
    setTxnId(''); setReferral(''); setFile(null); setShotUrl(''); setError(''); setUploading(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setUploading(true); setError('');
    try {
      setShotUrl((await api.upload.file(f)).url);
    } catch (err) {
      setError('Screenshot upload failed: ' + getErrorMessage(err));
      setFile(null);
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (price > 0 && !txnId.trim() && !shotUrl) { setError('Enter your transaction ID or upload a payment screenshot.'); return; }
    setError('');
    mut.mutate();
  }

  return (
    <Dialog open={!!bundle} onOpenChange={o => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-xl border border-border bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Enroll in bundle</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {price > 0
              ? 'Pay the bundle fee, then submit your transaction ID. Access to every course unlocks once an admin verifies the payment.'
              : 'Submit your request — access to every course unlocks once an admin approves it.'}
          </DialogDescription>
        </DialogHeader>

        {bundle && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/60">
              {bundle.thumbnail_url ? (
                <img src={getMediaUrl(bundle.thumbnail_url)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Library className="w-5 h-5" /></div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground line-clamp-1">{bundle.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{bundle.course_count} courses included</p>
              </div>
              <div className="text-right shrink-0">
                {pricing && pricing.final_price < pricing.mrp && (
                  <p className="text-[10px] text-muted-foreground line-through font-mono">₹{pricing.mrp.toLocaleString('en-IN')}</p>
                )}
                <p className="text-lg font-black text-primary font-mono">{price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Free'}</p>
                {pricing?.distributor_price_applied && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                    <BadgePercent className="w-2.5 h-2.5" />Distributor price applied
                  </p>
                )}
              </div>
            </div>

            <ul className="text-xs text-foreground/80 space-y-1 max-h-28 overflow-y-auto">
              {bundle.courses.map(c => (
                <li key={c.id} className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3 h-3 shrink-0 ${bundle.owned_course_ids?.includes(c.id) ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <span className="truncate">{c.title}</span>
                  {bundle.owned_course_ids?.includes(c.id) && <span className="text-[10px] text-emerald-600 shrink-0">already yours</span>}
                </li>
              ))}
            </ul>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Referral ID (optional)</Label>
              <Input value={referral} onChange={e => setReferral(e.target.value.toUpperCase())} placeholder="Enter a referral ID" className="h-9 text-xs bg-muted/20 font-mono uppercase" />
              {refTrim && !pricingLoading && pricing && (
                pricing.referral_valid ? (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Referral ID applied{pricing.discount_amount > 0 ? ` — ₹${pricing.discount_amount.toLocaleString('en-IN')} discount` : ''}
                  </p>
                ) : (
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold">Invalid referral ID</p>
                )
              )}
            </div>

            {price > 0 && (
              <>
                <PaymentMethodPicker settingsMap={settings?.map} />
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Transaction ID <span className="text-red-500">*</span></Label>
                  <Input value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="Enter UPI transaction / reference ID" className="h-9 text-xs bg-muted/20 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Payment Screenshot (optional)</Label>
                  <input ref={fileRef} type="file" accept="image/*" title="Upload payment screenshot" className="hidden" onChange={onFile} />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className={`w-full flex items-center justify-center gap-2 h-16 rounded-xl border-2 border-dashed text-xs font-semibold transition-colors ${file ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/20'}`}
                  >
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : file ? <><CheckCircle2 className="w-4 h-4" />{file.name}</> : <><Upload className="w-4 h-4" />Click to upload screenshot</>}
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2 mt-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }} className="text-xs font-semibold border-border flex-1">Cancel</Button>
          <Button onClick={submit} disabled={mut.isPending || uploading} className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex-1">
            {mut.isPending ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Submitting…</> : price > 0 ? 'Submit Payment Proof' : 'Request Access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
