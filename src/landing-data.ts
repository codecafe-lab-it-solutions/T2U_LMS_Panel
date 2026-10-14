import {
  Mic,
  Laptop,
  Sparkles,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  DollarSign,
  BarChart3,
  Layers,
  Coins,
  Gift,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  PhoneCall,
  Building2,
  Network,
  Crown,
  Palette,
  Code2,
  Smartphone,
  Globe2,
  Bot,
  Share2
} from 'lucide-react';

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  description: string;
  image: string;
  tags: string[];
  projects: string;
  students: string;
  nextBatch: string;
  ribbon?: string;
  builds: string[];
  duration: string;
  difficulty: string;
  syllabus: string[];
  features: string[];
  price?: number;
  distributorPrice?: number;
  instructor?: {
    id?: string;
    name: string;
    role: string;
    company?: string;
    avatar?: string;
    headline?: string;
    bio?: string;
  };
}

export interface IncomeStream {
  id: string;
  title: string;
  description: string;
  frequency: string;
  icon: any;
  rate: string;
}

export interface Instructor {
  name: string;
  role: string;
  company: string;
  avatar: string; // Background gradient classes or initials
}

export interface Testimonial {
  name: string;
  prevRole: string;
  newRole: string;
  quote: string;
  initials: string;
  verified: boolean;
}

