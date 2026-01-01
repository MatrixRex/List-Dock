import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import TaskCard from './TaskCard';
import FolderCard from './FolderCard';
import { AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { type Item } from '../types';

const RootView: React.FC = () => {
    const items = useStore((state: any) => state.items);
    const searchQuery = useStore((state: any) => state.searchQuery);
    const showCompleted = useStore((state: any) => state.showCompleted);

    const isSearching = searchQuery.trim().length > 0;

    // Normal Root Items (No search)
    const rootTasks = useMemo(() => items
        .filter((i: Item) => i.type === 'task' && i.parent_id === null)
        .filter((i: Item) => showCompleted || !i.is_completed)
        .sort((a: Item, b: Item) => {
            if (a.is_completed !== b.is_completed) {
                return a.is_completed ? 1 : -1;
            }
            return a.order_index - b.order_index;
        }),
        [items, showCompleted]);

    const folders = useMemo(() => items
        .filter((i: Item) => i.type === 'folder')
        .sort((a: Item, b: Item) => a.order_index - b.order_index),
        [items]);

    // Global Search Results (Fuzzy)
    const { searchTaskResults, searchFolderResults } = useMemo(() => {
        if (!isSearching) return { searchTaskResults: [], searchFolderResults: [] };

        const searchableTasks = items.filter((i: Item) => (i.type === 'task' || i.type === 'subtask') && (showCompleted || !i.is_completed));
        const searchableFolders = items.filter((i: Item) => i.type === 'folder');

        const fuseOptions = {
            keys: ['title'],
            threshold: 0.35, // Adjust for fuzziness (0 is perfect match, 1 is matches everything)
            includeScore: true,
            ignoreLocation: true // Search anywhere in the string
        };

        const taskFuse = new Fuse(searchableTasks, fuseOptions);
        const folderFuse = new Fuse(searchableFolders, fuseOptions);

        return {
            searchTaskResults: taskFuse.search(searchQuery).map(r => r.item as Item).sort((a: Item, b: Item) => {
                if (a.is_completed !== b.is_completed) {
                    return a.is_completed ? 1 : -1;
                }
                return 0; // Maintain fuse relevance within same completion status
            }),
            searchFolderResults: folderFuse.search(searchQuery).map(r => r.item as Item)
        };
    }, [items, searchQuery, isSearching, showCompleted]);

    if (isSearching) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2 px-1">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">Search results (All)</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                {searchTaskResults.length > 0 || searchFolderResults.length > 0 ? (
                    <div className="space-y-6">
                        {searchTaskResults.length > 0 && (
                            <section className="space-y-3">
                                <div className="space-y-2">
                                    <AnimatePresence mode="popLayout">
                                        {searchTaskResults.map((task: Item) => (
                                            <TaskCard key={task.id} item={task} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        )}

                        {searchFolderResults.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Matching Folders</h2>
                                <div className="grid grid-cols-2 gap-2">
                                    <AnimatePresence mode="popLayout">
                                        {searchFolderResults.map((folder: Item) => (
                                            <FolderCard key={folder.id} item={folder} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500 text-sm italic">
                        No matches found for "{searchQuery}"
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Section: Root Tasks */}
            <section className="flex flex-col min-h-[200px] max-h-[50vh]">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-1 flex-shrink-0">Tasks</h2>
                {rootTasks.length > 0 ? (
                    <div className="overflow-y-auto custom-scrollbar pr-1">
                        <AnimatePresence initial={false} mode="popLayout">
                            {rootTasks.map((task: Item) => (
                                <TaskCard key={task.id} item={task} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 text-xs border border-white/5 bg-white/[0.01] rounded-xl flex-shrink-0">No pending tasks.</div>
                )}
            </section>

            {/* Bottom Section: Folder Grid */}
            <section>
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Folders</h2>
                {folders.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 items-start pb-4">
                        <AnimatePresence initial={false} mode="popLayout">
                            {folders.map((folder: Item) => (
                                <FolderCard key={folder.id} item={folder} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 text-xs border border-white/5 bg-white/[0.01] rounded-xl">No folders.</div>
                )}
            </section>
        </div>
    );
};

export default RootView;
