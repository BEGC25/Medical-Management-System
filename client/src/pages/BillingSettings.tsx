import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Save, Shield, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertBillingSettingsSchema, type InsertBillingSettings, type BillingSettings } from "@shared/schema";

export default function BillingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billingSettings, isLoading } = useQuery<BillingSettings>({
    queryKey: ["/api/billing/settings"],
  });

  const form = useForm<InsertBillingSettings>({
    resolver: zodResolver(insertBillingSettingsSchema),
    defaultValues: {
      consultationFee: 0, // No longer used, kept for backward compatibility
      requirePrepayment: billingSettings?.requirePrepayment || 0,
      allowEmergencyGrace: billingSettings?.allowEmergencyGrace || 1,
      currency: billingSettings?.currency || "SSP",
      updatedBy: "admin", // In a real app, this would come from auth
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (billingSettings) {
      form.reset({
        consultationFee: 0, // No longer used, kept for backward compatibility
        requirePrepayment: billingSettings.requirePrepayment,
        allowEmergencyGrace: billingSettings.allowEmergencyGrace,
        currency: billingSettings.currency,
        updatedBy: "admin",
      });
    }
  }, [billingSettings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: InsertBillingSettings) => {
      console.log("Sending PUT request with data:", data);
      const response = await fetch("/api/billing/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        let errorMessage = "Failed to update billing settings";
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Settings saved successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/billing/settings"] });
      toast({
        title: "Settings Updated",
        description: "Billing settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Save failed:", error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBillingSettings) => {
    console.log("Submitting billing settings:", data);
    updateSettingsMutation.mutate(data);
  };

  const requirePrepayment = form.watch("requirePrepayment");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Billing Settings</h1>
        </div>
        <div className="animate-pulse">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Payment Policy Settings</h1>
        </div>
        <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium">Service prices are now managed in Service Management</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              To update consultation fees and other service prices, go to the Service Management page in the Administration menu.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="SSP" maxLength={3} />
                    </FormControl>
                    <FormDescription>
                      Currency code used throughout the system (e.g., SSP, USD, EUR)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Payment Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="requirePrepayment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Prepayment
                      </FormLabel>
                      <FormDescription>
                        When enabled, patients must pay consultation fee at registration before seeing the doctor
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {requirePrepayment && (
                <FormField
                  control={form.control}
                  name="allowEmergencyGrace"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-orange-50 dark:bg-orange-950">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Allow Emergency Grace
                        </FormLabel>
                        <FormDescription>
                          Allow emergency patients to see the doctor before payment (payment required before discharge)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Last updated: {billingSettings ? new Date(billingSettings.updatedAt).toLocaleString() : 'Never'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Updated by: {billingSettings?.updatedBy || 'Unknown'}
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={updateSettingsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}