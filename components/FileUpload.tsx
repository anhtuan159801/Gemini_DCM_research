
import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileChange: (files: FileList | null) => void;
  fileCount: number;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, fileCount, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    onFileChange(files);
     // Reset the input value to allow re-uploading the same file(s)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="p-4">
        <div
          className={`border-2 border-dashed border-slate-300 rounded-lg p-6 text-center transition-colors duration-200 ${disabled ? 'cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:border-blue-500 bg-white'}`}
          onClick={handleClick}
          onDrop={(e) => {
            e.preventDefault();
            if (!disabled) onFileChange(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".txt,.md,.pdf,.docx"
            disabled={disabled}
            multiple
          />
          <div className="flex flex-col items-center justify-center">
            <UploadIcon className="w-8 h-8 text-slate-400 mb-2" />
            {fileCount > 0 ? (
              <>
                <p className="text-sm font-semibold text-slate-700 break-all">Đã chọn {fileCount} tệp</p>
                <p className="text-xs text-slate-500 mt-1">Nhấn để chọn thêm hoặc thay thế</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-700">Nhấn hoặc kéo tệp để tải lên</p>
                <p className="text-xs text-slate-500 mt-1">Hỗ trợ nhiều tệp: .pdf, .docx, .txt, .md</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
