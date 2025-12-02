import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from '../src/i18n/i18n-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemName?: string;
    loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    itemName,
    loading = false 
}) => {
    const LL = useTranslations();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
                    <h3 className="font-bold text-lg text-textPrimary">{title}</h3>
                    <button 
                        onClick={onClose} 
                        disabled={loading}
                        className="text-textSecondary hover:text-textPrimary transition-colors duration-200 disabled:opacity-50"
                    >
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={24} className="text-error" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-textPrimary leading-relaxed">
                                {message}
                            </p>
                            {itemName && (
                                <p className="mt-2 text-sm font-semibold text-textPrimary bg-background px-3 py-2 rounded-lg border border-border">
                                    {itemName}
                                </p>
                            )}
                            <p className="mt-3 text-xs text-textSecondary">
                                {LL.common.irreversible()}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 border-2 border-border text-border rounded-xl text-sm font-medium hover:bg-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {LL.common.cancel()}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-error hover:bg-error/90 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> : null}
                            {LL.common.delete()}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

