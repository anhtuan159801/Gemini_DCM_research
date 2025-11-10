import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnalysisResult, AnalyzedDocument, DocumentStatus, MatrixColumn } from './types';
import { analyzeDocument, analyzeBibliometrics, generateSynthesisMatrix, convertApaToBibtex } from './services/geminiService';
import { parseFile } from './utils/fileParser';
import FileUpload from './components/FileUpload';
import AnalysisView from './components/AnalysisView';
import BibliometricView from './components/BibliometricView';
import SynthesisMatrixView from './components/SynthesisMatrixView';
import HelpView from './components/HelpView'; // Mới
import { BeakerIcon } from './components/icons/BeakerIcon';
import { ClipboardListIcon } from './components/icons/ClipboardListIcon';
import { ChartBarIcon } from './components/icons/ChartBarIcon';
import { TableIcon } from './components/icons/TableIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { exportAllAsTxt, exportAllAsXlsx, exportBibtex } from './utils/exportUtils';
import { ExportIcon } from './components/icons/ExportIcon';
import { BookOpenIcon } from './components/icons/BookOpenIcon';

export type View = 'documents' | 'bibliometric' | 'synthesis' | 'help';

const defaultMatrixColumns: MatrixColumn[] = [
    { id: 'stt', header: 'STT', prompt: 'Số thứ tự, bắt đầu từ "1".', enabled: true },
    { id: 'apa7', header: 'Trích dẫn APA7th', prompt: 'Trích dẫn đầy đủ theo chuẩn APA 7th (lấy từ mục 3 của báo cáo).', enabled: true },
    { id: 'context', header: 'Bối cảnh', prompt: 'Tóm tắt súc tích về Bối cảnh và Luận đề (từ mục 4).', enabled: true },
    { id: 'mainContent', header: 'Nội dung chính', prompt: 'Tổng hợp những điểm chính về Phương pháp luận và Kết quả (từ mục 7, 8). **Làm nổi bật** phương pháp và kết quả chính.', enabled: true },
    { id: 'gaps', header: 'Khoảng trống/Hạn chế', prompt: 'Liệt kê các Khoảng trống/Hạn chế và Hướng nghiên cứu tương lai (từ mục 9, 11).', enabled: true },
];

