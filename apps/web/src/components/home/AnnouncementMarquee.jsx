const ITEMS = [
  'FREE SHIPPING ON ORDERS OVER ₦50,000',
  'SECURE CHECKOUT VIA PAYSTACK',
  'NEW ARRIVALS EVERY WEEK',
  '100% AUTHENTIC PIECES',
  'NATIONWIDE DELIVERY',
];

export function AnnouncementMarquee() {
  // Duplicate the sequence so the CSS scroll loop has no visible seam.
  const sequence = [...ITEMS, ...ITEMS];

      return (
    <div className="bg-[#0f0f1a] border-y border-[#c9a84c]/20 overflow-hidden py-3">
      <div className="flex w-max animate-marquee">
        {[0, 1].map((dupe) => (
          <div key={dupe} className="flex items-center shrink-0">
            {sequence.map((text, i) => (
              <span key={`${dupe}-${i}`} className="flex items-center shrink-0">
                <span className="text-[#c9a84c] text-xs font-medium tracking-[0.2em] px-6 whitespace-nowrap">
                  {text}
                </span>
                    <span className="w-1 h-1 rounded-full bg-[#c9a84c]/50" aria-hidden />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
