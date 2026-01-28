/**
 * PrivacyPage
 *
 * GDPR-compliant Privacy Policy for the Doomsday platform.
 * Displays data collection, usage, and user rights information.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Mail, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LegalContent, type LegalSection } from '@/components/legal/LegalContent'
import { useLegalStore, PRIVACY_VERSION } from '@/store/legal'

const LAST_UPDATED = 'January 28, 2026'

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: `This Privacy Policy explains how Doomsday ("we", "us", or "our") collects, uses, shares, and protects your personal information when you use our prediction market platform.

We are committed to protecting your privacy and handling your data responsibly. This policy complies with the General Data Protection Regulation (GDPR) and other applicable privacy laws.

Data Controller: Doomsday App
Contact: privacy@doomsday.app`,
  },
  {
    id: 'collection',
    title: 'Information We Collect',
    content: `We collect different types of information depending on how you use our Service:`,
    subsections: [
      {
        id: 'provided-info',
        title: 'Information You Provide',
        content: `• Wallet address (when you connect your wallet)
• Username and display name
• Profile information (avatar, bio)
• Posts, comments, and other content you create
• Prediction and betting activity
• Communication with our support team`,
      },
      {
        id: 'auto-collected',
        title: 'Automatically Collected Information',
        content: `• Device information (type, operating system, browser)
• IP address (anonymized after 30 days)
• Usage data (pages visited, features used)
• Performance and error data
• Referral source`,
      },
      {
        id: 'cookies',
        title: 'Cookies and Similar Technologies',
        content: `We use cookies for:
• Essential functionality (required for the Service to work)
• Analytics (to understand how you use the Service)
• Preferences (to remember your settings)

You can manage cookie preferences in your browser or through our cookie settings. See our Cookie Policy for more details.`,
      },
    ],
  },
  {
    id: 'usage',
    title: 'How We Use Your Information',
    content: `We process your information based on the following legal bases under GDPR:`,
    subsections: [
      {
        id: 'legal-bases',
        title: 'Legal Bases for Processing',
        content: `• Contract Performance: To provide and maintain the Service
• Legitimate Interests: To improve the Service, prevent fraud, and ensure security
• Consent: For optional features like marketing communications
• Legal Obligation: To comply with applicable laws and regulations`,
      },
      {
        id: 'purposes',
        title: 'Purposes of Processing',
        content: `• Provide prediction market services and process transactions
• Create and manage your account
• Process predictions and distribute rewards
• Prevent fraud, abuse, and unauthorized access
• Improve and optimize the Service
• Send service-related notifications
• Respond to your inquiries and support requests
• Comply with legal obligations`,
      },
    ],
  },
  {
    id: 'sharing',
    title: 'Data Sharing and Disclosure',
    content: `We may share your information in the following circumstances:`,
    subsections: [
      {
        id: 'third-parties',
        title: 'Third-Party Services',
        content: `• Blockchain networks (transaction data is public on-chain)
• Analytics providers (anonymized usage data)
• Infrastructure providers (hosting, CDN)
• Security services (fraud prevention)

All third-party providers are contractually bound to protect your data.`,
      },
      {
        id: 'legal-requirements',
        title: 'Legal Requirements',
        content: `We may disclose your information if required by law, court order, or government request, or if we believe disclosure is necessary to:
• Protect our rights, property, or safety
• Prevent fraud or illegal activity
• Comply with regulatory requirements`,
      },
    ],
  },
  {
    id: 'retention',
    title: 'Data Retention',
    content: `We retain your information for as long as necessary to provide the Service and fulfill the purposes described in this policy.

• Active account data: Retained while your account is active
• Inactive accounts: Data deleted after 2 years of inactivity
• Transaction records: Retained for 7 years for legal compliance
• Blockchain data: Cannot be deleted (inherent to blockchain technology)

You can request deletion of your data at any time (see Your Rights section).`,
  },
  {
    id: 'rights',
    title: 'Your Rights (GDPR)',
    content: `Under GDPR, you have the following rights regarding your personal data:`,
    subsections: [
      {
        id: 'access-rights',
        title: 'Access and Portability',
        content: `• Right to Access: Request a copy of your personal data
• Right to Portability: Receive your data in a machine-readable format`,
      },
      {
        id: 'correction-rights',
        title: 'Correction and Deletion',
        content: `• Right to Rectification: Correct inaccurate personal data
• Right to Erasure: Request deletion of your personal data ("right to be forgotten")`,
      },
      {
        id: 'control-rights',
        title: 'Control and Objection',
        content: `• Right to Restrict Processing: Limit how we use your data
• Right to Object: Object to processing based on legitimate interests
• Right to Withdraw Consent: Withdraw consent at any time (where consent is the legal basis)`,
      },
      {
        id: 'automated-decisions',
        title: 'Automated Decision-Making',
        content: `• Right to not be subject to automated decision-making, including profiling, that significantly affects you`,
      },
    ],
  },
  {
    id: 'exercise-rights',
    title: 'How to Exercise Your Rights',
    content: `To exercise any of these rights, contact us at:

Email: privacy@doomsday.app
Subject: "Data Rights Request"

We will respond to your request within 30 days. You may also lodge a complaint with your local data protection authority.`,
  },
  {
    id: 'international',
    title: 'International Data Transfers',
    content: `Your data may be transferred to and processed in countries outside the European Economic Area (EEA). When we transfer data internationally, we ensure appropriate safeguards are in place:

• Standard Contractual Clauses (SCCs)
• Adequacy decisions by the European Commission
• Other lawful transfer mechanisms

Contact us for more information about our international data transfer safeguards.`,
  },
  {
    id: 'security',
    title: 'Data Security',
    content: `We implement appropriate technical and organizational measures to protect your personal data:

• Encryption of data in transit and at rest
• Access controls and authentication
• Regular security assessments
• Incident response procedures
• Employee training on data protection

While we strive to protect your data, no system is completely secure. We encourage you to use strong passwords and protect your wallet credentials.`,
  },
  {
    id: 'children',
    title: "Children's Privacy",
    content: `The Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18.

If you believe we have collected information from a child under 18, please contact us immediately at privacy@doomsday.app. We will take steps to delete such information.`,
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of material changes by:

• Posting the updated policy on the Service
• Updating the "Last Updated" date
• Sending you a notification (for significant changes)

Your continued use of the Service after changes are posted constitutes acceptance of the updated policy. Where required by law, we will seek your consent for material changes.`,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: `If you have questions about this Privacy Policy or our data practices, please contact us:

Email: privacy@doomsday.app
Data Protection Officer: dpo@doomsday.app
Address: [Company Address]

For EU residents, you may also contact your local data protection authority.`,
  },
]

export function PrivacyPage() {
  const navigate = useNavigate()
  const privacyAcceptedVersion = useLegalStore((state) => state.privacyAcceptedVersion)
  const acceptPrivacy = useLegalStore((state) => state.acceptPrivacy)
  const needsAcceptance = privacyAcceptedVersion !== PRIVACY_VERSION

  const handleAccept = () => {
    acceptPrivacy(PRIVACY_VERSION)
    navigate(-1)
  }

  const handleDownloadData = () => {
    // In production, this would trigger a data export request
    alert('Data export request submitted. You will receive an email with your data.')
  }

  return (
    <div className="flex flex-col min-h-full bg-black pb-20">
      <PageHeader
        title="Privacy Policy"
        leftAction={
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={24} className="text-white" />
          </button>
        }
        rightAction={<Shield size={20} className="text-[#777]" />}
      />

      <div className="flex-1 px-4 py-6">
        {/* Quick actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleDownloadData}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-[13px] text-white hover:bg-[#222] transition-colors"
          >
            <Download size={16} />
            Download My Data
          </button>
          <a
            href="mailto:privacy@doomsday.app"
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-[13px] text-white hover:bg-[#222] transition-colors"
          >
            <Mail size={16} />
            Contact DPO
          </a>
        </div>

        <LegalContent
          sections={PRIVACY_SECTIONS}
          lastUpdated={LAST_UPDATED}
          version={PRIVACY_VERSION}
        />
      </div>

      {needsAcceptance && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-[#333]">
          <button
            onClick={handleAccept}
            className="w-full py-3 bg-[#ff3040] text-white font-semibold rounded-full hover:bg-[#e62a38] transition-colors"
          >
            Accept Privacy Policy
          </button>
          <p className="text-center text-[12px] text-[#777] mt-2">
            By accepting, you acknowledge our data practices
          </p>
        </div>
      )}
    </div>
  )
}
