import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQS, FAQItem } from '../../landing-data';
import { ChevronDown, Search, HelpCircle, Sparkles } from 'lucide-react';

export default function FaqAccordion() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const filteredFaqs = FAQS;

  const toggleAccordion = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-24 bg-white bg-dot-pattern-dark border-t border-b border-gray-200 text-black scroll-mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Section Title */}
        <div className="text-center mb-16">
          <span className="text-sm uppercase font-extrabold tracking-widest text-brand-coral bg-brand-coral/10 px-3 py-1.5 rounded-full">
            Answers Hub
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-bold tracking-tight mt-4">
            Questions, answered.
          </h2>
          <p className="text-base sm:text-lg text-muted-tan mt-2 max-w-lg mx-auto">
            Everything you need to know about the skill tracks, commissions schedule, GST invoices, and App usage.
          </p>
        </div>

        {/* FAQs listing accordions */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="bg-near-black border border-border-tan card-border-strong hover:border-brand-coral/20 rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full p-5 text-left flex items-center justify-between space-x-4 hover:bg-border-tan/10 transition-colors"
                    >
                      <span className="text-sm sm:text-base font-bold text-dark-charcoal">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-tan shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-brand-coral' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-2 font-hindi text-[15px] sm:text-base text-white/95 leading-[1.8] font-medium border-t border-border-tan/30 bg-border-tan/5 whitespace-pre-wrap">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-border-tan/10 rounded-2xl border border-border-tan">
                <span className="text-sm font-mono text-muted-tan">
                  No matching Q&As found. Try typing another query.
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

