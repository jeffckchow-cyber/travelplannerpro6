
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'travel_planner_db';
const STORE_NAME = 'app_state';

let dbPromise: Promise<IDBPDatabase>;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
};

export const saveLocalState = async (state: any) => {
  const db = await getDB();
  await db.put(STORE_NAME, state, 'current');
};

export const getLocalState = async () => {
  const db = await getDB();
  return db.get(STORE_NAME, 'current');
};
