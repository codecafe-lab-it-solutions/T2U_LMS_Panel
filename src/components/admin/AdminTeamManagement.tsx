import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  Users, Search, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  GitCommit, UserPlus, UserMinus, CheckCircle, AlertCircle, X,
  ArrowRight, Shield, ArrowRightLeft, Sparkles, AlertTriangle,
  Layers, UserCheck, HelpCircle
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
  package: { name: string; level?: number } | null;
  binary_parent: { id: string; full_name: string; referral_code: string } | null;
}

interface UnplacedUser {
  id: string;
  full_name: string;
  referral_code: string;
  email: string;
  role: string;
  total_bv: number;
  left_bv: number;
  right_bv: number;
  created_at: string;
  is_active: boolean;
  referred_by?: { id: string; full_name: string; referral_code: string } | null;
  attached_downline_count?: number;
}

interface SlotOccupant {
  id: string;
  full_name: string;
  referral_code: string;
  email?: string;
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

// ── Place Member Modal (Adding an unplaced user under a parent) ───────────────
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
  const [mode, setMode] = useState<'direct' | 'spillover'>('direct');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UnplacedUser | null>(null);
  const [toast, setToast] = useState('');

  // Fetch slot availability for parent
  const { data: slotData, isLoading: slotLoading } = useQuery({
    queryKey: ['admin-slot-info', parentId],
    queryFn: () => api.mlm.adminSlotInfo(parentId),
    staleTime: 5_000,
  });

  const { data: unplacedData, isLoading: unplacedLoading } = useQuery({
    queryKey: ['admin-unplaced', userSearch],
    queryFn: () => api.mlm.adminUnplaced({ search: userSearch || undefined, limit: 30 }),
    staleTime: 5_000,
  });

  const currentSlotOccupied = position === 'left' ? slotData?.left?.occupied : slotData?.right?.occupied;
  const currentSlotOccupant = position === 'left' ? slotData?.left?.occupant : slotData?.right?.occupant;

