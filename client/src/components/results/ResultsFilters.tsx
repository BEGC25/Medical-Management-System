import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import type { Patient, ResultsFilters } from "./types";

interface ResultsFiltersProps {
  filters: ResultsFilters;
  patients: Patient[];
  onFilterChange: (filters: Partial<ResultsFilters>) => void;
  resultCount: number;
}

export function ResultsFiltersBar({ filters, patients, onFilterChange, resultCount }: ResultsFiltersProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Patient Filter */}
          <div>
            <Label htmlFor="patient-filter" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
              Filter by Patient
            </Label>
            <select
              id="patient-filter"
              value={filters.selectedPatient}
              onChange={(e) => onFilterChange({ selectedPatient: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              aria-label="Filter by patient"
            >
              <option value="">All Patients</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.patientId}>
                  {patient.firstName} {patient.lastName} ({patient.patientId})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status-filter" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
              Status
            </Label>
            <select
              id="status-filter"
              value={filters.statusFilter}
              onChange={(e) => onFilterChange({ statusFilter: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <Label htmlFor="date-filter" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
              Date Filter
            </Label>
            <select
              id="date-filter"
              value={filters.dateFilter}
              onChange={(e) => onFilterChange({ dateFilter: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              aria-label="Filter by date"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="date">Specific Date</option>
            </select>
          </div>

          {/* Specific Date Picker (conditional) */}
          {filters.dateFilter === "date" && (
            <div>
              <Label htmlFor="specific-date" className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
                Specific Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="specific-date"
                  type="date"
                  value={filters.selectedDate}
                  onChange={(e) => onFilterChange({ selectedDate: e.target.value })}
                  className="pl-10 h-9 text-sm"
                  aria-label="Select specific date"
                />
              </div>
            </div>
          )}
          
          {/* Result Count Display */}
          {filters.dateFilter !== "date" && (
            <div className="flex items-end">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{resultCount}</span> results found
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
