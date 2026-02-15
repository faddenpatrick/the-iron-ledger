import api from './api';
import {
  db,
  getUnsyncedItems,
  markAsSynced,
  markAsError,
  SyncQueueItem,
} from './indexeddb.service';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
  error: string | null;
}

class SyncService {
  private syncInProgress = false;
  private listeners: ((status: SyncStatus) => void)[] = [];

  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(status: Partial<SyncStatus>) {
    const fullStatus: SyncStatus = {
      isSyncing: this.syncInProgress,
      lastSyncTime: this.getLastSyncTime(),
      pendingCount: 0,
      error: null,
      ...status,
    };
    this.listeners.forEach((listener) => listener(fullStatus));
  }

  private getLastSyncTime(): Date | null {
    const lastSync = localStorage.getItem('lastSyncTime');
    return lastSync ? new Date(lastSync) : null;
  }

  private setLastSyncTime(time: Date) {
    localStorage.setItem('lastSyncTime', time.toISOString());
  }

  // Get pending sync count
  async getPendingCount(): Promise<number> {
    const items = await getUnsyncedItems();
    return items.length;
  }

  // Process sync queue
  async processQueue(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Cannot sync - offline');
      return;
    }

    this.syncInProgress = true;
    this.notify({ isSyncing: true });

    try {
      const items = await getUnsyncedItems();
      console.log(`Processing ${items.length} sync queue items`);

      for (const item of items) {
        try {
          await this.processSyncItem(item);
          await markAsSynced(item.id!);
        } catch (error: any) {
          console.error(`Failed to sync item ${item.id}:`, error);
          await markAsError(item.id!, error.message || 'Unknown error');
        }
      }

      this.setLastSyncTime(new Date());
      const pendingCount = await this.getPendingCount();
      this.notify({ isSyncing: false, pendingCount });
    } catch (error: any) {
      console.error('Sync failed:', error);
      this.notify({ isSyncing: false, error: error.message });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { method, endpoint, data } = item;

    switch (method) {
      case 'POST':
        await api.post(endpoint, data);
        break;
      case 'PUT':
        await api.put(endpoint, data);
        break;
      case 'DELETE':
        await api.delete(endpoint);
        break;
    }
  }

  // Pull latest data from server
  async pullData(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Cannot pull data - offline');
      return;
    }

    try {
      // Pull exercises
      const exercisesRes = await api.get('/exercises?limit=1000');
      if (exercisesRes.data?.items) {
        await db.exercises.bulkPut(exercisesRes.data.items);
      }

      // Pull workout templates
      const templatesRes = await api.get('/workouts/templates');
      if (templatesRes.data) {
        await db.workoutTemplates.bulkPut(templatesRes.data);
      }

      // Pull recent workouts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const workoutsRes = await api.get(
        `/workouts?start_date=${thirtyDaysAgo.toISOString().split('T')[0]}`
      );
      if (workoutsRes.data) {
        await db.workouts.bulkPut(workoutsRes.data);
      }

      // Pull meal categories
      const categoriesRes = await api.get('/nutrition/meal-categories');
      if (categoriesRes.data) {
        await db.mealCategories.bulkPut(categoriesRes.data);
      }

      // Pull foods
      const foodsRes = await api.get('/nutrition/foods?limit=1000');
      if (foodsRes.data?.items) {
        await db.foods.bulkPut(foodsRes.data.items);
      }

      // Pull recent meals (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const mealsRes = await api.get(
        `/nutrition/meals?date=${sevenDaysAgo.toISOString().split('T')[0]}`
      );
      if (mealsRes.data) {
        await db.meals.bulkPut(mealsRes.data);
      }

      console.log('Data pulled successfully');
    } catch (error) {
      console.error('Failed to pull data:', error);
      throw error;
    }
  }

  // Full sync: push pending changes, then pull latest data
  async fullSync(): Promise<void> {
    console.log('Starting full sync...');
    await this.processQueue();
    await this.pullData();
    console.log('Full sync complete');
  }
}

export const syncService = new SyncService();
