import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BookOpen, Calendar, HelpCircle, AlertCircle, ChevronRight, Award, 
  Map, MessageCircle, FileText, Briefcase, Smile, Sparkles, Volume2, 
  ChevronLeft, ClipboardList, Info, TrendingUp, Globe, Layers, Filter, Palette
} from 'lucide-react';

interface BrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string | number | null;
}

export default function BrochureModal({ isOpen, onClose, courseId }: BrochureModalProps) {
  const [activeTab, setActiveTab] = useState<string>('about');

  useEffect(() => {
    setActiveTab('about');
  }, [courseId]);

  if (!isOpen) return null;

  const isSpokenEnglish = courseId === 'spoken-english' || courseId === '1' || courseId === 1;
  const isDigitalMarketing = courseId === 'digital-marketing' || courseId === '4' || courseId === 4;
  const isOfficeSkills = courseId === 'office-skills' || courseId === 'office-ready-skills' || courseId === '2' || courseId === 2;

  const spokenEnglishTabs = [
    { id: 'about', label: 'Overview & Roadmap', icon: Info },
    { id: 'mod1', label: 'Mod 1: Grammar', icon: FileText },
    { id: 'mod2', label: 'Mod 2: Self Intro', icon: Smile },
    { id: 'mod3', label: 'Mod 3: Daily Conversation', icon: MessageCircle },
    { id: 'mod4', label: 'Mod 4: Formal English', icon: Briefcase },
    { id: 'mod5', label: 'Mod 5: Interviews', icon: Award },
    { id: 'mod6', label: 'Mod 6: Idioms & Verbs', icon: Sparkles },
    { id: 'mod7', label: 'Mod 7: Storytelling', icon: BookOpen },
    { id: 'mod8', label: 'Mod 8: Pronunciation', icon: Volume2 },
    { id: 'mod9', label: 'Mod 9: Sprint & Review', icon: ClipboardList },
  ] as const;

  const digitalMarketingTabs = [
    { id: 'about', label: 'Overview & Roadmap', icon: Info },
    { id: 'mod1_3', label: 'Mod 1–3: Traffic & Ads', icon: TrendingUp },
    { id: 'mod4_6', label: 'Mod 4–6: Web & SEO', icon: Globe },
    { id: 'mod7_9', label: 'Mod 7–9: Funnels & Agency', icon: Layers },
    { id: 'mod10_11', label: 'Mod 10–11: AI & Design', icon: Sparkles },
  ] as const;

  const officeSkillsTabs = [
    { id: 'about', label: 'Overview & Roadmap', icon: Info },
    { id: 'mod1_2', label: 'Mod 1–2: Word & Excel', icon: FileText },
    { id: 'mod3_4', label: 'Mod 3–4: PPT & Communication', icon: MessageCircle },
    { id: 'mod5_6', label: 'Mod 5–6: AI & Tally Prime', icon: Sparkles },
    { id: 'mod7_8', label: 'Mod 7–8: Career & Interviews', icon: Award },
  ] as const;

  const currentTabs = isSpokenEnglish 
    ? spokenEnglishTabs 
    : isDigitalMarketing 
      ? digitalMarketingTabs 
      : isOfficeSkills
        ? officeSkillsTabs
        : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/95 backdrop-blur-md"
        />

        {/* Modal card body */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-[#0f0a1c] border border-purple-900/50 w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl relative z-10 text-white flex flex-col overflow-hidden"
        >
          {/* Top Header Row */}
          <div className="p-5 border-b border-purple-900/30 flex items-center justify-between bg-[#150f28]">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-coral/10 text-brand-coral rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white leading-none">
                  {isSpokenEnglish 
                    ? 'ADVANCED SPOKEN ENGLISH COMPLETE COURSE BOOK' 
                    : isDigitalMarketing 
                      ? 'ADVANCED DIGITAL MARKETING COMPLETE COURSE BOOK' 
                      : isOfficeSkills
                        ? 'OFFICE READY SKILLS COMPLETE COURSE BOOK'
                        : 'Course Syllabus Brochure'}
                </h2>
                <p className="text-[10px] sm:text-xs text-muted-tan mt-1">
                  {isSpokenEnglish 
                    ? 'Your 90-Day Roadmap to Confident, Fluent English' 
                    : isDigitalMarketing 
                      ? '6-Month Comprehensive Program — Social Media, Paid Ads, Web, SEO, Funnels & AI' 
                      : isOfficeSkills
                        ? '6-Month Job Preparation Course — MS Office, Tally Prime, AI Tools & Personality Development'
                        : 'Interactive program specifications'}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Splitted Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0f0a1c]">
            {isSpokenEnglish || isDigitalMarketing || isOfficeSkills ? (
              <>
                {/* Left Sidebar Navigation (Desktop) */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-purple-900/20 bg-[#120c24] overflow-x-auto md:overflow-y-auto flex md:flex-col shrink-0 p-2 gap-1 scrollbar-thin scrollbar-thumb-purple-950">
                  {currentTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-3 px-4 py-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap md:whitespace-normal text-left ${
                          isActive
                            ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/20'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-brand-coral'}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Scrollable content window */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0f0a1c] text-sm leading-relaxed scrollbar-thin scrollbar-thumb-purple-950">
                  
                  {/* Spoken English Brochure Contents */}
                  {isSpokenEnglish && (
                    <>
                      {activeTab === 'about' && (
                        <div className="space-y-6">
                          <div className="border border-brand-coral/25 bg-brand-coral/5 p-6 rounded-2xl">
                            <h3 className="text-xl sm:text-2xl font-black text-brand-coral mb-2">ABOUT THIS BOOK</h3>
                            <p className="text-white/80 leading-relaxed">
                              Welcome to T2Upgrade's Advanced Spoken English Course — a structured, practical, and results-driven program designed to take you from where you are to where you want to be in English communication.
                              <br /><br />
                              This course book is your complete companion for 90 days of focused learning. Whether you are a beginner building your foundation or an intermediate learner looking to speak with confidence and polish, this book covers every area you need.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="bg-[#150f28] border border-purple-900/30 p-5 rounded-2xl">
                              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-coral" /> What You Will Learn
                              </h4>
                              <ul className="space-y-2 text-xs text-white/75">
                                <li>• <strong>English Grammar</strong> — from basics to advanced structures</li>
                                <li>• <strong>Daily Conversations</strong> — real-world phrases you use every day</li>
                                <li>• <strong>Formal Conversations</strong> — professional and polite language</li>
                                <li>• <strong>Job Interviews</strong> — how to answer confidently and impress</li>
                                <li>• <strong>Idioms & Phrases</strong> — speak like a native English speaker</li>
                                <li>• <strong>Storytelling</strong> — engage and communicate with impact</li>
                                <li>• <strong>Self Introduction</strong> — make a powerful first impression</li>
                                <li>• <strong>Pronunciation & Fluency</strong> — sound natural and confident</li>
                              </ul>
                            </div>

                            <div className="bg-[#150f28] border border-purple-900/30 p-5 rounded-2xl">
                              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-coral" /> How to Use This Book
                              </h4>
                              <ol className="space-y-2 text-xs text-white/75">
                                <li>1. <strong>Follow the 90-Day Plan</strong> — one topic per day, building on the previous.</li>
                                <li>2. <strong>Read each example aloud</strong> — speaking is a muscle; train it daily.</li>
                                <li>3. <strong>Practice the Q&A sections</strong> with a partner or in a mirror.</li>
                                <li>4. <strong>Revisit challenging chapters</strong> — repetition is key.</li>
                                <li>5. <strong>Track your progress</strong> at the end of each module.</li>
                              </ol>
                            </div>
                          </div>

                          <div className="bg-amber-500/10 border border-amber-500/35 p-4 rounded-xl text-xs text-amber-300 flex gap-2.5">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                              <strong>TIP:</strong> Speak English for at least 30 minutes every day outside of class. The biggest barrier to fluency is not lack of knowledge — it is the fear of making mistakes. Make mistakes boldly.
                            </div>
                          </div>

                          {/* Phase Table */}
                          <div className="space-y-3">
                            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">90-DAY LEARNING ROADMAP</h4>
                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-3">PHASE</th>
                                    <th className="p-3">DAYS / TOPIC</th>
                                    <th className="p-3">FOCUS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/85">
                                  <tr>
                                    <td className="p-3 font-bold">Phase 1</td>
                                    <td className="p-3">Days 1–15</td>
                                    <td className="p-3"><strong>Foundation Grammar</strong>: Parts of speech, tenses, sentence construction, articles, prepositions</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-3 font-bold">Phase 2</td>
                                    <td className="p-3">Days 16–30</td>
                                    <td className="p-3"><strong>Daily Conversation</strong>: Greetings, small talk, asking & giving directions, shopping, phone calls</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold">Phase 3</td>
                                    <td className="p-3">Days 31–45</td>
                                    <td className="p-3"><strong>Formal Communication</strong>: Professional emails, meetings, presentations, polite requests</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-3 font-bold">Phase 4</td>
                                    <td className="p-3">Days 46–60</td>
                                    <td className="p-3"><strong>Interviews & Career</strong>: HR questions, technical answers, body language, salary negotiation</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold">Phase 5</td>
                                    <td className="p-3">Days 61–70</td>
                                    <td className="p-3"><strong>Idioms & Phrases</strong>: 100+ idioms, phrasal verbs, expressions used by native speakers</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-3 font-bold">Phase 6</td>
                                    <td className="p-3">Days 71–80</td>
                                    <td className="p-3"><strong>Storytelling & Speaking</strong>: Narrative structure, engaging an audience, humour, persuasion</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold">Phase 7</td>
                                    <td className="p-3">Days 81–90</td>
                                    <td className="p-3"><strong>Fluency Sprint</strong>: Self-introduction, debate, extempore, full revision & assessment</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod1' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 1-15</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 1 — FOUNDATION GRAMMAR</h3>
                            <p className="text-xs text-white/70 mt-1">
                              Grammar is the skeleton of the English language. Without it, your words have no structure. This module covers every essential grammar rule with examples, common mistakes, and practice exercises.
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            <h4 className="font-bold text-white border-b border-purple-900/30 pb-1">1.1 Parts of Speech</h4>
                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-2.5">PART OF SPEECH</th>
                                    <th className="p-2.5">DEFINITION</th>
                                    <th className="p-2.5">EXAMPLE</th>
                                    <th className="p-2.5">WORD IN A SENTENCE</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/80">
                                  <tr>
                                    <td className="p-2.5 font-bold">Noun</td>
                                    <td className="p-2.5">Name of a person, place, or thing</td>
                                    <td className="p-2.5 font-mono text-brand-coral">book, city, Rahul</td>
                                    <td className="p-2.5">Rahul lives in the city.</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2.5 font-bold">Pronoun</td>
                                    <td className="p-2.5">Replaces a noun</td>
                                    <td className="p-2.5 font-mono text-brand-coral">he, she, they, it</td>
                                    <td className="p-2.5">He is my friend.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2.5 font-bold">Verb</td>
                                    <td className="p-2.5">Action or state word</td>
                                    <td className="p-2.5 font-mono text-brand-coral">run, is, think</td>
                                    <td className="p-2.5">She thinks quickly.</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2.5 font-bold">Adjective</td>
                                    <td className="p-2.5">Describes a noun</td>
                                    <td className="p-2.5 font-mono text-brand-coral">big, happy, blue</td>
                                    <td className="p-2.5">It is a big house.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2.5 font-bold">Adverb</td>
                                    <td className="p-2.5">Describes a verb or adjective</td>
                                    <td className="p-2.5 font-mono text-brand-coral">quickly, very, never</td>
                                    <td className="p-2.5">He runs very quickly.</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2.5 font-bold">Preposition</td>
                                    <td className="p-2.5">Shows relationship</td>
                                    <td className="p-2.5 font-mono text-brand-coral">in, on, at, between</td>
                                    <td className="p-2.5">The book is on the table.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2.5 font-bold">Conjunction</td>
                                    <td className="p-2.5">Joins words or clauses</td>
                                    <td className="p-2.5 font-mono text-brand-coral">and, but, because, so</td>
                                    <td className="p-2.5">I was tired but happy.</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2.5 font-bold">Interjection</td>
                                    <td className="p-2.5">Expresses emotion</td>
                                    <td className="p-2.5 font-mono text-brand-coral">Wow! Oh! Ouch!</td>
                                    <td className="p-2.5">Wow! That is amazing.</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-bold text-white border-b border-purple-900/30 pb-1">1.2 The 12 Tenses — Master Guide</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="p-4 bg-[#150f28] rounded-xl border border-purple-900/20">
                                <h5 className="font-extrabold text-xs text-brand-coral mb-2">PRESENT TENSES</h5>
                                <div className="space-y-3.5 text-[11px] text-white/80">
                                  <div>
                                    <strong className="block text-white">Simple Present</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + V1 (s/es)</span>
                                    <p className="text-green-450">✓ She works in a bank.</p>
                                    <p className="text-red-400">✗ She work in a bank.</p>
                                  </div>
                                  <div>
                                    <strong className="block text-white">Present Continuous</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + am/is/are + V-ing</span>
                                    <p className="text-green-450">✓ I am studying English right now.</p>
                                    <p className="text-red-400">✗ I am study English.</p>
                                  </div>
                                  <div>
                                    <strong className="block text-white">Present Perfect</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + have/has + V3</span>
                                    <p className="text-green-450">✓ I have finished my homework.</p>
                                    <p className="text-red-400">✗ I have finish my homework.</p>
                                  </div>
                                  <div>
                                    <strong className="block text-white">Present Perfect Continuous</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + have/has been + V-ing</span>
                                    <p className="text-green-450">✓ He has been working here for 5 years.</p>
                                    <p className="text-red-400">✗ He is working here since 5 years.</p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 bg-[#150f28] rounded-xl border border-purple-900/20">
                                <h5 className="font-extrabold text-xs text-brand-coral mb-2">PAST TENSES</h5>
                                <div className="space-y-3.5 text-[11px] text-white/80">
                                  <div>
                                    <strong className="block text-white">Simple Past</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + V2</span>
                                    <p className="text-green-450">✓ I went to the market.</p>
                                    <p className="text-red-400">✗ I go to market yesterday.</p>
                                  </div>
                                  <div>
                                    <strong className="block text-white">Past Continuous</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + was/were + V-ing</span>
                                    <p className="text-green-450">✓ They were watching TV when I arrived.</p>
                                    <p className="text-red-400">✗ They was watching TV.</p>
                                  </div>
                                  <div>
                                    <strong className="block text-white">Past Perfect</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + had + V3</span>
                                    <p className="text-green-450">✓ He had left before she arrived.</p>
                                    <p className="text-red-400">✗ He has left before she arrived.</p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 bg-[#150f28] rounded-xl border border-purple-900/20">
                                <h5 className="font-extrabold text-xs text-brand-coral mb-2">FUTURE TENSES</h5>
                                <div className="space-y-3.5 text-[11px] text-white/80">
                                  <div>
                                    <strong className="block text-white">Simple Future</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + will/shall + V1</span>
                                    <p className="text-green-450">✓ I will call you tomorrow.</p>
                                    <p className="text-red-400">✗ I will calls you tomorrow.</p>
                                  </div>
                                  <div>
                                    <strong className="block text-white">Future Continuous</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + will be + V-ing</span>
                                    <p className="text-green-450">✓ This time tomorrow, I will be flying to Delhi.</p>
                                    <p className="text-red-400">✗ Tomorrow I will flying to Delhi.</p>
                                  </div>
                                  <div>
                                    <strong className="block text-white">Future Perfect</strong>
                                    <span className="text-[10px] text-muted-tan">Subject + will have + V3</span>
                                    <p className="text-green-450">✓ By 10 PM, she will have completed the report.</p>
                                    <p className="text-red-400">✗ By 10 PM she will complete the report.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-[#150f28] rounded-xl border border-purple-900/20">
                            <h4 className="font-bold text-white mb-2 text-xs">1.3 Articles — a, an, the</h4>
                            <ul className="space-y-2 text-xs text-white/80">
                              <li>• <strong>Rule:</strong> Use 'a' before consonant sounds, 'an' before vowel sounds. <span className="text-green-400">✓ a book, a university, an apple, an hour</span> • <span className="text-red-400">✗ a apple, a honest man</span></li>
                              <li>• <strong>Rule:</strong> Use 'the' for specific things already known. <span className="text-green-400">✓ Please close the door. The sun rises in the east.</span> • <span className="text-red-400">✗ Please close a door.</span></li>
                              <li className="text-brand-coral bg-brand-coral/5 p-2.5 rounded border border-brand-coral/20 font-bold">
                                NOTE: Never use an article before names of people, countries (most), languages, or meals: 'India is beautiful.' (NOT 'The India is beautiful.')
                              </li>
                            </ul>
                          </div>

                          <div className="space-y-2.5">
                            <h4 className="font-bold text-white border-b border-purple-900/30 pb-1 text-xs">1.4 Prepositions — Common & Confusing</h4>
                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-2">#</th>
                                    <th className="p-2">QUESTION</th>
                                    <th className="p-2">ANSWER / EXAMPLE</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/80">
                                  <tr>
                                    <td className="p-2 font-bold">1</td>
                                    <td className="p-2">What is the difference between 'in' and 'at' for time?</td>
                                    <td className="p-2"><strong>'In'</strong> = longer periods (in 2024, in January, in the morning). <strong>'At'</strong> = specific times (at 5 PM, at midnight, at noon).</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold">2</td>
                                    <td className="p-2">When do we say 'interested IN' vs 'interested AT'?</td>
                                    <td className="p-2 text-green-450">Always 'interested IN': I am interested in music. ('interested at' is incorrect).</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-bold">3</td>
                                    <td className="p-2">'Married to' or 'married with'?</td>
                                    <td className="p-2 text-green-450">Always 'married to': She is married to a doctor. ('married with' is incorrect).</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold">4</td>
                                    <td className="p-2">'Discuss about' or just 'discuss'?</td>
                                    <td className="p-2"><strong>'Discuss'</strong> already includes 'about'. Say: Let us discuss the plan. (NOT: discuss about).</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-bold">5</td>
                                    <td className="p-2">'Good at' or 'good in'?</td>
                                    <td className="p-2"><strong>'Good at'</strong> is for skills: She is good at dancing. <strong>'Good in'</strong> is for subjects: He is good in mathematics.</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod2' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 6-8</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 2 — SELF INTRODUCTION</h3>
                            <p className="text-xs text-white/70 mt-1">
                              Your introduction is your first impression. It sets the tone for everything that follows. A powerful introduction is structured, confident, and memorable.
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            <h4 className="font-bold text-white text-xs border-b border-purple-900/30 pb-1">2.1 The T2Upgrade Introduction Formula</h4>
                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-2.5">STEP</th>
                                    <th className="p-2.5">ELEMENT</th>
                                    <th className="p-2.5">PURPOSE</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/80">
                                  <tr>
                                    <td className="p-2.5 font-bold">1</td>
                                    <td className="p-2.5 font-bold text-brand-coral">Name & Location</td>
                                    <td className="p-2.5">Who you are and where you are from</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2.5 font-bold">2</td>
                                    <td className="p-2.5 font-bold text-brand-coral">Education / Background</td>
                                    <td className="p-2.5">Your academic or professional foundation</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2.5 font-bold">3</td>
                                    <td className="p-2.5 font-bold text-brand-coral">Current Role / Status</td>
                                    <td className="p-2.5">What you do right now</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2.5 font-bold">4</td>
                                    <td className="p-2.5 font-bold text-brand-coral">Skills & Strengths</td>
                                    <td className="p-2.5">What you are good at</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2.5 font-bold">5</td>
                                    <td className="p-2.5 font-bold text-brand-coral">Goal / Purpose</td>
                                    <td className="p-2.5">Why you are here / what you want</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2.5 font-bold">6</td>
                                    <td className="p-2.5 font-bold text-brand-coral">Closing Hook</td>
                                    <td className="p-2.5">A memorable statement or enthusiasm</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-bold text-white text-xs border-b border-purple-900/30 pb-1">2.2 Sample Introductions</h4>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="p-4 bg-[#150f28] border border-purple-900/20 rounded-xl">
                                <h5 className="font-extrabold text-xs text-brand-coral mb-1.5">Level 1 — Student Introduction</h5>
                                <p className="text-xs text-white/80 italic font-medium leading-relaxed">
                                  "Good morning, everyone. My name is Priya Sharma, and I am from Jaipur, Rajasthan. I am currently pursuing my Bachelor's degree in Commerce from Rajasthan University. I enjoy reading, public speaking, and learning new languages. I have always been passionate about English communication, which is why I joined this course. I am excited to improve my fluency and connect with all of you. Thank you."
                                </p>
                              </div>

                              <div className="p-4 bg-[#150f28] border border-purple-900/20 rounded-xl">
                                <h5 className="font-extrabold text-xs text-brand-coral mb-1.5">Level 2 — Professional Introduction</h5>
                                <p className="text-xs text-white/80 italic font-medium leading-relaxed">
                                  "Good afternoon. I am Arjun Mehta, a software developer with three years of experience in full-stack development. I hold a degree in Computer Science from IIT Jodhpur. Currently, I work at a fintech startup in Pune where I lead the backend development team. I am skilled in Java, Python, and cloud technologies. I am here today because I believe that strong communication is just as important as technical skill in today's workplace. I look forward to growing with this group."
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod3' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 16-30</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 3 — DAILY CONVERSATION</h3>
                            <p className="text-xs text-white/70 mt-1">
                              Speaking English confidently in everyday situations is the first real test of your learning. This module covers the conversations you will have every single day — greetings, small talk, making plans, shopping, travel, and more.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-[#150f28] border border-purple-900/20 rounded-xl space-y-3">
                              <h4 className="font-bold text-white text-xs border-b border-purple-900/30 pb-1">3.1 Greetings & Small Talk</h4>
                              <div className="space-y-2 text-xs text-white/80">
                                <strong className="text-brand-coral block">Formal Greetings</strong>
                                <p><strong>You:</strong> Good morning, Mr. Sharma. How are you today?</p>
                                <p><strong>Mr. Sharma:</strong> Good morning! I am doing well, thank you. And yourself?</p>
                                <p><strong>You:</strong> I am great, thank you for asking.</p>
                              </div>
                            </div>

                            <div className="p-4 bg-[#150f28] border border-purple-900/20 rounded-xl space-y-3">
                              <h4 className="font-bold text-white text-xs border-b border-purple-900/30 pb-1">3.2 Making & Refusing Plans</h4>
                              <div className="space-y-2 text-xs text-white/80">
                                <strong className="text-brand-coral block">Politely Refusing Plans</strong>
                                <p><strong>Karan:</strong> Hey, are you coming to the party tonight?</p>
                                <p><strong>Ankit:</strong> I would love to, but I am afraid I cannot make it tonight. I have a prior commitment that I cannot reschedule. Have a wonderful time!</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod4' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 31-45</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 4 — FORMAL & BUSINESS ENGLISH</h3>
                            <p className="text-xs text-white/70 mt-1">
                              In a professional environment, how you speak is as important as what you say. Business English is polite, direct, and collaborative.
                            </p>
                          </div>

                          <div className="p-4 bg-[#150f28] border border-purple-900/20 rounded-xl space-y-3">
                            <h4 className="font-bold text-white text-xs border-b border-purple-900/30 pb-1">4.1 Email Communication templates</h4>
                            <div className="space-y-2 text-xs text-white/80">
                              <p><strong>Subject:</strong> Proposal Review Request — Project Alpha</p>
                              <p><em>"Dear Mr. Kapoor, I hope this email finds you well. I have attached our team's updated proposal for Project Alpha for your review. Please let me know your feedback at your earliest convenience so that we can incorporate any adjustments. Thank you for your time and guidance. Best regards, Rahul Verma."</em></p>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod5' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 46-60</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 5 — JOB INTERVIEWS PREPARATION</h3>
                            <p className="text-xs text-white/70 mt-1">
                              Interviews are not tests of your knowledge — they are conversations about your value. This module covers core HR questions and how to answer them.
                            </p>
                          </div>

                          <div className="p-4 bg-[#150f28] border border-purple-900/20 rounded-xl space-y-3">
                            <strong className="text-brand-coral text-xs block">Tell me about yourself?</strong>
                            <p className="text-xs text-white/85">
                              Apply the Present-Past-Future framework: "Currently I work at X... Before this, I completed Y where I led Z... In the future, I want to apply my expertise to your company's growth."
                            </p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod6' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 61-70</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 6 — IDIOMS, PHRASES & PHRASAL VERBS</h3>
                            <p className="text-xs text-white/70 mt-1">
                              Using idioms and phrasal verbs correctly is one of the strongest signs of English fluency.
                            </p>
                          </div>

                          <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                  <th className="p-2.5">IDIOM / PHRASE</th>
                                  <th className="p-2.5">MEANING</th>
                                  <th className="p-2.5">EXAMPLE SENTENCE</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-purple-900/20 text-white/85">
                                <tr>
                                  <td className="p-2.5 font-bold text-brand-coral">Think outside the box</td>
                                  <td className="p-2.5">Think creatively and differently</td>
                                  <td className="p-2.5">We need to think outside the box to solve this problem.</td>
                                </tr>
                                <tr className="bg-[#120c24]/30">
                                  <td className="p-2.5 font-bold text-brand-coral">On the same page</td>
                                  <td className="p-2.5">In agreement / understanding</td>
                                  <td className="p-2.5">Before we proceed, I want to make sure we are on the same page.</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod7' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 71-80</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 7 — STORYTELLING IN ENGLISH</h3>
                            <p className="text-xs text-white/70 mt-1">
                              The ability to tell a good story is one of the most powerful communication skills. Stories make people listen, remember, and connect.
                            </p>
                          </div>

                          <div className="p-5 bg-[#150f28] border border-purple-900/20 rounded-xl space-y-3">
                            <h4 className="font-bold text-white text-xs border-b border-purple-900/30 pb-1">7.1 The Three-Act Story Structure</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div className="p-3.5 bg-[#0f0a1c] border border-purple-900/30 rounded-xl">
                                <strong className="text-brand-coral block">Act 1: Setup</strong>
                                <p className="text-white/80 mt-1">Introduce the character (you), the setting, and the situation.</p>
                              </div>
                              <div className="p-3.5 bg-[#0f0a1c] border border-purple-900/30 rounded-xl">
                                <strong className="text-brand-coral block">Act 2: Conflict</strong>
                                <p className="text-white/80 mt-1">Something goes wrong. A challenge, problem, or turning point.</p>
                              </div>
                              <div className="p-3.5 bg-[#0f0a1c] border border-purple-900/30 rounded-xl">
                                <strong className="text-brand-coral block">Act 3: Resolution</strong>
                                <p className="text-white/80 mt-1">How you overcame it. The lesson, the result, the takeaway.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod8' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 81-85</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 8 — PRONUNCIATION & FLUENCY</h3>
                            <p className="text-xs text-white/70 mt-1">
                              Pronunciation is not about sounding British or American. It is about being clearly understood.
                            </p>
                          </div>

                          <div className="p-4 bg-[#150f28] border border-purple-900/20 rounded-xl space-y-2 text-xs">
                            <h4 className="font-bold text-white">8.1 Fluency-Building Exercises</h4>
                            <p>• <strong>Mirror Technique:</strong> Stand in front of a mirror and speak for 2 minutes continuously on any topic.</p>
                            <p>• <strong>Shadowing:</strong> Repeat sentences exactly after a podcast or video — match the speed and rhythm.</p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod9' && (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">DAYS 86-90</span>
                            <h3 className="text-xl sm:text-2xl font-black mt-1">MODULE 9 — FLUENCY SPRINT & REVISION</h3>
                            <p className="text-xs text-white/70 mt-1">
                              The final stretch. Bring it all together with extempore speaking practice, debate starters, and your 90-day assessment.
                            </p>
                          </div>

                          <div className="p-5 bg-brand-coral/10 border border-brand-coral/25 rounded-2xl text-center space-y-3">
                            <h4 className="text-lg font-black text-brand-coral">Final Message from T2Upgrade</h4>
                            <p className="text-xs text-white/80 max-w-2xl mx-auto italic leading-relaxed">
                              "You have completed 90 days of intentional, structured learning. Language is not learned in a classroom — it is built in every conversation, every error corrected, every sentence spoken when you were afraid to speak."
                            </p>
                            <span className="block font-bold text-xs text-brand-coral mt-2">— T2Upgrade Pvt. Ltd.</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Digital Marketing Brochure Contents */}
                  {isDigitalMarketing && (
                    <>
                      {activeTab === 'about' && (
                        <div className="space-y-6">
                          <div className="border border-brand-coral/25 bg-brand-coral/5 p-6 rounded-2xl">
                            <h3 className="text-xl sm:text-2xl font-black text-brand-coral mb-2">ABOUT THIS COURSE BOOK</h3>
                            <p className="text-white/80 leading-relaxed">
                              Welcome to the Advanced Digital Marketing Complete Course Book by T2Upgrade Pvt. Ltd. 
                              This comprehensive 6-month program is designed to take you from foundational knowledge to professional-level expertise across all major pillars of digital marketing.
                            </p>
                          </div>

                          {/* Quick details & Outcomes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="bg-[#150f28] border border-purple-900/30 p-5 rounded-2xl">
                              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-coral" /> What You Will Achieve
                              </h4>
                              <ul className="space-y-2 text-xs text-white/75">
                                <li>• <strong>Master Social Media Marketing</strong> across all major platforms</li>
                                <li>• <strong>Run Profitable Google & Meta Ads</strong> campaigns independently</li>
                                <li>• <strong>Build WordPress Sites</strong> and rank them with advanced SEO</li>
                                <li>• <strong>Create Funnels</strong> and generate high-quality automated leads</li>
                                <li>• <strong>Acquire Premium Clients</strong> and launch your own digital agency</li>
                                <li>• <strong>Leverage AI Tools</strong> to 10x your speed and productivity</li>
                              </ul>
                            </div>

                            <div className="bg-[#150f28] border border-purple-900/30 p-5 rounded-2xl">
                              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-coral" /> Program Specifications
                              </h4>
                              <table className="w-full text-left text-xs border-collapse">
                                <tbody className="divide-y divide-purple-900/20 text-white/75">
                                  <tr>
                                    <td className="py-1.5 font-semibold">Duration</td>
                                    <td className="py-1.5 font-mono text-brand-coral">6 Months (24 Weeks)</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1.5 font-semibold">Format</td>
                                    <td className="py-1.5 text-white">Theory + Practice + Live Projects</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1.5 font-semibold">Modules</td>
                                    <td className="py-1.5 text-white">12 Core Modules (40+ Topics)</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1.5 font-semibold">Difficulty</td>
                                    <td className="py-1.5 text-white">Beginner to Advanced</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1.5 font-semibold">Certification</td>
                                    <td className="py-1.5 text-brand-coral font-bold">T2Upgrade Certified Professional</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="bg-amber-500/10 border border-amber-500/35 p-4 rounded-xl text-xs text-amber-300 flex gap-2.5">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                              <strong>REQUIRED METRIC:</strong> Each module includes theory, real-world examples, hands-on exercises, and a mini-project. Completion of all practice exercises is mandatory to earn the course certificate.
                            </div>
                          </div>

                          {/* Roadmap Table */}
                          <div className="space-y-3">
                            <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">6-MONTH LEARNING ROADMAP</h4>
                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-3">TIMELINE</th>
                                    <th className="p-3">FOCUS AREA</th>
                                    <th className="p-3">KEY SKILLS & PROJECTS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/85">
                                  <tr>
                                    <td className="p-3 font-bold whitespace-nowrap">Month 1 (W1-4)</td>
                                    <td className="p-3 font-bold text-brand-coral">Foundations: Social Media + Content</td>
                                    <td className="p-3">SMM strategy, content pillars, static/video formats, organic growth, copywriting psychology.</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-3 font-bold whitespace-nowrap">Month 2 (W5-8)</td>
                                    <td className="p-3 font-bold text-brand-coral">Paid Ads: Google & Meta campaigns</td>
                                    <td className="p-3">Search campaign match types, bidding, quality score, Facebook pixel, pixel helper, audience targeting.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold whitespace-nowrap">Month 3 (W9-12)</td>
                                    <td className="p-3 font-bold text-brand-coral">Web & SEO: WordPress + Rankings</td>
                                    <td className="p-3">WordPress.org installation, Elementor drag-drop, speed optimization, technical / local on-page SEO.</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-3 font-bold whitespace-nowrap">Month 4 (W13-16)</td>
                                    <td className="p-3 font-bold text-brand-coral">Growth: Off-Page SEO + Funnels + WhatsApp</td>
                                    <td className="p-3">Guest blogging, backlinks, TOFU-MOFU-BOFU funnels, email sequences, WhatsApp API integrations.</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 font-bold whitespace-nowrap">Month 5 (W17-20)</td>
                                    <td className="p-3 font-bold text-brand-coral">Creative Tools: Canva + Editing + AI Tools</td>
                                    <td className="p-3">Canva Brand Kit, CapCut video workflow, prompt engineering, HeyGen avatar, Descript editing, Make automation.</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-3 font-bold whitespace-nowrap">Month 6 (W21-24)</td>
                                    <td className="p-3 font-bold text-brand-coral">Business: Acquisition + Freelancing + Agency</td>
                                    <td className="p-3">SPIN discovery calls, proposals, Upwork/Fiverr setup, local networking, agency SOPs, monthly scaling.</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod1_3' && (
                        <div className="space-y-8">
                          {/* Module 1 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 1–2</span>
                              <h3 className="text-xl font-black mt-1">MODULE 01 — SOCIAL MEDIA MARKETING</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Grow brands organically and build powerful communities on the major social networks.
                              </p>
                            </div>

                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-2">PLATFORM</th>
                                    <th className="p-2">BEST USE CASE</th>
                                    <th className="p-2">METRIC FOCUS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/80">
                                  <tr>
                                    <td className="p-2 font-bold text-brand-coral">Facebook</td>
                                    <td className="p-2">Community building, events, local targeting ads</td>
                                    <td className="p-2">Group Members, Page reach</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold text-brand-coral">Instagram</td>
                                    <td className="p-2">Visual brands, Reels short video, influencer collaborations</td>
                                    <td className="p-2">Reels Views, Saves, Shares</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-bold text-brand-coral">LinkedIn</td>
                                    <td className="p-2">B2B marketing, corporate thought leadership, recruiting</td>
                                    <td className="p-2">Post impressions, Profile clicks</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold text-brand-coral">YouTube</td>
                                    <td className="p-2">Long-form tutorials, detailed product reviews, webinars</td>
                                    <td className="p-2">Watch time, CTR, subscribers</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl text-xs space-y-2">
                              <strong className="text-brand-coral block">Content pillars for a brand</strong>
                              <p>• <strong>Educational:</strong> How-tos, tutorial lists, and quick tips.</p>
                              <p>• <strong>Promotional:</strong> Exclusive offers, launches, and customer reviews.</p>
                              <p>• <strong>Entertaining:</strong> Memes, trending audio, and brand challenges.</p>
                              <p className="text-amber-300 pt-1">💡 <strong>80/20 Rule:</strong> 80% should educate, inspire or entertain. Only 20% should be direct sales pitch!</p>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Week 1 Practice Exercise:</strong> Build a 30-day social media calendar with at least 20 posts (5 Reels, 10 static posts, 5 stories) for a brand of your choice. Specify the 5 content pillars and 3 hashtag clusters.
                            </div>
                          </div>

                          <hr className="border-purple-900/30" />

                          {/* Module 2 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 3–4</span>
                              <h3 className="text-xl font-black mt-1">MODULE 02 — GOOGLE ADS (PPC)</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Drive targeted, high-intent traffic to landing pages and generate measurable ROI.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-white block border-b border-purple-900/20 pb-1.5">Keyword Match Types</strong>
                                <p>• <strong>Broad Match:</strong> Related searches (e.g. <em>digital marketing</em>)</p>
                                <p>• <strong>Phrase Match:</strong> Phrase keywords (e.g. <em>"digital marketing course"</em>)</p>
                                <p>• <strong>Exact Match:</strong> Exact terms only (e.g. <em>[digital marketing course]</em>)</p>
                                <p>• <strong>Negative Keywords:</strong> Prevent ads for bad matches (e.g. <em>-free, -cracked</em>)</p>
                              </div>

                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-white block border-b border-purple-900/20 pb-1.5">Bidding Strategies</strong>
                                <p>• <strong>Manual CPC:</strong> Complete control over bids</p>
                                <p>• <strong>Target CPA:</strong> Automatically optimizes to hit a cost-per-lead target</p>
                                <p>• <strong>Target ROAS:</strong> Maximizes sales revenue relative to budget spent</p>
                                <p>• <strong>Maximize Clicks:</strong> Focuses all budget to drive maximum traffic</p>
                              </div>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Quality Score Math:</strong> higher Quality Score = lower cost-per-click! If you bid Rs. 60 with a Quality Score of 8, your Ad Rank is 480. A competitor bidding Rs. 100 with Quality Score of 3 gets an Ad Rank of 300. You rank higher and pay less!
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Week 3 Practice Exercise:</strong> Set up a complete Google Search ad campaign outline for a digital marketing institute, including 3 distinct ad groups, 10 keywords per group with match types, 3 ad variations, and 10 negatives.
                            </div>
                          </div>

                          <hr className="border-purple-900/30" />

                          {/* Module 3 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 4–5</span>
                              <h3 className="text-xl font-black mt-1">MODULE 03 — META ADS (FACEBOOK & INSTAGRAM)</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Build interest and target precision demographics with advanced Meta Business Suite funnels.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-white block border-b border-purple-900/20 pb-1.5">Meta Pixel Conversion Events</strong>
                                <p>• <strong>PageView:</strong> User visited the main site</p>
                                <p>• <strong>ViewContent:</strong> Visited service details page</p>
                                <p>• <strong>Lead:</strong> Form submitted (leads captured)</p>
                                <p>• <strong>Purchase:</strong> Completed payment or registration</p>
                              </div>

                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-white block border-b border-purple-900/20 pb-1.5">Audience Funnel Setup</strong>
                                <p>• <strong>Top of Funnel (TOFU):</strong> Lookalike audiences (1% LAL), interest tags</p>
                                <p>• <strong>Middle of Funnel (MOFU):</strong> Retarget 90-day site visitors & video viewers</p>
                                <p>• <strong>Bottom of Funnel (BOFU):</strong> Retarget lead form abandoners with final CTAs</p>
                              </div>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Week 4 Practice Exercise:</strong> Design a Meta Ads funnel for a real estate agency. Write the ad copy variations for TOFU (awareness), MOFU (retargeting video views), and BOFU (lead form conversions), selecting exact target age & location metrics.
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod4_6' && (
                        <div className="space-y-8">
                          {/* Module 4 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEK 4</span>
                              <h3 className="text-xl font-black mt-1">MODULE 04 — CONTENT CREATION & COPYWRITING</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Master copywriting frameworks and the psychology of persuasion to write copy that converts.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-brand-coral block font-bold border-b border-purple-900/10 pb-1">AIDA Framework</strong>
                                <p>• <strong>Attention:</strong> Stop the scroll with a hook</p>
                                <p>• <strong>Interest:</strong> Build interest with facts/stories</p>
                                <p>• <strong>Desire:</strong> Pitch the future outcome/benefits</p>
                                <p>• <strong>Action:</strong> Call to Action (CTA)</p>
                              </div>

                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-brand-coral block font-bold border-b border-purple-900/10 pb-1">PAS Framework</strong>
                                <p>• <strong>Problem:</strong> Identify the target customer pain point</p>
                                <p>• <strong>Agitate:</strong> Make the problem feel urgent and costly</p>
                                <p>• <strong>Solution:</strong> Present your product as the clear answer</p>
                              </div>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Module 4 Practice Exercise:</strong> Write a 5-email welcome sequence for a digital marketing course lead. Use the AIDA framework to move them from initial lead capture (welcome) to value, social proof, objection resolution, and final registration.
                            </div>
                          </div>

                          <hr className="border-purple-900/30" />

                          {/* Module 5 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 5–6</span>
                              <h3 className="text-xl font-black mt-1">MODULE 05 — WORDPRESS WEBSITE DESIGN</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Design and launch high-performance landing pages and WooCommerce e-commerce stores without writing code.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-1.5">
                                <strong className="text-white block font-bold border-b border-purple-900/10 pb-1">WordPress Setup Checklist</strong>
                                <p>1. Domain name mapping & secure hosting integration</p>
                                <p>2. SSL certificate (HTTPS) integration (Let's Encrypt)</p>
                                <p>3. WordPress Core installation & Permalinks structure</p>
                                <p>4. Essential plugins: Elementor, Yoast SEO, WooCommerce, WP Rocket</p>
                              </div>

                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-1.5">
                                <strong className="text-white block font-bold border-b border-purple-900/10 pb-1">Speed Optimization Checklist</strong>
                                <p>• Compress images by 70–80% using Smush or ShortPixel</p>
                                <p>• Activate WP Rocket cache & lazy loading protocols</p>
                                <p>• Convert uploaded assets into WebP file formats</p>
                                <p>• Target Google PageSpeed score of 80+ mobile and 90+ desktop</p>
                              </div>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Weeks 5–6 Practice Exercise:</strong> Build a complete 5-page business site on WordPress using Elementor. Must include homepage with hero section, services details page, about, blog with sample posts, and contact form. Verify site page speed score.
                            </div>
                          </div>

                          <hr className="border-purple-900/30" />

                          {/* Module 6 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 7–9</span>
                              <h3 className="text-xl font-black mt-1">MODULE 06 — SEARCH ENGINE OPTIMISATION (SEO)</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Rank on Google organically and drive continuous, free transactional traffic to web pages.
                              </p>
                            </div>

                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-2">SEO PILLAR</th>
                                    <th className="p-2">TASKS & AUDITING KEYPOINTS</th>
                                    <th className="p-2">PRIMARY TOOL</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/80">
                                  <tr>
                                    <td className="p-2 font-bold text-brand-coral">On-Page</td>
                                    <td className="p-2">Title tag (&lt;60 chars), meta descriptions, H1 checks, keyword URLs, image alt tags, internal links</td>
                                    <td className="p-2">Yoast SEO / RankMath</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold text-brand-coral">Technical</td>
                                    <td className="p-2">Robots.txt config, XML sitemap indexing, crawl checks, fixing 404 links, schema markup configuration</td>
                                    <td className="p-2">Screaming Frog / Search Console</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-bold text-brand-coral">Off-Page</td>
                                    <td className="p-2">Backlink building, guest blogging pitches, HARO queries, PR press releases, resource links</td>
                                    <td className="p-2">Ahrefs / Moz Domain Authority</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold text-brand-coral">Local SEO</td>
                                    <td className="p-2">Google Business Profile optimization, consistent NAP listings, maps 3-pack optimization, reviews volume</td>
                                    <td className="p-2">GBP dashboard / local citations</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Module 6 Practice Exercise:</strong> Conduct a thorough SEO audit for a live business. Document the top 5 keywords to target (including search volume/difficulty metrics), 3 technical crawl issues, 5 on-page fixes, and a 90-day backlink outreach plan.
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod7_9' && (
                        <div className="space-y-8">
                          {/* Module 7 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 10–11</span>
                              <h3 className="text-xl font-black mt-1">MODULE 07 — FUNNEL BUILDING & LEAD GENERATION</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Create automated workflows to nurture cold traffic and capture premium leads on autopilot.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Funnel Layout Architecture</strong>
                                <p>1. <strong>Landing Page:</strong> Single action focus page, clean headline, form signup</p>
                                <p>2. <strong>Thank You Page:</strong> Confirm, link lead magnet, prompt to join WhatsApp</p>
                                <p>3. <strong>Nurture Sequence:</strong> 5-day educational emails to build authority</p>
                                <p>4. <strong>Booking Page:</strong> Embed custom Calendly scheduling widget</p>
                              </div>

                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">High-ROI WhatsApp Automation</strong>
                                <p>• Connect WhatsApp Business API via providers (Wati / AiSensy)</p>
                                <p>• Build instant chatbot flows to reply to customer FAQs</p>
                                <p>• Design broadcast lists & segmentations for high open rates</p>
                                <p>• Integrate forms to push instant lead confirmation texts</p>
                              </div>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Week 10 Practice Exercise:</strong> Build a lead generation funnel on Systeme.io. Include landing opt-in, thank you page with WhatsApp group prompt, and a 5-email automated nurture sequence. Set target metrics to capture 100 leads in 30 days.
                            </div>
                          </div>

                          <hr className="border-purple-900/30" />

                          {/* Module 8 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEK 12</span>
                              <h3 className="text-xl font-black mt-1">MODULE 08 — CLIENT ACQUISITION</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Pitch marketing services, handle budgeting objections, and close high-ticket retainers.
                              </p>
                            </div>

                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-2">PRICING MODEL</th>
                                    <th className="p-2">TYPICAL RATES (INR)</th>
                                    <th className="p-2">WHEN TO USE & OFFERS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/80">
                                  <tr>
                                    <td className="p-2 font-bold text-brand-coral">Hourly Rate</td>
                                    <td className="p-2">₹500 - ₹1,500 / hr</td>
                                    <td className="p-2">Beginner freelancers doing custom technical tasks</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold text-brand-coral">Project-Based</td>
                                    <td className="p-2">₹15,000 - ₹80,000</td>
                                    <td className="p-2">One-off deliverables like Elementor sites or ad setups</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-bold text-brand-coral">Monthly Retainer</td>
                                    <td className="p-2">₹8,000 - ₹25,000 / month</td>
                                    <td className="p-2">Long-term SMM, SEO campaigns, or ongoing ads management</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold text-brand-coral">Value-Based</td>
                                    <td className="p-2">₹50,000+ flat rate</td>
                                    <td className="p-2">Based on business growth/revenue impact; premium tier pitch</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl text-xs space-y-2">
                              <strong className="text-brand-coral block font-bold">Discovery Call SPIN Framework</strong>
                              <p>• <strong>Situation:</strong> Diagnose their current lead counts and active platforms.</p>
                              <p>• <strong>Problem:</strong> Target exact leaks, e.g. "You are running traffic but no conversions."</p>
                              <p>• <strong>Implication:</strong> Highlight monthly lost revenue due to bad conversion numbers.</p>
                              <p>• <strong>Need-Payoff:</strong> Present your structured marketing roadmap as the key solution.</p>
                              <p className="text-amber-300">💡 <strong>Objection Tip:</strong> Require 50% advance payment before starting any work. Non-negotiable!</p>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Week 12 Practice Exercise:</strong> Draft a professional PDF proposal for a local business. Outline their situation analysis, 3-month ad/funnel strategy, clear deliverables list, project timeline, and a 3-tier pricing package.
                            </div>
                          </div>

                          <hr className="border-purple-900/30" />

                          {/* Module 9 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 13–15</span>
                              <h3 className="text-xl font-black mt-1">MODULE 09 — FREELANCING & AGENCY SETUP</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Structure your operational workflow to scale from a single solopreneur into a structured digital agency.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <h5 className="font-extrabold text-xs text-brand-coral border-b border-purple-900/10 pb-1.5">PHASE 1: SOLO START</h5>
                                <p>• Secure first 3 paying clients at ₹8,000–20,000/month retainers.</p>
                                <p>• Create custom Standard Operating Procedures (SOPs) for deliverables.</p>
                                <p>• Assemble solid project case studies.</p>
                              </div>

                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <h5 className="font-extrabold text-xs text-brand-coral border-b border-purple-900/10 pb-1.5">PHASE 2: DELEGATION</h5>
                                <p>• Hire part-time contract content writers, graphic designers, & ads managers.</p>
                                <p>• Setup project tracking dashboards on Asana or ClickUp.</p>
                                <p>• Automate client reports.</p>
                              </div>

                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <h5 className="font-extrabold text-xs text-brand-coral border-b border-purple-900/10 pb-1.5">PHASE 3: AGENCY SCALE</h5>
                                <p>• Productise your core retainers into fixed packages on your site.</p>
                                <p>• Run paid ads to acquire inbound clients.</p>
                                <p>• Hire a sales representative on commission.</p>
                              </div>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Module 9 Practice Exercise:</strong> Write a complete 12-month agency business plan. Include your niche selection (e.g. real estate, Skincare D2C), target client avatar description, 3-tier pricing packages, required tools stack list, and monthly revenue targets.
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'mod10_11' && (
                        <div className="space-y-8">
                          {/* Module 10 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 16–17</span>
                              <h3 className="text-xl font-black mt-1">MODULE 10 — AI TOOLS FOR DIGITAL MARKETING</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Master cutting-edge generative AI tools to 10x your content output and automate manual work.
                              </p>
                            </div>

                            <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                    <th className="p-2">AI TOOL CATEGORY</th>
                                    <th className="p-2">PRIMARY TOOLS</th>
                                    <th className="p-2">MARKETING USE CASES</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-purple-900/20 text-white/80">
                                  <tr>
                                    <td className="p-2 font-bold text-brand-coral">Copywriting & Ideas</td>
                                    <td className="p-2">ChatGPT / Claude / Gemini</td>
                                    <td className="p-2">Social media captions, email subject lines, blog content outlines, client proposals drafting</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold text-brand-coral">Visuals & Ads</td>
                                    <td className="p-2">Midjourney / DALL-E / AdCreative.ai</td>
                                    <td className="p-2">High-converting ad visuals generation, instant product background removal, mockups compilation</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-bold text-brand-coral">Video Creation</td>
                                    <td className="p-2">HeyGen / Descript / ElevenLabs</td>
                                    <td className="p-2">AI avatar presenter videos without cameras, transcript-based video editing, voice cloning voiceovers</td>
                                  </tr>
                                  <tr className="bg-[#120c24]/30">
                                    <td className="p-2 font-bold text-brand-coral">SEO Optimisation</td>
                                    <td className="p-2">Surfer SEO / Clearscope</td>
                                    <td className="p-2">NLP semantic keyword injection lists, competitor content gaps auditing, SEO score ranking guides</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl text-xs space-y-2">
                              <strong className="text-brand-coral block font-bold">Advanced ChatGPT Prompt Blueprint</strong>
                              <p className="font-mono text-white/90 bg-black/40 p-2.5 rounded border border-purple-900/40">
                                "You are an expert Meta ads copywriter. Write 3 hooks and body copy variations for a Google search campaign targeting working professionals aged 22–35 who want to switch to digital marketing. Use the PAS copywriting framework for Variation 2."
                              </p>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Module 10 Practice Exercise:</strong> Use ChatGPT and Midjourney to generate a full marketing week campaign: 30-day outline calendar, 5 caption texts with hashtags, a 500-word SEO intro, 3 ad copy variations, and 5 email templates. Document prompts.
                            </div>
                          </div>

                          <hr className="border-purple-900/30" />

                          {/* Module 11 */}
                          <div className="space-y-4">
                            <div>
                              <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">WEEKS 18–19</span>
                              <h3 className="text-xl font-black mt-1">MODULE 11 — VIDEO EDITING & CANVA DESIGN</h3>
                              <p className="text-xs text-white/70 mt-1">
                                Produce eye-catching designs and short reels with professional graphic and editing software.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Design Principles for Marketers</strong>
                                <p>• <strong>Visual Hierarchy:</strong> Largest elements (hook headlines) read first</p>
                                <p>• <strong>Contrast:</strong> Make text readable on dark backdrops</p>
                                <p>• <strong>White Space:</strong> Empty space drives user attention to CTA buttons</p>
                                <p>• <strong>Consistency:</strong> Limit designs to 2–3 fonts and 3 brand colors</p>
                              </div>

                              <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">5-Step Video Editing Flow</strong>
                                <p>1. <strong>Import:</strong> File sorting in CapCut project bins</p>
                                <p>2. <strong>Rough Cut:</strong> Cut errors, pauses, and dead silences</p>
                                <p>3. <strong>Fine Cut:</strong> Overlay B-roll footage, dynamic transitions & graphics</p>
                                <p>4. <strong>Audio Mix:</strong> Balance voice and lower bg music levels to -20dB</p>
                                <p>5. <strong>Export:</strong> Render standard H.264 mp4 file at 1080p resolution</p>
                              </div>
                            </div>

                            <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                              <strong>Module 11 Practice Exercise:</strong> Design a social media graphic pack on Canva using a consistent Brand Kit. Load your assets into CapCut or Premiere Pro and edit a 60-second video reel adding auto-captions, transition zoom effects, and balanced background tracks.
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Office Ready Skills Brochure Contents */}
                  {isOfficeSkills && (
                    <>
                          {activeTab === 'about' && (
                            <div className="space-y-6">
                              <div className="border border-brand-coral/25 bg-brand-coral/5 p-6 rounded-2xl">
                                <h3 className="text-xl sm:text-2xl font-black text-brand-coral mb-2">ABOUT THIS COURSE BOOK</h3>
                                <p className="text-white/80 leading-relaxed">
                                  Welcome to Office Ready Skills — a comprehensive 6-month program designed to transform students into confident, job-ready professionals. 
                                  This course covers essential computer applications, communication skills, accounting software, modern AI tools, personality development, and interview techniques.
                                </p>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="bg-[#150f28] border border-purple-900/30 p-5 rounded-2xl">
                                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-coral" /> Course Learning Outcomes
                                  </h4>
                                  <ul className="space-y-2 text-xs text-white/75">
                                    <li>• <strong>Create Professional Documents & Spreadsheets</strong> using MS Office suite</li>
                                    <li>• <strong>Write Formal Emails, Business Letters</strong> & follow communication etiquette</li>
                                    <li>• <strong>Leverage AI Tools</strong> like ChatGPT & Copilot to boost productivity by 3x</li>
                                    <li>• <strong>Maintain Professional Accounts</strong> & tax configurations in Tally Prime</li>
                                    <li>• <strong>Present Yourself Confidently</strong> in salary reviews and team meetings</li>
                                    <li>• <strong>Demonstrate Workplace Etiquette</strong>, time management, and body language</li>
                                  </ul>
                                </div>

                                <div className="bg-[#150f28] border border-purple-900/30 p-5 rounded-2xl">
                                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-coral" /> Program Structure
                                  </h4>
                                  <table className="w-full text-left text-xs border-collapse">
                                    <tbody className="divide-y divide-purple-900/20 text-white/75">
                                      <tr>
                                        <td className="py-1.5 font-semibold">Total Duration</td>
                                        <td className="py-1.5 font-mono text-brand-coral">6 Months (288 Hours)</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1.5 font-semibold">Weekly Schedule</td>
                                        <td className="py-1.5 text-white">4 Days/Week | 3 Hours/Session</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1.5 font-semibold">Methodology</td>
                                        <td className="py-1.5 text-white">60% Practical Sessions | 40% Theory</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1.5 font-semibold">Project Load</td>
                                        <td className="py-1.5 text-white">1 Major Project per Month</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1.5 font-semibold">Evaluations</td>
                                        <td className="py-1.5 text-brand-coral font-bold">Monthly Tests + Final Exam</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Course Schedule Table */}
                              <div className="space-y-3">
                                <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">6-MONTH SCHEDULING PLAN</h4>
                                <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                        <th className="p-3">TIMELINE</th>
                                        <th className="p-3">MODULE FOCUS</th>
                                        <th className="p-3">TOPICS COVERED</th>
                                        <th className="p-3">HOURS</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-purple-900/20 text-white/85">
                                      <tr>
                                        <td className="p-3 font-bold whitespace-nowrap">Month 1</td>
                                        <td className="p-3 font-bold text-brand-coral">MS Word + Email</td>
                                        <td className="p-3">Word Interface, Formatting, Documents, Formal Letters, Email writing basics</td>
                                        <td className="p-3 font-mono">48 hrs</td>
                                      </tr>
                                      <tr className="bg-[#120c24]/30">
                                        <td className="p-3 font-bold whitespace-nowrap">Month 2</td>
                                        <td className="p-3 font-bold text-brand-coral">MS Excel</td>
                                        <td className="p-3">Spreadsheets navigation, formulas, logical functions, charts, VLOOKUP & data tools</td>
                                        <td className="p-3 font-mono">48 hrs</td>
                                      </tr>
                                      <tr>
                                        <td className="p-3 font-bold whitespace-nowrap">Month 3</td>
                                        <td className="p-3 font-bold text-brand-coral">PowerPoint + AI Tools</td>
                                        <td className="p-3">Slide layouts, 5 design rules, transitions, ChatGPT prompts, MS Copilot, Notion AI</td>
                                        <td className="p-3 font-mono">48 hrs</td>
                                      </tr>
                                      <tr className="bg-[#120c24]/30">
                                        <td className="p-3 font-bold whitespace-nowrap">Month 4</td>
                                        <td className="p-3 font-bold text-brand-coral">Tally Prime</td>
                                        <td className="p-3">Accounting basics, Ledgers creation, voucher entries, GST transactions, financial reports</td>
                                        <td className="p-3 font-mono">48 hrs</td>
                                      </tr>
                                      <tr>
                                        <td className="p-3 font-bold whitespace-nowrap">Month 5</td>
                                        <td className="p-3 font-bold text-brand-coral">Personality Development</td>
                                        <td className="p-3">Communication soft skills, confidence, body language postures, professional grooming</td>
                                        <td className="p-3 font-mono">48 hrs</td>
                                      </tr>
                                      <tr className="bg-[#120c24]/30">
                                        <td className="p-3 font-bold whitespace-nowrap">Month 6</td>
                                        <td className="p-3 font-bold text-brand-coral">Interview Preparation</td>
                                        <td className="p-3">ATS resume writing, HR mock rounds, group discussions, salary negotiation tips</td>
                                        <td className="p-3 font-mono">48 hrs</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'mod1_2' && (
                            <div className="space-y-8">
                              {/* Module 1: MS Word */}
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">MONTH 1 (48 HOURS)</span>
                                  <h3 className="text-xl font-black mt-1">MODULE 1 — MICROSOFT WORD</h3>
                                  <p className="text-xs text-white/70 mt-1">
                                    Create and format professional office documents, letters, corporate reports, and circulars.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Shortcuts & Formatting Tools</strong>
                                    <p>• <strong>Bold:</strong> Ctrl + B | <strong>Italics:</strong> Ctrl + I | <strong>Underline:</strong> Ctrl + U</p>
                                    <p>• <strong>Alignments:</strong> Left (Ctrl+L), Center (Ctrl+E), Right (Ctrl+R), Justified (Ctrl+J)</p>
                                    <p>• Bullets, numbering lists, indent controls, and Before/After paragraph spacing</p>
                                  </div>

                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Corporate Document Assets</strong>
                                    <p>• <strong>Tables Design:</strong> Merging cells, cell alignments, headers shading, SUM formulas</p>
                                    <p>• Headers, Footers, dynamic page numbering, SmartArt process org-charts</p>
                                    <p>• Mail Merge invitations targeting Excel databases, Track Changes reviewing</p>
                                  </div>
                                </div>

                                <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                                  <strong>Module 1 Final Project:</strong> Create a 15-20 page complete corporate profile booklet including formatted cover page, automatic Table of Contents, products tables, SmartArt org charts, and sitemap footers.
                                </div>
                              </div>

                              <hr className="border-purple-900/30" />

                              {/* Module 2: MS Excel */}
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">MONTH 2 (48 HOURS)</span>
                                  <h3 className="text-xl font-black mt-1">MODULE 2 — MICROSOFT EXCEL</h3>
                                  <p className="text-xs text-white/70 mt-1">
                                    Master spreadsheets calculations, data visualization dashboards, and PivotTable analytical summaries.
                                  </p>
                                </div>

                                <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                        <th className="p-2">FORMULA / FUNCTION</th>
                                        <th className="p-2">SYNTAX EXAMPLES</th>
                                        <th className="p-2">BUSINESS USE CASES</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-purple-900/20 text-white/85">
                                      <tr>
                                        <td className="p-2 font-bold text-brand-coral">SUM / AVERAGE</td>
                                        <td className="p-2 font-mono">=SUM(B2:B10) | =AVERAGE(C2:C10)</td>
                                        <td className="p-2">Calculating total billing lists, average marks or sales scores</td>
                                      </tr>
                                      <tr className="bg-[#120c24]/30">
                                        <td className="p-2 font-bold text-brand-coral">Logical IF</td>
                                        <td className="p-2 font-mono">=IF(B2&gt;=35,"PASS","FAIL")</td>
                                        <td className="p-2">Automating grade classifications, salary brackets thresholds checks</td>
                                      </tr>
                                      <tr>
                                        <td className="p-2 font-bold text-brand-coral">VLOOKUP</td>
                                        <td className="p-2 font-mono">=VLOOKUP(A2, Sheet2!A:C, 3, FALSE)</td>
                                        <td className="p-2">Pulling product pricing, employee data dynamically from masters</td>
                                      </tr>
                                      <tr className="bg-[#120c24]/30">
                                        <td className="p-2 font-bold text-brand-coral">Conditional Format</td>
                                        <td className="p-2">Highlight Rules / Data Bars / Icons</td>
                                        <td className="p-2">Color-coding transaction sheets: Green for profit, red for losses</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                                  <strong>Module 2 Final Project:</strong> Create a Business Analytics Workbook featuring a 100+ row raw sales transaction database, VLOOKUP links, a monthly SUMIF summary report, and a visual dashboard with 3 distinct charts.
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'mod3_4' && (
                            <div className="space-y-8">
                              {/* Module 3: PowerPoint */}
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">MONTH 3 (48 HOURS)</span>
                                  <h3 className="text-xl font-black mt-1">MODULE 3 — POWERPOINT PRESENTATION</h3>
                                  <p className="text-xs text-white/70 mt-1">
                                    Design visually clean, high-impact slide decks and build public speaking confidence.
                                  </p>
                                </div>

                                <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl text-xs space-y-3">
                                  <strong className="text-brand-coral block font-bold border-b border-purple-900/10 pb-1.5">The 5 Golden Rules of Slide Design</strong>
                                  <p>1. <strong>One Idea Per Slide:</strong> Keep slide targets simple. Max 1 main thought.</p>
                                  <p>2. <strong>Minimal Text (6x6 Rule):</strong> Max 6 lines per slide, max 6 words per line. Avoid paragraphs.</p>
                                  <p>3. <strong>Consistent Branding:</strong> Maximum 2 fonts and 3-4 cohesive colors throughout the deck.</p>
                                  <p>4. <strong>High Contrast:</strong> Always use dark text on light backdrops (or vice versa).</p>
                                  <p>5. <strong>Visual Priority:</strong> Prioritize high-quality charts, shapes, and icons over bullet points.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-1.5">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Technical PowerPoint Tools</strong>
                                    <p>• SmartArt matrices, cycles, relationships, and organizational hierarchies</p>
                                    <p>• Custom slide entrance animations: Appear, Fade, Morph</p>
                                    <p>• Slide Master templating for company logos and footer automation</p>
                                    <p>• Presenter View layout setting for notes tracking during slide shows</p>
                                  </div>

                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-1.5">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Corporate Pitch Deck Structure</strong>
                                    <p>• Slide 1-2: Title and Agenda</p>
                                    <p>• Slide 3-4: Problem and Our Solution</p>
                                    <p>• Slide 5-7: Market Size, Product Demo, Business Model</p>
                                    <p>• Slide 8-10: Competitors matrix, Team profile, Financial projections</p>
                                  </div>
                                </div>

                                <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                                  <strong>Module 3 Final Project:</strong> Design a 15-20 slide professional pitch deck using Slide Master templates, charts, and diagrams, and deliver a 10-minute mock presentation in front of the cohort.
                                </div>
                              </div>

                              <hr className="border-purple-900/30" />

                              {/* Module 4: Email & Communication */}
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">MONTH 1 & 4 (COMPANION COURSE)</span>
                                  <h3 className="text-xl font-black mt-1">MODULE 4 — EMAIL & FORMAL COMMUNICATION</h3>
                                  <p className="text-xs text-white/70 mt-1">
                                    Write professional emails, letters, and master corporate written and verbal communication.
                                  </p>
                                </div>

                                <div className="overflow-x-auto border border-purple-900/30 rounded-xl">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-[#150f28] border-b border-purple-900/30 text-white font-bold">
                                        <th className="p-2">EMAIL ELEMENT</th>
                                        <th className="p-2">BEST PRACTICE RULE</th>
                                        <th className="p-2">EXAMPLES</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-purple-900/20 text-white/85">
                                      <tr>
                                        <td className="p-2 font-bold text-brand-coral">Subject Line</td>
                                        <td className="p-2">Be specific and action-oriented. Clear date info.</td>
                                        <td className="p-2 text-green-400">"Leave Application: 20-22 June | Rahul Verma"</td>
                                      </tr>
                                      <tr className="bg-[#120c24]/30">
                                        <td className="p-2 font-bold text-brand-coral">Salutations</td>
                                        <td className="p-2">Formal greeting matching rank. No slang.</td>
                                        <td className="p-2">"Dear Mr. Sharma," or "Dear Hiring Manager,"</td>
                                      </tr>
                                      <tr>
                                        <td className="p-2 font-bold text-brand-coral">Tone / Grammar</td>
                                        <td className="p-2">Replace casual text with formal office equivalents.</td>
                                        <td className="p-2">"At your earliest convenience" instead of "ASAP"</td>
                                      </tr>
                                      <tr className="bg-[#120c24]/30">
                                        <td className="p-2 font-bold text-brand-coral">Letter Formats</td>
                                        <td className="p-2">Sender address, date, receiver address, subject, body, close.</td>
                                        <td className="p-2">Resignation letters, Complaint letters, Job applications</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                                  <strong>Week 4 Practice Exercise:</strong> Draft four formal letters in MS Word: a job application letter for an accountant post, a bank loan request letter, a customer service complaint, and a formal resignation letter.
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'mod5_6' && (
                            <div className="space-y-8">
                              {/* Module 5: AI Tools */}
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">MONTH 3 (COMPANION COURSE)</span>
                                  <h3 className="text-xl font-black mt-1">MODULE 5 — AI TOOLS FOR OFFICE PRODUCTIVITY</h3>
                                  <p className="text-xs text-white/70 mt-1">
                                    Increase your daily office speed by 3x by integrating generative AI tools into your daily workflow.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-brand-coral block font-bold border-b border-purple-900/10 pb-1.5">Prompt Engineering (RACE)</strong>
                                    <p>• <strong>Role:</strong> Tell AI what role to play (e.g. "You are an HR manager...")</p>
                                    <p>• <strong>Action:</strong> Define the task (e.g. "Draft an email...")</p>
                                    <p>• <strong>Context:</strong> Provide background details and parameters</p>
                                    <p>• <strong>Expectation:</strong> Set length, format, and tone rules</p>
                                  </div>

                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-brand-coral block font-bold border-b border-purple-900/10 pb-1.5">MS Copilot & Gemini Integrations</strong>
                                    <p>• <strong>MS Word/Docs:</strong> Drafting outlines, writing summaries</p>
                                    <p>• <strong>MS Excel/Sheets:</strong> Automated formula writing, parsing sales trends</p>
                                    <p>• <strong>PowerPoint:</strong> Designers layout templates suggestion</p>
                                  </div>
                                </div>

                                <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                                  <strong>Other Essential Productivity Tools:</strong> Master Canva AI (Magic design, background remover), Grammarly tone checking browser extensions, Notion AI note-taking, and DeepL translator tools.
                                </div>
                              </div>

                              <hr className="border-purple-900/30" />

                              {/* Module 6: Tally Prime */}
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">MONTH 4 (48 HOURS)</span>
                                  <h3 className="text-xl font-black mt-1">MODULE 6 — TALLY PRIME ACCOUNTING</h3>
                                  <p className="text-xs text-white/70 mt-1">
                                    Master India's most popular business accounting and tax configurations software for retail and corporate bookkeeping.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Core Bookkeeping Tasks</strong>
                                    <p>• Ledgers creation, inventory logging, groups setups</p>
                                    <p>• voucher Entry: Receipt, Payment, Contra, Sales, Purchase vouchers</p>
                                    <p>• Managing double entry accounting rules: Real, Personal, Nominal accounts</p>
                                    <p>• Trial Balance reconciliations & rectifying entries</p>
                                  </div>

                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">GST & Compliance Reports</strong>
                                    <p>• CGST, SGST, IGST tax ledger configurations</p>
                                    <p>• Creating sales invoices with automatic GST computations</p>
                                    <p>• Auto-generating financial reports: Profit & Loss account, Balance Sheet</p>
                                    <p>• Payroll setup: Employee accounts, salary slip configurations</p>
                                  </div>
                                </div>

                                <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                                  <strong>Module 6 Practice Exercise:</strong> Setup a new company in Tally. Enter 10 standard business transactions including purchases, sales, receipt vouchers, contra banking entries, compute CGST/SGST tax values, and export the Balance Sheet.
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'mod7_8' && (
                            <div className="space-y-8">
                              {/* Module 7: Personality Development */}
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">MONTH 5 (48 HOURS)</span>
                                  <h3 className="text-xl font-black mt-1">MODULE 7 — PERSONALITY DEVELOPMENT</h3>
                                  <p className="text-xs text-white/70 mt-1">
                                    Build confidence, improve voice modulation, and learn business office soft skills.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Communication & Cues</strong>
                                    <p>• Body language: Postures, hand movements, eye contact, handshakes</p>
                                    <p>• Active listening skills, feedback loops, and response models</p>
                                    <p>• Voice modulation: Modulating speed, tone, and pronunciation clarity</p>
                                    <p>• Public speaking training: Overcoming stage fear & extempore prep</p>
                                  </div>

                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Workplace Etiquette</strong>
                                    <p>• Dress codes: Business formal, smart casual standards, grooming rules</p>
                                    <p>• Email response times, respect protocols, team dynamics</p>
                                    <p>• Time management: Prioritizing tasks using Eisenhower matrix</p>
                                    <p>• Handling client conflicts constructively</p>
                                  </div>
                                </div>

                                <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                                  <strong>Module 7 Practice Exercise:</strong> Record a 2-minute self-introduction video. Evaluate pacing, hand movements, and tone. Submit for peer review in the weekly cohort group.
                                </div>
                              </div>

                              <hr className="border-purple-900/30" />

                              {/* Module 8: Interview Skills */}
                              <div className="space-y-4">
                                <div>
                                  <span className="text-[10px] font-bold text-brand-coral uppercase tracking-widest bg-brand-coral/10 px-2 py-0.5 rounded">MONTH 6 (48 HOURS)</span>
                                  <h3 className="text-xl font-black mt-1">MODULE 8 — INTERVIEW SKILLS</h3>
                                  <p className="text-xs text-white/70 mt-1">
                                    Prepare for HR rounds, format resumes for ATS keywords, and negotiate salary offers.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">ATS Resume & Cover Letters</strong>
                                    <p>• Custom ATS resume layouts: Keyword density optimization, clean headers</p>
                                    <p>• Structuring professional cover letters for job applications</p>
                                    <p>• HR Interview questions: "Tell me about yourself", "Strengths/weaknesses"</p>
                                    <p>• Group discussion (GD) tips: Intercepting, presenting facts</p>
                                  </div>

                                  <div className="bg-[#150f28] border border-purple-900/20 p-4 rounded-xl space-y-2">
                                    <strong className="text-white block font-bold border-b border-purple-900/10 pb-1.5">Offers & Salary Negotiation</strong>
                                    <p>• Navigating salary range requests, evaluating bonuses and benefits</p>
                                    <p>• Job search strategy: LinkedIn networking, recruiter cold mailing</p>
                                    <p>• Portfolio optimization: Linking project sheets and certifications</p>
                                    <p>• Managing job hunting consistency and handling mock rejections</p>
                                  </div>
                                </div>

                                <div className="p-4 bg-brand-coral/5 border border-brand-coral/20 rounded-xl text-xs">
                                  <strong>Module 8 Practice Exercise:</strong> Complete a full 1-on-1 mock interview with a certified trainer. Receive detailed feedback card covering parameters like communication, confidence, answers structuring, and body language.
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-brand-coral" />
                    <h3 className="text-xl font-bold">Brochure Coming Soon</h3>
                    <p className="text-xs text-muted-tan max-w-sm">
                      We are currently organizing the detailed day-by-day learning roadmap curriculum booklet for this track. Please check back shortly or apply for enrollment to get details!
                    </p>
                    <button
                      onClick={onClose}
                      className="bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      );
    }
