import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award, Download, BookOpen, Target, Heart, Globe,
  ChevronRight, Users, TrendingUp, FileText, X,
  CheckCircle2, Sparkles, ShieldCheck, ArrowRight, Code, Laptop,
  Cpu, Rocket, Briefcase
} from 'lucide-react';
import { api, getMediaUrl } from '../../services/api';

interface AboutPageProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

const SectionHeader = ({ badge, title, sub }: { badge: string; title: string; sub?: string }) => (
  <div className="text-center mb-12 sm:mb-16">
    <div className="inline-flex items-center gap-2 bg-[#f97316]/10 border border-[#f97316]/30 rounded-full px-4 py-1.5 mb-4">
      <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
      <span className="text-[#f97316] text-xs font-black uppercase tracking-widest">{badge}</span>
    </div>
    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">{title}</h2>
    {sub && <p className="text-white/70 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">{sub}</p>}
  </div>
);

const milestones = [
  { year: '2020', title: 'Foundation in Rajasthan', event: 'T2Upgrade Pvt. Ltd. incorporated in Lunkaransar, Rajasthan with a clear charter to bridge the regional employability divide.' },
  { year: '2021', title: 'Curriculum Launch', event: 'Launched foundational communication and office skills tracks taught by verified industry coaches.' },
  { year: '2022', title: 'Ecosystem Scale', event: 'Crossed 1,000 active learners and launched our transparent peer incentive and community reward framework.' },
  { year: '2023', title: 'Live Mentorship Nodes', event: 'Introduced live interactive batches, real-time code reviews, and structured LMS modules with digital certificates.' },
  { year: '2024', title: '100+ Cities Milestone', event: 'Scaled to 100+ Indian tier-2 and tier-3 cities; modern full-stack web and digital marketing curricula added.' },
  { year: '2025', title: 'AI & Modern Upskilling', event: 'Integrated Agentic AI, Vibe Coding, and Autonomous workflows into our core catalogue with 10,000+ empowered learners.' },
];

const upskillingPillars = [
  {
    icon: Laptop,
    title: 'Applied Project Curriculum',
    desc: 'No passive lectures. Every learner builds portfolio-grade dashboards, apps, ad funnels, and real client assets from day one.'
  },
  {
    icon: Users,
    title: 'Practitioner-Led Mentorship',
    desc: 'Learn directly from active engineers, creative directors, and growth marketers who work in top Indian tech hubs.'
  },
  {
    icon: TrendingUp,
    title: 'Ethical Earning Ecosystem',
    desc: 'Legitimate, government-compliant referral commissions and matching bonuses enable students to earn while they upgrade.'
  },
  {
    icon: ShieldCheck,
    title: 'Verifiable Certification',
    desc: 'QR-coded, tamper-proof digital certificates recognized by hiring networks and verified against rigorous capstone submissions.'
  },
];

const values = [
  { icon: Target, title: 'Our Mission', text: 'Empower millions of Indian learners with job-ready tech, design, and growth skills while delivering transparent, compliant financial growth.' },
  { icon: Heart, title: 'Our Vision', text: "To be India's premier practical upskilling and distributed career acceleration platform, removing geographic barriers to top incomes." },
  { icon: Globe, title: 'Nationwide Footprint', text: 'Active in 100+ cities with a vibrant community of passionate learners, industry instructors, and growth affiliates.' },
  { icon: BookOpen, title: 'Zero Theory Fluff', text: 'Every lesson maps directly to demonstrable skills, interview assignments, and productive real-world outputs.' },
];

const staticCerts = [
  { name: 'MSME Registration', issuer: 'Ministry of MSME, Govt. of India', description: 'Registered Micro, Small & Medium Enterprise promoting skill development under MSMED Act.' },
  { name: 'Direct Selling Compliance', issuer: 'Consumer Affairs Ministry', description: 'Fully compliant with Consumer Protection (Direct Selling) Rules, 2021.' },
  { name: 'GST & Corporate Entity', issuer: 'Govt. of India (Rajasthan)', description: 'Registered corporate entity U80902RJ2026PTC095114 with GSTIN 08AAACC4915X2Z7.' },
];

