/**
 * Privacy Policy
 *
 * Privacy policy explaining how LetsHelp collects, uses, and protects user data
 */

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for LetsHelp",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPage() {
  const effectiveDate = "March 7, 2025";

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {effectiveDate}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p>
              LetsHelp ("we," "our," or "us") respects your privacy and is committed
              to protecting your personal information. This Privacy Policy explains
              how we collect, use, and safeguard your information when you use our
              AI-powered tech support service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Name and email address</li>
              <li>Phone number (optional)</li>
              <li>Date of birth (to verify age requirements)</li>
              <li>Demographic information (for personalization)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Session Data</h3>
            <p>During support sessions, we process:</p>
            <ul>
              <li>Screen sharing content (what's visible on your screen)</li>
              <li>Voice recordings (your conversation with the AI)</li>
              <li>Session transcripts and chat history</li>
              <li>Technical details about your device</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Usage Data</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Session start and end times</li>
              <li>Duration of each session</li>
              <li>Type of issue or assistance requested</li>
              <li>Outcome of the session</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.4 Accessibility Data</h3>
            <p>If you use accessibility features, we store:</p>
            <ul>
              <li>Font size preferences</li>
              <li>Language preferences</li>
              <li>Voice speed settings</li>
              <li>High contrast mode preference</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide personalized tech support during sessions</li>
              <li>Improve our AI models and service quality</li>
              <li>Communicate with you about your account</li>
              <li>Generate usage analytics for facility administrators</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your
              information:
            </p>
            <ul>
              <li>
                <strong>Encryption:</strong> All sessions are encrypted in transit
                using TLS 1.3
              </li>
              <li>
                <strong>Storage:</strong> Session data is encrypted at rest using
                AES-256 encryption
              </li>
              <li>
                <strong>Access:</strong> Strict access controls limit who can view
                your data
              </li>
              <li>
                <strong>Retention:</strong> Session transcripts are retained for 90
                days by default, unless you choose to keep them longer
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Sharing Your Information</h2>
            <p>
              We do not sell your personal information. We may share your data only
              in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.1 Human Volunteers</h3>
            <p>
              If you request human assistance, relevant session context may be shared
              with a verified volunteer to help resolve your issue.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.2 Facility Administrators</h3>
            <p>
              For facility accounts, administrators may view aggregated usage data
              and session history for residents at their facility.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.3 Service Providers</h3>
            <p>
              We use third-party services to operate our business:
            </p>
            <ul>
              <li>Google (for AI processing and authentication)</li>
              <li>Stripe (for payment processing)</li>
              <li>Vercel (for hosting and infrastructure)</li>
            </ul>
            <p>
              These providers have access to your data only to perform services on
              our behalf and are obligated to protect it.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.4 Legal Requirements</h3>
            <p>
              We may disclose information if required by law or to protect our
              rights, property, or safety.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Your Privacy Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update inaccurate information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and data
              </li>
              <li>
                <strong>Opt-out:</strong> Disable data collection for analytics
              </li>
              <li>
                <strong>Portability:</strong> Receive your data in a structured format
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at privacy@letshelp.com or use
              the settings in your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              7. AI Training and Improvement
            </h2>
            <p>
              Session data may be used to improve our AI models. We take steps to
              protect privacy during this process:
            </p>
            <ul>
              <li>Personally identifiable information is removed</li>
              <li>Data is aggregated and anonymized</li>
              <li>You can opt out of AI training in your account settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul>
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze site traffic</li>
              <li>Improve our service</li>
            </ul>
            <p>
              You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Children's Privacy</h2>
            <p>
              LetsHelp is not intended for users under 18. We do not knowingly
              collect information from children. If we become aware that we have
              collected data from a child, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              10. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is
              active. After account closure:
            </p>
            <ul>
              <li>Account information is deleted within 30 days</li>
              <li>Session transcripts are retained for 90 days</li>
              <li>Anonymous usage data may be retained indefinitely</li>
            </ul>
            <p>
              You can request immediate deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other
              than your own. We ensure appropriate safeguards are in place to
              protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of material changes by email or in-app notification. Your continued
              use of the Service after changes indicates your acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights, please
              contact:
            </p>
            <p>
              <strong>Email:</strong> privacy@letshelp.com<br />
              <strong>Address:</strong> [To be updated]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              14. Special Note for Seniors
            </h2>
            <p>
              We understand that privacy can be confusing. If you have questions
              about how we protect your information, please reach out. A member of
              our team will explain everything clearly and help you with any privacy
              concerns.
            </p>
            <p>
              Family members and caregivers are welcome to contact us on behalf of
              senior users with proper authorization.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
