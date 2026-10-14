import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Smartphone, Mail, User, Building, BookOpen, Send, ChevronRight, ChevronLeft, Calendar, ShieldCheck, GraduationCap, Briefcase, Award } from 'lucide-react';
import { COURSE_CATEGORIES } from '../../landing-data';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'enroll' | 'instructor' | 'business' | 'product';
  initialCourseId?: string;
  productTitle?: string;
}

export default function Modals({ isOpen, onClose, type, initialCourseId, productTitle }: ModalProps) {
  // Common states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState(initialCourseId || '1');
  const [experience, setExperience] = useState('5-8');
  const [org, setOrg] = useState('');
  const [indianState, setIndianState] = useState('Rajasthan');
  
  // Multi-step form states for LMS enrollment
  const [currentStep, setCurrentStep] = useState(1);
  const [occupation, setOccupation] = useState('Working Professional');
  const [learningGoal, setLearningGoal] = useState('Career Transition');
  const [priorExperience, setPriorExperience] = useState('Beginner');
  const [preferredBatch, setPreferredBatch] = useState('Weekend Cohort (Sat/Sun 10 AM - 1 PM)');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const indianStates = [
    "Rajasthan", "Delhi", "Maharashtra", "Karnataka", "Uttar Pradesh", "Bihar",
    "Gujarat", "Haryana", "Punjab", "Tamil Nadu", "Telangana", "West Bengal", "Madhya Pradesh"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStepError(null);
    
    // Simulate real database registry entry pipeline
    setTimeout(() => {
      setIsSubmitting(false);
      setIsCompleted(true);
    }, 1500);
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setStepError(null);
    // Validate current step inputs
    if (currentStep === 1) {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        setStepError("Please fill in your name, email, and mobile number to proceed.");
        return;
      }
      if (!email.includes('@') || !email.includes('.')) {
        setStepError("Please enter a valid email address.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const resetStateAndClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCourse(initialCourseId || '1');
    setCurrentStep(1);
    setIsCompleted(false);
    setStepError(null);
    onClose();
  };

  if (!isOpen) return null;

  const selectedCourseTitle = COURSE_CATEGORIES.find(c => c.id.toString() === course.toString())?.title || 'Selected Program';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Black backdrop sheet */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          exit={{ opacity: 0 }}
          onClick={resetStateAndClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal card body */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="bg-[#171421] border border-border-tan card-border-strong w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 text-white flex flex-col"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-border-tan flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-brand-coral font-bold uppercase tracking-widest block bg-brand-coral/10 px-2.5 py-1 rounded-full">
                {type === 'enroll' && `LMS Application - Step ${currentStep} of 3`}
                {type === 'instructor' && 'Instructor Registry'}
                {type === 'business' && 'B2B Regional Partnership'}
                {type === 'product' && 'Product Order Request'}
              </span>
            </div>
            <button
              onClick={resetStateAndClose}
              className="p-1 hover:bg-border-tan/40 rounded-full text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Progress Bar for Enrollment */}
          {type === 'enroll' && !isCompleted && (
            <div className="w-full bg-border-tan/30 h-1.5 flex">
              <div 
                className="bg-gradient-to-r from-orange-500 to-purple-600 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          )}

          <div className="overflow-y-auto flex-1 p-5 sm:p-7">
            <AnimatePresence mode="wait">
              {!isCompleted ? (
                <form onSubmit={handleSubmit} className="space-y-5 text-xs text-white">
                  
                  {type === 'enroll' && (
                    <>
                      {/* STEP 1: Personal Details */}
                      {currentStep === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="space-y-1.5">
                            <h3 className="text-xl sm:text-2xl font-sans font-black text-white">
                              Begin Your Enrollment
                            </h3>
                            <p className="text-muted-tan text-xs">
                              Enter your correct contact information below. We will use this to confirm registration details.
                            </p>
                          </div>

                          {/* Field: Name */}
                          <div className="space-y-1">
                            <label className="font-bold text-muted-tan uppercase tracking-wide block">Your Full Name:</label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="E.g., Rakesh Yadav"
                                className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Grid fields: Contact details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-muted-tan uppercase tracking-wide block">Email Address:</label>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                                <input
                                  type="email"
                                  required
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="rakesh@jaipur.com"
                                  className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-muted-tan uppercase tracking-wide block">WhatsApp Mobile:</label>
                              <div className="relative">
                                <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                                <input
                                  type="tel"
                                  required
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="+91 98765 XXXXX"
                                  className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {stepError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                              <span>⚠️</span>
                              <span>{stepError}</span>
                            </div>
                          )}

                          <div className="pt-4">
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="w-full bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 text-xs cursor-pointer active:scale-98 transition-transform"
                            >
                              <span>Next: Experience & Goals</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 2: Background & Learning Goals */}
                      {currentStep === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="space-y-1.5">
                            <h3 className="text-xl sm:text-2xl font-sans font-black text-white">
                              Your Profile & Learning Goals
                            </h3>
                            <p className="text-muted-tan text-xs">
                              Help us tailor the cohort projects, mentors, and placement sessions to your level.
                            </p>
                          </div>

                          {/* Field: Current Occupation */}
                          <div className="space-y-1">
                            <label className="font-bold text-muted-tan uppercase tracking-wide block">Current Occupation:</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Student', 'Working Professional', 'Job Seeker', 'Freelancer'].map((occ) => (
                                <button
                                  key={occ}
                                  type="button"
                                  onClick={() => setOccupation(occ)}
                                  className={`py-3 px-4 rounded-xl border text-left flex items-center space-x-2 font-medium transition-all ${
                                    occupation === occ
                                      ? 'border-brand-coral bg-brand-coral/10 text-white'
                                      : 'border-border-tan bg-[#1f1b2e] text-muted-tan hover:border-white/20'
                                  }`}
                                >
                                  {occ === 'Student' && <GraduationCap className="w-4 h-4" />}
                                  {occ === 'Working Professional' && <Briefcase className="w-4 h-4" />}
                                  {occ === 'Job Seeker' && <User className="w-4 h-4" />}
                                  {occ === 'Freelancer' && <Award className="w-4 h-4" />}
                                  <span>{occ}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Field: Learning Goals */}
                          <div className="space-y-1">
                            <label className="font-bold text-muted-tan uppercase tracking-wide block">Primary Learning Goal:</label>
                            <select
                              value={learningGoal}
                              onChange={(e) => setLearningGoal(e.target.value)}
                              className="w-full bg-[#1f1b2e] border border-border-tan rounded-xl py-3 px-3 font-medium focus:outline-none focus:border-brand-coral"
                            >
                              <option value="Career Transition">Career Transition (Change Job/Sector)</option>
                              <option value="Upskilling">Upskilling (Get Promoted / Grow Current Role)</option>
                              <option value="Starting a Business">Starting a Business / Freelancing</option>
                              <option value="College Project Support">Acquiring Skills for College Projects</option>
                            </select>
                          </div>

                          {/* Field: Prior Experience */}
                          <div className="space-y-1">
                            <label className="font-bold text-muted-tan uppercase tracking-wide block">Prior Experience in this Domain:</label>
                            <select
                              value={priorExperience}
                              onChange={(e) => setPriorExperience(e.target.value)}
                              className="w-full bg-[#1f1b2e] border border-border-tan rounded-xl py-3 px-3 font-medium focus:outline-none focus:border-brand-coral"
                            >
                              <option value="Beginner">Beginner / absolute newcomer (No experience)</option>
                              <option value="Intermediate">Intermediate (Self-taught or basics clear)</option>
                              <option value="Advanced">Advanced (Currently working in this domain)</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="w-full border border-border-tan hover:bg-border-tan/20 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 text-xs cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Back</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="w-full bg-brand-coral hover:bg-brand-coral/95 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 text-xs cursor-pointer"
                            >
                              <span>Next: Schedule</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 3: Cohort Preferences & Submission */}
                      {currentStep === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="space-y-1.5">
                            <h3 className="text-xl sm:text-2xl font-sans font-black text-white">
                              Confirm Enrollment Setup
                            </h3>
                            <p className="text-muted-tan text-xs">
                              Select your preferred learning schedule slot & confirmation path to finish enrollment.
                            </p>
                          </div>

                          {/* Field: Course Select */}
                          <div className="space-y-1">
                            <label className="font-bold text-muted-tan uppercase tracking-wide block">Program Specialization:</label>
                            <select
                              value={course}
                              onChange={(e) => setCourse(e.target.value)}
                              className="w-full bg-[#1f1b2e] border border-border-tan rounded-xl py-3 px-3 font-medium focus:outline-none focus:border-brand-coral"
                            >
                              {COURSE_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                              ))}
                            </select>
                          </div>

                          {/* Field: Indian State */}
                          <div className="space-y-1">
                            <label className="font-bold text-muted-tan uppercase tracking-wide block">Select State (Regional Placement Hub):</label>
                            <select
                              value={indianState}
                              onChange={(e) => setIndianState(e.target.value)}
                              className="w-full bg-[#1f1b2e] border border-border-tan rounded-xl py-3 px-3 font-medium focus:outline-none focus:border-brand-coral"
                            >
                              {indianStates.map(state => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                          </div>

                          {/* Field: Preferred Cohort Batch Schedule */}
                          <div className="space-y-1">
                            <label className="font-bold text-muted-tan uppercase tracking-wide block">Preferred Cohort Slot:</label>
                            <select
                              value={preferredBatch}
                              onChange={(e) => setPreferredBatch(e.target.value)}
                              className="w-full bg-[#1f1b2e] border border-border-tan rounded-xl py-3 px-3 font-medium focus:outline-none focus:border-brand-coral"
                            >
                              <option value="Weekday Cohort (Mon/Wed/Fri 8-10 PM)">Weekday Cohort (Mon/Wed/Fri 8-10 PM)</option>
                              <option value="Weekend Cohort (Sat/Sun 10 AM - 1 PM)">Weekend Cohort (Sat/Sun 10 AM - 1 PM)</option>
                              <option value="Self-Paced Track (Flexible Learning)">Self-Paced Track (Flexible Learning)</option>
                            </select>
                          </div>

                          {/* Enrollment terms declaration */}
                          <div className="pt-2">
                            <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-border-tan bg-[#1f1b2e]/60 cursor-pointer">
                              <input
                                type="checkbox"
                                required
                                defaultChecked
                                className="mt-1 accent-brand-coral"
                              />
                              <span className="text-[11px] text-muted-tan leading-relaxed">
                                I confirm my application for direct cohort admission in the selected track, and agree to the placement curriculum guidelines.
                              </span>
                            </label>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <button
                              type="button"
                              onClick={handlePrevStep}
                              className="w-full border border-border-tan hover:bg-border-tan/20 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 text-xs cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Back</span>
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-brand-coral hover:bg-brand-coral/95 disabled:bg-brand-coral/60 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 text-xs cursor-pointer"
                            >
                              {isSubmitting ? (
                                <>
                                  <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent" />
                                  <span>Submitting Setup...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  <span>Submit Application</span>
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* Product Order Form */}
                  {type === 'product' && (
                    <motion.div
                      key="product"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <h3 className="text-xl sm:text-2xl font-sans font-black text-white">
                          Order Your Product
                        </h3>
                        <p className="text-muted-tan text-xs">
                          You are ordering: <strong className="text-brand-coral">{productTitle}</strong>
                        </p>
                      </div>

                      {/* Field: Name */}
                      <div className="space-y-1">
                        <label className="font-bold text-muted-tan uppercase tracking-wide block">Your Full Name:</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="E.g., Rakesh Yadav"
                            className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Grid fields: Contact details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-muted-tan uppercase tracking-wide block">Email Address:</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="rakesh@jaipur.com"
                              className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-muted-tan uppercase tracking-wide block">WhatsApp Mobile:</label>
                          <div className="relative">
                            <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 98765 XXXXX"
                              className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Field: State */}
                      <div className="space-y-1">
                        <label className="font-bold text-muted-tan uppercase tracking-wide block">Select Delivery/Billing State:</label>
                        <select
                          value={indianState}
                          onChange={(e) => setIndianState(e.target.value)}
                          className="w-full bg-[#1f1b2e] border border-border-tan rounded-xl py-3 px-3 font-medium focus:outline-none focus:border-brand-coral"
                        >
                          {indianStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-brand-coral hover:bg-brand-coral/95 disabled:bg-brand-coral/60 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 text-xs cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent" />
                              <span>Processing Order...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Confirm Order Request</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* instructor Registry Form */}
                  {type === 'instructor' && (
                    <motion.div
                      key="instructor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <h3 className="text-xl sm:text-2xl font-sans font-extrabold text-white mb-4">
                        Teach. Earn. Guide.
                      </h3>

                      {/* Field: Name */}
                      <div className="space-y-1">
                        <label className="font-bold text-muted-tan uppercase tracking-wide block">Your Full Name:</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="E.g., Rakesh Yadav"
                            className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-muted-tan uppercase tracking-wide block">Email Address:</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="rakesh@jaipur.com"
                              className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-muted-tan uppercase tracking-wide block">WhatsApp Mobile:</label>
                          <div className="relative">
                            <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 98765 XXXXX"
                              className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-muted-tan uppercase tracking-wide block">Industrial Tenure:</label>
                          <select
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full bg-[#1f1b2e] border border-border-tan rounded-xl py-3 px-3 font-medium focus:outline-none focus:border-brand-coral"
                          >
                            <option value="5-8">5 to 8 Years of Exp</option>
                            <option value="8-12">8 to 12 Years of Exp</option>
                            <option value="12+">12+ Years of Seniority</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-muted-tan uppercase tracking-wide block">Target Track Area:</label>
                          <select
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            className="w-full bg-[#1f1b2e] border border-border-tan rounded-xl py-3 px-3 font-medium focus:outline-none focus:border-brand-coral"
                          >
                            {COURSE_CATEGORIES.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-brand-coral hover:bg-brand-coral/95 disabled:bg-brand-coral/60 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 text-xs cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent" />
                              <span>Registering Application...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Submit Application Details</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Corporate Partners Form */}
                  {type === 'business' && (
                    <motion.div
                      key="business"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <h3 className="text-xl sm:text-2xl font-sans font-extrabold text-white mb-4">
                        Corporate Training Portal
                      </h3>

                      {/* Field: Name */}
                      <div className="space-y-1">
                        <label className="font-bold text-muted-tan uppercase tracking-wide block">Your Full Name:</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="E.g., Rakesh Yadav"
                            className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-muted-tan uppercase tracking-wide block">Email Address:</label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="rakesh@jaipur.com"
                              className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-muted-tan uppercase tracking-wide block">WhatsApp Mobile:</label>
                          <div className="relative">
                            <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+91 98765 XXXXX"
                              className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium placeholder:text-muted-tan/40 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-muted-tan uppercase tracking-wide block">Company or Organization Name:</label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-tan/60" />
                          <input
                            type="text"
                            required
                            value={org}
                            onChange={(e) => setOrg(e.target.value)}
                            placeholder="Jaipur Logistics Ltd"
                            className="w-full bg-[#1f1b2e] border border-border-tan focus:border-brand-coral rounded-xl py-3 pl-10 pr-3 font-medium focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-brand-coral hover:bg-brand-coral/95 disabled:bg-brand-coral/60 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 text-xs cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent" />
                              <span>Registering Application...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Submit Partnership Request</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                </form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-8 space-y-6 text-white"
                >
                  <div className="w-16 h-16 bg-emerald-100 text-live-green rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-100/30">
                    <CheckCircle className="w-10 h-10 stroke-current text-[#10b981]" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-brand-coral bg-brand-coral/10 px-3 py-1 rounded-full">
                      {type === 'product' ? 'â˜… Product Order Reserved' : 'â˜… Admission Ticket Reserved'}
                    </span>
                    <h3 className="text-2xl font-sans font-extrabold text-white mt-2">
                      {type === 'product' ? 'Order Request Logged!' : 'Application Submitted!'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-tan max-w-sm mx-auto leading-relaxed">
                      {type === 'product' ? (
                        <>
                          Dear <strong>{name}</strong>, your order request for <strong>{productTitle}</strong> has been received. Our team will contact you on WhatsApp at <strong>{phone}</strong> to confirm payment and shipping details.
                        </>
                      ) : (
                        <>
                          Dear <strong>{name}</strong>, your enrollment application has been logged into the cohort queue. T2U's Admissions Panel will dispatch your welcome kit and syllabus schedule via email and WhatsApp.
                        </>
                      )}
                    </p>
                  </div>

                  {type === 'product' && (
                    <div className="p-4 bg-[#1f1b2e] rounded-2xl border border-border-tan/50 text-left space-y-2.5 text-[11px] max-w-sm mx-auto font-medium">
                      <p className="text-white flex justify-between">
                        <span>Order Reference:</span>
                        <span className="font-mono font-bold text-brand-coral">#T2U-ORD{Math.floor(100000 + Math.random() * 900000)}</span>
                      </p>
                      <p className="text-white flex justify-between">
                        <span>Product Title:</span>
                        <span className="font-mono font-bold text-orange-400 text-right max-w-[200px] truncate">
                          {productTitle}
                        </span>
                      </p>
                      <p className="text-white flex justify-between">
                        <span>Delivery State:</span>
                        <span className="font-mono font-bold text-white">
                          {indianState}
                        </span>
                      </p>
                      <p className="text-white flex justify-between text-xs border-t border-border-tan pt-2 mt-1">
                        <span>Order Status:</span>
                        <span className="font-mono font-bold text-live-green flex items-center">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Order Logged
                        </span>
                      </p>
                    </div>
                  )}

                  {type === 'enroll' && (
                    <div className="p-4 bg-[#1f1b2e] rounded-2xl border border-border-tan/50 text-left space-y-2.5 text-[11px] max-w-sm mx-auto font-medium">
                      <p className="text-white flex justify-between">
                        <span>Cohort Ticket Batch:</span>
                        <span className="font-mono font-bold text-brand-coral">#T2U-BATCH18</span>
                      </p>
                      <p className="text-white flex justify-between">
                        <span>Selected Program:</span>
                        <span className="font-mono font-bold text-orange-400">
                          {selectedCourseTitle}
                        </span>
                      </p>
                      <p className="text-white flex justify-between">
                        <span>Batch Schedule:</span>
                        <span className="font-mono font-bold">
                          {preferredBatch}
                        </span>
                      </p>
                      <p className="text-white flex justify-between">
                        <span>Current Occupation:</span>
                        <span className="font-mono font-bold">
                          {occupation}
                        </span>
                      </p>
                      <p className="text-white flex justify-between">
                        <span>Admission Goal:</span>
                        <span className="font-mono font-bold">
                          {learningGoal}
                        </span>
                      </p>
                      <p className="text-white flex justify-between text-xs border-t border-border-tan pt-2 mt-1">
                        <span>Registration Status:</span>
                        <span className="font-mono font-bold text-live-green flex items-center">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Enrollment Active
                        </span>
                      </p>
                    </div>
                  )}

                  <button
                    onClick={resetStateAndClose}
                    className="bg-white text-black hover:bg-white/90 text-xs font-bold px-8 py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Got It, Thank You
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

