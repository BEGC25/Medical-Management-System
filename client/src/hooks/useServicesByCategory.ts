import { useQuery } from "@tanstack/react-query";
import type { Service } from "@shared/schema";

/**
 * Shared hook to fetch active services by category
 * Used across diagnostic pages (Laboratory, X-Ray, Ultrasound)
 * 
 * @param category - Service category: 'laboratory', 'radiology', 'ultrasound', etc.
 * @returns Query result with filtered active services
 */
export function useServicesByCategory(category: string) {
  return useQuery<Service[]>({
    queryKey: ['/api/services', { category }],
    queryFn: async () => {
      const url = new URL('/api/services', window.location.origin);
      url.searchParams.set('category', category);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} services`);
      }
      const allServices = await response.json();
      // Filter to only active services on client side for extra safety
      return allServices.filter((s: Service) => s.isActive);
    },
  });
}
