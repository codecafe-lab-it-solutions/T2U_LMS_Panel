import { useState, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { api, getMediaUrl } from '../services/api';
import {
  Users, Sparkles, AlertCircle, Trophy, Loader2, RefreshCw,
  Search, ChevronLeft, Home, Lock, UserPlus, Filter, UserCog,
  Network, ListTree, CheckCircle2, Clock, Eye, Layers, ZoomIn, Maximize2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ── Layout constants ──────────────────────────────────────────────────────────
const UNIT      = 150;
const NODE_W    = 130;
const NODE_H    = 86;
const LEVEL_H   = 130;

function getTreeDimensions(depth: number) {
  const leafCount = Math.pow(2, Math.max(0, depth - 1));
  const width = Math.max(1200, leafCount * UNIT);
  const height = depth * LEVEL_H + NODE_H;
  return { width, height };
}

function nodeCx(level: number, idx: number, treeW: number) {
  return (treeW / Math.pow(2, level)) * (idx + 0.5);
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

interface DownlineMember {
  node: TreeNode;
  level: number;
  leg: 'left' | 'right' | 'root';
  path: string;
  parentName?: string;
  parentCode?: string;
}

interface BreadcrumbEntry {
  id: string | null;
  label: string;
  code?: string;
}

// ── Tree Helpers ──────────────────────────────────────────────────────────────
function calculateMaxDepth(node: TreeNode | null, currentDepth = 1): number {
  if (!node) return 0;
  let max = currentDepth;
  if (node.left) max = Math.max(max, calculateMaxDepth(node.left, currentDepth + 1));
  if (node.right) max = Math.max(max, calculateMaxDepth(node.right, currentDepth + 1));
  return max;
}

function extractAllMembers(root: TreeNode | null): DownlineMember[] {
  if (!root) return [];
  const list: DownlineMember[] = [];

  function walk(node: TreeNode, level: number, leg: 'left' | 'right' | 'root', path: string, parent?: TreeNode) {
    list.push({
      node,
      level,
      leg,
      path,
      parentName: parent?.full_name,
      parentCode: parent?.referral_code,
    });
    if (node.left) {
      walk(node.left, level + 1, 'left', path ? `${path} › L` : 'Left', node);
    }
    if (node.right) {
      walk(node.right, level + 1, 'right', path ? `${path} › R` : 'Right', node);
    }
  }

  walk(root, 0, 'root', 'Center');
  return list;
}

function extractLevels(root: TreeNode | null, maxLevels: number): LevelEntry[][] {
  if (!root) return [];
  const result: LevelEntry[][] = [];
  result.push([{ node: root, level: 0, idx: 0, parentIdx: -1 }]);

  for (let lvl = 1; lvl < maxLevels; lvl++) {
    const prev = result[lvl - 1];
    const current: LevelEntry[] = [];
    for (let p = 0; p < prev.length; p++) {
      const pNode = prev[p].node;
      current.push({
        node: pNode?.left ?? null,
        level: lvl,
        idx: p * 2,
        parentIdx: p,
      });
      current.push({
        node: pNode?.right ?? null,
        level: lvl,
        idx: p * 2 + 1,
        parentIdx: p,
      });
    }
    result.push(current);
  }
  return result;
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
  onNavigate: (id: string, name?: string, code?: string) => void;
  treeW: number;
  isBottomLevel: boolean;
}

function NodeCard({ entry, isCenter, isHighlighted, dimmed, onNavigate, treeW, isBottomLevel }: NodeCardProps) {
  const { node, level, idx } = entry;
  const left = nodeCx(level, idx, treeW) - NODE_W / 2;
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
  const hasChildren = Boolean(node.left || node.right);

  return (
    <button
      type="button"
      style={{ left, top, width: NODE_W, height: NODE_H, position: 'absolute' }}
      onClick={() => !isCenter && onNavigate(node.id, node.full_name, node.referral_code)}
      disabled={isCenter}
      title={isCenter ? 'Current centre node' : hasChildren ? `View downline of ${node.full_name} (${node.referral_code})` : `Navigate to ${node.full_name}'s tree`}
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
          <div className="flex items-center gap-1">
            <p className="text-[7.5px] font-mono text-muted-foreground/60 truncate">{node.referral_code}</p>
            {hasChildren && !isCenter && (
              <span
                className={`text-[6.5px] font-bold ${
                  isBottomLevel
                    ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40 animate-pulse'
                    : 'text-violet-400 bg-violet-500/15 border border-violet-500/25'
                } px-1 py-0.5 rounded leading-none shrink-0`}
                title="Click to drill down into deeper levels"
              >
                ▼ {isBottomLevel ? 'Deeper' : 'Team'}
              </span>
            )}
          </div>
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
  const qc = useQueryClient();
  const { authToken, employeeAuthToken } = useAppStore();
  const token = authToken || employeeAuthToken;

  const [centerId, setCenterId]       = useState<string | null>(null);
  const [history, setHistory]         = useState<BreadcrumbEntry[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── View Mode: Visual Tree Canvas vs All Levels Explorer ───────────────────
  const [viewMode, setViewMode]                 = useState<'chart' | 'explorer'>('chart');
  const [treeDepth, setTreeDepth]               = useState<number>(4);
  const [fitMode, setFitMode]                   = useState<'fit' | 'scroll'>('fit');
  const [explorerLevelFilter, setExplorerLevelFilter] = useState<number | 'all'>('all');
  const [explorerLegFilter, setExplorerLegFilter]     = useState<'all' | 'left' | 'right'>('all');
  const [explorerSearch, setExplorerSearch]           = useState('');

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
    queryKey: ['mlm-tree', token, centerId],
    queryFn: () => centerId ? api.mlm.tree(centerId) : api.mlm.tree(),
    enabled: !!token,
    staleTime: 5_000,
    retry: false,
  });

  const { data: bvData, isLoading: bvLoading, refetch: refetchBv } = useQuery({
    queryKey: ['mlm-bv-summary', token, adminMode ? centerId : null],
    queryFn: () => api.mlm.bvSummary(adminMode && centerId ? centerId : undefined),
    enabled: !!token,
    staleTime: 5_000,
  });

  // ── Full tree metrics & all downline members ──────────────────────────────
  const actualMaxDepth = useMemo(() => calculateMaxDepth(tree as TreeNode | null), [tree]);
  const allDownlineMembers = useMemo(() => extractAllMembers(tree as TreeNode | null), [tree]);

  // Dynamic tree dimensions based on selected treeDepth
  const { width: dynamicTreeW, height: dynamicTreeH } = useMemo(
    () => getTreeDimensions(treeDepth),
    [treeDepth]
  );

  // Responsive fit scale for the canvas
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasObserverRef = useRef<ResizeObserver | null>(null);
  const canvasWrapRef = useCallback((el: HTMLDivElement | null) => {
    canvasObserverRef.current?.disconnect();
    canvasObserverRef.current = null;
    if (!el) return;
    const updateScale = () => {
      if (fitMode === 'scroll') {
        setCanvasScale(1);
      } else {
        setCanvasScale(Math.min(1, el.clientWidth / dynamicTreeW));
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    canvasObserverRef.current = observer;
  }, [dynamicTreeW, fitMode]);

  // ── Derived BV values ──────────────────────────────────────────────────────
  const leftBv     = Number(bvData?.left_bv  ?? 0);
  const rightBv    = Number(bvData?.right_bv ?? 0);
  const carryLeft  = Number(bvData?.carry_forward_left  ?? 0);
  const carryRight = Number(bvData?.carry_forward_right ?? 0);
  const matchRate  = Number(bvData?.matching_rate ?? 12);
  const matchCap   = Number(bvData?.matching_cap ?? 10_000);
  const bonusINR   = Math.min((Math.min(carryLeft, carryRight) * matchRate) / 100, matchCap);
  const progressPct = matchCap > 0 ? Math.min(100, (bonusINR / matchCap) * 100) : 0;

  // ── Tree levels extracted dynamically ─────────────────────────────────────
  const levels = useMemo(
    () => (tree ? extractLevels(tree as TreeNode, treeDepth) : null),
    [tree, treeDepth]
  );
  const allVisibleNodes = useMemo(
    () => (levels ? (levels.flat().map(e => e.node).filter(Boolean) as TreeNode[]) : []),
    [levels]
  );

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigateTo = useCallback((id: string, name?: string, code?: string) => {
    const currentRoot = tree as TreeNode | null;
    setHistory(h => [
      ...h,
      {
        id: centerId,
        label: name || currentRoot?.full_name || (centerId ? 'Downline Node' : 'Root'),
        code: code || currentRoot?.referral_code,
      },
    ]);
    setCenterId(id);
    setHighlightId(null);
    setSearchInput('');
    setSearchError('');
  }, [centerId, tree]);

  const navigateBack = useCallback(() => {
    setHistory(h => {
      const prev = h[h.length - 1];
      setCenterId(prev ? prev.id : null);
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

  const jumpToHistoryIndex = useCallback((index: number) => {
    const target = history[index];
    setCenterId(target.id);
    setHistory(h => h.slice(0, index));
    setHighlightId(null);
    setSearchInput('');
    setSearchError('');
  }, [history]);

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
    const visibleMatch = allVisibleNodes.find(n =>
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

    // Check all downline members in memory
    const inMemMatch = allDownlineMembers.find(m =>
      m.node.referral_code.toLowerCase() === q.toLowerCase() ||
      m.node.full_name.toLowerCase().includes(q.toLowerCase())
    );
    if (inMemMatch) {
      navigateTo(inMemMatch.node.id, inMemMatch.node.full_name, inMemMatch.node.referral_code);
      return;
    }

    // Search backend downline
    try {
      const result = await api.mlm.downlineSearch(q);
      if (result.users?.length > 0) {
        navigateTo(result.users[0].id, result.users[0].full_name, result.users[0].referral_code);
      } else {
        setSearchError('No user found in your binary downline.');
      }
    } catch {
      setSearchError('User not found or not in your binary downline.');
    }
  }, [searchInput, allVisibleNodes, allDownlineMembers, tree, navigateTo]);

  // Filtered members for All Levels Explorer
  const filteredExplorerMembers = useMemo(() => {
    return allDownlineMembers.filter(m => {
      if (explorerLevelFilter !== 'all' && m.level !== explorerLevelFilter) return false;
      if (explorerLegFilter === 'left' && m.leg !== 'left') return false;
      if (explorerLegFilter === 'right' && m.leg !== 'right') return false;
      if (explorerSearch.trim()) {
        const query = explorerSearch.trim().toLowerCase();
        const matchesName = m.node.full_name?.toLowerCase().includes(query);
        const matchesCode = m.node.referral_code?.toLowerCase().includes(query);
        if (!matchesName && !matchesCode) return false;
      }
      return true;
    });
  }, [allDownlineMembers, explorerLevelFilter, explorerLegFilter, explorerSearch]);

  // Available distinct level numbers in downline
  const availableLevels = useMemo(() => {
    const levelsSet = new Set<number>();
    allDownlineMembers.forEach(m => levelsSet.add(m.level));
    return Array.from(levelsSet).sort((a, b) => a - b);
  }, [allDownlineMembers]);

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

      {/* ── Binary tree & All Levels Explorer ── */}
      <Card className="border border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
          <div className="flex flex-wrap gap-3 items-start justify-between">
            <div>
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Network className="w-4 h-4 text-primary" />
                Binary Genealogy Network
                {centerId && <span className="text-[9px] text-violet-400 normal-case font-normal">· downline focus</span>}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {centerId
                  ? 'Viewing subtree downline. Click any member to navigate deeper, or use All Levels Explorer.'
                  : 'You are the root. View all levels of your binary downline network.'}
              </CardDescription>

              {/* Network Stats Badges */}
              {tree && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[9.5px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Max Depth: {actualMaxDepth} {actualMaxDepth === 1 ? 'Level' : 'Levels'}
                  </span>
                  <span className="text-[9.5px] font-bold bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3" /> Total Network: {Math.max(0, allDownlineMembers.length - 1)} {allDownlineMembers.length === 2 ? 'Member' : 'Members'}
                  </span>
                  {centerId && (
                    <button
                      type="button"
                      onClick={navigateHome}
                      className="text-[9.5px] font-bold text-violet-400 hover:text-violet-300 underline flex items-center gap-1 ml-1"
                    >
                      <Home className="w-3 h-3" /> Reset to Top
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* View Mode Toggle: Tree Canvas vs All Levels Explorer */}
              <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'chart'
                      ? 'bg-card text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-primary" />
                  <span>Tree Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('explorer')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'explorer'
                      ? 'bg-card text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ListTree className="w-3.5 h-3.5 text-violet-400" />
                  <span>All Levels ({allDownlineMembers.length})</span>
                </button>
              </div>

              {/* Search */}
              <div className="flex gap-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search any member…"
                    value={searchInput}
                    onChange={e => { setSearchInput(e.target.value); setSearchError(''); setHighlightId(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="h-8 pl-8 pr-3 w-40 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ['mlm-tree'] });
                  qc.invalidateQueries({ queryKey: ['mlm-bv-summary'] });
                  refetchTree();
                  refetchBv();
                }}
                className="h-8"
                title="Refresh network"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Chart Controls: Visible Depth Selector & Zoom mode */}
          {viewMode === 'chart' && levels && (
            <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Display Depth:
                </span>
                <div className="flex items-center gap-1 bg-muted/30 p-0.5 rounded-lg border border-border/60">
                  {[3, 4, 5, 6].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTreeDepth(d)}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all ${
                        treeDepth === d
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {d} Levels
                    </button>
                  ))}
                </div>
                {actualMaxDepth > treeDepth && (
                  <span className="text-[9.5px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> More levels exist below — click bottom nodes or switch to 5/6 Levels
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Canvas:</span>
                <button
                  type="button"
                  onClick={() => setFitMode(m => (m === 'fit' ? 'scroll' : 'fit'))}
                  className="h-7 px-2.5 rounded border border-border bg-card text-[10px] font-bold text-foreground flex items-center gap-1 hover:border-primary/50 transition-colors"
                >
                  {fitMode === 'fit' ? (
                    <>
                      <Maximize2 className="w-3 h-3 text-primary" /> Fit to Screen
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-3 h-3 text-violet-400" /> 100% (Scrollable)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

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

          {/* Clickable Breadcrumbs Path */}
          {history.length > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono mt-1 overflow-x-auto py-1">
              <button
                type="button"
                onClick={navigateHome}
                className="flex items-center gap-1 hover:text-primary font-bold text-foreground transition-colors shrink-0"
              >
                <Home className="w-3 h-3" /> Root
              </button>
              {history.map((item, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                  <span className="text-muted-foreground/40">›</span>
                  <button
                    type="button"
                    onClick={() => jumpToHistoryIndex(i)}
                    className="hover:text-primary text-muted-foreground transition-colors truncate max-w-[120px]"
                    title={`Return to ${item.label}`}
                  >
                    {item.label}
                  </button>
                </span>
              ))}
              <span className="text-muted-foreground/40 shrink-0">›</span>
              <span className="text-violet-400 font-bold truncate max-w-[140px] shrink-0">
                {(tree as TreeNode)?.full_name ?? 'Current'}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Loading binary tree…</span>
            </div>
          ) : !token ? (
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
          ) : viewMode === 'explorer' ? (
            /* ── ALL LEVELS DOWNLINE EXPLORER ── */
            <div className="space-y-4">
              {/* Explorer Toolbar */}
              <div className="flex flex-wrap gap-3 items-center justify-between pb-3 border-b border-border/40">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Filter Level:</span>
                  <button
                    type="button"
                    onClick={() => setExplorerLevelFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition-all ${
                      explorerLevelFilter === 'all'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Levels ({allDownlineMembers.length})
                  </button>
                  {availableLevels.map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setExplorerLevelFilter(lvl)}
                      className={`px-2 py-1 rounded-md text-[10.5px] font-bold transition-all ${
                        explorerLevelFilter === lvl
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {lvl === 0 ? 'Root' : `Level ${lvl}`} ({allDownlineMembers.filter(m => m.level === lvl).length})
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Filter explorer by leg"
                    value={explorerLegFilter}
                    onChange={e => setExplorerLegFilter(e.target.value as any)}
                    className="h-8 px-2 rounded-lg border border-border bg-muted/20 text-[10px] font-semibold text-foreground"
                  >
                    <option value="all">Both Legs</option>
                    <option value="left">Left Leg only</option>
                    <option value="right">Right Leg only</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Filter downline..."
                    value={explorerSearch}
                    onChange={e => setExplorerSearch(e.target.value)}
                    className="h-8 px-2.5 w-36 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground"
                  />
                </div>
              </div>

              {/* Members Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-[9.5px] uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Level & Leg</th>
                      <th className="py-2.5 px-3 font-bold">Member</th>
                      <th className="py-2.5 px-3 font-bold">Package</th>
                      <th className="py-2.5 px-3 font-bold text-right">Left BV</th>
                      <th className="py-2.5 px-3 font-bold text-right">Right BV</th>
                      <th className="py-2.5 px-3 font-bold text-right">Total BV</th>
                      <th className="py-2.5 px-3 font-bold text-center">Status</th>
                      <th className="py-2.5 px-3 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredExplorerMembers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                          No downline members found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredExplorerMembers.map(m => {
                        const isCenterNode = m.node.id === (tree as TreeNode)?.id;
                        return (
                          <tr
                            key={m.node.id}
                            className={`hover:bg-muted/15 transition-colors ${
                              isCenterNode ? 'bg-violet-500/5' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground">
                                  {m.level === 0 ? 'Center' : `L${m.level}`}
                                </span>
                                {m.leg === 'left' && (
                                  <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded">
                                    Left
                                  </span>
                                )}
                                {m.leg === 'right' && (
                                  <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1 py-0.5 rounded">
                                    Right
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <Avatar node={m.node} size="sm" />
                                <div>
                                  <p className="font-bold text-foreground text-xs leading-tight flex items-center gap-1">
                                    {m.node.full_name}
                                    {isCenterNode && <Sparkles className="w-3 h-3 text-violet-400" />}
                                  </p>
                                  <p className="text-[9px] font-mono text-muted-foreground">
                                    {m.node.referral_code}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">
                                {m.node.package?.name ?? 'Standard'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-blue-400 font-bold">
                              {Number(m.node.left_bv ?? 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-orange-400 font-bold">
                              {Number(m.node.right_bv ?? 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                              {Number(m.node.total_bv ?? 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {m.node.is_active ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {!isCenterNode ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigateTo(m.node.id, m.node.full_name, m.node.referral_code);
                                    setViewMode('chart');
                                  }}
                                  className="h-6 px-2 text-[10px] font-bold gap-1 border-primary/30 hover:border-primary hover:bg-primary/10"
                                >
                                  <Eye className="w-3 h-3 text-primary" /> Focus Tree
                                </Button>
                              ) : (
                                <span className="text-[10px] font-bold text-muted-foreground/60 italic">
                                  Current Root
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : levels ? (
            /* ── VISUAL TREE CANVAS ── */
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-[8.5px] text-muted-foreground mb-4 select-none">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Left leg</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> Right leg</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-500" /> Centre node</span>
                <span className="flex items-center gap-1.5"><Sparkles className="w-2.5 h-2.5 text-violet-400" /> Click any node to drill into their tree</span>
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  ★ Visible Depth: Level 1 to Level {treeDepth}
                </span>
              </div>

              {/* Tree canvas — auto-scaled to fit or scrollable at 100% */}
              <div ref={canvasWrapRef} className="w-full">
                <div
                  style={{
                    width: fitMode === 'fit' ? dynamicTreeW * canvasScale : dynamicTreeW,
                    height: fitMode === 'fit' ? dynamicTreeH * canvasScale : dynamicTreeH,
                    margin: '0 auto',
                  }}
                >
                  <div
                    style={{
                      width: dynamicTreeW,
                      height: dynamicTreeH,
                      position: 'relative',
                      transform: fitMode === 'fit' ? `scale(${canvasScale})` : 'none',
                      transformOrigin: 'top left',
                    }}
                  >
                    {/* SVG connecting lines */}
                    <svg
                      style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
                      width={dynamicTreeW}
                      height={dynamicTreeH}
                    >
                      {levels.slice(1).flatMap(levelEntries =>
                        levelEntries.map(entry => {
                          const parentCx   = nodeCx(entry.level - 1, entry.parentIdx, dynamicTreeW);
                          const parentCyB  = nodeCy(entry.level - 1) + NODE_H;  // parent bottom
                          const childCxC   = nodeCx(entry.level, entry.idx, dynamicTreeW);
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
                          treeW={dynamicTreeW}
                          isBottomLevel={entry.level === treeDepth - 1}
                        />
                      );
                    })}

                    {/* Leg labels */}
                    <div
                      style={{
                        position: 'absolute',
                        top: nodeCy(1) + NODE_H / 2 - 8,
                        left: nodeCx(1, 0, dynamicTreeW) - NODE_W / 2 - 60,
                      }}
                      className="text-[8px] font-black text-blue-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      ← Left Leg
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: nodeCy(1) + NODE_H / 2 - 8,
                        left: nodeCx(1, 1, dynamicTreeW) + NODE_W / 2 + 8,
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
