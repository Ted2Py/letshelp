'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Bell, Users, Check, ArrowRight, ArrowLeft, Loader2, MapPin, Phone } from 'lucide-react';
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

// Basic address validation - should have street, city, and zip
const ADDRESS_REGEX = /^.+\s+.+,\s+.+\s+\d{5}(-\d{4})?$/;

export function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('facility');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    { id: 'facility' as const, title: 'Facility', icon: Building2 },
    { id: 'notifications' as const, title: 'Notifications', icon: Bell },
    { id: 'residents' as const, title: 'Residents', icon: Users },
    { id: 'complete' as const, title: 'Complete', icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Format phone number as user types
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const validateFacilityStep = () => {
    const errors: Record<string, string> = {};

    if (!facilityName.trim()) {
      errors.name = 'Facility name is required';
    }

    if (!facilityAddress.trim()) {
      errors.address = 'Address is required';
    } else if (!ADDRESS_REGEX.test(facilityAddress.trim())) {
      errors.address = 'Please enter a complete address (e.g., "123 Main St, City, State 12345")';
    }

    if (!facilityPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const digitsOnly = facilityPhone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResident = (resident: ResidentInput) => {
    if (!resident.name.trim() && !resident.email.trim() && !resident.phone.trim()) {
      return null; // Empty row is valid (will be filtered out)
    }

    const errors: Record<string, string> = {};

    if (!resident.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!resident.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resident.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (resident.phone.trim()) {
      const digitsOnly = resident.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    return Object.keys(errors).length === 0 ? null : errors;
  };

  const handleNext = async () => {
    setError(null);
    setFieldErrors({});

    if (currentStep === 'facility') {
      if (!validateFacilityStep()) {
        return;
      }

      setLoading(true);
      try {
        const result = await createFacility({
          name: facilityName,
          address: facilityAddress,
          contactPhone: facilityPhone,
        });

        if (!result.success) {
          setError(result.error || 'Failed to create facility');
          setLoading(false);
          return;
        }

        setCurrentStep('notifications');
      } catch (err) {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
    } else if (currentStep === 'notifications') {
      setLoading(true);
      try {
        const result = await updateNotificationPreferences(notificationPrefs);

        if (!result.success) {
          setError(result.error || 'Failed to update preferences');
          setLoading(false);
          return;
        }

        setCurrentStep('residents');
      } catch (err) {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
    } else if (currentStep === 'residents') {
      // Validate all residents
      const residentErrors: Record<string, Record<string, string>> = {};
      let validCount = 0;

      residents.forEach((r, i) => {
        const errors = validateResident(r);
        if (errors) {
          residentErrors[i] = errors;
        } else if (r.name.trim() || r.email.trim()) {
          validCount++;
        }
      });

      if (Object.keys(residentErrors).length > 0) {
        setError('Please fix the errors before continuing');
        // Convert nested errors to flat structure for display
        const flatErrors: Record<string, string> = {};
        Object.entries(residentErrors).forEach(([idx, errs]) => {
          Object.entries(errs).forEach(([field, msg]) => {
            flatErrors[`resident-${idx}-${field}`] = msg;
          });
        });
        setFieldErrors(flatErrors);
        return;
      }

      setLoading(true);

      if (validCount === 0) {
        // No residents to add, skip to complete
        await completeOnboarding();
        setCurrentStep('complete');
        setLoading(false);
        return;
      }

      const validResidents = residents.filter((r) => r.name.trim() && r.email.trim());

      try {
        const result = await inviteResidents({
          residents: validResidents.map((r) => ({
            name: r.name,
            email: r.email,
            phone: r.phone,
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
      } catch (err) {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
    } else if (currentStep === 'complete') {
      router.push('/facility');
      return;
    }
  };

  const handleBack = () => {
    setError(null);
    setFieldErrors({});
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
    // Clear errors for this resident
    const newErrors = { ...fieldErrors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`resident-${index}-`)) {
        delete newErrors[key];
      }
    });
    setFieldErrors(newErrors);
  };

  const updateResident = (index: number, field: keyof ResidentInput, value: string) => {
    const updated = [...residents];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
    }
    setResidents(updated);

    // Clear error for this field
    const newErrors = { ...fieldErrors };
    delete newErrors[`resident-${index}-${field}`];
    setFieldErrors(Object.keys(newErrors).length > 0 ? newErrors : {});
  };

  const getFieldError = (field: string) => fieldErrors[field];

  return (
    <Card className="shadow-xl">
      {/* Progress Steps */}
      <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : isCurrent
                          ? 'border-blue-500 bg-blue-500 text-white scale-110'
                          : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800'
                    }`}
                  >
                    {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <span
                    className={`mt-2 text-sm font-semibold ${
                      isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-1 h-1 flex-1 max-w-16 rounded transition-colors ${
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
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Facility Info */}
        {currentStep === 'facility' && (
          <div className="space-y-8 max-w-xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Tell us about your facility
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This information helps us customize your experience.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="facility-name" className="text-base font-semibold">
                  Facility Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="facility-name"
                  placeholder="Sunrise Senior Living"
                  value={facilityName}
                  onChange={(e) => {
                    setFacilityName(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }}
                  className={`mt-2 h-12 text-lg ${getFieldError('name') ? 'border-red-500' : ''}`}
                />
                {getFieldError('name') && (
                  <p className="mt-1 text-sm text-red-500">{getFieldError('name')}</p>
                )}
              </div>

              <div>
                <Label htmlFor="facility-address" className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="facility-address"
                  placeholder="123 Main St, City, State 12345"
                  value={facilityAddress}
                  onChange={(e) => {
                    setFacilityAddress(e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.address;
                      return next;
                    });
                  }}
                  className={`mt-2 h-12 text-lg ${getFieldError('address') ? 'border-red-500' : ''}`}
                />
                {getFieldError('address') && (
                  <p className="mt-1 text-sm text-red-500">{getFieldError('address')}</p>
                )}
              </div>

              <div>
                <Label htmlFor="facility-phone" className="text-base font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="facility-phone"
                  placeholder="(555) 123-4567"
                  value={facilityPhone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setFacilityPhone(formatted);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.phone;
                      return next;
                    });
                  }}
                  className={`mt-2 h-12 text-lg ${getFieldError('phone') ? 'border-red-500' : ''}`}
                />
                {getFieldError('phone') && (
                  <p className="mt-1 text-sm text-red-500">{getFieldError('phone')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Notification Preferences */}
        {currentStep === 'notifications' && (
          <div className="space-y-8 max-w-xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Notification Preferences
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose when you'd like to receive updates.
              </p>
            </div>

            <div className="space-y-5">
              {[
                { key: 'sessionCompleted', label: 'Session Completed', desc: 'When a resident finishes a support session' },
                { key: 'sessionSummary', label: 'Session Summaries', desc: 'Detailed summaries of support sessions' },
                { key: 'handoffRequest', label: 'Handoff Requests', desc: 'When a resident needs human assistance' },
                { key: 'residentAlert', label: 'Resident Alerts', desc: 'Issues tagged for your attention' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-base font-semibold">{label}</Label>
                  <p className="text-sm text-gray-500">{desc}</p>
                  <select
                    value={notificationPrefs[key as keyof typeof notificationPrefs] as string}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        [key]: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border-gray-300 bg-white px-4 py-3 text-base dark:border-gray-600 dark:bg-gray-800 h-12"
                  >
                    <option value="immediate">Immediately</option>
                    <option value="daily">Daily digest</option>
                    <option value="weekly">Weekly digest</option>
                    <option value="none">Don't notify me</option>
                  </select>
                </div>
              ))}

              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
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
                  className="h-5 w-5 rounded border-gray-300"
                />
                <Label htmlFor="weekly-report" className="cursor-pointer text-base">
                  Receive weekly activity report every Sunday
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Invite Residents */}
        {currentStep === 'residents' && (
          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Add Your Residents
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter resident information. We'll create access codes for each person.
              </p>
            </div>

            <div className="space-y-4">
              {residents.map((resident, index) => (
                <div
                  key={index}
                  className={`rounded-xl border p-5 transition-all ${
                    getFieldError(`resident-${index}-name`) ||
                    getFieldError(`resident-${index}-email`) ||
                    getFieldError(`resident-${index}-phone`)
                      ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      Resident {index + 1}
                    </span>
                    {residents.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResident(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor={`resident-${index}-name`} className="sr-only">
                        Name
                      </Label>
                      <Input
                        id={`resident-${index}-name`}
                        placeholder="Full name *"
                        value={resident.name}
                        onChange={(e) => updateResident(index, 'name', e.target.value)}
                        className={getFieldError(`resident-${index}-name`) ? 'border-red-500' : ''}
                      />
                      {getFieldError(`resident-${index}-name`) && (
                        <p className="mt-1 text-sm text-red-500">{getFieldError(`resident-${index}-name`)}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`resident-${index}-email`} className="sr-only">
                        Email
                      </Label>
                      <Input
                        id={`resident-${index}-email`}
                        type="email"
                        placeholder="Email *"
                        value={resident.email}
                        onChange={(e) => updateResident(index, 'email', e.target.value)}
                        className={getFieldError(`resident-${index}-email`) ? 'border-red-500' : ''}
                      />
                      {getFieldError(`resident-${index}-email`) && (
                        <p className="mt-1 text-sm text-red-500">{getFieldError(`resident-${index}-email`)}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`resident-${index}-phone`} className="sr-only">
                        Phone
                      </Label>
                      <Input
                        id={`resident-${index}-phone`}
                        type="tel"
                        placeholder="Phone (555) 123-4567"
                        value={resident.phone}
                        onChange={(e) => updateResident(index, 'phone', formatPhone(e.target.value))}
                        className={getFieldError(`resident-${index}-phone`) ? 'border-red-500' : ''}
                      />
                      {getFieldError(`resident-${index}-phone`) && (
                        <p className="mt-1 text-sm text-red-500">{getFieldError(`resident-${index}-phone`)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addResident}
                className="w-full h-12 text-base border-dashed"
              >
                + Add Another Resident
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                You're All Set!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Your facility is ready to use LetsHelp.
              </p>
            </div>

            {createdResidents.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-left dark:border-blue-800 dark:bg-blue-900/20">
                <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Access Codes for Your Residents
                </h3>
                <p className="mb-4 text-sm text-blue-700 dark:text-blue-300">
                  Share these codes with your residents. They'll use them to log in for the first time.
                </p>
                <div className="space-y-3">
                  {createdResidents.map((resident, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-4 dark:border-blue-700 dark:bg-gray-800"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {resident.name}
                        </p>
                        <p className="text-sm text-gray-500">{resident.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Access Code</p>
                        <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                          {resident.code}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  💡 Save these codes safely. Residents will enter them on their first login.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 p-6 text-left dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">What's Next?</h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</span>
                  <span>Share access codes with your residents</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</span>
                  <span>Residents will set their password on first login</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</span>
                  <span>You'll receive notifications based on your preferences</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">✓</span>
                  <span>View analytics and activity from your dashboard</span>
                </li>
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
              className="h-12 px-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="h-12 px-8 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
