import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Plus, AlertTriangle, Clock, TrendingDown, TrendingUp, FileText, Eye, Edit, Download, BarChart3, ShoppingCart, Archive, HelpCircle, Filter as FilterIcon, ArrowLeft, Check, ChevronsUpDown, Search, DollarSign, X, ChevronDown, Info, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Drug, DrugBatch, InventoryLedger } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PremiumDrugSelector } from "@/components/pharmacy/PremiumDrugSelector";
import { getClinicDayKey } from "@/lib/date-utils";
import PharmacyInventoryHelp from "@/components/PharmacyInventoryHelp";
import { DateFilter, DateFilterPreset } from "@/components/pharmacy/DateFilter";
import { FilterBar, FilterConfig, ActiveFilter } from "@/components/pharmacy/FilterBar";
import { BulkActionBar, getStockBulkActions, getCatalogBulkActions } from "@/components/pharmacy/BulkActionBar";
import { QuickAdjustModal } from "@/components/pharmacy/QuickAdjustModal";
import { ExportModal, ExportColumn } from "@/components/pharmacy/ExportModal";
import { AnalyticsDashboard } from "@/components/pharmacy/AnalyticsDashboard";
import { DrugInfoModal } from "@/components/pharmacy/DrugInfoModal";
import { DrugInfoTooltip } from "@/components/pharmacy/DrugInfoTooltip";
import { exportData } from "@/lib/export-utils";
import { formatDrugQuantity } from "@/utils/pharmacy";

// Constants
const DEFAULT_REORDER_LEVEL = 10;
const EXPIRY_WARNING_DAYS = 90;

// Drug form types
type DrugForm = "tablet" | "capsule" | "syrup" | "injection" | "cream" | "ointment" | "drops" | "inhaler" | "other";

/**
 * Helper function to check if a date is within the specified filter range
 * @param dateStr - The date string to check (can be null/undefined)
 * @param preset - The date filter preset (all, today, last7days, last30days, custom)
 * @param startDate - Start date for custom range (optional)
 * @param endDate - End date for custom range (optional)
 * @returns true if the date is within the filter range, false otherwise
 */
function isDateInRange(dateStr: string | null | undefined, preset: DateFilterPreset, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return true;
  if (preset === "all") return true;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return true;
  
  const now = new Date();
  
  if (preset === "today") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date >= today && date < tomorrow;
  }
  
  if (preset === "last7days") {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date >= sevenDaysAgo;
  }
  
  if (preset === "last30days") {
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  }
  
  if (preset === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }
  
  return true;
}

// Interface for common drugs with educational summaries
interface CommonDrug {
  name: string;
  genericName: string;
  strength: string;
  form: string;
  category: string;
  summary: string;
}

