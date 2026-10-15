import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
}

const DEFAULT_TITLE = 'T2U — Time to Upgrade | Learn, Upgrade & Earn Platform';
const DEFAULT_DESC = 'Upgrade your career with India\'s all-in-one learn, upgrade, and earn platform. Live interactive cohorts, industry certificates, and automated referral rewards.';

export function useSEO({ title, description, canonical }: SEOProps) {
  useEffect(() => {
    // 1. Title formatting: ensure standard 'Page Name | Brand Name'
    const fullTitle = title
      ? (title.includes('T2U') ? title : `${title} | T2U — Time to Upgrade`)
      : DEFAULT_TITLE;
    document.title = fullTitle;

    // 2. Meta description (under 160 characters)
    const metaDesc = description || DEFAULT_DESC;
    let descElement = document.querySelector('meta[name="description"]');
    if (!descElement) {
      descElement = document.createElement('meta');
      descElement.setAttribute('name', 'description');
      document.head.appendChild(descElement);
    }
    descElement.setAttribute('content', metaDesc);

    // 3. OpenGraph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', fullTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', metaDesc);

    // 4. Canonical link (if provided)
    if (canonical) {
      let canonicalElement = document.querySelector('link[rel="canonical"]');
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.setAttribute('href', canonical);
    }
  }, [title, description, canonical]);
}
