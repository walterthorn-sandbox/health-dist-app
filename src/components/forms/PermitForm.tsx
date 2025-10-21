"use client";

/**
 * PermitForm Component
 *
 * Reusable form component for food establishment permit applications
 * Features:
 * - Full type safety with Zod validation
 * - Mobile-responsive design
 * - Real-time field validation
 * - Clear error messages
 * - Loading and success states
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  applicationFormSchema,
  establishmentTypes,
  type ApplicationFormData,
} from "@/lib/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PermitFormProps {
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  defaultValues?: Partial<ApplicationFormData>;
  isReadOnly?: boolean;
  className?: string;
}

export function PermitForm({
  onSubmit,
  defaultValues,
  isReadOnly = false,
  className,
}: PermitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: defaultValues || {
      establishmentName: "",
      streetAddress: "",
      establishmentPhone: "",
      establishmentEmail: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      establishmentType: "Restaurant",
      plannedOpeningDate: "",
    },
  });

  const handleSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit(data);
      setSubmitSuccess(true);
      form.reset();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An error occurred while submitting the form"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Success Message */}
          {submitSuccess && (
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm font-medium text-green-800">
                ✓ Application submitted successfully!
              </p>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm font-medium text-red-800">Error: {submitError}</p>
            </div>
          )}

          {/* Establishment Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Establishment Information</CardTitle>
              <CardDescription>
                Tell us about your food establishment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="establishmentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Establishment Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Joe's Pizza"
                        {...field}
                        disabled={isReadOnly || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      The official name of your food establishment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Main Street, Wenatchee, WA 98801"
                        {...field}
                        disabled={isReadOnly || isSubmitting}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Complete address including city, state, and ZIP code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="establishmentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(509) 555-1234"
                          {...field}
                          disabled={isReadOnly || isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Establishment contact number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="establishmentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@example.com"
                          {...field}
                          disabled={isReadOnly || isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Establishment email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Owner Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Owner Information</CardTitle>
              <CardDescription>
                Information about the establishment owner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Smith"
                        {...field}
                        disabled={isReadOnly || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Full name of the establishment owner
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Phone *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(509) 555-5678"
                          {...field}
                          disabled={isReadOnly || isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Owner&apos;s contact number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="owner@example.com"
                          {...field}
                          disabled={isReadOnly || isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Owner&apos;s email address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Operating Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Information</CardTitle>
              <CardDescription>
                Details about your establishment&apos;s operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="establishmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Establishment Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isReadOnly || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {establishmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type of food establishment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plannedOpeningDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Opening Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isReadOnly || isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      When do you plan to open your establishment?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          {!isReadOnly && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="w-full md:w-auto"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
