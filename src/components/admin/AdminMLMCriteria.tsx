import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getStoredToken } from '../../services/api';
import {
  Trophy, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Save,
  AlertCircle, Loader2, CheckCircle2, Users, GitFork, TrendingUp,
  BookOpen, UserPlus, Package, X, ChevronDown, ChevronUp, Info, Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Types ────────────────────────────────────────────────────────────────────
type IncomeSource = {
  id: string; code: string; name: string; description?: string | null;
  category: string;
  rate?: string | null; fixed_amount?: string | null; daily_cap?: string | null;
  generation_level?: number | null;
  min_bv_per_side?: string | null; min_months?: number | null;
  cap_amount?: string | null; cap_period_value?: number | null; cap_period_unit?: string | null;
  is_active: boolean; is_system: boolean; order_index: number;
};

type FormData = {
  code: string; name: string; description: string; category: string;
  rate: string; fixed_amount: string; daily_cap: string;
  generation_level: string; min_bv_per_side: string; min_months: string;
  cap_amount: string; cap_period_value: string; cap_period_unit: string;
  order_index: string;
};

// ── Category metadata ────────────────────────────────────────────────────────
const CAT_META: Record<string, {
  label: string; icon: any; color: string; border: string; bg: string; desc: string;
  fields: { rate: boolean; fixed: boolean; dailyCap: boolean; genLevel: boolean; fundCriteria: boolean };
}> = {
  dsi: {
    label: 'Direct Sponsor Income', icon: Users,
    color: 'text-violet-500', border: 'border-violet-500/25', bg: 'bg-violet-500/10',
    desc: 'Paid to the direct referrer when their referral makes a first purchase',
    fields: { rate: true, fixed: false, dailyCap: false, genLevel: false, fundCriteria: false },
  },
  generational: {
    label: 'Generational Income', icon: GitFork,
    color: 'text-indigo-500', border: 'border-indigo-500/25', bg: 'bg-indigo-500/10',
    desc: '% of DSI paid N levels up the referral chain on first purchase',
    fields: { rate: true, fixed: false, dailyCap: false, genLevel: true, fundCriteria: false },
  },
  binary: {
    label: 'Binary Matching Bonus', icon: TrendingUp,
    color: 'text-emerald-500', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10',
    desc: 'Daily bonus on matched BV between left & right binary legs',
    fields: { rate: true, fixed: false, dailyCap: true, genLevel: false, fundCriteria: false },
  },
  milestone: {
    label: 'Milestone / Fund', icon: Trophy,
    color: 'text-orange-500', border: 'border-orange-500/25', bg: 'bg-orange-500/10',
    desc: 'Monthly reward for sustaining a BV threshold on both binary legs',
    fields: { rate: true, fixed: true, dailyCap: false, genLevel: false, fundCriteria: true },
  },
  course: {
    label: 'Course Income', icon: BookOpen,
    color: 'text-blue-500', border: 'border-blue-500/25', bg: 'bg-blue-500/10',
    desc: 'Platform or instructor share on course purchases',
    fields: { rate: true, fixed: true, dailyCap: false, genLevel: false, fundCriteria: false },
  },
  referral: {
    label: 'Referral Bonus', icon: UserPlus,
    color: 'text-cyan-500', border: 'border-cyan-500/25', bg: 'bg-cyan-500/10',
    desc: 'Flat or percentage bonus for bringing new members',
    fields: { rate: true, fixed: true, dailyCap: false, genLevel: false, fundCriteria: false },
  },
  royalty: {
    label: 'Royalty Income', icon: Crown,
    color: 'text-pink-500', border: 'border-pink-500/25', bg: 'bg-pink-500/10',
    desc: '2% of company monthly BV pool — distributed to qualified top-tier distributors',
    fields: { rate: true, fixed: false, dailyCap: false, genLevel: false, fundCriteria: true },
  },
};

const CATEGORIES = Object.keys(CAT_META);

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function pct(v: string | null | undefined) { return parseFloat(v ?? '0') || 0; }
function money(v: string | null | undefined) { return parseFloat(v ?? '0') || 0; }

const EMPTY: FormData = {
  code: '', name: '', description: '', category: 'generational',
  rate: '', fixed_amount: '', daily_cap: '',
  generation_level: '', min_bv_per_side: '', min_months: '',
  cap_amount: '', cap_period_value: '', cap_period_unit: 'month',
  order_index: '',
};

function toForm(src: IncomeSource): FormData {
  return {
    code:             src.code,
    name:             src.name,
    description:      src.description      ?? '',
    category:         src.category,
    rate:             src.rate             != null ? String(+src.rate)             : '',
    fixed_amount:     src.fixed_amount     != null ? String(+src.fixed_amount)     : '',
    daily_cap:        src.daily_cap        != null ? String(+src.daily_cap)        : '',
    generation_level: src.generation_level != null ? String(src.generation_level)  : '',
    min_bv_per_side:  src.min_bv_per_side  != null ? String(+src.min_bv_per_side)  : '',
    min_months:       src.min_months       != null ? String(src.min_months)         : '',
    cap_amount:       src.cap_amount       != null ? String(+src.cap_amount)        : '',
    cap_period_value: src.cap_period_value != null ? String(src.cap_period_value)   : '',
    cap_period_unit:  src.cap_period_unit  ?? 'month',
    order_index:      String(src.order_index),
  };
}

function toPayload(form: FormData, isNew: boolean) {
  const p: any = {
    name:             form.name.trim(),
    description:      form.description.trim() || null,
    category:         form.category,
    rate:             form.rate             ? parseFloat(form.rate)             : null,
    fixed_amount:     form.fixed_amount     ? parseFloat(form.fixed_amount)     : null,
    daily_cap:        form.daily_cap        ? parseFloat(form.daily_cap)        : null,
    generation_level: form.generation_level ? parseInt(form.generation_level)   : null,
    min_bv_per_side:  form.min_bv_per_side  ? parseFloat(form.min_bv_per_side)  : null,
    min_months:       form.min_months       ? parseInt(form.min_months)          : null,
    cap_amount:       form.cap_amount       ? parseFloat(form.cap_amount)        : null,
    cap_period_value: form.cap_period_value ? parseInt(form.cap_period_value)    : null,
    cap_period_unit:  form.cap_period_value ? (form.cap_period_unit || 'month')  : null,
    order_index:      form.order_index      ? parseInt(form.order_index)         : 0,
  };
  if (isNew) p.code = form.code.trim().toLowerCase().replace(/\s+/g, '_');
  return p;
}

// ── Preview box ───────────────────────────────────────────────────────────────
function Preview({ src, dsiRate }: { src: IncomeSource; dsiRate: number }) {
  const meta = CAT_META[src.category];
  if (!meta) return null;

  const rate      = pct(src.rate);
  const fixed     = money(src.fixed_amount);
  const dailyCap  = money(src.daily_cap);
  const minBv     = money(src.min_bv_per_side);
  const months    = src.min_months ?? 3;
  const level     = src.generation_level ?? 2;

  // ── DSI preview ────────────────────────────────────────────────────────────
  if (src.category === 'dsi') {
    const samples = [6000, 12000, 48000];
    return (
      <div className={`p-3 rounded-xl border text-[11px] space-y-2 ${meta.border} ${meta.bg}`}>
        <p className={`text-[9px] font-bold uppercase ${meta.color}`}>Preview — DSI on BV purchase</p>
        <div className="space-y-1">
          {samples.map(bv => (
            <div key={bv} className="flex justify-between text-muted-foreground">
              <span>{fmt(bv)} BV purchase</span>
              <span className={`font-mono font-semibold ${meta.color}`}>
                → +{fmt(bv * rate / 100)} DSI ({rate}%)
              </span>
            </div>
          ))}
        </div>
        <div className={`pt-1.5 border-t ${meta.border} text-[10px] text-muted-foreground flex items-start gap-1`}>
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Per-package DSI reward (set in Package Management) takes priority. This rate is used as a fallback when per-package reward is ₹0.</span>
        </div>
      </div>
    );
  }

  // ── Generational income preview ─────────────────────────────────────────────
  if (src.category === 'generational') {
    // Scenario A: large BV purchase
    const bvA    = 48000;
    const dsiA   = bvA * dsiRate / 100;
    const genA   = dsiA * rate / 100;
    // Scenario B: referral brings 2 × ₹6,000 BV students
    const bvB    = 6000;
    const qty    = 2;
    const dsiB   = bvB * qty * dsiRate / 100;
    const genB   = dsiB * rate / 100;

    return (
      <div className={`p-3 rounded-xl border text-[11px] space-y-3 ${meta.border} ${meta.bg}`}>
        <p className={`text-[9px] font-bold uppercase ${meta.color}`}>
          Level {level} income examples (DSI rate = {dsiRate}%)
        </p>

        {/* Scenario A */}
        <div className="space-y-1">
          <p className="font-semibold text-foreground text-[10px]">Scenario A — someone generates {fmt(bvA)} BV</p>
          <div className="flex justify-between text-muted-foreground">
            <span>Their DSI ({dsiRate}% of {fmt(bvA)} BV)</span>
            <span className="font-mono">{fmt(dsiA)}</span>
          </div>
          <div className={`flex justify-between font-semibold ${meta.color}`}>
            <span>Your L{level} income ({rate}% of DSI)</span>
            <span className="font-mono">+{fmt(genA)}</span>
          </div>
        </div>

        {/* Scenario B */}
        <div className={`space-y-1 pt-2 border-t ${meta.border}`}>
          <p className="font-semibold text-foreground text-[10px]">Scenario B — they refer {qty} × {fmt(bvB)} BV students</p>
          <div className="flex justify-between text-muted-foreground">
            <span>Their DSI: {fmt(bvB)} × {qty} × {dsiRate}%</span>
            <span className="font-mono">{fmt(dsiB)}</span>
          </div>
          <div className={`flex justify-between font-semibold ${meta.color}`}>
            <span>Your L{level} income ({rate}%)</span>
            <span className="font-mono">+{fmt(genB)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Binary matching preview ────────────────────────────────────────────────
  if (src.category === 'binary') {
    const matchedBv = 1000;
    const bonus     = matchedBv * rate / 100;
    return (
      <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${meta.border} ${meta.bg}`}>
        <p className={`text-[9px] font-bold uppercase ${meta.color}`}>Preview — per ₹1,000 matched BV</p>
        <div className="flex justify-between text-muted-foreground">
          <span>Matched BV (weaker leg)</span>
          <span className="font-mono font-semibold text-foreground">{fmt(matchedBv)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Matching bonus ({rate}%)</span>
          <span className={`font-mono font-semibold ${meta.color}`}>+{fmt(bonus)}</span>
        </div>
        {dailyCap > 0 && (
          <div className={`flex justify-between pt-1 border-t ${meta.border} text-muted-foreground`}>
            <span>Maximum per user per day</span>
            <span className={`font-mono font-semibold ${meta.color}`}>{fmt(dailyCap)}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Milestone / Fund preview ───────────────────────────────────────────────
  if (src.category === 'milestone') {
    const reward     = fixed > 0 ? fixed : (minBv > 0 ? minBv * 2 * rate / 100 : 0);
    const capAmt     = money(src.cap_amount);
    const capPeriodV = src.cap_period_value ?? 1;
    const capUnit    = src.cap_period_unit ?? 'month';
    const capLabel   = `${capPeriodV} ${capUnit}${capPeriodV > 1 ? 's' : ''}`;
    return (
      <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${meta.border} ${meta.bg}`}>
        <p className={`text-[9px] font-bold uppercase ${meta.color}`}>Eligibility & Reward Preview</p>
        {minBv > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Min BV required (each side)</span>
            <span className="font-mono font-semibold text-foreground">{fmt(minBv)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Must maintain continuously for</span>
          <span className="font-mono font-semibold text-foreground">{months} months</span>
        </div>
        {(rate > 0 || fixed > 0) && (
          <div className={`flex justify-between pt-1.5 border-t ${meta.border}`}>
            <span className="text-muted-foreground">
              {fixed > 0 ? 'Fixed monthly reward' : `Monthly reward (${rate}% of ${minBv > 0 ? `${fmt(minBv * 2)} total BV` : 'BV'})`}
            </span>
            <span className={`font-mono font-semibold ${meta.color}`}>+{fmt(reward)}/month</span>
          </div>
        )}
        {capAmt > 0 && (
          <div className={`flex justify-between pt-1 border-t ${meta.border} text-muted-foreground`}>
            <span>Maximum payout per {capLabel}</span>
            <span className={`font-mono font-semibold ${meta.color}`}>{fmt(capAmt)}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Royalty income preview ─────────────────────────────────────────────────
  if (src.category === 'royalty') {
    const poolPct  = rate > 0 ? rate : 2;
    const minBvL   = minBv / 100000; // convert to lakhs

    // Example company BV scenarios
    const scenarios = [
      { label: '50 Lakh',  bv: 5_000_000 },
      { label: '1 Crore',  bv: 10_000_000 },
      { label: '5 Crore',  bv: 50_000_000 },
    ];

    return (
      <div className={`p-3 rounded-xl border text-[11px] space-y-3 ${meta.border} ${meta.bg}`}>
        <p className={`text-[9px] font-bold uppercase ${meta.color}`}>Royalty Pool Preview ({poolPct}% of Company Monthly BV)</p>

        {/* Qualification bar */}
        <div className={`flex items-start gap-2 p-2 rounded-lg border ${meta.border} bg-card/50`}>
          <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${meta.color}`} />
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">Qualification — in a single calendar month:</p>
            <p className="text-muted-foreground">
              LEFT binary leg BV ≥ {fmt(minBv)} && RIGHT binary leg BV ≥ {fmt(minBv)}
              {minBvL >= 100 ? ` (${(minBvL / 100).toFixed(0)} Crore each side)` : ` (${minBvL.toFixed(0)} Lakh each side)`}
            </p>
          </div>
        </div>

        {/* Pool size by company BV */}
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-muted-foreground uppercase">Pool size by company monthly turnover</p>
          {scenarios.map(sc => {
            const pool = sc.bv * poolPct / 100;
            return (
              <div key={sc.label} className="flex justify-between text-muted-foreground">
                <span>Company BV = {sc.label}</span>
                <span className={`font-mono font-semibold ${meta.color}`}>Pool → {fmt(pool)}</span>
              </div>
            );
          })}
        </div>

        {/* Distribution formula */}
        <div className={`pt-2 border-t ${meta.border} space-y-1.5`}>
          <p className="text-[9px] font-bold text-muted-foreground uppercase">Your share formula</p>
          <p className="text-muted-foreground">
            Your Royalty = <span className="font-mono text-foreground">Pool × (Your Total BV ÷ Sum of All Qualified Members' Total BV)</span>
          </p>
          {/* Example: 1Cr company BV, 5 equal-share qualified members */}
          {(() => {
            const exPool      = 10_000_000 * poolPct / 100;
            const exQualified = 5;
            const exShare     = exPool / exQualified;
            return (
              <div className={`p-2 rounded-lg border ${meta.border} bg-card/50 space-y-0.5`}>
                <p className="font-semibold text-foreground">Example: Company BV = 1 Crore, {exQualified} qualified members with equal BV</p>
                <div className="flex justify-between text-muted-foreground">
                  <span>Pool ({poolPct}% of 1 Cr)</span>
                  <span className="font-mono">{fmt(exPool)}</span>
                </div>
                <div className={`flex justify-between font-semibold ${meta.color}`}>
                  <span>Your royalty (1 of {exQualified} equal shares)</span>
                  <span className="font-mono">+{fmt(exShare)}/month</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── Course / Referral preview ──────────────────────────────────────────────
  if (src.category === 'course' || src.category === 'referral') {
    const samples = [1000, 5000, 10000];
    return (
      <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${meta.border} ${meta.bg}`}>
        <p className={`text-[9px] font-bold uppercase ${meta.color}`}>
          {src.category === 'course' ? 'On course purchase' : 'Per referral'}
        </p>
        {fixed > 0 ? (
          <div className="flex justify-between text-muted-foreground">
            <span>Fixed reward</span>
            <span className={`font-mono font-semibold ${meta.color}`}>+{fmt(fixed)}</span>
          </div>
        ) : (
          samples.map(s => (
            <div key={s} className="flex justify-between text-muted-foreground">
              <span>{fmt(s)}</span>
              <span className={`font-mono font-semibold ${meta.color}`}>+{fmt(s * rate / 100)}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  return null;
}

// ── Value chips ───────────────────────────────────────────────────────────────
function ValueChips({ src }: { src: IncomeSource }) {
  const meta  = CAT_META[src.category];
  const color = meta?.color ?? 'text-muted-foreground';
  const chips: string[] = [];

  if (src.rate             && +src.rate > 0)            chips.push(`${+src.rate}% rate`);
  if (src.fixed_amount     && +src.fixed_amount > 0)    chips.push(`₹${(+src.fixed_amount).toLocaleString('en-IN')} fixed`);
  if (src.daily_cap        && +src.daily_cap > 0)       chips.push(`₹${(+src.daily_cap).toLocaleString('en-IN')}/day cap`);
  if (src.generation_level)                              chips.push(`Level ${src.generation_level}`);
  if (src.min_bv_per_side && +src.min_bv_per_side > 0) {
    const bv = +src.min_bv_per_side;
    const label = bv >= 100000 ? `₹${(bv / 100000).toFixed(0)}L BV/side` : `₹${(bv / 1000).toFixed(0)}k BV/side`;
    chips.push(label);
  }
  if (src.min_months)                                    chips.push(`${src.min_months} months`);
  if (src.cap_amount && +src.cap_amount > 0) {
    const period = src.cap_period_value
      ? `${src.cap_period_value} ${src.cap_period_unit ?? 'month'}${src.cap_period_value > 1 ? 's' : ''}`
      : src.cap_period_unit ?? 'month';
    chips.push(`₹${(+src.cap_amount).toLocaleString('en-IN')} cap/${period}`);
  }

  if (chips.length === 0) return <span className="text-[10px] text-muted-foreground italic">No rates set</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {chips.map(c => (
        <span key={c} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta?.border ?? ''} ${meta?.bg ?? ''} ${color}`}>
          {c}
        </span>
      ))}
    </div>
  );
}

// ── Inline form ───────────────────────────────────────────────────────────────
function IncentiveForm({
  initial, onSave, onCancel, saving, saveError,
}: {
  initial?: IncomeSource; onSave: (d: any) => void;
  onCancel: () => void; saving: boolean; saveError?: string;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<FormData>(initial ? toForm(initial) : EMPTY);
  const set    = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));
  const fields = CAT_META[form.category]?.fields ?? { rate: true, fixed: true, dailyCap: false, genLevel: false, fundCriteria: false };

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(toPayload(form, !isEdit)); }} className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

        {!isEdit && (
          <div className="space-y-1">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground">Code *</Label>
            <Input required value={form.code} onChange={e => set('code', e.target.value)}
              placeholder="e.g. gen4" className="h-8 text-xs bg-muted/20 font-mono" />
            <p className="text-[9px] text-muted-foreground">Unique permanent ID</p>
          </div>
        )}

        <div className={`space-y-1 ${!isEdit ? '' : 'col-span-2'}`}>
          <Label className="text-[9px] font-bold uppercase text-muted-foreground">Name *</Label>
          <Input required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. 4th Generation Income" className="h-8 text-xs bg-muted/20" />
        </div>

        <div className="space-y-1">
          <Label className="text-[9px] font-bold uppercase text-muted-foreground">Category *</Label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
          </select>
        </div>

        {fields.rate && (
          <div className="space-y-1">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground">
              Rate (%)
              {form.category === 'generational' && <span className="font-normal ml-1">of DSI</span>}
              {form.category === 'binary'        && <span className="font-normal ml-1">of matched BV</span>}
              {form.category === 'dsi'           && <span className="font-normal ml-1">of BV</span>}
            </Label>
            <Input type="number" min={0} max={100} step="0.01"
              value={form.rate} onChange={e => set('rate', e.target.value)}
              placeholder="e.g. 25" className="h-8 text-xs bg-muted/20 font-mono" />
          </div>
        )}

        {fields.fixed && (
          <div className="space-y-1">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground">Fixed Amt (₹) <span className="font-normal">overrides %</span></Label>
            <Input type="number" min={0} step="0.01"
              value={form.fixed_amount} onChange={e => set('fixed_amount', e.target.value)}
              placeholder="0.00" className="h-8 text-xs bg-muted/20 font-mono" />
          </div>
        )}

        {fields.dailyCap && (
          <div className="space-y-1">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground">Daily Cap (₹)</Label>
            <Input type="number" min={0} step="100"
              value={form.daily_cap} onChange={e => set('daily_cap', e.target.value)}
              placeholder="e.g. 10000" className="h-8 text-xs bg-muted/20 font-mono" />
          </div>
        )}

        {fields.genLevel && (
          <div className="space-y-1">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground">Gen Level *</Label>
            <Input type="number" min={1} max={20} required={fields.genLevel}
              value={form.generation_level} onChange={e => set('generation_level', e.target.value)}
              placeholder="2 = gen2, 3 = gen3…" className="h-8 text-xs bg-muted/20 font-mono" />
            <p className="text-[9px] text-muted-foreground">Hops from buyer up chain</p>
          </div>
        )}

        {fields.fundCriteria && (
          <>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase text-muted-foreground">Min BV / Side (₹)</Label>
              <Input type="number" min={0} step="1000"
                value={form.min_bv_per_side} onChange={e => set('min_bv_per_side', e.target.value)}
                placeholder="e.g. 50000" className="h-8 text-xs bg-muted/20 font-mono" />
              <p className="text-[9px] text-muted-foreground">Required on both L & R legs</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase text-muted-foreground">Min Months</Label>
              <Input type="number" min={1} max={24}
                value={form.min_months} onChange={e => set('min_months', e.target.value)}
                placeholder="e.g. 3" className="h-8 text-xs bg-muted/20 font-mono" />
              <p className="text-[9px] text-muted-foreground">Consecutive months to qualify</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-bold uppercase text-muted-foreground">Payout Cap (₹)</Label>
              <Input type="number" min={0} step="100"
                value={form.cap_amount} onChange={e => set('cap_amount', e.target.value)}
                placeholder="e.g. 5000" className="h-8 text-xs bg-muted/20 font-mono" />
              <p className="text-[9px] text-muted-foreground">Max payout per cap period (leave blank = unlimited)</p>
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-[9px] font-bold uppercase text-muted-foreground">Cap Period</Label>
              <div className="flex gap-1.5">
                <Input type="number" min={1} step="1"
                  value={form.cap_period_value} onChange={e => set('cap_period_value', e.target.value)}
                  placeholder="e.g. 1" className="h-8 text-xs bg-muted/20 font-mono w-20 shrink-0" />
                <select value={form.cap_period_unit} onChange={e => set('cap_period_unit', e.target.value)}
                  className="flex-1 h-8 px-2 rounded-md border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="day">Day(s)</option>
                  <option value="month">Month(s)</option>
                </select>
              </div>
              <p className="text-[9px] text-muted-foreground">Duration unit for the cap above</p>
            </div>
          </>
        )}

        <div className="space-y-1">
          <Label className="text-[9px] font-bold uppercase text-muted-foreground">Display Order</Label>
          <Input type="number" min={0}
            value={form.order_index} onChange={e => set('order_index', e.target.value)}
            placeholder="0" className="h-8 text-xs bg-muted/20 font-mono" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[9px] font-bold uppercase text-muted-foreground">Description</Label>
        <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Optional — when/how this income is paid"
          className="w-full px-3 py-2 rounded-md border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
      </div>

      {saveError && (
        <p className="text-xs text-rose-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />{saveError}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving}
          className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-bold px-5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          {isEdit ? 'Save Changes' : 'Create Incentive'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-8 text-xs px-4">Cancel</Button>
      </div>
    </form>
  );
}

// ── Single incentive card ─────────────────────────────────────────────────────
function IncentiveCard({
  src, dsiRate, onToggle, onDelete, onSave,
  togglingId, deletingId, savingId,
}: {
  src: IncomeSource; dsiRate: number;
  onToggle: (s: IncomeSource) => void;
  onDelete: (s: IncomeSource) => void;
  onSave: (id: string, data: any) => void;
  togglingId: string | null; deletingId: string | null; savingId: string | null;
}) {
  const [editing,    setEditing]    = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [saveError,  setSaveError]  = useState('');
  const [saved,      setSaved]      = useState(false);
  const meta = CAT_META[src.category] ?? CAT_META['referral'];
  const Icon = meta.icon;

  return (
    <div className={`rounded-xl border transition-all ${
      src.is_active ? `bg-card ${meta.border}` : 'bg-muted/10 border-border/40 opacity-60'
    }`}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-3">
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${meta.bg} ${meta.border}`}>
          <Icon className={`w-4 h-4 ${meta.color}`} />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground">{src.name}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/40 border border-border/50 text-muted-foreground">{src.code}</span>
            {src.generation_level && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.border} ${meta.bg} ${meta.color}`}>
                L{src.generation_level}
              </span>
            )}
            {src.is_system && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/50 border border-border text-muted-foreground">System</span>
            )}
            {!src.is_active && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-500">Disabled</span>
            )}
            {saved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </div>
          <ValueChips src={src} />
          {src.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">{src.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" title={src.is_active ? 'Disable' : 'Enable'}
            onClick={() => onToggle(src)} disabled={togglingId === src.id}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            {togglingId === src.id
              ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              : src.is_active
                ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                : <ToggleLeft  className="w-5 h-5 text-muted-foreground" />}
          </button>

          <button type="button" title={editing ? 'Close' : 'Edit'}
            onClick={() => { setEditing(e => !e); setSaveError(''); setSaved(false); }}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
            {editing
              ? <X     className="w-3.5 h-3.5 text-muted-foreground" />
              : <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>

          {!src.is_system ? (
            <button type="button" title="Delete"
              onClick={() => setConfirmDel(true)} disabled={deletingId === src.id}
              className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors">
              {deletingId === src.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                : <Trash2  className="w-3.5 h-3.5 text-rose-500" />}
            </button>
          ) : (
            <div className="w-7" />
          )}
        </div>
      </div>

      {/* Preview (shown when not editing) */}
      {!editing && (
        <div className="px-3 pb-3">
          <Preview src={src} dsiRate={dsiRate} />
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="px-3 pb-3 border-t border-border/40 pt-3">
          <IncentiveForm
            initial={src}
            onSave={data => {
              setSaveError('');
              const { _onSuccess, _onError, ...payload } = data as any;
              onSave(src.id, {
                ...payload,
                onSuccess: () => { setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 2500); },
                onError:   (e: string) => setSaveError(e),
              });
            }}
            onCancel={() => { setEditing(false); setSaveError(''); }}
            saving={savingId === src.id}
            saveError={saveError}
          />
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className="px-3 pb-3 border-t border-rose-500/20 pt-3 flex items-center justify-between gap-3 bg-rose-500/5 rounded-b-xl">
          <p className="text-xs text-rose-500 font-semibold">Delete "{src.name}"?</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDel(false)} className="h-7 text-xs px-3">Cancel</Button>
            <Button size="sm"
              onClick={() => { onDelete(src); setConfirmDel(false); }}
              className="h-7 text-xs bg-rose-500 hover:bg-rose-600 text-white px-3">Delete</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category section ──────────────────────────────────────────────────────────
function CategorySection({
  category, sources, dsiRate, onToggle, onDelete, onSave,
  togglingId, deletingId, savingId,
}: {
  category: string; sources: IncomeSource[]; dsiRate: number;
  onToggle: (s: IncomeSource) => void;
  onDelete: (s: IncomeSource) => void;
  onSave: (id: string, data: any) => void;
  togglingId: string | null; deletingId: string | null; savingId: string | null;
}) {
  const [open, setOpen] = useState(true);
  const meta   = CAT_META[category] ?? CAT_META['referral'];
  const Icon   = meta.icon;
  const active = sources.filter(s => s.is_active).length;

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-1.5 px-1">
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${meta.color}`} />
          <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{meta.desc}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${meta.border} ${meta.bg} ${meta.color}`}>
            {active}/{sources.length} active
          </span>
          {open
            ? <ChevronUp   className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="space-y-2 pl-1">
          {sources.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-3 text-center">
              No {meta.label} incentives yet. Use "Add Incentive" to create one.
            </p>
          ) : (
            sources.map(src => (
              <IncentiveCard
                key={src.id} src={src} dsiRate={dsiRate}
                onToggle={onToggle} onDelete={onDelete} onSave={onSave}
                togglingId={togglingId} deletingId={deletingId} savingId={savingId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Product BV Rate (platform setting) ───────────────────────────────────────
function ProductBvCard() {
  const qc = useQueryClient();
  const [rate, setRate] = useState('10');
  const [saved, setSaved] = useState(false);
  const [err,   setErr]   = useState('');

  const { data } = useQuery<{ map: Record<string, string> }>({
    queryKey: ['platform-settings'],
    queryFn:  () => api.platformSettings.get(),
    enabled:  !!getStoredToken(),
  });

  if (data?.map?.product_bv_rate && !saved) setRate(data.map.product_bv_rate);

  const saveMut = useMutation({
    mutationFn: () => api.platformSettings.updateKey('product_bv_rate', rate),
    onSuccess: () => {
      setSaved(true); setErr('');
      qc.invalidateQueries({ queryKey: ['platform-settings'] });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e: any) => setErr(e?.message ?? 'Failed'),
  });

  const rateN = parseFloat(rate) || 0;
  const samples = [1000, 4999, 9999, 14999];

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border/40 pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Package className="w-4 h-4 text-violet-500" />
          Product BV Rate
          <span className="text-[9px] font-normal text-muted-foreground ml-1 bg-muted/50 px-1.5 py-0.5 rounded border border-border">Platform Setting</span>
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Default Business Volume assigned as a % of product price. Auto-fills the BV field in Product Management. Can be overridden per product.
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="max-w-xs space-y-1.5">
          <Label className="text-[9px] font-bold uppercase text-muted-foreground">BV Rate (% of product price)</Label>
          <Input type="number" min={0} max={100} step="0.01"
            value={rate} onChange={e => setRate(e.target.value)}
            className="h-9 text-xs bg-muted/20 font-mono" placeholder="e.g. 10" />
        </div>

        <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-[11px] space-y-1">
          <p className="text-[9px] font-bold uppercase text-violet-500 mb-1">Preview</p>
          {samples.map(p => (
            <div key={p} className="flex justify-between text-muted-foreground">
              <span>₹{p.toLocaleString('en-IN')} product</span>
              <span className="font-mono text-violet-500 font-semibold">
                → {Math.round(p * rateN / 100).toLocaleString('en-IN')} BV
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button disabled={saveMut.isPending} onClick={() => { setErr(''); saveMut.mutate(); }}
            className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-4">
            {saveMut.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            Save BV Rate
          </Button>
          {saved && <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Saved!</span>}
          {err   && <span className="text-xs text-rose-500">{err}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminMLMCriteria() {
  const qc = useQueryClient();
  const [showAdd,    setShowAdd]    = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId,   setSavingId]   = useState<string | null>(null);
  const [addError,   setAddError]   = useState('');

  const { data: sources = [], isLoading, isError } = useQuery<IncomeSource[]>({
    queryKey: ['income-sources'],
    queryFn:  () => api.incomeSources.list(),
    staleTime: 30_000,
  });

  // Global DSI rate — used in generational income preview calculations
  const dsiSrc  = sources.find(s => s.code === 'dsi');
  const dsiRate = dsiSrc?.rate ? parseFloat(String(dsiSrc.rate)) : 25;

  const invalidate = () => qc.invalidateQueries({ queryKey: ['income-sources'] });

  const createMut = useMutation({
    mutationFn: (data: any) => api.incomeSources.create(data),
    onSuccess: () => { invalidate(); setShowAdd(false); setAddError(''); },
    onError:   (e: any) => setAddError(e?.message ?? 'Failed to create'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.incomeSources.update(id, data),
    onSuccess: (_, vars) => {
      invalidate();
      const d = vars.data as any;
      d?.onSuccess?.();
      setSavingId(null); setTogglingId(null);
    },
    onError: (e: any, vars) => {
      const d = vars.data as any;
      d?.onError?.(e?.message ?? 'Failed to save');
      setSavingId(null); setTogglingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.incomeSources.remove(id),
    onSuccess: () => { invalidate(); setDeletingId(null); },
    onError:   () => setDeletingId(null),
  });

  function handleToggle(src: IncomeSource) {
    setTogglingId(src.id);
    updateMut.mutate({ id: src.id, data: { is_active: !src.is_active } });
  }

  function handleDelete(src: IncomeSource) {
    setDeletingId(src.id);
    deleteMut.mutate(src.id);
  }

  function handleSave(id: string, data: any) {
    setSavingId(id);
    updateMut.mutate({ id, data });
  }

  // Group sources by category, sorted by order_index then generation_level
  const grouped = CATEGORIES.reduce<Record<string, IncomeSource[]>>((acc, cat) => {
    acc[cat] = sources
      .filter(s => s.category === cat)
      .sort((a, b) => a.order_index - b.order_index || (a.generation_level ?? 0) - (b.generation_level ?? 0));
    return acc;
  }, {});
  const extraCats = [...new Set(sources.filter(s => !CATEGORIES.includes(s.category)).map(s => s.category))];
  extraCats.forEach(cat => { grouped[cat] = sources.filter(s => s.category === cat); });
  const allCategories = [...CATEGORIES, ...extraCats];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Incentive Criteria
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure all commission rates, generation levels, fund thresholds, and bonuses.
            All changes apply to new purchases and matching runs immediately.
          </p>
        </div>
        <Button onClick={() => { setShowAdd(s => !s); setAddError(''); }}
          className="h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 gap-1.5">
          {showAdd
            ? <><X    className="w-3.5 h-3.5" />Cancel</>
            : <><Plus className="w-3.5 h-3.5" />Add Incentive</>}
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="border border-amber-500/30 bg-card">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              New Incentive Criteria
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Add any income type — a new generation level (gen4, gen5…), a new fund, referral bonus, etc.
              Set the category to control which fields and calculations apply.
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <IncentiveForm
              onSave={data => createMut.mutate(data)}
              onCancel={() => { setShowAdd(false); setAddError(''); }}
              saving={createMut.isPending}
              saveError={addError}
            />
          </CardContent>
        </Card>
      )}

      {/* Income source sections */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />Loading incentive criteria…
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 gap-2 text-sm text-rose-500">
          <AlertCircle className="w-5 h-5" />Failed to load. Check server connection.
        </div>
      ) : (
        <div className="space-y-6">
          {allCategories.map(cat => {
            const srcs = grouped[cat] ?? [];
            // Always show categories that have sources OR are core categories
            if (srcs.length === 0 && !['dsi', 'generational', 'binary', 'milestone', 'royalty'].includes(cat)) return null;
            return (
              <CategorySection
                key={cat} category={cat} sources={srcs} dsiRate={dsiRate}
                onToggle={handleToggle} onDelete={handleDelete} onSave={handleSave}
                togglingId={togglingId} deletingId={deletingId} savingId={savingId}
              />
            );
          })}
        </div>
      )}

      {/* Product BV Rate */}
      <div className="border-t border-border/40 pt-6">
        <ProductBvCard />
      </div>

    </div>
  );
}
