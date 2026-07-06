import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Mail, User, Phone, MapPin, Briefcase, BookOpen, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface InstructorFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructorApplicationForm({ isOpen, onClose }: InstructorFormProps) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    expertise: '',
    courseTitle: '',
    courseCategory: '',
    courseDescription: '',
    teachingExperience: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.cms.instructorApplications.submit({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        experience: formData.experience,
        expertise: formData.expertise,
        course_title: formData.courseTitle,
        course_category: formData.courseCategory,
        course_description: formData.courseDescription,
        teaching_experience: formData.teachingExperience,
      });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-xl font-black text-white">Become an Instructor</h2>
                <p className="text-blue-100 mt-1 text-xs font-semibold">Step {step} of 3</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-3 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: '33%' }}
                animate={{ width: `${(step / 3) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
              />
            </div>

            {/* Form Content */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto">
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Your Information</h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        <User className="w-3 h-3 inline mr-1" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        <Mail className="w-3 h-3 inline mr-1" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        <Phone className="w-3 h-3 inline mr-1" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 XXXX XXXX XX"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        City/Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Mumbai, India"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Professional Background */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Your Expertise</h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        <Briefcase className="w-3 h-3 inline mr-1" />
                        Years of Experience
                      </label>
                      <select
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      >
                        <option value="">Select experience level</option>
                        <option value="0-2">0-2 years</option>
                        <option value="2-5">2-5 years</option>
                        <option value="5-10">5-10 years</option>
                        <option value="10+">10+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Your Main Expertise
                      </label>
                      <input
                        type="text"
                        name="expertise"
                        value={formData.expertise}
                        onChange={handleInputChange}
                        placeholder="e.g., Full Stack Development, Data Science"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Teaching Experience
                      </label>
                      <textarea
                        name="teachingExperience"
                        value={formData.teachingExperience}
                        onChange={handleInputChange}
                        placeholder="Describe your teaching/mentoring experience"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Course Information */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Your Course</h3>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        <BookOpen className="w-3 h-3 inline mr-1" />
                        Course Title
                      </label>
                      <input
                        type="text"
                        name="courseTitle"
                        value={formData.courseTitle}
                        onChange={handleInputChange}
                        placeholder="e.g., Complete Web Development Bootcamp"
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Course Category
                      </label>
                      <select
                        name="courseCategory"
                        value={formData.courseCategory}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      >
                        <option value="">Select category</option>
                        <option value="Technology">Technology</option>
                        <option value="Business">Business</option>
                        <option value="Design">Design</option>
                        <option value="Health & Fitness">Health & Fitness</option>
                        <option value="Professional Skills">Professional Skills</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Course Description
                      </label>
                      <textarea
                        name="courseDescription"
                        value={formData.courseDescription}
                        onChange={handleInputChange}
                        placeholder="Describe what students will learn..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white focus:border-blue-600 focus:outline-none transition-all"
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="space-y-2 pt-3 sticky bottom-0 bg-white dark:bg-slate-900">
                  {submitError && <p className="text-xs text-red-500 font-medium text-center">{submitError}</p>}
                  <div className="flex gap-3">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex-1 px-4 py-2 text-sm border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                      >
                        Back
                      </button>
                    )}
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : 'Submit Application'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center"
              >
                <motion.div
                  animate={{ scale: [0.8, 1.1, 1] }}
                  transition={{ duration: 0.6 }}
                  className="mb-6"
                >
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                </motion.div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                  Application Submitted!
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                  Thank you, {formData.fullName}!
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  We'll review your application and contact you within 48 hours.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Close
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
