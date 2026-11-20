import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, Star, Filter, ArrowRight, Search, X, CheckCircle2,
  Package, Factory, FileText, ExternalLink, Sparkles
} from 'lucide-react';
import { api, getMediaUrl } from '../../services/api';
import FullscreenPdfViewer from '../FullscreenPdfViewer';

interface ProductItem {
  id: string;
  title: string;
  category: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice: number;
  mrp: number;
  dp?: number;
  referralDiscountPercent?: number;
  rating: number;
  reviews: number;
  image: string;
  pdfUrl?: string;
  buyUrl?: string;
  perks: string[];
  manufacturer?: string;
  material?: string;
  weight?: string;
  dimensions?: string;
  sku?: string;
  bv?: number;
  raw: any;
}

interface ProductsPageProps {
  onBackToHome: () => void;
  onOpenOrderModal: (productTitle: string) => void;
}

export default function ProductsPage({ onBackToHome, onOpenOrderModal }: ProductsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [fullscreenPdf, setFullscreenPdf] = useState<{ url: string; title: string } | null>(null);

  const { data: cmsProducts = [], isLoading } = useQuery<any[]>({
    queryKey: ['cms-products'],
    queryFn: () => api.cms.products.list(),
    staleTime: 30_000,
  });

  // Map database products exclusively (no hardcoded demo products)
  const products: ProductItem[] = cmsProducts.map((p: any) => {
    let features: string[] = [];
    if (Array.isArray(p.features)) {
      features = p.features;
    } else if (typeof p.features === 'string') {
      try { features = JSON.parse(p.features); } catch { features = []; }
    }

    const offerPriceNum = p.offer_price ? parseFloat(p.offer_price) : (p.price ? parseFloat(p.price) : 0);
    const mrpNum = p.mrp ? parseFloat(p.mrp) : (offerPriceNum > 0 ? Math.round(offerPriceNum * 1.35) : 0);
    const dpNum = p.distributor_price ? parseFloat(p.distributor_price) : undefined;
    const refDisc = p.referral_discount_percent ? parseFloat(p.referral_discount_percent) : 0;

    return {
      id: p.id,
      title: p.name,
      category: p.category || 'Store',
      description: p.short_description || '',
      longDescription: p.long_description || '',
      price: offerPriceNum,
      originalPrice: mrpNum,
      mrp: mrpNum,
      dp: dpNum,
      referralDiscountPercent: refDisc,
      rating: 4.8,
      reviews: 0,
      image: getMediaUrl(p.image_url),
      pdfUrl: p.pdf_url || undefined,
      buyUrl: p.buy_url || undefined,
      perks: features,
      manufacturer: p.manufacturer || undefined,
      material: p.material || undefined,
      weight: p.weight || undefined,
      dimensions: p.dimensions || undefined,
      sku: p.sku || undefined,
      bv: p.bv ? parseFloat(p.bv) : 0,
      raw: p,
    };
  });

  const categories = ['All Products', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((prod) => {
    const categoryMatch = selectedCategory === 'All Products' || prod.category === selectedCategory;
    const searchMatch =
      prod.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.longDescription && prod.longDescription.toLowerCase().includes(searchTerm.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  return (
    <section className="pt-24 pb-20 bg-[#12031e] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Link / Breadcrumbs */}
        <div className="mb-4 -mt-2 flex justify-start border-b border-white/5 pb-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 text-xs text-white/55 hover:text-orange-450 font-semibold transition-colors duration-300 group cursor-pointer"
          >
            <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Back to Home Page</span>
          </button>
        </div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            T2U Product Store
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Explore quality products configured directly from our database.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-full pl-12 pr-6 py-4 text-white placeholder-white/50 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Category Filters */}
        {categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 flex items-center gap-3 flex-wrap justify-center"
          >
            <Filter className="w-5 h-5 text-orange-400" />
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/40'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-white/60">Loading store products…</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 max-w-md mx-auto p-8 space-y-3">
            <Package className="w-12 h-12 mx-auto text-white/30" />
            <p className="text-white/70 text-base font-bold">
              {products.length === 0 ? 'No products configured in database yet.' : 'No products match your search or filter options.'}
            </p>
            {searchTerm || selectedCategory !== 'All Products' ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All Products');
                  setSearchTerm('');
                }}
                className="text-orange-400 hover:text-orange-300 font-semibold text-xs"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((prod, index) => {
              const accentBg = [
                'from-[#3f1f70] via-[#6f2dd0] to-[#f59e0b]',
                'from-[#1f3f86] via-[#3b82f6] to-[#fb923c]',
                'from-[#581c87] via-[#a855f7] to-[#fb7185]',
                'from-[#9333ea] via-[#d946ef] to-[#fbbf24]',
                'from-[#0f766e] via-[#14b8a6] to-[#f97316]'
              ][index % 5];

              return (
                <motion.div
                  key={prod.id}
                  whileHover={{ y: -6 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => setSelectedProduct(prod)}
                  className="overflow-hidden rounded-[20px] border border-white/10 bg-[#1e0d2f] hover:border-white/40 hover:shadow-orange-500/20 shadow-xl flex flex-col cursor-pointer transition-all duration-300"
                >
                  {/* Visual Banner */}
                  <div className={`relative aspect-video max-h-52 bg-gradient-to-br ${accentBg} p-4 flex flex-col justify-between group overflow-hidden`}>
                    {prod.image && (
                      <>
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="absolute inset-0 w-full h-full object-contain z-0 transition-transform duration-500 group-hover:scale-105 bg-black/60 p-2"
                        />
                        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
                      </>
                    )}
                    <div className="relative z-20 flex justify-between items-start">
                      <div className="rounded-lg bg-white/10 p-2 text-white">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex gap-1">
                        {prod.category && (
                          <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#12031e]">
                            {prod.category}
                          </span>
                        )}
                        {prod.pdfUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullscreenPdf({ url: prod.pdfUrl!, title: prod.title });
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-md hover:bg-red-700"
                            title="View Product PDF Attachment"
                          >
                            <FileText className="w-3 h-3" /> PDF
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative z-20 mt-auto">
                      <h3 className="text-base font-black text-white leading-tight drop-shadow-md line-clamp-1">
                        {prod.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-5 flex flex-col gap-4 flex-1 bg-[#1e0d2f]">
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-auto">
                      {/* Price Tag */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-white">₹{prod.price.toLocaleString('en-IN')}</span>
                        {prod.originalPrice > prod.price && (
                          <span className="text-[10px] text-white/40 line-through">₹{prod.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      {prod.originalPrice > prod.price && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}% OFF
                        </span>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(prod);
                        }}
                        className="rounded-full border border-white/10 bg-white/5 py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:border-[#f97316] hover:text-[#f97316] cursor-pointer text-center"
                      >
                        View Details
                      </button>
                      {prod.buyUrl ? (
                        <a
                          href={prod.buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="rounded-full bg-[#f97316] py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:bg-[#ea580c] cursor-pointer text-center block"
                        >
                          Buy Now
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onOpenOrderModal(prod.title); }}
                          className="rounded-full bg-[#f97316] py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:bg-[#ea580c] cursor-pointer text-center"
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Details Modal Dialog */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-[#171421] border border-purple-900/40 rounded-3xl shadow-2xl text-white flex flex-col overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-purple-900/20 pb-4 p-5 sm:p-6 flex-shrink-0 bg-[#120f1f]">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-brand-coral/10 text-brand-coral rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-widest text-brand-coral uppercase px-2.5 py-1 bg-brand-coral/5 rounded-full">
                    {selectedProduct.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {selectedProduct.title}
                  </h3>
                  {selectedProduct.sku && (
                    <p className="text-xs text-white/40 font-mono mt-1">
                      SKU: {selectedProduct.sku}
                    </p>
                  )}
                </div>

                {/* Product Image - Full Uncropped View */}
                {selectedProduct.image && (
                  <div className="w-full aspect-[16/9] max-h-80 bg-slate-950/60 rounded-2xl overflow-hidden border border-purple-900/30 flex items-center justify-center p-2">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.title}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                )}

                {/* PDF Attachment Section */}
                {selectedProduct.pdfUrl && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Product PDF Attachment</h4>
                        <p className="text-[11px] text-white/60">Brochure & Specification Document</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFullscreenPdf({ url: selectedProduct.pdfUrl!, title: selectedProduct.title })}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Full-Screen PDF
                    </button>
                  </div>
                )}

                {/* Short Description */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center gap-1">
                    <Star className="w-4 h-4 text-brand-coral" />
                    Product Overview
                  </h4>
                  <p className="text-xs leading-relaxed text-white/85">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Long Paragraph (Long Description) */}
                {selectedProduct.longDescription && (
                  <div className="space-y-2 pt-2 border-t border-purple-900/20">
                    <h4 className="text-xs uppercase font-extrabold text-white tracking-wider">
                      Detailed Information
                    </h4>
                    <p className="text-xs leading-relaxed text-white/80 whitespace-pre-line">
                      {selectedProduct.longDescription}
                    </p>
                  </div>
                )}

                {/* Manufacturer & Specifications */}
                {(selectedProduct.manufacturer || selectedProduct.material || selectedProduct.weight || selectedProduct.dimensions) && (
                  <div className="p-4 bg-white/5 border border-purple-900/30 rounded-2xl space-y-2.5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-brand-coral" /> Manufacturer & Specifications
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedProduct.manufacturer && (
                        <div className="flex justify-between bg-black/20 px-3 py-1.5 rounded-lg">
                          <span className="text-white/50">Brand / Maker:</span>
                          <span className="font-semibold text-white">{selectedProduct.manufacturer}</span>
                        </div>
                      )}
                      {selectedProduct.material && (
                        <div className="flex justify-between bg-black/20 px-3 py-1.5 rounded-lg">
                          <span className="text-white/50">Material:</span>
                          <span className="font-semibold text-white">{selectedProduct.material}</span>
                        </div>
                      )}
                      {selectedProduct.weight && (
                        <div className="flex justify-between bg-black/20 px-3 py-1.5 rounded-lg">
                          <span className="text-white/50">Weight:</span>
                          <span className="font-semibold text-white">{selectedProduct.weight}</span>
                        </div>
                      )}
                      {selectedProduct.dimensions && (
                        <div className="flex justify-between bg-black/20 px-3 py-1.5 rounded-lg">
                          <span className="text-white/50">Dimensions:</span>
                          <span className="font-semibold text-white">{selectedProduct.dimensions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Benefits / Features */}
                {selectedProduct.perks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-extrabold text-white tracking-wider">
                      What's Included / Key Features
                    </h4>
                    <ul className="space-y-2">
                      {selectedProduct.perks.map((perk, pIndex) => (
                        <li key={pIndex} className="flex items-center space-x-2 text-xs text-white/80 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-purple-900/20 bg-[#120f1f] flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                  {selectedProduct.originalPrice > selectedProduct.price && (
                    <span className="text-xs text-white/40 line-through">₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1 sm:flex-initial py-2.5 px-6 border border-purple-900/40 hover:bg-white/5 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Back to Store
                  </button>
                  {selectedProduct.buyUrl ? (
                    <a
                      href={selectedProduct.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-2.5 px-8 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-brand-coral/15 cursor-pointer"
                    >
                      <span>Buy Now</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        onOpenOrderModal(selectedProduct.title);
                      }}
                      className="flex-1 sm:flex-initial bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-2.5 px-8 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-brand-coral/15 cursor-pointer"
                    >
                      <span>Order Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen PDF Reader Modal */}
      {fullscreenPdf && (
        <FullscreenPdfViewer
          pdfUrl={fullscreenPdf.url}
          title={fullscreenPdf.title}
          onClose={() => setFullscreenPdf(null)}
        />
      )}
    </section>
  );
}
