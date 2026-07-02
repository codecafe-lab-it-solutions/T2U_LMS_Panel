import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award, Download, Image as ImageIcon, BookOpen, Target, Heart, Globe,
  ChevronRight, Users, TrendingUp, FileText, ExternalLink, X
} from 'lucide-react';
import { api, getMediaUrl } from '../../services/api';

interface AboutPageProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

const SectionHeader = ({ badge, title, sub }: { badge: string; title: string; sub?: string }) => (
  <div className="text-center mb-12">
    <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 mb-5">
      <span className="text-violet-400 text-xs font-bold">{badge}</span>
    </div>
    <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">{title}</h2>
    {sub && <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">{sub}</p>}
  </div>
);

const milestones = [
  { year: '2020', event: 'T2Upgrade Pvt. Ltd. incorporated in Rajasthan' },
  { year: '2021', event: 'Launched first direct-selling education programme' },
  { year: '2022', event: 'Crossed 1,000 active learners across India' },
  { year: '2023', event: 'Introduced binary income system & live class platform' },
  { year: '2024', event: 'Expanded to 100+ cities; launched T2U digital platform' },
  { year: '2025', event: 'Surpassed ₹50 Lakh in earnings distributed to distributors' },
];

const values = [
  { icon: Target, title: 'Mission', text: 'Empower every Indian with high-income skills and a transparent earning opportunity through direct selling.' },
  { icon: Heart, title: 'Vision', text: "To be India's most trusted EdTech + Direct Selling platform, transforming lives one skill at a time." },
  { icon: Globe, title: 'Reach', text: 'Operating across 100+ cities in India, with a growing community of students, instructors, and distributors.' },
  { icon: BookOpen, title: 'Education First', text: 'Every product we sell is backed by genuine, market-relevant courses taught by certified instructors.' },
];

const staticCerts = [
  { name: 'MSME Registration', issuer: 'Ministry of MSME, Govt. of India', description: 'Registered Micro, Small & Medium Enterprise under MSMED Act.' },
  { name: 'Direct Selling Compliance', issuer: 'Consumer Affairs Ministry', description: 'Fully compliant with Consumer Protection (Direct Selling) Rules, 2021.' },
  { name: 'GST Registration', issuer: 'Govt. of India', description: 'Registered under Goods & Services Tax for transparent financial operations.' },
];

const staticDocuments = [
  { name: 'Company Brochure', description: 'Complete overview of T2U Platform, courses, and income plan.', file_type: 'PDF' },
  { name: 'Income Plan Document', description: 'Detailed explanation of the binary income and commission structure.', file_type: 'PDF' },
  { name: 'Direct Selling Policy', description: 'Compliance policy under Consumer Protection Rules, 2021.', file_type: 'PDF' },
  { name: 'Code of Ethics', description: 'Standards of conduct for all T2U distributors and instructors.', file_type: 'PDF' },
];

const staticGallery = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600',
];

