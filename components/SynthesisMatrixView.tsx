import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { MatrixColumn } from '../types';
import { TableIcon } from './icons/TableIcon';
import { ExportIcon } from './icons/ExportIcon';
import { exportMatrixAsXlsx } from '../utils/exportUtils';


// --- Icons (Inlined to reduce file count for this update) ---
const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" /><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M12 2v2" /><path d="M12 22v-2" /><path d="m17 20.66-1-1.73" /><path d="M11 10.27 7 3.34" /><path d="m20.66 17-1.73-1" /><path d="m3.34 7 1.73 1" /><path d="M14 12h8" /><path d="M2 12h2" /><path d="m20.66 7-1.73 1" /><path d="m3.34 17 1.73-1" /><path d="m17 3.34-1 1.73" /><path d="m11 13.73-4 6.93" />
  </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);


const CustomizeMatrixModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    columns: MatrixColumn[];
    onSave: (columns: MatrixColumn[]) => void;
}> = ({ isOpen, onClose, columns, onSave }) => {
    const [localColumns, setLocalColumns] = useState<MatrixColumn[]>([]);

    useEffect(() => {
        // Deep copy to avoid mutating parent state directly
        setLocalColumns(JSON.parse(JSON.stringify(columns)));
    }, [columns, isOpen]);

    if (!isOpen) return null;
    
    const handleUpdate = (index: number, field: keyof MatrixColumn, value: any) => {
        const newCols = [...localColumns];
        (newCols[index] as any)[field] = value;
        setLocalColumns(newCols);
    };

    const handleAdd = () => {
        setLocalColumns([...localColumns, { id: `custom_${Date.now()}`, header: 'Cột mới', prompt: 'Mô tả dữ liệu cần trích xuất cho cột này.', enabled: true }]);
    };
    
    const handleRemove = (index: number) => {
        const newCols = localColumns.filter((_, i) => i !== index);
        setLocalColumns(newCols);
    };
    
    const handleSave = () => {
        onSave(localColumns);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-auto max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Tùy chỉnh Cột Ma trận</h2>
                    <p className="text-sm text-slate-500 mt-1">Thêm, sửa, xóa hoặc tắt các cột để tùy chỉnh ma trận tổng quan của bạn.</p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    {localColumns.map((col, index) => (
                        <div key={col.id} className="grid grid-cols-12 gap-3 items-start p-3 border rounded-lg">
                           <div className="col-span-1 flex items-center pt-2">
                             <input type="checkbox" checked={col.enabled} onChange={(e) => handleUpdate(index, 'enabled', e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                           </div>
                           <div className="col-span-10 space-y-2">
                              <div>
                                <label className="text-sm font-semibold text-slate-700">Tiêu đề Cột</label>
                                <input type="text" value={col.header} onChange={e => handleUpdate(index, 'header', e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
                              </div>
                               <div>
                                <label className="text-sm font-semibold text-slate-700">Yêu cầu cho AI</label>
                                <textarea value={col.prompt} onChange={e => handleUpdate(index, 'prompt', e.target.value)} rows={2} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm"></textarea>
                              </div>
                           </div>
                           <div className="col-span-1 flex items-center pt-2">
                               <button onClick={() => handleRemove(index)} className="text-slate-400 hover:text-red-600 p-2"><TrashIcon className="w-5 h-5"/></button>
                           </div>
                        </div>
                    ))}
                    <button onClick={handleAdd} className="w-full border-2 border-dashed border-slate-300 rounded-lg py-2 text-sm font-semibold text-slate-600 hover:border-blue-500 hover:text-blue-600">
                        + Thêm Cột mới
                    </button>
                </div>
                <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-4 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">Hủy</button>
                    <button onClick={handleSave} className="py-2 px-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white">Lưu Thay đổi</button>
                </div>
            </div>
        </div>
    );
};


interface SynthesisMatrixViewProps {
    onGenerate: (columns: MatrixColumn[]) => void;
    matrixData: Record<string, any>[] | null;
    isLoading: boolean;
    canGenerate: boolean;
    columns: MatrixColumn[];
    setColumns: (columns: MatrixColumn[]) => void;
}

const SynthesisMatrixView: React.FC<SynthesisMatrixViewProps> = ({ onGenerate, matrixData, isLoading, canGenerate, columns, setColumns }) => {
    const [isCustomizeOpen, setCustomizeOpen] = useState(false);
    
    const handleExport = () => {
        if (!matrixData) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        exportMatrixAsXlsx(matrixData, columns, `Ma_tran_tong_quan_${timestamp}.xlsx`);
    };
    
    const enabledColumns = columns.filter(c => c.enabled);

    return (
        <div className="p-8 md:p-12 h-full overflow-y-auto">
            <CustomizeMatrixModal isOpen={isCustomizeOpen} onClose={() => setCustomizeOpen(false)} columns={columns} onSave={setColumns} />
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Ma trận Tổng quan</h1>
                <p className="mt-2 text-lg text-slate-600">Tổng hợp và so sánh các thông tin cốt lõi từ tất cả tài liệu vào một bảng duy nhất.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-grow">
                        <h2 className="text-lg font-bold text-slate-800">Tạo Ma trận Tổng hợp</h2>
                        <p className="text-sm text-slate-500 mt-1 max-w-prose">
                            Nhấn nút để AI tạo bảng ma trận dựa trên cấu hình cột hiện tại. Bạn có thể tùy chỉnh các cột trước khi tạo.
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                        <button
                            onClick={() => setCustomizeOpen(true)}
                            disabled={isLoading}
                            className="bg-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-lg hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 flex items-center gap-2"
                        >
                            <CogIcon className="w-5 h-5"/> Tùy chỉnh Cột
                        </button>
                        <button
                            onClick={() => onGenerate(columns)}
                            disabled={!canGenerate || isLoading}
                            className="bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                        >
                            {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-white"></span> : <TableIcon className="w-5 h-5" />}
                            {isLoading ? 'Đang tạo...' : 'Tạo Ma trận'}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && (
                 <div className="text-center mt-10">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-600"></div>
                    <p className="mt-4 text-slate-600 font-medium">AI đang đọc và tổng hợp... Quá trình này có thể mất vài phút.</p>
                 </div>
            )}

            {!isLoading && matrixData && (
                <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Kết quả Ma trận Tổng hợp</h3>
                         <button
                            onClick={handleExport}
                            className="flex items-center gap-2 py-2 px-3 rounded-md font-semibold text-sm transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            <ExportIcon className="w-4 h-4" />
                            Xuất Excel
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-slate-50">
                                <tr>
                                    {enabledColumns.map(col => (
                                       <th key={col.id} className="p-3 font-semibold text-left border-b border-slate-200">{col.header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {matrixData.map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50">
                                        {enabledColumns.map(col => (
                                            <td key={col.id} className="p-3 border-b border-slate-200 align-top prose prose-sm max-w-xs" dangerouslySetInnerHTML={{ __html: marked.parseInline(row[col.id] || '') }}></td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLoading && !matrixData && canGenerate && (
                <div className="text-center mt-10 p-8 bg-slate-100 rounded-lg">
                    <TableIcon className="w-12 h-12 mx-auto text-slate-400" />
                    <p className="mt-4 text-slate-600 font-medium">Kết quả ma trận tổng quan sẽ xuất hiện ở đây.</p>
                </div>
            )}
             {!isLoading && !matrixData && !canGenerate && (
                 <div className="text-center mt-10 p-8 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                    <p className="font-semibold">Chưa có tài liệu nào được phân tích thành công.</p>
                    <p className="mt-1 text-sm">Vui lòng quay lại tab "Danh sách Tài liệu", thực hiện phân tích, sau đó quay lại đây để tạo ma trận tổng quan.</p>
                </div>
            )}
        </div>
    );
};

export default SynthesisMatrixView;