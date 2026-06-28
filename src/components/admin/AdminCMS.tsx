import { useState } from 'react';
import { Globe, Star, FileText, Package, Image, Award, Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CmsTab = 'Hero' | 'Testimonials' | 'FAQs' | 'Products' | 'Gallery' | 'Certifications' | 'Documents';

const TAB_ICONS: Record<CmsTab, any> = {
  Hero: Globe, Testimonials: Star, FAQs: FileText,
  Products: Package, Gallery: Image, Certifications: Award, Documents: FileText,
};

// Initial CMS data (mirrors landing-data.ts; in production this comes from Prisma/API)
const initialHero = {
  headline: 'Upgrade Your Skills. Upgrade Your Income.',
  subheadline: 'India\'s first EdTech + Direct Selling hybrid platform. Learn. Refer. Earn.',
  cta_text: 'Get Started Now',
};

const initialTestimonials = [
  { id: 'T1', student_name: 'Aarya Garg', story_text: 'T2U changed my life! I earned ₹15,000 in my first month just by learning and sharing.', star_rating: 5, photo_url: '', is_active: true },
  { id: 'T2', student_name: 'Rohan Mehra', story_text: 'The binary MLM structure is transparent and pays on time. Highly recommended.', star_rating: 5, photo_url: '', is_active: true },
];

const initialFaqs = [
  { id: 'F1', question: 'Is T2U a legal company?', answer: 'Yes, T2U is registered under the Consumer Protection (Direct Selling) Rules, 2021 and operates fully within the law.', is_active: true },
  { id: 'F2', question: 'How do I withdraw my earnings?', answer: 'Complete your KYC verification, then submit a withdrawal request from your dashboard. Processing takes 3-5 business days.', is_active: true },
];

export default function AdminCMS() {
  const [activeTab, setActiveTab] = useState<CmsTab>('Hero');
  const [hero, setHero] = useState(initialHero);
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [faqs, setFaqs] = useState(initialFaqs);
  const [saved, setSaved] = useState<CmsTab | null>(null);

  const save = (tab: CmsTab) => {
    setSaved(tab);
    setTimeout(() => setSaved(null), 2000);
  };

  const tabs: CmsTab[] = ['Hero', 'Testimonials', 'FAQs', 'Products', 'Gallery', 'Certifications', 'Documents'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Landing Page CMS</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Edit website content: hero, testimonials, FAQs, products, gallery, certifications and documents</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = TAB_ICONS[t];
          return (
            <button key={t} type="button" onClick={() => setActiveTab(t)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === t ? 'bg-primary text-white' : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/50'}`}>
              <Icon className="w-3.5 h-3.5" />{t}
            </button>
          );
        })}
      </div>

      {/* Hero */}
      {activeTab === 'Hero' && (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Hero Section</CardTitle>
            <div className="flex items-center gap-2">
              {saved === 'Hero' && <span className="text-[10px] text-emerald-500 font-bold">Saved!</span>}
              <Button size="sm" onClick={() => save('Hero')} className="h-8 text-xs bg-primary text-white font-bold">
                <Save className="w-3.5 h-3.5 mr-1" />Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Headline</Label>
              <Input value={hero.headline} onChange={e => setHero(h => ({ ...h, headline: e.target.value }))} className="h-9 text-xs bg-muted/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">Sub Headline</Label>
              <textarea rows={2} value={hero.subheadline} onChange={e => setHero(h => ({ ...h, subheadline: e.target.value }))}
                className="w-full p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground uppercase">CTA Button Text</Label>
              <Input value={hero.cta_text} onChange={e => setHero(h => ({ ...h, cta_text: e.target.value }))} className="h-9 text-xs bg-muted/20" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testimonials */}
      {activeTab === 'Testimonials' && (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Testimonials ({testimonials.length})</CardTitle>
            <div className="flex items-center gap-2">
              {saved === 'Testimonials' && <span className="text-[10px] text-emerald-500 font-bold">Saved!</span>}
              <Button size="sm" onClick={() => setTestimonials(p => [...p, { id: 'new-' + Date.now(), student_name: '', story_text: '', star_rating: 5, photo_url: '', is_active: true }])}
                className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
                <Plus className="w-3.5 h-3.5 mr-1" />Add
              </Button>
              <Button size="sm" onClick={() => save('Testimonials')} className="h-8 text-xs bg-primary text-white font-bold">
                <Save className="w-3.5 h-3.5 mr-1" />Save All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {testimonials.map((t, i) => (
              <div key={t.id} className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Student name" value={t.student_name} onChange={e => { const n = [...testimonials]; n[i] = { ...t, student_name: e.target.value }; setTestimonials(n); }} className="h-8 text-xs bg-muted/20" />
                  <Input placeholder="Rating (1-5)" type="number" min={1} max={5} value={t.star_rating} onChange={e => { const n = [...testimonials]; n[i] = { ...t, star_rating: parseInt(e.target.value) || 5 }; setTestimonials(n); }} className="h-8 text-xs bg-muted/20" />
                </div>
                <textarea placeholder="Testimonial text..." rows={2} value={t.story_text} onChange={e => { const n = [...testimonials]; n[i] = { ...t, story_text: e.target.value }; setTestimonials(n); }}
                  className="w-full p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setTestimonials(p => p.filter((_, j) => j !== i))}
                    className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                    <Trash2 className="w-3 h-3 mr-1" />Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* FAQs */}
      {activeTab === 'FAQs' && (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">FAQs ({faqs.length})</CardTitle>
            <div className="flex items-center gap-2">
              {saved === 'FAQs' && <span className="text-[10px] text-emerald-500 font-bold">Saved!</span>}
              <Button size="sm" onClick={() => setFaqs(p => [...p, { id: 'new-' + Date.now(), question: '', answer: '', is_active: true }])}
                className="h-8 text-xs bg-muted/40 text-foreground border border-border hover:bg-muted">
                <Plus className="w-3.5 h-3.5 mr-1" />Add
              </Button>
              <Button size="sm" onClick={() => save('FAQs')} className="h-8 text-xs bg-primary text-white font-bold">
                <Save className="w-3.5 h-3.5 mr-1" />Save All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {faqs.map((f, i) => (
              <div key={f.id} className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-2">
                <Input placeholder="Question" value={f.question} onChange={e => { const n = [...faqs]; n[i] = { ...f, question: e.target.value }; setFaqs(n); }} className="h-8 text-xs bg-muted/20" />
                <textarea placeholder="Answer" rows={2} value={f.answer} onChange={e => { const n = [...faqs]; n[i] = { ...f, answer: e.target.value }; setFaqs(n); }}
                  className="w-full p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none resize-none" />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setFaqs(p => p.filter((_, j) => j !== i))}
                    className="h-6 text-[9px] font-bold px-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
                    <Trash2 className="w-3 h-3 mr-1" />Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Placeholder for other tabs */}
      {!['Hero', 'Testimonials', 'FAQs'].includes(activeTab) && (
        <Card className="border border-border bg-card">
          <CardContent className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              {(() => { const Icon = TAB_ICONS[activeTab]; return <Icon className="w-6 h-6 text-primary" />; })()}
            </div>
            <p className="text-sm font-bold text-foreground">{activeTab} CMS</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {activeTab} management requires backend integration with the Prisma database. Connect the server API to enable full CRUD operations for this section.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold">
              Requires Prisma API connection — see <code className="font-mono">server/src/routes/cms.js</code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
