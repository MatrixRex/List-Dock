import type { Item } from '../types';

interface MergeResult {
  mergedItems: Item[];
  mergedDeleted: Record<string, number>;
}

// 30 days in milliseconds (30 * 24 * 60 * 60 * 1000)
const TOMBSTONE_EXPIRY_MS = 2592000000;

/**
 * Merges local and remote items using Last-Write-Wins (LWW) CRDT-like logic.
 * Uses tombstone registries to resolve offline deletions.
 */
export function mergeSyncState(
  localItems: Item[],
  localDeleted: Record<string, number> = {},
  remoteItems: Item[],
  remoteDeleted: Record<string, number> = {}
): MergeResult {
  const now = Date.now();

  // Step 1: Merge tombstones (Keep the latest deletion time for each ID)
  const mergedDeleted: Record<string, number> = { ...localDeleted };
  for (const [id, remoteDeletedTime] of Object.entries(remoteDeleted)) {
    const localDeletedTime = mergedDeleted[id];
    if (localDeletedTime === undefined || remoteDeletedTime > localDeletedTime) {
      mergedDeleted[id] = remoteDeletedTime;
    }
  }

  // Step 2: Prune tombstones older than 30 days (Garbage Collection)
  for (const [id, deletedTime] of Object.entries(mergedDeleted)) {
    if (now - deletedTime > TOMBSTONE_EXPIRY_MS) {
      delete mergedDeleted[id];
    }
  }

  // Helper to get effective modification time for an item
  const getUpdatedAt = (item: Item): number => {
    return item.updated_at ?? item.created_at ?? 0;
  };

  // Step 3: Group items by ID and perform LWW merge
  const itemsMap = new Map<string, Item>();

  // Add all local items
  for (const item of localItems) {
    itemsMap.set(item.id, item);
  }

  // Merge remote items
  for (const remoteItem of remoteItems) {
    const localItem = itemsMap.get(remoteItem.id);
    if (localItem) {
      // Both exist: Keep the one with the later update timestamp
      if (getUpdatedAt(remoteItem) > getUpdatedAt(localItem)) {
        itemsMap.set(remoteItem.id, remoteItem);
      }
    } else {
      // Only exists remotely: Check if it was deleted locally
      const deletedAt = mergedDeleted[remoteItem.id];
      if (deletedAt !== undefined) {
        // If the deletion happened after the remote item was last updated, discard it
        if (deletedAt >= getUpdatedAt(remoteItem)) {
          continue;
        }
      }
      itemsMap.set(remoteItem.id, remoteItem);
    }
  }

  // Check unique local items for remote deletions
  for (const [id, localItem] of itemsMap.entries()) {
    // If it is only local (was not in remoteItems)
    const isInRemote = remoteItems.some(i => i.id === id);
    if (!isInRemote) {
      const deletedAt = mergedDeleted[id];
      if (deletedAt !== undefined) {
        // If the deletion happened after the local item was last updated, discard it
        if (deletedAt >= getUpdatedAt(localItem)) {
          itemsMap.delete(id);
        }
      }
    }
  }

  // Step 4: Cascade deletion of orphaned items (e.g. subtask whose task is deleted)
  // We keep running this until no more orphaned items are found
  let orphanedRemoved = true;
  while (orphanedRemoved) {
    orphanedRemoved = false;
    for (const [id, item] of itemsMap.entries()) {
      if (item.parent_id) {
        const parentExists = itemsMap.has(item.parent_id);
        if (!parentExists) {
          // Parent was deleted, so this item must also be deleted
          itemsMap.delete(id);
          // Register the orphaned item in the tombstone list so it gets deleted elsewhere too
          mergedDeleted[id] = now;
          orphanedRemoved = true;
        }
      }
    }
  }

  // Step 5: Convert back to list and sort by order_index
  const mergedItems = Array.from(itemsMap.values()).sort(
    (a, b) => a.order_index - b.order_index
  );

  return {
    mergedItems,
    mergedDeleted,
  };
}
