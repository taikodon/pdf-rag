import { useState, useRef, useCallback, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// --- Text selection enhancement ---

const activeTextLayers = new Set<HTMLElement>();
let globalPointerUpBound = false;

function setupGlobalPointerUp() {
  if (globalPointerUpBound) return;
  globalPointerUpBound = true;
  document.addEventListener('pointerup', () => {
    for (const layer of activeTextLayers) {
      layer.classList.remove('selecting');
    }
  });
  window.addEventListener('blur', () => {
    for (const layer of activeTextLayers) {
      layer.classList.remove('selecting');
    }
  });
}

function addEndOfContent(textLayerEl: HTMLElement): void {
  const endDiv = document.createElement('div');
  endDiv.className = 'endOfContent';
  textLayerEl.appendChild(endDiv);
  textLayerEl.addEventListener('mousedown', () => {
    textLayerEl.classList.add('selecting');
  });
  activeTextLayers.add(textLayerEl);
  setupGlobalPointerUp();
}

function splitTextLayerSpans(container: HTMLElement): void {
  const measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return;

  const spans = Array.from(container.querySelectorAll<HTMLSpanElement>('span'));

  for (const span of spans) {
    if (span.getAttribute('role') === 'img') continue;
    if (span.children.length > 0) continue;
    const text = span.textContent ?? '';
    if (!text.includes(' ')) continue;

    const spanStyle = span.style;
    const baseLeft = parseFloat(spanStyle.left) || 0;
    const transform = spanStyle.transform;

    let scaleX = 1;
    const scaleMatch = transform.match(/scaleX\(([\d.eE+\-]+)\)/);
    if (scaleMatch) {
      scaleX = parseFloat(scaleMatch[1]);
    } else if (/matrix/.test(transform)) {
      const m = transform.match(/matrix\(([^)]+)\)/);
      if (m) {
        const p = m[1].split(/,\s*/).map(Number);
        if (Math.abs(p[1]) > 0.01) continue;
        scaleX = p[0];
      }
    }

    const computedStyle = window.getComputedStyle(span);
    ctx.font = computedStyle.font;

    const tokens = text.split(/(?<= )/);
    if (tokens.length < 2) continue;

    const fragment = document.createDocumentFragment();
    let offsetX = 0;
    for (const token of tokens) {
      if (!token) continue;
      const ws = document.createElement('span');
      ws.textContent = token;
      ws.style.cssText = spanStyle.cssText;
      ws.style.left = `${baseLeft + offsetX}px`;
      offsetX += ctx.measureText(token).width * scaleX;
      fragment.appendChild(ws);
    }

    span.parentElement?.insertBefore(fragment, span);
    span.remove();
  }
}

interface UsePdfViewerOptions {
  onPageChange?: (page: number, total: number) => void;
}

