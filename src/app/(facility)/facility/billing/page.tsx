/**
 * Facility Billing Page
 *
 * Shows billing information, invoice history, and subscription management.
 */

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFacilityBilling } from "@/lib/actions/facility";
import { auth } from "@/lib/auth";

export default async function FacilityBillingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const billing = await getFacilityBilling();

  if (!billing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md p-8">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </Card>
      </div>
    );
  }

  const { facility, billing: billingInfo } = billing;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/facility"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Billing & Payments</h1>
          <div className="w-32" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Subscription Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Subscription</h2>
              <p className="text-muted-foreground">
                {facility.name}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-full font-medium ${
                facility.subscriptionStatus === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {facility.subscriptionStatus}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan</p>
              <p className="text-lg font-semibold capitalize">
                {facility.subscriptionPlan}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cost per Resident</p>
              <p className="text-lg font-semibold">
                ${(billingInfo.pricePerResident / 100).toFixed(2)}/month
              </p>
            </div>
          </div>
        </Card>

        {/* Current Billing */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Current Billing</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Active Residents</p>
                  <p className="text-sm text-muted-foreground">
                    {billingInfo.residentCount} resident{billingInfo.residentCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <p className="font-semibold">{billingInfo.residentCount}</p>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Monthly Amount</p>
                <p className="text-sm text-muted-foreground">
                  ${billingInfo.pricePerResident / 100} per resident
                </p>
              </div>
              <p className="font-semibold text-lg">
                ${(billingInfo.monthlyAmount / 100).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center justify-between py-3 bg-blue-50 dark:bg-blue-900/20 -mx-6 px-6">
              <div>
                <p className="font-medium">Annual (Save 17%)</p>
                <p className="text-sm text-muted-foreground">
                  2 months free with annual billing
                </p>
              </div>
              <p className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                ${(billingInfo.annualAmount / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Payment Method</h3>
            <Button variant="outline" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Update
            </Button>
          </div>
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {facility.stripeCustomerId ? "Card on file" : "No payment method"}
              </p>
              <p className="text-sm text-muted-foreground">
                {facility.stripeCustomerId
                  ? "Managed securely via Stripe"
                  : "Add a payment method to activate your subscription"}
              </p>
            </div>
          </div>
        </Card>

        {/* Invoice History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Invoice History</h3>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No invoices yet</p>
            <p className="text-sm">Invoices will appear here after your first billing cycle</p>
          </div>
        </Card>

        {/* Billing Support */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Need to adjust your plan?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Contact us to change your resident count or switch between monthly and
                annual billing.
              </p>
              <Button size="sm" variant="outline">
                Contact Support
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
