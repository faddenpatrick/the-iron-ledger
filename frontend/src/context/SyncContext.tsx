import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { syncService, SyncStatus } from '../services/sync.service';

interface SyncContextType {
  isOnline: boolean;
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
  });

  useEffect(() => {
    // Online/offline event listeners
    const handleOnline = () => {
      console.log('Network: online');
      setIsOnline(true);
      // Auto-sync when coming online
      syncService.fullSync().catch(console.error);
    };

    const handleOffline = () => {
      console.log('Network: offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync status
    const unsubscribe = syncService.subscribe((status) => {
      setSyncStatus(status);
    });

    // Initial sync if online
    if (navigator.onLine) {
      syncService.fullSync().catch(console.error);
    }

    // Update pending count
    syncService.getPendingCount().then((count) => {
      setSyncStatus((prev) => ({ ...prev, pendingCount: count }));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const triggerSync = async () => {
    if (!isOnline) {
      console.log('Cannot sync - offline');
      return;
    }
    await syncService.fullSync();
  };

  return (
    <SyncContext.Provider value={{ isOnline, syncStatus, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
