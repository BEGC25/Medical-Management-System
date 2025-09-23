import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Save, X, Printer, Filter, Calendar, Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { insertPatientSchema, type InsertPatient, type Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

export default function Patients() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [viewMode, setViewMode] = useState<'today' | 'date' | 'search'>('today'); // Default to today's patients
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Format today's date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      age: "",
      gender: undefined,
      phoneNumber: "",
      village: "",
      emergencyContact: "",
      allergies: "",
      medicalHistory: "",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient registered successfully",
      });
      form.reset();
      setShowRegistrationForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      // Save to offline storage if network error
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'patient',
          action: 'create',
          data: form.getValues(),
        });
        toast({
          title: "Saved Offline",
          description: "Patient data saved locally. Will sync when online.",
        });
        form.reset();
        setShowRegistrationForm(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to register patient",
          variant: "destructive",
        });
      }
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ patientId, data }: { patientId: string; data: Partial<InsertPatient> }) => {
      const response = await apiRequest("PUT", `/api/patients/${patientId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      form.reset();
      setEditingPatient(null);
      setShowRegistrationForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPatient) => {
    if (editingPatient) {
      updatePatientMutation.mutate({ patientId: editingPatient.patientId, data });
    } else {
      createPatientMutation.mutate(data);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    form.reset({
      firstName: patient.firstName,
      lastName: patient.lastName,
      age: patient.age || "",
      gender: patient.gender,
      phoneNumber: patient.phoneNumber || "",
      village: patient.village || "",
      emergencyContact: patient.emergencyContact || "",
      allergies: patient.allergies || "",
      medicalHistory: patient.medicalHistory || "",
    });
    setShowRegistrationForm(true);
  };

  const handleViewPatient = (patient: Patient) => {
    toast({
      title: "Patient Details",
      description: `${patient.firstName} ${patient.lastName} (${patient.patientId})`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelEdit = () => {
    setEditingPatient(null);
    setShowRegistrationForm(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-medical-blue" />
              <span>Patient Management</span>
              {viewMode === 'today' && (
                <Badge className="bg-green-600 text-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  Today's Patients
                </Badge>
              )}
              {viewMode === 'date' && !isToday(selectedDate) && (
                <Badge className="bg-blue-600 text-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(selectedDate)}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowRegistrationForm(true)}
                className="bg-health-green hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* View Mode Navigation */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'today' ? 'default' : 'outline'}
                  onClick={() => setViewMode('today')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Today's Patients
                </Button>
                <Button
                  variant={viewMode === 'date' ? 'default' : 'outline'}
                  onClick={() => setViewMode('date')}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Specific Date
                </Button>
                <Button
                  variant={viewMode === 'search' ? 'default' : 'outline'}
                  onClick={() => setViewMode('search')}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search Patients
                </Button>
              </div>
              
              {/* Date picker for specific date view */}
              {viewMode === 'date' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Date:
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              )}
            </div>
          </div>

          <PatientSearch 
            onEditPatient={handleEditPatient}
            onViewPatient={handleViewPatient}
            viewMode={viewMode}
            selectedDate={selectedDate}
          />
        </CardContent>
      </Card>

      {/* Registration/Edit Form */}
      {showRegistrationForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingPatient ? `Edit Patient: ${editingPatient.firstName} ${editingPatient.lastName}` : "New Patient Registration"}
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="e.g., 25 years, 6 months" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Village/Area</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Name and phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4 border-b pb-2 dark:text-gray-200">
                    Medical Information
                  </h4>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Known Allergies</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List any known allergies..."
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="medicalHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical History</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Previous medical conditions, surgeries, etc..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button 
                    type="submit" 
                    disabled={createPatientMutation.isPending || updatePatientMutation.isPending}
                    className="bg-medical-blue hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPatient ? (
                      updatePatientMutation.isPending ? "Updating..." : "Update Patient"
                    ) : (
                      createPatientMutation.isPending ? "Registering..." : "Register Patient"
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handlePrint}
                    className="ml-auto"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Form
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
