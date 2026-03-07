/**
 * Terms of Service
 *
 * Legal terms governing the use of LetsHelp
 */

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for LetsHelp",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsPage() {
  const effectiveDate = "March 7, 2025";

  return (
    <div className="py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {effectiveDate}
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using LetsHelp ("the Service"), you agree to be bound by
              these Terms of Service ("Terms"). If you do not agree to these Terms,
              please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
            <p>
              LetsHelp provides AI-powered technology support services primarily
              designed for seniors. The Service includes:
            </p>
            <ul>
              <li>Screen sharing capabilities for personalized guidance</li>
              <li>Voice-based interaction with AI assistants</li>
              <li>Optional connection to human volunteers</li>
              <li>Session history and transcripts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. User Responsibilities</h2>
            <p>As a user of LetsHelp, you agree to:</p>
            <ul>
              <li>
                Provide accurate information when creating your account
              </li>
              <li>
                Maintain the security of your account credentials
              </li>
              <li>
                Use the Service only for its intended purpose
              </li>
              <li>
                Not attempt to circumvent any technical measures or access
                restricted features
              </li>
              <li>
                Respect the AI assistants and human volunteers
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Privacy and Data</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy, which
              describes how we collect, use, and protect your information. By using
              LetsHelp, you consent to such data practices.
            </p>
            <p>
              <strong>Important:</strong> During support sessions, screen sharing and
              voice data are processed to provide assistance. These sessions are
              encrypted and stored securely. You may request deletion of your session
              data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Payment Terms</h2>
            <p>
              <strong>For Individual Users:</strong> Subscription fees are charged
              monthly or annually. You may cancel at any time, and service will
              continue through the end of your current billing period.
            </p>
            <p>
              <strong>For Facilities:</strong> Facility contracts are billed based on
              the number of registered residents. Thirty days' notice is required
              for changes to resident counts.
            </p>
            <p>
              All fees are non-refundable except as required by law or as specifically
              stated in these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Service Availability</h2>
            <p>
              We strive to provide 24/7 availability but do not guarantee uninterrupted
              service. The Service may be temporarily unavailable for maintenance,
              updates, or other reasons beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES
              OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT:
            </p>
            <ul>
              <li>The Service will meet your specific requirements</li>
              <li>The Service will be uninterrupted or error-free</li>
              <li>AI assistance will resolve every technical issue</li>
              <li>Human volunteers will be immediately available</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, LetsHelp shall not be liable for
              any indirect, incidental, special, or consequential damages resulting
              from your use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. User Content</h2>
            <p>
              You retain ownership of any information you share during sessions.
              However, you grant us a license to use this information solely to
              provide the Service and improve our AI systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate
              these Terms or engage in fraudulent or harmful activities. Upon
              termination, your right to use the Service immediately ceases.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Continued use of the Service
              after changes constitutes acceptance of the new Terms. We will notify
              users of material changes via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the United States and the state
              of Virginia. Any disputes shall be resolved through binding arbitration
              in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> legal@letshelp.com<br />
              <strong>Address:</strong> [To be updated]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Special Provisions for Senior Users</h2>
            <p>
              We recognize that many of our users are seniors. If you need help
              understanding these Terms or have questions, please contact us. We're
              happy to explain anything in plain language.
            </p>
            <p>
              Family members or caregivers may contact us on behalf of senior users
              with proper authorization.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
