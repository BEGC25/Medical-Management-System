// Offline storage utilities
const STORAGE_KEYS = {
  PATIENTS: 'clinic_patients',
  TREATMENTS: 'clinic_treatments',
  LAB_TESTS: 'clinic_lab_tests',
  XRAY_EXAMS: 'clinic_xray_exams',
  PENDING_SYNC: 'clinic_pending_sync',
};

export interface PendingSync {
  id: string;
  type: 'patient' | 'treatment' | 'lab_test' | 'xray_exam';
  action: 'create' | 'update';
  data: any;
  timestamp: string;
}

// Save data to local storage
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to local storage:', error);
  }
}

// Get data from local storage
export function getFromLocalStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get from local storage:', error);
    return null;
  }
}

// Add item to pending sync queue
export function addToPendingSync(item: Omit<PendingSync, 'id' | 'timestamp'>): void {
  const pendingItems = getFromLocalStorage<PendingSync[]>(STORAGE_KEYS.PENDING_SYNC) || [];
  const newItem: PendingSync = {
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  
  pendingItems.push(newItem);
  saveToLocalStorage(STORAGE_KEYS.PENDING_SYNC, pendingItems);
}

// Get pending sync items
export function getPendingSyncItems(): PendingSync[] {
  return getFromLocalStorage<PendingSync[]>(STORAGE_KEYS.PENDING_SYNC) || [];
}

// Remove item from pending sync queue
export function removePendingSyncItem(id: string): void {
  const pendingItems = getFromLocalStorage<PendingSync[]>(STORAGE_KEYS.PENDING_SYNC) || [];
  const updatedItems = pendingItems.filter(item => item.id !== id);
  saveToLocalStorage(STORAGE_KEYS.PENDING_SYNC, updatedItems);
}

// Sync pending items when online
export async function syncPendingItems(): Promise<void> {
  if (!navigator.onLine) return;

  const pendingItems = getPendingSyncItems();
  
  for (const item of pendingItems) {
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (item.type) {
        case 'patient':
          endpoint = '/api/patients';
          if (item.action === 'update') {
            endpoint += `/${item.data.patientId}`;
            method = 'PUT';
          }
          break;
        case 'treatment':
          endpoint = '/api/treatments';
          break;
        case 'lab_test':
          endpoint = '/api/lab-tests';
          if (item.action === 'update') {
            endpoint += `/${item.data.testId}`;
            method = 'PUT';
          }
          break;
        case 'xray_exam':
          endpoint = '/api/xray-exams';
          if (item.action === 'update') {
            endpoint += `/${item.data.examId}`;
            method = 'PUT';
          }
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        removePendingSyncItem(item.id);
      }
    } catch (error) {
      console.error('Failed to sync item:', error);
    }
  }
}

// Auto-sync when online
export function setupAutoSync(): void {
  window.addEventListener('online', () => {
    setTimeout(syncPendingItems, 1000); // Wait a second after coming online
  });
}

export { STORAGE_KEYS };
