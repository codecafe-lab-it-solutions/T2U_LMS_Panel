import { useEffect } from 'react';
import { AlertTriangle, LogOut, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: 'delete' | 'logout' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = false, icon = 'warning', onConfirm, onCancel,
}: ConfirmDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const IconComponent = icon === 'delete' ? Trash2 : icon === 'logout' ? LogOut : AlertTriangle;
  const iconBg = danger ? 'bg-red-500/10' : 'bg-amber-500/10';
  const iconColor = danger ? 'text-red-500' : 'text-amber-500';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`w-11 h-11 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
          <IconComponent className={`w-5 h-5 ${iconColor}`} />
        </div>

        {/* Text */}
        <h3 className="text-sm font-bold text-foreground leading-snug">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 mt-5 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-muted/40 text-foreground border border-border hover:bg-muted transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onCancel(); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg text-white transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
