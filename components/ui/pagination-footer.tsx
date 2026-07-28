import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationFooterProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}

// Shared traditional page-1/page-2 navigation footer — same pattern as BVLedger.tsx's inline
// version, extracted so every paginated list page renders it identically.
export function PaginationFooter({ page, totalPages, total, onPageChange, label = 'total entries' }: PaginationFooterProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10">
      <span className="text-[10px] text-muted-foreground">
        Page {page} of {totalPages} · {total} {label}
      </span>
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
