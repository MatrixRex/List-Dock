import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { type Item } from '../types';

/**
 * Replaces guest tasks from local storage with Firestore synchronization.
 */
const migrateLocalItems = async (uid: string) => {
    const localItems = useStore.getState().items;
    if (localItems.length > 0) {
        console.log('[ListDock Sync] Migrating guest items to Firestore...');
        try {
            const { db } = await import('../lib/firebase');
            const { doc, writeBatch } = await import('firebase/firestore');
            const batch = writeBatch(db);
            
            localItems.forEach((item) => {
                batch.set(doc(db, 'items', item.id), {
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    is_completed: item.is_completed,
                    parent_id: item.parent_id,
                    order_index: item.order_index,
                    is_expanded: item.is_expanded,
                    created_at: item.created_at,
                    updated_at: item.updated_at || Date.now(),
                    ...(item.color ? { color: item.color } : {}),
                    ...(item.icon ? { icon: item.icon } : {}),
                    ownerId: uid
                });
            });
            await batch.commit();
            console.log('[ListDock Sync] Guest data migration completed successfully!');
        } catch (e) {
            console.error('[ListDock Sync] Guest data migration failed:', e);
        }
    }
};

/**
 * Custom React hook that sets up real-time Firebase Firestore synchronization.
 * Handles initial sync, real-time snapshot subscription, and offline auto-reconnect.
 */
export const useSync = () => {
    const { user, isSyncEnabled, setSyncStatus, setLastSynced, setSyncError } = useStore();
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (!isSyncEnabled || !user) {
            setSyncStatus('idle');
            return;
        }

        let unsubscribe: (() => void) | undefined = undefined;

        const startSync = async () => {
            setSyncStatus('syncing');
            setSyncError(null);

            try {
                // If it is the first login/sync enable session, migrate guest data first
                if (isInitialMount.current) {
                    isInitialMount.current = false;
                    await migrateLocalItems(user.uid);
                }

                const { db } = await import('../lib/firebase');
                const { collection, query, where, onSnapshot } = await import('firebase/firestore');

                const q = query(
                    collection(db, 'items'),
                    where('ownerId', '==', user.uid)
                );

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const firestoreItems: Item[] = [];
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        firestoreItems.push({
                            id: data.id,
                            type: data.type,
                            title: data.title,
                            is_completed: data.is_completed,
                            parent_id: data.parent_id,
                            order_index: data.order_index,
                            is_expanded: data.is_expanded,
                            created_at: data.created_at,
                            updated_at: data.updated_at,
                            ...(data.color ? { color: data.color } : {}),
                            ...(data.icon ? { icon: data.icon } : {})
                        });
                    });

                    // Sort items strictly by order index
                    firestoreItems.sort((a, b) => a.order_index - b.order_index);

                    // Update local Zustand state
                    useStore.setState({
                        items: firestoreItems,
                        syncStatus: 'success',
                        lastSynced: Date.now(),
                        syncError: null
                    });
                }, (error) => {
                    console.error('[ListDock Sync] Firestore subscription error:', error);
                    setSyncStatus('error');
                    setSyncError(error.message || 'Firestore subscription error.');
                });
            } catch (err) {
                console.error('[ListDock Sync] Failed to initialize Firestore sync:', err);
                setSyncStatus('error');
                setSyncError((err as Error).message || 'Initialization failed.');
            }
        };

        startSync();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, isSyncEnabled, setSyncStatus, setLastSynced, setSyncError]);
};

export default useSync;
