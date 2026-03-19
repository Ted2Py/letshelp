'use client';

import { Building2, Bell, Users, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createFacility,
  updateNotificationPreferences,
  inviteResidents,
  completeOnboarding,
} from '@/lib/actions/onboarding';

type Step = 'facility' | 'notifications' | 'residents' | 'complete';

interface ResidentInput {
  name: string;
  email: string;
  phone: string;
}

export function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('facility');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Facility data
  const [facilityName, setFacilityName] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [facilityPhone, setFacilityPhone] = useState('');

  // Step 2: Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    sessionCompleted: 'daily' as const,
    sessionSummary: 'daily' as const,
    handoffRequest: 'immediate' as const,
    residentAlert: 'daily' as const,
    weeklyReport: true,
    dailyReportTime: '18:00',
  });

  // Step 3: Residents
  const [residents, setResidents] = useState<ResidentInput[]>([
    { name: '', email: '', phone: '' },
  ]);
  const [createdResidents, setCreatedResidents] = useState<
    Array<{ name: string; email: string; code: string }>
  >([]);

  const steps = [
    { id: 'facility', title: 'Facility', icon: Building2 },
    { id: 'notifications', title: 'Notifications', icon: Bell },
    { id: 'residents', title: 'Residents', icon: Users },
    { id: 'complete', title: 'Complete', icon: Check },
  ] as const;

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = async () => {
    setError(null);
    setLoading(true);

    try {
      if (currentStep === 'facility') {
        // Validate and create facility
        if (!facilityName.trim()) {
          setError('Please enter a facility name');
          setLoading(false);
          return;
        }

        const result = await createFacility({
          name: facilityName,
          ...(facilityAddress && { address: facilityAddress }),
          ...(facilityPhone && { contactPhone: facilityPhone }),
        });

        if (!result.success) {
          setError(result.error || 'Failed to create facility');
          setLoading(false);
          return;
        }

        setCurrentStep('notifications');
      } else if (currentStep === 'notifications') {
        // Update notification preferences
        const result = await updateNotificationPreferences(notificationPrefs);

        if (!result.success) {
          setError(result.error || 'Failed to update preferences');
          setLoading(false);
          return;
        }

        setCurrentStep('residents');
      } else if (currentStep === 'residents') {
        // Invite residents (filter out empty ones)
        const validResidents = residents.filter((r) => r.name.trim() && r.email.trim());

        if (validResidents.length === 0) {
          // No residents to add, skip to complete
          await completeOnboarding();
          setCurrentStep('complete');
          setLoading(false);
          return;
        }

        const result = await inviteResidents({
          residents: validResidents.map((r) => ({
            name: r.name,
            email: r.email,
            ...(r.phone && { phone: r.phone }),
          })),
        });

        if (!result.success) {
          setError(result.error || 'Failed to invite residents');
          setLoading(false);
          return;
        }

        setCreatedResidents(result.residents || []);
        await completeOnboarding();
        setCurrentStep('complete');
      } else if (currentStep === 'complete') {
        // Redirect to facility dashboard
        router.push('/facility');
        return;
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleBack = () => {
    if (currentStep === 'notifications') {
      setCurrentStep('facility');
    } else if (currentStep === 'residents') {
      setCurrentStep('notifications');
    }
  };

  const addResident = () => {
    setResidents([...residents, { name: '', email: '', phone: '' }]);
  };

  const removeResident = (index: number) => {
    setResidents(residents.filter((_, i) => i !== index));
  };

  const updateResident = (index: number, field: keyof ResidentInput, value: string) => {
    const updated = [...residents];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
    }
    setResidents(updated);
  };

  return (
    <Card className="shadow-xl">
      {/* Progress Steps */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : isCurrent
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800'
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-8 transition-colors ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Facility Info */}
        {currentStep === 'facility' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tell us about your facility
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We'll use this information to customize your experience.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="facility-name">Facility Name *</Label>
                <Input
                  id="facility-name"
                  placeholder="Sunrise Senior Living"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="facility-address">Address</Label>
                <Input
                  id="facility-address"
                  placeholder="123 Main St, City, State 12345"
                  value={facilityAddress}
                  onChange={(e) => setFacilityAddress(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="facility-phone">Contact Phone</Label>
                <Input
                  id="facility-phone"
                  placeholder="(555) 123-4567"
                  value={facilityPhone}
                  onChange={(e) => setFacilityPhone(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Notification Preferences */}
        {currentStep === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                How should we notify you?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose when you'd like to receive updates about your residents.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Session Completed</Label>
                <select
                  value={notificationPrefs.sessionCompleted}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      sessionCompleted: e.target.value as any,
                    })
                  }
                  className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="immediate">Immediately</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                  <option value="none">Don't notify me</option>
                </select>
              </div>

              <div>
                <Label>Session Summaries</Label>
                <select
                  value={notificationPrefs.sessionSummary}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      sessionSummary: e.target.value as any,
                    })
                  }
                  className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="immediate">Immediately</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                  <option value="none">Don't notify me</option>
                </select>
              </div>

              <div>
                <Label>Resident Alerts (Help Requests, Issues)</Label>
                <select
                  value={notificationPrefs.residentAlert}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      residentAlert: e.target.value as any,
                    })
                  }
                  className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                >
                  <option value="immediate">Immediately</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                  <option value="none">Don't notify me</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="weekly-report"
                  checked={notificationPrefs.weeklyReport}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      weeklyReport: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="weekly-report" className="cursor-pointer">
                  Receive weekly activity report every Sunday
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Invite Residents */}
        {currentStep === 'residents' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add your residents
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter resident information. We'll create access codes for each person.
              </p>
            </div>

            <div className="space-y-4">
              {residents.map((resident, index) => (
                <div key={index} className="rounded-lg border p-4 dark:border-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Resident {index + 1}
                    </span>
                    {residents.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResident(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label htmlFor={`resident-${index}-name`} className="sr-only">
                        Name
                      </Label>
                      <Input
                        id={`resident-${index}-name`}
                        placeholder="Full name *"
                        value={resident.name}
                        onChange={(e) => updateResident(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`resident-${index}-email`} className="sr-only">
                        Email
                      </Label>
                      <Input
                        id={`resident-${index}-email`}
                        type="email"
                        placeholder="Email address *"
                        value={resident.email}
                        onChange={(e) => updateResident(index, 'email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`resident-${index}-phone`} className="sr-only">
                        Phone
                      </Label>
                      <Input
                        id={`resident-${index}-phone`}
                        type="tel"
                        placeholder="Phone (optional)"
                        value={resident.phone}
                        onChange={(e) => updateResident(index, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addResident}
                className="w-full"
              >
                + Add Another Resident
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                You're all set!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your facility is ready to use LetsHelp.
              </p>
            </div>

            {createdResidents.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-left dark:border-blue-800 dark:bg-blue-900/20">
                <h3 className="mb-4 font-semibold text-blue-900 dark:text-blue-100">
                  Access Codes for Your Residents
                </h3>
                <p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
                  Share these codes with your residents. They'll use them to log in for the first
                  time.
                </p>
                <div className="space-y-3">
                  {createdResidents.map((resident, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border border-blue-200 bg-white p-3 dark:border-blue-700 dark:bg-gray-800"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {resident.name}
                        </p>
                        <p className="text-sm text-gray-500">{resident.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Access Code</p>
                        <p className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400">
                          {resident.code}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-blue-600 dark:text-blue-400">
                  💡 Save these codes safely. Residents will enter them on their first login.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 p-4 text-left dark:border-gray-700">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">What's Next?</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Share access codes with your residents</li>
                <li>✓ Residents will set their password on first login</li>
                <li>✓ You'll receive notifications based on your preferences</li>
                <li>✓ View analytics and activity from your dashboard</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 'complete' && (
          <div className="mt-8 flex items-center justify-between border-t pt-6 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'facility' || loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button type="button" onClick={handleNext} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {currentStep === 'residents' ? 'Complete Setup' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