export interface VideoTestimonial {
  id: string;
  studentName: string;
  courseCompleted: string;
  outcomeTag: string;
  videoUrl: string;
  posterUrl?: string;
  quote?: string;
  starRating?: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const COURSE_CATEGORIES: Course[] = [
  {
    id: "spoken-english",
    title: "Spoken English Mastery",
    subtitle: "Online Course",
    icon: Mic,
    description: "Fluent, confident English for interviews, meetings, presentations, and everyday communication.",
    image: "/images/english.png",
    tags: ["Interview Prep", "Presentations", "Business English", "Everyday Fluency"],
    projects: "15+",
    students: "120",
    nextBatch: "8th June, 2026",
    ribbon: "Scholarship Available",
    builds: ["90-day custom fluency roadmap", "Interview-ready accent training portfolio"],
    duration: "12 weeks",
    difficulty: "Beginner to Advanced",
    syllabus: [
      "Module 1: Foundation Grammar (Days 1–15)",
      "Module 2: Self Introduction (Days 6–8)",
      "Module 3: Daily Conversation (Days 16–30)",
      "Module 4: Formal Conversation (Days 31–45)",
      "Module 5: Job Interviews (Days 46–60)",
      "Module 6: Idioms, Phrases & Phrasal Verbs (Days 61–70)",
      "Module 7: Storytelling in English (Days 71–80)",
      "Module 8: Pronunciation & Fluency (Days 81–85)",
      "Module 9: Fluency Sprint & Final Revision (Days 86–90)"
    ],
    features: ["BBC Certified Trainers", "1-on-1 speaking practice nodes", "Daily peer feedback loops"]
  },
  {
    id: "office-skills",
    title: "Office Ready Skills",
    subtitle: "Professional Skills",
    icon: Laptop,
    description: "6-Month complete job preparation course covering MS Excel, Word, PowerPoint, Tally Prime, AI tools, personality development, and interview prep.",
    image: "/images/computer-skills.png",
    tags: ["Excel", "Word", "Tally", "AI Tools", "Etiquette"],
    projects: "12",
    students: "140",
    nextBatch: "20th June, 2026",
    ribbon: "Scholarship Available",
    builds: ["Real corporate office assignment scenarios", "Practical interactive Excel dashboard summaries", "Tally Prime financial bookkeeping reports"],
    duration: "6 Months",
    difficulty: "Beginner",
    syllabus: [
      "Module 1: MS Word (Documents, Formatting, Reports)",
      "Module 2: MS Excel (Formulas, VLOOKUP, PivotTables)",
      "Module 3: PowerPoint (Slide Design & Presentations)",
      "Module 4: Email & Formal Communication (Letters & Etiquette)",
      "Module 5: AI Tools for Office Productivity (ChatGPT, Copilot)",
      "Module 6: Tally Prime Accounting & GST Voucher Entries",
      "Module 7: Personality Development (Communication & Body Language)",
      "Module 8: Interview Skills (Resume Writing & HR Rounds)"
    ],
    features: ["Industry Case Studies", "Certificate of Competency", "Downloadable template vault"]
  },
  {
    id: "ai-automation",
    title: "AI & Automation",
    subtitle: "AI Productivity",
    icon: Sparkles,
    description: "Build real AI workflows with ChatGPT, Gemini, n8n and no-code tools to automate tasks and save time.",
    image: "/images/ai-automatin.png",
    tags: ["ChatGPT", "n8n", "Automation", "GenAI"],
    projects: "10",
    students: "110",
    nextBatch: "15th June, 2026",
    ribbon: "Scholarship Available",
    builds: ["5 working corporate AI automation recipes", "Personal custom AI assistant agent app"],
    duration: "10 weeks",
    difficulty: "Intermediate",
    syllabus: [
      "Module 1: Advanced Prompt Engineering & Multi-LLM setup",
      "Module 2: No-Code Automation with n8n & Zapier",
      "Module 3: Custom GPTs and CrewAI Agents",
      "Module 4: Embedding AI in Google Sheets & Outlook Mailbox"
    ],
    features: ["Live build-alongs", "Access to premium API tokens", "Weekly hackathons"]
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    subtitle: "Digital Growth",
    icon: TrendingUp,
    description: "Run high-converting ads, optimize search visibility, and turn digital channels into real business results.",
    image: "/images/digital skills .png",
    tags: ["Ads", "SEO", "Content", "WhatsApp"],
    projects: "12",
    students: "87",
    nextBatch: "25th June, 2026",
    ribbon: "Scholarship Available",
    builds: ["Fully managed live ad campaign with real INR budget", "Complete professional portfolio of 3 customer funnels"],
    duration: "6 Months",
    difficulty: "Beginner to Intermediate",
    syllabus: [
      "Module 1: Social Media Marketing (Weeks 1-2)",
      "Module 2: Google Ads (PPC) (Weeks 3-4)",
      "Module 3: Meta Ads (Facebook & Instagram) (Weeks 4-5)",
      "Module 4: Content Creation & Copywriting (Week 4)",
      "Module 5: WordPress Website Design (Weeks 5-6)",
      "Module 6: Search Engine Optimisation (SEO) (Weeks 7-9)",
      "Module 7: Funnel Building & Lead Generation (Weeks 10-11)",
      "Module 8: Client Acquisition (Week 12)",
      "Module 9: Freelancing & Agency Setup (Weeks 13-15)",
      "Module 10: AI Tools for Digital Marketing (Weeks 16-17)",
      "Module 11: Video Editing & Canva Design (Weeks 18-19)"
    ],
    features: ["Ad Budget Funded by T2U", "Google & Meta Certified Instructors", "Client project matchmaking"],
    price: 3499,
    distributorPrice: 2499,
    instructor: {
      name: "Vikram Singh",
      role: "Head of Digital Marketing",
      company: "ex-CRED",
      headline: "Performance Marketer & Growth Strategist",
      bio: "10+ years running high-scale performance marketing campaigns across Meta, Google Ads, and automated funnel architectures.",
      avatar: "bg-gradient-to-tr from-teal-400 to-emerald-600 text-white"
    }
  },
  {
    id: "canva-mastery-design",
    title: "Canva Course (Design & Visual Media)",
    subtitle: "Design & Visual Media",
    icon: Palette,
    description: "Master complete graphic design, brand kit creation, social media creatives, ad styling, thumbnail design, and commercial video editing inside Canva.",
    image: "/images/courses/canva-course.png",
    tags: ["Canva Pro", "Brand Kits", "Social Creatives", "Visual Media", "Freelance Ready"],
    projects: "18+",
    students: "155",
    nextBatch: "10th July, 2026",
    ribbon: "Most Popular Design",
    builds: ["Complete corporate brand identity kit", "Portfolio of 20 high-converting client social assets", "Editable video ad templates"],
    duration: "8 weeks",
    difficulty: "Beginner to Intermediate",
    syllabus: [
      "Module 1: Canva Pro Interface & Brand Identity Architecture",
      "Module 2: High-Converting Ad Creatives & Social Media Kits",
      "Module 3: Corporate Decks, Brochures & Print Collaterals",
      "Module 4: Short-Form Video & Motion Elements in Canva",
      "Module 5: Freelancing, Pitch Decks & Client Delivery"
    ],
    features: ["Canva Pro Workflows", "Commercial License Guidance", "Direct Freelance Client Kit"],
    price: 1999,
    distributorPrice: 1499,
    instructor: {
      name: "Divya Joshi",
      role: "Lead Creative Designer",
      company: "ex-Nykaa",
      headline: "Senior Visual Designer & Brand Strategist",
      bio: "Crafted commercial campaign identities for leading consumer brands. Specializes in scalable visual design and conversion-focused creatives.",
      avatar: "bg-gradient-to-tr from-purple-400 to-pink-600 text-white"
    }
  },
  {
    id: "vibe-coding-ai-prototyping",
    title: "Vibe Coding Course",
    subtitle: "AI-Assisted Fast Prototyping",
    icon: Code2,
    description: "Build production-ready web apps, tools, and MVPs at 10x speed using modern AI coding agents, prompt chaining, Cursor, Claude Code, and Lovable/v0.",
    image: "/images/courses/vibe-coding.png",
    tags: ["Cursor IDE", "Claude Code", "v0/Lovable", "Rapid MVP", "AI Coding"],
    projects: "8 Live Apps",
    students: "210",
    nextBatch: "12th July, 2026",
    ribbon: "Trending Track",
    builds: ["Fully responsive SaaS landing page and backend", "Multi-tenant directory application built with AI prompts", "Deployed tool on custom domain"],
    duration: "8 weeks",
    difficulty: "Beginner to Advanced",
    syllabus: [
      "Module 1: The Vibe Coding Mindset & Agent Toolchains",
      "Module 2: Rapid UI & Component Generation with Next.js/Tailwind",
      "Module 3: Instant Backend & Serverless DB Integrations",
      "Module 4: Testing, Self-Healing Code & Security Guardrails",
      "Module 5: Deploying, Domain Wiring & Launching Live MVPs"
    ],
    features: ["Live Build-Along Sessions", "Cursor Pro Prompts Vault", "SaaS Boilerplate Access"],
    price: 3499,
    distributorPrice: 2499,
    instructor: {
      name: "Ananya Iyer",
      role: "Senior AI Systems Engineer",
      company: "ex-Meesho",
      headline: "AI Systems Architect & Prompt Engineer",
      bio: "Builds autonomous LLM pipelines and AI-first engineering workflows. Passionate about empowering non-traditional coders to ship real software.",
      avatar: "bg-gradient-to-tr from-pink-500 to-rose-400 text-white"
    }
  },
  {
    id: "mobile-app-development",
    title: "Mobile App Development Course",
    subtitle: "Cross-Platform & Native",
    icon: Smartphone,
    description: "Master cross-platform mobile engineering with React Native and modern mobile toolchains. Build iOS and Android apps with offline caching, push notifications, and app store readiness.",
    image: "/images/courses/mobile-app-dev.png",
    tags: ["React Native", "Expo", "iOS & Android", "Push Notifications", "App Store"],
    projects: "6 Mobile Apps",
    students: "135",
    nextBatch: "18th July, 2026",
    ribbon: "Job Guarantee Path",
    builds: ["Cross-platform e-commerce app with cart and checkout", "Location-aware service app with map pins and live tracking", "Production app published to store"],
    duration: "14 weeks",
    difficulty: "Intermediate",
    syllabus: [
      "Module 1: Mobile UI/UX Foundations & Expo Ecosystem",
      "Module 2: Component Architecture, Tabs & Stack Navigation",
      "Module 3: Device APIs, Camera, Geolocation & Push Notifications",
      "Module 4: Offline SQLite Storage & Real-Time Backend Sync",
      "Module 5: Store Publishing, In-App Purchases & Monetization"
    ],
    features: ["Publishing on Google Play & App Store", "Device Testing Sandbox", "Portfolio Review"],
    price: 4999,
    distributorPrice: 3999,
    instructor: {
      name: "Rahul Verma",
      role: "Senior Mobile Architect",
      company: "ex-Flipkart",
      headline: "Mobile Engineering Lead & Native Specialist",
      bio: "Shipped consumer mobile applications with over 10M+ downloads. Expert in React Native performance tuning and cross-platform architecture.",
      avatar: "bg-gradient-to-tr from-sky-400 to-blue-600 text-white"
    }
  },
  {
    id: "fullstack-website-development",
    title: "Website Development Course",
    subtitle: "Modern Full-Stack Technologies",
    icon: Globe2,
    description: "Complete full-stack web development from semantic HTML5 and modern React to Node.js, Express, PostgreSQL, and scalable cloud deployments.",
    image: "/images/courses/website-development.png",
    tags: ["HTML5/CSS3", "React", "Node.js", "PostgreSQL", "Full Stack"],
    projects: "10 Full-Stack Projects",
    students: "290",
    nextBatch: "5th July, 2026",
    ribbon: "Flagship Career Track",
    builds: ["Interactive client portfolio website", "Full-stack LMS portal with auth and database", "Production e-commerce store with payments"],
    duration: "16 weeks",
    difficulty: "Beginner to Advanced",
    syllabus: [
      "Module 1: Semantic HTML5, CSS Grid & Responsive Layouts",
      "Module 2: Modern JavaScript ES6+, Async & DOM APIs",
      "Module 3: React Architecture, Custom Hooks & Tailwind CSS",
      "Module 4: RESTful APIs with Node.js, Express & JWT Auth",
      "Module 5: Relational Data Modeling with PostgreSQL & Prisma",
      "Module 6: Cloud Deployment, Docker & Capstone Delivery"
    ],
    features: ["Industry Code Reviews", "Verifiable GitHub Capstone", "Placement Assistance"],
    price: 4999,
    distributorPrice: 3999,
    instructor: {
      name: "Rohan Sharma",
      role: "Lead Full-Stack Architect",
      company: "ex-Razorpay",
      headline: "Full-Stack Engineer & Cloud Architect",
      bio: "12+ years architecting high-throughput distributed systems and modern web interfaces. Mentored 3,000+ developers in production full-stack engineering.",
      avatar: "bg-gradient-to-tr from-orange-400 to-amber-500 text-white"
    }
  },
  {
    id: "agentic-ai-development",
    title: "Agentic AI Development Course",
    subtitle: "Autonomous AI Agents & Workflows",
    icon: Bot,
    description: "Design and deploy multi-agent autonomous systems using LangChain, CrewAI, AutoGen, Model Context Protocol (MCP), tool execution, and memory stores.",
    image: "/images/courses/agentic-ai.png",
    tags: ["Agentic AI", "CrewAI", "LangChain", "MCP Protocol", "Multi-Agent"],
    projects: "5 Autonomous Systems",
    students: "175",
    nextBatch: "15th July, 2026",
    ribbon: "Next-Gen Tech",
    builds: ["Multi-agent market research swarm with web browser tools", "Autonomous coding and test-fixing bot with sandbox execution", "Production MCP server for enterprise workflows"],
    duration: "12 weeks",
    difficulty: "Advanced",
    syllabus: [
      "Module 1: Agentic Foundations, Cognitive Loops & MCP Protocol",
      "Module 2: Multi-Agent Coordination with CrewAI & LangGraph",
      "Module 3: Vector Databases, RAG Workflows & Long-Term Memory",
      "Module 4: Browser Subagents, Tool Sandboxes & Tool Calling",
      "Module 5: Enterprise Agent Swarms, Evaluation & Guardrails"
    ],
    features: ["Premium LLM Token Grants", "Enterprise Agent Blueprints", "Private AI Hackathon"],
    price: 5999,
    distributorPrice: 4499,
    instructor: {
      name: "Sneha Reddy",
      role: "Principal AI Researcher",
      company: "ex-Zoho",
      headline: "Autonomous Systems Lead & LLM Specialist",
      bio: "Specializes in multi-agent orchestration, tool integration protocols, and reliable agent evaluations. Author of open-source agent tooling.",
      avatar: "bg-gradient-to-tr from-emerald-400 to-yellow-500 text-white"
    }
  },
  {
    id: "affiliate-marketing-mastery",
    title: "Affiliate Marketing Course",
    subtitle: "Digital Growth & Funnels",
    icon: Share2,
    description: "Build sustainable digital revenue streams. Master high-converting funnels, organic SEO traffic, paid traffic arbitrage, email marketing, and affiliate networks.",
    image: "/images/courses/affiliate-marketing.png",
    tags: ["Affiliate Marketing", "Funnels", "SEO Traffic", "Ad Arbitrage", "Passive Revenue"],
    projects: "4 Live Monetized Funnels",
    students: "195",
    nextBatch: "8th July, 2026",
    ribbon: "High Earning Potential",
    builds: ["Complete high-converting affiliate bridge page", "Automated 7-day email follow-up sequence", "Live profitable Google/Meta ad campaign"],
    duration: "10 weeks",
    difficulty: "Beginner to Intermediate",
    syllabus: [
      "Module 1: Affiliate Business Architecture & High-Yield Niches",
      "Module 2: High-Converting Bridge Pages & Funnel Optimization",
      "Module 3: Organic Traffic Engines (SEO, YouTube & Reels)",
      "Module 4: Paid Traffic Arbitrage with Google & Meta Ads",
      "Module 5: Email Automation, Retargeting & 6-Figure Scaling"
    ],
    features: ["Proven Funnel Templates", "Ad Copy Swipe Files", "Live Campaign Review"],
    price: 2499,
    distributorPrice: 1799,
    instructor: {
      name: "Karan Malhotra",
      role: "Head of Growth & Monetization",
      company: "14+ Yrs Industry Veteran",
      headline: "Performance Growth Mentor & Direct Seller",
      bio: "Generated over $2M in affiliate and direct-selling revenues across international markets. Expert in funnel unit economics and high-retention community building.",
      avatar: "bg-gradient-to-tr from-red-400 to-orange-500 text-white"
    }
  }
];

export const INCOME_STREAMS: IncomeStream[] = [
  {
    id: "direct-referral",
    title: "Direct Referral Income",
    description: "Earn a high-percentage commission on every direct referral's purchase. No limits, no complex conditions.",
    frequency: "Daily Payout",
    icon: DollarSign,
    rate: "15% - 20%"
  },
  {
    id: "level-income",
    title: "Level Income",
    description: "Get a commission on the visual learning purchases of your multi-generational downline, deep up to 7 levels.",
    frequency: "Daily Payout",
    icon: Layers,
    rate: "Up to 10% across levels"
  },
  {
    id: "matching-bonus",
    title: "Matching Bonus (Binary)",
    description: "Build robust Left and Right team legs. Earn matching bonuses based on balanced business volumes.",
    frequency: "Weekly Payout",
    icon: Network,
    rate: "10% matching BV"
  },
  {
    id: "reward-income",
    title: "Reward Income",
    description: "Hit cumulative Business Volume milestone targets and unlock tiered executive awards (Smartphones to SUVs).",
    frequency: "Next Monthly Cycle",
    icon: Gift,
    rate: "Rewards up to ₹25 Lakhs"
  },
  {
    id: "fund-bonus",
    title: "Fund Bonus",
    description: "Special monthly allocations of direct company turnover pools distributed to high-achieving leaders.",
    frequency: "Monthly Payout",
    icon: Coins,
    rate: "Active Club Bonuses"
  },
  {
    id: "royalty-income",
    title: "Royalty Income",
    description: "Achieve top ranks and lock in lifetime royalty share from the global T2U e-commerce volume pools.",
    frequency: "Monthly Payout",
    icon: Crown,
    rate: "2% Company Turnover Share"
  }
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enroll & Learn",
    description: "Pick your specialized, high-income skill track. Attend interactive, live online sessions, complete assignments, clear your doubts, and gain a globally verifiable digital certificate."
  },
  {
    step: "02",
    title: "Apply & Build",
    description: "Assemble portfolio-grade projects in real time. Work alongside your instructor and cohort to create actual dashboards, write software, publish ads, and test mock conversations."
  },
  {
    step: "03",
    title: "Refer & Earn",
    description: "Use your dynamic referral link within our app. Generate direct and team incentives instantly as people level up their skills. Monitor your compounding payouts transparently in real-time."
  }
];

