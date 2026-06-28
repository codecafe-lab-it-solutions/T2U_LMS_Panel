import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Star, Filter, ArrowRight, Search, X, CheckCircle2,
  BookOpen, TrendingUp, Laptop, Sparkles, Award, Layers, Calendar
} from 'lucide-react';

interface Product {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  icon: any;
  image: string;
  perks: string[];
}

const PRODUCTS_DATA: Product[] = [
  {
    id: 1,
    title: 'Advanced Spoken English Complete Course Book',
    category: 'Study Material',
    description: 'The printed 90-day comprehensive roadmap booklet with grammar, dialogue templates, and interview scripts.',
    price: 499,
    originalPrice: 999,
    rating: 4.9,
    reviews: 245,
    icon: BookOpen,
    image: '/images/english.png',
    perks: ['Printed physical copy delivery', 'Includes 90 tenses practice sheets', 'Interview Q&A bank annexure']
  },
  {
    id: 2,
    title: 'Advanced Digital Marketing Playbook',
    category: 'Study Material',
    description: 'The complete 6-month digital marketing playbook covering SMM, SEO, paid ads, and copywriting frameworks.',
    price: 599,
    originalPrice: 1199,
    rating: 4.8,
    reviews: 180,
    icon: TrendingUp,
    image: '/images/digital skills .png',
    perks: ['Detailed step-by-step visual guides', 'Copywriting formula templates inside', 'Paid Ads checklist']
  },
  {
    id: 3,
    title: 'Tally Prime & GST Accounting Guide',
    category: 'Practice Manual',
    description: 'Interactive workbook with 50+ real-world retail accounting case studies and step-by-step voucher guidelines.',
    price: 399,
    originalPrice: 799,
    rating: 4.9,
    reviews: 155,
    icon: Laptop,
    image: '/images/computer-skills.png',
    perks: ['50 ledger entries scenarios', 'CGST/SGST ledger mapping sheets', 'Mock balance sheet trials']
  },
  {
    id: 4,
    title: 'AI Automation Prompt Mastery Vault',
    category: 'Digital Assets',
    description: '100+ copy-paste RACE formula prompts and n8n/Zapier automation workflows for MS Office and Google Sheets.',
    price: 299,
    originalPrice: 599,
    rating: 4.9,
    reviews: 310,
    icon: Sparkles,
    image: '/images/ai-automatin.png',
    perks: ['Instant dashboard download access', 'n8n JSON workflows copy', 'RACE prompt cheatsheets']
  },
  {
    id: 5,
    title: 'Corporate Readiness & Confidence Building Kit',
    category: 'Personal Growth',
    description: 'Video templates, resume layouts, cover letter guides, and active body language audio drills.',
    price: 349,
    originalPrice: 699,
    rating: 4.7,
    reviews: 95,
    icon: Award,
    image: '/images/english.png',
    perks: ['ATS resume layout templates', '10 voice modulation audios', 'Workplace grooming cheatsheet']
  },
  {
    id: 6,
    title: 'B2B Client Acquisition Funnel Template',
    category: 'Digital Assets',
    description: 'Pre-built Systeme.io opt-in templates and WhatsApp Wati/AiSensy automation scripts for agency owners.',
    price: 449,
    originalPrice: 899,
    rating: 4.8,
    reviews: 120,
    icon: Layers,
    image: '/images/selling.png',
    perks: ['Systeme.io template share code', 'AiSensy broadcast text templates', 'Discovery call script checklist']
  }
];

const CATEGORIES = ['All Products', 'Study Material', 'Practice Manual', 'Digital Assets', 'Personal Growth'];

interface ProductsPageProps {
  onBackToHome: () => void;
  onOpenOrderModal: (productTitle: string) => void;
}

export default function ProductsPage({ onBackToHome, onOpenOrderModal }: ProductsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = PRODUCTS_DATA.filter(prod => {
    const categoryMatch = selectedCategory === 'All Products' || prod.category === selectedCategory;
    const searchMatch = prod.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        prod.description.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <section className="pt-24 pb-20 bg-[#12031e] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link / Breadcrumbs */}
        <div className="mb-4 -mt-2 flex justify-start border-b border-white/5 pb-2">
          <button
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
            Upgrade your journey with professional study books, interactive practice manuals, templates, and digital workflows.
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
              placeholder="Search products by name or key skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-full pl-12 pr-6 py-4 text-white placeholder-white/50 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 flex items-center gap-3 flex-wrap justify-center"
        >
          <Filter className="w-5 h-5 text-orange-400" />
          {CATEGORIES.map((category) => (
            <button
              key={category}
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((prod, index) => {
            const Icon = prod.icon;
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
                <div className={`relative h-[160px] bg-gradient-to-br ${accentBg} p-4 flex flex-col justify-between group`}>
                  {prod.image && (
                    <>
                      <img 
                        src={prod.image} 
                        alt={prod.title} 
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/40 z-10" />
                    </>
                  )}
                  <div className="relative z-20 flex justify-between items-start">
                    <div className="rounded-lg bg-white/10 p-2 text-white">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#12031e]">
                      {prod.category}
                    </span>
                  </div>
                  <div className="relative z-20">
                    <h3 className="text-base font-black text-white leading-tight drop-shadow-md">
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
                      <span className="text-lg font-black text-white">₹{prod.price}</span>
                      <span className="text-[10px] text-white/40 line-through">₹{prod.originalPrice}</span>
                    </div>
                    {/* Review Info */}
                    <div className="flex items-center gap-1 text-[11px] text-white/60">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-white">{prod.rating}</span>
                      <span>({prod.reviews})</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(prod);
                      }}
                      className="rounded-full border border-white/10 bg-white/5 py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:border-[#f97316] hover:text-[#f97316] cursor-pointer text-center"
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOrderModal(prod.title);
                      }}
                      className="rounded-full bg-[#f97316] py-2 text-[10px] sm:text-[11px] font-bold text-white transition hover:bg-[#ea580c] cursor-pointer text-center"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/50 text-lg">No products match your search or filter options.</p>
            <button
              onClick={() => {
                setSelectedCategory('All Products');
                setSearchTerm('');
              }}
              className="mt-4 text-orange-400 hover:text-orange-300 font-semibold"
            >
              Clear filters
            </button>
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
                  <p className="text-xs text-white/50 mt-1">
                    Rating: {selectedProduct.rating} ({selectedProduct.reviews} verified purchases review)
                  </p>
                </div>

                {selectedProduct.image && (
                  <div className="w-full h-48 rounded-2xl overflow-hidden border border-purple-900/20">
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.title} 
                      className="w-full h-full object-cover brightness-95" 
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-extrabold text-white tracking-wider flex items-center">
                    <Star className="w-4 h-4 mr-1 text-brand-coral" />
                    Product Description
                  </h4>
                  <p className="text-xs leading-relaxed text-white/85">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-extrabold text-white tracking-wider">
                    What's Included / Key Benefits
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
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-purple-900/20 bg-[#120f1f] flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">₹{selectedProduct.price}</span>
                  <span className="text-xs text-white/40 line-through">₹{selectedProduct.originalPrice}</span>
                  <span className="text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded ml-1">50% OFF</span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1 sm:flex-initial py-2.5 px-6 border border-purple-900/40 hover:bg-white/5 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Back to Store
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      onOpenOrderModal(selectedProduct.title);
                    }}
                    className="flex-1 sm:flex-initial bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-2.5 px-8 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-brand-coral/15 cursor-pointer"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
