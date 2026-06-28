import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowRight, Brain, Code, Cloud, Smartphone, TrendingUp, BarChart3, Rocket, DollarSign, Palette, PenTool, Layout, Dumbbell, Flower, Mic, CheckSquare, X, Calendar, BookOpen, CheckCircle2, Users, Laptop, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import CourseCarousel from './CourseCarousel';

const ALL_COURSES = [
  {
    id: 1,
    title: 'Spoken English Mastery',
    category: 'Language',
    description: 'Fluent, confident English for interviews, meetings, presentations, and everyday communication.',
    duration: '12 weeks',
    level: 'Beginner to Advanced',
    students: '120',
    rating: 4.9,
    icon: Mic,
    image: '/images/english.png'
  },
  {
    id: 2,
    title: 'Office Ready Skills',
    category: 'Professional Skills',
    description: '6-Month complete job preparation course covering MS Excel, Word, PowerPoint, Tally Prime, AI tools, personality development, and interview prep.',
    duration: '6 Months',
    level: 'Beginner',
    students: '140',
    rating: 4.8,
    icon: Laptop,
    image: '/images/computer-skills.png'
  },
  {
    id: 3,
    title: 'AI & Automation',
    category: 'AI Productivity',
    description: 'Build real AI workflows with ChatGPT, Gemini, n8n and no-code tools to automate tasks and save time.',
    duration: '10 weeks',
    level: 'Intermediate',
    students: '110',
    rating: 4.9,
    icon: Sparkles,
    image: '/images/ai-automatin.png'
  },
  {
    id: 4,
    title: 'Digital Marketing',
    category: 'Digital Growth',
    description: 'Run high-converting ads, optimize search visibility, and turn digital channels into real business results.',
    duration: '6 Months',
    level: 'Beginner to Intermediate',
    students: '87',
    rating: 4.7,
    icon: TrendingUp,
    image: '/images/digital skills .png'
  }
];

const CATEGORIES = [
  'All Courses',
  'Language',
  'Professional Skills',
  'AI Productivity',
  'Digital Growth'
];

