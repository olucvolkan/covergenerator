import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - CvToLetter',
  description: 'Privacy Policy and data handling practices for CvToLetter - AI Cover Letter Generator',
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            At CvToLetter, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-medium mb-2">2.1 Personal Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Name and email address when you create an account</li>
            <li>Resume/CV content that you upload</li>
            <li>Job descriptions you input</li>
            <li>Payment information (processed securely through Stripe)</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">2.2 Usage Information</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Log data and device information</li>
            <li>Usage patterns and preferences</li>
            <li>Generated cover letters and match scores</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>To provide and maintain our service</li>
            <li>To generate personalized cover letters</li>
            <li>To improve our AI algorithms and service quality</li>
            <li>To communicate with you about your account</li>
            <li>To process your payments</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
          <p className="mb-4">
            We use industry-standard security measures to protect your data. Your information is stored securely on Supabase servers, and all payment processing is handled through Stripe's secure platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Third Parties</h2>
          <p className="mb-4">
            We do not sell your personal information. We may share your information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Stripe for payment processing</li>
            <li>Supabase for data storage</li>
            <li>Anthropic's Claude AI for cover letter generation</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p className="mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Export your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to improve your experience on our website. You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p className="mb-4">
            Our service is not intended for users under 16 years of age. We do not knowingly collect information from children.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            Email: volkanoluc@gmail.com
          </p>
        </section>

        <footer className="pt-8 text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </footer>
      </div>
    </div>
  );
} 