import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary'
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
            <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full mb-4 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    <AlertTriangle size={32} />
                </div>

                <h3 className="text-xl font-bold text-gray-100 mb-2">{title}</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-black/20 ${variant === 'danger'
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
