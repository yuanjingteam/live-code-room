import React from 'react';
import { FiInfo } from 'react-icons/fi';
import clsx from 'clsx';

interface MessageBoxProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose?: () => void;
}

const typeStyles = {
  info: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const iconMap = {
  info: <FiInfo className="w-5 h-5 text-emerald-500" />,
  success: <FiInfo className="w-5 h-5 text-green-500" />,
  error: <FiInfo className="w-5 h-5 text-red-500" />,
  warning: <FiInfo className="w-5 h-5 text-yellow-500" />,
};

const MessageBox: React.FC<MessageBoxProps> = ({ message, type = 'info', onClose }) => (<div className={clsx(
  'flex items-center gap-3 px-4 py-3 rounded-lg border shadow transition-all',
  typeStyles[type]
)}
  style={{ minWidth: 240, maxWidth: 400 }}>
  {iconMap[type]}
  <span className="flex-1">{message}</span>
  {onClose && (
    <button
      className="ml-2 text-emerald-400 hover:text-emerald-600 transition"
      onClick={onClose}
    >
      ×
    </button>
  )}
</div>
)
export default MessageBox;