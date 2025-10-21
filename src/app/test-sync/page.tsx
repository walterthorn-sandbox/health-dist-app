"use client";

/**
 * Test Sync Page
 *
 * Development tool to test real-time sync functionality.
 * Simulates voice updates being broadcast via Ably.
 *
 * Usage:
 * 1. Create a new session (or use existing session ID)
 * 2. Open mobile session page in another tab/device
 * 3. Use this page to send field updates
 * 4. Watch mobile page update in real-time
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FieldName =
  | "establishmentName"
  | "streetAddress"
  | "establishmentPhone"
  | "establishmentEmail"
  | "ownerName"
  | "ownerPhone"
  | "ownerEmail"
  | "establishmentType"
  | "plannedOpeningDate";

const FIELD_OPTIONS: { value: FieldName; label: string }[] = [
  { value: "establishmentName", label: "Establishment Name" },
  { value: "streetAddress", label: "Street Address" },
  { value: "establishmentPhone", label: "Establishment Phone" },
  { value: "establishmentEmail", label: "Establishment Email" },
  { value: "ownerName", label: "Owner Name" },
  { value: "ownerPhone", label: "Owner Phone" },
  { value: "ownerEmail", label: "Owner Email" },
  { value: "establishmentType", label: "Establishment Type" },
  { value: "plannedOpeningDate", label: "Planned Opening Date" },
];

export default function TestSyncPage() {
  const [sessionId, setSessionId] = useState("");
  const [createdSessionId, setCreatedSessionId] = useState("");
  const [selectedField, setSelectedField] = useState<FieldName | "">("");
  const [fieldValue, setFieldValue] = useState("");
  const [trackingId, setTrackingId] = useState("");

  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create a new session
  const handleCreateSession = async () => {
    try {
      setIsCreatingSession(true);
      setMessage(null);

      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      const newSessionId = data.session.id;
      setCreatedSessionId(newSessionId);
      setSessionId(newSessionId);
      setMessage({
        type: "success",
        text: `Session created! ID: ${newSessionId}`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create session",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Send field update
  const handleSendUpdate = async () => {
    if (!sessionId || !selectedField || !fieldValue) {
      setMessage({
        type: "error",
        text: "Please fill in all fields",
      });
      return;
    }

    try {
      setIsSendingUpdate(true);
      setMessage(null);

      const response = await fetch(`/api/session/${sessionId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: selectedField,
          value: fieldValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send update");
      }

      setMessage({
        type: "success",
        text: `Update sent: ${selectedField} = "${fieldValue}"`,
      });

      // Clear field value for next update
      setFieldValue("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send update",
      });
    } finally {
      setIsSendingUpdate(false);
    }
  };

  // Complete session
  const handleCompleteSession = async () => {
    if (!sessionId || !trackingId) {
      setMessage({
        type: "error",
        text: "Please fill in session ID and tracking ID",
      });
      return;
    }

    try {
      setIsCompletingSession(true);
      setMessage(null);

      // For now, we'll just send a dummy application completion
      // In real usage, this would be called by the voice service
      const response = await fetch(`/api/session/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishmentName: "Test Establishment",
          streetAddress: "123 Test St",
          establishmentPhone: "5095551234",
          establishmentEmail: "test@example.com",
          ownerName: "Test Owner",
          ownerPhone: "5095555678",
          ownerEmail: "owner@example.com",
          establishmentType: "Restaurant",
          plannedOpeningDate: "2025-12-01",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete session");
      }

      const data = await response.json();
      setMessage({
        type: "success",
        text: `Session completed! Tracking ID: ${data.trackingId}`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to complete session",
      });
    } finally {
      setIsCompletingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real-Time Sync Tester
          </h1>
          <p className="text-gray-600">
            Simulate voice updates to test Ably real-time synchronization
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <Card className={`mb-6 ${message.type === "success" ? "border-green-500" : "border-red-500"}`}>
            <CardContent className="pt-6">
              <p className={`${message.type === "success" ? "text-green-700" : "text-red-700"}`}>
                {message.text}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Session Creation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 1: Create Session</CardTitle>
            <CardDescription>
              Create a new session for testing, or use an existing session ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCreateSession}
              disabled={isCreatingSession}
              className="w-full"
            >
              {isCreatingSession ? "Creating..." : "Create New Session"}
            </Button>

            {createdSessionId && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Session Created! Open this link in another tab:
                </p>
                <a
                  href={`/session/${createdSessionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {typeof window !== "undefined" && `${window.location.origin}/session/${createdSessionId}`}
                </a>
              </div>
            )}

            <div className="pt-4 border-t">
              <Label htmlFor="sessionId">Or use existing Session ID:</Label>
              <Input
                id="sessionId"
                type="text"
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Send Field Updates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 2: Send Field Updates</CardTitle>
            <CardDescription>
              Simulate voice updates by sending field values via Ably
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="field">Field</Label>
              <Select
                value={selectedField}
                onValueChange={(value) => setSelectedField(value as FieldName)}
              >
                <SelectTrigger id="field" className="mt-2">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="text"
                placeholder="Enter field value"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendUpdate();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleSendUpdate}
              disabled={isSendingUpdate || !sessionId || !selectedField || !fieldValue}
              className="w-full"
            >
              {isSendingUpdate ? "Sending..." : "Send Update"}
            </Button>
          </CardContent>
        </Card>

        {/* Complete Session */}
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Complete Session</CardTitle>
            <CardDescription>
              Mark the session as complete to show success screen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trackingId">Tracking ID (optional - will be auto-generated)</Label>
              <Input
                id="trackingId"
                type="text"
                placeholder="Leave empty to auto-generate"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button
              onClick={handleCompleteSession}
              disabled={isCompletingSession || !sessionId}
              className="w-full"
              variant="outline"
            >
              {isCompletingSession ? "Completing..." : "Complete Session"}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Test Data */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Test Data</CardTitle>
            <CardDescription>
              Example values you can use for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Establishment Name:</strong> Joe&apos;s Pizza</div>
              <div><strong>Street Address:</strong> 123 Main Street, Wenatchee, WA 98801</div>
              <div><strong>Establishment Phone:</strong> 5095551234</div>
              <div><strong>Establishment Email:</strong> joe@joespizza.com</div>
              <div><strong>Owner Name:</strong> Joe Smith</div>
              <div><strong>Owner Phone:</strong> 5095555678</div>
              <div><strong>Owner Email:</strong> joesmith@gmail.com</div>
              <div><strong>Establishment Type:</strong> Restaurant</div>
              <div><strong>Planned Opening Date:</strong> 2025-12-01</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