const getCourseDetails = (courseTitle: string) => {
  const syllabusMap: Record<string, string[]> = {
    'Spoken English Mastery': [
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
    'Office Ready Skills': [
      "Module 1: MS Word (Documents, Formatting, Reports)",
      "Module 2: MS Excel (Formulas, VLOOKUP, PivotTables)",
      "Module 3: PowerPoint (Slide Design & Presentations)",
      "Module 4: Email & Formal Communication (Letters & Etiquette)",
      "Module 5: AI Tools for Office Productivity (ChatGPT, Copilot)",
      "Module 6: Tally Prime Accounting & GST Voucher Entries",
      "Module 7: Personality Development (Communication & Body Language)",
      "Module 8: Interview Skills (Resume Writing & HR Rounds)"
    ],
    'AI & Automation': [
      "Module 1: Advanced Prompt Engineering & Multi-LLM setup",
      "Module 2: No-Code Automation with n8n & Zapier",
      "Module 3: Custom GPTs and CrewAI Agents",
      "Module 4: Embedding AI in Google Sheets & Outlook Mailbox"
    ],
    'Digital Marketing': [
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
    ]
  };

  const featuresMap: Record<string, string[]> = {
    'Language': ["BBC Certified Trainers", "1-on-1 speaking practice nodes", "Daily peer feedback loops"],
    'Professional Skills': ["Industry Case Studies", "Certificate of Competency", "Downloadable template vault"],
    'AI Productivity': ["Live build-alongs", "Access to premium API tokens", "Weekly hackathons"],
    'Digital Growth': ["Ad Budget Funded by T2U", "Google & Meta Certified Instructors", "Client project matchmaking"]
  };

  return {
    syllabus: syllabusMap[courseTitle] || [
      'Module 1: Core Fundamentals & Concept mapping',
      'Module 2: Hands-on Practice Projects',
      'Module 3: Advanced Concepts & Optimization',
      'Module 4: Final Capstone Project & Evaluation'
    ],
    features: featuresMap[courseTitle] || [
      'Live cohort classes',
      'Verified certificate',
      '1-on-1 mentor support',
      'Mock interview practice'
    ]
  };
};

interface ExploreAllCoursesProps {
  onOpenEnrollModal?: (courseId: string) => void;
  onBackToHome?: () => void;
  onOpenBrochure: (courseId: string) => void;
}

export default function ExploreAllCourses({ onOpenEnrollModal, onBackToHome, onOpenBrochure }: ExploreAllCoursesProps) {
  const [selectedCategory, setSelectedCategory] = useState('All Courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCourse, setActiveCourse] = useState<any | null>(null);

  const filteredCourses = ALL_COURSES.filter(course => {
    const categoryMatch = selectedCategory === 'All Courses' || course.category === selectedCategory;
    const searchMatch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <section className="pt-10 pb-20 bg-[#12031e] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Link / Breadcrumb bar */}
        {onBackToHome && (
          <div className="mb-4 -mt-2 flex justify-start border-b border-white/5 pb-2">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 text-xs text-white/55 hover:text-orange-400 font-semibold transition-colors duration-300 group cursor-pointer"
            >
              <span className="text-sm group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Back to Home Page</span>
            </button>
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            Explore All Courses
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Discover hundreds of courses across multiple categories and skill levels. Find your perfect learning path today.
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
              placeholder="Search courses by name or topic..."
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
          className="mb-6 flex items-center gap-3 flex-wrap justify-center"
        >
          <Filter className="w-5 h-5 text-orange-400" />
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/40'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* 3D Course Carousel */}
        {filteredCourses.length > 0 ? (
          <CourseCarousel 
            courses={filteredCourses} 
            setActiveCourse={setActiveCourse} 
            onOpenBrochure={onOpenBrochure}
          />
        ) : (
          <div className="text-center py-20">
            <p className="text-white/50 text-lg">No courses found matching your criteria.</p>
          </div>
        )}

        {/* Results Count */}
        <div className="text-center">
          <p className="text-white/70 mb-8">
            Showing <span className="font-bold text-orange-400">{filteredCourses.length}</span> courses
          </p>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/50 text-lg">No courses found matching your criteria.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All Courses');
                  setSearchTerm('');
                }}
                className="mt-6 text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic sliding course curriculum details overlay drawer */}
      <AnimatePresence>
        {activeCourse && (() => {
          const details = getCourseDetails(activeCourse.title);
          const IconComponent = activeCourse.icon;
          return (
            <>
              {/* Centered Modal Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
              >
                <div className="flex items-center justify-center w-full">
                {/* Modal panel container */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-4xl bg-[#171421] border border-border-tan rounded-3xl shadow-2xl text-white flex flex-col"
                  style={{ maxHeight: 'calc(100vh - 2rem)' }}
                >
                  {/* Top bar - sticky */}
                  <div className="flex items-center justify-between border-b border-border-tan pb-4 mb-0 px-5 pt-5 sm:px-7 sm:pt-7 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-brand-coral/10 text-brand-coral rounded-xl">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-sans font-extrabold tracking-widest text-brand-coral uppercase px-2.5 py-1 bg-brand-coral/5 rounded-full">
                        {activeCourse.category} • Interactive Track
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveCourse(null)}
                      className="p-1.5 hover:bg-border-tan/40 rounded-full text-white transition-colors focus:ring-1 focus:ring-brand-coral cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable content area */}
                  <div className="overflow-y-auto flex-1 px-5 py-5 sm:px-7">
                  {/* Two-Column Course Detail Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* Left Column - Details & Syllabus */}
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <h3 className="text-xl sm:text-3xl font-sans font-black text-white leading-tight">
                          {activeCourse.title}
                        </h3>
                        <p className="text-sm text-muted-tan mt-1.5 leading-relaxed">
                          {activeCourse.description}
                        </p>
                      </div>

                      {/* Modules Syllabus Syllabus lists */}
                      <div className="space-y-3 pt-3 border-t border-border-tan/50">
                        <h4 className="text-xs uppercase font-extrabold text-white tracking-widest flex items-center">
                          <BookOpen className="w-4 h-4 mr-1.5 text-brand-coral" />
                          Course Syllabus (Weekly Modules)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {details.syllabus.map((m: string, mIndex: number) => (
                            <div
                              key={mIndex}
                              className="p-3 bg-[#1f1b2e] border border-border-tan rounded-xl hover:border-brand-coral/20 transition-all duration-200"
                            >
                              <p className="text-xs font-bold text-white select-none">
                                {m}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Stats & Registration */}
                    <div className="lg:col-span-5 flex flex-col justify-between self-stretch space-y-6">
                      <div className="space-y-5">
                        {/* Horizontal Meta Badges */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-border-tan/20 rounded-2xl border border-border-tan/55">
                          <div>
                            <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">
                              DURATION
                            </span>
                            <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                              <Calendar className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                              {activeCourse.duration}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-tan uppercase font-semibold block tracking-wider">
                              LEVEL
                            </span>
                            <span className="font-sans font-bold text-xs text-white flex items-center mt-1">
                              <TrendingUp className="w-3.5 h-3.5 mr-1 text-brand-coral" />
                              {activeCourse.level}
                            </span>
                          </div>
                        </div>

                        {/* Live Cohort Unique Features */}
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-extrabold text-muted-tan tracking-wider block">
                            Guaranteed Perks Included:
                          </span>
                          <ul className="space-y-1.5">
                            {details.features.map((feat: string, fIdx: number) => (
                              <li key={fIdx} className="flex items-center space-x-2 text-xs text-white font-medium">
                                <CheckCircle2 className="w-3 h-3 text-live-green shrink-0 animate-pulse" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-border-tan bg-transparent space-y-2.5 mt-auto">
                        <button
                          onClick={() => {
                            setActiveCourse(null);
                            if (onOpenEnrollModal) {
                              onOpenEnrollModal(activeCourse.id.toString());
                            }
                          }}
                          className="w-full bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-brand-coral/15 cursor-pointer"
                        >
                          <span>Apply for Enrollment</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => setActiveCourse(null)}
                          className="w-full py-3 px-6 border border-border-tan hover:bg-near-black rounded-xl text-xs font-semibold text-white tracking-wide transition-colors cursor-pointer text-center"
                        >
                          Back to Courses
                        </button>
                      </div>

                    </div>

                  </div>
                  </div>
                </motion.div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}
