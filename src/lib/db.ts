import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Profile } from '../App'; // Assuming Profile is exported from App.tsx, or we can redefine it here.

interface AppDB extends DBSchema {
  profiles: {
    key: string;
    value: Profile;
  };
  offline_mutations: {
    key: number;
    value: {
      id?: number;
      type: 'profile_update';
      payload: any;
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('bondhon-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offline_mutations')) {
          db.createObjectStore('offline_mutations', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
};

export const saveProfilesLocally = async (profiles: Profile[]) => {
  const db = await initDB();
  const tx = db.transaction('profiles', 'readwrite');
  await Promise.all(profiles.map(p => tx.store.put(p)));
  await tx.done;
};

export const getLocalProfiles = async (): Promise<Profile[]> => {
  const db = await initDB();
  return db.getAll('profiles');
};

export const saveOfflineMutation = async (type: 'profile_update', payload: any) => {
  const db = await initDB();
  await db.add('offline_mutations', {
    type,
    payload,
    timestamp: Date.now(),
  });
};

export const getOfflineMutations = async () => {
  const db = await initDB();
  return db.getAll('offline_mutations');
};

export const clearOfflineMutation = async (id: number) => {
  const db = await initDB();
  await db.delete('offline_mutations', id);
};
