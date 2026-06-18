import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
              <FileText size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
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
          <Section title="1. Acceptance of Terms">
            By accessing or using Store Ledger, you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not
            use the application.
          </Section>

          <Section title="2. Description of Service">
            Store Ledger is a store management and credit ledger application that
            allows users to manage customers, track transactions, manage inventory,
            and maintain business records. The service is provided as-is for
            business management purposes.
          </Section>

          <Section title="3. User Accounts">
            You are responsible for maintaining the confidentiality of your account
            credentials. You agree to notify us immediately of any unauthorized use
            of your account. You must provide accurate and complete information when
            creating your account.
          </Section>

          <Section title="4. Acceptable Use">
            You agree not to:
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-400">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the system</li>
              <li>Upload malicious code or attempt to disrupt the service</li>
              <li>Share your account credentials with others</li>
              <li>Use the service to store illegal or harmful content</li>
            </ul>
          </Section>

          <Section title="5. Data Ownership">
            You retain full ownership of all data you enter into Store Ledger,
            including customer records, transactions, and inventory data. We do
            not claim any ownership over your business data.
          </Section>

          <Section title="6. Data Backup">
            While we take reasonable measures to protect your data, we recommend
            maintaining your own backups of critical business information. We are
            not liable for any data loss due to technical failures.
          </Section>

          <Section title="7. Service Availability">
            We strive to maintain high availability but do not guarantee
            uninterrupted access to the service. Scheduled maintenance or
            unforeseen technical issues may occasionally cause downtime.
          </Section>

          <Section title="8. Limitation of Liability">
            Store Ledger is provided on an "as is" basis. We are not liable for
            any indirect, incidental, or consequential damages arising from your
            use of the service, including loss of business data or revenue.
          </Section>

          <Section title="9. Termination">
            We reserve the right to suspend or terminate your account if you
            violate these terms. You may also delete your account at any time
            from the Settings page.
          </Section>

          <Section title="10. Changes to Terms">
            We may update these Terms of Service at any time. Continued use of
            the service after changes constitutes acceptance of the new terms.
            We will notify users of significant changes via email.
          </Section>

          <Section title="11. Contact">
            For any questions regarding these Terms of Service, contact us at{" "}
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
