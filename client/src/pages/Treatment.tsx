import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "wouter";
import {
  Save,
  Filter,
  Calendar,
  ShoppingCart,
  Printer,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";

import {
  insertTreatmentSchema,
  type InsertTreatment,
  type Patient,
  type Treatment,
  type Encounter,
  type OrderLine,
  type Service,
  type LabTest,
  type XrayExam,
  type UltrasoundExam,
  type Drug,
  type PharmacyOrder,
} from "@shared/schema";

import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

/* ------------------------- helpers / small utils ------------------------- */

const safeJSON = <T,>(v: any, fallback: T) => {
  try { return JSON.parse(v ?? ""); } catch { return fallback; }
};

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const todayISO = () => new Date().toISOString().split("T")[0];

/* -------------------------------- component ------------------------------ */

export default function Treatment() {
  const { visitId } = useParams<{ visitId?: string }>();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentEncounter, setCurrentEncounter] = useState<Encounter | null>(null);
  const [savedTreatment, setSavedTreatment] = useState<Treatment | null>(null);
  const [filterToday, setFilterToday] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [showDeletedBanner, setShowDeletedBanner] = useState<string | null>(null);

  // Medications (doctor orders to pharmacy)
  const [medications, setMedications] = useState<
    { drugId: number; drugName: string; dosage: string; quantity: number; instructions: string }[]
  >([]);

  // Edit Rx dialog state
  const [editingPrescription, setEditingPrescription] = useState<PharmacyOrder | null>(null);
  const [editDosage, setEditDosage] = useState("");
  const [editQuantity, setEditQuantity] = useState(0);
  const [editInstructions, setEditInstructions] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  /* ----------------------------- URL parameters ----------------------------- */

  // read ?filter=today and ?patientId=
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setFilterToday(p.get("filter") === "today");
  }, []);

  const urlPatientId = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("patientId") || "";
  }, []);

  /* ----------------------------- base collections ---------------------------- */

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: drugs = [] } = useQuery<Drug[]>({
    queryKey: ["/api/pharmacy/drugs"],
  });

  /* ------------------------------ visits loading ----------------------------- */

  // If /treatment/:visitId is open, fetch that encounter
  const { data: loadedVisit } = useQuery<{ encounter: Encounter; orderLines: OrderLine[] } | null>({
    queryKey: ["/api/encounters", visitId],
    enabled: !!visitId,
    queryFn: async () => {
      const res = await fetch(`/api/encounters/${visitId}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  // FIX #1: Fetch the EXACT patient using /api/patients/:patientId (not ?id=)
  const { data: loadedPatient } = useQuery<Patient | null>({
    queryKey: ["/api/patients", loadedVisit?.encounter?.patientId],
    enabled: !!loadedVisit?.encounter?.patientId,
    queryFn: async () => {
      const id = loadedVisit!.encounter.patientId;
      const res = await fetch(`/api/patients/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load patient");
      return res.json();
    },
  });

  // When a concrete visit is loaded, sync patient and encounter
  useEffect(() => {
    if (!visitId) return;
    if (loadedVisit?.encounter) {
      setCurrentEncounter(loadedVisit.encounter);
    }
    if (loadedPatient) {
      setSelectedPatient(loadedPatient);
      setShowDeletedBanner(null);
    } else if (loadedVisit?.encounter?.patientId) {
      // If the patient was deleted in the meantime, show a banner & clear UI
      setSelectedPatient(null);
      setShowDeletedBanner(
        `The patient (${loadedVisit.encounter.patientId}) for this visit was deleted.`
      );
    }
  }, [visitId, loadedVisit, loadedPatient]);

  // If NO visitId, but URL has ?patientId=, fetch that patient and create/find today's encounter
  useEffect(() => {
    const bootstrap = async () => {
      if (visitId || !urlPatientId) return;

      // Load patient
      const res = await fetch(`/api/patients/${urlPatientId}`);
      if (res.status === 404) {
        setSelectedPatient(null);
        setShowDeletedBanner(`Patient ${urlPatientId} was deleted or not found.`);
        return;
      }
      if (!res.ok) return;

      const p: Patient = await res.json();
      setSelectedPatient(p);
      setShowDeletedBanner(null);

      // Check if there's already an encounter for today; if not, create one
      const today = todayISO();
      const encRes = await fetch(`/api/encounters?date=${today}&patientId=${p.patientId}`);
      if (encRes.ok) {
        const all: Encounter[] = await encRes.json();
        const todayEnc = all.find((e) => e.patientId === p.patientId);
        if (todayEnc) {
          setCurrentEncounter(todayEnc);
          return;
        }
      }

      // Create one
      await createEncounterMutation.mutateAsync({
        patientId: p.patientId,
        visitDate: todayISO(),
        attendingClinician: "Dr. System",
      });
    };
    void bootstrap();
  }, [visitId, urlPatientId]);

  /* -------------------------------- treatments ------------------------------- */

  // Today’s treatment list (for the “Today” filter list UI)
  const { data: todaysTreatments = [] } = useQuery<Treatment[]>({
    queryKey: ["/api/treatments", "today"],
    enabled: filterToday,
    queryFn: async () => {
      const r = await fetch(`/api/treatments?today=true`);
      if (!r.ok) return [];
      return r.json();
    },
  });

  // Needed only to show patient names in the Today list
  const { data: allPatients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    enabled: filterToday,
  });

  // Existing treatment for this encounter (if any)
  const { data: existingTreatment } = useQuery<Treatment | null>({
    queryKey: ["/api/treatments", "encounter", currentEncounter?.encounterId],
    enabled: !!currentEncounter?.encounterId,
    queryFn: async () => {
      const r = await fetch(`/api/treatments?encounterId=${currentEncounter!.encounterId}`);
      if (!r.ok) return null;
      const arr = await r.json();
      return arr[0] || null;
    },
  });

  // Form
  const form = useForm<InsertTreatment>({
    resolver: zodResolver(insertTreatmentSchema),
    defaultValues: {
      patientId: "",
      visitDate: todayISO(),
      visitType: "consultation",
      priority: "routine",
      chiefComplaint: "",
      temperature: null,
      bloodPressure: "",
      heartRate: null,
      weight: null,
      examination: "",
      diagnosis: "",
      treatmentPlan: "",
      followUpDate: "",
      followUpType: "",
    },
  });

  // If an existing treatment loads, hydrate the form
  useEffect(() => {
    if (!existingTreatment) return;
    form.reset({
      patientId: existingTreatment.patientId,
      visitDate: existingTreatment.visitDate,
      visitType: existingTreatment.visitType,
      priority: existingTreatment.priority,
      chiefComplaint: existingTreatment.chiefComplaint || "",
      temperature: existingTreatment.temperature,
      bloodPressure: existingTreatment.bloodPressure || "",
      heartRate: existingTreatment.heartRate,
      weight: existingTreatment.weight,
      examination: existingTreatment.examination || "",
      diagnosis: existingTreatment.diagnosis || "",
      treatmentPlan: existingTreatment.treatmentPlan || "",
      followUpDate: existingTreatment.followUpDate || "",
      followUpType: existingTreatment.followUpType || "",
    });
    setSavedTreatment(existingTreatment);
  }, [existingTreatment]);

  /* ------------------------------- order lines ------------------------------- */

  // Current encounter id
  const activeEncounterId = useMemo(
    () => (visitId ? loadedVisit?.encounter?.encounterId : currentEncounter?.encounterId) || "",
    [visitId, loadedVisit, currentEncounter]
  );

  // Visit orders (lab/xray/us) with order lines
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/visits", activeEncounterId, "orders"],
    enabled: !!activeEncounterId,
    queryFn: async () => {
      const r = await fetch(`/api/visits/${activeEncounterId}/orders`);
      if (!r.ok) return [];
      return r.json();
    },
  });

  const labOrders = useMemo(() => orders.filter((o) => o.type === "lab"), [orders]);
  const xrayOrders = useMemo(() => orders.filter((o) => o.type === "xray"), [orders]);
  const usOrders = useMemo(() => orders.filter((o) => o.type === "ultrasound"), [orders]);

  /* --------------------------------- queries -------------------------------- */

  const createEncounterMutation = useMutation({
    mutationFn: async (data: { patientId: string; visitDate: string; attendingClinician: string }) => {
      const res = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create encounter");
      return res.json() as Promise<Encounter>;
    },
    onSuccess: (enc) => setCurrentEncounter(enc),
  });

  const createTreatmentMutation = useMutation({
    mutationFn: async (data: InsertTreatment) => {
      const res = await apiRequest("POST", "/api/treatments", data);
      return res.json() as Promise<Treatment>;
    },
    onSuccess: (t) => {
      setSavedTreatment(t);
      toast({ title: "Saved", description: `Treatment #${t.treatmentId} saved.` });
      queryClient.invalidateQueries({ queryKey: ["/api/treatments"] });
    },
    onError: () => {
      if (!navigator.onLine) {
        addToPendingSync({ type: "treatment", action: "create", data: form.getValues() });
        toast({ title: "Saved offline", description: "Will sync when back online." });
        form.reset();
        setSelectedPatient(null);
      } else {
        toast({ title: "Error", description: "Failed to save", variant: "destructive" });
      }
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (p: { orderLineId: number; acknowledged: boolean; acknowledgedBy: string }) => {
      const res = await apiRequest("PUT", `/api/order-lines/${p.orderLineId}/acknowledge`, p);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      toast({ title: "Updated", description: "Acknowledgment saved." });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (p: { orderLineId: number; addToCart: boolean }) => {
      const res = await apiRequest("PUT", `/api/order-lines/${p.orderLineId}/add-to-cart`, p);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", activeEncounterId, "orders"] });
      toast({ title: "Updated", description: "Added to visit cart." });
    },
  });

  const closeVisitMutation = useMutation({
    mutationFn: async (encounterId: string) => {
      const res = await apiRequest("POST", `/api/encounters/${encounterId}/close`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Visit closed", description: "Marked ready to bill." });
      setSelectedPatient(null);
      setCurrentEncounter(null);
      form.reset();
    },
    onError: (e: any) => {
      toast({
        title: "Cannot close",
        description: e?.message || "Please complete required items.",
        variant: "destructive",
      });
    },
  });

  /* --------------------------------- actions -------------------------------- */

  const handlePatientSelect = (p: Patient) => {
    // redirector route creates/finds today’s encounter then lands here again
    window.location.href = `/treatment/new?patientId=${p.patientId}`;
  };

  const handleSubmit = form.handleSubmit((data) => {
    if (!selectedPatient) {
      toast({ title: "Select a patient", variant: "destructive" });
      return;
    }
    createTreatmentMutation.mutate({ ...data, patientId: selectedPatient.patientId });
  });

  const handleCloseVisit = () => {
    if (!currentEncounter) return;

    // require diagnosis (either saved or in-form)
    const currentDx = (form.watch("diagnosis") || "").trim();
    const savedDx = (savedTreatment?.diagnosis || "").trim();
    if (!currentDx && !savedDx) {
      toast({ title: "Diagnosis required", variant: "destructive" });
      return;
    }

    // require acknowledgment for any completed results with order lines
    const completed = [
      ...labOrders.filter((x: any) => x.status === "completed" && x.orderLine),
      ...xrayOrders.filter((x: any) => x.status === "completed" && x.orderLine),
      ...usOrders.filter((x: any) => x.status === "completed" && x.orderLine),
    ];
    const unacked = completed.filter((x: any) => !x.orderLine.acknowledgedBy);
    if (unacked.length) {
      toast({
        title: "Acknowledge results",
        description: `Please acknowledge ${unacked.length} completed result(s) first.`,
        variant: "destructive",
      });
      return;
    }

    closeVisitMutation.mutate(currentEncounter.encounterId);
  };

  const getPatientName = (id: string) => {
    const p = allPatients.find((x) => x.patientId === id);
    return p ? `${p.firstName} ${p.lastName}` : id;
  };

  /* --------------------------------- render --------------------------------- */

  return (
    <div className="space-y-6">
      {/* banner if the patient tied to a visit was deleted */}
      {showDeletedBanner && (
        <div className="rounded-md border border-amber-500/40 bg-amber-50 p-3 text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-medium">{showDeletedBanner}</p>
          </div>
          <p className="text-sm opacity-80">
            Return to Patients to select another person.
          </p>
        </div>
      )}

      {/* Today’s treatments list */}
      {filterToday && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Today’s Treatment Visits
                <Badge className="bg-blue-600 text-white">
                  <Filter className="mr-1 h-3 w-3" />
                  Today only
                </Badge>
              </span>
              <Button variant="outline" onClick={() => setFilterToday(false)}>
                New Treatment
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysTreatments.length ? (
              todaysTreatments.map((t: any) => (
                <div
                  key={t.treatmentId}
                  className="rounded-lg border p-4 transition-all hover:border-blue-500/40 hover:shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-muted-foreground">Patient:</span>
                        <button
                          onClick={() => (window.location.href = `/patients?patientId=${t.patientId}`)}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {getPatientName(t.patientId)}
                        </button>
                        <span className="text-sm text-muted-foreground">({t.patientId})</span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          <Badge variant="outline">{t.visitType}</Badge>
                          <span className="ml-3 font-medium">Priority:</span>{" "}
                          <Badge variant="outline">{t.priority}</Badge>
                        </div>
                        {!!t.chiefComplaint && (
                          <div>
                            <span className="font-medium">Chief complaint:</span> {t.chiefComplaint}
                          </div>
                        )}
                        {!!t.diagnosis && (
                          <div>
                            <span className="font-medium">Diagnosis:</span> {t.diagnosis}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      <Calendar className="mr-1 h-3 w-3" />
                      {t.visitDate}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No visits for today.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Patient selector + visit header */}
      {!filterToday && (
        <Card>
          <CardHeader>
            <CardTitle>Start or Continue a Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PatientSearch
              value=""
              onSelect={(p) => handlePatientSelect(p)}
              placeholder="Search patient by name, phone, or ID…"
            />
            {selectedPatient && (
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Selected patient</div>
                    <div className="text-lg font-semibold">
                      {selectedPatient.firstName} {selectedPatient.lastName}{" "}
                      <span className="text-sm text-muted-foreground">({selectedPatient.patientId})</span>
                    </div>
                  </div>
                  {currentEncounter && (
                    <Badge variant="outline">
                      Visit #{currentEncounter.encounterId} • {currentEncounter.visitDate}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main workspace */}
      {selectedPatient && (
        <Tabs defaultValue="notes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
            <TabsTrigger value="orders">Orders & Results</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
            <TabsTrigger value="summary">Visit Summary</TabsTrigger>
          </TabsList>

          {/* Clinical Notes */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Clinical Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="chiefComplaint"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Chief complaint</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="examination"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Examination</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Diagnosis</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="treatmentPlan"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Treatment plan</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2 flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        Patient:{" "}
                        <span className="font-medium">
                          {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (!savedTreatment) {
                              toast({ title: "Save first", variant: "destructive" });
                              return;
                            }
                            setShowPrescription(true);
                          }}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print Prescription
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={handleCloseVisit}
                          disabled={!currentEncounter}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Close Visit
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders & Results */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders & Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lab */}
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">Laboratory</h3>
                  </div>
                  {!labOrders.length ? (
                    <p className="text-sm text-muted-foreground">No lab orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {labOrders.map((o: any) => (
                        <div key={o.orderId} className="rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{o.name || "Lab Test"}</div>
                              <div className="text-sm text-muted-foreground">{o.snippet}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={!!o.orderLine?.acknowledgedBy}
                                  onCheckedChange={(v) =>
                                    acknowledgeMutation.mutate({
                                      orderLineId: o.orderLine.id,
                                      acknowledged: !!v,
                                      acknowledgedBy: "Clinician",
                                    })
                                  }
                                />
                                Acknowledged
                              </label>
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={!!o.orderLine?.addToCart}
                                  onCheckedChange={(v) =>
                                    addToCartMutation.mutate({
                                      orderLineId: o.orderLine.id,
                                      addToCart: !!v,
                                    })
                                  }
                                />
                                Add to Cart
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* X-Ray */}
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">X-Ray</h3>
                  </div>
                  {!xrayOrders.length ? (
                    <p className="text-sm text-muted-foreground">No x-ray orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {xrayOrders.map((o: any) => (
                        <div key={o.orderId} className="rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{o.name || "X-Ray"}</div>
                              <div className="text-sm text-muted-foreground">{o.snippet}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={!!o.orderLine?.acknowledgedBy}
                                  onCheckedChange={(v) =>
                                    acknowledgeMutation.mutate({
                                      orderLineId: o.orderLine.id,
                                      acknowledged: !!v,
                                      acknowledgedBy: "Clinician",
                                    })
                                  }
                                />
                                Acknowledged
                              </label>
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={!!o.orderLine?.addToCart}
                                  onCheckedChange={(v) =>
                                    addToCartMutation.mutate({
                                      orderLineId: o.orderLine.id,
                                      addToCart: !!v,
                                    })
                                  }
                                />
                                Add to Cart
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Ultrasound */}
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">Ultrasound</h3>
                  </div>
                  {!usOrders.length ? (
                    <p className="text-sm text-muted-foreground">No ultrasound orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {usOrders.map((o: any) => (
                        <div key={o.orderId} className="rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{o.name || "Ultrasound"}</div>
                              <div className="text-sm text-muted-foreground">{o.snippet}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={!!o.orderLine?.acknowledgedBy}
                                  onCheckedChange={(v) =>
                                    acknowledgeMutation.mutate({
                                      orderLineId: o.orderLine.id,
                                      acknowledged: !!v,
                                      acknowledgedBy: "Clinician",
                                    })
                                  }
                                />
                                Acknowledged
                              </label>
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={!!o.orderLine?.addToCart}
                                  onCheckedChange={(v) =>
                                    addToCartMutation.mutate({
                                      orderLineId: o.orderLine.id,
                                      addToCart: !!v,
                                    })
                                  }
                                />
                                Add to Cart
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pharmacy */}
          <TabsContent value="pharmacy">
            <Card>
              <CardHeader>
                <CardTitle>Pharmacy Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Drug</label>
                    <Select
                      onValueChange={(v) => {
                        const d = drugs.find((x) => x.id.toString() === v);
                        if (d) {
                          setMedications((prev) => prev);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a drug" />
                      </SelectTrigger>
                      <SelectContent>
                        {drugs.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Dosage</label>
                    <Input
                      placeholder="e.g. 500mg bid"
                      onChange={(e) => {
                        // store temporary dosage (simple inline add below)
                        (window as any).__rx_dose = e.target.value;
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Qty</label>
                    <Input
                      type="number"
                      min={1}
                      onChange={(e) => {
                        (window as any).__rx_qty = Number(e.target.value || 0);
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      const id = (document.querySelector('[data-state="open"] [data-radix-select-collection-item] [data-value]') as HTMLElement)?.dataset?.value
                        || (document.querySelector('[data-radix-select-collection-item] [data-value]') as HTMLElement)?.dataset?.value;
                      const selected = id ? drugs.find((d) => d.id.toString() === id) : undefined;
                      const dose = (window as any).__rx_dose || "";
                      const qty = Number((window as any).__rx_qty || 0);
                      if (!selected || !dose || !qty) {
                        toast({ title: "Fill drug, dosage & qty", variant: "destructive" });
                        return;
                      }
                      setMedications((prev) => [
                        ...prev,
                        { drugId: selected.id, drugName: selected.name, dosage: dose, quantity: qty, instructions: "" },
                      ]);
                      (window as any).__rx_dose = "";
                      (window as any).__rx_qty = 0;
                    }}
                  >
                    Add Medication
                  </Button>
                </div>

                {medications.length > 0 && (
                  <div className="rounded-md border">
                    <div className="border-b p-2 text-sm font-medium">Pending medications</div>
                    <div className="divide-y">
                      {medications.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 text-sm">
                          <div>
                            <div className="font-medium">{m.drugName}</div>
                            <div className="text-muted-foreground">
                              {m.dosage} • {m.quantity}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setMedications((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end p-2">
                      <Button
                        onClick={async () => {
                          if (!selectedPatient || !currentEncounter) {
                            toast({ title: "Select patient/visit", variant: "destructive" });
                            return;
                          }
                          // submit to backend
                          const pharmacyService = services.find((s) => s.category === "pharmacy");
                          if (!pharmacyService) {
                            toast({ title: "Pharmacy service missing", variant: "destructive" });
                            return;
                          }
                          await Promise.all(
                            medications.map((m) =>
                              apiRequest("POST", "/api/pharmacy-orders", {
                                patientId: selectedPatient.patientId,
                                encounterId: currentEncounter.encounterId,
                                treatmentId: savedTreatment?.treatmentId,
                                serviceId: pharmacyService.id,
                                drugId: m.drugId,
                                drugName: m.drugName,
                                dosage: m.dosage,
                                quantity: m.quantity,
                                instructions: m.instructions,
                              })
                            )
                          );
                          setMedications([]);
                          toast({ title: "Medications sent to pharmacy" });
                        }}
                      >
                        Submit to Pharmacy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary (print) */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Visit Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="prescription-print" className="space-y-3">
                  <div className="text-lg font-semibold">
                    {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Visit date: {currentEncounter?.visitDate || todayISO()}
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium">Diagnosis</div>
                      <div className="whitespace-pre-wrap">
                        {form.getValues("diagnosis") || savedTreatment?.diagnosis || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Treatment plan</div>
                      <div className="whitespace-pre-wrap">
                        {form.getValues("treatmentPlan") || savedTreatment?.treatmentPlan || "—"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
