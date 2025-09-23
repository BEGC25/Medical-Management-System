import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, Edit } from "lucide-react";
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
}

export default function PatientSearch({ onSelectPatient, onEditPatient, onViewPatient, showActions = true, viewMode, selectedDate }: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldSearch, setShouldSearch] = useState(false);

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
    queryKey: ["/api/patients", getQueryParams()],
    enabled: viewMode === 'today' || viewMode === 'date' || viewMode === 'all' || (viewMode === 'search' && shouldSearch && searchTerm.length > 0),
    queryFn: () => {
      if (viewMode === 'today') {
        return fetch('/api/patients?today=true').then(res => res.json());
      } else if (viewMode === 'date') {
        return fetch(`/api/patients?date=${encodeURIComponent(selectedDate)}`).then(res => res.json());
      } else if (viewMode === 'all') {
        return fetch('/api/patients').then(res => res.json());
      } else {
        return fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}`).then(res => res.json());
      }
    },
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      setShouldSearch(true);
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Patient ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Age</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Gender</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Registered</th>
                  {showActions && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {patients.map((patient: Patient) => {
                  const age = patient.age || 'Unknown';
                  
                  return (
                    <tr 
                      key={patient.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${onSelectPatient ? 'cursor-pointer' : ''}`}
                      onClick={() => onSelectPatient?.(patient)}
                    >
                      <td className="px-4 py-3 text-sm">{patient.patientId}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm">{age}</td>
                      <td className="px-4 py-3 text-sm">{patient.phoneNumber || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        {patient.gender && (
                          <Badge variant="outline" className="capitalize">
                            {patient.gender}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {viewMode === 'today' && "No patients registered today."}
          {viewMode === 'date' && "No patients found for the selected date."}
          {viewMode === 'all' && "No patients in the database yet."}
          {viewMode === 'search' && "No patients found matching your search."}
        </div>
      )}
    </div>
  );
}