  const placeMutation = useMutation({
    mutationFn: () =>
      api.mlm.adminPlace({
        user_id: selectedUser!.id,
        parent_id: parentId,
        position,
        mode: currentSlotOccupied ? 'spillover' : mode,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['admin-unplaced'] });
      qc.invalidateQueries({ queryKey: ['mlm-tree'] });
      qc.invalidateQueries({ queryKey: ['mlm-bv-summary'] });
      const message = res.spilled_over && res.placed_under
        ? `${selectedUser!.full_name} placed down the ${position} side — spilled over to ${res.placed_under.full_name} (${position}) since direct slot was occupied.`
        : `${selectedUser!.full_name} placed directly under ${parentName} (${position} leg).`;
      onPlaced(message);
    },
    onError: (e: any) => setToast(e?.message ?? 'Failed to place user'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Place Member Under <span className="text-primary">{parentName}</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Select position and an unplaced or detached member.</p>
          </div>
          <button type="button" title="Close" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slot Availability Preview */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-muted-foreground uppercase block">Choose Leg / Position</label>
          <div className="grid grid-cols-2 gap-2">
            {(['left', 'right'] as const).map(pos => {
              const occ = pos === 'left' ? slotData?.left?.occupied : slotData?.right?.occupied;
              const occupant = pos === 'left' ? slotData?.left?.occupant : slotData?.right?.occupant;
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    position === pos
                      ? pos === 'left'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{pos === 'left' ? '← Left Leg' : 'Right Leg →'}</span>
                    {slotLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    ) : occ ? (
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Occupied
                      </span>
                    ) : (
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Open Slot
                      </span>
                    )}
                  </div>
                  {occupant && (
                    <p className="text-[9px] text-muted-foreground mt-1 truncate">
                      Occupant: <strong className="text-foreground">{occupant.full_name}</strong> ({occupant.referral_code})
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {currentSlotOccupied && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] space-y-0.5">
                <p className="font-bold">Slot is currently occupied by {currentSlotOccupant?.full_name}</p>
                <p className="text-muted-foreground text-[10px]">
                  Placement will safely spill over down the {position} leg chain to the first open position.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search unplaced user */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1.5">Select Member from Unplaced Pool</label>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter unplaced users by name or referral code…"
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setSelectedUser(null); }}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="max-h-44 overflow-y-auto space-y-1.5 rounded-xl border border-border/50 p-2 bg-muted/10">
            {unplacedLoading ? (
              <div className="text-center py-4 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
            ) : (unplacedData?.users ?? []).length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                <Users className="w-5 h-5 mx-auto mb-1 opacity-40" />
                No unplaced or detached members found.
              </div>
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold truncate">{u.full_name}</p>
                    {u.attached_downline_count ? (
                      <span className="text-[8px] px-1 rounded bg-violet-500/15 text-violet-300 font-mono">
                        +{u.attached_downline_count} subtree
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono">
                    <span>{u.referral_code}</span>
                    <span>·</span>
                    <span>BV: {u.total_bv.toLocaleString()}</span>
                    {u.referred_by && (
                      <>
                        <span>·</span>
                        <span className="text-violet-400">Ref: {u.referred_by.full_name}</span>
                      </>
                    )}
                  </div>
                </div>
                {selectedUser?.id === u.id && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {toast && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {toast}
          </p>
        )}

        {/* Selected preview */}
        {selectedUser && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
            <span className="font-bold text-foreground truncate">{selectedUser.full_name}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className={`font-bold flex-shrink-0 ${position === 'left' ? 'text-blue-400' : 'text-orange-400'}`}>
              {position.toUpperCase()} of {parentName}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-1 border-t border-border/40">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1 h-9 text-xs">Cancel</Button>
          {perm.edit && (
            <Button
              size="sm"
              disabled={!selectedUser || placeMutation.isPending}
              onClick={() => placeMutation.mutate()}
              className="flex-1 h-9 text-xs bg-primary text-white"
            >
              {placeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><UserPlus className="w-3.5 h-3.5 mr-1.5" />Confirm Placement</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reassign Member Modal (Moving any member to a new parent) ─────────────────
interface ReassignModalProps {
  member: Member | UnplacedUser;
  onClose: () => void;
  onReassigned: (message: string) => void;
}

function ReassignModal({ member, onClose, onReassigned }: ReassignModalProps) {
  const perm = useEmployeePermission('admin-mlm');
  const qc = useQueryClient();
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState<{ id: string; full_name: string; referral_code: string } | null>(null);
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [mode, setMode] = useState<'direct' | 'spillover' | 'swap'>('direct');
  const [toast, setToast] = useState('');

  // Parent search query
  const { data: parentCandidates, isLoading: searchLoading } = useQuery({
    queryKey: ['admin-parent-search', parentSearch],
    queryFn: () => api.mlm.adminUserSearch(parentSearch),
    enabled: parentSearch.length >= 2,
    staleTime: 10_000,
  });

  // Slot info query for the selected parent
  const { data: slotData, isLoading: slotLoading } = useQuery({
    queryKey: ['admin-slot-info', selectedParent?.id],
    queryFn: () => api.mlm.adminSlotInfo(selectedParent!.id),
    enabled: !!selectedParent,
    staleTime: 5_000,
  });

  const currentSlotOccupied = position === 'left' ? slotData?.left?.occupied : slotData?.right?.occupied;
  const currentSlotOccupant = position === 'left' ? slotData?.left?.occupant : slotData?.right?.occupant;

  const isCurrentMemberPlaced = 'binary_position' in member && !!member.binary_position;

  const reassignMutation = useMutation({
    mutationFn: () =>
      api.mlm.adminReassign({
        user_id: member.id,
        parent_id: selectedParent!.id,
        position,
        mode: currentSlotOccupied ? (mode === 'direct' ? 'spillover' : mode) : 'direct',
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['admin-unplaced'] });
      qc.invalidateQueries({ queryKey: ['mlm-tree'] });
      qc.invalidateQueries({ queryKey: ['mlm-bv-summary'] });
      let msg = '';
      if (res.mode_applied === 'swap' && res.swapped_with) {
        msg = `Swapped positions between ${member.full_name} and ${res.swapped_with.full_name}. BV reconciled for both branches.`;
      } else if (res.spilled_over && res.placed_under) {
        msg = `${member.full_name} reassigned under ${res.placed_under.full_name} (${position} leg via spillover).`;
      } else {
        msg = `${member.full_name} reassigned directly under ${selectedParent!.full_name} (${position} leg).`;
      }
      onReassigned(msg);
    },
    onError: (e: any) => setToast(e?.message ?? 'Reassignment failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-violet-400" />
              Reassign / Move Member: <span className="text-primary">{member.full_name}</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Code: <strong className="font-mono text-foreground">{member.referral_code}</strong> · Safely shifts subtree and updates BV atomically.
            </p>
          </div>
          <button type="button" title="Close" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Placement info */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-1">
          <p className="text-[9px] font-bold text-muted-foreground uppercase">Current Placement Status</p>
          {'binary_parent' in member && member.binary_parent ? (
            <p className="text-xs">
              Placed under <strong className="text-foreground">{member.binary_parent.full_name}</strong> ({member.binary_parent.referral_code}) on the{' '}
              <span className={`font-black uppercase ${member.binary_position === 'left' ? 'text-blue-400' : 'text-orange-400'}`}>
                {member.binary_position}
              </span>{' '}
              side.
            </p>
          ) : (
            <p className="text-xs text-amber-400 font-semibold">Currently Unplaced / Detached (in pool)</p>
          )}
        </div>

        {/* Search New Parent */}
        <div>
          <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1.5">Search & Select New Binary Parent</label>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or referral code…"
              value={parentSearch}
              onChange={e => { setParentSearch(e.target.value); setSelectedParent(null); }}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {parentSearch.length >= 2 && !selectedParent && (
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-border/50 p-1.5 bg-muted/10 mb-2">
              {searchLoading ? (
                <div className="text-center py-3 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
              ) : (parentCandidates?.users ?? []).filter((u: any) => u.id !== member.id).length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-3">No eligible parent members found</p>
              ) : (parentCandidates?.users ?? []).filter((u: any) => u.id !== member.id).map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setSelectedParent(u); setParentSearch(''); }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 text-left transition-all border border-transparent hover:border-border/40"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={u.full_name} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{u.full_name}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">{u.referral_code}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-semibold text-violet-400">Select</span>
                </button>
              ))}
            </div>
          )}

          {selectedParent && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30">
              <div className="flex items-center gap-2.5">
                <Avatar name={selectedParent.full_name} size="sm" />
                <div>
                  <p className="text-xs font-bold text-foreground">{selectedParent.full_name}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{selectedParent.referral_code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParent(null)}
                className="text-[9px] font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted/30"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Position & Slot Preview if parent is chosen */}
        {selectedParent && (
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-muted-foreground uppercase block">Select Leg on New Parent</label>
            <div className="grid grid-cols-2 gap-2">
              {(['left', 'right'] as const).map(pos => {
                const occ = pos === 'left' ? slotData?.left?.occupied : slotData?.right?.occupied;
                const occupant = pos === 'left' ? slotData?.left?.occupant : slotData?.right?.occupant;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPosition(pos)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      position === pos
                        ? pos === 'left'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-orange-500 bg-orange-500/10 text-orange-400'
                        : 'border-border text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{pos === 'left' ? '← Left Leg' : 'Right Leg →'}</span>
                      {slotLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      ) : occ ? (
                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Occupied
                        </span>
                      ) : (
                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Available
                        </span>
                      )}
                    </div>
                    {occupant && (
                      <p className="text-[9px] text-muted-foreground mt-1 truncate">
                        Occupant: <strong className="text-foreground">{occupant.full_name}</strong> ({occupant.referral_code})
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Occupancy Handling options */}
            {currentSlotOccupied && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">
                      The {position.toUpperCase()} slot is currently occupied by {currentSlotOccupant?.full_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Select how to resolve this assignment:</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('spillover')}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      mode === 'spillover'
                        ? 'border-primary bg-primary/10 text-foreground font-bold'
                        : 'border-border text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-primary" /> Spillover
                    </div>
                    <p className="text-[9px] text-muted-foreground font-normal mt-0.5">
                      Place in the next open slot down {selectedParent.full_name}'s {position} leg.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!isCurrentMemberPlaced}
                    onClick={() => setMode('swap')}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      !isCurrentMemberPlaced
                        ? 'opacity-40 cursor-not-allowed border-border text-muted-foreground'
                        : mode === 'swap'
                        ? 'border-violet-500 bg-violet-500/10 text-foreground font-bold'
                        : 'border-border text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-violet-400" /> Swap Nodes
                    </div>
                    <p className="text-[9px] text-muted-foreground font-normal mt-0.5">
                      {isCurrentMemberPlaced
                        ? `Swap positions with ${currentSlotOccupant?.full_name}.`
                        : 'Swap only available for placed members.'}
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {toast && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {toast}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2 border-t border-border/40">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1 h-9 text-xs">Cancel</Button>
          {perm.edit && (
            <Button
              size="sm"
              disabled={!selectedParent || reassignMutation.isPending}
              onClick={() => reassignMutation.mutate()}
              className="flex-1 h-9 text-xs bg-primary text-white"
            >
              {reassignMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />Confirm Reassign</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detach Confirmation Modal ─────────────────────────────────────────────────
interface DetachModalProps {
  member: Member;
  onClose: () => void;
  onDetached: (msg: string) => void;
}

function DetachModal({ member, onClose, onDetached }: DetachModalProps) {
  const perm = useEmployeePermission('admin-mlm');
  const qc = useQueryClient();
  const [detachChildren, setDetachChildren] = useState(false);
  const [toast, setToast] = useState('');

  const detachMutation = useMutation({
    mutationFn: () => api.mlm.adminDetach(member.id, detachChildren),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['admin-unplaced'] });
      qc.invalidateQueries({ queryKey: ['mlm-tree'] });
      qc.invalidateQueries({ queryKey: ['mlm-bv-summary'] });
      onDetached(`${member.full_name} has been safely detached into the Unplaced Pool.`);
    },
    onError: (e: any) => setToast(e?.message ?? 'Detach failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
            <UserMinus className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Detach Member from Hierarchy?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Moving <strong className="text-foreground">{member.full_name}</strong> to the Unplaced & Detached Pool.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-xs space-y-2 text-muted-foreground">
          <p>
            • Their binary subtree BV will be deducted cleanly from their current upline.
          </p>
          <p>
            • The member will sit safely in the <strong>Unplaced Pool</strong> until you reassign them.
          </p>
        </div>

        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/60 hover:bg-muted/15 cursor-pointer transition-colors text-xs">
          <input
            type="checkbox"
            checked={detachChildren}
            onChange={e => setDetachChildren(e.target.checked)}
            className="rounded border-border mt-0.5 text-primary focus:ring-primary"
          />
          <div>
            <span className="font-bold text-foreground">Also detach immediate downline children</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              If checked, direct children will also be detached. If unchecked, their subtree stays intact with them for reassignment.
            </p>
          </div>
        </label>

        {toast && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {toast}
          </p>
        )}

        <div className="flex gap-2 pt-1 border-t border-border/40">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1 h-9 text-xs">Cancel</Button>
          {perm.edit && (
            <Button
              size="sm"
              disabled={detachMutation.isPending}
              onClick={() => detachMutation.mutate()}
              className="flex-1 h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0"
            >
              {detachMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Detach Member'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Team Management Component ──────────────────────────────────────
export default function AdminTeamManagement() {
  const perm = useEmployeePermission('admin-mlm');
  const qc = useQueryClient();

  // Active view tab: 'hierarchy' | 'unplaced'
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'unplaced'>('hierarchy');

  // Root user selector
  const [rootSearch, setRootSearch]       = useState('');
  const [rootInput, setRootInput]         = useState('');
  const [selectedRoot, setSelectedRoot]   = useState<{ id: string; full_name: string; referral_code: string } | null>(null);

  // Member list filter
  const [memberSearch, setMemberSearch]   = useState('');
  const [page, setPage]                   = useState(1);

  // Unplaced pool list filter
  const [unplacedSearch, setUnplacedSearch] = useState('');
  const [unplacedPage, setUnplacedPage]     = useState(1);

  // Modals state
  const [placeParent, setPlaceParent]     = useState<{ id: string; full_name: string } | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Member | UnplacedUser | null>(null);
  const [detachTarget, setDetachTarget]   = useState<Member | null>(null);
  const [autoPlaceConfirm, setAutoPlaceConfirm] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Debounce rootInput -> rootSearch
  useEffect(() => {
    const t = setTimeout(() => setRootSearch(rootInput), 300);
    return () => clearTimeout(t);
  }, [rootInput]);

  // Root user search query
  const { data: rootSearchData, isLoading: rootLoading } = useQuery({
    queryKey: ['admin-root-search', rootSearch],
    queryFn: () => api.mlm.adminUserSearch(rootSearch),
    enabled: rootSearch.length >= 2,
    staleTime: 10_000,
  });

  const rootCandidates = rootSearchData?.users ?? [];

  // Downline members of selected root
  const { data: membersData, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['admin-team', selectedRoot?.id, memberSearch, page],
    queryFn: () => api.mlm.adminMembers(selectedRoot!.id, { search: memberSearch || undefined, page, limit: PAGE_LIMIT }),
    enabled: !!selectedRoot,
    staleTime: 10_000,
  });

  const members   = membersData?.members ?? [];
  const total     = membersData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  // Unplaced pool query
  const { data: unplacedPoolData, isLoading: unplacedPoolLoading, refetch: refetchUnplaced } = useQuery({
    queryKey: ['admin-unplaced-pool', unplacedSearch, unplacedPage],
    queryFn: () => api.mlm.adminUnplaced({ search: unplacedSearch || undefined, page: unplacedPage, limit: PAGE_LIMIT }),
    staleTime: 10_000,
  });

  const unplacedList = unplacedPoolData?.users ?? [];
  const unplacedTotal = unplacedPoolData?.total ?? 0;
  const unplacedTotalPages = Math.ceil(unplacedTotal / PAGE_LIMIT);

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.mlm.updateStatus(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['admin-unplaced-pool'] });
      showToast('success', 'Member status updated.');
    },
    onError: (e: any) => showToast('error', e?.message ?? 'Update failed'),
  });

  // Auto-place unplaced referrals mutation
  const autoPlaceMutation = useMutation({
    mutationFn: () => api.mlm.adminAutoPlace(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-team'] });
      qc.invalidateQueries({ queryKey: ['admin-unplaced'] });
      qc.invalidateQueries({ queryKey: ['admin-unplaced-pool'] });
      qc.invalidateQueries({ queryKey: ['mlm-tree'] });
      setAutoPlaceConfirm(false);
      showToast('success', `Auto-placed ${res.count} referral(s) safely with full BV updates.`);
    },
    onError: (e: any) => showToast('error', e?.message ?? 'Auto-place failed'),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-xs font-bold animate-in slide-in-from-top-2 ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 backdrop-blur-md'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300 backdrop-blur-md'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-primary" />
            Team Management & Hierarchy
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atomic hierarchy mutations, safe member reassignment, slot preview, and unplaced pool management.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-muted/20 border border-border/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('hierarchy')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            Hierarchy Explorer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unplaced')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'unplaced'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Unplaced Pool
            {unplacedTotal > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                activeTab === 'unplaced' ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
              }`}>
                {unplacedTotal}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── TAB 1: HIERARCHY EXPLORER ── */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Root user selector Card */}
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-primary" />
                Select Root Member
              </CardTitle>
              <CardDescription className="text-[10.5px]">
                Search any member by name, email, or referral code to inspect and manage their complete downline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search member by name, email, or referral code…"
                    value={rootInput}
                    onChange={e => {
                      setRootInput(e.target.value);
                      if (selectedRoot) setSelectedRoot(null);
                    }}
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

              {/* Search results dropdown */}
              {rootSearch.length >= 2 && !selectedRoot && (
                <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-border/50 p-2 bg-muted/5">
                  {rootLoading ? (
                    <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" /></div>
                  ) : rootCandidates.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">No matching members found</p>
                  ) : rootCandidates.map((u: any) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setSelectedRoot({ id: u.id, full_name: u.full_name, referral_code: u.referral_code }); setPage(1); }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 text-left transition-all border border-transparent hover:border-border/40"
                    >
                      <Avatar name={u.full_name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-foreground">{u.full_name}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{u.referral_code} · {u.email}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Selected root banner */}
              {selectedRoot && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedRoot.full_name} size="md" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{selectedRoot.full_name}</p>
                      <p className="text-[9.5px] text-muted-foreground font-mono">{selectedRoot.referral_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {perm.edit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPlaceParent({ id: selectedRoot.id, full_name: selectedRoot.full_name })}
                        className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:border-primary/60"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Place Member Under Root
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

          {/* Members Table Card */}
          {selectedRoot ? (
            <Card className="border border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Downline Hierarchy Members
                      <span className="text-[9.5px] text-primary normal-case font-semibold">({total} total members)</span>
                    </CardTitle>
                    <CardDescription className="text-[10.5px] mt-0.5">
                      All recursive binary downline members of <strong className="text-foreground">{selectedRoot.full_name}</strong>
                    </CardDescription>
                  </div>
                  <div className="relative w-52">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter downline…"
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
                    <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading downline members…
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-16 text-xs text-muted-foreground space-y-2">
                    <Users className="w-8 h-8 mx-auto opacity-30" />
                    <p className="font-semibold text-foreground">No downline members found under this root</p>
                    <p className="text-[10px]">Use the "Place Member Under Root" button above to attach members to this hierarchy.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase text-[9px] tracking-wider">
                          <th className="p-3 min-w-[180px]">Member</th>
                          <th className="p-3 min-w-[100px]">Referral Code</th>
                          <th className="p-3 min-w-[90px]">Package</th>
                          <th className="p-3 min-w-[80px]">Leg Position</th>
                          <th className="p-3 min-w-[130px]">Binary Parent</th>
                          <th className="p-3 min-w-[140px] text-right">BV (Left · Right)</th>
                          <th className="p-3 min-w-[80px]">Status</th>
                          <th className="p-3 min-w-[150px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {members.map((m: Member) => (
                          <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                            {/* Member info */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar name={m.full_name} size="sm" />
                                <div className="min-w-0">
                                  <p className="font-bold text-foreground text-[11px] truncate">{m.full_name}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{m.email}</p>
                                </div>
                              </div>
                            </td>

                            {/* Referral code */}
                            <td className="p-3 font-mono text-primary text-[10px] font-bold">{m.referral_code}</td>

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
                                  <p className="text-[10px] font-semibold text-foreground truncate">{m.binary_parent.full_name}</p>
                                  <p className="text-[8.5px] text-muted-foreground font-mono">{m.binary_parent.referral_code}</p>
                                </div>
                              ) : (
                                <span className="text-[9px] text-muted-foreground/40">Root Node</span>
                              )}
                            </td>

                            {/* BV */}
                            <td className="p-3 text-right font-mono">
                              <span className="text-blue-400 text-[10px] font-semibold">{m.left_bv.toLocaleString()}</span>
                              <span className="text-muted-foreground/30 mx-1">·</span>
                              <span className="text-orange-400 text-[10px] font-semibold">{m.right_bv.toLocaleString()}</span>
                            </td>

                            {/* Status */}
                            <td className="p-3">
                              <StatusChip active={m.is_active} />
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-right">
                              {perm.edit ? (
                                <div className="inline-flex items-center gap-1">
                                  {/* Reassign / Move member */}
                                  <button
                                    type="button"
                                    title="Reassign / Move this member in hierarchy"
                                    onClick={() => setReassignTarget(m)}
                                    className="p-1.5 rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-colors"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Place someone under this member */}
                                  <button
                                    type="button"
                                    title="Add member directly under this member"
                                    onClick={() => setPlaceParent({ id: m.id, full_name: m.full_name })}
                                    className="p-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Toggle active */}
                                  <button
                                    type="button"
                                    title={m.is_active ? 'Deactivate Member' : 'Activate Member'}
                                    onClick={() => toggleMutation.mutate({ id: m.id, active: !m.is_active })}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      m.is_active
                                        ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                        : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                    }`}
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Detach member */}
                                  <button
                                    type="button"
                                    title="Detach member into Unplaced Pool"
                                    onClick={() => setDetachTarget(m)}
                                    className="p-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] text-muted-foreground">—</span>
                              )}
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
                      Page {page} of {totalPages} · {total} downline members
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
          ) : (
            <Card className="border border-border/50 bg-card/60 p-8 text-center">
              <GitCommit className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <h3 className="text-sm font-bold text-foreground">Select a root member to explore downline</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Type the name or referral code of any distributor or student in the search box above to inspect and edit their binary tree hierarchy.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB 2: UNPLACED & DETACHED POOL ── */}
      {activeTab === 'unplaced' && (
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Unplaced & Detached Members Pool
                  <span className="text-[9.5px] text-amber-400 normal-case font-semibold">({unplacedTotal} waiting placement)</span>
                </CardTitle>
                <CardDescription className="text-[10.5px] mt-0.5">
                  Members with no active binary parent position. Assign them to any sponsor or downline node.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-52">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search unplaced pool…"
                    value={unplacedSearch}
                    onChange={e => { setUnplacedSearch(e.target.value); setUnplacedPage(1); }}
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-muted/20 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {perm.edit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoPlaceConfirm(true)}
                    className="h-8 text-xs gap-1.5 text-violet-400 border-violet-500/30 hover:border-violet-500/60"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Place Referrals
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => refetchUnplaced()} className="h-8 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {unplacedPoolLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading unplaced pool…
              </div>
            ) : unplacedList.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-foreground space-y-2">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-400/40" />
                <p className="font-semibold text-foreground">All active members are placed in the binary tree!</p>
                <p className="text-[10px]">No members currently waiting in the detached or unplaced pool.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-3 min-w-[180px]">Member</th>
                      <th className="p-3 min-w-[100px]">Referral Code</th>
                      <th className="p-3 min-w-[140px]">Referred By (Sponsor)</th>
                      <th className="p-3 min-w-[110px]">Personal BV</th>
                      <th className="p-3 min-w-[120px]">Subtree Status</th>
                      <th className="p-3 min-w-[80px]">Status</th>
                      <th className="p-3 min-w-[130px] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {unplacedList.map((u: UnplacedUser) => (
                      <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                        {/* Member */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={u.full_name} size="sm" />
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-[11px] truncate">{u.full_name}</p>
                              <p className="text-[9px] text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Referral code */}
                        <td className="p-3 font-mono text-primary text-[10px] font-bold">{u.referral_code}</td>

                        {/* Referred by */}
                        <td className="p-3">
                          {u.referred_by ? (
                            <div>
                              <p className="text-[10px] font-semibold text-foreground truncate">{u.referred_by.full_name}</p>
                              <p className="text-[8.5px] text-muted-foreground font-mono">{u.referred_by.referral_code}</p>
                            </div>
                          ) : (
                            <span className="text-[9px] text-muted-foreground/40">Direct (No sponsor)</span>
                          )}
                        </td>

                        {/* Total BV */}
                        <td className="p-3 font-mono text-foreground font-semibold">
                          {u.total_bv.toLocaleString()} BV
                        </td>

                        {/* Subtree Status */}
                        <td className="p-3">
                          {u.attached_downline_count && u.attached_downline_count > 0 ? (
                            <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                              +{u.attached_downline_count} downlines attached
                            </span>
                          ) : (
                            <span className="text-[8.5px] font-medium text-muted-foreground">Solo member</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <StatusChip active={u.is_active} />
                        </td>

                        {/* Action */}
                        <td className="p-3 text-right">
                          {perm.edit ? (
                            <Button
                              size="sm"
                              onClick={() => setReassignTarget(u)}
                              className="h-7 px-2.5 text-[10.5px] bg-primary text-white gap-1.5"
                            >
                              <UserPlus className="w-3 h-3" /> Place Member
                            </Button>
                          ) : (
                            <span className="text-[9px] text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {unplacedTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/5">
                <span className="text-[10px] text-muted-foreground">
                  Page {unplacedPage} of {unplacedTotalPages} · {unplacedTotal} unplaced members
                </span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={unplacedPage <= 1} onClick={() => setUnplacedPage(p => p - 1)}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={unplacedPage >= unplacedTotalPages} onClick={() => setUnplacedPage(p => p + 1)}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── MODALS ── */}

      {/* Place Modal */}
      {placeParent && (
        <PlaceModal
          parentId={placeParent.id}
          parentName={placeParent.full_name}
          onClose={() => setPlaceParent(null)}
          onPlaced={(msg) => { setPlaceParent(null); refetchMembers(); showToast('success', msg); }}
        />
      )}

      {/* Reassign Modal */}
      {reassignTarget && (
        <ReassignModal
          member={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onReassigned={(msg) => { setReassignTarget(null); refetchMembers(); refetchUnplaced(); showToast('success', msg); }}
        />
      )}

      {/* Detach Modal */}
      {detachTarget && (
        <DetachModal
          member={detachTarget}
          onClose={() => setDetachTarget(null)}
          onDetached={(msg) => { setDetachTarget(null); refetchMembers(); refetchUnplaced(); showToast('success', msg); }}
        />
      )}

      {/* Auto-Place Confirmation Modal */}
      {autoPlaceConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAutoPlaceConfirm(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Auto-Place Unplaced Referrals?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automatically place members with sponsors into open binary tree positions.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This scans the unplaced pool for users registered with a referral code, balances weaker legs, places them under their referrer, and credits subtree BV up the upline hierarchy atomically.
            </p>

            <div className="flex gap-2 pt-1 border-t border-border/40">
              <Button variant="outline" size="sm" onClick={() => setAutoPlaceConfirm(false)} className="flex-1 h-9 text-xs">
                Cancel
              </Button>
              {perm.edit && (
                <Button
                  size="sm"
                  disabled={autoPlaceMutation.isPending}
                  onClick={() => autoPlaceMutation.mutate()}
                  className="flex-1 h-9 text-xs bg-primary text-white"
                >
                  {autoPlaceMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Run Auto-Placement'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
