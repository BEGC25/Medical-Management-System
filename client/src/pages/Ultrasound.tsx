import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Printer, Check, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import PatientSearch from "@/components/PatientSearch";
import { insertUltrasoundExamSchema, type InsertUltrasoundExam, type Patient, type UltrasoundExam } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { addToPendingSync } from "@/lib/offline";

// Ultrasound template system for common findings
function getUltrasoundTemplates(examType?: string) {
  const templates = {
    abdominal: {
      normal: {
        findings: "LIVER: Normal size, echogenicity, and homogeneous texture. No focal lesions or masses identified. Portal vein patent with normal flow.\n\nGALLBLADDER: Normal wall thickness, no stones or sludge. No pericholecystic fluid.\n\nKIDNEYS: Both kidneys normal in size and echogenicity. No hydronephrosis, stones, or masses. Corticomedullary differentiation preserved.\n\nPANCREAS: Visualized portions appear normal. No focal lesions.\n\nSPLEEN: Normal size and echogenicity. No focal lesions.\n\nBLADDER: Normal wall thickness, no stones or masses.",
        impression: "Normal abdominal ultrasound examination."
      },
      abnormal: {
        findings: "LIVER: Hepatomegaly noted with span measuring ___ cm. Echogenicity appears [increased/decreased/heterogeneous]. [Multiple hyperechoic foci consistent with fatty infiltration / Hypoechoic lesion measuring ___ cm in segment ___ / Dilated intrahepatic bile ducts]\n\nGALLBLADDER: [Multiple echogenic foci with posterior shadowing consistent with gallstones / Gallbladder wall thickening measuring ___ mm / Pericholecystic fluid present / Contracted gallbladder]\n\nKIDNEYS: [Right/Left/Both] kidney shows [mild/moderate/severe] hydronephrosis. [Echogenic focus with posterior shadowing in renal pelvis consistent with stone / Cortical thinning noted / Increased cortical echogenicity / Complex cystic lesion measuring ___ cm]\n\nPANCREAS: [Dilated pancreatic duct / Hypoechoic mass in head/body/tail / Calcifications noted]\n\nSPLEEN: [Splenomegaly with span ___ cm / Hypoechoic lesions noted / Increased echogenicity]\n\nASCITES: [Minimal/Moderate/Massive] free fluid in pelvis and paracolic gutters\n\nOTHER FINDINGS: [Lymphadenopathy / Bowel wall thickening / Abdominal aortic aneurysm]",
        impression: "Abnormal abdominal ultrasound. [Cholelithiasis with gallbladder inflammation / Hepatomegaly with fatty infiltration / Renal calculi with hydronephrosis / Splenomegaly / Ascites of unknown etiology]. Recommend [clinical correlation / CT scan / MRCP / urology referral / gastroenterology consultation]."
      }
    },
    pelvic: {
      normal: {
        findings: "UTERUS: Normal size, shape, and echogenicity. Endometrial thickness appropriate for menstrual phase. No masses or fibroids.\n\nOVARIES: Both ovaries normal in size and appearance. No cysts or masses identified.\n\nPOUCH OF DOUGLAS: No free fluid.\n\nBLADDER: Normal appearance when distended.",
        impression: "Normal pelvic ultrasound examination."
      },
      abnormal: {
        findings: "UTERUS: [Enlarged uterus measuring ___ x ___ x ___ cm / Multiple intramural fibroids, largest measuring ___ cm / Thickened endometrium measuring ___ mm / Heterogeneous myometrial texture / Retroverted/anteflexed position]\n\nRIGHT OVARY: [Simple cyst measuring ___ cm / Complex cyst with internal echoes / Solid mass measuring ___ cm / Polycystic appearance with multiple follicles / Not visualized secondary to bowel gas]\n\nLEFT OVARY: [Simple cyst measuring ___ cm / Complex cyst with septations / Hemorrhagic cyst / Solid components noted / Enlarged measuring ___ x ___ cm]\n\nPOUCH OF DOUGLAS: [Free fluid present / Complex fluid collection / Debris noted]\n\nBLADDER: [Wall thickening / Echogenic focus consistent with stone / Incomplete emptying with residual volume ___ ml]\n\nCERVIX: [Nabothian cysts / Thickened appearance]",
        impression: "Abnormal pelvic ultrasound. [Uterine fibroids / Ovarian cyst requiring follow-up / Complex adnexal mass / Endometrial thickening]. Recommend [gynecologic evaluation / pelvic MRI / tumor markers / follow-up ultrasound in ___ weeks]."
      }
    },
    obstetric: {
      normal: {
        findings: "FETAL BIOMETRY: Consistent with gestational age\nBPD: ___ mm (___th percentile)\nHC: ___ mm (___th percentile)\nAC: ___ mm (___th percentile)\nFL: ___ mm (___th percentile)\nEstimated fetal weight: ___ grams\n\nFETAL ANATOMY: Normal fetal anatomy survey. Heart rate: ___ bpm, regular rhythm. Four-chamber heart view normal. Spine intact. Both kidneys visualized. Stomach bubble present. Bladder visualized.\n\nPLACENTA: [Anterior/Posterior/Fundal/Lateral] placenta, normal thickness and echogenicity. Grade [I/II/III]. No previa.\n\nAMNIOTIC FLUID: Normal volume (AFI: ___ cm).\n\nCERVIX: ___ mm length, closed internal os.\n\nUMBILICAL CORD: Three vessels present.",
        impression: "Normal obstetric ultrasound. Estimated gestational age: ___ weeks ___ days. Estimated delivery date: ___."
      },
      abnormal: {
        findings: "FETAL BIOMETRY: [Measurements below 10th percentile consistent with IUGR / Measurements above 90th percentile consistent with macrosomia / Asymmetric growth pattern]\nBPD: ___ mm (___th percentile)\nHC: ___ mm (___th percentile)\nAC: ___ mm (___th percentile)\nFL: ___ mm (___th percentile)\n\nFETAL ANATOMY: [Cardiac anomaly - VSD/ASD/hypoplastic left heart / Neural tube defect - spina bifida/anencephaly / Renal anomaly - bilateral renal agenesis/polycystic kidneys / Gastrointestinal - gastroschisis/omphalocele]\n\nPLACENTA: [Complete/Partial placenta previa covering internal os / Placental abruption with retroplacental hematoma / Low-lying placenta / Abnormally adherent placenta]\n\nAMNIOTIC FLUID: [Oligohydramnios with AFI ___ cm / Polyhydramnios with AFI ___ cm / Anhydramnios]\n\nUMBILICAL CORD: [Single umbilical artery / Cord around neck / True knot / Velamentous insertion]\n\nCERVIX: [Short cervix measuring ___ mm / Funneling present / Incompetent cervix]",
        impression: "Abnormal obstetric ultrasound. [Intrauterine growth restriction / Fetal anomaly requiring genetic counseling / Placenta previa requiring C-section delivery / Oligohydramnios requiring close monitoring]. Recommend [maternal-fetal medicine consultation / genetic counseling / serial growth scans / hospital delivery planning]."
      }
    },
    cardiac: {
      normal: {
        findings: "LEFT VENTRICLE: Normal size and systolic function. Estimated EF: 55-65%. No wall motion abnormalities. IVS thickness: ___ mm. LVPW thickness: ___ mm.\n\nRIGHT VENTRICLE: Normal size and function. No RV dilation.\n\nLEFT ATRIUM: Normal size. LA dimension: ___ mm.\n\nRIGHT ATRIUM: Normal size and appearance.\n\nVALVES: Mitral valve - normal leaflets, no stenosis or regurgitation. Tricuspid valve - normal appearance. Aortic valve - trileaflet, normal opening. Pulmonary valve - normal.\n\nPERICARDIUM: No pericardial effusion.\n\nAORTA: Normal root dimensions.",
        impression: "Normal echocardiogram. Normal left ventricular size and systolic function."
      },
      abnormal: {
        findings: "LEFT VENTRICLE: [Dilated with EDD ___ mm / Reduced systolic function with EF ___% / Regional wall motion abnormality in ___ territory / Hypertrophic with IVS ___ mm / Hypokinetic/akinetic segments]\n\nRIGHT VENTRICLE: [Dilated and pressure overloaded / Reduced systolic function / Hypokinetic]\n\nLEFT ATRIUM: [Dilated measuring ___ mm / Spontaneous echo contrast / Thrombus visualized]\n\nVALVULAR ASSESSMENT:\nMitral valve: [Severe stenosis with valve area ___ cm² / Severe regurgitation with regurgitant fraction ___% / Mitral valve prolapse / Rheumatic changes]\nAortic valve: [Severe stenosis with peak velocity ___ m/s / Severe regurgitation / Bicuspid valve / Calcific stenosis]\nTricuspid valve: [Severe regurgitation with RVSP ___ mmHg / Stenosis]\n\nPERICARDIUM: [Pericardial effusion - small/moderate/large/tamponade physiology / Pericardial thickening]\n\nPULMONARY HYPERTENSION: [Estimated RVSP ___ mmHg based on TR jet]",
        impression: "Abnormal echocardiogram. [Systolic heart failure with reduced EF / Valvular heart disease - severe mitral/aortic stenosis/regurgitation / Pulmonary hypertension / Pericardial effusion]. Recommend [cardiology consultation / cardiac catheterization / surgical evaluation / medical optimization]."
      }
    },
    renal: {
      normal: {
        findings: "RIGHT KIDNEY: Normal size (length: ___ cm), shape, and echogenicity. No hydronephrosis, stones, or masses. Corticomedullary differentiation preserved. Cortical thickness normal.\n\nLEFT KIDNEY: Normal size (length: ___ cm), shape, and echogenicity. No hydronephrosis, stones, or masses. Corticomedullary differentiation preserved. Cortical thickness normal.\n\nBLADDER: Normal wall thickness when distended. No stones or masses. Complete emptying observed. Post-void residual: ___ ml.",
        impression: "Normal renal ultrasound examination. Bilateral kidneys normal in size and appearance."
      },
      abnormal: {
        findings: "RIGHT KIDNEY: [Enlarged measuring ___ cm / Small kidney measuring ___ cm / Mild/moderate/severe hydronephrosis with calyceal dilatation / Echogenic focus with posterior shadowing in renal pelvis consistent with stone / Increased cortical echogenicity consistent with medical renal disease / Complex cystic lesion measuring ___ cm / Solid mass measuring ___ cm / Cortical thinning noted]\n\nLEFT KIDNEY: [Enlarged measuring ___ cm / Small kidney measuring ___ cm / Mild/moderate/severe hydronephrosis / Multiple simple cysts / Polycystic kidney disease / Absent kidney / Duplex collecting system / Scarring in upper/lower pole]\n\nBLADDER: [Wall thickening measuring ___ mm / Echogenic focus with shadowing consistent with stone / Irregular wall contour / Mass lesion measuring ___ cm / Incomplete emptying with residual ___ ml / Trabeculated appearance]\n\nURETERS: [Dilated right/left ureter / Ureteral stone with proximal dilatation]\n\nADDITIONAL FINDINGS: [Perinephric fluid collection / Retroperitoneal lymphadenopathy]",
        impression: "Abnormal renal ultrasound. [Bilateral hydronephrosis secondary to bladder outlet obstruction / Renal calculi with obstruction / Chronic kidney disease / Renal mass requiring further evaluation / Polycystic kidney disease]. Recommend [urology referral / CT urography / cystoscopy / nephrology consultation / follow-up ultrasound in ___ weeks]."
      }
    },
    thyroid: {
      normal: {
        findings: "RIGHT LOBE: Normal size measuring ___ x ___ x ___ cm. Homogeneous echogenicity. No focal lesions or nodules. Normal vascularity.\n\nLEFT LOBE: Normal size measuring ___ x ___ x ___ cm. Homogeneous echogenicity. No focal lesions or nodules. Normal vascularity.\n\nISTHMUS: Normal thickness measuring ___ mm.\n\nLYMPH NODES: No enlarged cervical lymph nodes identified.",
        impression: "Normal thyroid ultrasound examination. Both lobes normal in size and appearance."
      },
      abnormal: {
        findings: "RIGHT LOBE: [Enlarged measuring ___ x ___ x ___ cm / Heterogeneous echogenicity / Solid nodule measuring ___ cm with irregular margins / Complex cystic nodule / Multiple nodules largest measuring ___ cm / Hypoechoic nodule with microcalcifications / Increased vascularity]\n\nLEFT LOBE: [Enlarged measuring ___ x ___ x ___ cm / Heterogeneous texture / Solid hypoechoic nodule measuring ___ cm / Spongiform nodule / Colloid nodule / Decreased echogenicity consistent with thyroiditis]\n\nISTHMUS: [Thickened measuring ___ mm / Nodule present measuring ___ cm]\n\nVASCULARITY: [Increased flow in nodule / Peripheral vascularity / Central flow pattern]\n\nLYMPH NODES: [Enlarged level II/III/IV lymph nodes measuring ___ cm / Loss of fatty hilum / Increased cortical thickness]\n\nADDITIONAL FINDINGS: [Tracheal deviation / Esophageal compression]",
        impression: "Abnormal thyroid ultrasound. [Multinodular goiter / Suspicious thyroid nodule requiring FNA / Thyroiditis / Hashimoto's thyroiditis]. Recommend [endocrinology referral / fine needle aspiration / thyroid function tests / follow-up ultrasound in ___ months]."
      }
    },
    vascular: {
      normal: {
        findings: "RIGHT CAROTID ARTERY: Normal flow patterns. Peak systolic velocity: ___ cm/s. No significant stenosis (<50%). Normal wall thickness.\n\nLEFT CAROTID ARTERY: Normal flow patterns. Peak systolic velocity: ___ cm/s. No significant stenosis (<50%). Normal wall thickness.\n\nVERTEBRAL ARTERIES: Patent bilaterally with antegrade flow. Normal velocities.\n\nJUGULAR VEINS: Normal caliber and compressibility bilaterally. No thrombus.",
        impression: "Normal carotid duplex examination. No hemodynamically significant stenosis."
      },
      abnormal: {
        findings: "RIGHT CAROTID ARTERY: [Mild stenosis 50-69% with PSV ___ cm/s / Severe stenosis >70% with PSV >230 cm/s / Complete occlusion / Increased intimal-medial thickness / Heterogeneous plaque with ulceration]\n\nLEFT CAROTID ARTERY: [Mild stenosis 50-69% with PSV ___ cm/s / Severe stenosis >70% with PSV >230 cm/s / Moderate stenosis with turbulent flow / Calcified plaque causing acoustic shadowing]\n\nVERTEBRAL ARTERIES: [Retrograde flow suggesting subclavian steal / Stenosis at origin / Diminished flow velocities]\n\nJUGULAR VEINS: [Acute thrombosis with non-compressible vessel / Chronic thrombus with partial recanalization / Venous reflux with incompetent valves]\n\nLOWER EXTREMITY VEINS: [Deep vein thrombosis in femoral/popliteal/posterior tibial veins / Superficial thrombophlebitis / Venous insufficiency with reflux]\n\nARTERIAL DOPPLER: [Monophasic waveform suggesting proximal stenosis / Absent flow / Arteriovenous fistula]",
        impression: "Abnormal vascular ultrasound. [Carotid stenosis requiring intervention / Deep vein thrombosis requiring anticoagulation / Arterial occlusive disease / Venous insufficiency]. Recommend [vascular surgery consultation / anticoagulation therapy / CT angiography / compression therapy]."
      }
    }
  };

  // Return templates based on exam type, default to abdominal
  return templates[examType as keyof typeof templates] || templates.abdominal;
}

