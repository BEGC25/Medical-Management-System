import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, Edit, AlertCircle, Clock, CheckCircle, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Patient } from "@shared/schema";

interface PatientSearchProps {
  onSelectPatient?: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
  onViewPatient?: (patient: Patient) => void;
  showActions?: boolean;
  viewMode: 'today' | 'date' | 'search' | 'all';
  selectedDate: string;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  shouldSearch: boolean;
  onShouldSearchChange: (should: boolean) => void;
}

export default function PatientSearch({ 
  onSelectPatient, 
  onEditPatient, 
  onViewPatient, 
  showActions = true, 
  viewMode, 
  selectedDate,
  searchTerm,
  onSearchTermChange,
  shouldSearch,
  onShouldSearchChange
}: PatientSearchProps) {

  // Build query based on view mode
  const getQueryParams = () => {
    if (viewMode === 'today') {
      return { today: 'true' };
    } else if (viewMode === 'date') {
      return { date: selectedDate };
    } else if (viewMode === 'all') {
      return { all: 'true' };
    } else {
      return { search: searchTerm };
    }
  };

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/patients", getQueryParams(), "withStatus"],
    enabled: viewMode === 'today' || viewMode === 'date' || viewMode === 'all' || (viewMode === 'search' && shouldSearch && searchTerm.length > 0),
    queryFn: () => {
      if (viewMode === 'today') {
        return fetch('/api/patients?today=true&withStatus=true').then(res => res.json());
      } else if (viewMode === 'date') {
        return fetch(`/api/patients?date=${encodeURIComponent(selectedDate)}&withStatus=true`).then(res => res.json());
      } else if (viewMode === 'all') {
        return fetch('/api/patients?withStatus=true').then(res => res.json());
      } else {
        return fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}&withStatus=true`).then(res => res.json());
      }
    },
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onShouldSearchChange(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search input - only show for search mode */}
      {viewMode === 'search' && (
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Enter patient name or ID..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue"></div>
        </div>
      )}

      {/* Show results for all view modes when data is available */}
      {((viewMode === 'today' || viewMode === 'date' || viewMode === 'all' || shouldSearch) && patients && patients.length > 0) && (
        <div>
          <h3 className="font-medium text-gray-800 mb-3 dark:text-gray-200">
            {viewMode === 'today' && 'Today\'s Patients'}
            {viewMode === 'date' && 'Patients for Selected Date'}
            {viewMode === 'all' && 'All Patients'}
            {viewMode === 'search' && 'Search Results'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Patient ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:table-cell">Age</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:table-cell">Gender</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Services</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hidden xl:table-cell">Registered</th>
                  {showActions && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {patients.map((patient: any, index: number) => {
                  const age = patient.age || 'Unknown';
                  const serviceStatus = patient.serviceStatus || {};
                  const hasUnpaidServices = serviceStatus.hasUnpaidServices;
                  const hasPendingServices = serviceStatus.hasPendingServices;
                  const unpaidCount = serviceStatus.unpaidServices || 0;
                  const pendingCount = serviceStatus.pendingServices || 0;
                  const completedCount = serviceStatus.completedServices || 0;
                  const totalServices = serviceStatus.totalServices || 0;
                  
                  return (
                    <tr 
                      key={patient.id} 
                      className={`transition-colors duration-150 ${
                        hasUnpaidServices 
                          ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-500 hover:bg-red-100 dark:hover:bg-red-900/20' 
                          : index % 2 === 0 
                            ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800' 
                            : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${onSelectPatient ? 'cursor-pointer' : ''}`}
                      onClick={() => onSelectPatient?.(patient)}
                    >
                      <td className="px-4 py-3 text-sm">{patient.patientId}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {patient.firstName} {patient.lastName}
                        {/* Show age and gender on mobile when columns are hidden */}
                        <div className="sm:hidden text-xs text-gray-500 mt-1">
                          Age: {age} • {patient.gender || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">{age}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">{patient.phoneNumber || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm hidden lg:table-cell">
                        {patient.gender && (
                          <Badge variant="outline" className="capitalize">
                            {patient.gender}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {hasUnpaidServices ? (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <Badge variant="destructive" className="text-xs">
                              {unpaidCount} Unpaid
                            </Badge>
                          </div>
                        ) : totalServices > 0 ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <Badge variant="secondary" className="text-xs">
                              Paid
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No services</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {totalServices > 0 ? (
                          <div className="flex items-center gap-2">
                            {hasPendingServices && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-yellow-500" />
                                <Badge variant="outline" className="text-xs">
                                  {pendingCount} Pending
                                </Badge>
                              </div>
                            )}
                            {completedCount > 0 && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <Badge variant="secondary" className="text-xs">
                                  {completedCount} Done
                                </Badge>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No services</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm hidden xl:table-cell">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                      {showActions && (
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewPatient?.(patient);
                              }}
                              title="View Patient Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPatient?.(patient);
                              }}
                              title="Edit Patient"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {((viewMode === 'today' || viewMode === 'date' || viewMode === 'all' || shouldSearch) && patients && patients.length === 0) && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="flex flex-col items-center gap-4">
            {viewMode === 'today' && (
              <>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No patients registered today</h3>
                  <p className="text-sm text-gray-500">Patients registered today will appear here automatically.</p>
                </div>
              </>
            )}
            {viewMode === 'date' && (
              <>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No patients found for selected date</h3>
                  <p className="text-sm text-gray-500">Try selecting a different date to find patients.</p>
                </div>
              </>
            )}
            {viewMode === 'all' && (
              <>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No patients in the database</h3>
                  <p className="text-sm text-gray-500">Register your first patient to get started with the clinic system.</p>
                </div>
              </>
            )}
            {viewMode === 'search' && (
              <>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No patients found</h3>
                  <p className="text-sm text-gray-500">Try searching with a different name or patient ID.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
