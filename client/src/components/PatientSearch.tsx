import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Search, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@shared/schema";
import { formatClinicDay } from "@/lib/date-utils";
import { hasPendingOrders, getPatientIndicators, type ResultsReadyMap } from "@/lib/patient-utils";
import { getVisitStatusLabel } from "@/lib/display-utils";

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

// Generate consistent avatar colors based on initials
function getAvatarColor(firstName?: string, lastName?: string): string {
  const name = `${firstName || ""}${lastName || ""}`;
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/80 border-b-2 border-gray-200 dark:border-gray-700">
              <tr className="hover:bg-transparent">
                <th className="px-2 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 w-12">
                  #
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Patient
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Age / Sex
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Contact
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Visit Status
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Diagnostics
                </th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                  Date of Service
                </th>
                {showActions && (
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPatients.map((p: any, i: number) => {
                const s = p.serviceStatus || {};
                const due = (s.balanceToday ?? s.balance ?? 0) as number;
                // ALWAYS use patient's actual dateOfService from API when available
                const displayDate = p.dateOfService || p.lastVisit || p.lastEncounterDate || 
                  ((effectiveMode === "date" || effectiveMode === "today") && selectedDate
                    ? selectedDate
                    : (p.updatedAt || p.createdAt));
                
                const isSelected = selectedPatientId === p.patientId;

                return (
                  <tr
                    key={p.id || p.patientId}
                    className={`transition-all duration-200 cursor-pointer border-b border-gray-100 dark:border-gray-800 ${
                      isSelected
                        ? "bg-blue-100 dark:bg-blue-900/40 border-l-4 border-l-blue-500"
                        : i % 2
                        ? "bg-gray-50/50 dark:bg-gray-800/50"
                        : "bg-white dark:bg-gray-900"
                    } hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:shadow-md hover:scale-[1.01] hover:border-blue-200 dark:hover:border-blue-800`}
                    onClick={() => onViewPatient?.(p)}
                  >
                    <td className="px-2 py-2 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${getAvatarColor(p.firstName, p.lastName)}`}>
                          {(p.firstName?.[0] || "").toUpperCase()}
                          {(p.lastName?.[0] || "").toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {p.firstName} {p.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {p.patientId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2 text-sm">
                      {p.age ?? "—"} • {p.gender || "—"}
                    </td>

                    {p.phoneNumber ? (
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        {p.phoneNumber}
                      </td>
                    ) : (
                      <td className="px-4 py-2 text-sm text-gray-400 dark:text-gray-600">
                        —
                      </td>
                    )}

                    <td className="px-4 py-2 text-sm">
                      {p.visitStatus ? (
                        <Badge 
                          variant={p.visitStatus === "open" ? "default" : p.visitStatus === "closed" ? "secondary" : "outline"}
                          className={`text-xs capitalize ${
                            p.visitStatus === "open" ? "bg-green-600 text-white" :
                            p.visitStatus === "closed" ? "bg-gray-600 text-white" :
                            "bg-yellow-600 text-white"
                          }`}
                        >
                          {getVisitStatusLabel(p.visitStatus)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-sm">
                      {(() => {
                        const indicators = getPatientIndicators(p, resultsReadyMap);
                        
                        // Show empty state only if both are empty
                        if (indicators.waiting.length === 0 && indicators.ready.length === 0) {
                          return <span className="text-gray-400 text-xs">—</span>;
                        }
                        
                        return (
                          <div className="flex flex-wrap gap-1">
                            {/* Waiting badge - show if there are pending orders */}
                            {indicators.waiting.length > 0 && (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 flex items-center gap-1"
                              >
                                <AlertCircle className="w-2.5 h-2.5" />
                                Waiting: {indicators.waiting.join(', ')}
                              </Badge>
                            )}
                            
                            {/* Ready badge - show if there are completed results */}
                            {indicators.ready.length > 0 && (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 flex items-center gap-1"
                              >
                                <CheckCircle className="w-2.5 h-2.5" />
                                Ready: {indicators.ready.join(', ')}
                              </Badge>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-4 py-2 text-sm text-right hidden lg:table-cell">
                      {formatDate(displayDate)}
                    </td>

                    {showActions && (
                      <td className="px-4 py-2 text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewPatient?.(p);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredPatients && filteredPatients.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full grid place-items-center">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                No patients found
              </h3>
              <p className="text-sm text-gray-500">
                Try a different name or patient ID.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
