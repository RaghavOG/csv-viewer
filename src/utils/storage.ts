import { get, set } from 'idb-keyval';
import { CSVNode, ConnectorArrow } from '@/types';

const TABLES_KEY = 'plane_csv_tables_idb';
const ARROWS_KEY = 'plane_csv_arrows_idb';

/**
 * Save tables to IndexedDB with multi-gigabyte capacity
 */
export async function saveTablesToStorage(tables: CSVNode[]): Promise<void> {
  try {
    await set(TABLES_KEY, tables);
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage', err);
    try {
      localStorage.setItem('plane_csv_tables', JSON.stringify(tables.slice(0, 50)));
    } catch {
      // Quota exceeded
    }
  }
}

/**
 * Load tables from IndexedDB (or fallback to legacy localStorage)
 */
export async function loadTablesFromStorage(): Promise<CSVNode[] | null> {
  try {
    const data = await get<CSVNode[]>(TABLES_KEY);
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('IndexedDB read error', err);
  }

  // Fallback to localStorage migration
  try {
    const legacy = localStorage.getItem('plane_csv_tables');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Migrate to IndexedDB
        await set(TABLES_KEY, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Save connector arrows
 */
export async function saveArrowsToStorage(arrows: ConnectorArrow[]): Promise<void> {
  try {
    await set(ARROWS_KEY, arrows);
  } catch {
    // Ignore
  }
}

/**
 * Load connector arrows
 */
export async function loadArrowsFromStorage(): Promise<ConnectorArrow[]> {
  try {
    const data = await get<ConnectorArrow[]>(ARROWS_KEY);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
