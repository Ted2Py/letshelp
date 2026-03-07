/**
 * LetsHelp Marketing Landing Page
 *
 * The main landing page for both B2B (facilities) and B2C (families) audiences.
 * Features: Hero, Problem/Solution, How It Works, Features, Pricing, FAQ, Footer
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                LetsHelp
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm hover:text-blue-600 transition-colors">
                How It Works
              </a>
              <a href="#features" className="text-sm hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm hover:text-blue-600 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm hover:text-blue-600 transition-colors">
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <Shield className="h-4 w-4" />
                Trusted by senior living communities
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Patient Tech Support,{" "}
                <span className="text-blue-600 dark:text-blue-400">On Demand</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                An AI assistant that sees your screen, hears your voice, and guides you
                step-by-step through any tech problem. Available 24/7. Never frustrated.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-8 text-white flex flex-col justify-center items-center text-center">
                <Video className="h-24 w-24 mb-6 opacity-90" />
                <p className="text-2xl font-semibold mb-4">
                  "How do I play classical music on my phone?"
                </p>
                <p className="text-lg opacity-90">
                  LetsHelp sees your screen and guides you, step by step.
                </p>
                <div className="mt-8 px-6 py-3 bg-white/20 rounded-full text-sm">
                  <Clock className="inline h-4 w-4 mr-2" />
                  Average resolution: 5 minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Tech Support Problem for Seniors
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sixty million Americans over 65 struggle with technology daily.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-red-200 dark:border-red-900">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Family is Too Busy</h3>
              <p className="text-muted-foreground">
                Adult children are busy or live far away. They want to help but can't
                always be available. Seniors feel guilty asking repeatedly.
              </p>
            </Card>
            <Card className="p-8 border-red-200 dark:border-red-900">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Professional Help is Expensive</h3>
              <p className="text-muted-foreground">
                In-person tech support costs $100-125 per hour and requires booking days
                in advance. Not practical for quick questions.
              </p>
            </Card>
            <Card className="p-8 border-red-200 dark:border-red-900">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Hotlines Can't See Your Screen</h3>
              <p className="text-muted-foreground">
                Phone support can't visualize what you're seeing. They give generic
                advice that doesn't match your specific situation.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-blue-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enter LetsHelp: Your Patient Tech Friend
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered support that sees your screen and guides you through any problem.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Sees Your Screen in Real-Time
                  </h3>
                  <p className="text-muted-foreground">
                    The AI sees exactly what you see, enabling personalized guidance for
                    your specific device and problem.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Infinite Patience
                  </h3>
                  <p className="text-muted-foreground">
                    Never sighs, never gets frustrated, happy to explain the same step
                    as many times as needed.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Available 24/7</h3>
                  <p className="text-muted-foreground">
                    Get help whenever you need it. Day or night, weekday or weekend.
                    No waiting, no appointments.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Card className="p-8 max-w-md">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Problem Solved</h3>
                  <p className="text-muted-foreground">
                    "I learned how to FaceTime my grandkids in just 5 minutes. LetsHelp
                    showed me exactly which buttons to press!"
                  </p>
                  <p className="text-sm text-muted-foreground">— Eleanor, age 78</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting help is as easy as pressing a button
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Press "Get Help"</h3>
              <p className="text-muted-foreground">
                Click the big blue button in the app or on our website. No account
                needed to start.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Share Your Screen</h3>
              <p className="text-muted-foreground">
                Allow screen sharing so the AI can see exactly what you're seeing. One
                click, secure and private.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Follow Along</h3>
              <p className="text-muted-foreground">
                Talk to the AI like a friend. It guides you step-by-step until your
                problem is solved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Seniors Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Designed specifically for older adults who didn't grow up with technology
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6">
              <Video className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Screen Sharing</h3>
              <p className="text-sm text-muted-foreground">
                The AI sees exactly what you see on your device for personalized help
              </p>
            </Card>
            <Card className="p-6">
              <MessageSquare className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Voice Conversation</h3>
              <p className="text-sm text-muted-foreground">
                Talk naturally—the AI understands and speaks in a friendly, clear way
              </p>
            </Card>
            <Card className="p-6">
              <Shield className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Private & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Sessions are encrypted. Only you can see and hear the conversation
              </p>
            </Card>
            <Card className="p-6">
              <Clock className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">24/7 Availability</h3>
              <p className="text-sm text-muted-foreground">
                Help is always available—day or night, weekends, holidays
              </p>
            </Card>
            <Card className="p-6">
              <Users className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Human Backup</h3>
              <p className="text-sm text-muted-foreground">
                Connect with a real volunteer if the AI can't solve your problem
              </p>
            </Card>
            <Card className="p-6">
              <Heart className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold mb-2">Senior-Friendly Design</h3>
              <p className="text-sm text-muted-foreground">
                Large text, clear buttons, simple navigation designed for older adults
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Seniors and Facilities
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of seniors who've solved their tech problems with LetsHelp
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 bg-white/10 border-white/20 text-white">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="mb-4 opacity-90">
                "I finally learned how to use Zoom! Now I have coffee with my friends
                every week."
              </p>
              <p className="font-semibold">— Margaret, 82</p>
            </Card>
            <Card className="p-6 bg-white/10 border-white/20 text-white">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="mb-4 opacity-90">
                "My daughter set this up for me. Now I don't have to call her at work
                for every little thing."
              </p>
              <p className="font-semibold">— Robert, 76</p>
            </Card>
            <Card className="p-6 bg-white/10 border-white/20 text-white">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="mb-4 opacity-90">
                "Our residents love it. They're more independent and staff spends less
                time on tech support."
              </p>
              <p className="font-semibold">— Sarah, Activities Director</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Affordable Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works for you
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* B2B Plan */}
            <Card className="p-8 border-2 border-blue-200 dark:border-blue-800">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">For Senior Living Facilities</h3>
                <p className="text-muted-foreground">Provide LetsHelp as a resident amenity</p>
              </div>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold">$15</div>
                <div className="text-muted-foreground">per resident per month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Unlimited sessions for all residents</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Admin dashboard with analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Resident management tools</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Billing & usage reports</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Volume discounts available</span>
                </li>
              </ul>
              <Button className="w-full" size="lg" asChild>
                <Link href="/auth/signin?plan=facility">
                  Contact Sales
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </Card>

            {/* B2C Plan */}
            <Card className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">For Individuals & Families</h3>
                <p className="text-muted-foreground">Peace of mind for you and your parents</p>
              </div>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold">$20</div>
                <div className="text-muted-foreground">per month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Unlimited tech support sessions</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>24/7 availability</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Screen sharing & voice guidance</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Human volunteer backup</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <Button className="w-full" size="lg" variant="outline" asChild>
                <Link href="/auth/signin?plan=individual">
                  Start Free Trial
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </Card>
          </div>

          {/* Cost Comparison */}
          <div className="mt-16 text-center">
            <p className="text-lg text-muted-foreground">
              Compare to <strong className="text-red-600">$100-125/hour</strong> for
              traditional tech support services
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
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
              <Card key={i} className="p-6">
                <h3 className="text-lg font-bold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Help?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Start your free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6" asChild>
              <a href="#pricing">View Pricing</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">LetsHelp</span>
              </div>
              <p className="text-sm">
                Patient, on-demand tech support for seniors.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/senior" className="hover:text-white transition-colors">Seniors</a></li>
                <li><a href="/facility" className="hover:text-white transition-colors">Facilities</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/accessibility" className="hover:text-white transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2025 LetsHelp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