export default function Ultrasound() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedUltrasoundExam, setSelectedUltrasoundExam] = useState<UltrasoundExam | null>(null);
  const [selectedUltrasoundPatient, setSelectedUltrasoundPatient] = useState<Patient | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const printUltrasoundRequest = () => {
    if (!selectedPatient || !form.getValues("examType")) {
      toast({
        title: "Incomplete Information",
        description: "Please select a patient and examination type before printing.",
        variant: "destructive",
      });
      return;
    }

    console.log("Ultrasound Print: selectedPatient data:", selectedPatient);
    console.log("Ultrasound Print: Patient age:", selectedPatient.age);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formData = form.getValues();
    const currentDate = new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ultrasound Request - ${selectedPatient.patientId}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              body { margin: 0; }
              .request-container {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                box-sizing: border-box;
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
              }
            }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .clinic-subtitle { font-size: 14px; color: #666; margin-bottom: 10px; }
            .request-title { font-size: 20px; font-weight: bold; color: #16a34a; margin-top: 15px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="request-container">
            <div class="header">
              <div class="clinic-name">BAHR EL GHAZAL CLINIC</div>
              <div class="clinic-subtitle">Your Health, Our Priority</div>
              <div class="clinic-subtitle">Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com</div>
              <div class="request-title">ULTRASOUND EXAMINATION REQUEST</div>
            </div>

            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-grid">
                <div>
                  <div class="info-item"><span class="label">Patient Name:</span> ${selectedPatient.firstName} ${selectedPatient.lastName}</div>
                  <div class="info-item"><span class="label">Patient ID:</span> ${selectedPatient.patientId}</div>
                  <div class="info-item"><span class="label">Age:</span> ${selectedPatient.age || 'Age not found'}</div>
                  <div class="info-item"><span class="label">Gender:</span> ${selectedPatient.gender || 'Not specified'}</div>
                </div>
                <div>
                  <div class="info-item"><span class="label">Phone:</span> ${selectedPatient.phoneNumber || 'Not provided'}</div>
                  <div class="info-item"><span class="label">Village:</span> ${selectedPatient.village || 'Not specified'}</div>
                  <div class="info-item"><span class="label">Request Date:</span> ${currentDate}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Examination Details</div>
              <div class="info-item"><span class="label">Examination Type:</span> ${formData.examType?.charAt(0).toUpperCase() + formData.examType?.slice(1)} Ultrasound</div>

              <div class="info-item"><span class="label">Requested Date:</span> ${formData.requestedDate}</div>
            </div>

            ${formData.clinicalIndication ? `
            <div class="section">
              <div class="section-title">Clinical Indication</div>
              <div style="background: #f9fafb; padding: 15px; border-radius: 5px; white-space: pre-line;">${formData.clinicalIndication}</div>
            </div>
            ` : ''}

            ${formData.specialInstructions ? `
            <div class="section">
              <div class="section-title">Special Instructions</div>
              <div style="background: #f9fafb; padding: 15px; border-radius: 5px; white-space: pre-line;">${formData.specialInstructions}</div>
            </div>
            ` : ''}

            <div class="footer">
              <p>Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const form = useForm<InsertUltrasoundExam>({
    resolver: zodResolver(insertUltrasoundExamSchema),
    defaultValues: {
      patientId: "",
      examType: "abdominal",
      clinicalIndication: "",
      specialInstructions: "",

      requestedDate: new Date().toISOString().split('T')[0],
    },
  });

  const resultsForm = useForm({
    defaultValues: {
      imageQuality: "good" as "excellent" | "good" | "adequate" | "limited",
      findings: "",
      impression: "",
      recommendations: "",
      reportStatus: "normal" as "normal" | "abnormal" | "urgent",
      reportDate: new Date().toISOString().split('T')[0],
      sonographer: "",
    },
  });

  const { data: pendingUltrasounds = [] } = useQuery({
    queryKey: ["/api/ultrasound-exams"],
    select: (data: UltrasoundExam[]) => data.filter(exam => exam.status === 'pending'),
  });

  const { data: completedUltrasounds = [] } = useQuery({
    queryKey: ["/api/ultrasound-exams"],
    select: (data: UltrasoundExam[]) => data.filter(exam => exam.status === 'completed'),
  });

  const createUltrasoundExamMutation = useMutation({
    mutationFn: async (data: InsertUltrasoundExam) => {
      const response = await apiRequest("POST", "/api/ultrasound-exams", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ultrasound examination request submitted successfully",
      });
      form.reset();
      setSelectedPatient(null);
      queryClient.invalidateQueries({ queryKey: ["/api/ultrasound-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'ultrasound_exam',
          action: 'create',
          data: form.getValues(),
        });
        toast({
          title: "Saved Offline",
          description: "Ultrasound request saved locally. Will sync when online.",
        });
        form.reset();
        setSelectedPatient(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to submit ultrasound request",
          variant: "destructive",
        });
      }
    },
  });

  const updateUltrasoundExamMutation = useMutation({
    mutationFn: async ({ examId, data }: { examId: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/ultrasound-exams/${examId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ultrasound report saved successfully",
      });
      resultsForm.reset();
      setSelectedUltrasoundExam(null);
      setSelectedUltrasoundPatient(null);
      setIsResultsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/ultrasound-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      if (!navigator.onLine) {
        addToPendingSync({
          type: 'ultrasound_exam',
          action: 'update',
          data: { examId: selectedUltrasoundExam?.examId, ...resultsForm.getValues() },
        });
        toast({
          title: "Saved Offline",
          description: "Ultrasound report saved locally. Will sync when online.",
        });
        resultsForm.reset();
        setSelectedUltrasoundExam(null);
        setSelectedUltrasoundPatient(null);
        setIsResultsModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to save ultrasound report",
          variant: "destructive",
        });
      }
    },
  });

  const deleteUltrasoundExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await apiRequest("DELETE", `/api/ultrasound-exams/${examId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ultrasound exam deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ultrasound-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete ultrasound exam",
        variant: "destructive",
      });
    },
  });

  const onSubmitRequest = (data: InsertUltrasoundExam) => {
    createUltrasoundExamMutation.mutate({
      ...data,
      patientId: selectedPatient!.patientId,
    });
  };

  const onSubmitResults = (data: any) => {
    if (selectedUltrasoundExam) {
      updateUltrasoundExamMutation.mutate({
        examId: selectedUltrasoundExam.examId,
        data: {
          ...data,
          status: "completed",
        },
      });
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    form.setValue("patientId", patient.patientId);
  };

  const handleUltrasoundExamSelect = async (exam: UltrasoundExam) => {
    setSelectedUltrasoundExam(exam);
    resultsForm.reset({
      findings: exam.findings || "",
      impression: exam.impression || "",
      recommendations: exam.recommendations || "",
      reportStatus: exam.reportStatus || "normal",
      reportDate: exam.reportDate || new Date().toISOString().split('T')[0],
      sonographer: exam.sonographer || "",
    });
    
    // Load patient data for the selected exam
    try {
      const response = await fetch(`/api/patients`);
      const patients = await response.json();
      const patient = patients.find((p: Patient) => p.patientId === exam.patientId);
      if (patient) {
        setSelectedUltrasoundPatient(patient);
        console.log("Loaded patient for ultrasound exam:", patient);
      }
    } catch (error) {
      console.error("Failed to load patient for ultrasound exam:", error);
    }
    
    // Open the modal instead of scrolling
    setIsResultsModalOpen(true);
  };

  const printUltrasoundReport = () => {
    if (!selectedUltrasoundExam) {
      toast({
        title: "No Report Selected",
        description: "Please select an ultrasound examination to print the report.",
        variant: "destructive",
      });
      return;
    }

    console.log("Ultrasound Report Print: selectedPatient data:", selectedPatient);
    console.log("Ultrasound Report Print: Patient age:", selectedPatient?.age);
    console.log("Ultrasound Report Print: selectedUltrasoundExam:", selectedUltrasoundExam);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportData = resultsForm.getValues();
    const currentDate = new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ultrasound Report - ${selectedUltrasoundExam.examId}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              body { margin: 0; }
              .report-container {
                width: 210mm;
                height: 297mm;
                padding: 15mm;
                padding-bottom: 50mm;
                box-sizing: border-box;
                font-family: 'Arial', sans-serif;
                line-height: 1.4;
                overflow: hidden;
                position: relative;
              }
            }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
            .clinic-name { font-size: 22px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
            .clinic-subtitle { font-size: 12px; color: #666; margin-bottom: 8px; }
            .report-title { font-size: 18px; font-weight: bold; color: #16a34a; margin-top: 12px; }
            .section { margin-bottom: 12px; }
            .section-title { font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { margin-bottom: 6px; font-size: 13px; }
            .label { font-weight: bold; }
            .footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 11px; color: #666; }
            .signature-section { margin-bottom: 20px; text-align: left; }
            .clinic-info { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
            .findings-box { background: #f9fafb; padding: 12px; border-radius: 5px; white-space: pre-line; min-height: 60px; border: 1px solid #e5e7eb; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div class="clinic-name">BAHR EL GHAZAL CLINIC</div>
              <div class="clinic-subtitle">Your Health, Our Priority</div>
              <div class="clinic-subtitle">Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com</div>
              <div class="report-title">ULTRASOUND EXAMINATION REPORT</div>
            </div>

            <div class="section">
              <div class="section-title">Patient Information</div>
              <div class="info-grid">
                <div>
                  <div class="info-item"><span class="label">Patient Name:</span> ${selectedPatient?.firstName} ${selectedPatient?.lastName}</div>
                  <div class="info-item"><span class="label">Patient ID:</span> ${selectedUltrasoundExam.patientId}</div>
                  <div class="info-item"><span class="label">Age:</span> ${selectedPatient?.age || 'Not provided'}</div>
                </div>
                <div>
                  <div class="info-item"><span class="label">Gender:</span> ${selectedPatient?.gender || 'Not specified'}</div>
                  <div class="info-item"><span class="label">Phone:</span> ${selectedPatient?.phoneNumber || 'Not provided'}</div>
                  <div class="info-item"><span class="label">Village:</span> ${selectedPatient?.village || 'Not specified'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Examination Information</div>
              <div class="info-grid">
                <div>
                  <div class="info-item"><span class="label">Ultrasound Order:</span> ${selectedUltrasoundExam.examId}</div>
                  <div class="info-item"><span class="label">Examination Type:</span> ${selectedUltrasoundExam.examType?.charAt(0).toUpperCase() + selectedUltrasoundExam.examType?.slice(1)} Ultrasound</div>
                </div>
                <div>
                  <div class="info-item"><span class="label">Requested Date:</span> ${selectedUltrasoundExam.requestedDate}</div>
                  <div class="info-item"><span class="label">Report Date:</span> ${reportData.reportDate || currentDate}</div>
                </div>
              </div>
            </div>

            ${selectedUltrasoundExam.clinicalIndication ? `
            <div class="section">
              <div class="section-title">Clinical Indication</div>
              <div class="findings-box">${selectedUltrasoundExam.clinicalIndication}</div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">Findings</div>
              <div class="findings-box">${reportData.findings || 'No findings recorded'}</div>
            </div>

            <div class="section">
              <div class="section-title">Impression</div>
              <div class="findings-box">${reportData.impression || 'No impression recorded'}</div>
            </div>

            ${reportData.recommendations ? `
            <div class="section">
              <div class="section-title">Recommendations</div>
              <div class="findings-box">${reportData.recommendations}</div>
            </div>
            ` : ''}

            <div class="footer">
              <div class="signature-section">
                <div class="section-title">Sonographer Name & Signature</div>
                <div style="margin-top: 15px;">
                  <span class="label">Sonographer Name & Signature:</span> ___________________________
                </div>
              </div>
              <div class="clinic-info">
                <p>Aweil, South Sudan | www.bahrelghazalclinic.com | info@bahrelghazalclinic.com</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-medical-blue dark:text-blue-400">Ultrasound Department</h1>
          <p className="text-gray-600 dark:text-gray-300">Request and manage ultrasound examinations</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {pendingUltrasounds?.length || 0} Pending
          </Badge>
        </div>
      </div>

      {/* Request New Ultrasound */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-blue dark:text-blue-400">New Ultrasound Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Patient Selection */}
            <div>
              <h4 className="font-medium mb-4 text-gray-800 dark:text-gray-200">Select Patient</h4>
              <PatientSearch onSelectPatient={handlePatientSelect} />
              {selectedPatient && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Selected: {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Age: {selectedPatient.age || 'Unknown'} • {selectedPatient.gender} • {selectedPatient.village} • Phone: {selectedPatient.phoneNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Ultrasound Request Form */}
            {selectedPatient && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitRequest)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="examType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Examination Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select exam type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="abdominal">Abdominal</SelectItem>
                              <SelectItem value="pelvic">Pelvic</SelectItem>
                              <SelectItem value="obstetric">Obstetric/Pregnancy</SelectItem>
                              <SelectItem value="cardiac">Cardiac/Echo</SelectItem>
                              <SelectItem value="vascular">Vascular/Doppler</SelectItem>
                              <SelectItem value="thyroid">Thyroid</SelectItem>
                              <SelectItem value="renal">Renal/Kidney</SelectItem>
                              <SelectItem value="hepatobiliary">Liver/Gallbladder</SelectItem>
                              <SelectItem value="gynecological">Gynecological</SelectItem>
                              <SelectItem value="urological">Urological/Bladder</SelectItem>
                              <SelectItem value="pediatric">Pediatric</SelectItem>
                              <SelectItem value="musculoskeletal">Musculoskeletal</SelectItem>
                              <SelectItem value="breast">Breast</SelectItem>
                              <SelectItem value="scrotal">Scrotal/Testicular</SelectItem>
                              <SelectItem value="carotid">Carotid Doppler</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requestedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requested Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="clinicalIndication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinical Indication</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Reason for ultrasound examination..."
                            rows={3}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Instructions</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special instructions or patient preparation..."
                            rows={2}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={createUltrasoundExamMutation.isPending}
                      className="bg-medical-blue hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {createUltrasoundExamMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={printUltrasoundRequest}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Request
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ultrasound Results & Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-blue dark:text-blue-400">Ultrasound Results & Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Pending Ultrasounds */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Pending Ultrasound Examinations</h3>
            <div className="space-y-2">
              {pendingUltrasounds?.map((exam: UltrasoundExam) => {
                const isPaid = exam.paymentStatus === 'paid';
                const canPerformExam = isPaid;
                
                return (
                  <div 
                    key={exam.id}
                    className={`border rounded-lg p-3 transition-colors ${
                      isPaid 
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                        : 'border-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                    } ${!canPerformExam ? 'opacity-75' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className={`flex-1 ${canPerformExam ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        onClick={() => canPerformExam && handleUltrasoundExamSelect(exam)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            Patient ID: {exam.patientId} - {exam.examType.charAt(0).toUpperCase() + exam.examType.slice(1)} Ultrasound
                          </p>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isPaid 
                              ? 'bg-green-600 text-white' 
                              : 'bg-red-600 text-white'
                          }`}>
                            {isPaid ? '✓ PAID' : '✗ UNPAID'}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested: {exam.requestedDate}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {exam.examId}
                        </p>
                        {exam.clinicalIndication && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Indication: {exam.clinicalIndication}
                          </p>
                        )}
                        {!isPaid && (
                          <p className="text-sm text-red-600 font-medium mt-1">
                            ⚠️ Patient must pay at reception before ultrasound can be performed
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={`text-white ${isPaid ? 'bg-green-600' : 'bg-attention-orange'}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {isPaid ? 'Ready' : 'Pending Payment'}
                        </Badge>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Ultrasound Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this ultrasound request for Patient ID {exam.patientId}? 
                              This action cannot be undone and will permanently remove the request.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUltrasoundExamMutation.mutate(exam.examId)}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                              {deleteUltrasoundExamMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              
              {!pendingUltrasounds?.length && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No pending ultrasound examinations
                </p>
              )}
            </div>
          </div>

          {/* Completed Ultrasounds - For Review and Edit */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">Completed Ultrasound Reports (Click to Edit)</h3>
            <div className="space-y-2">
              {completedUltrasounds?.map((exam: UltrasoundExam) => (
                <div 
                  key={exam.id}
                  className="border border-green-200 dark:border-green-700 rounded-lg p-3 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                  onClick={() => handleUltrasoundExamSelect(exam)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        Patient ID: {exam.patientId} - {exam.examType.charAt(0).toUpperCase() + exam.examType.slice(1)} Ultrasound
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requested: {exam.requestedDate} | Completed: {exam.reportDate}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {exam.examId}
                      </p>
                      {exam.clinicalIndication && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Indication: {exam.clinicalIndication}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-green-600 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </div>
              ))}
              
              {!completedUltrasounds?.length && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No completed ultrasound reports
                </p>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Results Entry Modal Dialog */}
      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-medical-blue">
              Ultrasound Report - {selectedUltrasoundExam?.examId}
            </DialogTitle>
            {selectedUltrasoundExam?.status === 'completed' && (
              <Badge className="ml-2 bg-blue-600 text-white w-fit">Editing Completed Report</Badge>
            )}
          </DialogHeader>
          
          {/* Patient Information in Modal */}
          {selectedUltrasoundPatient && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedUltrasoundPatient.firstName} {selectedUltrasoundPatient.lastName}
                </div>
                <div>
                  <span className="font-medium">Patient ID:</span> {selectedUltrasoundPatient.patientId}
                </div>
                <div>
                  <span className="font-medium">Age:</span> {selectedUltrasoundPatient?.age || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Gender:</span> {selectedUltrasoundPatient?.gender || 'Not specified'}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Exam Type:</span> {selectedUltrasoundExam?.examType?.charAt(0).toUpperCase() + selectedUltrasoundExam?.examType?.slice(1)} Ultrasound
                </div>
                {selectedUltrasoundExam?.clinicalIndication && (
                  <div className="col-span-2">
                    <span className="font-medium">Clinical Indication:</span> {selectedUltrasoundExam.clinicalIndication}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedUltrasoundExam && (
            <Form {...resultsForm}>
              <form onSubmit={resultsForm.handleSubmit(onSubmitResults)} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Findings
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const examType = selectedUltrasoundExam?.examType;
                          const templates = getUltrasoundTemplates(examType);
                          const currentFindings = resultsForm.getValues("findings") || "";
                          const selectedTemplate = templates.normal.findings;
                          resultsForm.setValue("findings", currentFindings ? `${currentFindings}\n\n${selectedTemplate}` : selectedTemplate);
                        }}
                        className="text-xs"
                      >
                        Normal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const examType = selectedUltrasoundExam?.examType;
                          const templates = getUltrasoundTemplates(examType);
                          const currentFindings = resultsForm.getValues("findings") || "";
                          const selectedTemplate = templates.abnormal.findings;
                          resultsForm.setValue("findings", currentFindings ? `${currentFindings}\n\n${selectedTemplate}` : selectedTemplate);
                        }}
                        className="text-xs"
                      >
                        Abnormal
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    rows={6}
                    placeholder="Detailed ultrasound findings..."
                    {...resultsForm.register("findings")}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Impression
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const examType = selectedUltrasoundExam?.examType;
                          const templates = getUltrasoundTemplates(examType);
                          const currentImpression = resultsForm.getValues("impression") || "";
                          const selectedTemplate = templates.normal.impression;
                          resultsForm.setValue("impression", currentImpression ? `${currentImpression}\n\n${selectedTemplate}` : selectedTemplate);
                        }}
                        className="text-xs"
                      >
                        Normal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const examType = selectedUltrasoundExam?.examType;
                          const templates = getUltrasoundTemplates(examType);
                          const currentImpression = resultsForm.getValues("impression") || "";
                          const selectedTemplate = templates.abnormal.impression;
                          resultsForm.setValue("impression", currentImpression ? `${currentImpression}\n\n${selectedTemplate}` : selectedTemplate);
                        }}
                        className="text-xs"
                      >
                        Abnormal
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Clinical impression and conclusion..."
                    {...resultsForm.register("impression")}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommendations
                  </label>
                  <Textarea
                    rows={2}
                    placeholder="Follow-up recommendations..."
                    {...resultsForm.register("recommendations")}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Report Status
                    </label>
                    <Select 
                      value={resultsForm.watch("reportStatus")}
                      onValueChange={(value) => resultsForm.setValue("reportStatus", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="abnormal">Abnormal</SelectItem>
                        <SelectItem value="urgent">Urgent - Immediate attention needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Report Date
                    </label>
                    <Input 
                      type="date"
                      {...resultsForm.register("reportDate")}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sonographer/Reporter
                  </label>
                  <Input
                    placeholder="Name of reporting sonographer"
                    {...resultsForm.register("sonographer")}
                  />
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    type="submit"
                    disabled={updateUltrasoundExamMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {updateUltrasoundExamMutation.isPending ? "Saving..." : "Save Report"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={printUltrasoundReport}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}