import type { PageImage } from "./types";

// pdfjs-dist is loaded dynamically (browser only) so it never touches the server bundle.
async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjs;
}

const MAX_DIMENSION = 1600; // keep uploads to the vision API reasonably sized

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadImageBitmap(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function drawToCanvas(
  img: HTMLImageElement,
  naturalWidth: number,
  naturalHeight: number
): { dataUrl: string; width: number; height: number } {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(naturalWidth, naturalHeight));
  const width = Math.round(naturalWidth * scale);
  const height = Math.round(naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/png", 0.92), width, height };
}

async function rasterizeImageFile(file: File): Promise<PageImage[]> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImageBitmap(dataUrl);
  const { dataUrl: out, width, height } = drawToCanvas(
    img,
    img.naturalWidth,
    img.naturalHeight
  );
  return [{ page: 0, dataUrl: out, width, height }];
}

async function rasterizePdfFile(file: File): Promise<PageImage[]> {
  const pdfjs = await getPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: PageImage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(
      2.2,
      MAX_DIMENSION / Math.max(baseViewport.width, baseViewport.height)
    );
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported in this browser");
    await page.render({ canvasContext: ctx, viewport, canvas } as unknown as Parameters<
      typeof page.render
    >[0]).promise;
    pages.push({
      page: i - 1,
      dataUrl: canvas.toDataURL("image/png", 0.92),
      width: canvas.width,
      height: canvas.height,
    });
  }
  return pages;
}

export async function rasterizeFile(file: File): Promise<PageImage[]> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return rasterizePdfFile(file);
  }
  return rasterizeImageFile(file);
}
