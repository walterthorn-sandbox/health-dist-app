"use client";

/**
 * Mobile Session Page
 *
 * Real-time form view that displays and updates as the user provides
 * information over the phone. Connected via Ably WebSocket.
 *
 * Flow:
 * 1. User calls in, Twilio creates session
 * 2. User receives SMS with link to this page: /session/[id]
 * 3. Page connects to Ably channel
 * 4. As OpenAI extracts info from voice, updates broadcast via Ably
 * 5. Form fields populate in real-time
 * 6. When complete, show success screen with tracking ID
 */

import { use, useEffect, useState } from "react";
import * as Ably from "ably";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type ApplicationFormData } from "@/lib/schema";
import { ABLY_EVENTS } from "@/lib/ably";

type SessionStatus = "connecting" | "waiting" | "active" | "complete" | "error";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);

  const [status, setStatus] = useState<SessionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState<Partial<ApplicationFormData>>({});

  // Count of filled fields for progress
  const totalFields = 9;
  const filledFields = Object.values(formData).filter(v => v && v !== "").length;

  // Initialize Ably client and subscribe to updates
  useEffect(() => {
    let client: Ably.Realtime | null = null;
    let channel: Ably.RealtimeChannel | null = null;

    async function initAbly() {
      try {
        // Get auth token from server
        const response = await fetch("/api/ably/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error("Failed to get Ably token");
        }

        const { tokenRequest, channelName } = await response.json();

        // Create Ably client with token
        client = new Ably.Realtime({
          authCallback: (data, callback) => {
            callback(null, tokenRequest);
          },
        });

        // Subscribe to channel
        channel = client.channels.get(channelName);

        // Listen for field updates
        channel.subscribe(ABLY_EVENTS.FIELD_UPDATE, (message: Ably.Message) => {
          console.log("Field update:", message.data);
          const { field, value } = message.data;
          console.log("Updating formData:", field, "=", value);
          setFormData(prev => {
            const updated = { ...prev, [field]: value };
            console.log("New formData:", updated);
            return updated;
          });
          // First field update means call has started
          console.log("Current status:", status);
          setStatus("active");
          console.log("Status set to active");
        });

        // Listen for session complete
        channel.subscribe(ABLY_EVENTS.SESSION_COMPLETE, (message: Ably.Message) => {
          console.log("Session complete:", message.data);
          const { trackingId } = message.data;
          setTrackingId(trackingId);
          setStatus("complete");
        });

        // Listen for session errors
        channel.subscribe(ABLY_EVENTS.SESSION_ERROR, (message: Ably.Message) => {
          console.log("Session error:", message.data);
          const { error } = message.data;
          setError(error);
          setStatus("error");
        });

        setStatus("waiting");
        console.log("Connected to Ably channel:", channelName);
      } catch (err) {
        console.error("Failed to initialize Ably:", err);
        setError("Failed to connect to real-time updates");
        setStatus("error");
      }
    }

    initAbly();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      if (client) {
        client.close();
      }
    };
  }, [sessionId]);

  // Format phone number for display
  const formatPhone = (phone?: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Format date for display
  const formatDate = (date?: string) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  // Handle manual field updates
  const handleFieldUpdate = (field: string, newValue: string) => {
    setFormData(prev => ({ ...prev, [field]: newValue }));
  };

  // Connecting state
  if (status === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
            <p className="text-gray-600">
              Setting up real-time connection for your application
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting for call state
  if (status === "waiting") {
    const twilioPhoneNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "(509) 555-1234";

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <CardTitle className="text-center text-2xl">Ready to Start!</CardTitle>
              <CardDescription className="text-center text-base">
                Your session is ready. Follow the steps below to complete your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Call this number
                    </h3>
                    <p className="text-3xl font-bold text-purple-600 mb-2">
                      {twilioPhoneNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      Use the same phone you&apos;re viewing this page on, or another device
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Speak your answers
                    </h3>
                    <p className="text-sm text-gray-600">
                      Our AI agent will ask you questions about your food establishment. Just speak naturally!
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Watch the magic happen
                    </h3>
                    <p className="text-sm text-gray-600">
                      This page will automatically update in real-time as you speak. Keep this page open!
                    </p>
                  </div>
                </div>

                {/* Live indicator */}
                <div className="flex items-center justify-center pt-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Page is ready and waiting for your call...</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
              <p className="text-gray-600 mb-4">{error || "Something went wrong"}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Complete state
  if (status === "complete" && trackingId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
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
              <CardTitle className="text-center">Application Submitted!</CardTitle>
              <CardDescription className="text-center">
                Your food permit application has been successfully submitted
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Your tracking ID:</p>
                <p className="text-2xl font-mono font-bold text-blue-600">{trackingId}</p>
              </div>
              <p className="text-gray-600">
                Please save this tracking ID for your records. You will receive updates about
                your application status via email.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active state - show form with real-time updates
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Food Permit Application
          </h1>
          <p className="text-gray-600">
            Continue speaking - your information will appear below in real-time
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-700">
                {filledFields} / {totalFields} fields
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(filledFields / totalFields) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <div className="flex items-center justify-center mb-6 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>Live - Connected to call</span>
          </div>
        </div>

        {/* Establishment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Establishment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="Establishment Name"
              value={formData.establishmentName}
              fieldName="establishmentName"
              sessionId={sessionId}
              onUpdate={handleFieldUpdate}
            />
            <FormField
              label="Street Address"
              value={formData.streetAddress}
              fieldName="streetAddress"
              sessionId={sessionId}
              onUpdate={handleFieldUpdate}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="Phone"
                value={formData.establishmentPhone}
                fieldName="establishmentPhone"
                sessionId={sessionId}
                onUpdate={handleFieldUpdate}
              />
              <FormField
                label="Email"
                value={formData.establishmentEmail}
                fieldName="establishmentEmail"
                sessionId={sessionId}
                onUpdate={handleFieldUpdate}
              />
            </div>
            <FormField
              label="Establishment Type"
              value={formData.establishmentType}
              fieldName="establishmentType"
              sessionId={sessionId}
              onUpdate={handleFieldUpdate}
            />
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="Owner Name"
              value={formData.ownerName}
              fieldName="ownerName"
              sessionId={sessionId}
              onUpdate={handleFieldUpdate}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="Phone"
                value={formData.ownerPhone}
                fieldName="ownerPhone"
                sessionId={sessionId}
                onUpdate={handleFieldUpdate}
              />
              <FormField
                label="Email"
                value={formData.ownerEmail}
                fieldName="ownerEmail"
                sessionId={sessionId}
                onUpdate={handleFieldUpdate}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operating Information */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              label="Planned Opening Date"
              value={formData.plannedOpeningDate}
              fieldName="plannedOpeningDate"
              sessionId={sessionId}
              onUpdate={handleFieldUpdate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Editable Form Field Component
 * Shows a field with animated appearance when value is filled
 * Allows editing with Edit/Save/Cancel buttons
 */
function FormField({
  label,
  value,
  fieldName,
  sessionId,
  onUpdate,
}: {
  label: string;
  value?: string;
  fieldName: string;
  sessionId: string;
  onUpdate: (field: string, newValue: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = !value || value === "";

  const handleEdit = () => {
    setEditValue(value || "");
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/session/${sessionId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: fieldName, value: editValue }),
      });

      const data = await response.json();

      if (data.success) {
        onUpdate(fieldName, data.value);
        setIsEditing(false);
        setEditValue("");
      } else {
        setError(data.error || "Failed to save");
      }
    } catch (err) {
      setError("Failed to save changes");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div
            className={`
              flex-1 px-3 py-2 border rounded-md min-h-[42px] flex items-center
              transition-all duration-300
              ${isEmpty
                ? "bg-gray-50 border-gray-200 text-gray-400"
                : "bg-white border-blue-300 text-gray-900 font-medium"
              }
            `}
          >
            {isEmpty ? (
              <span className="italic">Waiting for information...</span>
            ) : (
              <span className="animate-fadeIn">{value}</span>
            )}
          </div>
          {!isEmpty && (
            <button
              onClick={handleEdit}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