export const INSTRUCTORS: Instructor[] = [
  { name: "Rohan Sharma", role: "Lead Product Manager", company: "Razorpay", avatar: "bg-gradient-to-tr from-orange-400 to-amber-500 text-white" },
  { name: "Ananya Iyer", role: "Senior AI Engineer", company: "Meesho", avatar: "bg-gradient-to-tr from-pink-500 to-rose-400 text-white" },
  { name: "Vikram Singh", role: "Head of Digital Marketing", company: "CRED", avatar: "bg-gradient-to-tr from-teal-400 to-emerald-600 text-white" },
  { name: "Priya Menon", role: "Spoken English Coach", company: "BBC Certified", avatar: "bg-gradient-to-tr from-blue-400 to-indigo-600 text-white" },
  { name: "Arjun Kapoor", role: "Excel & analytics Lead", company: "Deloitte", avatar: "bg-gradient-to-tr from-indigo-500 to-purple-500 text-white" },
  { name: "Sneha Reddy", role: "Automation Architect", company: "Zoho", avatar: "bg-gradient-to-tr from-emerald-400 to-yellow-500 text-white" },
  { name: "Karan Malhotra", role: "Founder & Sales Mentor", company: "14+ Yrs Experience", avatar: "bg-gradient-to-tr from-red-400 to-orange-500 text-white" },
  { name: "Divya Joshi", role: "Performance Marketer", company: "Nykaa", avatar: "bg-gradient-to-tr from-purple-400 to-pink-600 text-white" },
  { name: "Rahul Verma", role: "Senior SDE", company: "Flipkart", avatar: "bg-gradient-to-tr from-sky-400 to-blue-600 text-white" },
  { name: "Meera Nair", role: "Communications Coach", company: "IIM-B Alumna", avatar: "bg-gradient-to-tr from-cyan-400 to-teal-600 text-white" },
  { name: "Aditya Pandey", role: "Growth & SEO Lead", company: "Razorpay", avatar: "bg-gradient-to-tr from-amber-500 to-yellow-600 text-white" },
  { name: "Shruti Bansal", role: "Network Leadership Coach", company: "Top 1% Achiever", avatar: "bg-gradient-to-tr from-fuchsia-500 to-orange-600 text-white" }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Rakesh Yadav",
    prevRole: "Junior Office Assistant",
    newRole: "Branch Coordinator at Jaipur Logistics",
    quote: "Thanks to the Office-Ready Skills and Spoken English tracks, I went from a basic data entry job to coordinating our whole branch operations. My salary jumped by more than 80%! The practical live Excel templates were exactly what they asked me to present in interviews.",
    initials: "RY",
    verified: true
  },
  {
    name: "Priyanka Saxena",
    prevRole: "Homemaker",
    newRole: "Digital Marketer & T2U Team Lead",
    quote: "I was looking for ways to support my family while staying home. T2U gave me top-tier marketing skills and a platform to earn side income immediately. Last month, I made ₹35,000 from marketing services and the T2U referral wallet combined. It's been life-changing.",
    initials: "PS",
    verified: true
  },
  {
    name: "Mohammed Faizal",
    prevRole: "College BCA Student",
    newRole: "AI Engineering Intern (Remote)",
    quote: "Most colleges don't teach AI automation. The AI course track here taught me n8n workflows and custom prompt engineering models. Showing my live portfolio projects got me hired as an intern in my final semester. It is absolutely practical.",
    initials: "MF",
    verified: true
  },
  {
    name: "Sunita Kumari",
    prevRole: "Local Parlour Owner",
    newRole: "Business growth expert",
    quote: "I ran a beauty salon but struggled to find clients. The WhatsApp marketing and Google Ads tracks helped me double my bookings in Jaipur. I also built a 50-person Team of people who refer T2U courses of smart learners, generating a steady second Income you earn without active work.",
    initials: "SK",
    verified: true
  }
];

