import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, ShoppingBag, Sparkles, ArrowRight, CheckCircle2,
  Tag, Star, ExternalLink, X, ShieldCheck
} from 'lucide-react';
import { api, getMediaUrl } from '../../services/api';
import { SHOW_PRODUCTS } from '../../constants/featureFlags';

interface FeaturedProductsProps {
  onNavigateToProducts: () => void;
  onOpenOrderModal: (productTitle: string) => void;
}

export default function FeaturedProducts({ onNavigateToProducts, onOpenOrderModal }: FeaturedProductsProps) {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const { data: cmsProducts = [], isLoading } = useQuery<any[]>({
    queryKey: ['cms-products'],
    queryFn: () => api.cms.products.list(),
    staleTime: 60_000,
  });

  if (!SHOW_PRODUCTS) return null;

  const products = cmsProducts.filter((p: any) => p.is_active !== false).slice(0, 4);
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-[#0b0213] via-[#140622] to-[#0b0213] text-white relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-coral" />
              <span>Official T2U Merch & Tools</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase">
              Study & <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">Productivity Store</span>
            </h2>
            <p className="text-sm sm:text-base text-white/70 max-w-2xl">
              Equip yourself with premium learning toolkits, developer gear, and smart hardware built to accelerate your career growth.
            </p>
          </div>

          <button
            onClick={onNavigateToProducts}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-bold text-white transition-all group shrink-0"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4 text-brand-coral group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod: any) => {
            const offerPrice = prod.offer_price != null ? Number(prod.offer_price) : (prod.price != null ? Number(prod.price) : 0);
            const mrp = prod.mrp != null ? Number(prod.mrp) : (offerPrice > 0 ? Math.round(offerPrice * 1.35) : 0);
            const savingsPercent = mrp > offerPrice ? Math.round(((mrp - offerPrice) / mrp) * 100) : 0;

            return (
              <motion.div
                key={prod.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="group flex flex-col rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/50 hover:shadow-[0_10px_30px_rgba(124,58,237,0.2)] transition-all overflow-hidden"
              >
                {/* Image container */}
                <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
                  {prod.image_url ? (
                    <img
                      src={getMediaUrl(prod.image_url)}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-violet-950/20">
                      <Package className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  {/* Savings badge */}
                  {savingsPercent > 0 && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-500/90 backdrop-blur-md text-[10px] font-black tracking-wide text-white shadow-lg">
                      {savingsPercent}% OFF
                    </span>
                  )}

                  {/* Category Pill */}
                  {prod.category && (
                    <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-white/80 border border-white/10">
                      {prod.category}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white group-hover:text-brand-coral transition-colors line-clamp-1">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                      {prod.short_description}
                    </p>
                  </div>

                  {/* Pricing row */}
                  <div className="pt-2 border-t border-white/5 flex items-baseline justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-white font-mono">
                          ₹{offerPrice.toLocaleString('en-IN')}
                        </span>
                        {mrp > offerPrice && (
                          <span className="text-xs text-white/40 line-through font-mono">
                            ₹{mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold block">
                        Special Offer Price
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenOrderModal(prod.name)}
                      className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-105"
                      title="Order Now"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-violet-900/40 via-purple-900/20 to-pink-900/30 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-brand-coral" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">
                Are you a registered T2U Distributor?
              </h4>
              <p className="text-xs text-white/70 mt-0.5">
                Log in to access exclusive Distributor Prices (DP), earn direct retail profits on customer referrals, and accumulate BV.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToProducts}
            className="px-6 py-3 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-extrabold uppercase tracking-wider shrink-0 transition-all shadow-xl"
          >
            Open Store Catalog
          </button>
        </div>
      </div>
    </section>
  );
}
