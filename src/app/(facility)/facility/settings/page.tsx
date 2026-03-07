/**
 * Facility Settings Page
 *
 * Allows facility administrators to manage facility settings.
 */

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building,
  Users,
  CreditCard,
  Shield,
  Bell,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminFacility } from "@/lib/actions/facility";
import { auth } from "@/lib/auth";

export default async function FacilitySettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const facility = await getAdminFacility();

  if (!facility) {
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

  const settings = [
    {
      title: "Facility Information",
      description: "Update your facility name, address, and contact details",
      icon: Building,
      href: "/facility/settings/info",
      action: "Edit",
    },
    {
      title: "Resident Management",
      description: "Add, remove, and manage resident accounts",
      icon: Users,
      href: "/facility/residents",
      action: "Manage",
    },
    {
      title: "Billing & Subscription",
      description: "View invoices, update payment method, change plan",
      icon: CreditCard,
      href: "/facility/billing",
      action: "View",
    },
    {
      title: "Security Settings",
      description: "Manage authentication and access controls",
      icon: Shield,
      href: "/facility/settings/security",
      action: "Configure",
    },
    {
      title: "Notifications",
      description: "Configure email and alert preferences",
      icon: Bell,
      href: "/facility/settings/notifications",
      action: "Configure",
    },
  ];

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
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="w-32" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Facility Overview */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{facility.name}</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Subscription</p>
              <p className="font-medium capitalize">{facility.subscriptionPlan}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{facility.subscriptionStatus}</p>
            </div>
          </div>
        </Card>

        {/* Settings Categories */}
        <div className="space-y-3">
          {settings.map((setting) => {
            const Icon = setting.icon;
            return (
              <Card key={setting.href} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{setting.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={setting.href}>{setting.action}</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Danger Zone */}
        <Card className="p-6 mt-6 border-red-200 dark:border-red-900">
          <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Irreversible actions that affect your facility account.
          </p>
          <div className="flex gap-4">
            <Button variant="destructive" size="sm">
              Export All Data
            </Button>
            <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
              Close Account
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
