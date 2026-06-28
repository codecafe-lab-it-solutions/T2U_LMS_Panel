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
  Crown
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
    features: ["Ad Budget Funded by T2U", "Google & Meta Certified Instructors", "Client project matchmaking"]
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
