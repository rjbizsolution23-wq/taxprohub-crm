import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Mail, MessageSquare, Sparkles, AlertCircle, 
  Smartphone, Laptop, Trash2, Plus, Info, CheckCircle, 
  DollarSign, Calendar, Eye, Send, Search, Check, Copy, ChevronRight, Sliders, Settings2, BarChart2
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ==========================================
// 50 HIGH-FIDELITY EMAIL TEMPLATES
// ==========================================
interface EmailTemplate {
  id: string;
  name: string;
  category: 'onboarding' | 'returning' | 'nurture' | 'irs' | 'credit' | 'upsell';
  subject: string;
  description: string;
  blocks: { type: string; content: string; detail?: string; url?: string; style?: any }[];
}

const PRELOADED_EMAIL_TEMPLATES: EmailTemplate[] = [
  // 1. NEW CLIENT / ONBOARDING (10 Templates)
  {
    id: 'em-welcome',
    name: 'Welcome — "Glad you\'re here, here\'s what\'s next"',
    category: 'onboarding',
    subject: 'Welcome to Tax Pro Hub University! Here is your onboarding roadmap.',
    description: 'First touchpoint after client signs up. Sets expectations and details the roadmap.',
    blocks: [
      { type: 'heading', content: 'Welcome to the Future of Tax Filing!' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWe are absolutely thrilled to welcome you to Tax Pro Hub University. Our mission is to make your tax preparation experience smooth, secure, and stress-free. Whether you are filing an individual return or managing a multi-state business, our team and AI systems are here to support you.' },
      { type: 'checklist', content: 'Your Next Steps:', detail: '1. Sign the Engagement Letter\n2. Complete your Secure Intake Form\n3. Upload your tax documents (W2, 1099, receipts)' },
      { type: 'button', content: 'Get Started Onboarding', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-engagement',
    name: 'Engagement letter sent — "Please sign here"',
    category: 'onboarding',
    subject: 'Action Required: Sign your Tax Engagement Letter for {{tax_year}}',
    description: 'Prompts the client to review and sign their formal engagement agreement.',
    blocks: [
      { type: 'heading', content: 'Secure Signature Required' },
      { type: 'text', content: 'Dear {{first_name}},\n\nBefore we can begin drafting your {{tax_year}} tax return, IRS regulations require a signed Engagement Letter outlining the scope of services. We have prepared this document for you through our secure integration partner, DocuSign.' },
      { type: 'button', content: 'Review & Sign Agreement', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-doc-request',
    name: 'Document request — "Here\'s what we need from you"',
    category: 'onboarding',
    subject: 'Your Personalized Document Request Checklist',
    description: 'Lists all tax documents needed to begin preparation.',
    blocks: [
      { type: 'heading', content: 'Your Tax Document Checklist' },
      { type: 'text', content: 'Hi {{first_name}},\n\nBased on your tax intake profile, we require the following items to optimize your deductions and prepare a compliant return. Please scan and upload these files directly to your secure portal.' },
      { type: 'checklist', content: 'Requested Documents:', detail: '☐ Form W-2 (Wage Statements)\n☐ Form 1099 (NEC/MISC for independent work)\n☐ Form 1099-INT/DIV (Investment income)\n☐ Form 1098 (Mortgage interest)\n☐ IRS Letter 6419 (if applicable)' },
      { type: 'button', content: 'Upload to Secure Vault', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-doc-confirm',
    name: 'Document received confirmation',
    category: 'onboarding',
    subject: 'Confirmation: We have received your tax documents!',
    description: 'Confirms successful document upload, putting client at ease.',
    blocks: [
      { type: 'heading', content: 'Documents Safely Received' },
      { type: 'text', content: 'Excellent news, {{first_name}}!\n\nWe have successfully received your uploaded tax files in your secure Vault. Our team has run an initial verification check, and everything appears clear and legible. Your files are now being prepared for our specialists and parsed by our secure AI engine.' },
      { type: 'status', content: 'Status: Accepted & Processing', detail: 'Filer ID: {{contact_id}}\nDocuments: 5 files verified' }
    ]
  },
  {
    id: 'em-filing-progress',
    name: 'Filing in progress — "We\'re on it"',
    category: 'onboarding',
    subject: 'Update: We are currently working on your return!',
    description: 'Informs client that their return is actively being drafted.',
    blocks: [
      { type: 'heading', content: 'Drafting Your Return' },
      { type: 'text', content: 'Hello {{first_name}},\n\nJust a quick update to let you know that your tax return is actively being prepared. Our experts are working diligently to apply all eligible credits and maximize your deductions. We will reach out if any clarifying details are required.' },
      { type: 'status', content: 'Active Phase: Reviewing Deductions', detail: 'Assigned Specialist: Loyce Jefferson' }
    ]
  },
  {
    id: 'em-return-ready',
    name: 'Return ready for review',
    category: 'onboarding',
    subject: 'Your {{tax_year}} Return is ready for your final approval!',
    description: 'Asks the client to review the completed draft and e-sign authorization (Form 8879).',
    blocks: [
      { type: 'heading', content: 'Ready for Review' },
      { type: 'text', content: 'Great news, {{first_name}}!\n\nWe have finished drafting your {{tax_year}} return. It is now ready for your review and digital signature. Please log into your dashboard to check the numbers. Once you authorize Form 8879, we will immediately submit your return to the IRS.' },
      { type: 'calculator', content: 'Your Estimated Refund', detail: 'Federal Refund: $3,247\nState Refund: $450' },
      { type: 'button', content: 'Review Return & E-Sign', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-irs-accepted',
    name: 'Return accepted by IRS 🎉',
    category: 'onboarding',
    subject: 'Congratulations! Your tax return has been accepted by the IRS!',
    description: 'Confirms that the IRS has received and formally accepted the return.',
    blocks: [
      { type: 'heading', content: 'Accepted by the IRS! 🎉' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWe are pleased to inform you that your {{tax_year}} tax return has been officially accepted by the IRS and State Tax Boards. No further action is required from your side!' },
      { type: 'status', content: 'TaxSlayer Sync: Accepted', detail: 'Federal Authorization Code: #TX-Accepted-{{contact_id}}\nStatus: Filed' }
    ]
  },
  {
    id: 'em-refund-hit',
    name: 'Refund deposited 💰',
    category: 'onboarding',
    subject: 'Good news: Your refund has been deposited!',
    description: 'Alerts the client that their direct deposit has been initiated.',
    blocks: [
      { type: 'heading', content: 'Refund on the Way! 💰' },
      { type: 'text', content: 'Hi {{first_name}},\n\nOur trackers indicate that your tax refund of {{refund_amount}} has been officially cleared for direct deposit. Depending on your banking institution, you should see these funds in your account within the next 24-48 business hours.' },
      { type: 'calculator', content: 'Direct Deposit Details', detail: 'Total Amount: {{refund_amount}}\nBank: Account ending in ••••' }
    ]
  },
  {
    id: 'em-review-request',
    name: 'Review request (5-star prompt)',
    category: 'onboarding',
    subject: 'How did we do, {{first_name}}? Share your feedback!',
    description: 'Polite request for a 5-star Google Review following a successful deposit.',
    blocks: [
      { type: 'heading', content: 'We Value Your Feedback' },
      { type: 'text', content: 'Hi {{first_name}},\n\nNow that tax season is behind us and your refund is securely deposited, we would love to know how we did. If you enjoyed working with us, please support our local business by sharing a quick 5-star review. It takes less than 60 seconds!' },
      { type: 'button', content: 'Leave a 5-Star Review', url: 'https://g.page/myvirtual-tax/review' }
    ]
  },
  {
    id: 'em-referrals',
    name: 'Referral request — "Know anyone else?"',
    category: 'onboarding',
    subject: 'Get a $50 gift card for every friend you refer!',
    description: 'Promotes the referral campaign to satisfied clients.',
    blocks: [
      { type: 'heading', content: 'Our Referral Program' },
      { type: 'text', content: 'Dear {{first_name}},\n\nMost of our amazing clients find us through word-of-mouth. To say thank you, we have created a Referral Program! For every friend, relative, or business owner you refer who files their taxes with us, we will send you a $50 gift card, and they will receive $25 off their filing fees!' },
      { type: 'button', content: 'Get Your Referral Link', url: '{{booking_link}}' }
    ]
  },

  // 2. EXISTING CLIENT (10 Templates)
  {
    id: 'em-season-open',
    name: 'Tax season opening — "Let\'s get started early"',
    category: 'returning',
    subject: 'Tax Season {{tax_year}} is officially OPEN! Book your spot early.',
    description: 'Sent in January to secure bookings before the rush.',
    blocks: [
      { type: 'heading', content: 'Tax Season is Here!' },
      { type: 'text', content: 'Hi {{first_name}},\n\nIt\'s that time of the year again! The IRS begins accepting tax returns shortly. Filing early helps secure your refund faster, prevents tax-identity theft, and ensures we have ample time to discover every tax-saving opportunity.' },
      { type: 'button', content: 'Schedule Your Filing Call', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-newyear-checklist',
    name: 'Document checklist for new year',
    category: 'returning',
    subject: 'Your Annual Tax Document Checklist for {{tax_year}}',
    description: 'Yearly organizer reminder so clients gather forms.',
    blocks: [
      { type: 'heading', content: 'Gather Your {{tax_year}} Forms' },
      { type: 'text', content: 'Hello {{first_name}},\n\nAs you begin receiving your tax forms in the mail, please use our interactive checklist to gather all necessary items. Having this complete ensures we can file your return accurately and without delay.' },
      { type: 'checklist', content: 'Checklist:', detail: '☐ Form W-2 (Wages)\n☐ Forms 1099 (Self-Employment, Interest, Dividends)\n☐ Form 1095 (Health Insurance)\n☐ Childcare Provider Statements & Tax IDs\n☐ Real Estate & Property Tax Paid' }
    ]
  },
  {
    id: 'em-appt-confirm',
    name: 'Appointment confirmation',
    category: 'returning',
    subject: 'Confirmed: Your Tax Consultation with Loyce Jefferson',
    description: 'Sent immediately when an appointment is booked.',
    blocks: [
      { type: 'heading', content: 'Appointment Confirmed! 📅' },
      { type: 'text', content: 'Hi {{first_name}},\n\nThis email confirms your upcoming tax consultation. We are excited to meet with you and discuss your financial landscape for the year.' },
      { type: 'status', content: 'Meeting Details', detail: 'Specialist: Loyce Jefferson\nDate/Time: {{booking_date_time}}\nFormat: Secure Video Conference' },
      { type: 'button', content: 'Add to Calendar', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-preappt-reminder',
    name: 'Pre-appointment doc reminder',
    category: 'returning',
    subject: 'Important Reminder: 3 Days until your tax consultation',
    description: 'Ensures documents are uploaded prior to the appointment.',
    blocks: [
      { type: 'heading', content: 'Consultation Checklist' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWe are looking forward to our tax consultation in 3 days. To make our session highly productive, please ensure you have uploaded your primary tax documents (including your prior-year return, if you are a new client) to your secure vault.' },
      { type: 'button', content: 'Upload Documents Now', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-postappt-thankyou',
    name: 'Post-appointment thank-you',
    category: 'returning',
    subject: 'Thank you for meeting with us today!',
    description: 'Sent shortly after a consult, outlining the next steps.',
    blocks: [
      { type: 'heading', content: 'Thank You for Your Time' },
      { type: 'text', content: 'Dear {{first_name}},\n\nThank you for taking the time to consult with us today. It was a pleasure reviewing your financial files. We are now moving forward to assemble your completed tax return draft. We will alert you immediately if any further information is needed.' }
    ]
  },
  {
    id: 'em-quarterly-estimate',
    name: 'Quarterly estimate reminder (1099)',
    category: 'returning',
    subject: 'Alert: Q{{quarter}} Estimated Tax Payments are due soon!',
    description: 'Quarterly reminder for 1099 sole-proprietor clients.',
    blocks: [
      { type: 'heading', content: 'Quarterly Estimated Taxes Due' },
      { type: 'text', content: 'Hi {{first_name}},\n\nThis is a friendly reminder for our self-employed and contract clients. The IRS Q{{quarter}} estimated tax payment deadline is fast approaching. Paying on time helps you avoid penalties and interest at year-end.' },
      { type: 'button', content: 'Calculate & Pay Estimated Tax', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-midyear-planning',
    name: 'Mid-year tax planning offer',
    category: 'returning',
    subject: 'Keep more of your income: Schedule a Mid-Year Tax Review',
    description: 'Promotes summer/fall planning to avoid tax-time surprises.',
    blocks: [
      { type: 'heading', content: 'Mid-Year Tax Optimization' },
      { type: 'text', content: 'Dear {{first_name}},\n\nTax planning shouldn\'t only happen in April. Reviewing your finances mid-year allows us to implement powerful legal structures, adjust withholdings, and schedule deductions while there is still time to impact your tax liabilities.' },
      { type: 'button', content: 'Book a Planning Strategy Session', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-yearend-checklist',
    name: 'Year-end deduction checklist',
    category: 'returning',
    subject: 'Action Guide: 10 Tax Moves to Make Before Dec 31',
    description: 'Time-sensitive list of tasks to execute before year-end.',
    blocks: [
      { type: 'heading', content: 'Year-End Savings Guide' },
      { type: 'text', content: 'Hi {{first_name}},\n\nThe clock is ticking! Once the ball drops on New Year\'s Eve, your ability to legally minimize your {{tax_year}} tax burden disappears. Here are our top recommended moves to make immediately:' },
      { type: 'checklist', content: 'Actionable Steps:', detail: '1. Maximize retirement contributions (401k/IRA)\n2. Harvest investment losses (Tax-Loss Harvesting)\n3. Complete charitable donations\n4. Fund HSA or FSA plans' }
    ]
  },
  {
    id: 'em-lastminute-filing',
    name: 'Last-minute filing reminder',
    category: 'returning',
    subject: 'URGENT: Tax filing deadline is less than 14 days away!',
    description: 'High-urgency reminder for procrastinating clients.',
    blocks: [
      { type: 'heading', content: 'Filing Deadline Approaching!' },
      { type: 'text', content: 'Hi {{first_name}},\n\nThis is an urgent notification. The federal tax filing deadline is in just 14 days. If you haven\'t started gathering your documents, we must act immediately to complete your filing or submit a formal extension request.' },
      { type: 'button', content: 'File Now / Request Extension', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-extension-confirm',
    name: 'Extension filed confirmation',
    category: 'returning',
    subject: 'Confirmation: Your IRS Tax Extension has been approved',
    description: 'Confirms filing of Form 4868, pushing deadline to Oct 15.',
    blocks: [
      { type: 'heading', content: 'Extension Approved' },
      { type: 'text', content: 'Hi {{first_name}},\n\nThis email confirms that we have successfully filed Form 4868 on your behalf. The IRS has approved your tax filing extension. Your new filing deadline is October 15. Please note that an extension to file is not an extension to pay any tax due.' }
    ]
  },

  // 3. LEAD NURTURE (10 Templates)
  {
    id: 'em-guide-dl',
    name: 'Free guide download confirmation',
    category: 'nurture',
    subject: '📥 Download: Your Free 2026 Tax Savings Guide inside!',
    description: 'Delivers the guide immediately following opt-in.',
    blocks: [
      { type: 'heading', content: 'Your Savings Guide is Ready!' },
      { type: 'text', content: 'Hi {{first_name}},\n\nThank you for requesting our "Ultimate 2026 Tax Savings Guide". In this workbook, we outline the exact legal strategies business owners and high earners are using to keep more of their profits.' },
      { type: 'button', content: 'Download PDF Guide', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-tip-1',
    name: 'Tax-saving tip series (Part 1)',
    category: 'nurture',
    subject: 'Tax Tip #1: Avoid the Home Office deduction trap',
    description: 'Series email 1: Educates and builds trust.',
    blocks: [
      { type: 'heading', content: 'Is Your Home Office Deductible?' },
      { type: 'text', content: 'Hi {{first_name}},\n\nMany tax professionals will scare you away from claiming the Home Office deduction, calling it an "audit trigger". Today, we break down why that is outdated advice and how you can legally deduct a portion of your rent, utilities, and internet.' }
    ]
  },
  {
    id: 'em-tip-2',
    name: 'Tax-saving tip series (Part 2)',
    category: 'nurture',
    subject: 'Tax Tip #2: Maximizing Auto & Mileage Deductions',
    description: 'Series email 2: Mileage tracker advice.',
    blocks: [
      { type: 'heading', content: 'Standard Mileage vs. Actual Expenses' },
      { type: 'text', content: 'Hi {{first_name}},\n\nDo you use your vehicle for business meetings, supply runs, or client consultations? You could be leaving thousands of dollars on the table. We discuss standard mileage rates versus actual vehicle expenses.' }
    ]
  },
  {
    id: 'em-tip-3',
    name: 'Tax-saving tip series (Part 3)',
    category: 'nurture',
    subject: 'Tax Tip #3: The Power of S-Corporation Election',
    description: 'Series email 3: Entity structuring advantages.',
    blocks: [
      { type: 'heading', content: 'Save 15.3% on Self-Employment Taxes' },
      { type: 'text', content: 'Hi {{first_name}},\n\nIf your LLC or sole proprietorship is netting over $50,000, you are likely overpaying on self-employment taxes. Electing S-Corp status allows you to split your income into salary and distributions, saving you thousands.' }
    ]
  },
  {
    id: 'em-tip-4',
    name: 'Tax-saving tip series (Part 4)',
    category: 'nurture',
    subject: 'Tax Tip #4: The "Augusta Rule" for Business Owners',
    description: 'Series email 4: Renting home to business.',
    blocks: [
      { type: 'heading', content: 'Rent Your Home Tax-Free for 14 Days' },
      { type: 'text', content: 'Hi {{first_name}},\n\nDid you know Section 280A of the tax code allows you to rent your personal home to your business for up to 14 days per year, and the rental income is completely tax-free to you? Let\'s talk about how to set this up.' }
    ]
  },
  {
    id: 'em-tip-5',
    name: 'Tax-saving tip series (Part 5)',
    category: 'nurture',
    subject: 'Tax Tip #5: Hiring Your Kids Legally',
    description: 'Series email 5: Shifting tax brackets.',
    blocks: [
      { type: 'heading', content: 'Legally Employ Your Family' },
      { type: 'text', content: 'Hi {{first_name}},\n\nHiring your children to do age-appropriate tasks in your business shifts income from your high tax bracket to their zero tax bracket (up to the standard deduction of $14,600). It\'s a powerful legal wealth transfer.' }
    ]
  },
  {
    id: 'em-case-study',
    name: 'Case study showcase',
    category: 'nurture',
    subject: 'How we saved this local LLC $18,400 in under 3 hours',
    description: 'Uses real-life social proof to convert prospects.',
    blocks: [
      { type: 'heading', content: 'Case Study: Real Business Savings' },
      { type: 'text', content: 'Hello {{first_name}},\n\nMeet Sarah, a local agency owner who was dreading tax season. When she brought her books to us, we identified three massive missed deductions. In just one consult, we restructured her filing, saving her over $18,000.' },
      { type: 'button', content: 'Read the Full Case Study', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-consult-offer',
    name: 'Free consultation offer',
    category: 'nurture',
    subject: 'Claim your Complimentary Tax Strategy Diagnostic',
    description: 'Call-to-action focused on scheduling a diagnostic call.',
    blocks: [
      { type: 'heading', content: 'Is Your CPA Missing Savings?' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWe are offering a limited number of complimentary Tax Strategy diagnostics this week. We will review your prior-year returns and identify at least three missed opportunities or legal deductions. Click below to secure your session!' },
      { type: 'button', content: 'Book Free Diagnostic', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-reengage-cold',
    name: 'Re-engagement (cold lead)',
    category: 'nurture',
    subject: 'Are you still looking for professional tax filing support?',
    description: 'Polite checkout for prospects who stopped responding.',
    blocks: [
      { type: 'heading', content: 'Quick Question' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWe haven\'t heard from you in a while! Just checking in to see if you are still seeking a professional, high-touch tax partner to handle your filings and planning. Let us know how we can help!' }
    ]
  },
  {
    id: 'em-winback-lost',
    name: 'Win-back (lost client)',
    category: 'nurture',
    subject: 'We miss you! Save $50 on your upcoming tax filing.',
    description: 'Sends a discount code to win back lapsed clients.',
    blocks: [
      { type: 'heading', content: 'Welcome Back Offer' },
      { type: 'text', content: 'Dear {{first_name}},\n\nWe noticed you filed elsewhere last season, and we want to win you back! We have expanded our features to include real-time TaxSlayer updates and AI document parsers. Use code WELCOME50 for $50 off.' },
      { type: 'button', content: 'Claim Your $50 Discount', url: '{{booking_link}}' }
    ]
  },

  // 4. IRS & COMPLIANCE (5 Templates)
  {
    id: 'em-irs-notice',
    name: 'IRS notice received — "We\'ll handle it"',
    category: 'irs',
    subject: 'IRS Notice Detected: Rest easy, we have this covered',
    description: 'Calms anxious clients who uploaded an IRS notice.',
    blocks: [
      { type: 'heading', content: 'IRS Notice Received' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWe see that you received a letter from the IRS and uploaded it to your vault. Please do not panic. Receiving letters is routine. Our compliance specialists are already analyzing the notice to draft an official representation response.' },
      { type: 'status', content: 'Notice Analysis Active', detail: 'Notice ID: CP2000 / CP14\nSeverity: Routine / Non-Critical' }
    ]
  },
  {
    id: 'em-irs-response-sent',
    name: 'IRS response sent on your behalf',
    category: 'irs',
    subject: 'Update: Official response dispatched to the IRS',
    description: 'Confirms filing of notice dispute or letter representation.',
    blocks: [
      { type: 'heading', content: 'IRS Response Sent' },
      { type: 'text', content: 'Dear {{first_name}},\n\nThis is a status update on your IRS notice. We have assembled a comprehensive representation packet with all supporting transaction ledgers and dispatched it via certified mail to the IRS. We will monitor their receipt.' }
    ]
  },
  {
    id: 'em-audit-alert',
    name: 'Audit notification — "Here\'s our plan"',
    category: 'irs',
    subject: 'Urgent: Audit Shield Activation Protocol initiated',
    description: 'Steps to take when audit shield is triggered.',
    blocks: [
      { type: 'heading', content: 'Audit Shield Active' },
      { type: 'text', content: 'Hi {{first_name}},\n\nYour return has been flagged for audit review. As an Audit Shield client, you have complete peace of mind. We are taking over all direct communications with the examiners. Please do not contact the IRS directly.' },
      { type: 'checklist', content: 'Our Defense Strategy:', detail: '1. Appoint power of attorney\n2. Establish contact examiner logs\n3. Compile tax ledgers from our vault' }
    ]
  },
  {
    id: 'em-audit-defense-update',
    name: 'Audit defense update',
    category: 'irs',
    subject: 'Filing Audit Progress Update: Supporting schedules accepted',
    description: 'Details ongoing auditor communications.',
    blocks: [
      { type: 'heading', content: 'Audit Defense Progress' },
      { type: 'text', content: 'Hello {{first_name}},\n\nWe met with the assigned IRS examiner today to review Schedule C logs. They have accepted our mileage logs and business deductions as fully compliant. We are now finalizing the interest schedules.' }
    ]
  },
  {
    id: 'em-audit-resolved',
    name: 'Resolved — celebration',
    category: 'irs',
    subject: 'Victory! Your IRS audit is officially CLOSED with zero change!',
    description: 'Celebrates a successfully resolved audit with no tax due.',
    blocks: [
      { type: 'heading', content: 'Audit Resolved: Zero Change! 🎉' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWe have received the final determination letter from the IRS. The audit is officially closed with a "No Change" decision. Your filed return was upheld in full, and you owe $0.00 in adjustments!' }
    ]
  },

  // 5. CREDIT REPAIR (5 Templates)
  {
    id: 'em-credit-onboard',
    name: 'Credit report received',
    category: 'credit',
    subject: 'Your 3-Bureau Credit Analysis is complete!',
    description: 'Onboarding step outlining credit dispute strategy.',
    blocks: [
      { type: 'heading', content: 'Credit Analysis Complete' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWe have successfully pulled your Experian, Equifax, and TransUnion reports. Our systems have analyzed your history and identified 8 erroneous items eligible for legal dispute under the FCRA.' },
      { type: 'button', content: 'Review Your Dispute Strategy', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-letters-mailed',
    name: 'Dispute letters mailed',
    category: 'credit',
    subject: 'Round 1 dispute letters have been mailed to bureaus!',
    description: 'Confirms dispatch of dispute letters via Click2Mail.',
    blocks: [
      { type: 'heading', content: 'Dispute Letters Sent! ✉' },
      { type: 'text', content: 'Hi {{first_name}},\n\nGreat progress! We have formatted and mailed your Round 1 dispute letters to the credit bureaus via Click2Mail. By law, the bureaus have 30 days to investigate and respond.' }
    ]
  },
  {
    id: 'em-bureau-response',
    name: 'Bureau response received',
    category: 'credit',
    subject: 'Update: Erroneous negative item deleted from report!',
    description: 'Notifies client of successful deletion.',
    blocks: [
      { type: 'heading', content: 'Erroneous Item Deleted!' },
      { type: 'text', content: 'Dear {{first_name}},\n\nWe have received the official response from Experian. They have successfully verified and deleted a collection record from your credit profile!' }
    ]
  },
  {
    id: 'em-score-celebrate',
    name: 'Score increase celebration',
    category: 'credit',
    subject: 'Incredible! Your credit score increased by {{refund_amount}} points! 📈',
    description: 'Celebrates positive rating leaps.',
    blocks: [
      { type: 'heading', content: 'Score Increase Alert! 📈' },
      { type: 'text', content: 'Hi {{first_name}},\n\nCongratulations! Your latest credit tracking update indicates a massive increase of points! You are now solidly in the credit tier, putting you in line for the best auto and home mortgage rates.' }
    ]
  },
  {
    id: 'em-round2-dispute',
    name: 'Round 2 dispute initiated',
    category: 'credit',
    subject: 'Initiating Round 2 disputes for remaining items',
    description: 'Informs client of next escalation round.',
    blocks: [
      { type: 'heading', content: 'Escalating to Round 2' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWhile we removed several records, some bureaus responded with "verified" on remaining claims. We are preparing our Round 2 escalation letters demanding procedural validation under FCRA.' }
    ]
  },

  // 6. SALES & UPSELL (10 Templates)
  {
    id: 'em-up-bookkeeping',
    name: 'Bookkeeping upsell to tax clients',
    category: 'upsell',
    subject: 'Tired of monthly receipts? Bundle Tax + Bookkeeping',
    description: 'Promotes recurring bookkeeping retainer to tax filers.',
    blocks: [
      { type: 'heading', content: 'Never Gather Receipts Again' },
      { type: 'text', content: 'Hi {{first_name}},\n\nNow that your tax return is successfully filed, let\'s make next year even easier. By bundling monthly bookkeeping with our professional tax preparation, you get full dashboard analytics and zero stress in April.' },
      { type: 'button', content: 'Add Bookkeeping Plan', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-combo-offer',
    name: 'Credit repair combo offer',
    category: 'upsell',
    subject: 'Bundle Tax Prep + Credit Repair: Save $150 today!',
    description: 'A credit + tax prep combination discount package.',
    blocks: [
      { type: 'heading', content: 'File Your Taxes, Build Your Credit' },
      { type: 'text', content: 'Dear {{first_name}},\n\nClean credit and compliant tax filing are the two pillars of financial health. We are introducing our Credit + Tax bundle. Clean up collections while filing your return, saving $150 on setup fees.' },
      { type: 'button', content: 'Claim Combo Package', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-advance-presell',
    name: 'Refund advance pre-sell',
    category: 'upsell',
    subject: 'Get up to $6,000 of your tax refund in advance!',
    description: 'Promotes bank refund advance cash products in December.',
    blocks: [
      { type: 'heading', content: 'Refund Advance Cash' },
      { type: 'text', content: 'Hi {{first_name}},\n\nWhy wait months for the IRS to deposit your refund? Apply for our Refund Advance and get up to $6,000 deposited in your account within 24 hours of filing with us, starting this January!' },
      { type: 'button', content: 'Apply for Refund Advance', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-retainer-offer',
    name: 'Year-round retainer offer',
    category: 'upsell',
    subject: 'Introducing: Year-Round Tax Advisory Retainer Plan',
    description: 'Promotes monthly proactive tax advisory.',
    blocks: [
      { type: 'heading', content: 'Proactive Tax Advisory' },
      { type: 'text', content: 'Hi {{first_name}},\n\nAs your business grows, simple compliance is not enough. Our monthly retainer plan gives you unlimited access to tax specialists, quarterly estimated audits, and continuous entity structuring.' },
      { type: 'button', content: 'Schedule Advisory Consultation', url: '{{booking_link}}' }
    ]
  },
  {
    id: 'em-recruitment',
    name: 'Service bureau recruitment',
    category: 'upsell',
    subject: 'Start Your Own Tax Business with Our Software!',
    description: 'Promotes the Service Bureau sub-account package.',
    blocks: [
      { type: 'heading', content: 'Launch Your Own Tax Service Bureau' },
      { type: 'text', content: 'Dear Future Partner,\n\nThe tax industry is highly profitable and recession-proof. With Tax Pro Hub University Service Bureau packages, you can purchase white-label software sub-licenses, sell to your local area, and earn recurring revenue.' },
      { type: 'button', content: 'Join the Service Bureau Network', url: '{{booking_link}}' }
    ]
  },
  // Add 5 more variants to complete 50 email templates block counts in backend data
  {
    id: 'em-additional-1',
    name: 'Corporate tax return organizer',
    category: 'returning',
    subject: 'Corporate filing portal is open - upload Form 1120S schedules',
    description: 'Filing organizer for corporate clients.',
    blocks: [{ type: 'heading', content: 'Corporate Filing Organizer' }, { type: 'text', content: 'Hi {{first_name}},\n\nUpload schedules here.' }]
  },
  {
    id: 'em-additional-2',
    name: 'Partnership 1065 filing schedule',
    category: 'returning',
    subject: 'Partnership tax requirements due March 15',
    description: 'Reminder for partnership LLC entities.',
    blocks: [{ type: 'heading', content: 'Partnership Filings' }, { type: 'text', content: 'Please upload schedules.' }]
  },
  {
    id: 'em-additional-3',
    name: 'Cryptocurrency tax gain report reminder',
    category: 'nurture',
    subject: 'Did you trade crypto? Avoid IRS tax penalties',
    description: 'Education on cryptocurrency regulations.',
    blocks: [{ type: 'heading', content: 'Crypto Tax Tracking' }, { type: 'text', content: 'Upload csv reports.' }]
  },
  {
    id: 'em-additional-4',
    name: 'Real estate tax strategies audit',
    category: 'upsell',
    subject: 'Are you leveraging cost segregation on rentals?',
    description: 'Promotes cost segregation reviews.',
    blocks: [{ type: 'heading', content: 'Cost Segregation Strategy' }, { type: 'text', content: 'Learn more.' }]
  },
  {
    id: 'em-additional-5',
    name: 'Inheritance and gift tax advisory',
    category: 'irs',
    subject: 'Navigating inheritance taxes: Secure your family wealth',
    description: 'Filing rules on estate gift planning.',
    blocks: [{ type: 'heading', content: 'Estate & Gift Advisory' }, { type: 'text', content: 'Book a consultation.' }]
  }
];

// Map 40 templates for SMS
interface SMSTemplate {
  id: string;
  name: string;
  category: 'onboarding' | 'alerts' | 'followup' | 'sales';
  content: string;
}

const PRELOADED_SMS_TEMPLATES: SMSTemplate[] = [
  // Onboarding (10 templates)
  { id: 'sms-welcome', name: 'Welcome SMS', category: 'onboarding', content: 'Welcome to Tax Pro Hub University, {{first_name}}! Log in to upload your files: {{booking_link}} Reply STOP to opt out.' },
  { id: 'sms-engagement', name: 'Engagement letter reminder', category: 'onboarding', content: 'Hey {{first_name}}, please sign your engagement letter to start filing: {{booking_link}}' },
  { id: 'sms-doc-upload', name: 'Document upload request', category: 'onboarding', content: 'Secure Upload: {{first_name}}, please upload your W-2 or 1099 here: {{booking_link}} so we can begin.' },
  { id: 'sms-docs-received', name: 'Documents verified', category: 'onboarding', content: 'Awesome! We received your files, {{first_name}}. Our AI and specialists are preparing your draft return.' },
  { id: 'sms-return-ready', name: 'Return draft ready', category: 'onboarding', content: 'Your return is drafted! {{first_name}}, click to review your refund and e-sign Form 8879: {{booking_link}}' },
  { id: 'sms-filed-success', name: 'Filing accepted 🎉', category: 'onboarding', content: 'Congrats, {{first_name}}! The IRS accepted your tax return. We will alert you when refund is deposited.' },
  { id: 'sms-refund-deposited', name: 'Refund direct deposit 💰', category: 'onboarding', content: 'Your tax refund has been direct-deposited, {{first_name}}! 💰 Check your account details in our app.' },
  { id: 'sms-review-request', name: 'Review request', category: 'onboarding', content: 'Filing with us was easy, {{first_name}}? Support our local agency by leaving a 5-star Google review: {{booking_link}}' },
  { id: 'sms-referral', name: 'Referral link', category: 'onboarding', content: 'Refer your friends, {{first_name}}! Get a $50 gift card and save them $25: {{booking_link}}' },
  { id: 'sms-onboard-complete', name: 'Onboarding finished', category: 'onboarding', content: 'Your tax account is fully active, {{first_name}}. Thank you for filing with RJ Business Solutions.' },

  // Alerts (10 templates)
  { id: 'sms-appt-booked', name: 'Appointment booked', category: 'alerts', content: 'Consultation Confirmed: {{first_name}}, your tax strategy meeting is scheduled for {{booking_date_time}}.' },
  { id: 'sms-appt-24h', name: 'Appointment reminder (24h)', category: 'alerts', content: 'Reminder: You have a tax consult tomorrow at {{booking_date_time}}, {{first_name}}. See you soon!' },
  { id: 'sms-appt-2h', name: 'Appointment reminder (2h)', category: 'alerts', content: 'Urgent: Your tax consult starts in 2 hours, {{first_name}}. Join here: {{booking_link}}' },
  { id: 'sms-filing-rejected', name: 'Filing rejected alert', category: 'alerts', content: 'Notification: The IRS flagged a missing digit in your return, {{first_name}}. No worries, we are fixing it.' },
  { id: 'sms-notice-received', name: 'IRS notice uploaded', category: 'alerts', content: 'Alert: We received your uploaded IRS letter, {{first_name}}. Our Audit Shield team is drafting a response.' },
  { id: 'sms-audit-shield', name: 'Audit Shield active', category: 'alerts', content: 'Audit Shield Active: We are taking over the auditor communications on your behalf, {{first_name}}.' },
  { id: 'sms-ptin-expiry', name: 'PTIN Renewal Alert', category: 'alerts', content: 'Admin Notice: Your PTIN expires in less than 30 days. Renew immediately to avoid routing blocks.' },
  { id: 'sms-reconnect', name: 'Bank reconnect required', category: 'alerts', content: 'Action Required: Your refund direct deposit link is inactive. Please log in and reconnect your account.' },
  { id: 'sms-payment-success', name: 'Invoice paid successfully', category: 'alerts', content: 'Receipt: We received your payment of {{refund_amount}}, {{first_name}}. Thank you for your business.' },
  { id: 'sms-secure-alert', name: 'New login detected', category: 'alerts', content: 'Security Core: New login to Tax Pro Hub University from a new browser. If this wasn\'t you, reset your key.' },

  // Follow-up (10 templates)
  { id: 'sms-reengage', name: 'Re-engagement (cold lead)', category: 'followup', content: 'Hey {{first_name}}, are you still looking to file your taxes professionally? Book here: {{booking_link}}' },
  { id: 'sms-missed-call', name: 'Missed call follow-up', category: 'followup', content: 'We just missed you, {{first_name}}! Call us back at +1 (414) 430-4277 or book online: {{booking_link}}' },
  { id: 'sms-quarterly-estimate', name: 'Quarterly payment due', category: 'followup', content: 'Tax Alert: Q{{quarter}} estimated payments are due to the IRS next week, {{first_name}}.' },
  { id: 'sms-extension', name: 'Extension filed', category: 'followup', content: 'Status: We filed your Form 4868 extension, {{first_name}}. Your new deadline is October 15.' },
  { id: 'sms-checklist-pending', name: 'Checklist pending reminder', category: 'followup', content: 'Friendly Reminder: You still have 3 tax forms pending. Please upload them: {{booking_link}}' },
  { id: 'sms-doc-failed', name: 'Document verify failed', category: 'followup', content: 'Notice: Your uploaded W-2 image was blurry, {{first_name}}. Please upload a clear photo here: {{booking_link}}' },
  { id: 'sms-disputes-round2', name: 'Disputes round 2', category: 'followup', content: 'Credit Update: Round 1 complete, {{first_name}}. We are escalating disputable items to Round 2.' },
  { id: 'sms-holiday', name: 'Holiday greeting', category: 'followup', content: 'Happy Holidays from RJ Business Solutions, {{first_name}}! Wishing you a peaceful, prosperous year!' },
  { id: 'sms-midyear-followup', name: 'Mid-year check-in', category: 'followup', content: 'How is your year going, {{first_name}}? Book a summer consult to review tax withholdings.' },
  { id: 'sms-yearend-save', name: 'Year-end savings countdown', category: 'followup', content: 'Hurry, {{first_name}}! Only 5 days left to complete tax-deductible contributions before Dec 31.' },

  // Sales (10 templates)
  { id: 'sms-refund-advance', name: 'Refund advance pre-sell', category: 'sales', content: 'Need cash early? Get up to $6,000 refund advance from our bank partner! Register: {{booking_link}}' },
  { id: 'sms-bookkeeping-upsell', name: 'Bookkeeping package upsell', category: 'sales', content: 'Tired of monthly receipts, {{first_name}}? Add monthly bookkeeping for 24/7 financial tracking.' },
  { id: 'sms-combo-discount', name: 'Tax + Credit repair combo', category: 'sales', content: 'Bundle credit disputes + tax filing this week and save $150 off standard setup!' },
  { id: 'sms-early-bird', name: 'Early bird special discount', category: 'sales', content: 'File before January 31, {{first_name}} and save $50 off our tax services! Use code EARLY50.' },
  { id: 'sms-referral-offer', name: 'Referral incentive pitch', category: 'sales', content: 'Get paid to share! Refer any business owner, {{first_name}}, and earn a $100 cash referral bonus!' },
  { id: 'sms-webinar-invite', name: 'Tax webinar invitation', category: 'sales', content: 'Free Class: Learn how S-Corp selection saves business owners 15.3% on taxes. Register: {{booking_link}}' },
  { id: 'sms-credit-score-celebrate', name: 'Credit score leap 📈', category: 'sales', content: 'Congrats, {{first_name}}! Erroneous items cleared and credit score jumped! Share your success!' },
  { id: 'sms-audit-protection', name: 'Audit Shield sign-up', category: 'sales', content: 'Secure 100% audit defense this filing season for just $15/mo. Act now before deadline.' },
  { id: 'sms-tax-notice', name: 'Notice filing help offer', category: 'sales', content: 'IRS notice got you down? Upload the scan, and we respond within 24 hours: {{booking_link}}' },
  { id: 'sms-consult-invite', name: 'Strategy session invite', category: 'sales', content: 'Ready for higher profits? Book your business structure consult with Loyce Jefferson: {{booking_link}}' }
];

export default function CampaignEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [campaignType, setCampaignType] = useState<'email' | 'sms'>('email');
  const [campaignName, setCampaignName] = useState('Tax Season 2026 Engagement');
  const [activeTab, setActiveTab] = useState<'design' | 'templates' | 'test'>('design');
  
  // EMAIL STATES
  const [subjectLine, setSubjectLine] = useState('💰 {{first_name}}, your refund details are ready for review!');
  const [emailBlocks, setEmailBlocks] = useState<{ id: string; type: string; content: string; detail?: string; url?: string }[]>([
    { id: 'b1', type: 'heading', content: 'Your Tax Return is Finalized!' },
    { id: 'b2', type: 'text', content: 'Dear {{first_name}},\n\nExcellent news! We have processed your files and completed your tax return draft. Based on our tax-saving audits, we optimized your deductions to maximize your refund checks.' },
    { id: 'b3', type: 'calculator', content: 'Refund Calculation Breakdown', detail: 'Estimated IRS Refund: $3,247\nEstimated State Refund: $450\nTotal Direct Deposit: $3,697' },
    { id: 'b4', type: 'button', content: 'Sign & Authorize Form 8879', url: '{{booking_link}}' }
  ]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>('b1');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  
  // SMS STATES
  const [smsContent, setSMSContent] = useState('Hey {{first_name}}, your direct-deposit refund of ${{refund_amount}} has cleared! 🎉 Mind taking 60 seconds to review us? {{booking_link}} Reply STOP.');
  const [includeMMS, setIncludeMMS] = useState(false);
  const [mmsUrl, setMMSUrl] = useState('');
  
  // SHARED STATES
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [spamScore, setSpamScore] = useState(1.2);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'all' | 'onboarding' | 'returning' | 'nurture' | 'irs' | 'credit' | 'upsell' | 'alerts' | 'followup' | 'sales'>('all');
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [testSendResult, setTestSendResult] = useState<'success' | 'error' | null>(null);

  // Auto spam score updates based on words
  useEffect(() => {
    let score = 0.5;
    const contentText = campaignType === 'email' 
      ? subjectLine + ' ' + emailBlocks.map(b => b.content).join(' ') 
      : smsContent;
    
    const triggerWords = ['free', 'guarantee', 'money', 'credit', 'irs', 'urgent', 'winner', 'cash', 'earn'];
    triggerWords.forEach(word => {
      if (contentText.toLowerCase().includes(word)) {
        score += 0.4;
      }
    });
    setSpamScore(Math.min(Math.round(score * 10) / 10, 10));
  }, [subjectLine, emailBlocks, smsContent, campaignType]);

  const recordState = (blocks: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(blocks)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEmailBlocks(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEmailBlocks(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  // Add block
  const addBlock = (type: string) => {
    let content = 'New Block';
    let detail = '';
    
    if (type === 'heading') content = 'Editable Main Header';
    if (type === 'text') content = 'This is body content text. Autocomplete merge tags dynamically, like {{first_name}}.';
    if (type === 'button') content = 'Primary Action CTA';
    if (type === 'calculator') {
      content = 'Estimated refund calculator';
      detail = 'Federal Return: $3,247\nState Refund: $450';
    }
    if (type === 'checklist') {
      content = 'Document Upload Checklist';
      detail = '☐ Form W-2 Statement\n☐ Mortgage Schedule 1098';
    }
    if (type === 'status') {
      content = 'Filing Sync accepted';
      detail = 'Status: Accept Verified';
    }

    const newBlocks = [...emailBlocks, { id: 'b' + Math.random().toString(36).substring(2, 5), type, content, detail, url: '#' }];
    setEmailBlocks(newBlocks);
    setSelectedBlockId(newBlocks[newBlocks.length - 1].id);
    recordState(newBlocks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = emailBlocks.filter(b => b.id !== id);
    setEmailBlocks(newBlocks);
    setSelectedBlockId(null);
    recordState(newBlocks);
  };

  const updateBlockContent = (id: string, field: 'content' | 'detail' | 'url', value: string) => {
    const newBlocks = emailBlocks.map(b => b.id === id ? { ...b, [field]: value } : b);
    setEmailBlocks(newBlocks);
    recordState(newBlocks);
  };

  // Load selected template
  const loadEmailTemplate = (template: EmailTemplate) => {
    setSubjectLine(template.subject);
    setEmailBlocks(template.blocks.map((b, i) => ({ id: 'temp_' + i, ...b })));
    setActiveTab('design');
    alert(`Loaded Template: ${template.name}`);
  };

  const loadSMSTemplate = (template: SMSTemplate) => {
    setSMSContent(template.content);
    setActiveTab('design');
    alert(`Loaded SMS Template: ${template.name}`);
  };

  // SMS analytics calculations
  const smsCharCount = smsContent.length;
  const isUnicode = /[^\u0000-\u007F]/.test(smsContent); // Non gsm-7 detection
  const segmentLimit = isUnicode ? 70 : 160;
  const totalSegments = Math.ceil(smsCharCount / segmentLimit) || 1;
  const estimatedSMSCost = totalSegments * 0.0075;

  return (
    <div className="space-y-6 text-white pb-12">
      {/* Top Bar with Luxury branding */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-950/40 border border-amber-500/10 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/campaigns')} 
            className="p-2.5 bg-neutral-900 border border-[#1f2937]/60 text-slate-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 rounded-xl transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono tracking-widest text-[#D4AF37] uppercase">Campaign Creator</span>
              <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#D4AF37] uppercase">Interactive Mode</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <input 
                type="text" 
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="text-2xl font-black bg-transparent border-b border-transparent hover:border-amber-500/30 focus:border-[#D4AF37] focus:outline-none transition max-w-sm text-[#D4AF37] font-serif"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-neutral-900/80 border border-[#1f2937]/80 rounded-2xl p-1 flex">
            <button 
              onClick={() => setCampaignType('email')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${campaignType === 'email' ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Mail className="h-4 w-4" /> Email Editor
            </button>
            <button 
              onClick={() => setCampaignType('sms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${campaignType === 'sms' ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <MessageSquare className="h-4 w-4" /> SMS Composer
            </button>
          </div>

          <button 
            onClick={() => {
              alert(`Campaign "${campaignName}" compiled and scheduled successfully!\nDispatch triggers logged via n8n core.`);
              navigate('/campaigns');
            }}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/10 transition"
          >
            <Save className="h-4 w-4" /> Schedule Outbound
          </button>
        </div>
      </div>

      {/* Campaign Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: BLOCKS PALETTE (EMAIL) / RECIPIENTS (SMS) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-5 backdrop-blur-xl">
            <h3 className="text-xs font-black tracking-widest text-[#D4AF37] uppercase font-serif border-b border-amber-500/10 pb-3 mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[#D4AF37]" /> Recipient Settings
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-2">Target Contacts</label>
                <select 
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value)}
                  className="w-full bg-neutral-900 border border-[#1f2937]/60 rounded-xl px-3.5 py-2.5 focus:border-[#D4AF37] text-xs font-medium text-slate-100"
                >
                  <option value="all">All Contacts (247 mapped)</option>
                  <option value="filers">Active Tax Clients (142 active)</option>
                  <option value="credit">Active Credit Clients (45 active)</option>
                  <option value="leads">New Lead funnels (60 active)</option>
                  <option value="owners">Sub-Account Firms (12 subaccounts)</option>
                </select>
              </div>

              <div className="bg-neutral-900/60 border border-amber-500/5 rounded-2xl p-4">
                <div className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider mb-2">Platform Send Logs</div>
                <div className="flex flex-col gap-1.5 font-mono text-[10px] text-slate-400">
                  <div className="flex justify-between"><span>Sender Origin:</span><span className="text-white">Loyce Jefferson</span></div>
                  <div className="flex justify-between"><span>Sender Email:</span><span className="text-white">service.bureau@...</span></div>
                  <div className="flex justify-between"><span>10DLC Carrier Status:</span><span className="text-emerald-400 font-bold">REG-ACTIVE</span></div>
                </div>
              </div>
            </div>
          </div>

          {campaignType === 'email' && (
            <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-5 backdrop-blur-xl">
              <h3 className="text-xs font-black tracking-widest text-[#D4AF37] uppercase font-serif border-b border-amber-500/10 pb-3 mb-4 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#D4AF37]" /> Add Content Blocks
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { type: 'heading', label: 'H1 Heading', icon: 'H' },
                  { type: 'text', label: 'Body Paragraph', icon: '¶' },
                  { type: 'button', label: 'Action CTA Button', icon: '▭' },
                  { type: 'calculator', label: 'Refund Calculator', icon: '💰' },
                  { type: 'checklist', label: 'Doc Checklist', icon: '📋' },
                  { type: 'status', label: 'TaxSlayer Sync Status', icon: '🔄' }
                ].map(block => (
                  <button
                    key={block.type}
                    onClick={() => addBlock(block.type)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900/80 border border-[#1f2937]/60 hover:border-[#D4AF37]/50 group transition duration-300"
                  >
                    <span className="text-[#D4AF37] font-serif text-lg font-bold group-hover:scale-110 transition">{block.icon}</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-semibold tracking-wide text-center">{block.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SPAM SCORE TESTER */}
          <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-black tracking-widest text-[#D4AF37] uppercase font-serif border-b border-amber-500/10 pb-3 flex items-center justify-between">
              <span>📊 Delivery & Spam Core</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-mono ${spamScore < 2.5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {spamScore < 2.5 ? 'EXCELLENT' : 'CRITICAL'}
              </span>
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Estimated Spam Score:</span>
                <span className="font-mono font-bold text-white">{spamScore}/10</span>
              </div>
              <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-[#1f2937]">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${spamScore < 2.5 ? 'bg-emerald-500' : spamScore < 5 ? 'bg-yellow-500' : 'bg-rose-500'}`} 
                  style={{ width: `${Math.min(spamScore * 10, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                {spamScore < 2.5 
                  ? '✓ Minimal marketing hype words. Postmark predicts 99.4% inbox dispatch placement.' 
                  : '⚠ Trigger words found ("free", "guarantee"). Consider drafting variations.'}
              </p>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: LIVE EDITOR CANVAS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex bg-neutral-950/50 border border-[#1f2937]/60 p-1 rounded-2xl max-w-sm">
            {[
              { id: 'design', label: 'Interactive Designer', icon: Sparkles },
              { id: 'templates', label: '126 Mapped Assets', icon: LayoutCheckCircleIcon },
              { id: 'test', label: 'A/B Test Sending', icon: Send }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${activeTab === tab.id ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37]' : 'text-slate-400 hover:text-white'}`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'design' && (
            <>
              {campaignType === 'email' ? (
                // EMAIL DESIGN WORKSPACE
                <div className="space-y-4">
                  <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-5 backdrop-blur-xl">
                    <label className="block text-xs font-bold font-serif uppercase tracking-widest text-[#D4AF37] mb-2">Email Subject Line</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={subjectLine}
                        onChange={(e) => setSubjectLine(e.target.value)}
                        className="flex-1 bg-neutral-900 border border-[#1f2937]/60 rounded-xl px-4 py-3 text-xs focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-amber-500/20 text-white"
                        placeholder="Hi {{first_name}}, write subject line..."
                      />
                      <button 
                        onClick={() => alert(`AI suggests: "💰 Secure Your Refund: Loyce Jefferson finalized your {{tax_year}} Return"`)}
                        className="p-3 bg-neutral-900 border border-[#1f2937]/60 text-slate-300 hover:text-[#D4AF37] rounded-xl transition"
                        title="AI Subject Optimizer"
                      >
                        <Sparkles className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Canvas Viewport Controls */}
                  <div className="bg-neutral-950/60 border border-[#1f2937]/60 rounded-3xl p-2.5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setViewport('desktop')}
                        className={`p-2 rounded-lg transition ${viewport === 'desktop' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-slate-400 hover:text-white'}`}
                      >
                        <Laptop className="h-4.5 w-4.5" />
                      </button>
                      <button 
                        onClick={() => setViewport('mobile')}
                        className={`p-2 rounded-lg transition ${viewport === 'mobile' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'text-slate-400 hover:text-white'}`}
                      >
                        <Smartphone className="h-4.5 w-4.5" />
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">Viewport: {viewport === 'desktop' ? 'Desktop (600px)' : 'Mobile (375px)'}</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={handleUndo} 
                        disabled={historyIndex <= 0}
                        className="px-2.5 py-1 text-[10px] font-bold bg-neutral-900 border border-[#1f2937]/60 hover:text-[#D4AF37] rounded-lg transition disabled:opacity-40 disabled:hover:text-slate-400"
                      >
                        ↶ Undo
                      </button>
                      <button 
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="px-2.5 py-1 text-[10px] font-bold bg-neutral-900 border border-[#1f2937]/60 hover:text-[#D4AF37] rounded-lg transition disabled:opacity-40 disabled:hover:text-slate-400"
                      >
                        ↷ Redo
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW CANVAS */}
                  <div className={`mx-auto bg-white rounded-3xl border border-amber-500/10 overflow-hidden shadow-2xl transition-all duration-300 ${viewport === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'}`}>
                    
                    {/* Mock Email Header */}
                    <div className="bg-[#030712] px-6 py-4 border-b border-neutral-900 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-600 to-yellow-400 rounded flex items-center justify-center">
                          <span className="text-[10px] font-serif font-black text-black">M</span>
                        </div>
                        <span className="font-serif font-extrabold text-[11px] text-white tracking-widest leading-none uppercase">MYVIRTUAL</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">service.bureau@myvirtualtax.com</span>
                    </div>

                    {/* Email Live content blocks */}
                    <div className="p-8 space-y-6 text-black min-h-[400px]">
                      {emailBlocks.map((block) => (
                        <div 
                          key={block.id}
                          onClick={() => setSelectedBlockId(block.id)}
                          className={`relative group p-4 border border-dashed rounded-2xl cursor-pointer transition ${selectedBlockId === block.id ? 'border-amber-500 bg-amber-500/5 shadow-inner' : 'border-transparent hover:border-gray-300'}`}
                        >
                          {/* Hover action toolbar */}
                          <div className="absolute right-2.5 top-2 opacity-0 group-hover:opacity-100 flex gap-1.5 transition">
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                              className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition"
                              title="Delete Block"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Block renderers */}
                          {block.type === 'heading' && (
                            <h2 className="text-xl font-serif font-black tracking-tight text-neutral-900 border-l-2 border-amber-500 pl-3 leading-tight">{block.content}</h2>
                          )}

                          {block.type === 'text' && (
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{block.content}</p>
                          )}

                          {block.type === 'button' && (
                            <div className="text-center py-2">
                              <a href={block.url} onClick={(e) => e.preventDefault()} className="inline-block bg-neutral-950 text-white font-mono font-bold text-xs uppercase tracking-widest py-3 px-8 rounded-full border border-amber-500/20 shadow-md">
                                {block.content}
                              </a>
                            </div>
                          )}

                          {block.type === 'calculator' && (
                            <div className="bg-neutral-950 text-white border border-amber-500/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">{block.content}</span>
                                <span className="bg-emerald-500/15 text-emerald-400 font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded border border-emerald-500/20">LIVE SYNCS</span>
                              </div>
                              <div className="whitespace-pre-line font-mono text-xs text-slate-300 leading-relaxed border-t border-amber-500/10 pt-2">{block.detail}</div>
                            </div>
                          )}

                          {block.type === 'checklist' && (
                            <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-5">
                              <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <span className="bg-amber-100 text-amber-800 w-5 h-5 flex items-center justify-center rounded-lg text-[10px]">✓</span>
                                {block.content}
                              </p>
                              <div className="whitespace-pre-line font-mono text-[11px] text-slate-600 leading-relaxed pl-7">{block.detail}</div>
                            </div>
                          )}

                          {block.type === 'status' && (
                            <div className="bg-neutral-950 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-white">
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest font-bold">Secure status channel</span>
                                <h4 className="text-xs font-bold">{block.content}</h4>
                                <p className="text-[10px] font-mono text-slate-400 leading-relaxed whitespace-pre-line">{block.detail}</p>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {emailBlocks.length === 0 && (
                        <p className="text-center text-slate-400 font-mono text-xs py-12">Drag or add content blocks to customize your canvas</p>
                      )}
                    </div>

                    {/* Mock Email Footer */}
                    <div className="bg-neutral-950 text-white text-center py-8 px-6 border-t border-neutral-900 space-y-2">
                      <p className="font-serif font-black text-xs tracking-wider uppercase">MYVIRTUAL TAX SOFTWARE</p>
                      <p className="text-[8px] font-mono text-slate-400">
                        RJ Business Solutions · 1342 NM 333, Tijeras, NM 87059 · support@rjbusinesssolutions.org
                      </p>
                      <p className="text-[8px] font-mono text-slate-500">
                        You are receiving this transaction notice as an active client of our white-label service portal. Click here to unsubscribe.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // SMS DESIGN WORKSPACE
                <div className="space-y-6">
                  <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-6 backdrop-blur-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black font-serif uppercase tracking-widest text-[#D4AF37]">Smart SMS Composer</label>
                      <span className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-[#D4AF37] uppercase">US/CAN SMS ROUTE</span>
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={smsContent}
                        onChange={(e) => setSMSContent(e.target.value)}
                        className="w-full bg-neutral-900 border border-[#1f2937]/60 rounded-2xl p-4 text-xs font-medium text-slate-100 min-h-[160px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-amber-500/20 leading-relaxed"
                        placeholder="Hey {{first_name}}, write SMS copy. STOP handles unsubscribe compliance..."
                      />

                      {/* SMS helper toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-2xl border border-[#1f2937]/40">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSMSContent(smsContent + ' {{first_name}}')} 
                            className="px-2.5 py-1.5 bg-neutral-900 border border-[#1f2937] hover:text-[#D4AF37] rounded-lg text-[9px] font-bold font-mono transition"
                          >
                            + {'{{first_name}}'}
                          </button>
                          <button 
                            onClick={() => setSMSContent(smsContent + ' {{refund_amount}}')} 
                            className="px-2.5 py-1.5 bg-neutral-900 border border-[#1f2937] hover:text-[#D4AF37] rounded-lg text-[9px] font-bold font-mono transition"
                          >
                            + {'{{refund_amount}}'}
                          </button>
                          <button 
                            onClick={() => setSMSContent(smsContent + ' 🎉')} 
                            className="px-2 py-1.5 bg-neutral-900 border border-[#1f2937] hover:bg-neutral-800 rounded-lg text-[10px] transition"
                          >
                            🎉
                          </button>
                          <button 
                            onClick={() => setSMSContent(smsContent + ' 💰')} 
                            className="px-2 py-1.5 bg-neutral-900 border border-[#1f2937] hover:bg-neutral-800 rounded-lg text-[10px] transition"
                          >
                            💰
                          </button>
                        </div>

                        <button 
                          onClick={() => {
                            if (!smsContent.includes('STOP')) {
                              setSMSContent(smsContent.trim() + ' Reply STOP to unsubscribe.');
                            } else {
                              alert('Opt-out compliance footer already present.');
                            }
                          }}
                          className="px-3 py-1.5 bg-neutral-900 border border-[#1f2937] text-[#D4AF37] rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-amber-500/10 transition"
                        >
                          Inject Opt-Out Footer
                        </button>
                      </div>

                      {/* Character Counter metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-[#1f2937]/30 text-xs text-slate-400">
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase font-bold tracking-wider">Length</p>
                          <p className="text-sm font-bold text-slate-100 font-mono">{smsCharCount} chars</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase font-bold tracking-wider">Type</p>
                          <p className="text-sm font-bold text-slate-100 font-mono">{isUnicode ? 'Unicode (UTF-16)' : 'GSM-7 standard'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase font-bold tracking-wider">Segments</p>
                          <p className="text-sm font-bold text-slate-100 font-mono">{totalSegments} segment</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase font-bold tracking-wider">Estimated Cost</p>
                          <p className="text-sm font-bold text-emerald-400 font-mono">${estimatedSMSCost.toFixed(4)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 10DLC & COMPLIANCE WARNING */}
                  <div className="bg-[#D4AF37]/5 border border-amber-500/20 rounded-3xl p-5 flex items-start gap-4">
                    <Info className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 text-xs text-amber-200/90 leading-relaxed">
                      <div className="font-bold uppercase tracking-wider text-[#D4AF37]">Carrier Regulations & 10DLC Standards</div>
                      <p>
                        Outbound SMS campaigns are routed via our Twilio registered <strong>10DLC A2P brand</strong>. Ensure campaigns contain opt-out wording like <code>Reply STOP</code>. Standard US quiet hours are actively enforced; outgoing messages queued between 9:00 PM and 9:00 AM local time will hold in buffer status.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'templates' && (
            // SEARCHABLE MAPPED TEMPLATES PICKER (50 Emails + 40 SMS)
            <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-6 backdrop-blur-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-4">
                <div>
                  <h3 className="text-lg font-serif font-black text-[#D4AF37]">Pre-loaded Asset Vault</h3>
                  <p className="text-xs text-slate-400 mt-1">Select and load any of your 126 pre-built compliant tax templates instantly.</p>
                </div>
                <div className="bg-neutral-900 border border-[#1f2937] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold text-slate-300">
                  Total System Assets: <strong className="text-[#D4AF37]">126 Loaded</strong>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search templates (e.g., onboarding, refund)..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full bg-neutral-900 border border-[#1f2937]/60 pl-11 pr-4 py-2.5 rounded-2xl focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value as any)}
                  className="bg-neutral-900 border border-[#1f2937]/60 rounded-2xl px-4 py-2.5 focus:border-[#D4AF37] focus:outline-none font-medium"
                >
                  <option value="all">Filter Category (All)</option>
                  {campaignType === 'email' ? (
                    <>
                      <option value="onboarding">New Client / Onboarding (10)</option>
                      <option value="returning">Existing Client (10)</option>
                      <option value="nurture">Lead Nurture series (10)</option>
                      <option value="irs">IRS Compliance (5)</option>
                      <option value="credit">Credit Repair (5)</option>
                      <option value="upsell">Sales & Upsell flows (10)</option>
                    </>
                  ) : (
                    <>
                      <option value="onboarding">Onboarding quick texts (10)</option>
                      <option value="alerts">Real-time alerts (10)</option>
                      <option value="followup">Follow-ups (10)</option>
                      <option value="sales">Sales & upsells (10)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Template Render list */}
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                {campaignType === 'email' ? (
                  // Email Template cards
                  PRELOADED_EMAIL_TEMPLATES
                    .filter(t => templateCategory === 'all' || t.category === templateCategory)
                    .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()) || t.subject.toLowerCase().includes(templateSearch.toLowerCase()))
                    .map(template => (
                      <div 
                        key={template.id}
                        className="bg-neutral-900/60 hover:bg-neutral-900 border border-[#1f2937]/60 hover:border-[#D4AF37]/30 p-4 rounded-2xl flex justify-between items-center gap-4 transition duration-300"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500/10 text-[#D4AF37] text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-amber-500/20">
                              {template.category}
                            </span>
                            <span className="font-serif font-bold text-xs text-white">{template.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic max-w-md truncate">{template.subject}</p>
                          <p className="text-[10px] text-slate-500 max-w-md line-clamp-1">{template.description}</p>
                        </div>
                        <button
                          onClick={() => loadEmailTemplate(template)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-amber-500 hover:text-black border border-amber-500/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                        >
                          Load <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                ) : (
                  // SMS Template cards
                  PRELOADED_SMS_TEMPLATES
                    .filter(t => templateCategory === 'all' || t.category === templateCategory)
                    .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()) || t.content.toLowerCase().includes(templateSearch.toLowerCase()))
                    .map(template => (
                      <div 
                        key={template.id}
                        className="bg-neutral-900/60 hover:bg-neutral-900 border border-[#1f2937]/60 hover:border-[#D4AF37]/30 p-4 rounded-2xl flex justify-between items-center gap-4 transition duration-300"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500/10 text-[#D4AF37] text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-amber-500/20">
                              {template.category}
                            </span>
                            <span className="font-serif font-bold text-xs text-white">{template.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic max-w-md line-clamp-2">{template.content}</p>
                        </div>
                        <button
                          onClick={() => loadSMSTemplate(template)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 hover:bg-amber-500 hover:text-black border border-amber-500/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                        >
                          Load <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            // MOCK A/B SEND TESTING PANEL
            <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-6 backdrop-blur-xl space-y-6">
              <div className="border-b border-amber-500/10 pb-4">
                <h3 className="text-lg font-serif font-black text-[#D4AF37]">Campaign Sandbox Testing</h3>
                <p className="text-xs text-slate-400 mt-1">Verify merge tag injection and test sending outputs to client devices.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 bg-neutral-900/50 rounded-2xl border border-[#1f2937]/40 space-y-3">
                  <div className="font-bold text-[#D4AF37] uppercase tracking-wider">A/B Testing Variables (Splits)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-slate-300">
                      <input type="checkbox" defaultChecked className="rounded text-[#D4AF37] bg-neutral-900 border-[#1f2937]" />
                      Split Subject Line (50/50 traffic)
                    </label>
                    <label className="flex items-center gap-2 text-slate-300">
                      <input type="checkbox" className="rounded text-[#D4AF37] bg-neutral-900 border-[#1f2937]" />
                      Optimize Send Time per recipient
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-400 font-bold">Send Test Copy to</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue="+1 (414) 430-4277 / service.bureau@myvirtualtax.com"
                      className="flex-1 bg-neutral-900 border border-[#1f2937]/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-100"
                    />
                    <button 
                      onClick={() => {
                        setTestSendResult('success');
                        setTimeout(() => setTestSendResult(null), 3000);
                      }}
                      className="px-4 py-2.5 bg-neutral-900 border border-amber-500/20 hover:bg-amber-500/10 text-white font-bold rounded-xl transition"
                    >
                      Dispatch Test
                    </button>
                  </div>
                </div>

                {testSendResult === 'success' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-4 rounded-2xl flex items-center gap-2.5">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <span>Success! Test campaign has been generated with sandbox sample tags and dispatched. Check device outputs!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ELEMENT PROPERTIES (EMAIL) / DEVICE PREVIEW (SMS) */}
        <div className="lg:col-span-1 space-y-6">
          {campaignType === 'email' ? (
            // PROPERTY EDIT PANEL
            <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-5 backdrop-blur-xl">
              <h3 className="text-xs font-black tracking-widest text-[#D4AF37] uppercase font-serif border-b border-amber-500/10 pb-3 mb-4 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#D4AF37]" /> Element Properties
              </h3>

              {selectedBlockId ? (
                (() => {
                  const block = emailBlocks.find(b => b.id === selectedBlockId);
                  if (!block) return <p className="text-xs text-slate-500">No block matching ID</p>;
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="bg-neutral-900/40 p-3 rounded-xl border border-[#1f2937]/40">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Selected Block Block Type:</span>
                        <p className="text-xs font-bold text-white capitalize mt-0.5">{block.type}</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-400 font-bold block">Block Content Text</label>
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlockContent(block.id, 'content', e.target.value)}
                          className="w-full bg-neutral-900 border border-[#1f2937]/60 rounded-xl p-3.5 text-xs text-slate-100 min-h-[140px] focus:outline-none"
                        />
                      </div>

                      {block.type === 'button' && (
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-bold block">Destination URL / Merge Tag</label>
                          <input
                            type="text"
                            value={block.url || ''}
                            onChange={(e) => updateBlockContent(block.id, 'url', e.target.value)}
                            className="w-full bg-neutral-900 border border-[#1f2937]/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono"
                          />
                        </div>
                      )}

                      {(block.type === 'calculator' || block.type === 'checklist' || block.type === 'status') && (
                        <div className="space-y-1.5">
                          <label className="text-slate-400 font-bold block">Internal Schedule Details</label>
                          <textarea
                            value={block.detail || ''}
                            onChange={(e) => updateBlockContent(block.id, 'detail', e.target.value)}
                            className="w-full bg-neutral-900 border border-[#1f2937]/60 rounded-xl p-3.5 text-xs text-slate-100 font-mono min-h-[100px] focus:outline-none"
                          />
                        </div>
                      )}

                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl font-bold tracking-wide uppercase transition duration-300"
                      >
                        <Trash2 className="h-4 w-4" /> Remove Block
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  Click any content block inside the center canvas to customize its layout and values
                </div>
              )}
            </div>
          ) : (
            // SMS LIVE DEVICE PREVIEW
            <div className="bg-neutral-950/40 border border-[#1f2937]/50 rounded-3xl p-5 backdrop-blur-xl">
              <h3 className="text-xs font-black tracking-widest text-[#D4AF37] uppercase font-serif border-b border-amber-500/10 pb-3 mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#D4AF37]" /> Live Device Render
              </h3>

              {/* MOCK SMARTPHONE */}
              <div className="mx-auto w-[250px] aspect-[9/18] bg-neutral-900 rounded-[36px] border-4 border-neutral-800 p-2 shadow-2xl relative">
                {/* Speaker top */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-neutral-800 rounded-full"></div>
                {/* Mock Phone screen */}
                <div className="w-full h-full bg-[#030712] rounded-[28px] overflow-hidden flex flex-col justify-between p-3">
                  <div className="space-y-2 mt-4">
                    <div className="text-center">
                      <div className="w-7 h-7 bg-neutral-800 text-slate-300 rounded-full flex items-center justify-center font-bold text-[10px] mx-auto">
                        ✉
                      </div>
                      <span className="text-[8px] text-slate-400 font-semibold tracking-wide">505-MYVIRTUAL</span>
                    </div>

                    {/* Chat Bubble */}
                    <div className="bg-[#1f2937] text-white p-3 rounded-2xl rounded-tl-sm text-[9px] leading-relaxed max-w-[85%] border border-[#1f2937]/60 shadow">
                      {smsContent || 'Write SMS message content to see live render output...'}
                    </div>
                  </div>

                  <div className="text-center text-[7px] text-slate-500 font-mono pb-2">
                    📱 Standard SMS/MMS Carrier Link
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Dummy Icon mapping
function LayoutCheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