export function usePdfViewer({ onPageChange }: UsePdfViewerOptions = {}) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.25);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const zoomRef = useRef(1.25);
  const currentPageRef = useRef(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const renderGenRef = useRef(0);

  const renderAllPages = useCallback(
    async (doc: PDFDocumentProxy, scale: number) => {
      const container = containerRef.current;
      const pagesEl = pagesRef.current;
      if (!container || !pagesEl) return;

      const gen = ++renderGenRef.current;

      pagesEl.innerHTML = '';
      observerRef.current?.disconnect();
      activeTextLayers.clear();

      const pageVisibility = new Map<number, number>();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const pageNum = parseInt((entry.target as HTMLElement).dataset.pageNumber ?? '1');
            pageVisibility.set(pageNum, entry.intersectionRatio);
          }
          let maxRatio = 0;
          let visiblePage = currentPageRef.current;
          for (const [page, ratio] of pageVisibility) {
            if (ratio > maxRatio) {
              maxRatio = ratio;
              visiblePage = page;
            }
          }
          if (visiblePage !== currentPageRef.current) {
            currentPageRef.current = visiblePage;
            setCurrentPage(visiblePage);
            onPageChange?.(visiblePage, doc.numPages);
          }
        },
        { root: container, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] }
      );

      for (let i = 1; i <= doc.numPages; i++) {
        if (renderGenRef.current !== gen) return;

        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale });

        const wrapper = document.createElement('div');
        wrapper.className = 'relative shadow-2xl flex-shrink-0';
        wrapper.dataset.pageNumber = String(i);
        wrapper.style.width = `${viewport.width}px`;
        wrapper.style.height = `${viewport.height}px`;

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = 'block';
        canvas.style.pointerEvents = 'none';

        const textLayerEl = document.createElement('div');
        textLayerEl.className = 'absolute top-0 left-0 textLayer';
        textLayerEl.style.setProperty('--scale-factor', String(scale));

        wrapper.appendChild(canvas);
        wrapper.appendChild(textLayerEl);
        pagesEl.appendChild(wrapper);

        observerRef.current.observe(wrapper);

        const ctx = canvas.getContext('2d')!;
        const renderTask = page.render({ canvasContext: ctx, viewport });
        try {
          await renderTask.promise;
        } catch (e: unknown) {
          if ((e as { name: string }).name !== 'RenderingCancelledException') console.error(e);
          if (renderGenRef.current !== gen) return;
          continue;
        }

        if (renderGenRef.current !== gen) return;

        const textContent = await page.getTextContent();
        if (renderGenRef.current !== gen) return;

        const tl = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayerEl,
          viewport,
        });
        await tl.render();
        if (renderGenRef.current !== gen) return;
        splitTextLayerSpans(textLayerEl);
        addEndOfContent(textLayerEl);
      }
    },
    [onPageChange]
  );

  const loadPdf = useCallback(
    async (data: ArrayBuffer, initialPage = 1, initialZoom = 1.25) => {
      setIsLoading(true);
      try {
        const copy = data.slice(0);
        const doc = await pdfjs.getDocument({ data: copy }).promise;
        pdfDocRef.current = doc;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        const page = Math.min(Math.max(1, initialPage), doc.numPages);
        currentPageRef.current = page;
        setCurrentPage(page);
        zoomRef.current = initialZoom;
        setZoom(initialZoom);
        onPageChange?.(page, doc.numPages);
        setIsLoading(false);

        await renderAllPages(doc, initialZoom);

        if (page > 1) {
          const pageEl = pagesRef.current?.querySelector(
            `[data-page-number="${page}"]`
          ) as HTMLElement | null;
          pageEl?.scrollIntoView({ block: 'start' });
        }
      } catch (e) {
        console.error('Failed to load PDF:', e);
        setIsLoading(false);
      }
    },
    [renderAllPages, onPageChange]
  );

  const goToPage = useCallback(
    (page: number) => {
      const doc = pdfDocRef.current;
      if (!doc) return;
      const p = Math.min(Math.max(1, page), doc.numPages);
      const pageEl = pagesRef.current?.querySelector(
        `[data-page-number="${p}"]`
      ) as HTMLElement | null;
      if (pageEl) {
        pageEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
      currentPageRef.current = p;
      setCurrentPage(p);
      onPageChange?.(p, doc.numPages);
    },
    [onPageChange]
  );

  const changeZoom = useCallback(
    async (newZoom: number) => {
      const doc = pdfDocRef.current;
      if (!doc) return;
      const z = Math.min(Math.max(0.25, newZoom), 4.0);
      zoomRef.current = z;
      setZoom(z);
      const savedPage = currentPageRef.current;

      await renderAllPages(doc, z);

      const pageEl = pagesRef.current?.querySelector(
        `[data-page-number="${savedPage}"]`
      ) as HTMLElement | null;
      pageEl?.scrollIntoView({ block: 'start' });
    },
    [renderAllPages]
  );

  const fitToWidth = useCallback(async () => {
    const doc = pdfDocRef.current;
    const container = containerRef.current;
    if (!doc || !container) return;
    const page = await doc.getPage(1);
    const vp = page.getViewport({ scale: 1 });
    const newZoom = (container.clientWidth - 64) / vp.width;
    await changeZoom(newZoom);
  }, [changeZoom]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    containerRef,
    pagesRef,
    pdfDoc,
    currentPage,
    totalPages,
    zoom,
    isLoading,
    loadPdf,
    goToPage,
    changeZoom,
    fitToWidth,
  };
}
