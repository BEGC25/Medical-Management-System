import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@shared/schema";

interface PatientSearchProps {
  onSelectPatient?: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
  onViewPatient?: (patient: Patient) => void;
  showActions?: boolean;
  viewMode: "today" | "date" | "search" | "all";
  selectedDate: string;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  shouldSearch: boolean;
  onShouldSearchChange: (should: boolean) => void;
}

function money(n?: number) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  try {
    return v.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  } catch {
    return `₦${v.toLocaleString()}`;
  }
}

export default function PatientSearch({
  onSelectPatient,
  onViewPatient,
  showActions = true,
  viewMode,
  selectedDate,
  searchTerm,
}: PatientSearchProps) {
  // Always-on search: if 3+ chars, force "search"
  const effectiveMode = searchTerm.trim().length >= 3 ? "search" : viewMode;

  const { data: patients, isLoading } = useQuery({
    queryKey: [
      "/api/patients",
      effectiveMode,
      selectedDate,
      searchTerm,
      "withStatus",
    ],
    enabled: true,
    queryFn: async () => {
      if (effectiveMode === "today") {
        const r = await fetch("/api/patients?today=true&withStatus=true");
        if (!r.ok) throw new Error("Failed to fetch today's patients");
        return r.json();
      }
      if (effectiveMode === "date") {
        const r = await fetch(
          `/api/patients?date=${encodeURIComponent(
            selectedDate,
          )}&withStatus=true`,
        );
        if (!r.ok)
          throw new Error("Failed to fetch patients for selected date");
        return r.json();
      }
      if (effectiveMode === "all") {
        const r = await fetch("/api/patients?withStatus=true");
        if (!r.ok) throw new Error("Failed to fetch all patients");
        return r.json();
      }
      const r = await fetch(
        `/api/patients?search=${encodeURIComponent(
          searchTerm,
        )}&withStatus=true`,
      );
      if (!r.ok) throw new Error("Failed to search patients");
      return r.json();
    },
  });

<<<<<<< HEAD
  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue" />
=======
  const handleSearch = () => {
    if (searchTerm.trim().length > 2) onShouldSearchChange(true);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // Auto-trigger search with debounce effect for better UX
  React.useEffect(() => {
    if (viewMode === "search" && searchTerm.length >= 3) {
      const timeoutId = setTimeout(() => {
        onShouldSearchChange(true);
      }, 500); // 500ms delay
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, viewMode, onShouldSearchChange]);

  return (
    <div className="space-y-4">
      {viewMode === "search" && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Enter patient name or ID (min 3 chars)…"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searchTerm.trim().length < 3}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      )}

      {viewMode === "search" && searchTerm.length < 3 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full grid place-items-center mx-auto mb-3">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {onSelectPatient 
              ? "Type at least 3 characters to search for patients to select"
              : "Type at least 3 characters to search for patients"
            }
          </p>
        </div>
      )}

      {patients && patients.length > 0 && onSelectPatient && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center">
            <Search className="w-4 h-4 mr-2" />
            Click on a patient row to select them for the X-Ray request
          </p>
        </div>
      )}

      {isLoading && searchTerm.length >= 3 && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Searching patients...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full grid place-items-center mx-auto mb-3">
            <Search className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-sm text-red-600 dark:text-red-400">
            Error searching patients. Please try again.
          </p>
>>>>>>> origin/main
        </div>
      )}

      {patients && patients.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Patient
                </th>
                {/* Contact column removed */}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Age / Sex
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Consultation
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                  Date of Service
                </th>
                {showActions && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {patients.map((p: any, i: number) => {
                const s = p.serviceStatus || {};
                const due = (s.balanceToday ?? s.balance ?? 0) as number;
                const last =
                  p.lastVisit ||
                  p.lastEncounterDate ||
                  p.updatedAt ||
                  p.createdAt;

                return (
                  <tr
                    key={p.id || p.patientId}
                    className={`transition-all duration-200 ${
                      i % 2
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50/50 dark:bg-gray-800/50"
                    } hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer hover:shadow-md border-l-4 border-transparent hover:border-blue-500`}
                    onClick={() => {
                      // For selection mode (like in X-Ray form), use onSelectPatient
                      // For viewing mode (like in main patients page), use onViewPatient
                      if (onSelectPatient) {
                        onSelectPatient(p);
                      } else {
                        onViewPatient?.(p);
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 grid place-items-center text-xs font-semibold">
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

                    {/* Contact column removed */}
                    <td className="px-4 py-3 text-sm">
                      {p.age ?? "—"} • {p.gender || "—"}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {due > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                          <CreditCard className="w-3 h-3" />
                          {money(due)} Due
                        </span>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Paid
                        </Badge>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-right hidden lg:table-cell">
                      {last ? new Date(last).toLocaleDateString() : "—"}
                    </td>

                    {showActions && (
                      <td className="px-4 py-3 text-sm">
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

      {patients && patients.length === 0 && (
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
