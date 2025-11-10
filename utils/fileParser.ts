// These libraries are loaded globally from script tags in index.html
declare const mammoth: any;
declare const pdfjsLib: any;
declare const Tesseract: any;

const PDF_JS_WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

type ProgressCallback = (progress: { status: string; progress: number }) => void;

/**
 * Parses a File object and returns its text content as a string.
 * Supports .pdf, .docx, .txt, and .md files by checking MIME type and extension.
 * @param file The file to parse.
 * @param onProgress Optional callback for reporting progress (e.g., for OCR).
 * @returns A promise that resolves with the text content of the file.
 */
export const parseFile = async (file: File, onProgress?: ProgressCallback): Promise<string> => {
  const mimeType = file.type;
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Handle PDF
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return parsePdf(file, onProgress);
  }

  // Handle DOCX
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx'
  ) {
     if (typeof mammoth === 'undefined') {
      throw new Error('Thư viện xử lý DOCX chưa được tải. Vui lòng thử tải lại trang.');
    }
    return parseDocx(file);
  }

  // Handle text-based files
  if (mimeType.startsWith('text/') || extension === 'txt' || extension === 'md') {
    return file.text();
  }
  
  console.warn(`Attempted to parse unsupported file. Name: ${file.name}, MIME: ${mimeType}, Detected Extension: ${extension}`);
  throw new Error(`Loại tệp không được hỗ trợ. Vui lòng sử dụng .pdf, .docx, .txt, hoặc .md.`);
};

const parsePdf = async (file: File, onProgress?: ProgressCallback): Promise<string> => {
  if (typeof pdfjsLib === 'undefined') {
    throw new Error('Thư viện xử lý PDF chưa được tải. Vui lòng thử tải lại trang.');
  }

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC;
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (pdfjsLib.getDocument(arrayBuffer).promise as Promise<{ numPages: number; getPage: (pageNumber: number) => Promise<any> }>);
  
  let extractedText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    extractedText += pageText + '\n';
  }
  
  // Heuristic: If text is very short (less than 100 chars per page on average), assume it's scanned and use OCR
  if (extractedText.replace(/\s/g, '').length < 100 * pdf.numPages) {
    if (typeof Tesseract === 'undefined') {
      throw new Error('Thư viện OCR chưa được tải. Không thể xử lý PDF được quét.');
    }
    onProgress?.({ status: 'ocr_initializing', progress: 0 });

    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          onProgress?.({ status: 'ocr_recognizing', progress: m.progress });
        }
      },
    });

    onProgress?.({ status: 'ocr_recognizing', progress: 0 });
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
  }

  return extractedText;
};

const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};