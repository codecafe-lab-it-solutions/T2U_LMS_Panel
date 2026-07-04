import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import {
  Sparkles, BarChart3, Database, Calendar,
  Search, RefreshCw, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PAGE_LIMIT = 20;

export default function BVLedger() {
  const { authToken } = useAppStore();

  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bv-ledger', authToken, search, month, year, page],
    queryFn: () =>
      api.mlm.bvLedger({
        page,
        limit: PAGE_LIMIT,
        search: search || undefined,
        month: month || undefined,
        year: year || undefined,
      }),
    enabled: !!authToken,
    staleTime: 30_000,
  });

  const logs = data?.logs ?? [];
  const totalBv = data?.total_bv ?? 0;
  const totalEntries = data?.total ?? 0;
  const totalPages = Math.ceil(totalEntries / PAGE_LIMIT);

  const handleReset = () => {
    setSearch('');
    setMonth('');
    setYear('');
    setPage(1);
    refetch();
  };

  return (
    <div className="space-y-5">
      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 shrink-0">
              <BarChart3 className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total BV Received</p>
              <p className="text-xl font-black text-violet-500 font-mono">{totalBv.toLocaleString()} BV</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 shrink-0">
              <Database className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Entries</p>
              <p className="text-xl font-black text-emerald-500 font-mono">{totalEntries}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Latest Entry</p>
              <p className="text-sm font-bold text-foreground font-mono">
                {logs[0]
                  ? new Date(logs[0].created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Search by User ID / Name</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Referral code or full name..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="w-32">
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Month</label>
              <select
                aria-label="Filter by month"
                value={month}
                onChange={e => { setMonth(e.target.value); setPage(1); }}
                className="w-full h-8 px-2 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="">All Months</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </div>

            <div className="w-24">
              <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Year</label>
              <select
                aria-label="Filter by year"
                value={year}
                onChange={e => { setYear(e.target.value); setPage(1); }}
                className="w-full h-8 px-2 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs shrink-0">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ledger table */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Business Volume Ledger
          </CardTitle>
          <CardDescription className="text-[10px]">
            Read-only daily record of all BV credited to your account. Data refreshes daily — no manual edits permitted.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading BV ledger...
            </div>
          ) : !authToken ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Login to view your BV ledger</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No BV entries found for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold font-sans">
                    <th className="p-3 min-w-[220px]">Activity Description</th>
                    <th className="p-3 min-w-[110px]">Process Date</th>
                    <th className="p-3 min-w-[130px]">Student Name</th>
                    <th className="p-3 min-w-[110px]">User ID</th>
                    <th className="p-3 min-w-[70px]">Leg</th>
                    <th className="p-3 min-w-[110px] text-right">Business Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/15 transition-colors">
                      <td className="p-3 font-medium text-foreground text-[11px] leading-snug">{log.activity_description}</td>
                      <td className="p-3 text-muted-foreground font-mono text-[10px]">
                        {new Date(log.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 font-semibold text-foreground text-[11px]">{log.student_name}</td>
                      <td className="p-3 font-mono text-violet-500 text-[10px]">{log.user_id}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          log.leg === 'left'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {log.leg?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-emerald-500 font-mono">
                        +{Number(log.bv_amount).toLocaleString()} BV
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10">
              <span className="text-[10px] text-muted-foreground">
                Page {page} of {totalPages} · {totalEntries} total entries
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