export const FAQS: FAQItem[] = [
  {
    id: "q_intro",
    category: "General",
    question: "What is T2U — Time to Upgrade?",
    answer: "T2U is a platform where you can learn high-income skills and earn money through our referral system at the same time.\n\nT2U एक ऐसा प्लेटफॉर्म है जहां आप नए और ज़रूरी स्किल्स सीख सकते हैं और साथ ही हमारे रेफरल सिस्टम के ज़रिए पैसे भी कमा सकते हैं।"
  },
  {
    id: "q1",
    category: "KYC & Payouts",
    question: "Is KYC mandatory for referring others or withdrawing payments?",
    answer: "Yes, KYC verification is strictly mandatory for everyone. Before you can refer users or withdraw any referral commission to your bank account, you must upload your PAN Card and link your Bank Account details.\n\nहाँ, KYC वेरिफिकेशन सभी के लिए बिल्कुल ज़रूरी है। जब तक आप अपना PAN Card अपलोड नहीं करेंगे और Bank Account लिंक नहीं करेंगे, तब तक आप किसी को रेफर नहीं कर पाएंगे और न ही अपना कमीशन बैंक में ले पाएंगे।"
  },
  {
    id: "q2",
    category: "KYC & Payouts",
    question: "Why do I need to submit my PAN card details?",
    answer: "We follow strict Government of India compliance rules for digital payouts. We deduct legal TDS from commissions, for which a PAN card is required to link with your tax records.\n\nपैन कार्ड (PAN card) डिटेल्स देना इसलिए ज़रूरी है क्योंकि हम भारत सरकार के नियमों का पालन करते हैं। आपके कमाए गए कमीशन पर जो टैक्स (TDS) कटता है, वह सीधे आपके पैन कार्ड से लिंक हो जाता है।"
  },
  {
    id: "q3",
    category: "Refer & Earn",
    question: "How does the Refer and Earn system work?",
    answer: "You get a unique referral code inside the T2U App. When your friends download the app and enroll in any skill track using your link, you instantly get a 15% to 20% direct referral commission.\n\nआपको T2U App के अंदर एक खास रेफरल कोड मिलेगा। जब आपके दोस्त उस लिंक से ऐप डाउनलोड करेंगे और कोई भी कोर्स खरीदेंगे, तो आपको तुरंत 15% से 20% तक का डायरेक्ट रेफरल कमीशन मिल जाएगा।"
  },
  {
    id: "q4",
    category: "Refer & Earn",
    question: "Can I earn commissions from my team's referrals too?",
    answer: "Yes! T2U has a multi-level team network setup. You earn smaller commissions from referrals made by your team members up to 7 levels deep, along with weekly matching bonuses.\n\nजी हाँ! आप अपनी पूरी टीम के रेफरल्स से भी कमा सकते हैं। जब आपकी टीम के लोग आगे किसी को जॉइन कराएंगे, तो आपको 7 लेवल तक छोटा कमीशन और वीकली मैचिंग बोनस भी मिलेगा।"
  }
];

