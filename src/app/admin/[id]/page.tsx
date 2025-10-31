"use client";

/**
 * Admin Detail View
 *
 * Displays detailed information for a single permit application
 * Currently using mock data - will connect to real database when Vercel is ready
 */

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type ApplicationRecord, formatPhoneNumber } from "@/lib/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    try {
      const response = await fetch("/api/auth/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setPasswordError(data.error || "Incorrect password. Please try again.");
      }
    } catch {
      setPasswordError("Authentication failed. Please try again.");
    }
  };

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/applications/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Application not found");
        } else {
          setError("Failed to load application");
        }
        return;
      }

      const data = await response.json();
      if (data.success && data.application) {
        setApplication(data.application);
      }
    } catch (err) {
      console.error("Error fetching application:", err);
      setError("Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if password protection is enabled via environment variable
  const passwordEnabled = process.env.NEXT_PUBLIC_REQUIRE_PASSWORD === "true";

  // Show password prompt if password protection is enabled and not authenticated
  if (passwordEnabled && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Access Required
              </h1>
              <p className="text-gray-600">
                Please enter the password to access the admin dashboard
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
              </div>

              {passwordError && (
                <div className="text-red-600 text-sm">{passwordError}</div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Access Dashboard
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
              <p className="text-gray-500 mb-6">
                The application you&apos;re looking for could not be found or loaded.
              </p>
              <Link href="/admin">
                <Button>← Back to Applications</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Applications
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {application.establishmentName}
              </h1>
              <p className="text-gray-600 mt-1">Permit Application Details</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Tracking ID</div>
              <div className="font-mono text-lg font-bold text-blue-600">
                {application.trackingId}
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              application.submissionChannel === "web"
                ? "bg-green-100 text-green-800"
                : application.submissionChannel === "voice_mobile"
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Submitted via {application.submissionChannel}
          </span>
        </div>

        {/* Establishment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Establishment Information</CardTitle>
            <CardDescription>Details about the food establishment</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Establishment Name</label>
              <p className="mt-1 text-gray-900">{application.establishmentName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <p className="mt-1 text-gray-900">{application.establishmentType}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1 text-gray-900">{application.streetAddress}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-gray-900">
                {formatPhoneNumber(application.establishmentPhone)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{application.establishmentEmail}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Planned Opening Date</label>
              <p className="mt-1 text-gray-900">
                {new Date(application.plannedOpeningDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
            <CardDescription>Contact details for the establishment owner</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Owner Name</label>
              <p className="mt-1 text-gray-900">{application.ownerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-gray-900">
                {formatPhoneNumber(application.ownerPhone)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{application.ownerEmail}</p>
            </div>
          </CardContent>
        </Card>

        {/* Submission Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Information</CardTitle>
            <CardDescription>When and how this application was submitted</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Submitted At</label>
              <p className="mt-1 text-gray-900">
                {application.submittedAt ? formatDate(application.submittedAt) : "Not submitted"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created At</label>
              <p className="mt-1 text-gray-900">{formatDate(application.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Submission Channel</label>
              <p className="mt-1 text-gray-900 capitalize">
                {application.submissionChannel.replace("_", " + ")}
              </p>
            </div>
            {application.sessionId && (
              <div>
                <label className="text-sm font-medium text-gray-700">Session ID</label>
                <p className="mt-1 text-gray-900 font-mono text-sm">
                  {application.sessionId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Button onClick={() => router.push("/admin")} variant="outline">
            ← Back to List
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="ml-auto"
          >
            🖨️ Print
          </Button>
        </div>

      </div>
    </div>
  );
}
