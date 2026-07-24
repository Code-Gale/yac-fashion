'use client';

export function TrustStrip() {
  const items = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      label: 'Free Shipping',
      sub: 'On orders over ₦50,000',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      label: 'Easy Returns',
      sub: '14-day hassle-free',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'Authentic',
      sub: '100% genuine products',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      label: 'Secure Payment',
      sub: 'Powered by Paystack',
    },
  ];

  return (
    <section className="border-b border-[#e8e6e1] bg-white">
      <div className="max-w-7xl mx-auto">
        <div
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide px-6 py-5 lg:px-16 xl:px-24 lg:py-0 lg:grid lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#e8e6e1] lg:overflow-visible"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[72vw] sm:w-72 snap-center flex items-center gap-4 rounded-xl border border-[#e8e6e1] p-4 lg:border-0 lg:rounded-none lg:w-auto lg:flex-shrink lg:py-8 lg:px-6"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#f5edd6] ring-1 ring-[#c9a84c]/30 flex items-center justify-center text-[#c9a84c]">
                {item.icon}
              </div>
              <div>
                <p className="font-display font-semibold text-[#1a1a2e] text-sm lg:text-base">{item.label}</p>
                <p className="text-[#6b7280] text-xs lg:text-sm mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