export default function AboutPage({ onBack, onNavigateToLogin }: AboutPageProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: galleryItems = [] } = useQuery<any[]>({
    queryKey: ['cms-gallery-public'],
    queryFn: () => api.cms.gallery.list(),
    staleTime: 5 * 60 * 1000,
  });
  const galleryUrls = galleryItems.length > 0
    ? galleryItems.map((g: any) => getMediaUrl(g.image_url))
    : staticGallery;

  const { data: cmsCerts = [] } = useQuery<any[]>({
    queryKey: ['cms-certifications-public'],
    queryFn: () => api.cms.certifications.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: cmsDocs = [] } = useQuery<any[]>({
    queryKey: ['cms-documents-public'],
    queryFn: () => api.cms.documents.list(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-indigo-900/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-violet-400 text-sm font-medium">T2Upgrade Pvt. Ltd.</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-foreground leading-tight mb-6">
            About <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">T2U Platform</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            We are India's pioneering EdTech + Direct Selling company, combining world-class skill development with a transparent, government-compliant income opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors">
              Join Us Today <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={onBack}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/50 hover:bg-card text-foreground font-bold text-sm transition-colors">
              Back to Home
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 px-4 bg-muted/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: Users, value: '10,000+', label: 'Active Learners' },
            { icon: BookOpen, value: '5+', label: 'Courses Available' },
            { icon: TrendingUp, value: '₹50L+', label: 'Earnings Distributed' },
            { icon: Globe, value: '100+', label: 'Cities Covered' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-5 text-center hover:border-violet-500/40 transition-colors">
              <s.icon className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <div className="text-3xl font-black text-violet-400 mb-1 font-mono">{s.value}</div>
              <div className="text-muted-foreground text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionHeader badge="Our Journey" title="Our Story" sub="From a small initiative in Rajasthan to a nationwide EdTech + MLM platform." />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-20">
            <div className="space-y-5 text-muted-foreground leading-relaxed text-sm">
              <p>T2Upgrade Pvt. Ltd. was founded with one powerful idea: <strong className="text-foreground">financial freedom through knowledge</strong>. We noticed that millions of talented Indians lacked access to quality skill training and a legitimate income opportunity.</p>
              <p>We built T2U Platform to bridge this gap — a comprehensive ecosystem where learners gain real, market-relevant skills while building a sustainable income through our transparent direct-selling framework, fully compliant with the Consumer Protection (Direct Selling) Rules, 2021.</p>
              <p>Today, T2U serves students, instructors, and distributors across 100+ cities. Our binary income system, live class platform, and certificate programme have collectively transformed thousands of lives.</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-7 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-4 items-start relative z-10">
                  <div className="w-12 text-right shrink-0">
                    <span className="text-violet-400 font-bold text-xs font-mono">{m.year}</span>
                  </div>
                  <div className="flex flex-col items-center pt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                    {i < milestones.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[20px]" />}
                  </div>
                  <p className="text-foreground/80 text-xs leading-relaxed pb-2">{m.event}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-violet-500/40 transition-colors">
                <div className="w-11 h-11 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-foreground font-bold mb-2 text-sm">{v.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="py-20 px-4 bg-muted/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <SectionHeader badge="Our Credentials" title="Certifications & Recognitions"
            sub="Trusted, accredited, and government-compliant. Our certifications speak for our commitment to quality." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(cmsCerts.length > 0 ? cmsCerts : staticCerts).map((cert: any, i: number) => (
              <div key={cert.id ?? i} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 hover:border-amber-500/40 transition-colors">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  {cert.image_url
                    ? <img src={getMediaUrl(cert.image_url)} alt={cert.name} className="w-10 h-10 object-contain rounded-lg" />
                    : <Award className="w-6 h-6 text-amber-400" />}
                </div>
                <div>
                  <h3 className="text-foreground font-bold mb-1 text-sm">{cert.name}</h3>
                  <p className="text-violet-400 text-xs font-medium mb-2">{cert.issuer}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{cert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Documents ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <SectionHeader badge="Resources" title="Company Documents" sub="Download our brochures, policies, and official documents." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(cmsDocs.length > 0 ? cmsDocs : staticDocuments).map((doc: any, i: number) => (
              <a key={doc.id ?? i}
                href={doc.file_url ? getMediaUrl(doc.file_url) : '#'}
                target={doc.file_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl hover:border-violet-500/40 transition-colors group cursor-pointer">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-foreground font-semibold text-sm truncate">{doc.name}</h3>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{doc.file_type}</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{doc.description}</p>
                </div>
                <div className="text-muted-foreground group-hover:text-violet-400 transition-colors shrink-0">
                  <Download className="w-5 h-5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="py-20 px-4 bg-muted/20 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <SectionHeader badge="Our Moments" title="Gallery" sub="Glimpses from our events, trainings, and community milestones." />
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {galleryUrls.map((url, i) => (
              <div key={i} onClick={() => setLightbox(url)}
                className="break-inside-avoid rounded-xl overflow-hidden border border-border cursor-pointer hover:border-violet-500/50 transition-all duration-200 group">
                <img src={url} alt={`Gallery ${i + 1}`} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/30 rounded-3xl p-12">
          <h2 className="text-4xl font-black text-foreground mb-4">Be Part of Our Story</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-sm leading-relaxed">
            Join thousands of learners and distributors who are writing their own success stories with T2U Platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onNavigateToLogin}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors">
              Join as Student <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={onBack}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-border bg-card/50 hover:bg-card text-foreground font-bold text-sm transition-colors">
              Browse Courses
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Gallery" className="max-w-full max-h-full rounded-xl object-contain" />
          <button type="button" title="Close" aria-label="Close" className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
