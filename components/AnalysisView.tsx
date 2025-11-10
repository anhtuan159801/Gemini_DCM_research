import React, { useState, useMemo } from 'react';
import { BeakerIcon } from './icons/BeakerIcon';
import { AnalyzedDocument, DocumentStatus } from '../types';
import { marked } from 'marked';
import { exportSingleAsTxt, exportSingleAsXlsx } from '../utils/exportUtils';

// --- Icons (Inlined to reduce file count for this update) ---
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" />
  </svg>
);
const ExportIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);


interface AnalysisViewProps {
  documents: AnalyzedDocument[];
  onRetry: (docId: string) => void;
}

const DocumentDetailModal: React.FC<{ document: AnalyzedDocument, onClose: () => void }> = ({ document, onClose }) => {
    if (!document.result) return null;
    const reportHtml = marked.parse(document.result.fullReport);
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 truncate pr-4">{document.file.name}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
                </div>
                <div className="p-8 overflow-y-auto">
                    <div 
                        className="prose prose-slate max-w-none prose-h2:text-xl prose-h2:font-bold prose-strong:font-semibold"
                        dangerouslySetInnerHTML={{ __html: reportHtml }}
                    />
                </div>
            </div>
        </div>
    );
};


const StatusIndicator: React.FC<{ status: DocumentStatus; progress?: number }> = ({ status, progress }) => {
  const statusConfig = {
    parsing: { text: 'Đang xử lý...', color: 'text-slate-500', bgColor: 'bg-slate-200' },
    ocr: { text: `OCR (${progress}%)`, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    pending: { text: 'Sẵn sàng', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    queued: { text: 'Đang chờ...', color: 'text-gray-600', bgColor: 'bg-gray-200'},
    analyzing: { text: 'Đang phân tích...', color: 'text-amber-600', bgColor: 'bg-amber-100' },
    success: { text: 'Hoàn thành', color: 'text-green-600', bgColor: 'bg-green-100' },
    error: { text: 'Lỗi', color: 'text-red-600', bgColor: 'bg-red-100' },
  };
  const config = statusConfig[status];
  const isSpinning = status === 'analyzing' || status === 'parsing' || status === 'ocr';
  
  return (
    <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
      {isSpinning ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
      ) : (
        <span className={`h-2 w-2 rounded-full mr-2 ${config.color.replace('text', 'bg')}`}></span>
      )}
      <span className="uppercase tracking-wider">{config.text}</span>
    </div>
  );
};

const DocumentResultCard: React.FC<{ document: AnalyzedDocument; onRetry: (id: string) => void; onView: (doc: AnalyzedDocument) => void; }> = ({ document, onRetry, onView }) => {
  const [isExportOpen, setExportOpen] = useState(false);
  const reportHtml = document.result ? marked.parse(document.result.fullReport.split('\n').slice(0, 10).join('\n') + '...') : ''; // Preview

  const handleExport = (format: 'txt' | 'xlsx') => {
    if (!document.result) return;
    const baseFilename = document.file.name.replace(/\.[^/.]+$/, "");
    if (format === 'txt') {
      exportSingleAsTxt(document.result.fullReport, `${baseFilename}.txt`);
    } else {
      exportSingleAsXlsx(document.result.fullReport, `${baseFilename}.xlsx`);
    }
    setExportOpen(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 transition-all duration-300 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800 truncate pr-4">{document.file.name}</h2>
        <div className="flex items-center gap-2">
          <StatusIndicator status={document.status} progress={document.progress} />
           {document.status === 'error' && (
             <button onClick={() => onRetry(document.id)} title="Thử lại" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-md"><RefreshIcon className="w-4 h-4" /></button>
           )}
           {document.status === 'success' && (
            <>
              <button onClick={() => onView(document)} title="Xem chi tiết" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-md"><EyeIcon className="w-4 h-4" /></button>
              <div className="relative">
                <button onClick={() => setExportOpen(p => !p)} title="Xuất" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-md"><ExportIcon className="w-4 h-4" /></button>
                {isExportOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                    <button onClick={() => handleExport('txt')} className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">.txt</button>
                    <button onClick={() => handleExport('xlsx')} className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">.xlsx</button>
                  </div>
                )}
              </div>
            </>
           )}
        </div>
      </div>

      {document.status === 'success' && document.result && (
        <div className="p-6">
           <div className="prose prose-slate max-w-none text-sm" dangerouslySetInnerHTML={{ __html: reportHtml }} />
        </div>
      )}

      {document.status === 'error' && (
        <div className="p-6 text-red-700 bg-red-50">
          <h3 className="font-bold">Đã xảy ra lỗi</h3>
          <p className="text-sm mt-1">{document.error}</p>
        </div>
      )}
    </div>
  );
};

const InitialState: React.FC = () => (
  <div className="text-center h-full flex flex-col items-center justify-center p-8">
    <div className="bg-white p-10 rounded-full shadow-lg border border-slate-200">
       <BeakerIcon className="w-20 h-20 mx-auto text-blue-500" />
    </div>
    <h2 className="mt-8 text-3xl font-bold text-slate-800">Chào mừng đến với Phân tích Tài liệu Nghiên cứu</h2>
    <p className="mt-3 max-w-xl mx-auto text-lg text-slate-600">Nâng cao hiệu suất nghiên cứu của bạn. Tải lên tài liệu khoa học để nhận phân tích sâu sắc, toàn diện và có cấu trúc chỉ trong vài phút.</p>
  </div>
);

const AnalysisView: React.FC<AnalysisViewProps> = ({ documents, onRetry }) => {
  const [detailedDocument, setDetailedDocument] = useState<AnalyzedDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [documents, searchTerm, statusFilter]);

  if (documents.length === 0) {
    return <InitialState />;
  }
  
  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
       {detailedDocument && <DocumentDetailModal document={detailedDocument} onClose={() => setDetailedDocument(null)} />}
       <div className="mb-8">
         <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Danh sách Tài liệu</h1>
         <p className="mt-2 text-lg text-slate-600">Xem lại kết quả, tìm kiếm, lọc và quản lý các tài liệu đã tải lên.</p>
       </div>
       <div className="mb-6 flex gap-4">
        <input 
          type="text"
          placeholder="Tìm theo tên tệp..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-grow p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="all">Tất cả Trạng thái</option>
          <option value="pending">Sẵn sàng</option>
          <option value="analyzing">Đang phân tích</option>
          <option value="success">Hoàn thành</option>
          <option value="error">Lỗi</option>
          <option value="parsing">Đang xử lý</option>
          <option value="ocr">Đang OCR</option>
        </select>
       </div>
       <div className="flex-1 overflow-y-auto pr-2">
         {filteredDocuments.map(doc => (
           <DocumentResultCard key={doc.id} document={doc} onRetry={onRetry} onView={setDetailedDocument}/>
         ))}
         {filteredDocuments.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <p>Không tìm thấy tài liệu nào khớp với tìm kiếm của bạn.</p>
          </div>
         )}
      </div>
    </div>
  );
};

export default AnalysisView;