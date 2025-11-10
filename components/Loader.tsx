
import React from 'react';
// Fix: Corrected import path for DocumentStatus type.
import { DocumentStatus } from '../types';

interface LoaderProps {
  status: DocumentStatus;
}

const Loader: React.FC<LoaderProps> = ({ status }) => {
  const message = {
    parsing: 'Đang xử lý tài liệu...',
    analyzing: 'Đang phân tích tài liệu...',
    pending: '',
    success: '',
    error: ''
  }[status];

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-600"></div>
      <p className="text-slate-600 font-medium">{message}</p>
    </div>
  );
};

export default Loader;
