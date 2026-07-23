import { useEffect, useState } from 'react';
import { QrCode, Landmark, Copy, Check } from 'lucide-react';
import { getMediaUrl } from '../services/api';

interface PaymentMethod {
  id: string;
  type: 'upi' | 'bank';
  label: string;
  upi_id?: string;
  qr_url?: string;
  bank_name?: string;
  account_holder?: string;
  account_no?: string;
  ifsc?: string;
  branch?: string;
}

function parseMethods(map: Record<string, string> | undefined): PaymentMethod[] {
  if (!map) return [];
  if (map.payment_methods) {
    try {
      const parsed = JSON.parse(map.payment_methods);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through to legacy single-UPI settings */ }
  }
  if (map.upi_id) {
    return [{ id: 'legacy-upi', type: 'upi', label: 'UPI Payment', upi_id: map.upi_id, qr_url: map.upi_qr_url }];
  }
  return [];
}

// Renders every payment method the admin has added under Platform Settings — if there are
// several (e.g. two UPI IDs, or a UPI + a bank account), the payer picks which one to use via
// the tab strip; a single configured method renders directly with no picker needed. Falls back
// to the legacy single upi_id/upi_qr_url settings keys for installs that predate the
// multi-method payment_methods list.
export default function PaymentMethodPicker({ settingsMap }: { settingsMap: Record<string, string> | undefined }) {
  const methods = parseMethods(settingsMap);
  const [selectedId, setSelectedId] = useState<string | undefined>(methods[0]?.id);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (methods.length && !methods.some(m => m.id === selectedId)) setSelectedId(methods[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsMap]);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    });
  }

  if (methods.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800">
        <p className="text-xs text-muted-foreground">No payment method configured. Please contact support.</p>
      </div>
    );
  }

  const selected = methods.find(m => m.id === selectedId) ?? methods[0];

  return (
    <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 space-y-3">
      <div className="flex items-center gap-2">
        {selected.type === 'bank' ? <Landmark className="w-4 h-4 text-violet-600" /> : <QrCode className="w-4 h-4 text-violet-600" />}
        <p className="text-xs font-bold text-violet-700 dark:text-violet-400">
          Pay via {selected.label || (selected.type === 'bank' ? 'Bank Transfer' : 'UPI')}
        </p>
      </div>

      {methods.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {methods.map(m => (
            <button
              key={m.id} type="button" onClick={() => setSelectedId(m.id)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                selected.id === m.id
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white dark:bg-black/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700 hover:border-violet-400'
              }`}
            >
              {m.label || (m.type === 'upi' ? 'UPI' : 'Bank Transfer')}
            </button>
          ))}
        </div>
      )}

      {selected.type === 'upi' ? (
        <>
          {selected.upi_id ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-white dark:bg-black/20 px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-700 text-violet-900 dark:text-violet-300 truncate">
                {selected.upi_id}
              </code>
              <button
                type="button"
                onClick={() => copy(selected.upi_id!, selected.id)}
                className="shrink-0 p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                title="Copy UPI ID"
              >
                {copiedKey === selected.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">UPI ID not configured.</p>
          )}
          {selected.qr_url && (
            <div className="flex flex-col items-center justify-center pt-1 pb-1">
              <div className="p-2 bg-white rounded-2xl border-2 border-violet-300 dark:border-violet-600 shadow-md transition-transform hover:scale-[1.02]">
                <img
                  src={getMediaUrl(selected.qr_url)}
                  alt="UPI QR Code"
                  className="h-64 w-64 sm:h-72 sm:w-72 object-contain rounded-xl bg-white p-1"
                />
              </div>
              <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 mt-2">
                Scan with any UPI app to pay
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-1.5">
          {([
            ['Bank Name', selected.bank_name],
            ['Account Holder', selected.account_holder],
            ['Account Number', selected.account_no],
            ['IFSC Code', selected.ifsc],
            ['Branch', selected.branch],
          ] as const).filter(([, v]) => v).map(([label, value]) => {
            const key = `${selected.id}-${label}`;
            return (
              <div key={label} className="flex items-center justify-between gap-2 bg-white dark:bg-black/20 px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-700">
                <span className="text-[9px] font-bold text-muted-foreground uppercase shrink-0">{label}</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-xs text-violet-900 dark:text-violet-300 truncate">{value}</span>
                  {label === 'Account Number' && (
                    <button
                      type="button" onClick={() => copy(value as string, key)}
                      className="shrink-0 p-1 rounded bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                      title="Copy Account Number"
                    >
                      {copiedKey === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
