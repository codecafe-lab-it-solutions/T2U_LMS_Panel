import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getMediaUrl, getStoredToken } from '../services/api';
import {
  Package, Search, ShoppingBag, X, ExternalLink, Sparkles,
  Factory, AlertCircle, Loader2, Tag, ChevronRight,
  CheckCircle2, Clock, Truck, XCircle, MapPin, Phone,
  ClipboardList, ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Helpers ───────────────────────────────────────────────────────────────────
function stockBadge(qty: number) {
  if (qty <= 0) return { label: 'Out of Stock', cls: 'bg-red-500/10 text-red-500 border-red-500/20' };
  if (qty <= 10) return { label: 'Low Stock', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  return { label: 'In Stock', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
}

const ORDER_STATUS: Record<string, { label: string; icon: any; cls: string }> = {
  pending:    { label: 'Pending Review',  icon: Clock,        cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  approved:   { label: 'Approved',        icon: CheckCircle2, cls: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  dispatched: { label: 'Dispatched',      icon: Truck,        cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  cancelled:  { label: 'Cancelled',       icon: XCircle,      cls: 'text-red-500 bg-red-500/10 border-red-500/20' },
};

function OrderStatusBadge({ status }: { status: string }) {
  const m = ORDER_STATUS[status] ?? ORDER_STATUS.pending;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${m.cls}`}>
      <Icon className="w-2.5 h-2.5" />{m.label}
    </span>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_ADDR = {
  name: '', phone: '', address: '', city: '', state: '', pincode: '', notes: '', quantity: '1',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProductShop() {
  const qc = useQueryClient();
  const isLoggedIn = !!getStoredToken();

  // view state
  const [activeView, setActiveView] = useState<'shop' | 'orders'>('shop');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [detailProduct, setDetailProduct] = useState<any | null>(null);
  const [orderProduct, setOrderProduct] = useState<any | null>(null);
  const [addr, setAddr] = useState({ ...EMPTY_ADDR });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');

  // queries
  const { data: products = [], isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ['cms-products'],
    queryFn: () => api.cms.products.list(),
  });

  const { data: myOrders = [], isLoading: loadingOrders } = useQuery<any[]>({
    queryKey: ['my-orders'],
    queryFn: () => api.orders.myOrders(),
    enabled: isLoggedIn,
  });

  // place order mutation
  const placeMutation = useMutation({
    mutationFn: (payload: any) => api.orders.place(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['cms-products'] });
      setOrderSuccess(true);
      setOrderError('');
    },
    onError: (e: any) => setOrderError(e.message || 'Failed to place order'),
  });

  const categories = ['All', ...Array.from(new Set(products.filter(p => p.category).map((p: any) => p.category as string)))];

  const filtered = products.filter((p: any) => {
    const q = search.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !(p.category || '').toLowerCase().includes(q)) return false;
    if (catFilter !== 'All' && p.category !== catFilter) return false;
    return true;
  });

  function a(key: keyof typeof EMPTY_ADDR, val: string) {
    setAddr(prev => ({ ...prev, [key]: val }));
  }

  function openOrder(p: any) {
    setOrderProduct(p);
    setAddr({ ...EMPTY_ADDR });
    setOrderSuccess(false);
    setOrderError('');
    setDetailProduct(null);
  }

  function closeOrder() {
    setOrderProduct(null);
    setOrderSuccess(false);
    setOrderError('');
  }

  function submitOrder() {
    if (!addr.name.trim())    { setOrderError('Full name is required'); return; }
    if (!addr.phone.trim())   { setOrderError('Phone number is required'); return; }
    if (!addr.address.trim()) { setOrderError('Address is required'); return; }
    if (!addr.city.trim())    { setOrderError('City is required'); return; }
    if (!addr.state.trim())   { setOrderError('State is required'); return; }
    if (!addr.pincode.trim()) { setOrderError('Pincode is required'); return; }
    setOrderError('');
    placeMutation.mutate({
      product_id: orderProduct.id,
      quantity: parseInt(addr.quantity) || 1,
      shipping_name: addr.name,
      shipping_phone: addr.phone,
      shipping_address: addr.address,
      shipping_city: addr.city,
      shipping_state: addr.state,
      shipping_pincode: addr.pincode,
      notes: addr.notes || undefined,
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header + tab switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-violet-500" />
            Shop
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Browse and order T2U products and study materials.</p>
        </div>
        {isLoggedIn && (
          <div className="flex gap-1 bg-muted/20 border border-border rounded-xl p-1">
            {(['shop', 'orders'] as const).map(v => (
              <button key={v} onClick={() => setActiveView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeView === v ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {v === 'shop' ? (
                  <span className="flex items-center gap-1.5"><Package className="w-3 h-3" />Browse</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="w-3 h-3" />My Orders
                    {myOrders.filter(o => o.status === 'approved').length > 0 && (
                      <span className="w-4 h-4 bg-blue-500 text-white rounded-full text-[8px] font-mono flex items-center justify-center">
                        {myOrders.filter(o => o.status === 'approved').length}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Shop View ──────────────────────────────────────────────────────── */}
      {activeView === 'shop' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-9 h-9 text-xs bg-muted/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${
                    catFilter === c
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-border text-muted-foreground hover:border-violet-500 hover:text-violet-500 bg-muted/10'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {loadingProducts ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading products…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {products.length === 0 ? 'No products available yet.' : 'No products match your search.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((p: any) => {
                const sb = stockBadge(Number(p.stock_quantity));
                return (
                  <Card key={p.id}
                    className="border border-border bg-card hover:border-violet-500/40 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => setDetailProduct(p)}>
                    <div className="relative overflow-hidden rounded-t-xl aspect-square bg-muted/20">
                      {p.image_url ? (
                        <img src={getMediaUrl(p.image_url)} alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground/20" />
                        </div>
                      )}
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-bold border ${sb.cls}`}>
                        {sb.label}
                      </span>
                      {p.category && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[8px] font-bold">
                          {p.category}
                        </span>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="text-xs font-extrabold text-foreground leading-tight line-clamp-2">{p.name}</h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{p.short_description}</p>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          {p.price != null && (
                            <p className="text-sm font-black text-foreground font-mono">₹{Number(p.price).toLocaleString('en-IN')}</p>
                          )}
                          {p.bv > 0 && (
                            <p className="text-[9px] text-violet-500 font-bold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />{Number(p.bv).toFixed(0)} BV
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── My Orders View ─────────────────────────────────────────────────── */}
      {activeView === 'orders' && (
        <>
          {loadingOrders ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />Loading your orders…
            </div>
          ) : myOrders.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
              <Button onClick={() => setActiveView('shop')}
                className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-4">
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order: any) => (
                <Card key={order.id} className={`border bg-card ${
                  order.status === 'pending' ? 'border-amber-500/20' :
                  order.status === 'approved' ? 'border-blue-500/20' :
                  order.status === 'dispatched' ? 'border-emerald-500/20' :
                  'border-border'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {order.product?.image_url ? (
                        <img src={getMediaUrl(order.product.image_url)} alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl border border-border bg-muted/20 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-foreground">{order.product?.name}</p>
                            {order.product?.sku && (
                              <p className="text-[9px] text-muted-foreground font-mono">SKU: {order.product.sku}</p>
                            )}
                          </div>
                          <OrderStatusBadge status={order.status} />
                        </div>

                        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                          <span>Qty: <strong className="text-foreground">{order.quantity}</strong></span>
                          {order.unit_price != null && (
                            <span>Total: <strong className="text-foreground font-mono">₹{(Number(order.unit_price) * order.quantity).toLocaleString('en-IN')}</strong></span>
                          )}
                          {order.unit_bv > 0 && (
                            <span className="text-violet-500 font-semibold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              {(Number(order.unit_bv) * order.quantity).toFixed(0)} BV
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />{order.shipping_city}, {order.shipping_state}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-[9px] text-muted-foreground font-mono">Placed {fmtDate(order.created_at)}</p>
                          {order.dispatched_at && (
                            <p className="text-[9px] text-emerald-500 font-mono flex items-center gap-0.5">
                              <Truck className="w-2.5 h-2.5" />Dispatched {fmtDate(order.dispatched_at)}
                            </p>
                          )}
                        </div>

                        {/* Status messages */}
                        {order.status === 'pending' && (
                          <p className="text-[9px] text-amber-500 bg-amber-500/5 border border-amber-500/15 rounded-lg px-2 py-1">
                            Your order is awaiting admin review. We'll update you once it's approved.
                          </p>
                        )}
                        {order.status === 'approved' && (
                          <p className="text-[9px] text-blue-500 bg-blue-500/5 border border-blue-500/15 rounded-lg px-2 py-1">
                            Order approved! It will be dispatched soon.
                          </p>
                        )}
                        {order.status === 'dispatched' && (
                          <p className="text-[9px] text-emerald-500 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-2 py-1">
                            Your order has been dispatched and is on its way.
                          </p>
                        )}

                        {/* Admin note (if any) — shown to user as a message */}
                        {order.admin_notes && (
                          <div className="text-[9px] bg-muted/20 border border-border/50 rounded-lg px-2 py-1.5">
                            <span className="font-bold text-foreground">Message from team: </span>
                            <span className="text-muted-foreground">{order.admin_notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Product Detail Modal ────────────────────────────────────────────── */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setDetailProduct(null)}>
          <div className="max-w-2xl w-full bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
              <h2 className="text-sm font-extrabold text-foreground">{detailProduct.name}</h2>
              <button type="button" title="Close" onClick={() => setDetailProduct(null)}
                className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {detailProduct.image_url && (
                <div className="h-52 bg-muted/20 overflow-hidden">
                  <img src={getMediaUrl(detailProduct.image_url)} alt={detailProduct.name}
                    className="w-full h-full object-cover" />
                </div>
              )}

              <div className="px-6 py-5 space-y-4">
                {/* Price + BV + stock */}
                <div className="flex flex-wrap items-center gap-4">
                  {detailProduct.price != null && (
                    <div>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">Price</p>
                      <p className="text-2xl font-black font-mono text-foreground">₹{Number(detailProduct.price).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  {detailProduct.bv > 0 && (
                    <div className="px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                      <p className="text-[9px] text-violet-500 font-bold uppercase">Business Volume</p>
                      <p className="text-lg font-black text-violet-500 font-mono flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />{Number(detailProduct.bv).toFixed(0)} BV
                      </p>
                    </div>
                  )}
                  {(() => { const sb = stockBadge(Number(detailProduct.stock_quantity));
                    return <span className={`inline-flex px-2 py-1 rounded-full text-[9px] font-bold border ${sb.cls}`}>{sb.label}</span>;
                  })()}
                  {detailProduct.category && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Tag className="w-3 h-3" />{detailProduct.category}
                    </span>
                  )}
                </div>

                {detailProduct.long_description && (
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1.5">About</p>
                    <p className="text-xs text-foreground leading-relaxed">{detailProduct.long_description}</p>
                  </div>
                )}

                {(() => {
                  let features: string[] = [];
                  if (Array.isArray(detailProduct.features)) features = detailProduct.features;
                  else if (typeof detailProduct.features === 'string') {
                    try { features = JSON.parse(detailProduct.features); } catch { features = []; }
                  }
                  if (!features.length) return null;
                  return (
                    <div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Features</p>
                      <ul className="space-y-1">
                        {features.map((f: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <span className="w-1 h-1 rounded-full bg-violet-500 mt-1.5 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}

                {(detailProduct.manufacturer || detailProduct.material || detailProduct.weight || detailProduct.dimensions) && (
                  <div className="p-3 bg-muted/10 border border-border/50 rounded-xl space-y-2">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Factory className="w-3 h-3" />Manufacturer & Build
                    </p>
                    {[
                      ['Brand', detailProduct.manufacturer],
                      ['Material', detailProduct.material],
                      ['Weight', detailProduct.weight],
                      ['Dimensions', detailProduct.dimensions],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-semibold text-foreground text-right max-w-[55%]">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border/40 flex items-center gap-3 flex-wrap">
              {detailProduct.stock_quantity > 0 ? (
                <Button onClick={() => openOrder(detailProduct)}
                  className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-5">
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />Place Order
                </Button>
              ) : (
                <Button disabled className="h-9 text-xs bg-muted text-muted-foreground font-bold px-5 cursor-not-allowed">
                  Out of Stock
                </Button>
              )}
              {detailProduct.buy_url && (
                <a href={detailProduct.buy_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="h-9 text-xs border-border">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />External Link
                  </Button>
                </a>
              )}
              <Button variant="ghost" onClick={() => setDetailProduct(null)} className="h-9 text-xs ml-auto">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Form Modal ────────────────────────────────────────────────── */}
      {orderProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40">
              <button type="button" title="Go back" onClick={closeOrder}
                className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-muted-foreground font-bold uppercase">Place Order</p>
                <h2 className="text-sm font-extrabold text-foreground truncate">{orderProduct.name}</h2>
              </div>
              <button type="button" title="Close" onClick={closeOrder}
                className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {orderSuccess ? (
              /* Success state */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-foreground">Order Placed!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your order request has been sent to the team. We'll review it and get in touch with you shortly.
                  </p>
                </div>
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[10px] text-blue-500 max-w-xs text-left space-y-0.5">
                  <p className="font-bold">What happens next?</p>
                  <p>1. Admin reviews your order request</p>
                  <p>2. You'll receive an update (Approved / Pending)</p>
                  <p>3. Product is manually dispatched & shipped to you</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button onClick={() => { closeOrder(); setActiveView('orders'); }}
                    className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-4">
                    View My Orders
                  </Button>
                  <Button variant="outline" onClick={closeOrder} className="h-8 text-xs border-border">
                    Continue Shopping
                  </Button>
                </div>
              </div>
            ) : (
              /* Form */
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                {/* Product summary */}
                <div className="flex gap-3 p-3 bg-muted/10 border border-border/50 rounded-xl">
                  {orderProduct.image_url && (
                    <img src={getMediaUrl(orderProduct.image_url)} alt=""
                      className="w-12 h-12 rounded-lg object-cover border border-border shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{orderProduct.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {orderProduct.price != null && (
                        <span className="text-xs font-mono font-black text-foreground">₹{Number(orderProduct.price).toLocaleString('en-IN')}</span>
                      )}
                      {orderProduct.bv > 0 && (
                        <span className="text-[9px] text-violet-500 font-bold flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />{Number(orderProduct.bv).toFixed(0)} BV
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {orderProduct.stock_quantity} unit{orderProduct.stock_quantity !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Quantity</Label>
                  <Input type="number" min="1" max={orderProduct.stock_quantity}
                    value={addr.quantity} onChange={e => a('quantity', e.target.value)}
                    className="h-9 text-xs bg-muted/20 font-mono max-w-[120px]" />
                </div>

                {/* Shipping details */}
                <div className="space-y-3">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" />Shipping Details
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Full Name *</Label>
                      <Input value={addr.name} onChange={e => a('name', e.target.value)}
                        placeholder="Recipient name" className="h-9 text-xs bg-muted/20" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />Phone *
                      </Label>
                      <Input value={addr.phone} onChange={e => a('phone', e.target.value)}
                        placeholder="10-digit mobile number" className="h-9 text-xs bg-muted/20 font-mono" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Address *</Label>
                      <Input value={addr.address} onChange={e => a('address', e.target.value)}
                        placeholder="House / flat, street, area" className="h-9 text-xs bg-muted/20" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">City *</Label>
                      <Input value={addr.city} onChange={e => a('city', e.target.value)}
                        placeholder="City" className="h-9 text-xs bg-muted/20" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">State *</Label>
                      <Input value={addr.state} onChange={e => a('state', e.target.value)}
                        placeholder="State" className="h-9 text-xs bg-muted/20" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Pincode *</Label>
                      <Input value={addr.pincode} onChange={e => a('pincode', e.target.value)}
                        placeholder="6-digit pincode" className="h-9 text-xs bg-muted/20 font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-bold text-muted-foreground uppercase">Note (optional)</Label>
                      <Input value={addr.notes} onChange={e => a('notes', e.target.value)}
                        placeholder="Landmark, delivery note…" className="h-9 text-xs bg-muted/20" />
                    </div>
                  </div>
                </div>

                {/* Price summary */}
                {orderProduct.price != null && (
                  <div className="p-3 bg-muted/10 border border-border/50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Unit price</span>
                      <span className="font-mono">₹{Number(orderProduct.price).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Quantity</span>
                      <span className="font-mono">×{parseInt(addr.quantity) || 1}</span>
                    </div>
                    <div className="flex justify-between font-black text-foreground border-t border-border/40 pt-1.5">
                      <span>Total</span>
                      <span className="font-mono">₹{(Number(orderProduct.price) * (parseInt(addr.quantity) || 1)).toLocaleString('en-IN')}</span>
                    </div>
                    {orderProduct.bv > 0 && (
                      <div className="flex justify-between text-violet-500 font-semibold text-[10px]">
                        <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" />BV you'll earn</span>
                        <span className="font-mono">{(Number(orderProduct.bv) * (parseInt(addr.quantity) || 1)).toFixed(0)} BV</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[9px] text-muted-foreground bg-muted/10 border border-border/40 rounded-xl p-3">
                  <p className="font-bold text-foreground mb-0.5">How this works</p>
                  <p>Your order request is sent to the T2U team. They'll review it, contact you to confirm, and manually dispatch the product to your shipping address.</p>
                </div>
              </div>
            )}

            {/* Footer */}
            {!orderSuccess && (
              <div className="px-6 py-4 border-t border-border/40 space-y-2">
                {orderError && (
                  <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{orderError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button disabled={placeMutation.isPending} onClick={submitOrder}
                    className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 flex-1">
                    {placeMutation.isPending
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Placing Order…</>
                      : <><ShoppingBag className="w-3.5 h-3.5 mr-1.5" />Confirm Order Request</>
                    }
                  </Button>
                  <Button variant="outline" onClick={closeOrder} className="h-9 text-xs border-border">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
