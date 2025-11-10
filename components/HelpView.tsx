import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';

const FAQItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => (
  <div className="py-6 border-b border-slate-200">
    <dt className="text-lg font-semibold text-slate-800">{question}</dt>
    <dd className="mt-2 text-slate-600 prose prose-slate max-w-none">{children}</dd>
  </div>
);

const HelpView: React.FC = () => {
  return (
    <div className="p-8 md:p-12 h-full overflow-y-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3">
            <BookOpenIcon className="w-10 h-10 text-blue-600"/>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Trợ giúp & Câu hỏi thường gặp</h1>
        </div>
        <p className="mt-3 text-lg text-slate-600">Tìm câu trả lời cho các câu hỏi phổ biến và tìm hiểu cách tận dụng tối đa các tính năng của Phân tích Tài liệu Nghiên cứu.</p>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <dl>
          <FAQItem question="Làm thế nào để bắt đầu?">
            <p>Rất đơn giản! Nhấn vào nút "Nhấn hoặc kéo tệp để tải lên" ở thanh bên trái, chọn một hoặc nhiều tài liệu (.pdf, .docx, .txt, .md) từ máy tính của bạn. Sau khi các tệp được xử lý (trạng thái "Sẵn sàng"), hãy nhấn nút "Phân tích Tài liệu".</p>
          </FAQItem>

          <FAQItem question="Tính năng OCR hoạt động như thế nào?">
            <p>Khi bạn tải lên một tệp PDF, hệ thống sẽ cố gắng trích xuất văn bản trực tiếp. Nếu phát hiện tệp PDF đó là một tài liệu được quét (chỉ chứa hình ảnh), công cụ Nhận dạng Ký tự Quang học (OCR) của chúng tôi sẽ tự động kích hoạt để "đọc" văn bản từ hình ảnh. Bạn sẽ thấy trạng thái "Đang OCR" trong quá trình này.</p>
          </FAQItem>
          
          <FAQItem question="Tôi nên viết gì vào ô 'Mục tiêu Phân tích' trong Phân tích Trắc lượng?">
            <p>Hãy coi đây là câu hỏi nghiên cứu của bạn cho AI. Hãy cụ thể. Ví dụ:</p>
            <ul>
                <li>"Xác định các phương pháp nghiên cứu chính được sử dụng và các chủ đề nổi bật liên quan đến 'kinh tế tuần hoàn'."</li>
                <li>"Tìm các khoảng trống nghiên cứu chung trong các tài liệu này về vấn đề 'trí tuệ nhân tạo trong giáo dục'."</li>
                <li>"Tóm tắt các phát hiện chính về tác động của 'biến đổi khí hậu' đối với nông nghiệp."</li>
            </ul>
          </FAQItem>

          <FAQItem question="Làm thế nào để tùy chỉnh Ma trận Tổng quan?">
            <p>Trong tab "Ma trận Tổng quan", nhấn nút "Tùy chỉnh Cột". Một cửa sổ sẽ hiện ra cho phép bạn:</p>
            <ul>
              <li><strong>Thêm Cột:</strong> Nhấn nút "+ Thêm Cột mới".</li>
              <li><strong>Sửa Cột:</strong> Thay đổi "Tiêu đề Cột" (hiển thị trong bảng) và "Yêu cầu cho AI" (hướng dẫn AI trích xuất thông tin gì).</li>
              <li><strong>Bật/Tắt Cột:</strong> Dùng hộp kiểm để tạm thời ẩn một cột khỏi ma trận mà không cần xóa.</li>
              <li><strong>Xóa Cột:</strong> Nhấn vào biểu tượng thùng rác.</li>
            </ul>
             <p>Sau khi tùy chỉnh, nhấn "Lưu Thay đổi" và sau đó "Tạo Ma trận" để AI làm việc dựa trên cấu hình mới của bạn.</p>
          </FAQItem>
          
           <FAQItem question="Lỗi 'Quota' hoặc '429' nghĩa là gì?">
            <p>Lỗi này xảy ra khi bạn gửi quá nhiều yêu cầu phân tích trong một khoảng thời gian ngắn, vượt quá giới hạn của API. Vui lòng đợi một vài phút trước khi thử lại. Để tránh lỗi này, hãy phân tích các tài liệu theo từng nhóm nhỏ nếu bạn có số lượng lớn.</p>
          </FAQItem>

           <FAQItem question="Làm thế nào để xuất trích dẫn cho Zotero/Mendeley?">
            <p>Sau khi phân tích thành công ít nhất một tài liệu, hãy vào menu "Xuất Toàn bộ Báo cáo" và chọn "Dạng thư viện BibTeX (.bib)". Tệp .bib được tải về có thể được nhập trực tiếp vào hầu hết các phần mềm quản lý trích dẫn.</p>
          </FAQItem>
        </dl>
      </div>
    </div>
  );
};

export default HelpView;