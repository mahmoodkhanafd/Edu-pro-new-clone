const HTML2CANVAS_SAFE_CSS = `
.html2canvas-safe-root,
.html2canvas-safe-root * {
  text-shadow: none !important;
  box-shadow: none !important;
}
.html2canvas-safe-root .text-white { color: #ffffff !important; }
.html2canvas-safe-root .text-gray-300 { color: #d1d5db !important; }
.html2canvas-safe-root .text-gray-400 { color: #9ca3af !important; }
.html2canvas-safe-root .text-gray-500 { color: #6b7280 !important; }
.html2canvas-safe-root .text-gray-600 { color: #4b5563 !important; }
.html2canvas-safe-root .text-gray-700 { color: #374151 !important; }
.html2canvas-safe-root .text-gray-800 { color: #1f2937 !important; }
.html2canvas-safe-root .text-blue-400 { color: #60a5fa !important; }
.html2canvas-safe-root .text-blue-500 { color: #3b82f6 !important; }
.html2canvas-safe-root .text-blue-600 { color: #2563eb !important; }
.html2canvas-safe-root .text-blue-700 { color: #1d4ed8 !important; }
.html2canvas-safe-root .text-green-400 { color: #4ade80 !important; }
.html2canvas-safe-root .text-green-500 { color: #22c55e !important; }
.html2canvas-safe-root .text-green-600 { color: #16a34a !important; }
.html2canvas-safe-root .text-green-700 { color: #15803d !important; }
.html2canvas-safe-root .text-red-400 { color: #f87171 !important; }
.html2canvas-safe-root .text-red-500 { color: #ef4444 !important; }
.html2canvas-safe-root .text-red-600 { color: #dc2626 !important; }
.html2canvas-safe-root .text-red-700 { color: #b91c1c !important; }
.html2canvas-safe-root .text-orange-400 { color: #fb923c !important; }
.html2canvas-safe-root .text-orange-500 { color: #f97316 !important; }
.html2canvas-safe-root .text-orange-600 { color: #ea580c !important; }
.html2canvas-safe-root .text-purple-600 { color: #9333ea !important; }
.html2canvas-safe-root .bg-white { background-color: #ffffff !important; }
.html2canvas-safe-root .bg-gray-50 { background-color: #f9fafb !important; }
.html2canvas-safe-root .bg-gray-100 { background-color: #f3f4f6 !important; }
.html2canvas-safe-root .bg-gray-800 { background-color: #1f2937 !important; }
.html2canvas-safe-root .bg-blue-50 { background-color: #eff6ff !important; }
.html2canvas-safe-root .bg-blue-100 { background-color: #dbeafe !important; }
.html2canvas-safe-root .bg-green-50 { background-color: #f0fdf4 !important; }
.html2canvas-safe-root .bg-red-50 { background-color: #fef2f2 !important; }
.html2canvas-safe-root .bg-orange-50 { background-color: #fff7ed !important; }
.html2canvas-safe-root .border-gray-100 { border-color: #f3f4f6 !important; }
.html2canvas-safe-root .border-gray-200 { border-color: #e5e7eb !important; }
.html2canvas-safe-root .border-gray-300 { border-color: #d1d5db !important; }
.html2canvas-safe-root .border-gray-400 { border-color: #9ca3af !important; }
.html2canvas-safe-root .border-red-200 { border-color: #fecaca !important; }
`;

type JsPdfOrientation = 'p' | 'portrait' | 'l' | 'landscape';

export async function createA4Pdf(orientation: JsPdfOrientation = 'p') {
  const jsPDFModule = await import('jspdf');
  const JsPDF = ((jsPDFModule as any).jsPDF || jsPDFModule.default) as typeof jsPDFModule.default;
  return new JsPDF(orientation, 'mm', 'a4');
}

export async function elementToCanvas(element: HTMLElement, scale = 2) {
  const html2canvas = (await import('html2canvas')).default;
  element.classList.add('html2canvas-safe-root');

  try {
    return await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDocument) => {
        const style = clonedDocument.createElement('style');
        style.textContent = HTML2CANVAS_SAFE_CSS;
        clonedDocument.head.appendChild(style);
      },
    });
  } finally {
    element.classList.remove('html2canvas-safe-root');
  }
}

export async function exportElementToA4Pdf(
  element: HTMLElement,
  filename: string,
  options: { orientation?: JsPdfOrientation; marginMm?: number; scale?: number } = {}
) {
  const pdf = await createA4Pdf(options.orientation || 'p');
  const canvas = await elementToCanvas(element, options.scale || 2);
  const imgData = canvas.toDataURL('image/png');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = options.marginMm ?? 8;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const printableHeight = pageHeight - margin * 2;

  if (imgHeight <= printableHeight) {
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
  } else {
    let remainingHeight = imgHeight;
    let sourceY = 0;
    const sourcePageHeight = (printableHeight * canvas.width) / imgWidth;

    while (remainingHeight > 0) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(sourcePageHeight, canvas.height - sourceY);
      const ctx = pageCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create PDF canvas context');
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        pageCanvas.height,
        0,
        0,
        canvas.width,
        pageCanvas.height
      );
      const pageImgData = pageCanvas.toDataURL('image/png');
      const pageImgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;
      if (sourceY > 0) pdf.addPage();
      pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
      sourceY += sourcePageHeight;
      remainingHeight -= printableHeight;
    }
  }

  pdf.save(filename);
}
