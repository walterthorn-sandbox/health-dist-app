"use client";

/**
 * Apply Page
 *
 * Public-facing page for submitting food establishment permit applications
 * This is the basic web form submission (without voice)
 */

import { PermitForm } from "@/components/forms/PermitForm";
import type { ApplicationFormData } from "@/lib/schema";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplyPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const handleSubmit = async (data: ApplicationFormData) => {
    console.log("Submitting form data:", data);

    // Call the real API endpoint (using mock data for now)
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit application");
    }

    const result = await response.json();
    setTrackingId(result.trackingId);
  };

  const handleVoiceStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoiceError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/voice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start voice session");
      }

      // Redirect to the session page
      router.push(`/session/${data.sessionId}`);
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  if (trackingId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              Your food establishment permit application has been received.
            </p>

            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Tracking ID</p>
              <p className="text-2xl font-mono font-bold text-slate-900">
                {trackingId}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Save this ID to check your application status
              </p>
            </div>

            <div className="space-y-3 text-left bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900">Next Steps:</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>A health district staff member will review your application</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>You will be contacted if additional information is needed</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>An inspection will be scheduled before your opening date</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setTrackingId(null);
                }}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Submit Another Application
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Food Establishment Permit Application
          </h1>
          <p className="text-lg text-gray-600">
            Apply for a new food establishment permit with Riverside County Health District
          </p>
          <p className="text-sm text-gray-500 mt-2">
            All fields marked with * are required
          </p>
        </div>

        {/* Alternative Options */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-purple-900 mb-2">
            Prefer to apply by phone?
          </h3>
          <p className="text-sm text-purple-800 mb-4">
            Complete this application over the phone while watching it fill out
            in real-time on your mobile device.
          </p>
          <form onSubmit={handleVoiceStart} className="space-y-3">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-purple-900 mb-2">
                Enter your phone number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(509) 555-1234"
                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                maxLength={14}
              />
              {voiceError && (
                <p className="mt-2 text-sm text-red-600">{voiceError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || phoneNumber.replace(/\D/g, "").length !== 10}
              className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Starting..." : "Start Voice Application →"}
            </button>
            <p className="text-xs text-purple-700">
              We&apos;ll text you a link and phone number to call
            </p>
          </form>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <PermitForm onSubmit={handleSubmit} />
        </div>

        {/* Footer Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Need help? Contact the Riverside County Health District at{" "}
            <a href="tel:+15095551234" className="text-blue-600 hover:underline">
              (509) 555-1234
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
