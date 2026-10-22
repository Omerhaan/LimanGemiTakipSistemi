import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200 text-red-500',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 text-emerald-500',
    info: 'bg-blue-50 text-blue-800 border-blue-200 text-blue-500',
  }[type];

  const Icon = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  }[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${styles} transition-all`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 font-medium">{message}</div>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100 p-0.5">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
