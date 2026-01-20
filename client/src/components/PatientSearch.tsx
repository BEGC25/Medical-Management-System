import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Patient, PatientWithStatus } from "@shared/schema";
import { formatClinicDay } from "@/lib/date-utils";
import { hasPendingOrders, getPatientIndicators, type ResultsReadyMap } from "@/lib/patient-utils";
import { getVisitStatusLabel } from "@/lib/display-utils";
import { cn } from "@/lib/utils";

interface PatientSearchProps {
  onSelectPatient?: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
  onViewPatient?: (patient: Patient) => void;
  showActions?: boolean;
  viewMode: "today" | "date" | "search" | "all" | "dateRange";
  selectedDate: string;
  startDate?: string;
  endDate?: string;
  searchTerm: string;
  onSearchTermChange?: (term: string) => void;
  shouldSearch?: boolean;
  onShouldSearchChange?: (should: boolean) => void;
  filterPendingOnly?: boolean; // Filter to show only patients with unpaid orders
  preset?: string; // Optional preset for cache key differentiation (e.g., "today", "yesterday", "last7", "last30")
  resultsReadyMap?: ResultsReadyMap; // Map of completed diagnostic results by patient ID
  excludePatientTypes?: string[]; // Optional list of patient types to exclude (e.g., ["referral_diagnostic"])
  selectedPatientId?: string; // Optional patient ID to highlight as selected
}

// Format date as "19 Oct 2025" in clinic timezone (Africa/Juba)
// Handles both YYYY-MM-DD date keys and ISO timestamps
function formatDate(dateStr: string | null | undefined): string {
  return formatClinicDay(dateStr, 'd MMM yyyy');
}

// Format gender for display (M/F or original value)
function formatGender(gender?: string): string {
  if (!gender) return '—';
  if (gender.toLowerCase() === 'male') return 'M';
  if (gender.toLowerCase() === 'female') return 'F';
  return gender;
}

// Generate consistent avatar colors based on initials
function getAvatarColor(firstName?: string, lastName?: string): string {
  // Generate consistent color based on first letter of first name
  const colors: Record<string, string> = {
    'A': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'B': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'C': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'D': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'E': 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
    'F': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'G': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'H': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    'I': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    'J': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    'K': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'L': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'M': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'N': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'O': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    'P': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'Q': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'R': 'bg-red-200 text-red-800 dark:bg-red-800/30 dark:text-red-300',
    'S': 'bg-orange-200 text-orange-800 dark:bg-orange-800/30 dark:text-orange-300',
    'T': 'bg-amber-200 text-amber-800 dark:bg-amber-800/30 dark:text-amber-300',
    'U': 'bg-lime-200 text-lime-800 dark:bg-lime-800/30 dark:text-lime-300',
    'V': 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/30 dark:text-emerald-300',
    'W': 'bg-teal-200 text-teal-800 dark:bg-teal-800/30 dark:text-teal-300',
    'X': 'bg-cyan-200 text-cyan-800 dark:bg-cyan-800/30 dark:text-cyan-300',
    'Y': 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800/30 dark:text-indigo-300',
    'Z': 'bg-violet-200 text-violet-800 dark:bg-violet-800/30 dark:text-violet-300',
  };
  
  // Use first letter of first name for color selection
  const key = (firstName?.[0] || '').toUpperCase();
  return colors[key] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
}