export const PARTNERS_LOGOS = [
  "Razorpay", "Flipkart", "Meesho", "CRED", "Nykaa", "Zoho",
  "Swiggy", "PhonePe", "Paytm", "Unacademy", "upGrad",
  "Zerodha", "Ola", "Urban Company", "BYJU'S"
];

export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    id: "vt-1",
    studentName: "Aman Verma",
    courseCompleted: "Agentic AI Development Course",
    outcomeTag: "Hired as AI Automation Lead • ₹12 LPA",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    posterUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    quote: "Building autonomous agents with CrewAI and MCP gave me the exact portfolio proof to crack my new AI lead role.",
    starRating: 5
  },
  {
    id: "vt-2",
    studentName: "Simran Kaur",
    courseCompleted: "Vibe Coding Course",
    outcomeTag: "Launched Micro-SaaS • 250+ Paying Users",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    posterUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    quote: "I had zero prior coding background. With Cursor and Claude Code, I shipped my first live SaaS tool in just 3 weeks.",
    starRating: 5
  },
  {
    id: "vt-3",
    studentName: "Deepak Sharma",
    courseCompleted: "Website Development Course",
    outcomeTag: "Freelance Web Dev • ₹85,000/month",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    posterUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    quote: "From basic HTML to real full-stack web apps with React and PostgreSQL. T2U's hands-on projects made all the difference.",
    starRating: 5
  },
  {
    id: "vt-4",
    studentName: "Pooja Choudhary",
    courseCompleted: "Canva Course (Design & Visual Media)",
    outcomeTag: "Creative Director at Digital Agency",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    posterUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    quote: "Mastering brand kits, commercial ad creatives and video editing in Canva turned my hobby into a high-paying career.",
    starRating: 5
  }
];
