import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getMediaUrl } from '../../services/api';
import { useEmployeePermission } from '../../hooks/useEmployeePermission';
import {
  ShoppingBag, Loader2, AlertCircle, CheckCircle2, Truck,
  XCircle, Clock, Search, ChevronDown, MessageSquare, Package,
  User, Phone, MapPin, Calendar, Hash
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaginationFooter } from '@/components/ui/pagination-footer';

const PAGE_LIMIT = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────
type OrderStatus = 'pending' | 'approved' | 'dispatched' | 'cancelled';

const STATUS_META: Record<OrderStatus, { label: string; icon: any; cls: string; bg: string }> = {
  pending:    { label: 'Pending',    icon: Clock,         cls: 'text-amber-500',  bg: 'bg-amber-500/10 border-amber-500/20' },
  approved:   { label: 'Approved',   icon: CheckCircle2,  cls: 'text-blue-500',   bg: 'bg-blue-500/10 border-blue-500/20' },
  dispatched: { label: 'Dispatched', icon: Truck,         cls: 'text-emerald-500',bg: 'bg-emerald-500/10 border-emerald-500/20' },
  cancelled:  { label: 'Cancelled',  icon: XCircle,       cls: 'text-red-500',    bg: 'bg-red-500/10 border-red-500/20' },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status as OrderStatus] ?? STATUS_META.pending;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${m.bg} ${m.cls}`}>
      <Icon className="w-2.5 h-2.5" />{m.label}
    </span>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const perm = useEmployeePermission('admin-orders');
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ orders: any[]; total: number }>({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => api.orders.adminList(statusFilter, page, PAGE_LIMIT),
  });

  const orders = data?.orders ?? [];
  const totalOrders = data?.total ?? 0;

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.orders.updateStatus(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.user?.full_name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.product?.name?.toLowerCase().includes(q) ||
      o.product?.sku?.toLowerCase().includes(q) ||
      o.shipping_phone?.includes(q)
    );
  });

  // orders is always just whichever page/status is currently fetched, so only the active
  // tab's count is meaningful here — driven by the real backend total, not page.length.
  const counts = {
    all: totalOrders,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    dispatched: orders.filter(o => o.status === 'dispatched').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };
  counts[statusFilter as keyof typeof counts] = totalOrders;

  function handleStatus(id: string, status: string) {
    updateMutation.mutate({ id, payload: { status } });
  }

  function handleNote(id: string) {
    const note = noteInputs[id] ?? '';
    updateMutation.mutate({ id, payload: { admin_notes: note } });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-violet-500" />
            Product Orders
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer order requests. Approve, communicate, dispatch and track all product orders.
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'dispatched', 'cancelled'] as const).map(s => {
          const meta = s === 'all' ? null : STATUS_META[s];
          const Icon = meta?.icon;
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${
                active
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-border text-muted-foreground hover:text-foreground bg-muted/10'
              }`}>
              {Icon && <Icon className="w-3 h-3" />}
              {s === 'all' ? 'All Orders' : STATUS_META[s].label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-mono ${active ? 'bg-white/20' : 'bg-muted/40'}`}>
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, email, product, phone…"
          className="pl-9 h-9 text-xs bg-muted/20" />
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: counts.pending, color: 'text-amber-500' },
          { label: 'Approved', value: counts.approved, color: 'text-blue-500' },
          { label: 'Dispatched', value: counts.dispatched, color: 'text-emerald-500' },
          { label: 'Cancelled', value: counts.cancelled, color: 'text-red-500' },
        ].map(s => (
          <Card key={s.label} className="border border-border bg-card">
            <CardContent className="p-4 space-y-0.5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.label}</p>
              <p className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {orders.length === 0 ? 'No orders yet.' : 'No orders match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => {
            const isExpanded = expandedId === order.id;
            const isBusy = updateMutation.isPending && updateMutation.variables?.id === order.id;

            return (
              <Card key={order.id} className={`border bg-card transition-colors ${
                order.status === 'pending' ? 'border-amber-500/20' :
                order.status === 'approved' ? 'border-blue-500/20' :
                order.status === 'dispatched' ? 'border-emerald-500/20' :
                'border-border'
              }`}>
                {/* Row header — always visible */}
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/5 transition-colors"
                  >
                    {/* Product image */}
                    <div className="shrink-0">
                      {order.product?.image_url ? (
                        <img src={getMediaUrl(order.product.image_url)} alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-3">
                      <div className="sm:col-span-1">
                        <p className="text-xs font-bold text-foreground truncate">{order.product?.name ?? '—'}</p>
                        {order.product?.sku && (
                          <p className="text-[9px] text-muted-foreground font-mono">SKU: {order.product.sku}</p>
                        )}
                        <p className="text-[9px] text-muted-foreground">Qty: <span className="font-bold text-foreground">{order.quantity}</span></p>
                      </div>
                      <div className="sm:col-span-1">
                        <p className="text-[10px] font-semibold text-foreground truncate">{order.user?.full_name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{order.user?.email}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{order.user?.role}</p>
                      </div>
                      <div className="sm:col-span-1">
                        <p className="text-[9px] text-muted-foreground">{order.shipping_city}, {order.shipping_state}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">{order.shipping_phone}</p>
                      </div>
                      <div className="sm:col-span-1 flex flex-col gap-1 items-start sm:items-end">
                        <StatusBadge status={order.status} />
                        <p className="text-[9px] text-muted-foreground font-mono">{fmtDate(order.created_at)}</p>
                      </div>
                    </div>

                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="border-t border-border/40 p-5 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                        {/* Shipping details */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3" />Shipping Address
                          </p>
                          <div className="text-xs text-foreground space-y-0.5">
                            <p className="font-semibold">{order.shipping_name}</p>
                            <p>{order.shipping_address}</p>
                            <p>{order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}</p>
                            <p className="font-mono text-muted-foreground">{order.shipping_phone}</p>
                          </div>
                        </div>

                        {/* Order details */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Hash className="w-3 h-3" />Order Details
                          </p>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Order ID</span>
                              <span className="font-mono text-[9px] text-foreground">{order.id.slice(0, 8)}…</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Quantity</span>
                              <span className="font-bold text-foreground">{order.quantity}</span>
                            </div>
                            {order.unit_price != null && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Unit Price</span>
                                <span className="font-mono font-bold text-foreground">₹{Number(order.unit_price).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            {order.discount_amount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Referral Discount</span>
                                <span className="font-mono font-bold text-emerald-500">−₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            {order.referral_code_used && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Referral ID</span>
                                <span className="font-mono font-bold text-foreground">{order.referral_code_used}</span>
                              </div>
                            )}
                            {order.unit_price != null && (
                              <div className="flex justify-between border-t border-border/40 pt-1">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-mono font-bold text-foreground">
                                  ₹{(Number(order.unit_price) * order.quantity - Number(order.discount_amount || 0)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}
                            {order.unit_bv > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total BV</span>
                                <span className="font-mono font-bold text-violet-500">{(Number(order.unit_bv) * order.quantity).toFixed(0)} BV</span>
                              </div>
                            )}
                            {order.dispatched_at && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Dispatched</span>
                                <span className="text-[9px] font-mono text-emerald-500">{fmtDate(order.dispatched_at)}</span>
                              </div>
                            )}
                          </div>
                          {order.notes && (
                            <div className="mt-2 p-2 bg-muted/20 rounded-lg text-[10px] text-muted-foreground">
                              <span className="font-bold text-foreground">Customer note: </span>{order.notes}
                            </div>
                          )}
                        </div>

                        {/* Payment proof */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <Hash className="w-3 h-3" />Payment Proof
                          </p>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Transaction ID</span>
                              <span className="font-mono text-[10px] text-foreground">{order.payment_transaction_id || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Screenshot</span>
                              {order.payment_screenshot_url ? (
                                <a href={getMediaUrl(order.payment_screenshot_url)} target="_blank" rel="noopener noreferrer"
                                  className="text-primary hover:underline font-semibold text-[10px]">View</a>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">None</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Customer info */}
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <User className="w-3 h-3" />Customer
                          </p>
                          <div className="text-xs space-y-0.5">
                            <p className="font-semibold text-foreground">{order.user?.full_name}</p>
                            <p className="text-muted-foreground">{order.user?.email}</p>
                            <p className="text-muted-foreground font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />{order.user?.phone}
                            </p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-muted/30 rounded-full text-[8px] font-bold text-muted-foreground capitalize">
                              {order.user?.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin notes */}
                      {perm.edit && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />Admin Notes
                            <span className="text-[8px] font-normal text-muted-foreground ml-1">(visible to you only — use for dispatch details, tracking number, etc.)</span>
                          </p>
                          <div className="flex gap-2">
                            <Input
                              value={noteInputs[order.id] ?? (order.admin_notes || '')}
                              onChange={e => setNoteInputs(n => ({ ...n, [order.id]: e.target.value }))}
                              placeholder="Add admin note, tracking info, courier details…"
                              className="h-8 text-xs bg-muted/20 flex-1"
                            />
                            <Button disabled={isBusy} onClick={() => handleNote(order.id)}
                              className="h-8 text-xs bg-muted/40 hover:bg-muted/60 text-foreground border border-border font-semibold px-3">
                              {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {order.status === 'pending' && perm.edit && (
                          <>
                            <Button disabled={isBusy} onClick={() => handleStatus(order.id, 'approved')}
                              className="h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold px-4">
                              {isBusy ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                              Approve Order
                            </Button>
                            <Button disabled={isBusy} onClick={() => handleStatus(order.id, 'cancelled')}
                              className="h-8 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold px-4">
                              <XCircle className="w-3 h-3 mr-1" />Cancel
                            </Button>
                          </>
                        )}
                        {order.status === 'approved' && perm.edit && (
                          <>
                            <Button disabled={isBusy} onClick={() => handleStatus(order.id, 'dispatched')}
                              className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4">
                              {isBusy ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Truck className="w-3 h-3 mr-1" />}
                              Mark Dispatched
                            </Button>
                            <Button disabled={isBusy} onClick={() => handleStatus(order.id, 'cancelled')}
                              className="h-8 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold px-4">
                              <XCircle className="w-3 h-3 mr-1" />Cancel
                            </Button>
                          </>
                        )}
                        {order.status === 'dispatched' && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                            <Truck className="w-3.5 h-3.5" />
                            Order dispatched — stock decremented automatically
                          </div>
                        )}
                        {order.status === 'cancelled' && perm.edit && (
                          <Button disabled={isBusy} onClick={() => handleStatus(order.id, 'pending')}
                            className="h-8 text-xs bg-muted/40 hover:bg-muted/60 text-foreground border border-border font-bold px-4">
                            Reopen as Pending
                          </Button>
                        )}

                        {/* Stock warning */}
                        {order.status !== 'dispatched' && order.status !== 'cancelled' &&
                          order.product?.stock_quantity < order.quantity && (
                          <p className="text-[9px] text-red-500 font-semibold flex items-center gap-1 self-center">
                            <AlertCircle className="w-3 h-3" />
                            Only {order.product.stock_quantity} in stock — insufficient for this order
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <Card className="border border-border bg-card empty:hidden">
          <PaginationFooter page={page} totalPages={Math.ceil(totalOrders / PAGE_LIMIT)} total={totalOrders} onPageChange={setPage} label="orders" />
        </Card>
      )}
    </div>
  );
}