const App: React.FC = () => {
  const [documents, setDocuments] = useState<AnalyzedDocument[]>([]);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<View>('documents');
  
  const [bibliometricResult, setBibliometricResult] = useState<string | null>(null);
  const [isBibliometricLoading, setIsBibliometricLoading] = useState<boolean>(false);
  
  const [synthesisMatrix, setSynthesisMatrix] = useState<Record<string, any>[] | null>(null);
  const [isSynthesisLoading, setIsSynthesisLoading] = useState<boolean>(false);
  const [matrixColumns, setMatrixColumns] = useState<MatrixColumn[]>(defaultMatrixColumns);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | null>(null);

  const nextId = useRef(0);

  const resetState = () => {
    setDocuments([]);
    setIsAnalysisRunning(false);
    setActiveView('documents');
    setBibliometricResult(null);
    setIsBibliometricLoading(false);
    setSynthesisMatrix(null);
    setIsSynthesisLoading(false);
    setAnalysisProgress(null);
    setMatrixColumns(defaultMatrixColumns);
  };

  const updateDocumentState = (id: string, updates: Partial<AnalyzedDocument>) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, ...updates } : doc));
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newDocs: AnalyzedDocument[] = Array.from(files).map(file => ({
      id: `file-${nextId.current++}`,
      file,
      text: null,
      status: 'parsing',
      result: null,
      error: null,
    }));

    setDocuments(prev => [...prev, ...newDocs]);

    await Promise.all(newDocs.map(async (doc) => {
      try {
        const onProgress = (progress: { status: string; progress: number }) => {
            if (progress.status.startsWith('ocr')) {
                const percent = Math.round(progress.progress * 100);
                updateDocumentState(doc.id, { status: 'ocr', progress: percent });
            }
        };
        const text = await parseFile(doc.file, onProgress);
        updateDocumentState(doc.id, { text, status: 'pending', progress: undefined });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định trong quá trình phân tích cú pháp.';
        updateDocumentState(doc.id, { error: errorMessage, status: 'error', progress: undefined });
      }
    }));
  };
  
  const performAnalysis = async (doc: AnalyzedDocument) => {
    if (!doc.text) return;
    updateDocumentState(doc.id, { status: 'analyzing' });
    try {
        const reportText = await analyzeDocument(doc.text);
        const result: AnalysisResult = { fullReport: reportText };
        updateDocumentState(doc.id, { result, status: 'success' });
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Lỗi không xác định trong quá trình phân tích.';
        updateDocumentState(doc.id, { error, status: 'error' });
    }
  };
  
  const handleRetry = async (docId: string) => {
    const docToRetry = documents.find(d => d.id === docId);
    if (!docToRetry || isAnalysisRunning) return;
    
    setIsAnalysisRunning(true);
    await performAnalysis(docToRetry);
    setIsAnalysisRunning(false);
  }

  const handleAnalyze = useCallback(async () => {
    const docsToAnalyze = documents.filter(d => d.status === 'pending' && d.text);
    if (docsToAnalyze.length === 0) return;

    setIsAnalysisRunning(true);
    setActiveView('documents');
    setAnalysisProgress({ current: 0, total: docsToAnalyze.length });

    let processedCount = 0;
    for (const doc of docsToAnalyze) {
        processedCount++;
        setAnalysisProgress({ current: processedCount, total: docsToAnalyze.length });
        await performAnalysis(doc);

        if (processedCount < docsToAnalyze.length) {
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }

    setIsAnalysisRunning(false);
    setAnalysisProgress(null);
  }, [documents]);
  
  const handleBibliometricAnalysis = async (goal: string) => {
      const successfulDocs = documents.filter(d => d.status === 'success' && d.text);
      if (successfulDocs.length === 0 || !goal) return;

      setIsBibliometricLoading(true);
      setBibliometricResult(null);
      try {
          const allText = successfulDocs.map(d => `--- START DOCUMENT: ${d.file.name} ---\n\n${d.text}\n\n--- END DOCUMENT ---`).join('\n\n');
          const result = await analyzeBibliometrics(allText, goal);
          setBibliometricResult(result);
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.';
          setBibliometricResult(`**Đã xảy ra lỗi:**\n\n${errorMessage}`);
      } finally {
          setIsBibliometricLoading(false);
      }
  };

  const handleGenerateMatrix = async (currentColumns: MatrixColumn[]) => {
    const successfulReports = documents
        .filter(d => d.status === 'success' && d.result)
        .map(d => `--- START REPORT: ${d.file.name} ---\n\n${d.result!.fullReport}\n\n--- END REPORT ---`);

    if (successfulReports.length === 0) return;

    setIsSynthesisLoading(true);
    setSynthesisMatrix(null);
    try {
        const matrix = await generateSynthesisMatrix(successfulReports, currentColumns);
        setSynthesisMatrix(matrix);
    } catch (error) {
        console.error("Failed to generate synthesis matrix:", error);
    } finally {
        setIsSynthesisLoading(false);
    }
  };


  const handleClear = () => {
    resetState();
  }
  
  const handleGlobalExport = async (format: 'txt' | 'xlsx' | 'bib') => {
      const successfulDocs = documents.filter(d => d.status === 'success' && d.result);
      if (successfulDocs.length === 0) return;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      setIsExportMenuOpen(false);

      if (format === 'txt') {
          exportAllAsTxt(successfulDocs, `Tong_hop_bao_cao_${timestamp}.txt`);
      } else if (format === 'xlsx') {
          exportAllAsXlsx(successfulDocs, `Tong_hop_bao_cao_${timestamp}.xlsx`);
      } else if (format === 'bib') {
          const apaCitations = successfulDocs.map(doc => {
              const match = doc.result?.fullReport.match(/\*\*3\.\s+Trích dẫn bài báo \(Chuẩn APA 7th\)\*\*\n([\s\S]*?)(?=\n\n\*\*4\.|\n$)/);
              return match ? match[1].trim() : '';
          }).filter(Boolean);

          if(apaCitations.length > 0) {
              try {
                const bibtexContent = await convertApaToBibtex(apaCitations);
                exportBibtex(bibtexContent, `Thu_vien_${timestamp}.bib`);
              } catch(e) {
                alert(`Lỗi khi chuyển đổi sang BibTeX: ${e instanceof Error ? e.message : String(e)}`);
              }
          } else {
              alert("Không tìm thấy trích dẫn APA nào để xuất.");
          }
      }
  };
  
  const parsingCount = documents.filter(d => d.status === 'parsing' || d.status === 'ocr').length;
  const pendingCount = documents.filter(d => d.status === 'pending').length;

  const isLoading = isAnalysisRunning || parsingCount > 0;
  const canAnalyze = !isAnalysisRunning && parsingCount === 0 && pendingCount > 0;
  const hasFiles = documents.length > 0;
  const hasSuccessfulDocs = documents.some(d => d.status === 'success');
  
  const canDoBibliometric = !isBibliometricLoading && hasSuccessfulDocs;
  const canDoSynthesis = !isSynthesisLoading && hasSuccessfulDocs;


  const getButtonText = () => {
    if (isAnalysisRunning && analysisProgress) return `Đang phân tích (${analysisProgress.current}/${analysisProgress.total})...`;
    if (parsingCount > 0) return `Đang xử lý ${parsingCount} tệp...`;
    if (canAnalyze) return `Phân tích ${pendingCount} tài liệu`;
    return 'Phân tích Tài liệu';
  };
  
  const renderView = () => {
    switch(activeView) {
      case 'documents':
        return <AnalysisView documents={documents} onRetry={handleRetry} />;
      case 'bibliometric':
        return <BibliometricView 
                 onAnalyze={handleBibliometricAnalysis}
                 result={bibliometricResult}
                 isLoading={isBibliometricLoading}
                 canAnalyze={canDoBibliometric}
               />;
      case 'synthesis':
        return <SynthesisMatrixView
                onGenerate={handleGenerateMatrix}
                matrixData={synthesisMatrix}
                isLoading={isSynthesisLoading}
                canGenerate={canDoSynthesis}
                columns={matrixColumns}
                setColumns={setMatrixColumns}
               />;
      case 'help':
          return <HelpView />;
      default:
        return <AnalysisView documents={documents} onRetry={handleRetry}/>;
    }
  }

  return (
    <div className="flex h-screen font-sans text-slate-900 bg-slate-50">
      <aside className="w-96 flex-shrink-0 bg-white border-r border-slate-200 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-blue-600 rounded-lg shadow-md">
              <BeakerIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Phân tích Tài liệu Nghiên cứu</h1>
          </div>
          <div className="space-y-6">
            <FileUpload 
              onFileChange={handleFileChange} 
              fileCount={documents.length}
              disabled={isLoading}
            />
             <div className="space-y-3">
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm disabled:shadow-none flex items-center justify-center gap-2"
              >
                {(parsingCount > 0 || isAnalysisRunning) && <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-white"></span>}
                {getButtonText()}
              </button>
               {hasFiles && (
                  <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="w-full bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                    Xóa tất cả
                  </button>
                )}
             </div>

             {hasFiles && (
                <div className="border-t border-slate-200 pt-6 space-y-4">
                    {hasSuccessfulDocs && (
                        <div className="relative">
                            <button
                                onClick={() => setIsExportMenuOpen(prev => !prev)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                <ExportIcon className="w-5 h-5" />
                                Xuất Toàn bộ Báo cáo
                            </button>
                            {isExportMenuOpen && (
                                <div className="absolute bottom-full mb-2 w-full bg-white rounded-md shadow-lg z-10 border border-slate-200">
                                    <div className="py-1">
                                        <button onClick={() => handleGlobalExport('txt')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Dạng văn bản (.txt)</button>
                                        <button onClick={() => handleGlobalExport('xlsx')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Dạng bảng tính (.xlsx)</button>
                                        <button onClick={() => handleGlobalExport('bib')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Dạng thư viện BibTeX (.bib)</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <button 
                            onClick={() => setActiveView('documents')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left font-semibold transition-colors ${activeView === 'documents' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <ClipboardListIcon className="w-6 h-6"/>
                            Danh sách Tài liệu
                        </button>
                        <button 
                            onClick={() => setActiveView('bibliometric')}
                            disabled={!documents.some(d=>d.status === 'success')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left font-semibold transition-colors ${activeView === 'bibliometric' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'} disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                        >
                            <ChartBarIcon className="w-6 h-6"/>
                            Phân tích Trắc lượng
                        </button>
                        <button 
                            onClick={() => setActiveView('synthesis')}
                            disabled={!documents.some(d=>d.status === 'success')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left font-semibold transition-colors ${activeView === 'synthesis' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'} disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                        >
                            <TableIcon className="w-6 h-6"/>
                            Ma trận Tổng quan
                        </button>
                         <button 
                            onClick={() => setActiveView('help')}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left font-semibold transition-colors ${activeView === 'help' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <BookOpenIcon className="w-6 h-6"/>
                            Trợ giúp & FAQ
                        </button>
                    </div>
                </div>
              )}
          </div>
        </div>
        <div className="text-xs text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} Phân tích Tài liệu Nghiên cứu. Hỗ trợ bởi AI.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;