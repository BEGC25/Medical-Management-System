import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Save, DollarSign, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertBillingSettingsSchema, type InsertBillingSettings } from "@shared/schema";

export default function BillingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billingSettings, isLoading } = useQuery({
    queryKey: ["/api/billing/settings"],
  });

  const form = useForm<InsertBillingSettings>({
    resolver: zodResolver(insertBillingSettingsSchema),
    defaultValues: {
      consultationFee: billingSettings?.consultationFee || 2000.00,
      requirePrepayment: billingSettings?.requirePrepayment || false,
      allowEmergencyGrace: billingSettings?.allowEmergencyGrace || true,
      currency: billingSettings?.currency || "SSP",
      updatedBy: "admin", // In a real app, this would come from auth
    },
  });

  // Update form when data loads
  useState(() => {
    if (billingSettings) {
      form.reset({
        consultationFee: billingSettings.consultationFee,
        requirePrepayment: billingSettings.requirePrepayment,
        allowEmergencyGrace: billingSettings.allowEmergencyGrace,
        currency: billingSettings.currency,
        updatedBy: "admin",
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: InsertBillingSettings) => {
      const response = await fetch("/api/billing/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update billing settings");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/settings"] });
      toast({
        title: "Settings Updated",
        description: "Billing settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBillingSettings) => {
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
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Billing Settings</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Consultation Fee Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="consultationFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultation Fee</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2000.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                        <Badge variant="secondary">{form.watch("currency")}</Badge>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Standard consultation fee charged to all patients
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      Currency code (e.g., SSP, USD, EUR)
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
                        checked={field.value}
                        onCheckedChange={field.onChange}
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-orange-50">
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
                          checked={field.value}
                          onCheckedChange={field.onChange}
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