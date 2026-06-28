import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export type ContentPageType = 
  | 'terms' 
  | 'privacy' 
  | 'refund' 
  | 'about' 
  | 'partner' 
  | 'instructors-hub' 
  | 'success-stories';

interface ContentPageProps {
  type: ContentPageType;
  onBack: () => void;
}

export default function ContentPage({ type, onBack }: ContentPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const content: Record<ContentPageType, any> = {
    terms: {
      title: 'Terms & Conditions',
      lastUpdated: 'June 16, 2026',
      sections: [
        {
          heading: 'Acceptance of Terms',
          text: 'Welcome to T2upgrade Private Limited! These terms and conditions outline the rules and regulations for the use of T2upgrade Private Limited\'s Website and Services, located at our platform. By accessing this website or utilizing our services, we assume you accept these terms and conditions. Do not continue to use T2upgrade Private Limited if you do not agree to take all of the terms and conditions stated on this page.'
        },
        {
          heading: '1. Definitions',
          text: '• "Company", "We", "Our", or "Us" refers to T2upgrade Private Limited.\n• "You", "Your", or "User" refers to the person accessing our website, platform, or services.\n• "Services" refers to all digital products, consulting, software, platforms, or other utilities provided by the Company.'
        },
        {
          heading: '2. Intellectual Property Rights',
          text: 'Unless otherwise stated, T2upgrade Private Limited and/or its licensors own the intellectual property rights for all material, code, text, graphics, logos, and content on this platform. All intellectual property rights are reserved.\n\nYou must not:\n• Republish, sell, rent, or sub-license material from T2upgrade Private Limited.\n• Reproduce, duplicate, or copy material from our platform for commercial redistribution.\n• Reverse engineer, alter, or break down any proprietary software or tech infrastructure belonging to the Company.'
        },
        {
          heading: '3. User Accounts & Security',
          text: 'To access certain features of our services, you may be required to create an account.\n• You must provide accurate, current, and complete information during registration.\n• You are entirely responsible for maintaining the confidentiality of your account credentials (username and password).\n• You agree to notify us immediately at t2upgradeofficial@gmail.com if you suspect any unauthorized use of your account. We will not be liable for losses caused by any unauthorized use of your account.'
        },
        {
          heading: '4. Acceptable Use Policy',
          text: 'You agree not to use our website or services for any purpose that is unlawful, prohibited by these terms, or harmful to third parties. You strictly agree not to:\n• Transmit any viruses, malware, or malicious code.\n• Engage in data mining, scraping, or automated data collection without our express written consent.\n• Use the services to send unsolicited marketing communications (spam).\n• Attempt to gain unauthorized access to any part of our servers, networks, or connected databases.'
        },
        {
          heading: '5. Payments, Fees, and Billing',
          text: 'If you purchase any services or products from T2upgrade Private Limited:\n• You agree to pay all applicable fees, taxes, and duties associated with your purchases.\n• All payments are processed securely through authorized third-party payment gateways.\n• Refund Policy: All payments are non-refundable unless specified otherwise in a specific service level agreement (SLA) or product contract.'
        },
        {
          heading: '6. Limitation of Liability',
          text: 'To the maximum extent permitted by applicable law, T2upgrade Private Limited, its directors, employees, or affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses resulting from:\n• Your access to or use of (or inability to access or use) the service.\n• Any conduct or content of any third party on the service.\n• Any content obtained from the service.'
        },
        {
          heading: '7. Service Modifications and Downtime',
          text: 'We reserve the right to withdraw, amend, or modify our services or website without prior notice. From time to time, we may restrict access to some parts of the platform for maintenance or updates. We will not be held liable if, for any reason, all or any part of the platform is unavailable at any time or for any period.'
        },
        {
          heading: '8. Termination',
          text: 'We reserve the right to terminate or suspend your account and access to our services instantly, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms and Conditions.'
        },
        {
          heading: '9. Governing Law & Jurisdiction',
          text: 'These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts located in Bikaner or Jaipur, Rajasthan, India.'
        },
        {
          heading: '10. Changes to These Terms',
          text: 'We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 15 days\' notice prior to any new terms taking effect. By continuing to access or use our platform after those revisions become effective, you agree to be bound by the revised terms.'
        },
        {
          heading: '11. Contact Information',
          text: 'If you have any questions about these Terms and Conditions, please reach out to us:\n• Company Name: T2upgrade Private Limited\n• Email: t2upgradeofficial@gmail.com\n• Registered Address: Ward no. 18, mochiyon ka mohalla Lunkaransar, Rajasthan, India'
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'June 16, 2026',
      sections: [
        {
          heading: 'Introduction',
          text: 'At T2upgrade Private Limited, accessible from t2upgrade.com (and/or our mobile applications), one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by T2upgrade Private Limited and how we use it. If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at t2upgradeofficial@gmail.com.'
        },
        {
          heading: '1. Consent',
          text: 'By using our website or services, you hereby consent to our Privacy Policy and agree to its terms.'
        },
        {
          heading: '2. Information We Collect',
          text: 'The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.\n\n• Account Information: When you register for an Account, we may ask for your contact information, including items such as your name, company name, address, email address, and telephone number.\n• Communications: If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.\n• Payment & Transaction Data: If you purchase products or services from us, we collect information necessary to process your payment, such as billing details. (Note: We do not store raw credit/debit card numbers directly on our servers; they are processed by secure third-party payment gateways).'
        },
        {
          heading: '3. How We Use Your Information',
          text: 'We use the information we collect in various ways, including to:\n• Provide, operate, and maintain our website and business services.\n• Improve, personalize, and expand our website and offerings.\n• Understand and analyze how you use our website and services.\n• Develop new products, services, features, and functionality.\n• Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.\n• Send you emails or notifications regarding your account or transactions.\n• Find and prevent fraudulent activities.'
        },
        {
          heading: '4. Log Files',
          text: 'T2upgrade Private Limited follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this as part of hosting services\' analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users\' movement on the website, and gathering demographic information.'
        },
        {
          heading: '5. Cookies and Web Beacons',
          text: 'Like any other website, our platform uses \'cookies\'. These cookies are used to store information including visitors\' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users\' experience by customizing our web page content based on visitors\' browser type and/or other information.'
        },
        {
          heading: '6. Third-Party Privacy Policies',
          text: 'T2upgrade Private Limited\'s Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers or services for more detailed information. It may include their practices and instructions about how to opt-out of certain options.\n\nYou can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers\' respective websites.'
        },
        {
          heading: '7. Data Protection Rights (Under Applicable Indian Laws)',
          text: 'We want to ensure you are fully aware of all of your data protection rights. Every user is entitled to the following:\n• The right to access: You have the right to request copies of your personal data.\n• The right to rectification: You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.\n• The right to erasure: You have the right to request that we erase your personal data, under certain conditions.\n• The right to withdraw consent: Where you have given consent for us to process your data, you have the right to withdraw that consent at any time.'
        },
        {
          heading: '8. Children\'s Information',
          text: 'Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.\n\nT2upgrade Private Limited does not knowingly collect any Personal Identifiable Information from children under the age of 13 (or the applicable statutory age in your jurisdiction). If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.'
        },
        {
          heading: '9. Contact Us & Grievance Redressal',
          text: 'If you have any questions or suggestions about our Privacy Policy, or if you wish to file a grievance regarding data handling, please contact our designated Grievance Officer:\n\n• Company Name: T2upgrade Private Limited\n• Attn / Grievance Officer: Kishan lal khatri (Director of Company)\n• Email: t2upgradeofficial@gmail.com\n• Address: Ward no. 18, mochiyon ka mohalla, Lunkaransar, Rajasthan, India'
        }
      ]
    },
    refund: {
      title: '30-Day Refund & Cancellation Policy',
      lastUpdated: 'June 16, 2026',
      sections: [
        {
          heading: 'Governed by Consumer Protection (Direct Selling) Rules, 2021',
          text: 'At T2upgrade Private Limited, we prioritize transparency and compliance with the Department of Consumer Affairs guidelines. In accordance with the legal mandate for a Cooling-Off Period, we offer an extended 30-day money-back guarantee to all our customers and independent Direct Sellers.'
        },
        {
          heading: '1. The 30-Day Cooling-Off Period',
          text: 'Every participant (customer or direct seller) has the right to reconsider their purchase or contract. You may cancel your product order or service agreement within 30 days from:\n• The date of delivery of physical products.\n• The date of activation/execution of a service contract.\n\nCancellation under this policy will not result in any breach of contract or levy of any penalty.'
        },
        {
          heading: '2. Eligibility Criteria for Refunds',
          text: 'To claim a full refund under this cooling-off policy, the goods or services must be "Saleable" as defined under Rule 3(1)(i) of the Direct Selling Rules, 2021:\n\n• Physical Goods: Must be unused, completely marketable, intact in original packaging, and must not have expired.\n• Excluded Items: This policy does not cover products that are seasonal, discontinued, custom-tailored, or explicitly sold under "special promotions" where specified at the pre-purchase stage.\n• Services / Digital Content: If a service or digital access has been consumed in full, or if value has been fundamentally extracted within the 30 days, the refund will be evaluated proportionally on the unperformed fraction.'
        },
        {
          heading: '3. The Refund Process',
          text: 'To initiate a refund, you must log your request through our official channels within the 30-day window:\n\n1. Submit Cancellation Request (Days 1 - 30): Email your written request to t2upgradeofficial@gmail.com or raise a ticket on our official portal. You must provide your Order Form / Invoice Number and registered identity details.\n2. Return the Goods (Within 7 Days of Approval): Upon approval, ship the unused, saleable items back to our warehouse or hand them over to an authorized company representative.\n3. Verification & Inspection (48 - 72 Hours): Our team will inspect the returned package to ensure compliance with the "saleable condition" guidelines.\n4. Credit Reversal (Immediate Execution): Once verified, the full amount will be credited back via the original mode of payment (bank account, UPI, or card) with no processing deductions.'
        },
        {
          heading: '4. Obligations for Direct Sellers',
          text: 'If you are an independent Direct Seller for T2upgrade Private Limited:\n• You are legally obligated to communicate this 30-day cooling-off and refund policy to every customer verbally and in writing (on the order form) before taking any money.\n• Any misrepresentation of product capabilities or hiding the refund clause constitutes "Mis-selling" and will result in immediate termination of your contract.'
        },
        {
          heading: '5. Grievance Redressal',
          text: 'If your refund is delayed or you face issues during the cancellation window, you have immediate access to our dedicated statutory dispute desk:\n\n• Grievance Officer: Kishan lal khatri (Director)\n• Turnaround Time: Your complaint will be acknowledged within 48 working hours and resolved fully within 30 days.\n• Contact Support: t2upgradeofficial@gmail.com / +91 92694 88028\n\nCrucial Compliance Tip: Make sure this exact refund timeline matches what is printed on your physical and digital Order Forms. Under Rule 6, every initial sale must give the consumer a clear, readable order form outlining these exact terms.'
        }
      ]
    },
    about: {
      title: 'About T2U',
      lastUpdated: 'February 10, 2026',
      sections: [
        {
          heading: 'Our Vision',
          text: 'At T2U, our vision is to democratize high-quality, practical education for everyone across India. We believe in empowering the next generation of builders, thinkers, and leaders by providing them with the exact skills they need to succeed in the modern digital economy.'
        },
        {
          heading: 'What We Offer',
          text: 'We are an all-in-one learn, sell, and e-commerce platform that offers live interactive cohort courses, hands-on portfolios, and network leadership mastery. Our curriculum is designed by industry experts with 5+ years of real-world experience, ensuring our learners get the most relevant and up-to-date knowledge.'
        },
        {
          heading: 'The T2U Differentiator',
          text: 'Every single track forces you to ship a live, verifiable portfolio deployment. We go beyond traditional video lectures by providing interactive learning environments, strict KYC criteria for verified learners, and a transparent multi-stream referral payout engine.'
        },
        {
          heading: 'Our Commitment',
          text: 'We are committed to full compliance, transparency, and the success of our community. From our 100% placement assistance programs to our transparent affiliate compensation wallet portal, every feature is built to help you upgrade your skills, income, and life.'
        }
      ]
    },
    partner: {
      title: 'Become a Partner',
      lastUpdated: 'February 15, 2026',
      sections: [
        {
          heading: 'Why Partner with T2U?',
          text: 'T2U is actively building a robust B2B Enterprise Node. We collaborate with companies, recruitment networks, and marketing agencies to create tailored educational cohorts and strategic human capital partnerships. Partnering with us means tapping into a pre-vetted, highly project-audited talent pool.'
        },
        {
          heading: 'Corporate Training Solutions',
          text: 'We provide custom training groups for your company to meet specific staffing needs. Whether you are scaling from 10 to 1,000 employees, our platform allows you to track each employee\'s learning progress through individual analytics modules.'
        },
        {
          heading: 'Talent Hiring Pools',
          text: 'Acquire skilled learners who have completed real-world projects across high-impact digital skill categories. Our verified Github and LMS builds ensure that the candidates you hire have practical, verifiable experience.'
        },
        {
          heading: 'Channel Partnerships',
          text: 'Enroll as a Certified regional master affiliate partner. Refer individuals in your area and unlock a special profit-sharing plan designed exclusively for your company\'s revenue pool. Grow with us as we expand across the nation.'
        }
      ]
    },
    'instructors-hub': {
      title: 'Instructors Hub',
      lastUpdated: 'March 1, 2026',
      sections: [
        {
          heading: 'Join the Faculty Node',
          text: 'Got 5+ years of experience in your field? T2U is looking for passionate experts to teach, earn, and inspire. Whether you teach coding, wellness, business, or traditional arts, if you are an expert, you belong here.'
        },
        {
          heading: 'Host Live Cohorts',
          text: 'Join our elite roster of practitioners teaching the next generation of builders. You have the freedom to host live interactive classes, set your own modules, and define your teaching style in a way that resonates with your audience.'
        },
        {
          heading: 'Generous Educator Royalties',
          text: 'We believe that great educators should be rewarded. Earn generous educator royalties based on your cohort sizes. Our transparent payout engine ensures you get compensated fairly for the value you provide to your learners.'
        },
        {
          heading: 'Build Your Audience',
          text: 'T2U is more than just a teaching platform; it is a community. Build a loyal audience of learners, mentor them through hands-on portfolios, and establish yourself as a thought leader in your domain.'
        }
      ]
    },
    'success-stories': {
      title: 'Success Stories',
      lastUpdated: 'March 5, 2026',
      sections: [
        {
          heading: 'Real Results from Real Learners',
          text: 'Our platform is built for India\'s next generation of achievers. We have witnessed countless learners transition from complete beginners to masters in their respective fields, securing high-paying digital jobs and starting their own successful ventures.'
        },
        {
          heading: 'From Learner to Master',
          text: 'Every course helps you complete real projects that you can show to employers. Our alumni have successfully shipped live, verifiable portfolio deployments that have caught the attention of top tech companies and dynamic startups.'
        },
        {
          heading: 'Network Leadership and Growth',
          text: 'Through our transparent multi-stream referral payout engine, many of our users have not only upgraded their skills but also built significant passive income streams. They have learned how to lead teams, grow their networks, and achieve financial independence.'
        },
        {
          heading: 'Community Highlights',
          text: 'We celebrate the success of every individual in the T2U ecosystem. From our elite peer circles to our interactive forums, the support system here is unparalleled. When you succeed, the entire community thrives.'
        }
      ]
    }
  };

  const data = content[type] || content.about;

  return (
    <div className="min-h-[80vh] bg-warm-cream pt-24 pb-16 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <button 
          onClick={onBack}
          className="flex items-center text-brand-coral hover:text-brand-coral/80 font-semibold mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        <div 
          className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-brand-mustard/5 border border-border-tan relative overflow-hidden"
          style={{ 
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)', 
            backgroundSize: '40px 40px',
            backgroundPosition: 'center'
          }}
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-coral/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          
          <div className="relative z-10 bg-white/70 p-6 -m-6 rounded-2xl">
            <h1 className="text-3xl sm:text-4xl font-black text-black mb-4">
              {data.title}
            </h1>
            <p className="text-sm text-gray-500 mb-10 pb-6 border-b border-gray-100">
              Last Updated: {data.lastUpdated}
            </p>

            <div className="space-y-8">
              {data.sections.map((section: any, idx: number) => (
                <div key={idx}>
                  <h2 className="text-xl font-bold text-dark-charcoal mb-3">
                    {section.heading}
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                If you have any questions or concerns regarding these details, please contact us at <a href="mailto:t2upgradeofficial@gmail.com" className="text-brand-coral hover:underline font-semibold">t2upgradeofficial@gmail.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
