/**
 * LetsHelp Marketing Landing Page
 *
 * A warm, professional landing page for both B2B (facilities) and B2C (families).
 * Features: Hero, Problem/Solution, How It Works, Features, Pricing, FAQ, Footer
 *
 * Design: Trustworthy, human-centered with distinctive typography and warm colors.
 */

import Link from "next/link";
import {
  Shield,
  Clock,
  Heart,
  Video,
  Users,
  Check,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Headphones,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FEF9F3]">
      {/* Navigation */}
      <nav className="border-b-4 border-[#1E5A8D] bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] flex items-center justify-center shadow-lg">
                <Headphones className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
                LetsHelp
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-lg font-medium text-[#5A6B7F] hover:text-[#1E5A8D] transition-colors">
                How It Works
              </a>
              <a href="#features" className="text-lg font-medium text-[#5A6B7F] hover:text-[#1E5A8D] transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-lg font-medium text-[#5A6B7F] hover:text-[#1E5A8D] transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-lg font-medium text-[#5A6B7F] hover:text-[#1E5A8D] transition-colors">
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg border-2 border-[#1E5A8D] text-[#1E5A8D] hover:bg-[#1E5A8D] hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-[#1E5A8D] to-[#2563EB] hover:from-[#1E4A6D] hover:to-[#1E5090] text-lg px-6 h-14">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1E5A8D] via-[#2563EB] to-[#3B82F6] text-white py-20 md:py-32">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 text-white font-medium backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
                Trusted by senior living communities
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight font-[Fraunces,serif]">
                Patient Tech Support,{" "}
                <span className="text-[#FCD34D]">On Demand</span>
              </h1>

              <p className="text-2xl text-white/90 max-w-xl leading-relaxed">
                An AI assistant that sees your screen, hears your voice, and guides you
                step-by-step. Available 24/7. Never frustrated.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-white text-[#1E5A8D] hover:bg-gray-100 text-xl px-10 py-7 rounded-2xl font-bold shadow-xl btn-press"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-3 border-white text-white hover:bg-white/10 text-xl px-10 py-7 rounded-2xl font-bold"
                  asChild
                >
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>

              <div className="flex items-center gap-8 text-lg text-white/90">
                <div className="flex items-center gap-2">
                  <Check className="h-6 w-6 text-[#34D399]" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-6 w-6 text-[#34D399]" />
                  Cancel anytime
                </div>
              </div>
            </div>

            <div className="relative animate-slide-up" style={{ animationDelay: '200ms' }}>
              {/* Feature Grid */}
              <div className="grid grid-cols-2 gap-5">
                {[
                  { icon: Video, label: 'Screen Sharing', description: 'AI sees exactly what you see', color: 'from-white/25 to-white/15', iconColor: 'text-[#60A5FA]' },
                  { icon: MessageSquare, label: 'Voice Guidance', description: 'Talk naturally, step-by-step', color: 'from-white/25 to-white/15', iconColor: 'text-[#34D399]' },
                  { icon: Shield, label: 'Private & Secure', description: 'Encrypted, private sessions', color: 'from-white/25 to-white/15', iconColor: 'text-[#A78BFA]' },
                  { icon: Clock, label: '24/7 Available', description: 'Help whenever you need it', color: 'from-white/25 to-white/15', iconColor: 'text-[#FCD34D]' },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br backdrop-blur-sm rounded-3xl p-7 border-2 border-white/40 hover:scale-[1.02] hover:bg-white/30 transition-all duration-300"
                  >
                    <div className="bg-white/20 rounded-2xl w-14 h-14 flex items-center justify-center mb-4">
                      <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                    </div>
                    <div className="text-xl font-bold font-[Fraunces,serif] mb-1">{feature.label}</div>
                    <div className="text-sm text-white/80 leading-snug">{feature.description}</div>
                  </div>
                ))}
              </div>
              {/* Trust badge below */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-3 bg-white/25 backdrop-blur-sm rounded-full px-8 py-4 border border-white/30">
                  <Check className="h-6 w-6 text-[#34D399]" />
                  <span className="text-white font-semibold text-lg">Trusted by 1,000+ seniors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1E3A5F] mb-6 font-[Fraunces,serif]">
              The Tech Support Problem for Seniors
            </h2>
            <p className="text-2xl text-[#5A6B7F] max-w-2xl mx-auto">
              Sixty million Americans over 65 struggle with technology daily.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Family is Too Busy',
                description: 'Adult children are busy or live far away. They want to help but can\'t always be available. Seniors feel guilty asking repeatedly.',
                color: 'bg-red-50',
                iconColor: 'text-red-500',
              },
              {
                icon: DollarSign,
                title: 'Professional Help is Expensive',
                description: 'In-person tech support costs $100-125 per hour and requires booking days in advance. Not practical for quick questions.',
                color: 'bg-orange-50',
                iconColor: 'text-orange-500',
              },
              {
                icon: MessageSquare,
                title: 'Hotlines Can\'t See Your Screen',
                description: 'Phone support can\'t visualize what you\'re seeing. They give generic advice that doesn\'t match your specific situation.',
                color: 'bg-amber-50',
                iconColor: 'text-amber-500',
              },
            ].map((problem, i) => (
              <div
                key={i}
                className="bg-[#FEF9F3] rounded-3xl shadow-lg p-10 border-4 border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`h-16 w-16 rounded-2xl ${problem.color} flex items-center justify-center mb-6`}>
                  <problem.icon className={`h-8 w-8 ${problem.iconColor}`} />
                </div>
                <h3 className="text-2xl font-bold text-[#1E3A5F] mb-4 font-[Fraunces,serif]">
                  {problem.title}
                </h3>
                <p className="text-lg text-[#5A6B7F] leading-relaxed">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-[Fraunces,serif]">
              Enter LetsHelp: Your Patient Tech Friend
            </h2>
            <p className="text-2xl text-white/90 max-w-2xl mx-auto">
              AI-powered support that sees your screen and guides you through any problem.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                {
                  icon: Video,
                  title: 'Sees Your Screen in Real-Time',
                  description: 'The AI sees exactly what you see, enabling personalized guidance for your specific device and problem.',
                },
                {
                  icon: Heart,
                  title: 'Infinite Patience',
                  description: 'Never sighs, never gets frustrated, happy to explain the same step as many times as needed.',
                },
                {
                  icon: Clock,
                  title: 'Available 24/7',
                  description: 'Get help whenever you need it. Day or night, weekday or weekend. No waiting, no appointments.',
                },
              ].map((feature, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-[#FCD34D]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 font-[Fraunces,serif]">
                      {feature.title}
                    </h3>
                    <p className="text-xl text-white/90 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md text-center">
                <div className="h-24 w-24 rounded-full bg-[#34D399]/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-12 w-12 text-[#34D399]" />
                </div>
                <h3 className="text-3xl font-bold text-[#1E3A5F] mb-4 font-[Fraunces,serif]">
                  Problem Solved
                </h3>
                <p className="text-xl text-[#5A6B7F] leading-relaxed mb-4">
                  "I learned how to FaceTime my grandkids in just 5 minutes. LetsHelp
                  showed me exactly which buttons to press!"
                </p>
                <p className="text-lg font-semibold text-[#1E5A8D]">— Eleanor, age 78</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-[#FEF9F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1E3A5F] mb-6 font-[Fraunces,serif]">
              How It Works
            </h2>
            <p className="text-2xl text-[#5A6B7F] max-w-2xl mx-auto">
              Getting help is as easy as pressing a button
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Press "Get Help"',
                description: 'Click the big button in the app or on our website. No account needed to start.',
                color: 'from-[#1E5A8D] to-[#2563EB]',
              },
              {
                step: '2',
                title: 'Share Your Screen',
                description: 'Allow screen sharing so the AI can see exactly what you\'re seeing. One click, secure and private.',
                color: 'from-teal-500 to-teal-600',
              },
              {
                step: '3',
                title: 'Follow Along',
                description: 'Talk to the AI like a friend. It guides you step-by-step until your problem is solved.',
                color: 'from-[#F59E0B] to-[#D97706]',
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className={`
                  h-24 w-24 rounded-full bg-gradient-to-br ${step.color} text-white
                  flex items-center justify-center text-4xl font-bold mx-auto mb-6
                  shadow-lg
                `}>
                  {step.step}
                </div>
                <h3 className="text-2xl font-bold text-[#1E3A5F] mb-4 font-[Fraunces,serif]">
                  {step.title}
                </h3>
                <p className="text-xl text-[#5A6B7F] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1E3A5F] mb-6 font-[Fraunces,serif]">
              Everything Seniors Need
            </h2>
            <p className="text-2xl text-[#5A6B7F] max-w-2xl mx-auto">
              Designed specifically for older adults who didn't grow up with technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Video, title: 'Screen Sharing', desc: 'The AI sees exactly what you see on your device for personalized help' },
              { icon: MessageSquare, title: 'Voice Conversation', desc: 'Talk naturally—the AI understands and speaks in a friendly, clear way' },
              { icon: Shield, title: 'Private & Secure', desc: 'Sessions are encrypted. Only you can see and hear the conversation' },
              { icon: Clock, title: '24/7 Availability', desc: 'Help is always available—day or night, weekends, holidays' },
              { icon: Users, title: 'Human Backup', desc: 'Connect with a real volunteer if the AI can\'t solve your problem' },
              { icon: Heart, title: 'Senior-Friendly Design', desc: 'Large text, clear buttons, simple navigation designed for older adults' },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-[#FEF9F3] rounded-3xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <feature.icon className="h-12 w-12 text-[#1E5A8D] mb-4" />
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-3 font-[Fraunces,serif]">
                  {feature.title}
                </h3>
                <p className="text-lg text-[#5A6B7F] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-24 bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-[Fraunces,serif]">
              Trusted by Seniors and Facilities
            </h2>
            <p className="text-2xl text-white/90 max-w-2xl mx-auto">
              Join thousands of seniors who've solved their tech problems with LetsHelp
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "I finally learned how to use Zoom! Now I have coffee with my friends every week.",
                author: "Margaret, 82",
              },
              {
                text: "My daughter set this up for me. Now I don't have to call her at work for every little thing.",
                author: "Robert, 76",
              },
              {
                text: "Our residents love it. They're more independent and staff spends less time on tech support.",
                author: "Sarah, Activities Director",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-3xl text-[#FCD34D]">★</span>
                  ))}
                </div>
                <p className="text-xl text-white/90 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <p className="font-bold text-[#FCD34D]">— {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#FEF9F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1E3A5F] mb-6 font-[Fraunces,serif]">
              Simple, Affordable Pricing
            </h2>
            <p className="text-2xl text-[#5A6B7F] max-w-2xl mx-auto">
              Choose the plan that works for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* B2B Plan */}
            <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-[#1E5A8D] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#1E5A8D] text-white px-4 py-2 rounded-bl-2xl font-bold text-sm">
                POPULAR
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#1E3A5F] mb-3 font-[Fraunces,serif]">
                  For Senior Living Facilities
                </h3>
                <p className="text-lg text-[#5A6B7F]">Provide LetsHelp as a resident amenity</p>
              </div>
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-[#1E5A8D]">$15</div>
                <div className="text-xl text-[#5A6B7F]">per resident per month</div>
              </div>
              <ul className="space-y-4 mb-10">
                {[
                  'Unlimited sessions for all residents',
                  'Admin dashboard with analytics',
                  'Resident management tools',
                  'Billing & usage reports',
                  'Volume discounts available',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg">
                    <Check className="h-6 w-6 text-teal-600 flex-shrink-0" />
                    <span className="text-[#1E3A5F]">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login?plan=facility">
                <Button className="w-full h-16 text-xl font-bold bg-gradient-to-r from-[#1E5A8D] to-[#2563EB] hover:from-[#1E4A6D] hover:to-[#1E5090] rounded-2xl" size="lg">
                  Contact Sales
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>

            {/* B2C Plan */}
            <div className="bg-white rounded-3xl shadow-xl p-10 border-4 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#1E3A5F] mb-3 font-[Fraunces,serif]">
                  For Individuals & Families
                </h3>
                <p className="text-lg text-[#5A6B7F]">Peace of mind for you and your parents</p>
              </div>
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-[#1E3A5F]">$20</div>
                <div className="text-xl text-[#5A6B7F]">per month</div>
              </div>
              <ul className="space-y-4 mb-10">
                {[
                  'Unlimited tech support sessions',
                  '24/7 availability',
                  'Screen sharing & voice guidance',
                  'Human volunteer backup',
                  'Cancel anytime',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg">
                    <Check className="h-6 w-6 text-teal-600 flex-shrink-0" />
                    <span className="text-[#1E3A5F]">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login?plan=individual">
                <Button className="w-full h-16 text-xl font-bold border-3 border-[#1E5A8D] text-[#1E5A8D] hover:bg-blue-50 rounded-2xl" variant="outline" size="lg">
                  Start Free Trial
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="mt-16 text-center">
            <p className="text-2xl text-[#5A6B7F]">
              Compare to <strong className="text-red-500">$100-125/hour</strong> for
              traditional tech support services
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1E3A5F] mb-6 font-[Fraunces,serif]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Is LetsHelp secure and private?",
                a: "Yes. All sessions are encrypted, and we never share your conversations. Only you and the AI can see and hear what happens during a session.",
              },
              {
                q: "What kind of problems can LetsHelp help with?",
                a: "Almost any tech problem: using apps, video calls, email, passwords, streaming music, photos, printing, and much more. If it involves technology, we can help.",
              },
              {
                q: "Do I need to be good with technology?",
                a: "Not at all! LetsHelp is designed for seniors who didn't grow up with technology. We explain everything clearly and patiently.",
              },
              {
                q: "What if the AI can't solve my problem?",
                a: "You can request a human volunteer at any time. They'll connect with you to help with more complex issues.",
              },
              {
                q: "Does this work on all devices?",
                a: "LetsHelp works on computers, tablets, and smartphones. Both Apple and Android devices are supported.",
              },
              {
                q: "Can family members see the session history?",
                a: "With your permission, family members can see past sessions to understand what problems you've worked on.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-[#FEF9F3] rounded-3xl p-8 border-4 border-gray-100">
                <h3 className="text-xl font-bold text-[#1E3A5F] mb-3 font-[Fraunces,serif]">
                  {faq.q}
                </h3>
                <p className="text-lg text-[#5A6B7F] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#1E5A8D] to-[#2563EB] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 font-[Fraunces,serif]">
            Ready to Get Help?
          </h2>
          <p className="text-2xl text-white/90 mb-10">
            Start your free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-[#1E5A8D] hover:bg-gray-100 text-2xl px-12 py-8 rounded-2xl font-bold shadow-xl btn-press"
              >
                Get Started Now
                <ArrowRight className="ml-3 h-7 w-7" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-3 border-white text-white hover:bg-white/10 text-2xl px-12 py-8 rounded-2xl font-bold"
              asChild
            >
              <a href="#pricing">View Pricing</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E3A5F] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg">
                  <Headphones className="h-7 w-7" />
                </div>
                <span className="text-2xl font-bold font-[Fraunces,serif]">LetsHelp</span>
              </div>
              <p className="text-lg text-white/80 leading-relaxed">
                Patient, on-demand tech support for seniors.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-xl mb-6 font-[Fraunces,serif]">Product</h4>
              <ul className="space-y-3 text-lg">
                <li><a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/senior" className="text-white/80 hover:text-white transition-colors">Seniors</a></li>
                <li><a href="/facility" className="text-white/80 hover:text-white transition-colors">Facilities</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xl mb-6 font-[Fraunces,serif]">Company</h4>
              <ul className="space-y-3 text-lg">
                <li><a href="/about" className="text-white/80 hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="text-white/80 hover:text-white transition-colors">Contact</a></li>
                <li><a href="/careers" className="text-white/80 hover:text-white transition-colors">Careers</a></li>
                <li><a href="/blog" className="text-white/80 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xl mb-6 font-[Fraunces,serif]">Legal</h4>
              <ul className="space-y-3 text-lg">
                <li><a href="/privacy" className="text-white/80 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-white/80 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/accessibility" className="text-white/80 hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-lg text-white/80">
              &copy; 2026 LetsHelp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
