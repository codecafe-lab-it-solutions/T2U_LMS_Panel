import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Users, Search, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  GitCommit, UserPlus, UserMinus, CheckCircle, AlertCircle, X,
  ArrowRight, Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Member {
  id: string;
  full_name: string;
  email: string;
  referral_code: string;
  binary_position: 'left' | 'right' | null;
  is_active: boolean;
  left_bv: number;
  right_bv: number;
  total_bv: number;
  kyc_status: string;
  created_at: string;
  package: { name: string; level: number } | null;
  binary_parent: { id: string; full_name: string; referral_code: string } | null;
}

interface UnplacedUser {
  id: string;
  full_name: string;
  referral_code: string;
  email: string;
  role: string;
}

const PAGE_LIMIT = 20;

// ── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs';
  return (
    <div className={`${sz} rounded-full bg-violet-500/20 ring-1 ring-border flex-shrink-0 flex items-center justify-center font-bold text-violet-500`}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ── Status chip ───────────────────────────────────────────────────────────────
function StatusChip({ active }: { active: boolean }) {
  return (
    <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded-full border ${
      active
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }`}>
      {active ? 'ACTIVE' : 'INACTIVE'}
    </span>
  );
}

// ── Place Member Modal ─────────────────────────────────────────────────────────
interface PlaceModalProps {
  parentId: string;
  parentName: string;
  onClose: () => void;
  onPlaced: (message: string) => void;
}

function PlaceModal({ parentId, parentName, onClose, onPlaced }: PlaceModalProps) {
  const perm = useEmployeePermission('admin-mlm');
  const qc = useQueryClient();
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UnplacedUser | null>(null);
  const [toast, setToast] = useState('');

  const { data: unplacedData, isLoading: unplacedLoading } = useQuery({
    queryKey: ['admin-unplaced', userSearch],
    queryFn: () => api.mlm.adminUnplaced(userSearch || undefined),
    staleTime: 10_000,
  });

  const placeMutation = useMutation({
    mutationFn: () => api.mlm.adminPlace({ user_id: selectedUser!.id, parent_id: parentId, position }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['admin-unplaced'] });
      // The exact slot under the chosen parent may already be taken — the backend spills over
      // to the first open slot further down that same leg, so tell the admin where the user
      // actually landed when that isn't the parent they originally picked.
      const message = res.spilled_over && res.placed_under
        ? `${selectedUser!.full_name} placed on the ${position} side — spilled over to ${res.placed_under.full_name} (${position}) since ${parentName}'s ${position} slot was already taken.`
        : 'User placed successfully.';
      onPlaced(message);
    },
    onError: (e: any) => setToast(e?.message ?? 'Failed to place user'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Place User Under <span className="text-primary">{parentName}</span></h3>
          <button type="button" title="Close" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Position selector */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-2">Position</label>
          <div className="grid grid-cols-2 gap-2">
            {(['left', 'right'] as const).map(pos => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosition(pos)}
                className={`h-10 rounded-lg border text-xs font-bold transition-all ${
                  position === pos
                    ? pos === 'left'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                {pos === 'left' ? '← Left Leg' : 'Right Leg →'}
              </button>
            ))}
          </div>
        </div>

        {/* User search */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-2">Search Unplaced User</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Name or referral code…"
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setSelectedUser(null); }}
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* User list */}
        <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-border/50 p-2 bg-muted/10">
          {unplacedLoading ? (
            <div className="text-center py-4 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
          ) : (unplacedData?.users ?? []).length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">No unplaced users found</p>
          ) : (unplacedData?.users ?? []).map((u: UnplacedUser) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUser(u)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all ${
                selectedUser?.id === u.id
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-muted/30 border border-transparent'
              }`}
            >
              <Avatar name={u.full_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{u.full_name}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{u.referral_code}</p>
              </div>
              {selectedUser?.id === u.id && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>

        {toast && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{toast}</p>
        )}

        {/* Selected preview */}
        {selectedUser && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
            <span className="font-bold text-foreground truncate">{selectedUser.full_name}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className={`font-bold flex-shrink-0 ${position === 'left' ? 'text-blue-400' : 'text-orange-400'}`}>
              {position} of {parentName}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1 h-9 text-xs">Cancel</Button>
          {perm.edit && (
            <Button
              size="sm"
              disabled={!selectedUser || placeMutation.isPending}
              onClick={() => placeMutation.mutate()}
              className="flex-1 h-9 text-xs bg-primary text-white"
            >
              {placeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><UserPlus className="w-3.5 h-3.5 mr-1.5" />Place User</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminTeamManagement() {
  const perm = useEmployeePermission('admin-mlm');
  const qc = useQueryClient();

  // Root user selector
  const [rootSearch, setRootSearch]       = useState('');
  const [rootInput, setRootInput]         = useState('');
  const [selectedRoot, setSelectedRoot]   = useState<{ id: string; full_name: string; referral_code: string } | null>(null);

  // Member list
  const [memberSearch, setMemberSearch]   = useState('');
  const [page, setPage]                   = useState(1);

  // Place modal
  const [placeParent, setPlaceParent]     = useState<{ id: string; full_name: string } | null>(null);

  // Confirm detach
  const [detachTarget, setDetachTarget]   = useState<Member | null>(null);

  // Toast
  const [toast, setToast]                 = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Root user search ───────────────────────────────────────────────────────
  const { isLoading: rootLoading } = useQuery({
    queryKey: ['admin-root-search', rootSearch],
    queryFn: () => rootSearch.length >= 2
      ? api.mlm.downlineSearch(rootSearch).catch(() => ({ users: [] }))
      : Promise.resolve({ users: [] }),
    enabled: rootSearch.length >= 2,
    staleTime: 10_000,
  });

  // Also search via admin network
  const { data: networkData } = useQuery({
    queryKey: ['admin-network-search', rootSearch],
    queryFn: () => api.mlm.networkList(),
    enabled: !!rootSearch && rootSearch.length >= 2,
    staleTime: 30_000,
  });

  const rootCandidates = (() => {
    if (!rootSearch) return [];
    const q = rootSearch.toLowerCase();
    const fromNetwork = (networkData?.users ?? []).filter((u: any) =>
      u.full_name?.toLowerCase().includes(q) || u.referral_code?.toLowerCase().includes(q)
    ).slice(0, 5);
    return fromNetwork;
  })();

  // ── Members of selected root ───────────────────────────────────────────────
  const { data: membersData, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['admin-team', selectedRoot?.id, memberSearch, page],
    queryFn: () => api.mlm.adminMembers(selectedRoot!.id, { search: memberSearch || undefined, page, limit: PAGE_LIMIT }),
    enabled: !!selectedRoot,
    staleTime: 30_000,
  });

  const members   = membersData?.members ?? [];
  const total     = membersData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  // ── Detach mutation ────────────────────────────────────────────────────────
  const detachMutation = useMutation({
    mutationFn: (userId: string) => api.mlm.adminDetach(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      showToast('success', 'User detached from binary tree.');
      setDetachTarget(null);
    },
    onError: (e: any) => showToast('error', e?.message ?? 'Detach failed'),
  });

  // ── Toggle active status ───────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.mlm.updateStatus(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      showToast('success', 'Status updated.');
    },
    onError: (e: any) => showToast('error', e?.message ?? 'Update failed'),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-xs font-bold animate-in slide-in-from-top-2 ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-primary" />
          Team Management
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          View, place, and manage any user's binary downline team. Admin-only.
        </p>
      </div>

      {/* Root user selector */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Root User</CardTitle>
          <CardDescription className="text-[10.5px]">Search any user to view and manage their binary downline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or referral code…"
                value={rootInput}
                onChange={e => setRootInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setRootSearch(rootInput)}
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button size="sm" onClick={() => setRootSearch(rootInput)} className="h-9 px-3 bg-primary text-white">
              <Search className="w-3.5 h-3.5" />
            </Button>
            {selectedRoot && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedRoot(null); setRootSearch(''); setRootInput(''); }} className="h-9 px-3">
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Search results */}
          {rootSearch.length >= 2 && !selectedRoot && (
            <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-border/50 p-2 bg-muted/5">
              {rootLoading ? (
                <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></div>
              ) : rootCandidates.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">No users found</p>
              ) : rootCandidates.map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setSelectedRoot({ id: u.id, full_name: u.full_name, referral_code: u.referral_code }); setPage(1); }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 text-left transition-all border border-transparent hover:border-border/40"
                >
                  <Avatar name={u.full_name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{u.full_name}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{u.referral_code}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Selected root badge */}
          {selectedRoot && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <Avatar name={selectedRoot.full_name} size="md" />
              <div>
                <p className="text-sm font-bold text-foreground">{selectedRoot.full_name}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{selectedRoot.referral_code}</p>
              </div>
              <div className="ml-auto flex gap-2">
                {perm.edit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPlaceParent({ id: selectedRoot.id, full_name: selectedRoot.full_name })}
                    className="h-8 text-xs gap-1.5 text-violet-400 border-violet-500/30 hover:border-violet-500/60"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Member
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => refetchMembers()} className="h-8 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members table */}
      {selectedRoot && (
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Downline Members
                  <span className="text-[9px] text-violet-400 normal-case font-normal">({total} total)</span>
                </CardTitle>
                <CardDescription className="text-[10.5px] mt-0.5">All binary downline members of {selectedRoot.full_name}</CardDescription>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter members…"
                  value={memberSearch}
                  onChange={e => { setMemberSearch(e.target.value); setPage(1); }}
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {membersLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading members…
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No downline members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-3 min-w-[180px]">Member</th>
                      <th className="p-3 min-w-[100px]">Referral Code</th>
                      <th className="p-3 min-w-[90px]">Package</th>
                      <th className="p-3 min-w-[70px]">Position</th>
                      <th className="p-3 min-w-[120px]">Parent</th>
                      <th className="p-3 min-w-[130px] text-right">BV (L · R)</th>
                      <th className="p-3 min-w-[80px]">Status</th>
                      <th className="p-3 min-w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {members.map((m: Member) => (
                      <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                        {/* Member */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={m.full_name} size="sm" />
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-[11px] truncate max-w-[120px]">{m.full_name}</p>
                              <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Referral code */}
                        <td className="p-3 font-mono text-violet-400 text-[10px]">{m.referral_code}</td>
                        {/* Package */}
                        <td className="p-3">
                          {m.package ? (
                            <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20">
                              {m.package.name}
                            </span>
                          ) : (
                            <span className="text-[9px] text-muted-foreground/40">—</span>
                          )}
                        </td>
                        {/* Position */}
                        <td className="p-3">
                          {m.binary_position ? (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                              m.binary_position === 'left'
                                ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                                : 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                            }`}>
                              {m.binary_position.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-[9px] text-muted-foreground/40">—</span>
                          )}
                        </td>
                        {/* Parent */}
                        <td className="p-3">
                          {m.binary_parent ? (
                            <div>
                              <p className="text-[10px] font-semibold text-foreground truncate max-w-[100px]">{m.binary_parent.full_name}</p>
                              <p className="text-[8.5px] text-muted-foreground font-mono">{m.binary_parent.referral_code}</p>
                            </div>
                          ) : <span className="text-[9px] text-muted-foreground/40">Root</span>}
                        </td>
                        {/* BV */}
                        <td className="p-3 text-right font-mono">
                          <span className="text-blue-400 text-[10px]">{m.left_bv.toLocaleString()}</span>
                          <span className="text-muted-foreground/30 mx-1">·</span>
                          <span className="text-orange-400 text-[10px]">{m.right_bv.toLocaleString()}</span>
                        </td>
                        {/* Status */}
                        <td className="p-3"><StatusChip active={m.is_active} /></td>
                        {/* Actions */}
                        <td className="p-3">
                          {perm.edit ? (
                            <div className="flex gap-1.5">
                              {/* Place under this member */}
                              <button
                                type="button"
                                title="Add someone under this member"
                                onClick={() => setPlaceParent({ id: m.id, full_name: m.full_name })}
                                className="p-1.5 rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-colors"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                              {/* Toggle active */}
                              <button
                                type="button"
                                title={m.is_active ? 'Deactivate' : 'Activate'}
                                onClick={() => toggleMutation.mutate({ id: m.id, active: !m.is_active })}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  m.is_active
                                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                              {/* Detach from tree */}
                              <button
                                type="button"
                                title="Remove from binary tree"
                                onClick={() => setDetachTarget(m)}
                                className="p-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : <span className="text-[9px] text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/5">
                <span className="text-[10px] text-muted-foreground">
                  Page {page} of {totalPages} · {total} members
                </span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Place modal */}
      {placeParent && (
        <PlaceModal
          parentId={placeParent.id}
          parentName={placeParent.full_name}
          onClose={() => setPlaceParent(null)}
          onPlaced={(message) => { setPlaceParent(null); refetchMembers(); showToast('success', message); }}
        />
      )}

      {/* Detach confirm dialog */}
      {detachTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetachTarget(null)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Detach from Binary Tree?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This will remove <strong>{detachTarget.full_name}</strong>'s binary position.
                  Their subtree will be orphaned.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setDetachTarget(null)} className="flex-1 h-9 text-xs">Cancel</Button>
              {perm.edit && (
                <Button
                  size="sm"
                  disabled={detachMutation.isPending}
                  onClick={() => detachMutation.mutate(detachTarget.id)}
                  className="flex-1 h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0"
                >
                  {detachMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Detach'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
