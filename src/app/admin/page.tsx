"use client";

/**
 * Admin List View
 *
 * Displays all permit applications with filtering and search
 * Currently using API with mock data - will connect to real database when Vercel is ready
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { type ApplicationRecord } from "@/lib/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/applications");
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) =>
    app.establishmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Permit Applications
              </h1>
              <p className="text-gray-600 mt-1">
                Admin Dashboard - Food Establishment Permits
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{total}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {applications.filter((a) => a.submissionChannel === "web").length}
                </div>
                <div className="text-sm text-gray-600">Web Submissions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">
                  {applications.filter((a) => a.submissionChannel === "voice").length}
                </div>
                <div className="text-sm text-gray-600">Voice Submissions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {applications.filter((a) =>
                    new Date(a.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Today</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Search by establishment name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Button
              onClick={fetchApplications}
              variant="outline"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>
              Showing {filteredApplications.length} of {total} applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading applications...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {searchTerm
                    ? "No applications found matching your search"
                    : "No applications submitted yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Tracking ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Establishment
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Owner
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Submitted
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Channel
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr
                        key={app.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-medium text-blue-600">
                            {app.trackingId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {app.establishmentName}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {app.streetAddress}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900">{app.ownerName}</div>
                          <div className="text-sm text-gray-500">{app.ownerEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {app.establishmentType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {app.submittedAt ? formatDate(app.submittedAt) : "Pending"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              app.submissionChannel === "web"
                                ? "bg-green-100 text-green-800"
                                : app.submissionChannel === "voice"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {app.submissionChannel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/${app.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