// Common drugs list for quick selection - Comprehensive list with educational summaries
const COMMON_DRUGS: CommonDrug[] = [
  // Analgesics (Pain Relief)
  { name: "Paracetamol 500mg", genericName: "Acetaminophen", strength: "500mg", form: "tablet", category: "Analgesic", summary: "Treats pain and reduces fever. Safe for most people including children. Take every 4-6 hours as needed." },
  { name: "Paracetamol 650mg", genericName: "Acetaminophen", strength: "650mg", form: "tablet", category: "Analgesic", summary: "Treats pain and reduces fever. Safe for most people including children. Take every 4-6 hours as needed." },
  { name: "Paracetamol Syrup 120mg/5ml", genericName: "Acetaminophen", strength: "120mg/5ml", form: "syrup", category: "Analgesic", summary: "Liquid form for children. Treats pain and fever. Easy to swallow and measure doses." },
  { name: "Ibuprofen 200mg", genericName: "Ibuprofen", strength: "200mg", form: "tablet", category: "Analgesic", summary: "Reduces pain, fever and inflammation. Good for headaches, muscle pain. Take with food to protect stomach." },
  { name: "Ibuprofen 400mg", genericName: "Ibuprofen", strength: "400mg", form: "tablet", category: "Analgesic", summary: "Reduces pain, fever and inflammation. Good for headaches, muscle pain. Take with food to protect stomach." },
  { name: "Ibuprofen 600mg", genericName: "Ibuprofen", strength: "600mg", form: "tablet", category: "Analgesic", summary: "Reduces pain, fever and inflammation. Good for headaches, muscle pain. Take with food to protect stomach." },
  { name: "Ibuprofen Syrup 100mg/5ml", genericName: "Ibuprofen", strength: "100mg/5ml", form: "syrup", category: "Analgesic", summary: "Liquid pain and fever reducer for children. Reduces inflammation. Give with food or milk." },
  { name: "Aspirin 75mg", genericName: "Acetylsalicylic Acid", strength: "75mg", form: "tablet", category: "Analgesic", summary: "Low dose for heart protection. Prevents blood clots. Take daily as prescribed by doctor." },
  { name: "Aspirin 300mg", genericName: "Acetylsalicylic Acid", strength: "300mg", form: "tablet", category: "Analgesic", summary: "Treats pain and fever. Reduces inflammation. Take with food or water to protect stomach." },
  { name: "Aspirin 500mg", genericName: "Acetylsalicylic Acid", strength: "500mg", form: "tablet", category: "Analgesic", summary: "Treats pain and fever. Reduces inflammation. Take with food or water to protect stomach." },
  { name: "Diclofenac 50mg", genericName: "Diclofenac", strength: "50mg", form: "tablet", category: "Analgesic", summary: "Strong pain and inflammation reliever. Good for joint pain and arthritis. Take with food." },
  { name: "Diclofenac 75mg", genericName: "Diclofenac", strength: "75mg", form: "tablet", category: "Analgesic", summary: "Strong pain and inflammation reliever. Good for joint pain and arthritis. Take with food." },
  { name: "Diclofenac SR 100mg", genericName: "Diclofenac", strength: "100mg", form: "tablet", category: "Analgesic", summary: "Long-acting pain reliever. Works all day with one dose. Take with food in morning." },
  
  // Antibiotics
  { name: "Amoxicillin 250mg", genericName: "Amoxicillin", strength: "250mg", form: "capsule", category: "Antibiotic", summary: "Kills bacteria causing infections. Treats chest, ear, throat and skin infections. Take full course even if feeling better." },
  { name: "Amoxicillin 500mg", genericName: "Amoxicillin", strength: "500mg", form: "capsule", category: "Antibiotic", summary: "Kills bacteria causing infections. Treats chest, ear, throat and skin infections. Take full course even if feeling better." },
  { name: "Amoxicillin Syrup 125mg/5ml", genericName: "Amoxicillin", strength: "125mg/5ml", form: "syrup", category: "Antibiotic", summary: "Liquid antibiotic for children. Treats ear, throat and chest infections. Finish all medicine even when child feels better." },
  { name: "Amoxicillin Syrup 250mg/5ml", genericName: "Amoxicillin", strength: "250mg/5ml", form: "syrup", category: "Antibiotic", summary: "Liquid antibiotic for children. Treats ear, throat and chest infections. Finish all medicine even when child feels better." },
  { name: "Amoxicillin-Clavulanate 375mg", genericName: "Amoxicillin-Clavulanate", strength: "375mg", form: "tablet", category: "Antibiotic", summary: "Stronger antibiotic for resistant infections. Treats severe chest, ear and sinus infections. Take with food to reduce stomach upset." },
  { name: "Amoxicillin-Clavulanate 625mg", genericName: "Amoxicillin-Clavulanate", strength: "625mg", form: "tablet", category: "Antibiotic", summary: "Stronger antibiotic for resistant infections. Treats severe chest, ear and sinus infections. Take with food to reduce stomach upset." },
  { name: "Amoxicillin-Clavulanate 1000mg", genericName: "Amoxicillin-Clavulanate", strength: "1000mg", form: "tablet", category: "Antibiotic", summary: "Stronger antibiotic for resistant infections. Treats severe chest, ear and sinus infections. Take with food to reduce stomach upset." },
  { name: "Azithromycin 250mg", genericName: "Azithromycin", strength: "250mg", form: "tablet", category: "Antibiotic", summary: "Treats chest, throat and ear infections. Short course usually 3-5 days. Good for patients allergic to penicillin." },
  { name: "Azithromycin 500mg", genericName: "Azithromycin", strength: "500mg", form: "tablet", category: "Antibiotic", summary: "Treats chest, throat and ear infections. Short course usually 3-5 days. Good for patients allergic to penicillin." },
  { name: "Azithromycin Syrup 200mg/5ml", genericName: "Azithromycin", strength: "200mg/5ml", form: "syrup", category: "Antibiotic", summary: "Liquid antibiotic for children. Short course for chest and ear infections. Give once daily for 3 days." },
  { name: "Ciprofloxacin 250mg", genericName: "Ciprofloxacin", strength: "250mg", form: "tablet", category: "Antibiotic", summary: "Treats urinary, stomach and intestinal infections. Also treats typhoid fever. Drink plenty of water when taking." },
  { name: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", strength: "500mg", form: "tablet", category: "Antibiotic", summary: "Treats urinary, stomach and intestinal infections. Also treats typhoid fever. Drink plenty of water when taking." },
  { name: "Ciprofloxacin 750mg", genericName: "Ciprofloxacin", strength: "750mg", form: "tablet", category: "Antibiotic", summary: "Treats urinary, stomach and intestinal infections. Also treats typhoid fever. Drink plenty of water when taking." },
  { name: "Metronidazole 200mg", genericName: "Metronidazole", strength: "200mg", form: "tablet", category: "Antibiotic", summary: "Kills parasites and certain bacteria. Treats stomach infections, amoeba and giardia. Do not drink alcohol while taking." },
  { name: "Metronidazole 400mg", genericName: "Metronidazole", strength: "400mg", form: "tablet", category: "Antibiotic", summary: "Kills parasites and certain bacteria. Treats stomach infections, amoeba and giardia. Do not drink alcohol while taking." },
  { name: "Metronidazole 500mg", genericName: "Metronidazole", strength: "500mg", form: "tablet", category: "Antibiotic", summary: "Kills parasites and certain bacteria. Treats stomach infections, amoeba and giardia. Do not drink alcohol while taking." },
  { name: "Cephalexin 250mg", genericName: "Cephalexin", strength: "250mg", form: "capsule", category: "Antibiotic", summary: "Treats skin, bone and urinary infections. Safe for most patients. Take 4 times daily for best results." },
  { name: "Cephalexin 500mg", genericName: "Cephalexin", strength: "500mg", form: "capsule", category: "Antibiotic", summary: "Treats skin, bone and urinary infections. Safe for most patients. Take 4 times daily for best results." },
  { name: "Doxycycline 100mg", genericName: "Doxycycline", strength: "100mg", form: "capsule", category: "Antibiotic", summary: "Treats chest infections, cholera and some sexually transmitted infections. Take with food and plenty of water. Avoid sun exposure." },
  { name: "Clindamycin 150mg", genericName: "Clindamycin", strength: "150mg", form: "capsule", category: "Antibiotic", summary: "Strong antibiotic for skin, bone and dental infections. Can cause diarrhea - report if severe. Good for penicillin allergic patients." },
  { name: "Clindamycin 300mg", genericName: "Clindamycin", strength: "300mg", form: "capsule", category: "Antibiotic", summary: "Strong antibiotic for skin, bone and dental infections. Can cause diarrhea - report if severe. Good for penicillin allergic patients." },
  { name: "Ampicillin 500mg", genericName: "Ampicillin", strength: "500mg", form: "tablet", category: "Antibiotic", summary: "Treats chest, ear and urinary infections. Related to penicillin. Take on empty stomach 1 hour before meals." },
  { name: "Cotrimoxazole 960mg", genericName: "Trimethoprim-Sulfamethoxazole", strength: "960mg", form: "tablet", category: "Antibiotic", summary: "Treats urinary, chest and ear infections. Also prevents infections in HIV patients. Drink plenty of water." },
  
  // Antihypertensives (Blood Pressure)
  { name: "Amlodipine 5mg", genericName: "Amlodipine", strength: "5mg", form: "tablet", category: "Antihypertensive", summary: "Lowers blood pressure by relaxing blood vessels. Take once daily at same time. Works slowly and gently on heart." },
  { name: "Amlodipine 10mg", genericName: "Amlodipine", strength: "10mg", form: "tablet", category: "Antihypertensive", summary: "Lowers blood pressure by relaxing blood vessels. Take once daily at same time. Works slowly and gently on heart." },
  { name: "Losartan 50mg", genericName: "Losartan", strength: "50mg", form: "tablet", category: "Antihypertensive", summary: "Lowers blood pressure and protects kidneys. Safe for diabetics. Take once daily with or without food." },
  { name: "Losartan 100mg", genericName: "Losartan", strength: "100mg", form: "tablet", category: "Antihypertensive", summary: "Lowers blood pressure and protects kidneys. Safe for diabetics. Take once daily with or without food." },
  { name: "Atenolol 25mg", genericName: "Atenolol", strength: "25mg", form: "tablet", category: "Antihypertensive", summary: "Slows heart rate and lowers blood pressure. Good for heart problems. Do not stop suddenly without doctor advice." },
  { name: "Atenolol 50mg", genericName: "Atenolol", strength: "50mg", form: "tablet", category: "Antihypertensive", summary: "Slows heart rate and lowers blood pressure. Good for heart problems. Do not stop suddenly without doctor advice." },
  { name: "Atenolol 100mg", genericName: "Atenolol", strength: "100mg", form: "tablet", category: "Antihypertensive", summary: "Slows heart rate and lowers blood pressure. Good for heart problems. Do not stop suddenly without doctor advice." },
  { name: "Lisinopril 5mg", genericName: "Lisinopril", strength: "5mg", form: "tablet", category: "Antihypertensive", summary: "Lowers blood pressure and helps heart work better. Protects kidneys in diabetes. May cause dry cough in some people." },
  { name: "Lisinopril 10mg", genericName: "Lisinopril", strength: "10mg", form: "tablet", category: "Antihypertensive", summary: "Lowers blood pressure and helps heart work better. Protects kidneys in diabetes. May cause dry cough in some people." },
  { name: "Lisinopril 20mg", genericName: "Lisinopril", strength: "20mg", form: "tablet", category: "Antihypertensive", summary: "Lowers blood pressure and helps heart work better. Protects kidneys in diabetes. May cause dry cough in some people." },
  { name: "Hydrochlorothiazide 12.5mg", genericName: "Hydrochlorothiazide", strength: "12.5mg", form: "tablet", category: "Antihypertensive", summary: "Water pill that lowers blood pressure. Makes you urinate more. Take in morning to avoid night urination." },
  { name: "Hydrochlorothiazide 25mg", genericName: "Hydrochlorothiazide", strength: "25mg", form: "tablet", category: "Antihypertensive", summary: "Water pill that lowers blood pressure. Makes you urinate more. Take in morning to avoid night urination." },
  
  // Antidiabetics
  { name: "Metformin 500mg", genericName: "Metformin", strength: "500mg", form: "tablet", category: "Antidiabetic", summary: "Controls blood sugar in diabetes. First choice medicine for type 2 diabetes. Take with meals to reduce stomach upset." },
  { name: "Metformin 850mg", genericName: "Metformin", strength: "850mg", form: "tablet", category: "Antidiabetic", summary: "Controls blood sugar in diabetes. First choice medicine for type 2 diabetes. Take with meals to reduce stomach upset." },
  { name: "Metformin 1000mg", genericName: "Metformin", strength: "1000mg", form: "tablet", category: "Antidiabetic", summary: "Controls blood sugar in diabetes. First choice medicine for type 2 diabetes. Take with meals to reduce stomach upset." },
  { name: "Metformin XR 500mg", genericName: "Metformin Extended Release", strength: "500mg", form: "tablet", category: "Antidiabetic", summary: "Long-acting blood sugar control. Take once daily with evening meal. Causes less stomach problems than regular metformin." },
  { name: "Glimepiride 1mg", genericName: "Glimepiride", strength: "1mg", form: "tablet", category: "Antidiabetic", summary: "Helps pancreas make more insulin. Take before breakfast. Can cause low blood sugar - eat regular meals." },
  { name: "Glimepiride 2mg", genericName: "Glimepiride", strength: "2mg", form: "tablet", category: "Antidiabetic", summary: "Helps pancreas make more insulin. Take before breakfast. Can cause low blood sugar - eat regular meals." },
  { name: "Glimepiride 4mg", genericName: "Glimepiride", strength: "4mg", form: "tablet", category: "Antidiabetic", summary: "Helps pancreas make more insulin. Take before breakfast. Can cause low blood sugar - eat regular meals." },
  { name: "Sitagliptin 50mg", genericName: "Sitagliptin", strength: "50mg", form: "tablet", category: "Antidiabetic", summary: "Helps control blood sugar without causing low sugar. Take once daily with or without food. Safe for kidneys." },
  { name: "Sitagliptin 100mg", genericName: "Sitagliptin", strength: "100mg", form: "tablet", category: "Antidiabetic", summary: "Helps control blood sugar without causing low sugar. Take once daily with or without food. Safe for kidneys." },
  
  // Gastrointestinal
  { name: "Omeprazole 20mg", genericName: "Omeprazole", strength: "20mg", form: "capsule", category: "Gastrointestinal", summary: "Reduces stomach acid for ulcers and heartburn. Take before breakfast on empty stomach. Heals stomach and prevents damage." },
  { name: "Omeprazole 40mg", genericName: "Omeprazole", strength: "40mg", form: "capsule", category: "Gastrointestinal", summary: "Reduces stomach acid for ulcers and heartburn. Take before breakfast on empty stomach. Heals stomach and prevents damage." },
  { name: "Ranitidine 150mg", genericName: "Ranitidine", strength: "150mg", form: "tablet", category: "Gastrointestinal", summary: "Reduces stomach acid for heartburn and ulcers. Take twice daily or at bedtime. Works quickly to relieve symptoms." },
  { name: "Ranitidine 300mg", genericName: "Ranitidine", strength: "300mg", form: "tablet", category: "Gastrointestinal", summary: "Reduces stomach acid for heartburn and ulcers. Take twice daily or at bedtime. Works quickly to relieve symptoms." },
  { name: "Antacid Tablet 400mg/400mg", genericName: "Aluminum/Magnesium Hydroxide", strength: "400mg/400mg", form: "tablet", category: "Gastrointestinal", summary: "Quickly relieves heartburn and stomach pain. Chew tablets well before swallowing. Works immediately for acid relief." },
  { name: "Antacid Syrup", genericName: "Aluminum/Magnesium Hydroxide", strength: "various", form: "syrup", category: "Gastrointestinal", summary: "Quickly relieves heartburn and stomach pain. Liquid form works fast. Take after meals or when symptoms occur." },
  { name: "Loperamide 2mg", genericName: "Loperamide", strength: "2mg", form: "capsule", category: "Gastrointestinal", summary: "Stops diarrhea by slowing intestines. Take after each loose stool. Drink fluids to prevent dehydration." },
  { name: "Bisacodyl 5mg", genericName: "Bisacodyl", strength: "5mg", form: "tablet", category: "Gastrointestinal", summary: "Treats constipation. Take at bedtime for morning bowel movement. Drink plenty of water." },
  { name: "ORS (Oral Rehydration Salts)", genericName: "ORS", strength: "20.5g", form: "other", category: "Gastrointestinal", summary: "Replaces water and salts lost from diarrhea. Mix one sachet in 1 liter clean water. Essential for cholera and severe diarrhea." },
  
  // Antihistamines
  { name: "Cetirizine 5mg", genericName: "Cetirizine", strength: "5mg", form: "tablet", category: "Antihistamine", summary: "Treats allergies, itching and hives. Does not cause drowsiness. Take once daily for 24-hour relief." },
  { name: "Cetirizine 10mg", genericName: "Cetirizine", strength: "10mg", form: "tablet", category: "Antihistamine", summary: "Treats allergies, itching and hives. Does not cause drowsiness. Take once daily for 24-hour relief." },
  { name: "Cetirizine Syrup 5mg/5ml", genericName: "Cetirizine", strength: "5mg/5ml", form: "syrup", category: "Antihistamine", summary: "Liquid allergy medicine for children. Treats itching, rashes and runny nose. Give once daily." },
  { name: "Loratadine 10mg", genericName: "Loratadine", strength: "10mg", form: "tablet", category: "Antihistamine", summary: "Treats allergies without causing sleep. Good for hay fever and skin allergies. Take once daily." },
  { name: "Chlorpheniramine 4mg", genericName: "Chlorpheniramine", strength: "4mg", form: "tablet", category: "Antihistamine", summary: "Treats allergies and itching. May cause drowsiness. Take at bedtime if sleepy." },
  { name: "Chlorpheniramine Syrup 2mg/5ml", genericName: "Chlorpheniramine", strength: "2mg/5ml", form: "syrup", category: "Antihistamine", summary: "Liquid allergy medicine for children. Treats itching and runny nose. May make child sleepy." },
  
  // Respiratory
  { name: "Salbutamol 2mg", genericName: "Albuterol", strength: "2mg", form: "tablet", category: "Respiratory", summary: "Opens airways in asthma and breathing problems. Take when needed for wheezing. May cause shaking or fast heartbeat." },
  { name: "Salbutamol 4mg", genericName: "Albuterol", strength: "4mg", form: "tablet", category: "Respiratory", summary: "Opens airways in asthma and breathing problems. Take when needed for wheezing. May cause shaking or fast heartbeat." },
  { name: "Salbutamol Inhaler 100mcg", genericName: "Albuterol", strength: "100mcg", form: "inhaler", category: "Respiratory", summary: "Fast-acting inhaler for asthma attacks. Breathe in deeply when using. Works within minutes to open airways." },
  { name: "Montelukast 4mg Chewable", genericName: "Montelukast", strength: "4mg", form: "tablet", category: "Respiratory", summary: "Prevents asthma attacks in children. Chew tablet before swallowing. Take daily even when feeling well." },
  { name: "Montelukast 5mg Chewable", genericName: "Montelukast", strength: "5mg", form: "tablet", category: "Respiratory", summary: "Prevents asthma attacks in children. Chew tablet before swallowing. Take daily even when feeling well." },
  { name: "Montelukast 10mg", genericName: "Montelukast", strength: "10mg", form: "tablet", category: "Respiratory", summary: "Prevents asthma attacks and allergies. Take once daily in evening. Not for acute asthma attacks." },
  { name: "Pseudoephedrine 30mg", genericName: "Pseudoephedrine", strength: "30mg", form: "tablet", category: "Respiratory", summary: "Unblocks stuffy nose from colds. Take during day not at bedtime. May cause difficulty sleeping." },
  { name: "Pseudoephedrine 60mg", genericName: "Pseudoephedrine", strength: "60mg", form: "tablet", category: "Respiratory", summary: "Unblocks stuffy nose from colds. Take during day not at bedtime. May cause difficulty sleeping." },
  { name: "Cough Syrup", genericName: "Various", strength: "100ml", form: "syrup", category: "Respiratory", summary: "Relieves cough and loosens mucus. Check if for dry or wet cough. Take as directed on label." },
  
  // Vitamins & Supplements
  { name: "Vitamin C 500mg", genericName: "Ascorbic Acid", strength: "500mg", form: "tablet", category: "Vitamin", summary: "Boosts immunity and helps wound healing. Prevents scurvy. Take daily for general health." },
  { name: "Vitamin C 1000mg", genericName: "Ascorbic Acid", strength: "1000mg", form: "tablet", category: "Vitamin", summary: "Boosts immunity and helps wound healing. Prevents scurvy. Take daily for general health." },
  { name: "Vitamin D3 1000 IU", genericName: "Cholecalciferol", strength: "1000 IU", form: "capsule", category: "Vitamin", summary: "Strengthens bones and immune system. Important for children and pregnant women. Take daily." },
  { name: "Vitamin D3 2000 IU", genericName: "Cholecalciferol", strength: "2000 IU", form: "capsule", category: "Vitamin", summary: "Strengthens bones and immune system. Important for children and pregnant women. Take daily." },
  { name: "Vitamin D3 5000 IU", genericName: "Cholecalciferol", strength: "5000 IU", form: "capsule", category: "Vitamin", summary: "Strengthens bones and immune system. Important for children and pregnant women. Take daily." },
  { name: "Multivitamin Adult Formula", genericName: "Multivitamin", strength: "various", form: "tablet", category: "Vitamin", summary: "Contains many vitamins and minerals. Helps prevent deficiency. Take one daily with food." },
  { name: "Folic Acid 400mcg", genericName: "Folic Acid", strength: "400mcg", form: "tablet", category: "Vitamin", summary: "Essential for pregnant women to prevent birth defects. Also treats anemia. Take daily before and during pregnancy." },
  { name: "Folic Acid 5mg", genericName: "Folic Acid", strength: "5mg", form: "tablet", category: "Vitamin", summary: "Treats severe folic acid deficiency and certain anemias. Higher dose for treatment. Take as prescribed." },
  { name: "Iron (Ferrous Sulfate) 200mg", genericName: "Ferrous Sulfate", strength: "200mg", form: "tablet", category: "Vitamin", summary: "Treats and prevents iron deficiency anemia. Important in pregnancy. Take on empty stomach with vitamin C for better absorption." },
  { name: "Vitamin B Complex", genericName: "Vitamin B Complex", strength: "various", form: "tablet", category: "Vitamin", summary: "Contains B vitamins for energy and nerve health. Helps prevent deficiency. Take once daily." },
  { name: "Zinc Sulfate 20mg", genericName: "Zinc Sulfate", strength: "20mg", form: "tablet", category: "Vitamin", summary: "Boosts immunity and helps wounds heal. Important for children's growth. Take with food to avoid nausea." },
  
  // Antimalarials - First-Line Treatments (ACTs)
  { name: "Artemether+Lumefantrine (Coartem)", genericName: "Artemether-Lumefantrine", strength: "20mg/120mg", form: "tablet", category: "Antimalarial • ACT", summary: "First-line treatment for uncomplicated malaria. Take twice daily for 3 days with food or milk. Very effective when full course is completed." },
  { name: "Artesunate-Amodiaquine (AS-AQ)", genericName: "Artesunate-Amodiaquine", strength: "100mg/270mg", form: "tablet", category: "Antimalarial • ACT", summary: "First-line malaria treatment in South Sudan. Take once daily for 3 days. Cures malaria in 95% of cases when taken correctly." },
  { name: "Artesunate-Amodiaquine Pediatric 25mg/67.5mg", genericName: "Artesunate-Amodiaquine", strength: "25mg/67.5mg", form: "tablet", category: "Antimalarial • ACT • Pediatric", summary: "Pediatric dose for young children. Take once daily for 3 days. First-line treatment in South Sudan." },
  { name: "Artesunate-Amodiaquine Pediatric 50mg/135mg", genericName: "Artesunate-Amodiaquine", strength: "50mg/135mg", form: "tablet", category: "Antimalarial • ACT • Pediatric", summary: "Pediatric dose for children. Take once daily for 3 days. First-line treatment in South Sudan." },
  { name: "Dihydroartemisinin-Piperaquine (DHA-PPQ)", genericName: "Dihydroartemisinin-Piperaquine", strength: "40mg/320mg", form: "tablet", category: "Antimalarial • ACT", summary: "Alternative first-line treatment for malaria. Take once daily for 3 days. Longer protection against re-infection compared to other ACTs." },
  { name: "Dihydroartemisinin-Piperaquine Pediatric", genericName: "Dihydroartemisinin-Piperaquine", strength: "20mg/160mg", form: "tablet", category: "Antimalarial • ACT • Pediatric", summary: "Pediatric formulation. Take once daily for 3 days. Longer protection against re-infection." },
  { name: "Artesunate-Mefloquine (AS-MQ)", genericName: "Artesunate-Mefloquine", strength: "100mg/250mg", form: "tablet", category: "Antimalarial • ACT", summary: "Treats malaria in areas with drug resistance. Take once daily for 3 days. Not for pregnant women in first trimester." },
  { name: "Artesunate-Sulfadoxine-Pyrimethamine", genericName: "Artesunate-SP", strength: "fixed-dose", form: "tablet", category: "Antimalarial • ACT", summary: "Combination malaria treatment. Effective where parasites remain sensitive to sulfadoxine-pyrimethamine." },
  
  // Antimalarials - Severe Malaria Treatments
  { name: "Artesunate Injectable", genericName: "Artesunate", strength: "60mg", form: "injection", category: "Antimalarial • Emergency • Injection", summary: "EMERGENCY treatment for severe malaria. Given by injection when patient cannot swallow or has severe disease. Can save lives within hours." },
  { name: "Artemether Injectable", genericName: "Artemether", strength: "80mg/mL", form: "injection", category: "Antimalarial • Emergency • Injection", summary: "Injectable treatment for severe malaria when artesunate not available. Given by muscle injection." },
  { name: "Quinine Injectable", genericName: "Quinine", strength: "300mg/mL", form: "injection", category: "Antimalarial • Emergency • Injection", summary: "Alternative treatment for severe malaria. Given slowly by IV drip. Requires close monitoring for side effects." },
  { name: "Quinine 300mg", genericName: "Quinine", strength: "300mg", form: "tablet", category: "Antimalarial • Tablet", summary: "Older malaria treatment, now second-line. Take 3 times daily for 7 days. Often combined with antibiotic for better cure." },
  { name: "Quinine 200mg", genericName: "Quinine", strength: "200mg", form: "tablet", category: "Antimalarial • Tablet", summary: "Lower dose for children or smaller adults. Take 3 times daily for 7 days. May cause ringing in ears and dizziness." },
  
  // Antimalarials - Prevention Medications
  { name: "Atovaquone-Proguanil (Malarone) Adult", genericName: "Atovaquone-Proguanil", strength: "250mg/100mg", form: "tablet", category: "Antimalarial • Prevention", summary: "Prevents malaria for travelers. Take daily starting 1-2 days before travel. Safe for children and short-term use." },
  { name: "Atovaquone-Proguanil Pediatric", genericName: "Atovaquone-Proguanil", strength: "62.5mg/25mg", form: "tablet", category: "Antimalarial • Prevention • Pediatric", summary: "Pediatric malaria prevention. Take daily starting before travel. Safe for children." },
  { name: "Doxycycline 100mg", genericName: "Doxycycline", strength: "100mg", form: "capsule", category: "Antibiotic • Antimalarial Prevention", summary: "Prevents malaria when taken daily. Also treats infections. Not for children under 8 or pregnant women. Take with food." },
  { name: "Mefloquine 250mg", genericName: "Mefloquine", strength: "250mg", form: "tablet", category: "Antimalarial • Prevention", summary: "Weekly malaria prevention for travelers. Start 2 weeks before travel. Not for people with mental health conditions." },
  { name: "Sulfadoxine-Pyrimethamine (SP, Fansidar)", genericName: "Sulfadoxine-Pyrimethamine", strength: "500mg/25mg", form: "tablet", category: "Antimalarial • Prevention", summary: "Used for malaria prevention in pregnant women (IPTp). Given monthly during pregnancy. Also prevents malaria in young children." },
  { name: "Primaquine 15mg", genericName: "Primaquine", strength: "15mg", form: "tablet", category: "Antimalarial", summary: "Prevents malaria relapse from certain types. Requires G6PD blood test before use. Not for pregnant women." },
  { name: "Primaquine 7.5mg", genericName: "Primaquine", strength: "7.5mg", form: "tablet", category: "Antimalarial", summary: "Lower dose for children or G6PD testing. Prevents relapse. Not for pregnant women." },
  { name: "Chloroquine 250mg", genericName: "Chloroquine", strength: "250mg", form: "tablet", category: "Antimalarial", summary: "Old malaria drug. Now only used where parasites remain sensitive (rare in Africa). Also treats some autoimmune diseases." },
  { name: "Chloroquine Syrup 50mg/5mL", genericName: "Chloroquine", strength: "50mg/5mL", form: "syrup", category: "Antimalarial", summary: "Liquid form for children. Limited use due to resistance. Also for autoimmune diseases." },
  
  // Antimalarials - Pediatric-Specific Formulations
  { name: "Artemether-Lumefantrine Dispersible", genericName: "Artemether-Lumefantrine", strength: "20mg/120mg", form: "tablet", category: "Antimalarial • ACT • Pediatric", summary: "Child-friendly malaria tablets that dissolve in water. Taste better for children. Same effectiveness as adult tablets." },
  { name: "Artesunate Suppositories", genericName: "Artesunate", strength: "pediatric", form: "other", category: "Antimalarial • Emergency • Pediatric", summary: "Emergency treatment for children with severe malaria who cannot swallow. Insert rectally before transferring to hospital." },
  
  // Antiparasitics
  { name: "Albendazole 400mg", genericName: "Albendazole", strength: "400mg", form: "tablet", category: "Antiparasitic", summary: "Kills intestinal worms. Single dose for most worms. Take with fatty food for better absorption." },
  { name: "Mebendazole 100mg", genericName: "Mebendazole", strength: "100mg", form: "tablet", category: "Antiparasitic", summary: "Treats pinworms and other intestinal worms. Take twice daily for 3 days. May need to repeat after 2 weeks." },
  
  // Injectable Antibiotics
  { name: "Ceftriaxone Injection 250mg", genericName: "Ceftriaxone", strength: "250mg", form: "injection", category: "Antibiotic", summary: "Strong injectable antibiotic for severe infections. Treats pneumonia, meningitis and sepsis. Given once or twice daily." },
  { name: "Ceftriaxone Injection 500mg", genericName: "Ceftriaxone", strength: "500mg", form: "injection", category: "Antibiotic", summary: "Strong injectable antibiotic for severe infections. Treats pneumonia, meningitis and sepsis. Given once or twice daily." },
  { name: "Ceftriaxone Injection 1g", genericName: "Ceftriaxone", strength: "1g", form: "injection", category: "Antibiotic", summary: "Strong injectable antibiotic for severe infections. Treats pneumonia, meningitis and sepsis. Given once or twice daily." },
  { name: "Ceftriaxone Injection 2g", genericName: "Ceftriaxone", strength: "2g", form: "injection", category: "Antibiotic", summary: "Strong injectable antibiotic for severe infections. Treats pneumonia, meningitis and sepsis. Given once or twice daily." },
  { name: "Cefotaxime Injection 500mg", genericName: "Cefotaxime", strength: "500mg", form: "injection", category: "Antibiotic", summary: "Injectable antibiotic for serious infections. Similar to ceftriaxone. Given every 6-8 hours." },
  { name: "Cefotaxime Injection 1g", genericName: "Cefotaxime", strength: "1g", form: "injection", category: "Antibiotic", summary: "Injectable antibiotic for serious infections. Similar to ceftriaxone. Given every 6-8 hours." },
  { name: "Gentamicin Injection 40mg/ml", genericName: "Gentamicin", strength: "40mg/ml", form: "injection", category: "Antibiotic", summary: "Strong antibiotic for severe infections. Can harm kidneys and ears if used incorrectly. Monitor patient closely." },
  { name: "Gentamicin Injection 80mg/2ml", genericName: "Gentamicin", strength: "80mg/2ml", form: "injection", category: "Antibiotic", summary: "Strong antibiotic for severe infections. Can harm kidneys and ears if used incorrectly. Monitor patient closely." },
  { name: "Ampicillin Injection 500mg", genericName: "Ampicillin", strength: "500mg", form: "injection", category: "Antibiotic", summary: "Injectable penicillin-type antibiotic. Treats meningitis, pneumonia and sepsis. Give every 6 hours." },
  { name: "Ampicillin Injection 1g", genericName: "Ampicillin", strength: "1g", form: "injection", category: "Antibiotic", summary: "Injectable penicillin-type antibiotic. Treats meningitis, pneumonia and sepsis. Give every 6 hours." },
  { name: "Penicillin G Injection 1MU", genericName: "Penicillin G", strength: "1MU", form: "injection", category: "Antibiotic", summary: "Classic injectable penicillin for severe infections. Treats pneumonia and meningitis. Give multiple times daily." },
  { name: "Penicillin G Injection 5MU", genericName: "Penicillin G", strength: "5MU", form: "injection", category: "Antibiotic", summary: "Classic injectable penicillin for severe infections. Treats pneumonia and meningitis. Give multiple times daily." },
  { name: "Benzathine Penicillin Injection 1.2MU", genericName: "Benzathine Penicillin", strength: "1.2MU", form: "injection", category: "Antibiotic", summary: "Long-acting penicillin injection. Treats syphilis and prevents rheumatic fever. Single dose lasts weeks." },
  { name: "Benzathine Penicillin Injection 2.4MU", genericName: "Benzathine Penicillin", strength: "2.4MU", form: "injection", category: "Antibiotic", summary: "Long-acting penicillin injection. Treats syphilis and prevents rheumatic fever. Single dose lasts weeks." },
  { name: "Cefuroxime Injection 750mg", genericName: "Cefuroxime", strength: "750mg", form: "injection", category: "Antibiotic", summary: "Injectable antibiotic for pneumonia and surgical infections. Give every 8 hours. Safe for most patients." },
  { name: "Cefuroxime Injection 1.5g", genericName: "Cefuroxime", strength: "1.5g", form: "injection", category: "Antibiotic", summary: "Injectable antibiotic for pneumonia and surgical infections. Give every 8 hours. Safe for most patients." },
  { name: "Amikacin Injection 250mg", genericName: "Amikacin", strength: "250mg", form: "injection", category: "Antibiotic", summary: "Very strong antibiotic for resistant infections. Can harm kidneys and hearing. Use only when needed." },
  { name: "Amikacin Injection 500mg", genericName: "Amikacin", strength: "500mg", form: "injection", category: "Antibiotic", summary: "Very strong antibiotic for resistant infections. Can harm kidneys and hearing. Use only when needed." },
  { name: "Vancomycin Injection 500mg", genericName: "Vancomycin", strength: "500mg", form: "injection", category: "Antibiotic", summary: "Reserved for serious resistant infections. Give slowly by IV drip. Monitor kidney function." },
  { name: "Vancomycin Injection 1g", genericName: "Vancomycin", strength: "1g", form: "injection", category: "Antibiotic", summary: "Reserved for serious resistant infections. Give slowly by IV drip. Monitor kidney function." },
  { name: "Meropenem Injection 500mg", genericName: "Meropenem", strength: "500mg", form: "injection", category: "Antibiotic", summary: "Most powerful antibiotic for life-threatening infections. Reserve for critical cases. Give every 8 hours." },
  { name: "Meropenem Injection 1g", genericName: "Meropenem", strength: "1g", form: "injection", category: "Antibiotic", summary: "Most powerful antibiotic for life-threatening infections. Reserve for critical cases. Give every 8 hours." },
  
  // More Oral Antibiotics
  { name: "Erythromycin 250mg", genericName: "Erythromycin", strength: "250mg", form: "tablet", category: "Antibiotic", summary: "Alternative to penicillin for allergic patients. Treats chest and skin infections. Take on empty stomach." },
  { name: "Erythromycin 500mg", genericName: "Erythromycin", strength: "500mg", form: "tablet", category: "Antibiotic", summary: "Alternative to penicillin for allergic patients. Treats chest and skin infections. Take on empty stomach." },
  { name: "Nitrofurantoin 50mg", genericName: "Nitrofurantoin", strength: "50mg", form: "capsule", category: "Antibiotic", summary: "Specific antibiotic for urinary tract infections. Take with food and plenty of water. Urine may turn dark yellow." },
  { name: "Nitrofurantoin 100mg", genericName: "Nitrofurantoin", strength: "100mg", form: "capsule", category: "Antibiotic", summary: "Specific antibiotic for urinary tract infections. Take with food and plenty of water. Urine may turn dark yellow." },
  { name: "Norfloxacin 400mg", genericName: "Norfloxacin", strength: "400mg", form: "tablet", category: "Antibiotic", summary: "Treats urinary and stomach infections. Take on empty stomach with water. Avoid dairy products." },
  { name: "Ofloxacin 200mg", genericName: "Ofloxacin", strength: "200mg", form: "tablet", category: "Antibiotic", summary: "Treats urinary, eye and ear infections. Broad-spectrum antibiotic. Take twice daily with water." },
  { name: "Ofloxacin 400mg", genericName: "Ofloxacin", strength: "400mg", form: "tablet", category: "Antibiotic", summary: "Treats urinary, eye and ear infections. Broad-spectrum antibiotic. Take twice daily with water." },
  { name: "Levofloxacin 250mg", genericName: "Levofloxacin", strength: "250mg", form: "tablet", category: "Antibiotic", summary: "Strong antibiotic for chest, urinary and sinus infections. Take once daily. Avoid sun exposure." },
  { name: "Levofloxacin 500mg", genericName: "Levofloxacin", strength: "500mg", form: "tablet", category: "Antibiotic", summary: "Strong antibiotic for chest, urinary and sinus infections. Take once daily. Avoid sun exposure." },
  { name: "Levofloxacin 750mg", genericName: "Levofloxacin", strength: "750mg", form: "tablet", category: "Antibiotic", summary: "Strong antibiotic for chest, urinary and sinus infections. Take once daily. Avoid sun exposure." },
  { name: "Clarithromycin 250mg", genericName: "Clarithromycin", strength: "250mg", form: "tablet", category: "Antibiotic", summary: "Treats chest infections and stomach ulcers with H. pylori. Similar to erythromycin but better tolerated. Take with food." },
  { name: "Clarithromycin 500mg", genericName: "Clarithromycin", strength: "500mg", form: "tablet", category: "Antibiotic", summary: "Treats chest infections and stomach ulcers with H. pylori. Similar to erythromycin but better tolerated. Take with food." },
  
  // IV Fluids & Solutions
  { name: "Normal Saline (0.9% NaCl) 500ml", genericName: "Sodium Chloride", strength: "0.9%", form: "other", category: "IV Fluid", summary: "Basic IV fluid for dehydration and medication dilution. Replaces water and salt. Safe for most patients." },
  { name: "Normal Saline (0.9% NaCl) 1000ml", genericName: "Sodium Chloride", strength: "0.9%", form: "other", category: "IV Fluid", summary: "Basic IV fluid for dehydration and medication dilution. Replaces water and salt. Safe for most patients." },
  { name: "Ringer's Lactate 500ml", genericName: "Ringer's Lactate", strength: "500ml", form: "other", category: "IV Fluid", summary: "Balanced IV fluid for dehydration and shock. Better than saline for severe fluid loss. Contains electrolytes." },
  { name: "Ringer's Lactate 1000ml", genericName: "Ringer's Lactate", strength: "1000ml", form: "other", category: "IV Fluid", summary: "Balanced IV fluid for dehydration and shock. Better than saline for severe fluid loss. Contains electrolytes." },
  { name: "Dextrose 5% 500ml", genericName: "Dextrose", strength: "5%", form: "other", category: "IV Fluid", summary: "Sugar water IV fluid for hydration and low blood sugar. Provides calories and water. Monitor blood sugar." },
  { name: "Dextrose 5% 1000ml", genericName: "Dextrose", strength: "5%", form: "other", category: "IV Fluid", summary: "Sugar water IV fluid for hydration and low blood sugar. Provides calories and water. Monitor blood sugar." },
  { name: "Dextrose Saline 500ml", genericName: "Dextrose Saline", strength: "500ml", form: "other", category: "IV Fluid", summary: "Combination of sugar and salt IV fluid. Good for general hydration. Provides both calories and electrolytes." },
  { name: "Dextrose Saline 1000ml", genericName: "Dextrose Saline", strength: "1000ml", form: "other", category: "IV Fluid", summary: "Combination of sugar and salt IV fluid. Good for general hydration. Provides both calories and electrolytes." },
  
  // Antiemetics
  { name: "Ondansetron 4mg", genericName: "Ondansetron", strength: "4mg", form: "tablet", category: "Antiemetic", summary: "Prevents nausea and vomiting. Very effective and safe. Take before chemotherapy or after surgery." },
  { name: "Ondansetron 8mg", genericName: "Ondansetron", strength: "8mg", form: "tablet", category: "Antiemetic", summary: "Prevents nausea and vomiting. Very effective and safe. Take before chemotherapy or after surgery." },
  { name: "Ondansetron Injection 4mg/2ml", genericName: "Ondansetron", strength: "4mg/2ml", form: "injection", category: "Antiemetic", summary: "Injectable form to stop severe vomiting. Works quickly. Give slowly by IV or IM injection." },
  { name: "Ondansetron Injection 8mg/4ml", genericName: "Ondansetron", strength: "8mg/4ml", form: "injection", category: "Antiemetic", summary: "Injectable form to stop severe vomiting. Works quickly. Give slowly by IV or IM injection." },
  { name: "Metoclopramide 10mg", genericName: "Metoclopramide", strength: "10mg", form: "tablet", category: "Antiemetic", summary: "Stops vomiting and helps stomach empty. Take 30 minutes before meals. May cause drowsiness." },
  { name: "Metoclopramide Injection 10mg/2ml", genericName: "Metoclopramide", strength: "10mg/2ml", form: "injection", category: "Antiemetic", summary: "Stops severe vomiting quickly. Give by IM or slow IV injection. Watch for muscle spasms in young patients." },
  { name: "Domperidone 10mg", genericName: "Domperidone", strength: "10mg", form: "tablet", category: "Antiemetic", summary: "Prevents nausea and bloating. Helps stomach work better. Take before meals 3 times daily." },
  
  // Antacids/PPIs
  { name: "Pantoprazole 20mg", genericName: "Pantoprazole", strength: "20mg", form: "tablet", category: "Gastrointestinal", summary: "Reduces stomach acid like omeprazole. Treats ulcers and reflux. Take before breakfast." },
  { name: "Pantoprazole 40mg", genericName: "Pantoprazole", strength: "40mg", form: "tablet", category: "Gastrointestinal", summary: "Reduces stomach acid like omeprazole. Treats ulcers and reflux. Take before breakfast." },
  { name: "Esomeprazole 20mg", genericName: "Esomeprazole", strength: "20mg", form: "capsule", category: "Gastrointestinal", summary: "Strong acid reducer for ulcers and heartburn. Take 30 minutes before eating. Works all day." },
  { name: "Esomeprazole 40mg", genericName: "Esomeprazole", strength: "40mg", form: "capsule", category: "Gastrointestinal", summary: "Strong acid reducer for ulcers and heartburn. Take 30 minutes before eating. Works all day." },
  { name: "Lansoprazole 15mg", genericName: "Lansoprazole", strength: "15mg", form: "capsule", category: "Gastrointestinal", summary: "Reduces stomach acid for ulcers. Similar to omeprazole. Take before meals on empty stomach." },
  { name: "Lansoprazole 30mg", genericName: "Lansoprazole", strength: "30mg", form: "capsule", category: "Gastrointestinal", summary: "Reduces stomach acid for ulcers. Similar to omeprazole. Take before meals on empty stomach." },
  
  // Steroids
  { name: "Dexamethasone 0.5mg", genericName: "Dexamethasone", strength: "0.5mg", form: "tablet", category: "Corticosteroid", summary: "Strong steroid for inflammation and allergies. Used for asthma, allergic reactions and brain swelling. Take with food." },
  { name: "Dexamethasone 4mg", genericName: "Dexamethasone", strength: "4mg", form: "tablet", category: "Corticosteroid", summary: "Strong steroid for inflammation and allergies. Used for asthma, allergic reactions and brain swelling. Take with food." },
  { name: "Dexamethasone Injection 4mg/ml", genericName: "Dexamethasone", strength: "4mg/ml", form: "injection", category: "Corticosteroid", summary: "Injectable steroid for severe allergies and inflammation. Works quickly for emergencies. Give by IV or IM." },
  { name: "Hydrocortisone Injection 100mg", genericName: "Hydrocortisone", strength: "100mg", form: "injection", category: "Corticosteroid", summary: "Emergency steroid for shock and severe allergic reactions. Life-saving in emergencies. Give by IV injection." },
  { name: "Hydrocortisone Injection 250mg", genericName: "Hydrocortisone", strength: "250mg", form: "injection", category: "Corticosteroid", summary: "Emergency steroid for shock and severe allergic reactions. Life-saving in emergencies. Give by IV injection." },
  { name: "Methylprednisolone Injection 40mg", genericName: "Methylprednisolone", strength: "40mg", form: "injection", category: "Corticosteroid", summary: "Strong steroid injection for allergies and inflammation. Used for asthma attacks and joint pain. Give by IM or IV." },
  { name: "Methylprednisolone Injection 125mg", genericName: "Methylprednisolone", strength: "125mg", form: "injection", category: "Corticosteroid", summary: "Strong steroid injection for allergies and inflammation. Used for asthma attacks and joint pain. Give by IM or IV." },
  { name: "Methylprednisolone Injection 500mg", genericName: "Methylprednisolone", strength: "500mg", form: "injection", category: "Corticosteroid", summary: "Strong steroid injection for allergies and inflammation. Used for asthma attacks and joint pain. Give by IM or IV." },
  
  // Antispasmodics
  { name: "Hyoscine (Buscopan) 10mg", genericName: "Hyoscine Butylbromide", strength: "10mg", form: "tablet", category: "Antispasmodic", summary: "Relieves stomach and intestinal cramps. Good for colic pain and menstrual cramps. Take when pain occurs." },
  { name: "Hyoscine Injection 20mg/ml", genericName: "Hyoscine Butylbromide", strength: "20mg/ml", form: "injection", category: "Antispasmodic", summary: "Quickly relieves severe stomach or intestinal cramps. Give by IM or slow IV injection. Works within minutes." },
  { name: "Dicyclomine 10mg", genericName: "Dicyclomine", strength: "10mg", form: "tablet", category: "Antispasmodic", summary: "Treats stomach cramps and irritable bowel syndrome. Reduces intestinal spasms. Take before meals." },
  { name: "Dicyclomine 20mg", genericName: "Dicyclomine", strength: "20mg", form: "tablet", category: "Antispasmodic", summary: "Treats stomach cramps and irritable bowel syndrome. Reduces intestinal spasms. Take before meals." },
  
  // Sedatives/Anxiolytics
  { name: "Diazepam 5mg", genericName: "Diazepam", strength: "5mg", form: "tablet", category: "Sedative", summary: "Calms anxiety and relaxes muscles. Also treats seizures. Can be addictive - use short term only." },
  { name: "Diazepam 10mg", genericName: "Diazepam", strength: "10mg", form: "tablet", category: "Sedative", summary: "Calms anxiety and relaxes muscles. Also treats seizures. Can be addictive - use short term only." },
  { name: "Diazepam Injection 5mg/ml", genericName: "Diazepam", strength: "5mg/ml", form: "injection", category: "Sedative", summary: "Emergency medicine for seizures and severe anxiety. Give slowly by IV. Keep patient monitored." },
  { name: "Lorazepam 1mg", genericName: "Lorazepam", strength: "1mg", form: "tablet", category: "Sedative", summary: "Treats anxiety and helps with sleep. Shorter acting than diazepam. Take at bedtime or as needed." },
  { name: "Lorazepam 2mg", genericName: "Lorazepam", strength: "2mg", form: "tablet", category: "Sedative", summary: "Treats anxiety and helps with sleep. Shorter acting than diazepam. Take at bedtime or as needed." },
  { name: "Midazolam Injection 5mg/ml", genericName: "Midazolam", strength: "5mg/ml", form: "injection", category: "Sedative", summary: "Strong sedative for procedures and seizures. Give by IV or IM. Monitor breathing closely." },
  
  // Local Anesthetics
  { name: "Lidocaine 1% Injection", genericName: "Lidocaine", strength: "1%", form: "injection", category: "Anesthetic", summary: "Numbs area for minor surgery and stitches. Works quickly and safely. Inject under skin around wound." },
  { name: "Lidocaine 2% Injection", genericName: "Lidocaine", strength: "2%", form: "injection", category: "Anesthetic", summary: "Stronger numbing medicine for procedures. Works quickly and safely. Inject under skin around wound." },
  { name: "Lidocaine with Epinephrine Injection", genericName: "Lidocaine with Epinephrine", strength: "1%", form: "injection", category: "Anesthetic", summary: "Numbing medicine with blood vessel constrictor. Lasts longer and reduces bleeding. Do not use on fingers or toes." },
  
  // Emergency Medications
  { name: "Adrenaline (Epinephrine) 1mg/ml Injection", genericName: "Epinephrine", strength: "1mg/ml", form: "injection", category: "Emergency", summary: "Life-saving medicine for severe allergic reactions and cardiac arrest. Give immediately by IM injection in emergency. Keep available always." },
  { name: "Atropine 0.5mg/ml Injection", genericName: "Atropine", strength: "0.5mg/ml", form: "injection", category: "Emergency", summary: "Emergency medicine for slow heart rate and certain poisonings. Give by IV or IM injection. Works within minutes." },
  { name: "Atropine 1mg/ml Injection", genericName: "Atropine", strength: "1mg/ml", form: "injection", category: "Emergency", summary: "Emergency medicine for slow heart rate and certain poisonings. Give by IV or IM injection. Works within minutes." },
  { name: "Aminophylline Injection 250mg/10ml", genericName: "Aminophylline", strength: "250mg/10ml", form: "injection", category: "Emergency", summary: "Emergency medicine for severe asthma attacks. Give slowly by IV drip. Monitor heart rate and breathing." },
  { name: "Furosemide (Lasix) 20mg", genericName: "Furosemide", strength: "20mg", form: "tablet", category: "Diuretic", summary: "Water pill for heart failure and fluid retention. Makes you urinate more. Take in morning to avoid night urination." },
  { name: "Furosemide (Lasix) 40mg", genericName: "Furosemide", strength: "40mg", form: "tablet", category: "Diuretic", summary: "Water pill for heart failure and fluid retention. Makes you urinate more. Take in morning to avoid night urination." },
  { name: "Furosemide Injection 20mg/2ml", genericName: "Furosemide", strength: "20mg/2ml", form: "injection", category: "Diuretic", summary: "Emergency water pill for heart failure and lung fluid. Works quickly by IV injection. Monitor blood pressure." },
  
  // Other Common Drugs
  { name: "Prednisolone 5mg", genericName: "Prednisolone", strength: "5mg", form: "tablet", category: "Corticosteroid", summary: "Steroid for inflammation, asthma and allergies. Take with food in morning. Do not stop suddenly after long use." },
  { name: "Prednisolone 10mg", genericName: "Prednisolone", strength: "10mg", form: "tablet", category: "Corticosteroid", summary: "Steroid for inflammation, asthma and allergies. Take with food in morning. Do not stop suddenly after long use." },
  { name: "Prednisolone 20mg", genericName: "Prednisolone", strength: "20mg", form: "tablet", category: "Corticosteroid", summary: "Steroid for inflammation, asthma and allergies. Take with food in morning. Do not stop suddenly after long use." },
  { name: "Tramadol 50mg", genericName: "Tramadol", strength: "50mg", form: "capsule", category: "Analgesic", summary: "Moderate to strong pain reliever. Good for chronic pain. Can cause drowsiness and constipation." },
  { name: "Tramadol 100mg", genericName: "Tramadol", strength: "100mg", form: "capsule", category: "Analgesic", summary: "Moderate to strong pain reliever. Good for chronic pain. Can cause drowsiness and constipation." },
  { name: "Tramadol Injection 50mg/ml", genericName: "Tramadol", strength: "50mg/ml", form: "injection", category: "Analgesic", summary: "Injectable pain reliever for moderate to severe pain. Give by IM or slow IV. Monitor for drowsiness." },
  { name: "Ranitidine Injection 50mg/2ml", genericName: "Ranitidine", strength: "50mg/2ml", form: "injection", category: "Gastrointestinal", summary: "Injectable acid reducer for severe ulcers. Give by slow IV or IM injection. Prevents stress ulcers in critical patients." },
  { name: "Aminophylline 100mg", genericName: "Aminophylline", strength: "100mg", form: "tablet", category: "Respiratory", summary: "Opens airways in asthma and breathing problems. Take regularly to prevent attacks. May cause nausea and fast heartbeat." },
  { name: "Aminophylline 200mg", genericName: "Aminophylline", strength: "200mg", form: "tablet", category: "Respiratory", summary: "Opens airways in asthma and breathing problems. Take regularly to prevent attacks. May cause nausea and fast heartbeat." },
  { name: "Theophylline 100mg", genericName: "Theophylline", strength: "100mg", form: "tablet", category: "Respiratory", summary: "Long-acting medicine for asthma prevention. Take twice daily at same times. Monitor blood levels if possible." },
  { name: "Theophylline 200mg", genericName: "Theophylline", strength: "200mg", form: "tablet", category: "Respiratory", summary: "Long-acting medicine for asthma prevention. Take twice daily at same times. Monitor blood levels if possible." },
  { name: "Theophylline 300mg", genericName: "Theophylline", strength: "300mg", form: "tablet", category: "Respiratory", summary: "Long-acting medicine for asthma prevention. Take twice daily at same times. Monitor blood levels if possible." },
  { name: "Calcium Gluconate Injection 10%", genericName: "Calcium Gluconate", strength: "10%", form: "injection", category: "Electrolyte", summary: "Replaces low calcium in emergencies. Treats eclampsia and calcium deficiency. Give slowly by IV to avoid heart problems." },
  { name: "Magnesium Sulfate Injection 50%", genericName: "Magnesium Sulfate", strength: "50%", form: "injection", category: "Electrolyte", summary: "Emergency treatment for eclampsia in pregnancy. Also treats low magnesium and certain seizures. Give by IM or IV drip." },
  { name: "Potassium Chloride tablets/solution", genericName: "Potassium Chloride", strength: "600mg", form: "tablet", category: "Electrolyte", summary: "Replaces potassium lost from diarrhea or water pills. Take with food and water. Important for heart function." },
  { name: "Ferrous Fumarate 200mg", genericName: "Ferrous Fumarate", strength: "200mg", form: "tablet", category: "Vitamin", summary: "Iron supplement for anemia. Similar to ferrous sulfate. Take on empty stomach with vitamin C for better absorption." },
  { name: "Tranexamic Acid 500mg", genericName: "Tranexamic Acid", strength: "500mg", form: "tablet", category: "Hemostatic", summary: "Stops bleeding by helping blood clot. Used for heavy periods and after delivery. Take 3 times daily when bleeding." },
  { name: "Tranexamic Acid Injection 500mg/5ml", genericName: "Tranexamic Acid", strength: "500mg/5ml", form: "injection", category: "Hemostatic", summary: "Stops severe bleeding quickly. Life-saving after delivery and in trauma. Give by slow IV injection." },
  { name: "Warfarin 2mg", genericName: "Warfarin", strength: "2mg", form: "tablet", category: "Anticoagulant", summary: "Blood thinner to prevent clots. Requires regular blood tests. Avoid foods high in vitamin K." },
  { name: "Warfarin 5mg", genericName: "Warfarin", strength: "5mg", form: "tablet", category: "Anticoagulant", summary: "Blood thinner to prevent clots. Requires regular blood tests. Avoid foods high in vitamin K." },
  { name: "Levothyroxine 50mcg", genericName: "Levothyroxine", strength: "50mcg", form: "tablet", category: "Thyroid", summary: "Replaces thyroid hormone in hypothyroidism. Take on empty stomach in morning. Need for life." },
  { name: "Levothyroxine 75mcg", genericName: "Levothyroxine", strength: "75mcg", form: "tablet", category: "Thyroid", summary: "Replaces thyroid hormone in hypothyroidism. Take on empty stomach in morning. Need for life." },
  { name: "Levothyroxine 100mcg", genericName: "Levothyroxine", strength: "100mcg", form: "tablet", category: "Thyroid", summary: "Replaces thyroid hormone in hypothyroidism. Take on empty stomach in morning. Need for life." },
  { name: "Hydrocortisone Cream 1%", genericName: "Hydrocortisone", strength: "1%", form: "cream", category: "Topical", summary: "Mild steroid cream for skin rashes and itching. Apply thinly 2-3 times daily. Do not use on face long term." },
  { name: "Gentian Violet Solution", genericName: "Gentian Violet", strength: "0.5%", form: "other", category: "Topical", summary: "Purple antiseptic for mouth sores and skin infections. Apply to affected area. Stains clothing and skin purple." },
  { name: "Eye Drops (Chloramphenicol)", genericName: "Chloramphenicol", strength: "0.5%", form: "drops", category: "Ophthalmic", summary: "Antibiotic eye drops for eye infections. Put 1-2 drops in affected eye 4 times daily. Complete full course." },
  
  // Antifungals
  { name: "Fluconazole 150mg", genericName: "Fluconazole", strength: "150mg", form: "capsule", category: "Antifungal", summary: "Treats yeast infections including vaginal thrush and oral candidiasis. Single dose for vaginal infections. Safe and effective." },
  { name: "Fluconazole 200mg", genericName: "Fluconazole", strength: "200mg", form: "capsule", category: "Antifungal", summary: "Treats systemic fungal infections and severe candidiasis. Take once daily. Used for serious fungal infections." },
  { name: "Nystatin Oral Suspension 100,000 IU/mL", genericName: "Nystatin", strength: "100,000 IU/mL", form: "syrup", category: "Antifungal", summary: "Treats oral thrush in babies and adults. Swish in mouth and swallow. Apply 4 times daily after feeds." },
  { name: "Nystatin Tablets 500,000 IU", genericName: "Nystatin", strength: "500,000 IU", form: "tablet", category: "Antifungal", summary: "Treats intestinal yeast infections. Not absorbed into blood. Take 3-4 times daily." },
  { name: "Clotrimazole Cream 1%", genericName: "Clotrimazole", strength: "1%", form: "cream", category: "Antifungal", summary: "Treats skin fungal infections including athlete's foot and ringworm. Apply twice daily to affected area. Continue for 2 weeks." },
  { name: "Clotrimazole Pessary 500mg", genericName: "Clotrimazole", strength: "500mg", form: "other", category: "Antifungal", summary: "Treats vaginal yeast infections. Insert one pessary at bedtime. Single dose treatment very effective." },
  { name: "Ketoconazole 200mg", genericName: "Ketoconazole", strength: "200mg", form: "tablet", category: "Antifungal", summary: "Treats systemic fungal infections. Take once daily with food. Monitor liver function with long-term use." },
  { name: "Miconazole Oral Gel 2%", genericName: "Miconazole", strength: "2%", form: "other", category: "Antifungal", summary: "Treats oral thrush in infants and children. Apply to affected areas 4 times daily. Safe for babies." },
  
  // Obstetric/Gynecology
  { name: "Oxytocin Injection 10 IU/mL", genericName: "Oxytocin", strength: "10 IU/mL", form: "injection", category: "Obstetric", summary: "Induces labor and controls bleeding after delivery. Life-saving for postpartum hemorrhage. Give by IM or IV drip." },
  { name: "Misoprostol 200mcg", genericName: "Misoprostol", strength: "200mcg", form: "tablet", category: "Obstetric", summary: "Prevents and treats postpartum hemorrhage. Also used for labor induction. Important life-saving medication for delivery." },
  { name: "Ergometrine Injection 0.5mg/mL", genericName: "Ergometrine", strength: "0.5mg/mL", form: "injection", category: "Obstetric", summary: "Emergency treatment for postpartum bleeding. Contracts uterus to stop hemorrhage. Give by IM injection immediately after delivery." },
  
  // Contraceptives
  { name: "Combined Oral Contraceptive (Ethinylestradiol/Levonorgestrel)", genericName: "Ethinylestradiol/Levonorgestrel", strength: "30mcg/150mcg", form: "tablet", category: "Contraceptive", summary: "Prevents pregnancy with estrogen and progestin. Take one pill daily at same time. Very effective when taken correctly." },
  { name: "Progestin-Only Pill (Levonorgestrel 0.03mg)", genericName: "Levonorgestrel", strength: "0.03mg", form: "tablet", category: "Contraceptive", summary: "Progestin-only contraception safe for breastfeeding mothers. Take daily at exact same time. No estrogen side effects." },
  { name: "Emergency Contraceptive (Levonorgestrel 1.5mg)", genericName: "Levonorgestrel", strength: "1.5mg", form: "tablet", category: "Contraceptive", summary: "Emergency contraception after unprotected intercourse. Take within 72 hours. More effective if taken sooner." },
  { name: "Medroxyprogesterone Injection 150mg (Depo-Provera)", genericName: "Medroxyprogesterone", strength: "150mg", form: "injection", category: "Contraceptive", summary: "Injectable contraception lasting 3 months. Very effective long-acting contraception. Give by deep IM injection every 12 weeks." },
  
  // Antiretrovirals - HIV
  { name: "TDF/3TC/DTG (Tenofovir/Lamivudine/Dolutegravir)", genericName: "Tenofovir/Lamivudine/Dolutegravir", strength: "300mg/300mg/50mg", form: "tablet", category: "Antiretroviral", summary: "First-line HIV treatment. Single daily tablet. Most effective and well-tolerated ARV combination. Take with or without food." },
  { name: "TDF/3TC/EFV (Tenofovir/Lamivudine/Efavirenz)", genericName: "Tenofovir/Lamivudine/Efavirenz", strength: "300mg/300mg/600mg", form: "tablet", category: "Antiretroviral", summary: "Alternative first-line HIV treatment. Take once daily at bedtime. May cause vivid dreams or dizziness initially." },
  { name: "AZT/3TC (Zidovudine/Lamivudine)", genericName: "Zidovudine/Lamivudine", strength: "300mg/150mg", form: "tablet", category: "Antiretroviral", summary: "Used for prevention of mother-to-child transmission (PMTCT). Take twice daily. Important for pregnant women with HIV." },
  { name: "Nevirapine Syrup 10mg/mL", genericName: "Nevirapine", strength: "10mg/mL", form: "syrup", category: "Antiretroviral", summary: "Pediatric HIV treatment and PMTCT. Give to babies born to HIV-positive mothers. Critical for preventing infant HIV infection." },
  { name: "Lopinavir/Ritonavir 200mg/50mg", genericName: "Lopinavir/Ritonavir", strength: "200mg/50mg", form: "tablet", category: "Antiretroviral", summary: "Second-line HIV treatment when first-line fails. Take twice daily with food. Used for drug-resistant HIV." },
  { name: "Dolutegravir 50mg", genericName: "Dolutegravir", strength: "50mg", form: "tablet", category: "Antiretroviral", summary: "Powerful HIV medication with high barrier to resistance. Take once daily. Can be used as part of first or second-line treatment." },
  
  // Vaccines/Immunizations
  { name: "Tetanus Toxoid Injection", genericName: "Tetanus Toxoid", strength: "0.5mL", form: "injection", category: "Vaccine", summary: "Prevents tetanus infection. Given to pregnant women and after injuries. Part of routine immunization schedule." },
  { name: "Hepatitis B Vaccine", genericName: "Hepatitis B Vaccine", strength: "10mcg", form: "injection", category: "Vaccine", summary: "Prevents hepatitis B infection. Given at birth, 6 weeks, and 14 weeks. Important for healthcare workers." },
  { name: "Rabies Vaccine", genericName: "Rabies Vaccine", strength: "2.5 IU", form: "injection", category: "Vaccine", summary: "Prevents rabies after animal bites. Give immediately after dog or bat bite. Series of 4-5 doses required." },
  { name: "BCG Vaccine", genericName: "BCG Vaccine", strength: "0.05mL", form: "injection", category: "Vaccine", summary: "Prevents severe tuberculosis in children. Given at birth or soon after. Single dose provides lifelong protection." },
  { name: "Measles Vaccine", genericName: "Measles Vaccine", strength: "0.5mL", form: "injection", category: "Vaccine", summary: "Prevents measles infection. Given at 9 months and 18 months. Part of routine childhood immunization." },
  { name: "OPV (Oral Polio Vaccine)", genericName: "Oral Polio Vaccine", strength: "2 drops", form: "other", category: "Vaccine", summary: "Prevents polio infection. Given orally at birth, 6, 10, and 14 weeks. Two drops by mouth." },
  { name: "Pentavalent Vaccine (DPT-HepB-Hib)", genericName: "Pentavalent Vaccine", strength: "0.5mL", form: "injection", category: "Vaccine", summary: "Protects against 5 diseases: diphtheria, pertussis, tetanus, hepatitis B, and Haemophilus influenzae. Given at 6, 10, and 14 weeks." },
  
  // Additional Ophthalmics
  { name: "Tetracycline Eye Ointment 1%", genericName: "Tetracycline", strength: "1%", form: "ointment", category: "Ophthalmic", summary: "Antibiotic eye ointment for eye infections. Apply thin strip to lower eyelid 2-4 times daily. Used for trachoma and conjunctivitis." },
  { name: "Gentamicin Eye Drops 0.3%", genericName: "Gentamicin", strength: "0.3%", form: "drops", category: "Ophthalmic", summary: "Strong antibiotic eye drops for bacterial eye infections. Put 1-2 drops every 4 hours. Effective for severe infections." },
  { name: "Ciprofloxacin Eye Drops 0.3%", genericName: "Ciprofloxacin", strength: "0.3%", form: "drops", category: "Ophthalmic", summary: "Broad-spectrum antibiotic eye drops. Treats bacterial conjunctivitis and corneal ulcers. Apply every 2-4 hours initially." },
  
  // Additional Antibiotics
  { name: "Flucloxacillin 250mg", genericName: "Flucloxacillin", strength: "250mg", form: "capsule", category: "Antibiotic", summary: "Treats staph skin infections and boils. Resistant to staph enzymes. Take on empty stomach 4 times daily." },
  { name: "Flucloxacillin 500mg", genericName: "Flucloxacillin", strength: "500mg", form: "capsule", category: "Antibiotic", summary: "Treats severe staph infections and cellulitis. Resistant to staph enzymes. Take on empty stomach 4 times daily." },
  { name: "Phenoxymethylpenicillin (Penicillin V) 250mg", genericName: "Phenoxymethylpenicillin", strength: "250mg", form: "tablet", category: "Antibiotic", summary: "Oral penicillin for throat and skin infections. Take 4 times daily on empty stomach. Good for strep throat." },
  { name: "Phenoxymethylpenicillin (Penicillin V) 500mg", genericName: "Phenoxymethylpenicillin", strength: "500mg", form: "tablet", category: "Antibiotic", summary: "Oral penicillin for throat and skin infections. Take 4 times daily on empty stomach. Good for strep throat." },
  
  // Opioid Analgesics
  { name: "Morphine Sulfate 10mg", genericName: "Morphine", strength: "10mg", form: "tablet", category: "Opioid Analgesic", summary: "Strong pain reliever for severe pain. Used for cancer pain and post-operative pain. May cause drowsiness and constipation." },
  { name: "Morphine Injection 10mg/mL", genericName: "Morphine", strength: "10mg/mL", form: "injection", category: "Opioid Analgesic", summary: "Injectable strong pain reliever for severe pain. Give by IM or slow IV. Monitor breathing and blood pressure." },
  { name: "Codeine Phosphate 30mg", genericName: "Codeine", strength: "30mg", form: "tablet", category: "Opioid Analgesic", summary: "Moderate pain reliever and cough suppressant. Take every 4-6 hours as needed. May cause constipation and drowsiness." },
  { name: "Pethidine Injection 50mg/mL", genericName: "Pethidine", strength: "50mg/mL", form: "injection", category: "Opioid Analgesic", summary: "Injectable pain reliever for labor pain and post-operative pain. Give by IM injection. Shorter acting than morphine." },
  
  // Antidiabetic Additions
  { name: "Insulin Regular (Soluble) 100 IU/mL", genericName: "Regular Insulin", strength: "100 IU/mL", form: "injection", category: "Antidiabetic", summary: "Short-acting insulin for diabetes. Inject 30 minutes before meals. Controls blood sugar spikes after eating." },
  { name: "Insulin NPH (Isophane) 100 IU/mL", genericName: "NPH Insulin", strength: "100 IU/mL", form: "injection", category: "Antidiabetic", summary: "Intermediate-acting insulin lasting 12-18 hours. Give once or twice daily. Provides basal insulin coverage." },
  { name: "Insulin 70/30 (Mixed) 100 IU/mL", genericName: "Mixed Insulin", strength: "100 IU/mL", form: "injection", category: "Antidiabetic", summary: "Pre-mixed insulin combining short and intermediate acting. Give twice daily before meals. Convenient fixed combination." },
  { name: "Gliclazide 80mg", genericName: "Gliclazide", strength: "80mg", form: "tablet", category: "Antidiabetic", summary: "Stimulates pancreas to produce insulin. Take before breakfast. Lower risk of low blood sugar than other sulfonylureas." },
  { name: "Glibenclamide 5mg", genericName: "Glibenclamide", strength: "5mg", form: "tablet", category: "Antidiabetic", summary: "Strong blood sugar lowering medication. Take before breakfast. Risk of low blood sugar - eat regular meals." },
].sort((a, b) => a.name.localeCompare(b.name));

export default function PharmacyInventory() {
  const [, setLocation] = useLocation();
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [drugSearch, setDrugSearch] = useState("");
  const [showEditDrug, setShowEditDrug] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [showBatchesModal, setShowBatchesModal] = useState(false);
  const [batchesDrug, setBatchesDrug] = useState<Drug | null>(null);
  
  // Combobox state for Add Drug quick select
  const [openCombobox, setOpenCombobox] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState("");
  
  // Help panel state
  const [helpCollapsed, setHelpCollapsed] = useState(() => {
    const saved = localStorage.getItem("pharmacyInventoryHelpCollapsed");
    // Default to collapsed (true) if no preference is saved
    return saved !== "false";
  });
  
  // Add Drug info box collapsed state
  const [addDrugInfoCollapsed, setAddDrugInfoCollapsed] = useState(() => {
    const saved = localStorage.getItem("pharmacyAddDrugInfoCollapsed");
    return saved !== "false"; // Default to collapsed
  });
  
  // Transaction history date filter
  const [transactionDateFilter, setTransactionDateFilter] = useState<DateFilterPreset>("all");
  const [transactionStartDate, setTransactionStartDate] = useState<string>();
  const [transactionEndDate, setTransactionEndDate] = useState<string>();
  
  // Bulk action states
  const [selectedStockItems, setSelectedStockItems] = useState<Set<number>>(new Set());
  const [selectedCatalogItems, setSelectedCatalogItems] = useState<Set<number>>(new Set());
  
  // Filter states
  const [stockFilters, setStockFilters] = useState<ActiveFilter[]>([]);
  const [catalogFilters, setCatalogFilters] = useState<ActiveFilter[]>([]);
  
  // Modal states
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);
  const [quickAdjustDrug, setQuickAdjustDrug] = useState<(Drug & { stockOnHand: number }) | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportContext, setExportContext] = useState<"stock" | "catalog" | "ledger">("stock");
  const [showDrugInfo, setShowDrugInfo] = useState(false);
  const [drugInfoDrug, setDrugInfoDrug] = useState<Drug | null>(null);
  const [drugInfoStockData, setDrugInfoStockData] = useState<{ stockOnHand: number; price: number; expiryDate?: string } | undefined>(undefined);
  
  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Tab state for programmatic navigation
  const [activeTab, setActiveTab] = useState("stock");
  
  // Alert view state for filtering alerts (all, lowStock, expiringSoon)
  const [activeAlertView, setActiveAlertView] = useState<'all' | 'lowStock' | 'expiringSoon'>('all');
  
  // Search states for Stock and Catalog tabs
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  
  // Compact filter states for Stock tab
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [stockFormFilter, setStockFormFilter] = useState<string>('all');
  const [stockMin, setStockMin] = useState<string>('');
  const [stockMax, setStockMax] = useState<string>('');
  
  // Compact filter states for Catalog tab
  const [catalogFormFilter, setCatalogFormFilter] = useState<string>('all');
  const [catalogStatusFilter, setCatalogStatusFilter] = useState<string>('all');
  
  // Transaction type filter for History tab
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'received' | 'dispensed'>('all');
  
  const [newDrug, setNewDrug] = useState({
    name: "",
    genericName: "",
    category: "",
    unitOfMeasure: "tablet",
    form: "tablet" as DrugForm,
    strength: "",
    reorderLevel: DEFAULT_REORDER_LEVEL,
  });
  const [newBatch, setNewBatch] = useState({
    drugId: 0,
    lotNumber: "",
    expiryDate: "",
    quantityOnHand: 0,
    unitsPerCarton: 0,
    cartonsReceived: 0,
    unitCost: 0,
    supplier: "",
    receivedBy: "Pharmacist",
    receivedAt: getClinicDayKey(),
  });
  const { toast } = useToast();

  // Persist help collapsed state
  useEffect(() => {
    localStorage.setItem("pharmacyInventoryHelpCollapsed", String(helpCollapsed));
  }, [helpCollapsed]);
  
  // Persist add drug info collapsed state
  useEffect(() => {
    localStorage.setItem("pharmacyAddDrugInfoCollapsed", String(addDrugInfoCollapsed));
  }, [addDrugInfoCollapsed]);

  // Fetch drugs
  const { data: drugs = [] } = useQuery<Drug[]>({
    queryKey: ['/api/pharmacy/drugs'],
  });

  // Fetch all drugs with stock levels for Stock Overview
  const { data: drugsWithStock = [] } = useQuery<(Drug & { stockOnHand: number })[]>({
    queryKey: ['/api/pharmacy/stock/all'],
  });

  // Fetch low stock alerts
  const { data: lowStockDrugs = [] } = useQuery<(Drug & { stockOnHand: number })[]>({
    queryKey: ['/api/pharmacy/alerts/low-stock'],
  });

  // Fetch expiring drugs
  const { data: expiringDrugs = [] } = useQuery<(DrugBatch & { drugName: string })[]>({
    queryKey: ['/api/pharmacy/alerts/expiring'],
    queryFn: async () => {
      const response = await fetch(`/api/pharmacy/alerts/expiring?days=${EXPIRY_WARNING_DAYS}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch inventory ledger
  const { data: ledgerEntries = [] } = useQuery<InventoryLedger[]>({
    queryKey: ['/api/pharmacy/ledger'],
  });

  // Fetch all batches to get pricing info
  const { data: allBatches = [] } = useQuery<DrugBatch[]>({
    queryKey: ['/api/pharmacy/batches'],
  });

  // Refresh all inventory data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/drugs'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/stock/all'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/alerts/low-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/alerts/expiring'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/ledger'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/batches'] }),
      ]);
      
      // Wait a bit for queries to refetch
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "✅ Inventory Refreshed",
        description: "All inventory data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh inventory data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Create a map of drugId to drug form for quick lookup
  const drugFormMap = useMemo(() => {
    const map = new Map<number, string>();
    drugsWithStock.forEach(drug => {
      map.set(drug.id, drug.form);
    });
    drugs.forEach(drug => {
      if (!map.has(drug.id)) {
        map.set(drug.id, drug.form);
      }
    });
    return map;
  }, [drugsWithStock, drugs]);

  // Create drug mutation
  const createDrugMutation = useMutation({
    mutationFn: async (data: typeof newDrug) => {
      const response = await apiRequest('POST', '/api/pharmacy/drugs', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/drugs'] });
      setShowAddDrug(false);
      setNewDrug({
        name: "",
        genericName: "",
        category: "",
        unitOfMeasure: "tablet",
        form: "tablet" as DrugForm,
        strength: "",
        reorderLevel: DEFAULT_REORDER_LEVEL,
      });
      toast({
        title: "Drug Added",
        description: "New drug has been added to the catalog.",
      });
    },
  });

  // Receive stock mutation
  const receiveStockMutation = useMutation({
    mutationFn: async (data: typeof newBatch) => {
      const response = await apiRequest('POST', '/api/pharmacy/batches', {
        ...data,
        receivedAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      const drug = drugs.find(d => d.id === newBatch.drugId);
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/batches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/stock/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/alerts/low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/ledger'] });
      
      toast({
        title: "✅ Stock Received Successfully",
        description: drug 
          ? `${drug.name}: ${formatDrugQuantity(newBatch.quantityOnHand, drug.form)} received (Expires: ${new Date(newBatch.expiryDate).toLocaleDateString()})` 
          : "New stock has been received and added to inventory.",
      });
      
      setShowReceiveStock(false);
      setNewBatch({
        drugId: 0,
        lotNumber: "",
        expiryDate: "",
        quantityOnHand: 0,
        unitsPerCarton: 0,
        cartonsReceived: 0,
        unitCost: 0,
        supplier: "",
        receivedBy: "Pharmacist",
        receivedAt: "",
      });
      setSelectedDrug(null);
    },
  });

  // Filter ledger entries based on date filter
  const filteredLedgerEntries = useMemo(() => {
    let filtered = ledgerEntries.filter(entry => 
      isDateInRange(entry.createdAt, transactionDateFilter, transactionStartDate, transactionEndDate)
    );
    
    // Apply transaction type filter
    if (transactionTypeFilter === 'received') {
      filtered = filtered.filter(entry => entry.transactionType === 'receive');
    } else if (transactionTypeFilter === 'dispensed') {
      filtered = filtered.filter(entry => entry.transactionType === 'dispense');
    }
    
    return filtered;
  }, [ledgerEntries, transactionDateFilter, transactionStartDate, transactionEndDate, transactionTypeFilter]);

  // Filter drugs with stock based on filters and search
  const filteredStockDrugs = useMemo(() => {
    let filtered = [...drugsWithStock];
    
    // Apply search filter
    if (stockSearchQuery) {
      const searchLower = stockSearchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.drugCode?.toLowerCase().includes(searchLower) ||
        d.genericName?.toLowerCase().includes(searchLower)
      );
    }
    
    stockFilters.forEach((filter) => {
      switch (filter.id) {
        case "status":
          if (filter.value === "in_stock") {
            filtered = filtered.filter(d => d.stockOnHand > d.reorderLevel);
          } else if (filter.value === "low_stock") {
            filtered = filtered.filter(d => d.stockOnHand > 0 && d.stockOnHand <= d.reorderLevel);
          } else if (filter.value === "out_of_stock") {
            filtered = filtered.filter(d => d.stockOnHand === 0);
          }
          break;
        case "form":
          if (filter.value) {
            filtered = filtered.filter(d => d.form === filter.value);
          }
          break;
        case "stock_range":
          const stockRange = filter.value as { min?: string; max?: string };
          if (stockRange.min) {
            filtered = filtered.filter(d => d.stockOnHand >= parseInt(stockRange.min!));
          }
          if (stockRange.max) {
            filtered = filtered.filter(d => d.stockOnHand <= parseInt(stockRange.max!));
          }
          break;
      }
    });
    
    return filtered;
  }, [drugsWithStock, stockFilters, stockSearchQuery]);

  // Filter catalog drugs based on filters and search
  const filteredCatalogDrugs = useMemo(() => {
    let filtered = [...drugs];
    
    // Apply search filter
    if (catalogSearchQuery) {
      const searchLower = catalogSearchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.drugCode?.toLowerCase().includes(searchLower) ||
        d.genericName?.toLowerCase().includes(searchLower)
      );
    }
    
    catalogFilters.forEach((filter) => {
      switch (filter.id) {
        case "status":
          if (filter.value === "active") {
            filtered = filtered.filter(d => d.isActive === 1);
          } else if (filter.value === "inactive") {
            filtered = filtered.filter(d => d.isActive === 0);
          }
          break;
        case "form":
          if (filter.value) {
            filtered = filtered.filter(d => d.form === filter.value);
          }
          break;
      }
    });
    
    return filtered;
  }, [drugs, catalogFilters, catalogSearchQuery]);

  // Bulk action handlers
  const handleSelectAllStock = () => {
    if (selectedStockItems.size === filteredStockDrugs.length) {
      setSelectedStockItems(new Set());
    } else {
      setSelectedStockItems(new Set(filteredStockDrugs.map(d => d.id)));
    }
  };

  const handleSelectAllCatalog = () => {
    if (selectedCatalogItems.size === filteredCatalogDrugs.length) {
      setSelectedCatalogItems(new Set());
    } else {
      setSelectedCatalogItems(new Set(filteredCatalogDrugs.map(d => d.id)));
    }
  };

  const handleSelectLowStock = () => {
    const lowStockIds = drugsWithStock
      .filter(d => d.stockOnHand > 0 && d.stockOnHand <= d.reorderLevel)
      .map(d => d.id);
    setSelectedStockItems(new Set(lowStockIds));
  };

  const handleSelectOutOfStock = () => {
    const outOfStockIds = drugsWithStock
      .filter(d => d.stockOnHand === 0)
      .map(d => d.id);
    setSelectedStockItems(new Set(outOfStockIds));
  };

  const handleStockFilterChange = (filterId: string, value: any) => {
    if (!value || value === "" || value === "all") {
      setStockFilters(stockFilters.filter(f => f.id !== filterId));
      return;
    }

    const existingIndex = stockFilters.findIndex(f => f.id === filterId);
    let display = String(value);
    
    // Format display based on filter type
    if (filterId === "stock_range" && typeof value === "object") {
      const range = value as { min?: string; max?: string };
      if (range.min && range.max) {
        display = `${range.min} - ${range.max}`;
      } else if (range.min) {
        display = `≥ ${range.min}`;
      } else if (range.max) {
        display = `≤ ${range.max}`;
      }
    }

    const newFilter: ActiveFilter = {
      id: filterId,
      label: getFilterLabel(filterId),
      value,
      display,
    };

    if (existingIndex >= 0) {
      const updated = [...stockFilters];
      updated[existingIndex] = newFilter;
      setStockFilters(updated);
    } else {
      setStockFilters([...stockFilters, newFilter]);
    }
  };

  const handleCatalogFilterChange = (filterId: string, value: any) => {
    if (!value || value === "" || value === "all") {
      setCatalogFilters(catalogFilters.filter(f => f.id !== filterId));
      return;
    }

    const existingIndex = catalogFilters.findIndex(f => f.id === filterId);
    const newFilter: ActiveFilter = {
      id: filterId,
      label: getFilterLabel(filterId),
      value,
      display: String(value),
    };

    if (existingIndex >= 0) {
      const updated = [...catalogFilters];
      updated[existingIndex] = newFilter;
      setCatalogFilters(updated);
    } else {
      setCatalogFilters([...catalogFilters, newFilter]);
    }
  };

  // Compact filter handlers
  const handleCompactStatusFilter = (status: string) => {
    const newStatus = stockStatusFilter === status ? 'all' : status;
    setStockStatusFilter(newStatus);
    handleStockFilterChange('status', newStatus === 'all' ? '' : 
      status === 'lowstock' ? 'low_stock' : 'out_of_stock');
  };

  const handleCompactFormFilter = (form: string) => {
    setStockFormFilter(form);
    handleStockFilterChange('form', form === 'all' ? '' : form);
  };

  const handleCompactStockRange = () => {
    if (stockMin || stockMax) {
      handleStockFilterChange('stock_range', {
        min: stockMin,
        max: stockMax
      });
    }
  };

  const clearCompactStockRange = () => {
    setStockMin('');
    setStockMax('');
    handleStockFilterChange('stock_range', '');
  };

  const clearAllCompactFilters = () => {
    setStockStatusFilter('all');
    setStockFormFilter('all');
    setStockMin('');
    setStockMax('');
    setStockFilters([]);
  };

  const hasActiveCompactFilters = useMemo(() => {
    return stockStatusFilter !== 'all' || 
           stockFormFilter !== 'all' || 
           stockMin !== '' || 
           stockMax !== '';
  }, [stockStatusFilter, stockFormFilter, stockMin, stockMax]);

  const lowStockCount = useMemo(() => {
    return drugsWithStock.filter(d => d.stockOnHand > 0 && d.stockOnHand <= d.reorderLevel).length;
  }, [drugsWithStock]);

  // Catalog compact filter handlers
  const handleCompactCatalogForm = (form: string) => {
    setCatalogFormFilter(form);
    handleCatalogFilterChange('form', form === 'all' ? '' : form);
  };

  const handleCompactCatalogStatus = (status: string) => {
    setCatalogStatusFilter(status);
    handleCatalogFilterChange('status', status === 'all' ? '' : status);
  };

  const clearAllCatalogCompactFilters = () => {
    setCatalogFormFilter('all');
    setCatalogStatusFilter('all');
    setCatalogFilters([]);
  };

  const hasActiveCatalogFilters = useMemo(() => {
    return catalogFormFilter !== 'all' || catalogStatusFilter !== 'all';
  }, [catalogFormFilter, catalogStatusFilter]);

  const getFilterLabel = (filterId: string): string => {
    const labels: Record<string, string> = {
      status: "Status",
      form: "Form",
      stock_range: "Stock Range",
    };
    return labels[filterId] || filterId;
  };

  const getStockFilters = (): FilterConfig[] => [
    {
      id: "form",
      label: "Form",
      type: "select",
      options: [
        { value: "tablet", label: "Tablet" },
        { value: "capsule", label: "Capsule" },
        { value: "syrup", label: "Syrup" },
        { value: "injection", label: "Injection" },
        { value: "cream", label: "Cream" },
        { value: "ointment", label: "Ointment" },
        { value: "drops", label: "Drops" },
        { value: "inhaler", label: "Inhaler" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "in_stock", label: "In Stock" },
        { value: "low_stock", label: "Low Stock" },
        { value: "out_of_stock", label: "Out of Stock" },
      ],
    },
    {
      id: "stock_range",
      label: "Stock Level Range",
      type: "range",
    },
  ];

  const getCatalogFilters = (): FilterConfig[] => [
    {
      id: "form",
      label: "Form",
      type: "select",
      options: [
        { value: "tablet", label: "Tablet" },
        { value: "capsule", label: "Capsule" },
        { value: "syrup", label: "Syrup" },
        { value: "injection", label: "Injection" },
        { value: "cream", label: "Cream" },
        { value: "ointment", label: "Ointment" },
        { value: "drops", label: "Drops" },
        { value: "inhaler", label: "Inhaler" },
        { value: "other", label: "Other" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const handleQuickAdjust = (adjustment: {
    drugId: number;
    type: "receive" | "dispense" | "adjust";
    quantity: number;
    reason?: string;
  }) => {
    // TODO: Implement API call for quick adjustment
    const drug = drugsWithStock.find(d => d.id === adjustment.drugId);
    const drugForm = drug?.form || 'other';
    toast({
      title: "Stock Adjusted",
      description: `${adjustment.type === "receive" ? "Added" : "Removed"} ${formatDrugQuantity(adjustment.quantity, drugForm)}`,
    });
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/stock/all'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/ledger'] });
  };

  const handleExport = (options: {
    format: "csv" | "excel" | "pdf";
    scope: "current" | "all" | "selected";
    columns: string[];
    filename: string;
  }) => {
    let data: any[] = [];
    let columnLabels: Record<string, string> = {};

    if (exportContext === "stock") {
      data = filteredStockDrugs.map(drug => {
        const drugBatches = allBatches
          .filter(b => b.drugId === drug.id && b.quantityOnHand > 0)
          .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
        const currentPrice = drugBatches[0]?.unitCost;
        const nearestExpiry = allBatches
          .filter(b => b.drugId === drug.id && b.quantityOnHand > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0]?.expiryDate;

        return {
          name: drug.name,
          strength: drug.strength || "-",
          form: drug.form,
          stockOnHand: drug.stockOnHand,
          currentPrice: currentPrice ? Math.round(currentPrice) : "-",
          nearestExpiry: nearestExpiry ? new Date(nearestExpiry).toLocaleDateString() : "-",
          status: drug.stockOnHand === 0 ? "Out of Stock" : drug.stockOnHand <= drug.reorderLevel ? "LOW STOCK" : "In Stock",
        };
      });
      columnLabels = {
        name: "Drug Name",
        strength: "Strength",
        form: "Form",
        stockOnHand: "Stock on Hand",
        currentPrice: "Current Price (SSP)",
        nearestExpiry: "Nearest Expiry",
        status: "Status",
      };
    } else if (exportContext === "catalog") {
      data = filteredCatalogDrugs.map(drug => ({
        drugCode: drug.drugCode,
        name: drug.name,
        genericName: drug.genericName || "-",
        strength: drug.strength || "-",
        form: drug.form,
        reorderLevel: drug.reorderLevel,
        status: drug.isActive ? "Active" : "Inactive",
      }));
      columnLabels = {
        drugCode: "Drug Code",
        name: "Name",
        genericName: "Generic Name",
        strength: "Strength",
        form: "Form",
        reorderLevel: "Reorder Level",
        status: "Status",
      };
    } else if (exportContext === "ledger") {
      data = filteredLedgerEntries.map(entry => ({
        transactionId: entry.transactionId,
        type: entry.transactionType,
        quantity: entry.quantity,
        value: Math.round(entry.totalValue || 0),
        performedBy: entry.performedBy,
        date: new Date(entry.createdAt).toLocaleDateString(),
      }));
      columnLabels = {
        transactionId: "Transaction ID",
        type: "Type",
        quantity: "Quantity",
        value: "Value (SSP)",
        performedBy: "Performed By",
        date: "Date",
      };
    }

    exportData(data, options.columns, columnLabels, options.format, options.filename);
    
    toast({
      title: "Export Complete",
      description: `${data.length} records exported successfully.`,
    });
  };

  const handleAddDrug = () => {
    if (!newDrug.name || !newDrug.unitOfMeasure) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in required fields",
      });
      return;
    }
    createDrugMutation.mutate(newDrug);
  };

  const handleReceiveStock = () => {
    if (!newBatch.drugId || !newBatch.expiryDate || newBatch.quantityOnHand <= 0 || newBatch.unitCost <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields (Drug, Expiry Date, Quantity, Unit Cost)",
      });
      return;
    }
    receiveStockMutation.mutate(newBatch);
  };

  // Handle card clicks to filter and navigate
  const handleCardClick = (cardType: "low-stock" | "expiring-soon") => {
    if (cardType === "low-stock") {
      // Navigate to stock overview with low stock filter
      setActiveTab("stock");
      setStockFilters([{ 
        id: "status", 
        label: "Status", 
        value: "low_stock", 
        display: "Low Stock" 
      }]);
      
      // Scroll to table after a brief delay
      setTimeout(() => {
        const stockTable = document.getElementById("stock-table");
        if (stockTable) {
          stockTable.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } else if (cardType === "expiring-soon") {
      // Navigate to alerts tab and show ONLY expiring soon section
      setActiveTab("alerts");
      setActiveAlertView("expiringSoon");
      
      // Scroll to expiring soon section after a brief delay
      setTimeout(() => {
        const expiringSection = document.getElementById("expiring-soon-section");
        if (expiringSection) {
          expiringSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const getExportColumns = (): ExportColumn[] => {
    if (exportContext === "stock") {
      return [
        { id: "name", label: "Drug Name", enabled: true },
        { id: "strength", label: "Strength", enabled: true },
        { id: "form", label: "Form", enabled: true },
        { id: "stockOnHand", label: "Stock on Hand", enabled: true },
        { id: "currentPrice", label: "Current Price (SSP)", enabled: true },
        { id: "nearestExpiry", label: "Nearest Expiry", enabled: true },
        { id: "status", label: "Status", enabled: true },
      ];
    } else if (exportContext === "catalog") {
      return [
        { id: "drugCode", label: "Drug Code", enabled: true },
        { id: "name", label: "Name", enabled: true },
        { id: "genericName", label: "Generic Name", enabled: true },
        { id: "strength", label: "Strength", enabled: true },
        { id: "form", label: "Form", enabled: true },
        { id: "reorderLevel", label: "Reorder Level", enabled: true },
        { id: "status", label: "Status", enabled: true },
      ];
    } else {
      return [
        { id: "transactionId", label: "Transaction ID", enabled: true },
        { id: "type", label: "Type", enabled: true },
        { id: "quantity", label: "Quantity", enabled: true },
        { id: "value", label: "Value (SSP)", enabled: true },
        { id: "performedBy", label: "Performed By", enabled: true },
        { id: "date", label: "Date", enabled: true },
      ];
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${helpCollapsed ? 'pr-0' : 'pr-0 lg:pr-96'}`}>
      {/* Right-side help panel - rendered as a fixed sidebar */}
      <PharmacyInventoryHelp collapsed={helpCollapsed} onCollapsedChange={setHelpCollapsed} />

      {/* Main content */}
      <div className="space-y-6 p-3 md:p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Back button */}
          <button
            onClick={() => setLocation('/pharmacy')}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
            title="Back to Pharmacy"
            aria-label="Back to Pharmacy"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
          </button>
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center 
                        shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200 hover:scale-105">
            <Package className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Pharmacy Inventory
            </h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium mt-0.5">Manage drugs, stock, and inventory</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 
                     transition-all duration-200 hover:shadow-md hover:scale-105 md:size-default"
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 md:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
          <Button
            onClick={() => setHelpCollapsed(!helpCollapsed)}
            variant="outline"
            size="sm"
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 
                     transition-all duration-200 hover:shadow-premium-sm hover:scale-105 md:size-default"
            data-testid="button-help"
          >
            <HelpCircle className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Help</span>
          </Button>
          <Button
            onClick={() => setShowAddDrug(true)}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                     shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105 md:size-default"
            data-testid="button-add-drug"
          >
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Add Drug</span>
          </Button>
          <Button
            onClick={() => setShowReceiveStock(true)}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                     shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105 md:size-default"
            data-testid="button-receive-stock"
          >
            <Package className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Receive Stock</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner-premium grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger 
            value="stock" 
            data-testid="tab-stock"
            className={cn(
              "relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
              "data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200",
              "data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 text-xs md:text-sm",
              activeTab === 'stock' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-r after:from-blue-600 after:to-blue-500 after:rounded-t-full after:shadow-lg after:shadow-blue-500/30"
            )}
          >
            <Package className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Stock</span>
            <span className="sm:hidden">Stock</span>
          </TabsTrigger>
          <TabsTrigger 
            value="catalog" 
            data-testid="tab-catalog"
            className={cn(
              "relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
              "data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200",
              "data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 text-xs md:text-sm",
              activeTab === 'catalog' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-r after:from-purple-600 after:to-purple-500 after:rounded-t-full after:shadow-lg after:shadow-purple-500/30"
            )}
          >
            <Archive className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Catalog ({drugs.length})</span>
            <span className="sm:hidden">Catalog</span>
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            data-testid="tab-alerts"
            className={cn(
              "relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
              "data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200",
              "data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 text-xs md:text-sm",
              activeTab === 'alerts' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-r after:from-amber-600 after:to-orange-500 after:rounded-t-full after:shadow-lg after:shadow-amber-500/30"
            )}
          >
            <AlertTriangle className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Alerts ({lowStockDrugs.length + expiringDrugs.length})</span>
            <span className="sm:hidden">Alerts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ledger" 
            data-testid="tab-ledger"
            className={cn(
              "relative data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700",
              "data-[state=active]:shadow-premium-sm rounded-lg transition-all duration-200",
              "data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-400 text-xs md:text-sm",
              activeTab === 'ledger' && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-gradient-to-r after:from-gray-600 after:to-gray-500 after:rounded-t-full after:shadow-lg after:shadow-gray-500/30"
            )}
          >
            <FileText className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectLowStock}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Select All Low Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectOutOfStock}
                className="text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Select All Out of Stock
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExportContext("stock");
                setShowExportModal(true);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Stock
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search drugs by name, code, or generic name..."
              value={stockSearchQuery}
              onChange={(e) => setStockSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Compact Filter Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Quick Filter Pills */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Quick:
              </span>
              <Button
                variant={stockStatusFilter === 'lowstock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCompactStatusFilter('lowstock')}
                className={cn(
                  "h-8 text-xs",
                  stockStatusFilter === 'lowstock' 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                )}
              >
                <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                Low Stock
                {lowStockCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 bg-white/20 text-white h-5 px-1.5">
                    {lowStockCount}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant={stockStatusFilter === 'outofstock' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCompactStatusFilter('outofstock')}
                className={cn(
                  "h-8 text-xs",
                  stockStatusFilter === 'outofstock' 
                    ? "bg-gray-600 hover:bg-gray-700 text-white" 
                    : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                )}
              >
                <X className="w-3.5 h-3.5 mr-1.5" />
                Out of Stock
              </Button>
            </div>

            {/* Right: Advanced Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Filter:
              </span>
              
              {/* Form Filter */}
              <Select value={stockFormFilter} onValueChange={handleCompactFormFilter}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="All Forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  <SelectItem value="tablet">Tablets</SelectItem>
                  <SelectItem value="capsule">Capsules</SelectItem>
                  <SelectItem value="syrup">Syrups</SelectItem>
                  <SelectItem value="injection">Injections</SelectItem>
                  <SelectItem value="cream">Creams</SelectItem>
                  <SelectItem value="inhaler">Inhalers</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Stock Range Filter - Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                    Stock: {stockMin || 0}-{stockMax || '∞'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Stock Level Range</h4>
                      <p className="text-xs text-gray-500">Filter drugs by quantity in stock</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="stock-min" className="text-xs">Minimum</Label>
                        <Input
                          id="stock-min"
                          type="number"
                          value={stockMin}
                          onChange={(e) => setStockMin(e.target.value)}
                          placeholder="0"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stock-max" className="text-xs">Maximum</Label>
                        <Input
                          id="stock-max"
                          type="number"
                          value={stockMax}
                          onChange={(e) => setStockMax(e.target.value)}
                          placeholder="No limit"
                          className="h-9 mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCompactStockRange} 
                        className="flex-1"
                        size="sm"
                      >
                        Apply
                      </Button>
                      <Button 
                        onClick={clearCompactStockRange} 
                        variant="outline"
                        size="sm"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear All Filters */}
              {hasActiveCompactFilters && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAllCompactFilters}
                  className="h-8 text-xs text-gray-600 hover:text-gray-900"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Premium Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Drugs */}
            <Card className="stat-card-glass bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 
                           dark:to-indigo-950/20 border-blue-200/40 dark:border-blue-800/40 
                           p-4 shadow-premium-md hover:shadow-premium-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex-shrink-0 shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Drugs</p>
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-2xl font-semibold text-blue-700 dark:text-blue-400">
                      {drugs.length}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">items</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Low Stock */}
            <Card 
              className="stat-card-glass bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 
                       dark:to-pink-950/20 border-red-200/40 dark:border-red-800/40 
                       p-4 shadow-premium-md hover:shadow-premium-lg cursor-pointer"
              onClick={() => handleCardClick("low-stock")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCardClick("low-stock")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex-shrink-0 shadow-md">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">Low Stock</p>
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-2xl font-semibold text-red-700 dark:text-red-400">
                      {lowStockDrugs.length}
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400">alerts</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Expiring Soon */}
            <Card 
              className="stat-card-glass bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 
                       dark:to-amber-950/20 border-orange-200/40 dark:border-orange-800/40 
                       p-4 shadow-premium-md hover:shadow-premium-lg cursor-pointer"
              onClick={() => handleCardClick("expiring-soon")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCardClick("expiring-soon")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex-shrink-0 shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">Expiring Soon</p>
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-2xl font-semibold text-orange-700 dark:text-orange-400">
                      {expiringDrugs.length}
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400">items</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Total Value */}
            <Card className="stat-card-glass bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 
                           dark:to-emerald-950/20 border-green-200/40 dark:border-green-800/40 
                           p-4 shadow-premium-md hover:shadow-premium-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex-shrink-0 shadow-md">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Total Value</p>
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-2xl font-semibold text-green-700 dark:text-green-400">
                      {(() => {
                        const totalValue = allBatches.reduce((sum, batch) => {
                          return sum + (batch.quantityOnHand * batch.unitCost);
                        }, 0);
                        return Math.round(totalValue).toLocaleString();
                      })()}
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">SSP</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card 
            className="shadow-premium-md border-gray-200 dark:border-gray-700 
                       hover:shadow-premium-lg transition-all duration-200" 
            id="stock-table"
          >
            <CardHeader>
              <CardTitle>Current Stock & Prices</CardTitle>
              <CardDescription>See all drugs, quantities in stock, and current prices</CardDescription>
            </CardHeader>
            <CardContent className="relative p-0">
              {/* Scroll container with modern visual treatment */}
              <div className="max-h-[600px] overflow-auto scrollbar-premium rounded-b-lg">
                {/* Top fade gradient - appears when scrolled */}
                <div className="sticky top-0 left-0 right-0 h-6 pointer-events-none z-[11]
                               bg-gradient-to-b from-white via-white/80 to-transparent 
                               dark:from-gray-900 dark:via-gray-900/80 dark:to-transparent" 
                     aria-hidden="true"></div>
                
                <div className="-mt-6 px-6">
              <Table>
                <TableHeader className="sticky top-0 z-10 table-header-premium">
                  <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStockItems.size === filteredStockDrugs.length && filteredStockDrugs.length > 0}
                        onCheckedChange={handleSelectAllStock}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead className="text-right">Stock on Hand</TableHead>
                    <TableHead className="text-right">Current Price (SSP)</TableHead>
                    <TableHead>Nearest Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStockDrugs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 
                                        rounded-2xl shadow-premium-sm">
                            <Package className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Stock Matches Filter</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                              {stockFilters.length > 0 
                                ? "No drugs match the current filter. Try adjusting or clearing filters."
                                : "No stock received yet. Get started by receiving stock for drugs in your catalog."}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              onClick={() => setShowAddDrug(true)}
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Drug
                            </Button>
                            <Button
                              onClick={() => setShowReceiveStock(true)}
                              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Receive Stock
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStockDrugs.map((drug, index) => {
                    const stockLevel = drug.stockOnHand;
                    const isOutOfStock = stockLevel === 0;
                    const isLowStock = stockLevel > 0 && stockLevel <= drug.reorderLevel;
                    const isSelected = selectedStockItems.has(drug.id);
                    
                    // Find most recent batch with stock to get current price
                    const drugBatches = allBatches
                      .filter(b => b.drugId === drug.id && b.quantityOnHand > 0)
                      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
                    const currentPrice = drugBatches[0]?.unitCost;
                    
                    // Find nearest expiry date
                    const nearestExpiry = allBatches
                      .filter(b => b.drugId === drug.id && b.quantityOnHand > 0)
                      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0]?.expiryDate;
                    
                    return (
                      <TableRow 
                        key={drug.id} 
                        className={`
                          table-row-premium
                          border-b border-gray-100 dark:border-gray-800
                          ${index % 2 === 0 
                            ? "bg-white dark:bg-gray-900" 
                            : "bg-slate-50/50 dark:bg-gray-800/30"
                          }
                          ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                          ${isLowStock 
                            ? "hover:bg-red-50/70 dark:hover:bg-red-900/10" 
                            : "hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                          }
                        `}
                      >
                        <TableCell className="py-5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedStockItems);
                              if (checked) {
                                newSet.add(drug.id);
                              } else {
                                newSet.delete(drug.id);
                              }
                              setSelectedStockItems(newSet);
                            }}
                            aria-label={`Select ${drug.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white py-5">{drug.name}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 py-5">{drug.strength || '-'}</TableCell>
                        <TableCell className="capitalize text-gray-700 dark:text-gray-300 py-5">{drug.form}</TableCell>
                        <TableCell className="text-right tabular-nums py-5">
                          <span className={`font-bold text-base ${isOutOfStock ? "text-gray-400 dark:text-gray-600" : isLowStock ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                            {formatDrugQuantity(stockLevel, drug.form)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-gray-900 dark:text-white font-semibold py-5">
                          {currentPrice ? `${Math.round(currentPrice).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 py-5">
                          {nearestExpiry ? new Date(nearestExpiry).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="py-5">
                          {isOutOfStock ? (
                            <Badge 
                              className="badge-prominent-red"
                            >
                              <span className="text-sm">⊘</span> Out of Stock
                            </Badge>
                          ) : isLowStock ? (
                            <Badge 
                              className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-premium-sm 
                                       transition-all duration-150 hover:shadow-premium-md hover:from-red-700 hover:to-red-600 font-medium"
                            >
                              LOW STOCK
                            </Badge>
                          ) : (
                            <Badge 
                              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-premium-sm 
                                       transition-all duration-150 hover:shadow-premium-md hover:from-green-700 hover:to-emerald-700 font-medium"
                            >
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-5">
                          <div className="flex gap-1 justify-end">
                            <div className="icon-tooltip-wrapper">
                              <DrugInfoTooltip drug={drug}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Get stock info for the drug
                                    const batches = drugBatches?.filter(b => b.drugId === drug.id) || [];
                                    const totalStock = batches.reduce((sum, b) => sum + b.quantityOnHand, 0);
                                    const avgPrice = batches.length > 0 
                                      ? batches.reduce((sum, b) => sum + b.unitCost, 0) / batches.length 
                                      : drug.defaultPrice || 0;
                                    const nearestExpiry = batches
                                      .filter(b => b.quantityOnHand > 0)
                                      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
                                    
                                    setDrugInfoDrug(drug);
                                    setDrugInfoStockData({
                                      stockOnHand: totalStock,
                                      price: avgPrice,
                                      expiryDate: nearestExpiry?.expiryDate
                                    });
                                    setShowDrugInfo(true);
                                  }}
                                  className="h-8 px-2.5 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400
                                         hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150
                                         hover:shadow-premium-sm hover:scale-105"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </Button>
                              </DrugInfoTooltip>
                              <span className="icon-tooltip">Drug Information</span>
                            </div>
                            <div className="icon-tooltip-wrapper">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setQuickAdjustDrug(drug);
                                  setShowQuickAdjust(true);
                                }}
                                className="h-8 px-2.5 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400
                                         hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150
                                         hover:shadow-premium-sm hover:scale-105"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <span className="icon-tooltip">Quick Adjust</span>
                            </div>
                            <div className="icon-tooltip-wrapper">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDrug(drug);
                                  setNewBatch({ ...newBatch, drugId: drug.id });
                                  setShowReceiveStock(true);
                                }}
                                className="h-8 px-2.5 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                                         hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150
                                         hover:shadow-premium-sm hover:scale-105"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </Button>
                              <span className="icon-tooltip">Receive Stock</span>
                            </div>
                            <div className="icon-tooltip-wrapper">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setBatchesDrug(drug);
                                  setShowBatchesModal(true);
                                }}
                                className="h-8 px-2.5 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
                                         hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150
                                         hover:shadow-premium-sm hover:scale-105"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <span className="icon-tooltip">View Batches</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }))}
                </TableBody>
              </Table>
                </div>
                
                {/* Bottom fade gradient - always visible to indicate more content */}
                <div className="sticky bottom-0 left-0 right-0 h-6 pointer-events-none
                               bg-gradient-to-t from-white via-white/80 to-transparent 
                               dark:from-gray-900 dark:via-gray-900/80 dark:to-transparent" 
                     aria-hidden="true"></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search drugs by name, code, or generic name..."
              value={catalogSearchQuery}
              onChange={(e) => setCatalogSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Compact Filter Row for Catalog with Export Button */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Filter:
              </span>
              
              <Select value={catalogFormFilter} onValueChange={handleCompactCatalogForm}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="All Forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  <SelectItem value="tablet">Tablets</SelectItem>
                  <SelectItem value="capsule">Capsules</SelectItem>
                  <SelectItem value="syrup">Syrups</SelectItem>
                  <SelectItem value="injection">Injections</SelectItem>
                  <SelectItem value="cream">Creams</SelectItem>
                  <SelectItem value="inhaler">Inhalers</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={catalogStatusFilter} onValueChange={handleCompactCatalogStatus}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveCatalogFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllCatalogCompactFilters} 
                  className="h-8 text-xs"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Right: Export Catalog Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setExportContext("catalog");
                setShowExportModal(true);
              }}
              className="h-8"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Catalog
            </Button>
          </div>

          <Card className="shadow-premium-md border-gray-200 dark:border-gray-700 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <CardTitle>Drug Catalog</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="table-zebra">
                <TableHeader className="sticky top-0 z-10 table-header-premium">
                  <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCatalogItems.size === filteredCatalogDrugs.length && filteredCatalogDrugs.length > 0}
                        onCheckedChange={handleSelectAllCatalog}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Drug Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Generic Name</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCatalogDrugs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 
                                        rounded-2xl shadow-premium-sm">
                            <Archive className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Drugs in Catalog</h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                              Start by adding drugs to your catalog. Click "Add Drug" to get started.
                            </p>
                          </div>
                          <Button
                            onClick={() => setShowAddDrug(true)}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 mt-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Drug
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCatalogDrugs.map((drug, index) => {
                      const isSelected = selectedCatalogItems.has(drug.id);
                      // Get current stock level for this drug
                      const drugWithStock = drugsWithStock.find(d => d.id === drug.id);
                      const stockLevel = drugWithStock?.stockOnHand || 0;
                      const reorderLevel = drug.reorderLevel;
                      
                      return (
                      <TableRow 
                        key={drug.id} 
                        data-testid={`drug-row-${drug.id}`}
                        className={`table-row-premium border-b border-gray-100 dark:border-gray-800
                                  ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                      >
                        <TableCell className="py-5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedCatalogItems);
                              if (checked) {
                                newSet.add(drug.id);
                              } else {
                                newSet.delete(drug.id);
                              }
                              setSelectedCatalogItems(newSet);
                            }}
                            aria-label={`Select ${drug.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white py-5">{drug.drugCode}</TableCell>
                      <TableCell className="drug-name-catalog py-5">{drug.name}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 py-5">{drug.genericName || '-'}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300 py-5">{drug.strength || '-'}</TableCell>
                      <TableCell className="capitalize text-gray-700 dark:text-gray-300 py-5">{drug.form}</TableCell>
                      <TableCell className={cn(
                        "py-5 stock-level-cell rounded-md",
                        stockLevel === 0 ? "level-critical" :
                        stockLevel <= reorderLevel ? "level-low" :
                        "level-good"
                      )}>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full shadow-sm",
                            stockLevel === 0 ? "bg-red-600 animate-pulse" :
                            stockLevel <= reorderLevel ? "bg-orange-500" :
                            "bg-green-500"
                          )} />
                          <span className="text-sm font-semibold">
                            {formatDrugQuantity(stockLevel, drug.form)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-900 dark:text-white font-semibold py-5">{drug.reorderLevel}</TableCell>
                      <TableCell className="py-5">
                        <Badge 
                          className={drug.isActive 
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-premium-sm transition-all duration-150 hover:shadow-premium-md hover:from-green-700 hover:to-emerald-700 font-medium" 
                            : "bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-premium-sm transition-all duration-150 hover:shadow-premium-md hover:from-gray-700 hover:to-slate-700 font-medium"
                          }
                        >
                          {drug.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-5">
                        <div className="flex gap-1 justify-end">
                          <div className="icon-tooltip-wrapper">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDrug(drug);
                                setShowEditDrug(true);
                              }}
                              className="h-8 px-2.5 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400
                                       hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-150
                                       hover:shadow-premium-sm hover:scale-105"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <span className="icon-tooltip">Edit Drug</span>
                          </div>
                          <div className="icon-tooltip-wrapper">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDrug(drug);
                                setNewBatch({ ...newBatch, drugId: drug.id });
                                setShowReceiveStock(true);
                              }}
                              className="h-8 px-2.5 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400
                                       hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150
                                       hover:shadow-premium-sm hover:scale-105"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </Button>
                            <span className="icon-tooltip">Receive Stock</span>
                          </div>
                          <div className="icon-tooltip-wrapper">
                            <Button
                              size="sm"
                            variant="outline"
                            onClick={() => {
                              setBatchesDrug(drug);
                              setShowBatchesModal(true);
                            }}
                            className="h-8 px-2.5 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
                                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-150
                                     hover:shadow-premium-sm hover:scale-105"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <span className="icon-tooltip">View Batches</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                    );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeAlertView === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveAlertView('all')}
              className={activeAlertView === 'all' 
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" 
                : ""}
            >
              <FilterIcon className="w-3.5 h-3.5 mr-1.5" />
              All Alerts
            </Button>
            <Button
              variant={activeAlertView === 'lowStock' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveAlertView('lowStock')}
              className={activeAlertView === 'lowStock' 
                ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700" 
                : "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"}
            >
              <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
              Low Stock Only ({lowStockDrugs?.length || 0})
            </Button>
            <Button
              variant={activeAlertView === 'expiringSoon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveAlertView('expiringSoon')}
              className={activeAlertView === 'expiringSoon' 
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" 
                : "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Expiring Soon Only ({expiringDrugs?.length || 0})
            </Button>
          </div>

          {/* Low Stock Alerts */}
          {(activeAlertView === 'all' || activeAlertView === 'lowStock') && (
          <Card id="low-stock-section" className="shadow-premium-md border-red-200 dark:border-red-800/50 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <CardTitle className="text-red-700 dark:text-red-400 text-xl font-bold">
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription>Drugs below reorder level - take action now</CardDescription>
                </div>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-base px-3 py-1">
                  {lowStockDrugs?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockDrugs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 
                                  rounded-2xl shadow-premium-sm animate-float">
                      <Package className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Stock Levels Good!</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No drugs are currently below reorder level.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="space-y-3">
                {lowStockDrugs.map((drug) => (
                  <div
                    key={drug.id}
                    className="border-2 border-red-200 dark:border-red-800/50 rounded-xl p-4 
                             bg-gradient-to-br from-red-50 via-pink-50 to-red-50 dark:from-red-900/20 dark:via-pink-900/15 dark:to-red-900/20
                             shadow-premium-md hover:shadow-premium-lg transition-all duration-200 
                             hover:-translate-y-0.5 animate-slide-in-up"
                    data-testid={`alert-low-stock-${drug.id}`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{drug.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Code: {drug.drugCode} | Strength: {drug.strength || 'N/A'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                            <span className="font-bold text-red-600 dark:text-red-400 text-base">
                              {formatDrugQuantity(drug.stockOnHand, drug.form)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">Reorder Level:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatDrugQuantity(drug.reorderLevel, drug.form)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 items-start sm:items-end w-full sm:w-auto">
                        <Badge 
                          className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-premium-md
                                   hover:shadow-premium-lg transition-all duration-150 hover:scale-105 font-medium"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          LOW STOCK
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDrug(drug);
                          setNewBatch({ ...newBatch, drugId: drug.id });
                          setShowReceiveStock(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                                 shadow-premium-sm hover:shadow-premium-md transition-all duration-200"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        Receive Stock
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Clock className="w-4 h-4 mr-2" />
                            Snooze
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => {
                            // TODO: Implement backend API call to snooze alert
                            // For now, shows UI confirmation only
                            if (window.confirm(`Snooze this low stock alert for 7 days?\n\nDrug: ${drug.name}\nYou'll be reminded again after 7 days.`)) {
                              toast({
                                title: "Alert Snoozed",
                                description: `${drug.name} alert snoozed for 7 days`,
                              });
                              // TODO: Call API: await api.patch(`/pharmacy/alerts/${drug.id}/snooze`, { days: 7 });
                            }
                          }}>
                            Snooze for 7 days
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            // TODO: Implement backend API call to snooze alert
                            // For now, shows UI confirmation only
                            if (window.confirm(`Snooze this low stock alert for 30 days?\n\nDrug: ${drug.name}\nYou'll be reminded again after 30 days.`)) {
                              toast({
                                title: "Alert Snoozed",
                                description: `${drug.name} alert snoozed for 30 days`,
                              });
                              // TODO: Call API: await api.patch(`/pharmacy/alerts/${drug.id}/snooze`, { days: 30 });
                            }
                          }}>
                            Snooze for 30 days
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement backend API call to dismiss alert
                          // For now, shows UI confirmation only
                          if (window.confirm(`Dismiss this low stock alert?\n\nDrug: ${drug.name}\nThis will permanently dismiss this alert. You can still see the stock level in the Stock tab.`)) {
                            toast({
                              title: "Alert Dismissed",
                              description: `${drug.name} alert has been dismissed`,
                            });
                            // TODO: Call API: await api.patch(`/pharmacy/alerts/${drug.id}/dismiss`);
                          }
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Expiring Soon Alerts */}
          {(activeAlertView === 'all' || activeAlertView === 'expiringSoon') && (
          <Card id="expiring-soon-section" className="shadow-premium-md border-amber-200 dark:border-amber-800/50 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <CardTitle className="text-amber-700 dark:text-amber-400 text-xl font-bold">
                    Expiring Soon
                  </CardTitle>
                  <CardDescription>Items expiring in the next {EXPIRY_WARNING_DAYS} days - use FEFO (First Expiry First Out)</CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-base px-3 py-1">
                  {expiringDrugs?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {(!expiringDrugs || expiringDrugs.length === 0) ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 
                                  rounded-2xl shadow-premium-sm animate-float">
                      <Clock className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Expiring Items</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No batches expiring in the next {EXPIRY_WARNING_DAYS} days.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="space-y-3">
                {Array.isArray(expiringDrugs) && expiringDrugs.map((batch) => {
                  const expiryDate = new Date(batch.expiryDate);
                  const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isExpired = daysToExpiry < 0;
                  
                  return (
                    <div
                      key={batch.batchId}
                      className={`border-2 rounded-xl p-4 shadow-premium-md hover:shadow-premium-lg 
                               transition-all duration-200 hover:-translate-y-0.5 animate-slide-in-up ${
                        isExpired 
                          ? "border-red-500 dark:border-red-700/70 bg-gradient-to-br from-red-100 via-pink-100 to-red-100 dark:from-red-900/30 dark:via-pink-900/25 dark:to-red-900/30" 
                          : "border-amber-300 dark:border-amber-700/70 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-amber-900/20"
                      }`}
                      data-testid={`alert-expiring-${batch.batchId}`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{batch.drugName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Lot: {batch.lotNumber} | Batch ID: {batch.batchId}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                {formatDrugQuantity(batch.quantityOnHand, drugFormMap.get(batch.drugId) || 'other')}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Expiry:</span>
                              <span className={`ml-2 font-semibold ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {expiryDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          className={`${isExpired 
                            ? "bg-gradient-to-r from-red-600 to-red-500 shadow-premium-md" 
                            : "bg-gradient-to-r from-amber-600 to-orange-600 shadow-premium-md"
                          } text-white hover:shadow-premium-lg transition-all duration-150 hover:scale-105 font-medium`}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {isExpired ? "EXPIRED" : `${daysToExpiry}d`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          {/* Date Filter */}
          <DateFilter 
            onFilterChange={(preset, start, end) => {
              setTransactionDateFilter(preset);
              setTransactionStartDate(start);
              setTransactionEndDate(end);
            }}
            defaultPreset="all"
          />

          {/* Transaction Type Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter transactions:</span>
            <Button
              variant={transactionTypeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTransactionTypeFilter('all')}
              className={transactionTypeFilter === 'all' 
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" 
                : ""}
            >
              All ({ledgerEntries.length})
            </Button>
            <Button
              variant={transactionTypeFilter === 'received' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTransactionTypeFilter('received')}
              className={transactionTypeFilter === 'received' 
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                : "border-green-300 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"}
            >
              Received Only ({ledgerEntries.filter(e => e.transactionType === 'receive').length})
            </Button>
            <Button
              variant={transactionTypeFilter === 'dispensed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTransactionTypeFilter('dispensed')}
              className={transactionTypeFilter === 'dispensed' 
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700" 
                : "border-blue-300 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"}
            >
              Dispensed Only ({ledgerEntries.filter(e => e.transactionType === 'dispense').length})
            </Button>
          </div>

          {/* Analytics Dashboard */}
          <AnalyticsDashboard 
            ledgerEntries={filteredLedgerEntries} 
            dateFilterPreset={transactionDateFilter}
            customDateRange={transactionDateFilter === "custom" ? { start: transactionStartDate, end: transactionEndDate } : undefined}
          />
          
          <Card className="shadow-premium-md border-gray-200 dark:border-gray-700 
                         hover:shadow-premium-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Inventory Transaction History
                  </CardTitle>
                  <CardDescription>Complete log of all inventory movements</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (filteredLedgerEntries.length === 0) {
                      toast({
                        variant: "destructive",
                        title: "No Data to Export",
                        description: "There are no transactions to export.",
                      });
                      return;
                    }
                    setExportContext("ledger");
                    setShowExportModal(true);
                  }}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLedgerEntries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 
                                  rounded-2xl shadow-premium-sm">
                      <FileText className="w-16 h-16 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Transactions Found</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        {ledgerEntries.length === 0 
                          ? "No transactions recorded yet. Start by receiving stock."
                          : "No transactions match the selected date range. Try adjusting the filter."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                    <TableRow className="border-b-2 border-gray-200 dark:border-gray-700">
                      <TableHead className="font-semibold">Transaction ID</TableHead>
                      <TableHead className="font-semibold">Drug Name</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="text-right font-semibold">Quantity</TableHead>
                      <TableHead className="text-right font-semibold">Value (SSP)</TableHead>
                      <TableHead className="font-semibold">Performed By</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLedgerEntries.map((entry, index) => {
                      const drugDisplay = entry.drugName 
                        ? `${entry.drugName}${entry.drugStrength ? ' ' + entry.drugStrength : ''}`
                        : 'Unknown Drug';
                      
                      return (
                      <TableRow 
                        key={entry.id} 
                        data-testid={`ledger-${entry.transactionId}`}
                        className={`
                          transition-all duration-150 ease-in-out cursor-pointer border-b border-gray-100 dark:border-gray-800
                          ${index % 2 === 0 
                            ? "bg-white dark:bg-gray-900 hover:bg-slate-100 dark:hover:bg-slate-800" 
                            : "bg-slate-50 dark:bg-gray-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                          }
                        `}
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-white py-5">{entry.transactionId}</TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white py-5" title={drugDisplay}>
                          <div className="max-w-[200px] truncate">
                            {drugDisplay}
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge 
                            className={entry.transactionType === 'receive' 
                              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-premium-sm transition-all duration-150 hover:shadow-premium-md font-medium" 
                              : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-premium-sm transition-all duration-150 hover:shadow-premium-md font-medium"
                            }
                          >
                            {entry.transactionType === 'receive' ? 'Received' : entry.transactionType === 'dispense' ? 'Dispensed' : entry.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right tabular-nums font-semibold py-5 ${entry.quantity < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {entry.quantity > 0 ? '+' : ''}
                          {formatDrugQuantity(Math.abs(entry.quantity), drugFormMap.get(entry.drugId) || 'other')}
                        </TableCell>
                        <TableCell className={`text-right font-mono tabular-nums font-semibold py-5 ${(entry.totalValue || 0) < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                          {(entry.totalValue || 0) > 0 ? '+' : ''}{Math.round(entry.totalValue || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 py-5">{entry.performedBy}</TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-300 py-5">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Drug Dialog - Modernized & Expanded */}
      <Dialog open={showAddDrug} onOpenChange={setShowAddDrug}>
        <DialogContent className="max-w-[680px] max-h-[90vh] overflow-y-auto shadow-premium-2xl" data-testid="dialog-add-drug">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-premium-md">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Add New Drug</DialogTitle>
                <DialogDescription>Add a new drug to the catalog (one-time setup)</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                        rounded-xl border border-blue-200 dark:border-blue-800 shadow-premium-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setAddDrugInfoCollapsed(!addDrugInfoCollapsed)}
              className="w-full p-3 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded-lg">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">ℹ️ What is "Add Drug"?</h4>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-blue-600 transition-transform duration-200",
                !addDrugInfoCollapsed && "rotate-180"
              )} />
            </button>
            {!addDrugInfoCollapsed && (
              <div className="px-4 pb-4 pt-2">
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  This adds the drug to your catalog <strong>once</strong>. You don't set prices or expiry here - 
                  those come later when you "Receive Stock" (when you actually buy the drugs).
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {/* Quick Select from Common Drugs - Enhanced Premium Dropdown */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <Label htmlFor="commonDrug" className="text-base font-semibold">Quick Select (Common Drugs)</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    aria-label="Search and select from common drugs list"
                    className="w-full justify-between mt-2 h-11 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    data-testid="select-common-drug"
                  >
                    <span className="truncate">{comboboxSearch || "Search and select from common drugs list..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-w-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)]" align="start">
                  <Command className="rounded-lg border" shouldFilter={false}>
                    <CommandInput 
                      placeholder="Type to search drugs by name, category, or generic name..." 
                      value={comboboxSearch}
                      onValueChange={setComboboxSearch}
                      className="h-12"
                      aria-label="Search drugs"
                    />
                    <CommandEmpty className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-400" />
                        <p className="text-sm font-medium">No drugs found</p>
                        <p className="text-xs text-muted-foreground">Try searching with a different term</p>
                      </div>
                    </CommandEmpty>
                    <CommandGroup className="p-0">
                      <div 
                        className="max-h-[450px] overflow-y-auto overflow-x-hidden scrollbar-premium" 
                        style={{ 
                          WebkitOverflowScrolling: 'touch', 
                          overscrollBehavior: 'contain',
                          scrollBehavior: 'smooth',
                        }} 
                        role="listbox"
                        onWheel={(e) => {
                          // Ensure mouse wheel scrolling works by preventing event bubbling
                          // when we're not at scroll boundaries
                          const element = e.currentTarget;
                          const SCROLL_THRESHOLD = 1; // Small threshold to account for subpixel rendering
                          const isAtTop = element.scrollTop === 0;
                          const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - SCROLL_THRESHOLD;
                          
                          if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
                            e.stopPropagation();
                          }
                        }}
                      >
                      {(() => {
                        // Filter drugs based on search
                        const filteredDrugs = COMMON_DRUGS.filter(drug => 
                          !comboboxSearch || 
                          drug.name.toLowerCase().includes(comboboxSearch.toLowerCase()) ||
                          (drug.genericName?.toLowerCase() || '').includes(comboboxSearch.toLowerCase()) ||
                          drug.category.toLowerCase().includes(comboboxSearch.toLowerCase())
                        );

                        // Group drugs by category
                        const groupedDrugs = filteredDrugs.reduce((acc, drug) => {
                          if (!acc[drug.category]) {
                            acc[drug.category] = [];
                          }
                          acc[drug.category].push(drug);
                          return acc;
                        }, {} as Record<string, typeof COMMON_DRUGS>);

                        // Category icons mapping
                        const categoryIcons: Record<string, string> = {
                          'Analgesic': '💊',
                          'Antibiotic': '🦠',
                          'Antihypertensive': '❤️',
                          'Antidiabetic': '🩸',
                          'Gastrointestinal': '🔬',
                          'Antihistamine': '🤧',
                          'Respiratory': '🫁',
                          'Vitamin': '🌟',
                          'Antimalarial': '🦟',
                          'Antiparasitic': '🐛',
                          'IV Fluid': '💧',
                          'Antiemetic': '🤢',
                          'Corticosteroid': '💪',
                          'Antispasmodic': '✨',
                          'Sedative': '😴',
                          'Anesthetic': '🎯',
                          'Emergency': '🚨',
                          'Diuretic': '💧',
                          'Antifungal': '🍄',
                          'Obstetric': '🤰',
                          'Contraceptive': '🌸',
                          'Antiretroviral': '🔴',
                          'Vaccine': '💉',
                          'Opioid Analgesic': '💊',
                        };

                        return Object.entries(groupedDrugs).map(([category, drugs]) => (
                          <CommandGroup 
                            key={category} 
                            heading={
                              <div className="flex items-center gap-2 px-3 py-2.5 font-bold text-sm sticky top-0 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
                                <span className="text-lg" role="img" aria-label={category}>{categoryIcons[category] || '💊'}</span>
                                <span className="text-gray-800 dark:text-gray-200">{category}</span>
                                <span className="ml-auto text-xs font-normal text-muted-foreground bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                  {drugs.length} {drugs.length === 1 ? 'drug' : 'drugs'}
                                </span>
                              </div>
                            }
                            className="p-0"
                          >
                            {drugs.map((drug) => (
                              <CommandItem
                                key={drug.name}
                                value={drug.name}
                                onSelect={() => {
                                  setNewDrug({
                                    ...newDrug,
                                    name: drug.name,
                                    genericName: drug.genericName || "",
                                    strength: drug.strength,
                                    form: drug.form as any,
                                    unitOfMeasure: drug.form,
                                    category: drug.category || "",
                                  });
                                  setComboboxSearch(drug.name);
                                  setOpenCombobox(false);
                                }}
                                className="py-4 px-4 cursor-pointer hover:bg-accent/80 data-[selected='true']:bg-accent/90 transition-all duration-200 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:translate-x-1"
                                role="option"
                                aria-selected={comboboxSearch === drug.name}
                              >
                                <Check
                                  className={cn(
                                    "mr-3 h-4 w-4 shrink-0 text-primary",
                                    comboboxSearch === drug.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                  <div className="flex items-start gap-2">
                                    <span className="font-bold text-base leading-tight text-gray-900 dark:text-gray-100">{drug.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {drug.genericName && (
                                      <>
                                        <span className="font-medium">{drug.genericName}</span>
                                        <span className="text-gray-400">•</span>
                                      </>
                                    )}
                                    <span className="capitalize">{drug.form}</span>
                                    {drug.strength && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{drug.strength}</span>
                                      </>
                                    )}
                                  </div>
                                  {drug.summary && (
                                    <div className="flex items-start gap-1.5 mt-1">
                                      <span className="text-xs" role="img" aria-label="Educational info">📝</span>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                        {drug.summary}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ));
                      })()}
                      </div>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="tip-text-premium mt-2">
                <span className="text-lg">💡</span>
                <span className="font-medium">Tip: Or type custom drug name below</span>
              </div>
            </div>

            {/* Drug Name Section */}
            <div className="section-divider"></div>
            <div className="form-section-header">Drug Information</div>
            <div>
              <Label htmlFor="name" className="text-sm font-semibold">Drug Name *</Label>
              <Input
                id="name"
                value={newDrug.name}
                onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                placeholder="Type custom drug name or select above"
                className="input-premium"
                data-testid="input-drug-name"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">What the drug is called</p>
            </div>
            <div>
              <Label htmlFor="genericName" className="text-sm font-semibold">Generic Name (Optional)</Label>
              <Input
                id="genericName"
                value={newDrug.genericName}
                onChange={(e) => setNewDrug({ ...newDrug, genericName: e.target.value })}
                placeholder="e.g., Acetaminophen"
                className="input-premium"
                data-testid="input-generic-name"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Scientific/chemical name (optional)</p>
            </div>
            
            {/* Strength & Form Group */}
            <div className="field-group">
              <div className="form-section-header mb-3">Dosage & Form</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strength" className="text-sm font-semibold">Strength</Label>
                  <Input
                    id="strength"
                    value={newDrug.strength}
                    onChange={(e) => setNewDrug({ ...newDrug, strength: e.target.value })}
                    placeholder="e.g., 500mg"
                    className="input-premium"
                    data-testid="input-strength"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">How strong (500mg, 10ml, etc.)</p>
                </div>
                <div>
                  <Label htmlFor="form" className="text-sm font-semibold">Form</Label>
                  <Select
                    value={newDrug.form}
                    onValueChange={(value: DrugForm) => setNewDrug({ ...newDrug, form: value })}
                  >
                    <SelectTrigger id="form" className="select-premium" data-testid="select-form">
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="capsule">Capsule</SelectItem>
                      <SelectItem value="syrup">Syrup</SelectItem>
                      <SelectItem value="injection">Injection</SelectItem>
                      <SelectItem value="cream">Cream</SelectItem>
                      <SelectItem value="ointment">Ointment</SelectItem>
                      <SelectItem value="drops">Drops</SelectItem>
                      <SelectItem value="inhaler">Inhaler</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Category & Reorder Level Group */}
            <div className="field-group">
              <div className="form-section-header mb-3">Inventory Management</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                  <Input
                    id="category"
                    value={newDrug.category}
                    onChange={(e) => setNewDrug({ ...newDrug, category: e.target.value })}
                    placeholder="e.g., Analgesic"
                    className="input-premium"
                    data-testid="input-category"
                  />
                </div>
                <div>
                  <Label htmlFor="reorderLevel" className="text-sm font-semibold">Reorder Level</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    value={newDrug.reorderLevel}
                    onChange={(e) => setNewDrug({ ...newDrug, reorderLevel: parseInt(e.target.value) || DEFAULT_REORDER_LEVEL })}
                    className="input-premium"
                    data-testid="input-reorder-level"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Alert when stock falls below this number</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowAddDrug(false)} className="button-cancel-premium">
                Cancel
              </Button>
              <Button
                onClick={handleAddDrug}
                disabled={createDrugMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                         shadow-premium-md hover:shadow-premium-lg transition-all duration-200"
                data-testid="button-save-drug"
              >
                {createDrugMutation.isPending ? "Adding..." : "Add Drug"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Stock Dialog - Modernized */}
      <Dialog open={showReceiveStock} onOpenChange={setShowReceiveStock}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-premium-2xl" data-testid="dialog-receive-stock">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-premium-md">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Receive Stock</DialogTitle>
                <DialogDescription>Record drugs you just bought/received</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 
                        p-4 rounded-xl border border-green-200 dark:border-green-800 shadow-premium-sm">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-green-600 rounded-lg mt-0.5">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-1">ℹ️ What is "Receive Stock"?</h4>
                <p className="text-xs text-green-800 dark:text-green-200 leading-relaxed">
                  Use this when you <strong>actually receive/buy drugs</strong>. Each time you buy drugs, they have a new batch 
                  with their own expiry date, quantity, and price. This tracks each purchase separately.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="drug" className="text-sm font-semibold">Select Drug *</Label>
              <PremiumDrugSelector
                drugs={drugsWithStock}
                value={newBatch.drugId}
                onChange={(drugId) => setNewBatch({ ...newBatch, drugId })}
                placeholder="Search and select a drug..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Which drug did you receive?</p>
            </div>
            
            {/* Drug Context Display */}
            {newBatch.drugId > 0 && (() => {
              const drug = drugs.find(d => d.id === newBatch.drugId);
              const drugWithStock = drugsWithStock.find(d => d.id === newBatch.drugId);
              const drugBatches = allBatches.filter(b => b.drugId === newBatch.drugId && b.quantityOnHand > 0);
              const latestBatch = drugBatches.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())[0];
              const nearestExpiry = drugBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
              
              return drug ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                              p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-premium-sm">
                  <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Drug Information
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {drugWithStock?.stockOnHand || 0}
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Reorder Level:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {drug.reorderLevel}
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Nearest Expiry:</span>
                      <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400">
                        {nearestExpiry ? new Date(nearestExpiry.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Last Unit Cost:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        {latestBatch ? `${Math.round(latestBatch.unitCost)} SSP` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
            
            {/* Batch Details Section */}
            <div className="section-divider"></div>
            <div className="form-section-header">Batch Details</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lotNumber" className="text-sm font-semibold flex items-center gap-1.5">
                  <span>📦</span> Lot Number (Optional)
                </Label>
                <Input
                  id="lotNumber"
                  value={newBatch.lotNumber}
                  onChange={(e) => setNewBatch({ ...newBatch, lotNumber: e.target.value })}
                  placeholder="e.g., LOT12345"
                  className="input-premium"
                  data-testid="input-lot-number"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Batch number from box (optional)</p>
              </div>
              <div>
                <Label htmlFor="expiryDate" className="text-sm font-semibold flex items-center gap-1.5">
                  <span>📅</span> Expiry Date *
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newBatch.expiryDate}
                  onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                  className="input-premium"
                  data-testid="input-expiry-date"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">When these drugs expire</p>
              </div>
            </div>

            {/* Bulk Quantity Section - Enhanced */}
            <div className="section-highlight">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <span>📊</span> Bulk Purchase (Optional)
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">If you bought in cartons/boxes, fill this to auto-calculate total quantity</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="unitsPerCarton" className="text-xs font-medium">Units per Carton</Label>
                  <Input
                    id="unitsPerCarton"
                    type="number"
                    value={newBatch.unitsPerCarton || ''}
                    onChange={(e) => {
                      const units = parseInt(e.target.value) || 0;
                      const cartons = newBatch.cartonsReceived || 0;
                      setNewBatch({ 
                        ...newBatch, 
                        unitsPerCarton: units,
                        quantityOnHand: units > 0 && cartons > 0 ? units * cartons : newBatch.quantityOnHand 
                      });
                    }}
                    placeholder="e.g., 100"
                    className="input-premium"
                    data-testid="input-units-per-carton"
                  />
                </div>
                <div>
                  <Label htmlFor="cartonsReceived" className="text-xs font-medium">Cartons Received</Label>
                  <Input
                    id="cartonsReceived"
                    type="number"
                    value={newBatch.cartonsReceived || ''}
                    onChange={(e) => {
                      const cartons = parseInt(e.target.value) || 0;
                      const units = newBatch.unitsPerCarton || 0;
                      setNewBatch({ 
                        ...newBatch, 
                        cartonsReceived: cartons,
                        quantityOnHand: units > 0 && cartons > 0 ? units * cartons : newBatch.quantityOnHand 
                      });
                    }}
                    placeholder="e.g., 5"
                    className="input-premium"
                    data-testid="input-cartons-received"
                  />
                </div>
                <div>
                  <Label htmlFor="autoQuantity" className="text-xs font-medium flex items-center gap-1">
                    <span>🔢</span> Total Quantity
                  </Label>
                  <Input
                    id="autoQuantity"
                    type="number"
                    value={(newBatch.unitsPerCarton && newBatch.cartonsReceived) ? (newBatch.unitsPerCarton * newBatch.cartonsReceived) : newBatch.quantityOnHand}
                    readOnly
                    className="field-auto-calc input-premium bg-gray-100/50 dark:bg-gray-800/50"
                    data-testid="display-auto-quantity"
                  />
                </div>
              </div>
              <div className="tip-text-premium mt-3 text-xs">
                <span>💡</span>
                <span>Use bulk fields for carton purchases OR enter manual quantity below (entering one clears the other).</span>
              </div>
            </div>

            {/* Quantity & Price Section */}
            <div className="section-divider"></div>
            <div className="form-section-header">Quantity & Pricing</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-semibold flex items-center gap-1.5">
                  <span>📝</span> Manual Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newBatch.quantityOnHand || ''}
                  onChange={(e) => {
                    const qty = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                    setNewBatch({ 
                      ...newBatch, 
                      quantityOnHand: qty,
                      unitsPerCarton: 0,
                      cartonsReceived: 0
                    });
                  }}
                  placeholder="e.g., 100"
                  className="input-premium"
                  data-testid="input-quantity"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">How many tablets/bottles you got</p>
              </div>
              <div>
                <Label htmlFor="unitCost" className="text-sm font-semibold flex items-center gap-1.5">
                  <span>💰</span> Unit Cost (SSP) *
                </Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={newBatch.unitCost || ''}
                  onChange={(e) => {
                    const cost = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    setNewBatch({ ...newBatch, unitCost: cost });
                  }}
                  placeholder="e.g., 5.50"
                  className="input-premium"
                  data-testid="input-unit-cost"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Price per one tablet/bottle</p>
              </div>
            </div>

            <div>
              <Label htmlFor="supplier" className="text-sm font-semibold flex items-center gap-1.5">
                <span>🏪</span> Supplier (Optional)
              </Label>
              <Input
                id="supplier"
                value={newBatch.supplier}
                onChange={(e) => setNewBatch({ ...newBatch, supplier: e.target.value })}
                placeholder="Supplier name"
                className="input-premium"
                data-testid="input-supplier"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Where you bought from (optional)</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowReceiveStock(false)} className="button-cancel-premium">
                Cancel
              </Button>
              <Button
                onClick={handleReceiveStock}
                disabled={
                  receiveStockMutation.isPending ||
                  !newBatch.drugId ||
                  !newBatch.expiryDate ||
                  newBatch.quantityOnHand <= 0 ||
                  newBatch.unitCost <= 0
                }
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500
                         shadow-premium-md hover:shadow-premium-lg transition-all duration-200 hover:scale-105
                         disabled:hover:scale-100 disabled:hover:shadow-premium-md"
                data-testid="button-save-stock"
              >
                {receiveStockMutation.isPending ? "Receiving..." : "Receive Stock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Drug Dialog */}
      <Dialog open={showEditDrug} onOpenChange={setShowEditDrug}>
        <DialogContent className="max-w-2xl shadow-premium-2xl" data-testid="dialog-edit-drug">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-premium-md">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Edit Drug</DialogTitle>
                <DialogDescription>Update drug information in the catalog</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editingDrug && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Drug Name *</Label>
                <Input
                  id="edit-name"
                  value={editingDrug.name}
                  onChange={(e) => setEditingDrug({ ...editingDrug, name: e.target.value })}
                  placeholder="Drug name"
                  data-testid="input-edit-drug-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-genericName">Generic Name (Optional)</Label>
                <Input
                  id="edit-genericName"
                  value={editingDrug.genericName || ""}
                  onChange={(e) => setEditingDrug({ ...editingDrug, genericName: e.target.value })}
                  placeholder="e.g., Acetaminophen"
                  data-testid="input-edit-generic-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-strength">Strength</Label>
                  <Input
                    id="edit-strength"
                    value={editingDrug.strength || ""}
                    onChange={(e) => setEditingDrug({ ...editingDrug, strength: e.target.value })}
                    placeholder="e.g., 500mg"
                    data-testid="input-edit-strength"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-form">Form</Label>
                  <Select
                    value={editingDrug.form}
                    onValueChange={(value: DrugForm) => setEditingDrug({ ...editingDrug, form: value })}
                  >
                    <SelectTrigger id="edit-form" data-testid="select-edit-form">
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="capsule">Capsule</SelectItem>
                      <SelectItem value="syrup">Syrup</SelectItem>
                      <SelectItem value="injection">Injection</SelectItem>
                      <SelectItem value="cream">Cream</SelectItem>
                      <SelectItem value="ointment">Ointment</SelectItem>
                      <SelectItem value="drops">Drops</SelectItem>
                      <SelectItem value="inhaler">Inhaler</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editingDrug.category || ""}
                    onChange={(e) => setEditingDrug({ ...editingDrug, category: e.target.value })}
                    placeholder="e.g., Analgesic"
                    data-testid="input-edit-category"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-reorderLevel">Reorder Level</Label>
                  <Input
                    id="edit-reorderLevel"
                    type="number"
                    value={editingDrug.reorderLevel}
                    onChange={(e) => setEditingDrug({ ...editingDrug, reorderLevel: parseInt(e.target.value) || DEFAULT_REORDER_LEVEL })}
                    data-testid="input-edit-reorder-level"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditDrug(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await apiRequest('PUT', `/api/pharmacy/drugs/${editingDrug.id}`, {
                        name: editingDrug.name,
                        genericName: editingDrug.genericName,
                        category: editingDrug.category,
                        form: editingDrug.form,
                        strength: editingDrug.strength,
                        reorderLevel: editingDrug.reorderLevel,
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/drugs'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/pharmacy/stock/all'] });
                      setShowEditDrug(false);
                      toast({
                        title: "Drug Updated",
                        description: "Drug information has been updated successfully.",
                      });
                    } catch (error) {
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to update drug information.",
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700
                           shadow-premium-md hover:shadow-premium-lg transition-all duration-200"
                  data-testid="button-save-edit-drug"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Drug Batches Dialog */}
      <Dialog open={showBatchesModal} onOpenChange={setShowBatchesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-premium-2xl" data-testid="dialog-view-batches">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-premium-md">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {batchesDrug?.name || "Drug"} - Batch Details
                </DialogTitle>
                <DialogDescription>View all batches and inventory details</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {batchesDrug && (
            <div className="space-y-6">
              {/* Drug Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                            p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-premium-sm">
                <h5 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Drug Information
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Code:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {batchesDrug.drugCode}
                    </span>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {batchesDrug.strength || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Form:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white capitalize">
                      {batchesDrug.form}
                    </span>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-400">Reorder Level:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {batchesDrug.reorderLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batches Table */}
              <div>
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Active Batches</h5>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Lot Number</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Cost (SSP)</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBatches
                      .filter(b => b.drugId === batchesDrug.id && b.quantityOnHand > 0)
                      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                      .map((batch) => {
                        const expiryDate = new Date(batch.expiryDate);
                        const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = daysToExpiry <= EXPIRY_WARNING_DAYS;
                        const isExpired = daysToExpiry < 0;

                        return (
                          <TableRow 
                            key={batch.batchId}
                            className={`
                              transition-colors duration-150
                              ${isExpired 
                                ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30" 
                                : isExpiringSoon 
                                  ? "bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30" 
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              }
                            `}
                          >
                            <TableCell className="font-medium">{batch.batchId}</TableCell>
                            <TableCell>{batch.lotNumber || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={isExpired ? "text-red-600 dark:text-red-400 font-semibold" : isExpiringSoon ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                                  {expiryDate.toLocaleDateString()}
                                </span>
                                {isExpired ? (
                                  <Badge className="bg-red-600 text-white text-xs">EXPIRED</Badge>
                                ) : isExpiringSoon ? (
                                  <Badge className="bg-amber-600 text-white text-xs">{daysToExpiry}d</Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{batch.quantityOnHand}</TableCell>
                            <TableCell className="text-right font-mono">{Math.round(batch.unitCost).toLocaleString()}</TableCell>
                            <TableCell>{batch.supplier || 'N/A'}</TableCell>
                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(batch.receivedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
                {allBatches.filter(b => b.drugId === batchesDrug.id && b.quantityOnHand > 0).length === 0 && (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 
                                    rounded-2xl shadow-premium-sm">
                        <Package className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Active Batches</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          This drug has no batches with stock currently.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedDrug(batchesDrug);
                          setNewBatch({ ...newBatch, drugId: batchesDrug.id });
                          setShowBatchesModal(false);
                          setShowReceiveStock(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 mt-2"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Receive Stock
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Adjust Modal */}
      <QuickAdjustModal
        drug={quickAdjustDrug}
        open={showQuickAdjust}
        onOpenChange={setShowQuickAdjust}
        onConfirm={handleQuickAdjust}
      />

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        title={`Export ${exportContext === "stock" ? "Stock Overview" : exportContext === "catalog" ? "Drug Catalog" : "Transaction History"}`}
        columns={getExportColumns()}
        rowCount={exportContext === "stock" ? filteredStockDrugs.length : exportContext === "catalog" ? filteredCatalogDrugs.length : filteredLedgerEntries.length}
        selectedCount={exportContext === "stock" ? selectedStockItems.size : selectedCatalogItems.size}
        defaultFilename={`pharmacy-${exportContext}-${new Date().toISOString().split('T')[0]}`}
        onExport={handleExport}
      />

      {/* Drug Info Modal */}
      <DrugInfoModal
        drug={drugInfoDrug}
        stockInfo={drugInfoStockData}
        open={showDrugInfo}
        onOpenChange={setShowDrugInfo}
      />

      {/* Bulk Action Bar for Stock */}
      <BulkActionBar
        selectedCount={selectedStockItems.size}
        onClearSelection={() => setSelectedStockItems(new Set())}
        actions={getStockBulkActions(
          () => toast({ title: "Bulk Receive", description: "Feature coming soon" }),
          () => toast({ title: "Bulk Price Update", description: "Feature coming soon" }),
          () => {
            setExportContext("stock");
            setShowExportModal(true);
          }
        )}
      />

      {/* Bulk Action Bar for Catalog */}
      {selectedCatalogItems.size > 0 && (
        <BulkActionBar
          selectedCount={selectedCatalogItems.size}
          onClearSelection={() => setSelectedCatalogItems(new Set())}
          actions={getCatalogBulkActions(
            () => toast({ title: "Bulk Edit", description: "Feature coming soon" }),
            () => {
              setExportContext("catalog");
              setShowExportModal(true);
            }
          )}
        />
      )}
      </div>
    </div>
  );
}