export default function PatientSearch({
  onViewPatient,
  showActions = true,
  viewMode,
  selectedDate,
  startDate,
  endDate,
  searchTerm,
  filterPendingOnly = false,
  preset,
  resultsReadyMap,
  excludePatientTypes = [],
  selectedPatientId,
}: PatientSearchProps) {
  // Always-on search: if 3+ chars, force "search"
  const effectiveMode = searchTerm.trim().length >= 3 ? "search" : viewMode;

  const { data: rawPatients, isLoading } = useQuery({
    queryKey: [
      "/api/patients",
      effectiveMode,
      selectedDate,
      startDate,
      endDate,
      searchTerm,
      "withStatus",
      preset, // Include preset in cache key to avoid Today/Yesterday cache reuse
    ],
    enabled: (
      effectiveMode !== 'dateRange'
      || preset === 'last7'
      || preset === 'last30'
      || (preset === 'custom' && !!startDate && !!endDate)
    ),
    queryFn: async () => {
      // Search mode: use search parameter
      if (effectiveMode === "search") {
        const r = await fetch(
          `/api/patients?search=${encodeURIComponent(
            searchTerm,
          )}&withStatus=true`,
        );
        if (!r.ok) throw new Error("Failed to search patients");
        return r.json();
      }
      
      // All mode: no filters
      if (effectiveMode === "all") {
        const r = await fetch("/api/patients?withStatus=true");
        if (!r.ok) throw new Error("Failed to fetch all patients");
        return r.json();
      }
      
      // Date-based filtering: use preset-based API for consistency
      const params = new URLSearchParams({
        withStatus: 'true',
        filterBy: 'encounters', // Treatment page filters by encounter dates
      });
      
      if (effectiveMode === 'dateRange' && preset) {
        if (preset === 'custom') {
          if (!startDate || !endDate) {
            // Defer fetch (should not happen because enabled guards) but safety
            return [];
          }
          params.append('preset', 'custom');
          params.append('from', startDate);
          params.append('to', endDate);
        } else if (preset === 'last7' || preset === 'last30') {
          params.append('preset', preset);
        }
      } else if (effectiveMode === "today") {
        // Today preset
        params.append('preset', 'today');
      } else if (effectiveMode === "date" && preset) {
        // Single day with preset (today, yesterday)
        params.append('preset', preset);
      } else if (effectiveMode === "date" && selectedDate) {
        // Fallback: single date without preset (legacy)
        params.append('preset', 'custom');
        params.append('from', selectedDate);
        params.append('to', selectedDate);
      }
      
      const r = await fetch(`/api/patients?${params.toString()}`);
      if (!r.ok) throw new Error("Failed to fetch patients");
      return r.json();
    },
  });

  // Filter patients with pending orders if requested
  const patients = filterPendingOnly && rawPatients
    ? rawPatients.filter(hasPendingOrders)
    : rawPatients;

  // Filter out excluded patient types (e.g., referral_diagnostic)
  // Use useMemo to optimize filtering performance
  const filteredPatients = useMemo(() => {
    if (!patients) return patients;
    if (excludePatientTypes.length === 0) return patients;
    return patients.filter((p: Patient) => !excludePatientTypes.includes(p.patientType));
  }, [patients, excludePatientTypes]);

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue" />
        </div>
      )}

      {filteredPatients && filteredPatients.length > 0 && (
        <>
          {/* Column Headers */}
          <div className="hidden md:grid grid-cols-[0.4fr_2fr_0.6fr_0.8fr_1fr_0.8fr_1.2fr_0.8fr] gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 
                          border-b border-gray-200 dark:border-gray-700 
                          text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            <div>No.</div>
            <div>Patient</div>
            <div>ID</div>
            <div>Age/Sex</div>
            <div>Contact</div>
            <div>Status</div>
            <div>Diagnostics</div>
            <div className="text-right">Date</div>
          </div>

          {/* Patient Rows */}
          <div className="space-y-1.5 p-2">
            {filteredPatients.map((p: PatientWithStatus & { lastEncounterDate?: string; updatedAt?: string }, index: number) => {
              // ALWAYS use patient's actual dateOfService from API when available
              const displayDate = p.dateOfService || p.lastVisit || p.lastEncounterDate || 
                ((effectiveMode === "date" || effectiveMode === "today") && selectedDate
                  ? selectedDate
                  : (p.updatedAt || p.createdAt));
              
              const isSelected = selectedPatientId === p.patientId;
              const indicators = getPatientIndicators(p, resultsReadyMap);

              return (
                <div
                  key={p.id || p.patientId}
                  onClick={() => onViewPatient?.(p)}
                  className={cn(
                    "bg-white dark:bg-gray-800 rounded-lg border-2 px-4 py-2",
                    "hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500",
                    "transition-all duration-200 cursor-pointer",
                    "grid grid-cols-[0.4fr_2fr_0.6fr_0.8fr_1fr_0.8fr_1.2fr_0.8fr] gap-3 items-center",
                    isSelected
                      ? "border-blue-500 dark:border-blue-400 shadow-lg"
                      : "border-gray-200 dark:border-gray-700"
                  )}
                >
                  {/* No. */}
                  <div className="text-sm font-medium text-gray-500">{index + 1}</div>
                  
                  {/* Patient Name with Avatar */}
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                      getAvatarColor(p.firstName, p.lastName)
                    )}>
                      {(p.firstName?.[0] || "").toUpperCase()}
                      {(p.lastName?.[0] || "").toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {p.firstName} {p.lastName}
                    </span>
                  </div>
                  
                  {/* ID */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">{p.patientId}</div>
                  
                  {/* Age/Sex */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {p.age ?? '—'} • {formatGender(p.gender || undefined)}
                  </div>
                  
                  {/* Contact */}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {p.phoneNumber || '—'}
                  </div>
                  
                  {/* Visit Status */}
                  <div>
                    {p.visitStatus ? (
                      <Badge className={cn(
                        "text-xs",
                        p.visitStatus === 'open' 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300" 
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {getVisitStatusLabel(p.visitStatus)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                  
                  {/* Diagnostics */}
                  <div className="flex flex-wrap gap-1">
                    {indicators.waiting.length > 0 && (
                      <Badge 
                        variant="outline"
                        className="text-xs border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                      >
                        Waiting: {indicators.waiting.join(', ')}
                      </Badge>
                    )}
                    
                    {indicators.ready.length > 0 && (
                      <Badge 
                        variant="outline"
                        className="text-xs border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                      >
                        Ready: {indicators.ready.join(', ')}
                      </Badge>
                    )}
                    
                    {indicators.waiting.length === 0 && indicators.ready.length === 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        No diagnostics pending
                      </span>
                    )}
                  </div>
                  
                  {/* Date */}
                  <div className="text-sm text-gray-500 text-right">
                    {formatDate(displayDate)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {filteredPatients && filteredPatients.length === 0 && (
        <div className={cn(
          "bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed",
          "border-gray-300 dark:border-gray-700 p-12 text-center"
        )}>
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No patients found for this date range
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try adjusting your filters or selecting a different date range
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
