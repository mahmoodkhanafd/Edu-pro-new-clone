/**
 * PDF + print helpers for EduPro.
 *
 * IMPORTANT: Tailwind v4 emits modern CSS colour functions (`oklch()`, `lab()`,
 * `oklab()`, `color-mix()`). html2canvas cannot parse these and throws
 * "Attempting to parse an unsupported color function", which is why every PDF
 * export used to fail. Before rasterising we walk the cloned document and
 * flatten every computed colour to a plain `rgb()` string, which html2canvas
 * always understands.
 */

const COLOR_PROPS = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'columnRuleColor',
  'caretColor',
  'fill',
  'stroke',
] as const;

const UNSUPPORTED_COLOR = /(oklch|oklab|lch|lab|color-mix|color\()/i;

/** Resolves any CSS colour (including oklch/lab/color-mix) to `rgb()` via the browser. */
function toRgb(value: string, fallback: string): string {
  if (!value) return fallback;
  if (!UNSUPPORTED_COLOR.test(value)) return value;

  try {
    const probe = document.createElement('span');
    probe.style.display = 'none';
    probe.style.color = value;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    if (resolved && !UNSUPPORTED_COLOR.test(resolved)) return resolved;
  } catch {
    /* fall through to fallback */
  }

  return fallback;
}

/**
 * Copies every *computed* colour from the live element tree onto the cloned
 * tree as an inline `rgb()` value, then strips shadows/filters that html2canvas
 * renders poorly. This makes the capture pixel-faithful and crash free.
 */
function flattenColors(source: HTMLElement, clone: HTMLElement) {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll<HTMLElement>('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
  const count = Math.min(sourceNodes.length, cloneNodes.length);

  for (let i = 0; i < count; i++) {
    const computed = getComputedStyle(sourceNodes[i]);
    const target = cloneNodes[i];

    for (const prop of COLOR_PROPS) {
      const value = computed[prop as keyof CSSStyleDeclaration] as string | undefined;
      if (!value || value === 'none') continue;
      // Computed styles are already resolved by the browser, but Chrome can
      // still hand back oklch() for custom properties, so normalise again.
      const safe = toRgb(value, prop === 'color' ? '#111827' : 'transparent');
      try {
        target.style[prop as never] = safe as never;
      } catch {
        /* ignore read-only props */
      }
    }

    // Gradients / shadows / filters frequently contain unsupported colours.
    const bgImage = computed.backgroundImage;
    if (bgImage && bgImage !== 'none' && UNSUPPORTED_COLOR.test(bgImage)) {
      target.style.backgroundImage = 'none';
    }
    target.style.boxShadow = 'none';
    target.style.textShadow = 'none';
    target.style.filter = 'none';
    target.style.backdropFilter = 'none';
    target.style.animation = 'none';
    target.style.transition = 'none';
  }
}

type JsPdfOrientation = 'p' | 'portrait' | 'l' | 'landscape';
type PdfCategory = 'dmc' | 'id-cards' | 'fee-reports' | 'receipts';
type JsPdfLike = {
  save: (filename: string) => void;
  output: (type: 'datauristring') => string;
};

const PDF_CATEGORY_DIRS: Record<PdfCategory, string> = {
  dmc: 'DMC',
  'id-cards': 'ID-Cards',
  'fee-reports': 'Fee-Reports',
  receipts: 'Receipts',
};

function sanitizeFilename(filename: string) {
  return filename.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'edupro.pdf';
}

async function isCapacitorAndroid() {
  if (typeof window === 'undefined') return false;

  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

async function ensurePdfDirectory(path: string) {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');

  try {
    await Filesystem.mkdir({ path, directory: Directory.Documents, recursive: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('exist')) {
      await Filesystem.stat({ path, directory: Directory.Documents });
    }
  }
}

export async function createA4Pdf(orientation: JsPdfOrientation = 'p') {
  const jsPDFModule = await import('jspdf');
  const JsPDF = ((jsPDFModule as any).jsPDF || jsPDFModule.default) as typeof jsPDFModule.default;
  return new JsPDF(orientation, 'mm', 'a4');
}

export async function savePdf(pdf: JsPdfLike, filename: string, category: PdfCategory) {
  const safeFilename = sanitizeFilename(filename);

  if (!(await isCapacitorAndroid())) {
    pdf.save(safeFilename);
    return { platform: 'browser' as const, path: safeFilename };
  }

  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const dir = `EduPro/PDF/${PDF_CATEGORY_DIRS[category]}`;
  await ensurePdfDirectory(dir);

  const dataUri = pdf.output('datauristring');
  const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
  const path = `${dir}/${safeFilename}`;

  await Filesystem.writeFile({
    path,
    directory: Directory.Documents,
    data: base64Data,
    recursive: true,
  });

  return { platform: 'android' as const, path: `Documents/${path}` };
}

/** Rasterises an element, neutralising Tailwind v4 colours first. */
export async function elementToCanvas(element: HTMLElement, scale = 2) {
  const html2canvas = (await import('html2canvas')).default;

  return html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 15000,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    onclone: (clonedDocument, clonedElement) => {
      // Kill any stylesheet rule that still carries a modern colour function.
      const reset = clonedDocument.createElement('style');
      reset.textContent = `
        * {
          box-shadow: none !important;
          text-shadow: none !important;
          filter: none !important;
          backdrop-filter: none !important;
          animation: none !important;
          transition: none !important;
        }
      `;
      clonedDocument.head.appendChild(reset);
      flattenColors(element, clonedElement as HTMLElement);
    },
  });
}

export async function exportElementToA4Pdf(
  element: HTMLElement,
  filename: string,
  options: {
    orientation?: JsPdfOrientation;
    marginMm?: number;
    scale?: number;
    category?: PdfCategory;
  } = {}
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
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
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

  return savePdf(pdf, filename, options.category || 'dmc');
}

  /**
   * Reliable print for web *and* Android WebView.
   *
   * The web path uses a hidden iframe (works in every browser and avoids
   * popup blockers). On Android, the Capacitor WebView has *no* `window.print()`
   * implementation at all — calling it silently does nothing. We therefore
   * detect Android, save the rendered PDF to Documents, and hand it to the
   * native share sheet so the user can pick "Print" or "Save" from there.
   */
  export async function printElement(
    element: HTMLElement,
    title = 'EduPro Document',
    options: { orientation?: 'portrait' | 'landscape'; scale?: number; category?: PdfCategory; filename?: string } = {}
  ) {
    const orientation = options.orientation || 'portrait';

    // Android WebView cannot print inline; fall back to native share.
    if (await isCapacitorAndroid()) {
      const pdf = await createA4Pdf(orientation === 'landscape' ? 'l' : 'p');
      const canvas = await elementToCanvas(element, options.scale || 2);
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const printableHeight = pageHeight - margin * 2;

      if (imgHeight <= printableHeight) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Paginate vertically, same logic as exportElementToA4Pdf.
        let remainingHeight = imgHeight;
        let sourceY = 0;
        const sourcePageHeight = (printableHeight * canvas.width) / imgWidth;
        while (remainingHeight > 0) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(sourcePageHeight, canvas.height - sourceY);
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
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
          }
          sourceY += sourcePageHeight;
          remainingHeight -= printableHeight;
        }
      }

      const safeName = sanitizeFilename(options.filename || `${title}.pdf`);
      const category = options.category || 'dmc';
      const { platform, path } = await savePdf(pdf, safeName, category);

      // Surface the PDF through the OS share sheet so the user can choose
      // "Print" (Android print service), "Save to Drive", or "Open in…".
      const { Share } = await import('@capacitor/share');
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const fileUri = await Filesystem.getUri({ path, directory: Directory.Documents });
      await Share.share({
        title,
        text: title,
        url: fileUri.uri,
        dialogTitle: 'Print or share',
      }).catch((shareError) => {
        console.warn('Share cancelled or unavailable:', shareError);
      });

      return { platform, path };
    }

    // Web fallback: rasterise + iframe print.
    const canvas = await elementToCanvas(element, options.scale || 2);
    const dataUrl = canvas.toDataURL('image/png');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title.replace(/[<>]/g, '')}</title>
<style>
  @page { size: A4 ${orientation}; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #ffffff; width: 100%; }
  body { display: flex; align-items: flex-start; justify-content: center; }
  img { display: block; width: 100%; height: auto; max-width: 194mm; }
  @media print { body { display: block; } img { width: 100%; } }
</style>
</head>
<body><img src="${dataUrl}" alt="${title.replace(/[<>"]/g, '')}" /></body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    await new Promise<void>((resolve) => {
      const doc = iframe.contentWindow?.document;
      if (!doc) {
        resolve();
        return;
      }
      doc.open();
      doc.write(html);
      doc.close();

      const image = doc.querySelector('img');
      const fire = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (error) {
          console.error('Print failed:', error);
        }
        resolve();
      };

      if (image && !image.complete) {
        image.addEventListener('load', fire, { once: true });
        image.addEventListener('error', fire, { once: true });
      } else {
        setTimeout(fire, 120);
      }
    });

    setTimeout(() => iframe.remove(), 60000);
    return { platform: 'browser' as const, path: '' };
  }