const staticDocuments = [
  { name: 'Company & LMS Overview Brochure', description: 'Comprehensive guide to T2U courses, learning paths, and digital credentials.', file_type: 'PDF' },
  { name: 'Affiliate & Earning Compensation Plan', description: 'Detailed, transparent breakdown of binary volumes, referral incentives, and payout schedules.', file_type: 'PDF' },
  { name: 'Ethical Direct Selling Policy', description: 'Corporate compliance framework under Consumer Protection Rules, 2021.', file_type: 'PDF' },
  { name: 'Learner Code of Conduct & Ethics', description: 'Standards of academic integrity and community collaboration across all portals.', file_type: 'PDF' },
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
    <div className="min-h-screen bg-[#12031e] text-white selection:bg-[#f97316] selection:text-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-[#12031e] to-[#12031e] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-orange-500/15 via-violet-600/15 to-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/15 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white/80 text-xs font-bold tracking-wide">T2U — Time To Upgrade Pvt. Ltd.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.08] tracking-tight mb-6">
            Equipping India's Next Generation with{' '}
            <span className="bg-gradient-to-r from-[#f97316] via-amber-400 to-rose-400 bg-clip-text text-transparent">
              High-Income Skills
            </span>
          </h1>

          <p className="text-base sm:text-xl text-white/75 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            We are India's forward-looking EdTech and career enablement ecosystem. We bridge the gap between academic theory and workplace reality through applied tech, creative design, AI workflows, and ethical financial opportunities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#f97316] to-amber-500 hover:from-[#ea580c] hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Start Learning Now <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm backdrop-blur-sm transition-colors"
            >
              Browse Course Catalogue
            </button>
          </div>
        </div>
      </section>

      {/* ── Impact Metrics Strip ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#1a072b] border-b border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: Users, value: '10,000+', label: 'Active Learners Trained', sub: 'Across 100+ Indian cities' },
            { icon: BookOpen, value: '10+', label: 'Modern Skill Tracks', sub: 'From Vibe Coding to Design' },
            { icon: TrendingUp, value: '₹50 Lakh+', label: 'Commissions Distributed', sub: 'Transparent daily & weekly cycles' },
            { icon: ShieldCheck, value: '100% Legal', label: 'Government Compliant', sub: 'Consumer Protection 2021 Rules' },
          ].map(s => (
            <div key={s.label} className="bg-[#1e0d2f] border border-white/10 rounded-2xl p-5 sm:p-6 text-center hover:border-orange-500/40 transition-colors shadow-lg shadow-black/20">
              <s.icon className="w-6 h-6 text-[#f97316] mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-black text-white mb-1 font-mono">{s.value}</div>
              <div className="text-white font-bold text-xs sm:text-sm">{s.label}</div>
              <div className="text-white/50 text-[11px] mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4 Core Upskilling Pillars ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            badge="The T2U Method"
            title="Built for Practical Competence"
            sub="Traditional degrees leave graduates unprepared for modern roles. Here is how our model delivers immediate job readiness."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {upskillingPillars.map((p, i) => (
              <div
                key={p.title}
                className="bg-[#1e0d2f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-violet-500/20 border border-white/15 flex items-center justify-center text-orange-400 mb-5 group-hover:scale-105 transition-transform">
                    <p.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed">{p.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-bold text-orange-400 font-mono">
                  <span>Pillar 0{i + 1}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Narrative & Journey Timeline ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#180527] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            badge="Our Story"
            title="From Grassroots Need to Nationwide Engine"
            sub="Born out of the conviction that quality education should directly produce earning capacity."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-5 text-white/75 text-sm sm:text-base leading-relaxed">
              <p>
                T2Upgrade Pvt. Ltd. was incorporated in Rajasthan with a singular mission: <strong className="text-white font-semibold">financial independence through practical mastery</strong>. Too many talented learners across small towns and cities were left behind by outdated academic curricula.
              </p>
              <p>
                We engineered an end-to-end platform that combines <strong className="text-white font-semibold">practitioner-taught courses</strong> (Website Development, Vibe Coding, Agentic AI, Digital Marketing, Office Automation, Spoken English) with a fully compliant, high-incentive referral structure under the Consumer Protection (Direct Selling) Rules, 2021.
              </p>
              <p>
                Learners don't just gain certificates—they gain income streams, client pitches, live portfolio links, and lifelong peer networks.
              </p>
              <div className="pt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Registered Indian Entity</h4>
                    <p className="text-[11px] text-white/60">Ward No. 18, Mochiyon Ka Mohalla, Lunkaransar, Rajasthan</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="lg:col-span-7 bg-[#1e0d2f] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              {milestones.map((m, i) => (
                <div key={m.year} className="flex gap-4 sm:gap-6 items-start relative z-10 group">
                  <div className="w-14 sm:w-16 text-right shrink-0 pt-0.5">
                    <span className="text-orange-400 font-extrabold text-xs sm:text-sm font-mono block">{m.year}</span>
                  </div>
                  <div className="flex flex-col items-center pt-1.5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 ring-4 ring-orange-500/20 group-hover:scale-125 transition-transform" />
                    {i < milestones.length - 1 && <div className="w-px flex-1 bg-white/15 my-2 min-h-[30px]" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <h4 className="text-sm font-bold text-white mb-1">{m.title}</h4>
                    <p className="text-xs text-white/70 leading-relaxed">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Institutional Values ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            badge="Guiding Values"
            title="What Governs Our Operations"
            sub="Transparency, compliance, and learner success are baked into every line of code and compensation payout."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-[#1e0d2f] border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 transition-colors">
                <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-orange-400 mb-4">
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="text-white font-bold mb-2 text-sm">{v.title}</h3>
                <p className="text-white/65 text-xs leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certifications & Accreditations ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#180527] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            badge="Government & Regulatory Compliance"
            title="Certifications & Accreditations"
            sub="We maintain complete financial, taxation, and legal compliance under Government of India standards."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(cmsCerts.length > 0 ? cmsCerts : staticCerts).map((cert: any, i: number) => (
              <div key={cert.id ?? i} className="bg-[#1e0d2f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-orange-500/40 transition-colors shadow-lg">
                <div>
                  <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center mb-5 text-orange-400">
                    {cert.image_url
                      ? <img src={getMediaUrl(cert.image_url)} alt={cert.name} className="w-10 h-10 object-contain rounded-lg" />
                      : <Award className="w-6 h-6" />}
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">{cert.name}</h3>
                  <p className="text-orange-400 text-xs font-semibold mb-2">{cert.issuer}</p>
                  <p className="text-white/65 text-xs leading-relaxed">{cert.description}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Fully Verified Entity
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Company Documents & Downloads ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            badge="Official Publications"
            title="Download Official Documents"
            sub="Access verified policy documents, curriculum outlines, and compensation guidelines."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(cmsDocs.length > 0 ? cmsDocs : staticDocuments).map((doc: any, i: number) => (
              <a
                key={doc.id ?? i}
                href={doc.file_url ? getMediaUrl(doc.file_url) : '#'}
                target={doc.file_url ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-[#1e0d2f] border border-white/10 rounded-2xl hover:border-orange-500/50 hover:bg-white/5 transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 bg-white/5 border border-white/15 rounded-xl flex items-center justify-center shrink-0 text-orange-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-bold text-sm truncate">{doc.name}</h3>
                    <span className="text-[10px] text-orange-400/90 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded-full shrink-0">{doc.file_type}</span>
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{doc.description}</p>
                </div>
                <div className="text-white/40 group-hover:text-orange-400 transition-colors shrink-0">
                  <Download className="w-5 h-5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Gallery ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#180527] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            badge="Learner Moments"
            title="Community In Action"
            sub="Snapshots from live workshops, offline leadership meets, and student cohorts."
          />
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {galleryUrls.map((url, i) => (
              <div
                key={i}
                onClick={() => setLightbox(url)}
                className="break-inside-avoid rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-orange-500/50 hover:shadow-lg transition-all duration-200 group relative"
              >
                <img src={url} alt={`Community ${i + 1}`} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-orange-600/30 via-violet-900/40 to-amber-600/30 border border-orange-500/30 rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">Your Career Upgrade Starts Today</h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Join thousands of smart Indian learners who have acquired in-demand digital competencies and built predictable financial independence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#f97316] to-amber-500 hover:from-[#ea580c] hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-orange-500/30 transition-transform hover:-translate-y-0.5"
            >
              Sign Up as Student <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
            >
              Explore Course Catalogue
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Gallery" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/20" />
          <button type="button" title="Close" aria-label="Close" className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
