/** Official YAC Fashion House social profiles */
export const WHATSAPP_NUMBER = '2348067152368';
export const WHATSAPP_URL = 'https://wa.me/2348067152368';

export const SOCIAL_URLS = {
  facebook: 'https://www.facebook.com/yacfashionhouse/',
  instagram: 'https://www.instagram.com/yacfashionhouse/',
  tiktok: 'https://www.tiktok.com/@yacfashionhouse',
  whatsapp: WHATSAPP_URL,
} as const;

export const SOCIAL_LINKS = [
  { href: SOCIAL_URLS.instagram, label: 'Instagram', icon: 'instagram' as const },
  { href: SOCIAL_URLS.tiktok, label: 'TikTok', icon: 'tiktok' as const },
  { href: SOCIAL_URLS.facebook, label: 'Facebook', icon: 'facebook' as const },
  { href: SOCIAL_URLS.whatsapp, label: 'WhatsApp', icon: 'whatsapp' as const },
];

/** Env overrides for deployment-specific URLs (optional) */
export function getSocialUrlsForSchema() {
  return [
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || SOCIAL_URLS.instagram,
    process.env.NEXT_PUBLIC_FACEBOOK_URL || SOCIAL_URLS.facebook,
    process.env.NEXT_PUBLIC_TIKTOK_URL || SOCIAL_URLS.tiktok,
  ];
}
