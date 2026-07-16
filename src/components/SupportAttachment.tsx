import { FileText, ExternalLink } from 'lucide-react';

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

function resolveUrl(url: string) {
  if (url.startsWith('http')) return url;
  const base = (import.meta.env.VITE_API_URL as string).replace('/api', '');
  return `${base}${url}`;
}

// Renders a support-ticket attachment inline: images as a thumbnail, videos with native
// controls, everything else (PDFs, docs, etc.) as a plain "view attachment" link.
export default function SupportAttachment({ url }: { url: string }) {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] || '';
  const fullUrl = resolveUrl(url);

  if (IMAGE_EXT.includes(ext)) {
    return (
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
        <img src={fullUrl} alt="Attachment" className="max-w-[200px] max-h-[200px] rounded-lg border border-border object-cover" />
      </a>
    );
  }

  if (VIDEO_EXT.includes(ext)) {
    return (
      <video src={fullUrl} controls className="mt-2 max-w-[260px] rounded-lg border border-border" />
    );
  }

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-500 hover:underline"
    >
      <FileText className="w-3.5 h-3.5" /> View Attachment <ExternalLink className="w-3 h-3" />
    </a>
  );
}
