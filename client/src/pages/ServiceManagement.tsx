import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { type Service, type InsertService, insertServiceSchema } from "@shared/schema";
import { apiRequest, queryClient as globalQueryClient } from "@/lib/queryClient";
import { z } from "zod";

const serviceFormSchema = insertServiceSchema.extend({
  price: z.number().min(0, "Price must be 0 or greater"),
  isActive: z.union([z.number(), z.boolean()]).transform(val => typeof val === 'boolean' ? (val ? 1 : 0) : val),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

// Predefined service names by category
const PREDEFINED_SERVICES = {
  laboratory: [
    "Complete Blood Count (CBC)",
    "Blood Sugar (Glucose)",
    "Malaria Test (RDT)",
    "Malaria Microscopy",
    "Hemoglobin",
    "Urinalysis",
    "Urine Pregnancy Test",
    "Stool Analysis",
    "Stool for Ova and Parasites",
    "Blood Group & Rh",
    "HIV Test",
    "Hepatitis B Test",
    "Hepatitis C Test",
    "Syphilis (VDRL/RPR)",
    "Tuberculosis (TB) Test",
    "Widal Test (Typhoid)",
    "Liver Function Test (LFT)",
    "Kidney Function Test (RFT)",
    "Lipid Profile",
    "Electrolytes (Na, K, Cl)",
    "ESR (Erythrocyte Sedimentation Rate)",
    "Thyroid Function Test (TFT)",
    "Uric Acid",
    "Total Protein",
    "Albumin",
    "Bilirubin",
    "AST/ALT",
    "Creatinine",
    "Urea/BUN",
    "HbA1c (Diabetes)",
    "Culture & Sensitivity (Blood)",
    "Culture & Sensitivity (Urine)",
    "Culture & Sensitivity (Stool)",
  ],
  radiology: [
    "Chest X-Ray",
    "Abdomen X-Ray",
    "Pelvis X-Ray",
    "Skull X-Ray",
    "Spine X-Ray (Cervical)",
    "Spine X-Ray (Thoracic)",
    "Spine X-Ray (Lumbar)",
    "Hand X-Ray",
    "Foot X-Ray",
    "Shoulder X-Ray",
    "Hip X-Ray",
    "Knee X-Ray",
    "Ankle X-Ray",
    "Forearm X-Ray",
    "Elbow X-Ray",
  ],
  ultrasound: [
    "Obstetric Ultrasound (Early Pregnancy)",
    "Obstetric Ultrasound (Dating Scan)",
    "Obstetric Ultrasound (Anomaly Scan)",
    "Obstetric Ultrasound (Growth Scan)",
    "Abdominal Ultrasound",
    "Pelvic Ultrasound",
    "Renal Ultrasound (Kidneys)",
    "Hepatobiliary Ultrasound (Liver/Gallbladder)",
    "Cardiac Echo",
    "Thyroid Ultrasound",
    "Breast Ultrasound",
    "Scrotal Ultrasound",
    "Prostate Ultrasound",
    "Vascular Doppler",
  ],
  consultation: [
    "General Consultation",
    "Follow-up Visit",
    "Antenatal Care (ANC) Visit",
    "Postnatal Care (PNC) Visit",
    "Child Wellness Visit",
    "Immunization Visit",
    "Emergency Consultation",
    "Specialist Consultation",
  ],
  procedure: [
    "Wound Dressing",
    "Suturing (Small Wound)",
    "Suturing (Large Wound)",
    "Abscess Drainage",
    "Foreign Body Removal",
    "Minor Surgery",
    "Injection (IM/IV)",
    "IV Cannulation",
    "Catheterization",
    "Nasogastric Tube Insertion",
    "Ear Syringing",
  ],
  pharmacy: [],
};

export default function ServiceManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("laboratory");
  const [useCustomName, setUseCustomName] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "laboratory",
      description: "",
      price: 0,
      isActive: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      return await apiRequest("POST", "/api/services", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Service created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ServiceFormData> }) => {
      return await apiRequest("PUT", `/api/services/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: number }) => {
      return await apiRequest("PUT", `/api/services/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "Service status updated",
      });
    },
  });

  const handleSubmit = (data: ServiceFormData) => {
    // Convert empty strings to null for optional fields and ensure isActive is a number
    const formattedData = {
      ...data,
      code: data.code?.trim() || null,
      description: data.description?.trim() || null,
      isActive: data.isActive ? 1 : 0,
    };
    
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.reset({
      code: service.code || "",
      name: service.name,
      category: service.category,
      description: service.description || "",
      price: Number(service.price),
      isActive: service.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingService(null);
    setSelectedCategory("laboratory");
    setUseCustomName(false);
    form.reset({
      code: "",
      name: "",
      category: "laboratory",
      description: "",
      price: 0,
      isActive: 1,
    });
    setIsDialogOpen(true);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      laboratory: "bg-attention-orange",
      radiology: "bg-purple-600",
      ultrasound: "bg-blue-600",
      consultation: "bg-medical-blue",
      pharmacy: "bg-health-green",
      procedure: "bg-gray-600",
    };
    return colors[category] || "bg-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Service Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage pricing for all clinic services
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-medical-blue hover:bg-blue-700" data-testid="button-add-service">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add New Service"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Code (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., LAB001" data-testid="input-service-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategory(value);
                            // Reset service name when category changes (for new services only)
                            if (!editingService) {
                              form.setValue("name", "");
                              setUseCustomName(false);
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-service-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="laboratory">Laboratory</SelectItem>
                            <SelectItem value="radiology">X-Ray (Radiology)</SelectItem>
                            <SelectItem value="ultrasound">Ultrasound</SelectItem>
                            <SelectItem value="consultation">Consultation</SelectItem>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="procedure">Procedure</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      {!editingService && PREDEFINED_SERVICES[selectedCategory as keyof typeof PREDEFINED_SERVICES]?.length > 0 && !useCustomName ? (
                        <div className="space-y-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-service-name">
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {PREDEFINED_SERVICES[selectedCategory as keyof typeof PREDEFINED_SERVICES].map((serviceName) => (
                                <SelectItem key={serviceName} value={serviceName}>
                                  {serviceName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => {
                              setUseCustomName(true);
                              form.setValue("name", "");
                            }}
                            className="text-xs p-0 h-auto"
                          >
                            + Use custom service name
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="e.g., Complete Blood Count (CBC)" data-testid="input-service-name" />
                          </FormControl>
                          {!editingService && PREDEFINED_SERVICES[selectedCategory as keyof typeof PREDEFINED_SERVICES]?.length > 0 && (
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => {
                                setUseCustomName(false);
                                form.setValue("name", "");
                              }}
                              className="text-xs p-0 h-auto"
                            >
                              ← Choose from predefined services
                            </Button>
                          )}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Brief description of the service"
                          rows={3}
                          data-testid="input-service-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (SSP)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-service-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingService(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-service"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-medical-blue hover:bg-blue-700"
                    data-testid="button-save-service"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Service"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-services"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger data-testid="select-filter-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="laboratory">Laboratory</SelectItem>
                <SelectItem value="radiology">X-Ray (Radiology)</SelectItem>
                <SelectItem value="ultrasound">Ultrasound</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Services ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading services...</div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No services found. {searchTerm || categoryFilter !== "all" ? "Try adjusting your filters." : "Add your first service to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price (SSP)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {service.code || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {service.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`${getCategoryBadgeColor(service.category)} text-white capitalize`}>
                          {service.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {Math.round(Number(service.price)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={service.isActive ? "default" : "secondary"}>
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            data-testid={`button-edit-service-${service.id}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant={service.isActive ? "outline" : "default"}
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: service.id,
                                isActive: service.isActive ? 0 : 1,
                              })
                            }
                            data-testid={`button-toggle-service-${service.id}`}
                          >
                            {service.isActive ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          </Button>
                        </div>
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
  );
}
