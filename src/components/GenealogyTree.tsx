import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getMediaUrl } from '../services/api';
import {
  Users, Sparkles, AlertCircle, Trophy, Loader2, RefreshCw,
  Search, ChevronLeft, Home, Lock, UserPlus, Filter, UserCog
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ── Layout constants ──────────────────────────────────────────────────────────
const UNIT      = 150;
const NODE_W    = 130;
const NODE_H    = 86;
const LEVEL_H   = 130;
const TREE_W    = 8 * UNIT;                  // 1200
const TREE_H    = 4 * LEVEL_H + NODE_H;     // 606

function nodeCx(level: number, idx: number) {
  return (TREE_W / Math.pow(2, level)) * (idx + 0.5);
}
function nodeCy(level: number) {
  return level * LEVEL_H;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface TreeNode {
  id: string;
  full_name: string;
  referral_code: string;
  total_bv: number;
  left_bv: number;
  right_bv: number;
  kyc_status: string;
  profile_photo_url: string | null;
  is_active: boolean;
  package: { name: string } | null;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface LevelEntry {
  node: TreeNode | null;
  level: number;
  idx: number;
  parentIdx: number;
}

function extractLevels(root: TreeNode | null): LevelEntry[][] {
  const l0: LevelEntry[] = [{ node: root, level: 0, idx: 0, parentIdx: -1 }];
  const l1: LevelEntry[] = [
    { node: root?.left  ?? null, level: 1, idx: 0, parentIdx: 0 },
    { node: root?.right ?? null, level: 1, idx: 1, parentIdx: 0 },
  ];
  const l2: LevelEntry[] = [
    { node: l1[0].node?.left  ?? null, level: 2, idx: 0, parentIdx: 0 },
    { node: l1[0].node?.right ?? null, level: 2, idx: 1, parentIdx: 0 },
    { node: l1[1].node?.left  ?? null, level: 2, idx: 2, parentIdx: 1 },
    { node: l1[1].node?.right ?? null, level: 2, idx: 3, parentIdx: 1 },
  ];
  const l3: LevelEntry[] = [
    { node: l2[0].node?.left  ?? null, level: 3, idx: 0, parentIdx: 0 },
    { node: l2[0].node?.right ?? null, level: 3, idx: 1, parentIdx: 0 },
    { node: l2[1].node?.left  ?? null, level: 3, idx: 2, parentIdx: 1 },
    { node: l2[1].node?.right ?? null, level: 3, idx: 3, parentIdx: 1 },
    { node: l2[2].node?.left  ?? null, level: 3, idx: 4, parentIdx: 2 },
    { node: l2[2].node?.right ?? null, level: 3, idx: 5, parentIdx: 2 },
    { node: l2[3].node?.left  ?? null, level: 3, idx: 6, parentIdx: 3 },
    { node: l2[3].node?.right ?? null, level: 3, idx: 7, parentIdx: 3 },
  ];
  return [l0, l1, l2, l3];
}

// ── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ node, size = 'sm' }: { node: TreeNode; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-9 h-9 text-sm' : 'w-6 h-6 text-[10px]';
  const src = getMediaUrl(node.profile_photo_url);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={node.full_name}
        onError={() => setFailedSrc(src)}
        className={`${sz} rounded-full object-cover ring-2 ring-border flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sz} rounded-full bg-violet-500/20 ring-2 ring-border flex-shrink-0 flex items-center justify-center font-bold text-violet-500`}
    >
      {node.full_name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ── Node card ─────────────────────────────────────────────────────────────────
interface NodeCardProps {
  entry: LevelEntry;
  isCenter: boolean;
  isHighlighted: boolean;
  dimmed: boolean;
  onNavigate: (id: string) => void;
}

function NodeCard({ entry, isCenter, isHighlighted, dimmed, onNavigate }: NodeCardProps) {
  const { node, level, idx } = entry;
  const left = nodeCx(level, idx) - NODE_W / 2;
  const top  = nodeCy(level);
  const isLeftHalf = idx < Math.pow(2, level) / 2;
  const legBorder  = level === 0 ? 'border-violet-500/50' : isLeftHalf ? 'border-blue-500/35' : 'border-orange-500/35';

  if (!node) {
    return (
      <div
        style={{ left, top, width: NODE_W, height: NODE_H, position: 'absolute' }}
        className={`rounded-xl border border-dashed ${legBorder} flex flex-col items-center justify-center gap-1 select-none`}
      >
        <UserPlus className={`w-3.5 h-3.5 ${isLeftHalf ? 'text-blue-900/40' : 'text-orange-900/40'}`} />
        <span className="text-[7.5px] font-bold text-muted-foreground/30 uppercase">
          {isLeftHalf ? 'Left' : 'Right'} Open
        </span>
      </div>
    );
  }

  const lBv  = Number(node.left_bv  ?? 0);
  const rBv  = Number(node.right_bv ?? 0);

  return (
    <button
      type="button"
      style={{ left, top, width: NODE_W, height: NODE_H, position: 'absolute' }}
      onClick={() => !isCenter && onNavigate(node.id)}
      disabled={isCenter}
      title={isCenter ? 'Current centre node' : `Navigate to ${node.full_name}'s tree`}
      className={[
        'rounded-xl border text-left p-2 flex flex-col gap-1 overflow-hidden transition-all duration-200',
        isCenter
          ? 'border-violet-500/70 bg-violet-500/12 cursor-default shadow-[0_0_22px_rgba(139,92,246,0.28)]'
          : `bg-card ${legBorder} cursor-pointer hover:border-violet-500/70 hover:bg-violet-500/8 hover:shadow-lg hover:-translate-y-0.5`,
        isHighlighted
          ? 'ring-2 ring-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.65)]'
          : '',
        !node.is_active ? 'opacity-60' : '',
        dimmed ? 'opacity-25 grayscale' : '',
      ].join(' ')}
    >
      {/* Name + avatar row */}
      <div className="flex items-center gap-1.5">
        <Avatar node={node} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-foreground truncate leading-tight">{node.full_name}</p>
          <p className="text-[7.5px] font-mono text-muted-foreground/60 truncate">{node.referral_code}</p>
        </div>
        {isCenter && <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />}
      </div>

      {/* BV stats row */}
      <div className="flex items-center justify-between border-t border-border/20 pt-1 mt-auto">
        <span className={[
          'text-[7.5px] px-1 py-0 rounded font-bold',
          node.package ? 'text-violet-400 bg-violet-500/10' : 'text-muted-foreground/30',
        ].join(' ')}>
          {node.package?.name ?? '—'}
        </span>
        <span className="text-[7.5px] font-mono text-muted-foreground/70">
          <span className="text-blue-400">{lBv.toLocaleString()}</span>
          <span className="text-muted-foreground/30 mx-0.5">·</span>
          <span className="text-orange-400">{rBv.toLocaleString()}</span>
        </span>
      </div>

      {!node.is_active && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
          <span className="text-[7px] font-black text-rose-400 border border-rose-500/40 px-1.5 py-0.5 rounded bg-black/60">
            INACTIVE
          </span>
        </div>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface GenealogyTreeProps {
  /** Admin mode: lets the viewer jump to any member's tree and filter nodes. */
  adminMode?: boolean;
}

export default function GenealogyTree({ adminMode = false }: GenealogyTreeProps = {}) {
  const { authToken } = useAppStore();

  const [centerId, setCenterId]       = useState<string | null>(null);
  const [history, setHistory]         = useState<Array<string | null>>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Responsive fit: shrink the fixed-size tree canvas to the available width so it's
  // fully visible on mobile instead of being cropped — never scales up past 1 on desktop.
  // A callback ref (not useRef + useLayoutEffect) is required here: the canvas div only
  // exists once the tree has finished loading, so a plain ref-driven effect with an empty
  // dep array would run once (while still loading, ref still null) and never fire again.
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasObserverRef = useRef<ResizeObserver | null>(null);
  const canvasWrapRef = useCallback((el: HTMLDivElement | null) => {
    canvasObserverRef.current?.disconnect();
    canvasObserverRef.current = null;
    if (!el) return;
    const updateScale = () => setCanvasScale(Math.min(1, el.clientWidth / TREE_W));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    canvasObserverRef.current = observer;
  }, []);

  // ── Admin: jump-to-member root picker ─────────────────────────────────────
  const [rootPickerInput, setRootPickerInput] = useState('');
  const { data: adminNetworkData } = useQuery({
    queryKey: ['admin-genealogy-network-picker'],
    queryFn: () => api.mlm.networkList(),
    enabled: adminMode && rootPickerInput.trim().length >= 2,
    staleTime: 30_000,
  });
  const rootCandidates = adminMode && rootPickerInput.trim().length >= 2
    ? (adminNetworkData?.users ?? []).filter((u: any) =>
        u.full_name?.toLowerCase().includes(rootPickerInput.trim().toLowerCase()) ||
        u.referral_code?.toLowerCase().includes(rootPickerInput.trim().toLowerCase())
      ).slice(0, 6)
    : [];

  // ── Admin: filter controls (dim non-matching nodes for easier navigation) ──
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterLeg, setFilterLeg]       = useState<'all' | 'left' | 'right'>('all');
  const [filterKyc, setFilterKyc]       = useState<'all' | 'approved' | 'pending'>('all');
  const filtersActive = filterStatus !== 'all' || filterLeg !== 'all' || filterKyc !== 'all';

  const nodeMatchesFilter = useCallback((node: TreeNode, isLeftHalf: boolean, level: number) => {
    if (filterStatus === 'active' && !node.is_active) return false;
    if (filterStatus === 'inactive' && node.is_active) return false;
    if (level > 0) {
      if (filterLeg === 'left' && !isLeftHalf) return false;
      if (filterLeg === 'right' && isLeftHalf) return false;
    }
    if (filterKyc === 'approved' && node.kyc_status !== 'approved') return false;
    if (filterKyc === 'pending' && node.kyc_status === 'approved') return false;
    return true;
  }, [filterStatus, filterLeg, filterKyc]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: tree, isLoading: treeLoading, isError: treeError, refetch: refetchTree } = useQuery({
    queryKey: ['mlm-tree', authToken, centerId],
    queryFn: () => centerId ? api.mlm.tree(centerId) : api.mlm.tree(),
    enabled: !!authToken,
    staleTime: 60_000,
    retry: false,
  });

  const { data: bvData, isLoading: bvLoading, refetch: refetchBv } = useQuery({
    queryKey: ['mlm-bv-summary', authToken, adminMode ? centerId : null],
    queryFn: () => api.mlm.bvSummary(adminMode && centerId ? centerId : undefined),
    enabled: !!authToken,
    staleTime: 60_000,
  });

  // ── Derived BV values ──────────────────────────────────────────────────────
  const leftBv     = Number(bvData?.left_bv  ?? 0);
  const rightBv    = Number(bvData?.right_bv ?? 0);
  // Matching pays on the *unmatched* balance (what's left after earlier runs), at the rate and
  // per-run cap configured in Income Sources — mirrors server/src/jobs/bvMatching.js.
  const carryLeft  = Number(bvData?.carry_forward_left  ?? 0);
  const carryRight = Number(bvData?.carry_forward_right ?? 0);
  const matchRate  = Number(bvData?.matching_rate ?? 12);
  const matchCap   = Number(bvData?.matching_cap ?? 10_000);
  const bonusINR   = Math.min((Math.min(carryLeft, carryRight) * matchRate) / 100, matchCap);
  const progressPct = matchCap > 0 ? Math.min(100, (bonusINR / matchCap) * 100) : 0;

  // ── Tree levels ────────────────────────────────────────────────────────────
  const levels     = tree ? extractLevels(tree as TreeNode) : null;
  const allNodes   = levels
    ? (levels.flat().map(e => e.node).filter(Boolean) as TreeNode[])
    : [];

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigateTo = useCallback((id: string) => {
    setHistory(h => [...h, centerId]);
    setCenterId(id);
    setHighlightId(null);
    setSearchInput('');
    setSearchError('');
  }, [centerId]);

  const navigateBack = useCallback(() => {
    setHistory(h => {
      const prev = h[h.length - 1];
      setCenterId(typeof prev === 'string' ? prev : null);
      setHighlightId(null);
      return h.slice(0, -1);
    });
  }, []);

  const navigateHome = useCallback(() => {
    setHistory([]);
    setCenterId(null);
    setHighlightId(null);
    setSearchInput('');
    setSearchError('');
  }, []);

  // Admin: jump straight to any member's tree (fresh navigation stack)
  const jumpToRoot = useCallback((id: string) => {
    setHistory([]);
    setCenterId(id);
    setHighlightId(null);
    setSearchInput('');
    setSearchError('');
    setRootPickerInput('');
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const q = searchInput.trim();
    if (!q) return;
    setSearchError('');
    setHighlightId(null);

    // Check visible nodes first
    const visibleMatch = allNodes.find(n =>
      n.referral_code.toLowerCase() === q.toLowerCase() ||
      n.full_name.toLowerCase().includes(q.toLowerCase())
    );
    if (visibleMatch) {
      const rootNode = tree as TreeNode | null;
      if (visibleMatch.id === rootNode?.id) {
        setSearchError('This user is already the current centre node.');
        return;
      }
      setHighlightId(visibleMatch.id);
      return;
    }

    // Search backend downline
    try {
      const result = await api.mlm.downlineSearch(q);
      if (result.users?.length > 0) {
        navigateTo(result.users[0].id);
      } else {
        setSearchError('No user found in your binary downline.');
      }
    } catch {
      setSearchError('User not found or not in your binary downline.');
    }
  }, [searchInput, allNodes, tree, navigateTo]);

  const isLoading = treeLoading || bvLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-0.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Left Leg BV</p>
            <p className="text-2xl font-extrabold text-foreground font-mono">{leftBv.toLocaleString()}</p>
            <p className="text-[9.5px] text-muted-foreground">Carry-fwd: {carryLeft.toLocaleString()} BV</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-0.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Right Leg BV</p>
            <p className="text-2xl font-extrabold text-foreground font-mono">{rightBv.toLocaleString()}</p>
            <p className="text-[9.5px] text-muted-foreground">Carry-fwd: {carryRight.toLocaleString()} BV</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card shadow-sm border-primary/20">
          <CardContent className="p-4 space-y-0.5">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Matching Reward (next run)</p>
              <span className="text-[8px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">{matchRate}% rate</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground font-mono">₹{bonusINR.toLocaleString()}</p>
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Trophy className="w-3 h-3 text-amber-400" />
              Lifetime: ₹{(bvData?.lifetime_binary_bonus ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily cap bar */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div>
            <h4 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Matching Cap — ₹{matchCap.toLocaleString()} per weekly run
            </h4>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">
              Next run estimate: <strong className="text-primary">₹{bonusINR.toFixed(2)}</strong>
            </p>
          </div>
          <div className="w-full sm:w-56 flex-shrink-0 space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Cap used</span>
              <span className="font-bold font-mono">{progressPct.toFixed(1)}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5 bg-muted-foreground/10" />
          </div>
        </CardContent>
      </Card>

      {/* ── Binary tree ── */}
      <Card className="border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
          <div className="flex flex-wrap gap-3 items-start justify-between">
            <div>
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Binary Network Tree
                {centerId && <span className="text-[9px] text-violet-400 normal-case font-normal">· downline view</span>}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {centerId
                  ? 'Click any child node to navigate deeper into the tree.'
                  : 'You are the root. Click any node to view their binary subtree.'}
              </CardDescription>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Name or referral code…"
                    value={searchInput}
                    onChange={e => { setSearchInput(e.target.value); setSearchError(''); setHighlightId(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="h-8 pl-8 pr-3 w-44 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button size="sm" onClick={handleSearch} className="h-8 px-2.5 bg-primary text-white flex-shrink-0">
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>
              {history.length > 0 && (
                <Button variant="outline" size="sm" onClick={navigateBack} className="h-8 text-xs gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </Button>
              )}
              {centerId && (
                <Button variant="outline" size="sm" onClick={navigateHome} className="h-8 text-xs gap-1">
                  <Home className="w-3.5 h-3.5" /> My Tree
                </Button>
              )}
              <Button variant="outline" size="sm" disabled={isLoading}
                onClick={() => { refetchTree(); refetchBv(); }}
                className="h-8"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Admin: jump-to-member root picker + node filters */}
          {adminMode && (
            <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1.5">
                <UserCog className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Jump to any member…"
                    value={rootPickerInput}
                    onChange={e => setRootPickerInput(e.target.value)}
                    className="h-8 pl-3 pr-3 w-48 rounded-lg border border-violet-500/30 bg-violet-500/5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  {rootCandidates.length > 0 && (
                    <div className="absolute z-20 top-full left-0 mt-1 w-56 rounded-lg border border-border bg-card shadow-xl max-h-48 overflow-y-auto">
                      {rootCandidates.map((u: any) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => jumpToRoot(u.id)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-xs font-bold truncate">{u.full_name}</span>
                          <span className="text-[9px] text-muted-foreground font-mono ml-auto">{u.referral_code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className={`w-3.5 h-3.5 flex-shrink-0 ${filtersActive ? 'text-violet-400' : 'text-muted-foreground'}`} />
                <select
                  aria-label="Filter by status"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="h-8 px-2 rounded-lg border border-border bg-muted/20 text-[10px] font-semibold text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active only</option>
                  <option value="inactive">Inactive only</option>
                </select>
                <select
                  aria-label="Filter by leg"
                  value={filterLeg}
                  onChange={e => setFilterLeg(e.target.value as any)}
                  className="h-8 px-2 rounded-lg border border-border bg-muted/20 text-[10px] font-semibold text-foreground"
                >
                  <option value="all">Both Legs</option>
                  <option value="left">Left Leg only</option>
                  <option value="right">Right Leg only</option>
                </select>
                <select
                  aria-label="Filter by KYC status"
                  value={filterKyc}
                  onChange={e => setFilterKyc(e.target.value as any)}
                  className="h-8 px-2 rounded-lg border border-border bg-muted/20 text-[10px] font-semibold text-foreground"
                >
                  <option value="all">All KYC</option>
                  <option value="approved">KYC Verified</option>
                  <option value="pending">KYC Pending</option>
                </select>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={() => { setFilterStatus('all'); setFilterLeg('all'); setFilterKyc('all'); }}
                    className="text-[9.5px] text-violet-400 hover:underline font-bold"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Feedback row */}
          {searchError && <p className="text-[9.5px] text-amber-500 mt-1">{searchError}</p>}
          {history.length > 0 && (
            <div className="flex items-center gap-1 text-[8px] text-muted-foreground font-mono mt-1">
              <Home className="w-2.5 h-2.5" />
              {history.map((_, i) => <span key={i}> › L{i + 1}</span>)}
              <span className="text-violet-400"> › Current</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Loading binary tree…</span>
            </div>
          ) : !authToken ? (
            <div className="text-center py-20 text-xs text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Log in to view your binary network tree.</p>
            </div>
          ) : treeError || !tree ? (
            <div className="text-center py-20 text-xs text-muted-foreground">
              <Lock className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>This user is not in your binary downline.</p>
              <Button variant="outline" size="sm" onClick={navigateHome} className="mt-3 text-xs gap-1">
                <Home className="w-3.5 h-3.5" /> Return to My Tree
              </Button>
            </div>
          ) : levels ? (
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-[8.5px] text-muted-foreground mb-4 select-none">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Left leg</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> Right leg</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-500" /> Centre node</span>
                <span className="flex items-center gap-1.5"><Sparkles className="w-2.5 h-2.5 text-violet-400" /> Click a node to navigate into their tree</span>
              </div>

              {/* Tree canvas — auto-scaled to fit the available width so it's fully visible on mobile
                  instead of being cropped; never scales up past 1:1 on wide screens. */}
              <div ref={canvasWrapRef} className="w-full">
              <div
                style={{ width: TREE_W * canvasScale, height: TREE_H * canvasScale, margin: '0 auto' }}
              >
              <div
                style={{ width: TREE_W, height: TREE_H, position: 'relative', transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}
              >
                {/* SVG connecting lines */}
                <svg
                  style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
                  width={TREE_W}
                  height={TREE_H}
                >
                  {levels.slice(1).flatMap(levelEntries =>
                    levelEntries.map(entry => {
                      const parentCx   = nodeCx(entry.level - 1, entry.parentIdx);
                      const parentCyB  = nodeCy(entry.level - 1) + NODE_H;  // parent bottom
                      const childCxC   = nodeCx(entry.level, entry.idx);
                      const childCyT   = nodeCy(entry.level);               // child top
                      const midY       = (parentCyB + childCyT) / 2;
                      const isLeft     = entry.idx < Math.pow(2, entry.level) / 2;
                      return (
                        <path
                          key={`l${entry.level}-i${entry.idx}`}
                          d={`M ${parentCx} ${parentCyB} C ${parentCx} ${midY}, ${childCxC} ${midY}, ${childCxC} ${childCyT}`}
                          stroke={isLeft ? '#3b82f6' : '#f97316'}
                          strokeWidth={1.5}
                          fill="none"
                          opacity={entry.node ? 0.55 : 0.14}
                          strokeDasharray={entry.node ? undefined : '4 3'}
                        />
                      );
                    })
                  )}
                </svg>

                {/* Node cards */}
                {levels.flat().map(entry => {
                  const isLeftHalf = entry.idx < Math.pow(2, entry.level) / 2;
                  const dimmed = adminMode && filtersActive && !!entry.node
                    && !nodeMatchesFilter(entry.node, isLeftHalf, entry.level);
                  return (
                    <NodeCard
                      key={`n${entry.level}-${entry.idx}`}
                      entry={entry}
                      isCenter={entry.level === 0}
                      isHighlighted={!!entry.node && entry.node.id === highlightId}
                      dimmed={dimmed}
                      onNavigate={navigateTo}
                    />
                  );
                })}

                {/* Leg labels */}
                <div
                  style={{
                    position: 'absolute',
                    top: nodeCy(1) + NODE_H / 2 - 8,
                    left: nodeCx(1, 0) - NODE_W / 2 - 60,
                  }}
                  className="text-[8px] font-black text-blue-400 uppercase tracking-wider whitespace-nowrap"
                >
                  ← Left Leg
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: nodeCy(1) + NODE_H / 2 - 8,
                    left: nodeCx(1, 1) + NODE_W / 2 + 8,
                  }}
                  className="text-[8px] font-black text-orange-400 uppercase tracking-wider whitespace-nowrap"
                >
                  Right Leg →
                </div>
              </div>
              </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
