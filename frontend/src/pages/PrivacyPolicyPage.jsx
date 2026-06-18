import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>
          <p className="text-gray-500 text-sm">Last updated: June 2026</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8 bg-gray-900 rounded-2xl border border-gray-800 p-8"
        >
          <Section title="1. Information We Collect">
            We collect information you provide directly to us, such as your name,
            email address, and password when you register for an account. We also
            collect data you enter into the application, including customer records,
            transaction history, and inventory information.
          </Section>

          <Section title="2. How We Use Your Information">
            We use the information we collect to provide, maintain, and improve our
            services, send you transactional emails (such as email verification and
            password reset), and ensure the security of your account through
            multi-factor authentication.
          </Section>

          <Section title="3. Data Storage & Security">
            Your data is stored securely using industry-standard encryption. We use
            MongoDB Atlas for database storage, and all passwords are hashed using
            bcrypt. We implement rate limiting and account lockout mechanisms to
            protect against unauthorized access.
          </Section>

          <Section title="4. Third-Party Services">
            We use the following third-party services to operate Store Ledger:
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-400">
              <li>Google OAuth — for social login (optional)</li>
              <li>Facebook OAuth — for social login (optional)</li>
              <li>Resend — for transactional email delivery</li>
              <li>Render — for backend hosting</li>
              <li>Vercel — for frontend hosting</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing">
            We do not sell, trade, or rent your personal information to third
            parties. Your data is only shared with third-party services as necessary
            to operate the application (as listed above).
          </Section>

          <Section title="6. Your Rights">
            You have the right to access, correct, or delete your personal data at
            any time. You can update your profile information from the Settings page.
            To request complete account deletion, contact us at the email below.
          </Section>

          <Section title="7. Cookies">
            We use cookies and local storage to maintain your login session. No
            advertising or tracking cookies are used.
          </Section>

          <Section title="8. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you
            of any significant changes by email or through the application.
          </Section>

          <Section title="9. Contact Us">
            If you have any questions about this Privacy Policy, please contact us
            at{" "}
            <a
              href="mailto:support@storeledger.com"
              className="text-indigo-400 hover:text-indigo-300"
            >
              support@storeledger.com
            </a>
            .
          </Section>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
      <p className="text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}
