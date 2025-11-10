
import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import { BarChart, PieChart } from './charts/Charts';
import { ChartBarIcon } from './icons/ChartBarIcon';

interface BibliometricViewProps {
    onAnalyze: (goal: string) => void;
    result: string | null;
    isLoading: boolean;
    canAnalyze: boolean;
}

// Helper to parse structured data from the report
const parseChartData = (report: string, type: 'BarThemes' | 'PieMethods') => {
    const key = `CHART_DATA_START:${type}`;
    const start = report.indexOf(key);
    if (start === -1) return null;

    const end = report.indexOf('CHART_DATA_END', start);
    if (end === -1) return null;

    let jsonString = report.substring(start + key.length, end).trim();
    
    // Fix: The model sometimes wraps the JSON in ```json ... ```. Strip this before parsing.
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error(`Failed to parse chart JSON for ${type}:`, e, "Raw string:", `"${jsonString}"`);
        return null;
    }
};


const BibliometricView: React.FC<BibliometricViewProps> = ({ onAnalyze, result, isLoading, canAnalyze }) => {
    const [goal, setGoal] = useState('');

    const { reportHtml, barData, pieData } = useMemo(() => {
        if (!result) return { reportHtml: '', barData: null, pieData: null };
        
        const barData = parseChartData(result, 'BarThemes');
        const pieData = parseChartData(result, 'PieMethods');
        
        // Remove data blocks from the final rendered report
        const cleanResult = result
            .replace(/CHART_DATA_START:BarThemes[\s\S]*?CHART_DATA_END/, '')
            .replace(/CHART_DATA_START:PieMethods[\s\S]*?CHART_DATA_END/, '');
        
        const reportHtml = marked.parse(cleanResult);

        return { reportHtml, barData, pieData };
    }, [result]);

    return (
        <div className="p-8 md:p-12 h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Phân tích Trắc lượng Thư mục</h1>
                <p className="mt-2 text-lg text-slate-600">Tổng hợp thông tin chi tiết từ tất cả các tài liệu đã phân tích để khám phá các xu hướng và chủ đề chính.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">Mục tiêu Phân tích</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Nhập câu hỏi hoặc mục tiêu bạn muốn phân tích trên toàn bộ tài liệu (ví dụ: "Xác định các phương pháp nghiên cứu chính và các chủ đề nổi bật").
                </p>
                <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Nhập mục tiêu của bạn ở đây..."
                    className="w-full mt-4 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    rows={3}
                    disabled={!canAnalyze || isLoading}
                />
                <button
                    onClick={() => onAnalyze(goal)}
                    disabled={!canAnalyze || isLoading || !goal}
                    className="mt-4 bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm flex items-center gap-2"
                >
                    {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-white"></span> : <ChartBarIcon className="w-5 h-5" />}
                    {isLoading ? 'Đang phân tích...' : 'Bắt đầu Phân tích Tổng hợp'}
                </button>
            </div>

            {isLoading && (
                 <div className="text-center mt-10">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-600"></div>
                    <p className="mt-4 text-slate-600 font-medium">AI đang tổng hợp và phân tích... Quá trình này có thể mất vài phút.</p>
                 </div>
            )}
            
            {!isLoading && result && (
                <div className="mt-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {barData && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">Chủ đề Nghiên cứu Nổi bật</h3>
                                <BarChart data={barData} />
                            </div>
                        )}
                        {pieData && (
                            <div>
                               <h3 className="text-xl font-bold mb-4">Phân bổ Phương pháp luận</h3>
                               <PieChart data={pieData} />
                            </div>
                        )}
                    </div>
                     <div
                        className="prose prose-slate max-w-none prose-h2:text-2xl prose-h2:font-bold prose-strong:font-semibold prose-table:border prose-th:p-2 prose-td:p-2 prose-th:border-b-2 prose-td:border-b"
                        dangerouslySetInnerHTML={{ __html: reportHtml }}
                    />
                </div>
            )}
             {!isLoading && !result && canAnalyze && (
                <div className="text-center mt-10 p-8 bg-slate-100 rounded-lg">
                    <ChartBarIcon className="w-12 h-12 mx-auto text-slate-400" />
                    <p className="mt-4 text-slate-600 font-medium">Kết quả phân tích tổng hợp sẽ xuất hiện ở đây.</p>
                </div>
            )}
            {!isLoading && !result && !canAnalyze && (
                 <div className="text-center mt-10 p-8 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                    <p className="font-semibold">Chưa có tài liệu nào được phân tích thành công.</p>
                    <p className="mt-1 text-sm">Vui lòng quay lại tab "Danh sách Tài liệu", thực hiện phân tích, sau đó quay lại đây để bắt đầu phân tích trắc lượng thư mục.</p>
                </div>
            )}
        </div>
    );
};

export default BibliometricView;
