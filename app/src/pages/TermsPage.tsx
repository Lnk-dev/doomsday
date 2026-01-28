/**
 * TermsPage
 *
 * Terms of Service page for the Doomsday betting platform.
 * Displays comprehensive terms with acceptance tracking.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LegalContent, type LegalSection } from '@/components/legal/LegalContent'
import { useLegalStore, TERMS_VERSION } from '@/store/legal'

const LAST_UPDATED = 'January 28, 2026'

const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: `By accessing or using the Doomsday prediction market platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.

You must be at least 18 years of age to use this Service. By using the Service, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these terms.

The Service may not be available in all jurisdictions. You are responsible for ensuring that your use of the Service complies with all applicable laws in your jurisdiction.`,
  },
  {
    id: 'service',
    title: 'Description of Service',
    content: `Doomsday is a prediction market platform that allows users to make predictions on future events using $DOOM and $LIFE tokens. The Service includes:`,
    subsections: [
      {
        id: 'prediction-markets',
        title: 'Prediction Markets',
        content: `Users can stake tokens on the outcomes of events. Predictions are resolved based on verifiable outcomes, and payouts are distributed accordingly.`,
      },
      {
        id: 'token-mechanics',
        title: 'Token Mechanics',
        content: `$DOOM tokens represent pessimistic predictions, while $LIFE tokens represent optimistic predictions. Tokens have no inherent monetary value and are for entertainment purposes only.`,
      },
      {
        id: 'social-features',
        title: 'Social Features',
        content: `The Service includes social features such as posts, follows, likes, and comments. All user-generated content is subject to our content policies.`,
      },
    ],
  },
  {
    id: 'accounts',
    title: 'User Accounts',
    content: `To use certain features of the Service, you may connect a cryptocurrency wallet. You are responsible for maintaining the security of your wallet and any associated private keys.

You agree to provide accurate information and to update your information as necessary. You may not use the Service to impersonate others or create misleading accounts.

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    id: 'market-rules',
    title: 'Prediction Market Rules',
    content: `All predictions are final once submitted. The outcome of predictions is determined by verifiable events and resolved according to our resolution policies.

Disputes regarding prediction outcomes may be submitted for review. Our decision on disputes is final.

Fees may apply to certain transactions. Current fee schedules are displayed in the application.`,
  },
  {
    id: 'user-content',
    title: 'User Content',
    content: `You retain ownership of content you post to the Service. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the Service.

You agree not to post content that:`,
    subsections: [
      {
        id: 'prohibited-content',
        title: 'Prohibited Content',
        content: `• Is illegal, harmful, threatening, abusive, or harassing
• Infringes on intellectual property rights
• Contains malware or malicious code
• Attempts to manipulate prediction markets
• Violates the privacy of others
• Is spam or commercial solicitation`,
      },
    ],
  },
  {
    id: 'prohibited',
    title: 'Prohibited Activities',
    content: `The following activities are prohibited:`,
    subsections: [
      {
        id: 'prohibited-list',
        title: 'Prohibited Actions',
        content: `• Market manipulation or coordinated trading
• Use of bots or automated systems without authorization
• Creating multiple accounts to circumvent limits
• Exploiting bugs or vulnerabilities
• Interfering with other users' enjoyment of the Service
• Attempting to reverse engineer the Service`,
      },
    ],
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THE ACCURACY OF PREDICTIONS OR OUTCOMES.

This Service is for entertainment purposes only. Nothing on this platform constitutes financial, investment, or gambling advice. You should not rely on the Service for financial decisions.

We do not guarantee that the Service will be available at all times or that it will be free from errors or interruptions.`,
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

Our total liability to you for any claims arising from the Service shall not exceed the amount you have paid to us in the 12 months preceding the claim.

Some jurisdictions do not allow limitations on liability, so these limitations may not apply to you.`,
  },
  {
    id: 'termination',
    title: 'Termination',
    content: `We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice.

Upon termination, your right to use the Service will immediately cease. Provisions of these terms that by their nature should survive termination shall survive.

You may request deletion of your account data by contacting us. Note that some information may be retained as required by law or for legitimate business purposes.`,
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: `These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.

Any disputes arising from these terms or your use of the Service shall be resolved through binding arbitration, except where prohibited by law.

You agree to waive your right to participate in class action lawsuits against us, to the extent permitted by law.`,
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    content: `We may update these terms from time to time. We will notify you of material changes by posting the new terms on the Service and updating the "Last Updated" date.

Your continued use of the Service after changes are posted constitutes your acceptance of the updated terms.

We encourage you to review these terms periodically for any changes.`,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    content: `If you have questions about these Terms of Service, please contact us at:

Email: legal@doomsday.app
Address: [Company Address]

For privacy-related inquiries, please see our Privacy Policy.`,
  },
]

export function TermsPage() {
  const navigate = useNavigate()
  const tosAcceptedVersion = useLegalStore((state) => state.tosAcceptedVersion)
  const acceptTos = useLegalStore((state) => state.acceptTos)
  const needsAcceptance = tosAcceptedVersion !== TERMS_VERSION

  const handleAccept = () => {
    acceptTos(TERMS_VERSION)
    navigate(-1)
  }

  return (
    <div className="flex flex-col min-h-full bg-black pb-20">
      <PageHeader
        title="Terms of Service"
        leftAction={
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={24} className="text-white" />
          </button>
        }
        rightAction={<FileText size={20} className="text-[#777]" />}
      />

      <div className="flex-1 px-4 py-6">
        <LegalContent
          sections={TERMS_SECTIONS}
          lastUpdated={LAST_UPDATED}
          version={TERMS_VERSION}
        />
      </div>

      {needsAcceptance && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-[#333]">
          <button
            onClick={handleAccept}
            className="w-full py-3 bg-[#ff3040] text-white font-semibold rounded-full hover:bg-[#e62a38] transition-colors"
          >
            Accept Terms of Service
          </button>
          <p className="text-center text-[12px] text-[#777] mt-2">
            By accepting, you agree to be bound by these terms
          </p>
        </div>
      )}
    </div>
  )
}
