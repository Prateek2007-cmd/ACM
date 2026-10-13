import { useState, useEffect } from 'react';
import { BRAND, NAV_ITEMS } from '../data/brand';
import { asset } from '../data/media';

interface NavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export default function Navigation({ activeSection, onNavigate }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="nav-pill lg flex items-center justify-between">
        {/* Zone 1: the ACM wordmark asset, with a quiet chapter label beside it */}
        <button
          onClick={() => onNavigate('hero')}
          data-cursor="magnetic"
          aria-label={`${BRAND.chapter} — back to top`}
          className="flex items-center gap-3 whitespace-nowrap"
        >
          <img src={asset(BRAND.logo)} alt={BRAND.logoAlt} className="nav-logo" />
          <span className="hidden xl:inline font-mono text-[10px] tracking-[0.22em] uppercase text-[#8b8f98]">
            Student Chapter · VCE
          </span>
        </button>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-1 text-[14px] font-display font-medium tracking-tight text-[#A1A1AA]">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-cursor="magnetic"
              className={`hover:text-white hover:bg-white/5 transition-colors relative px-3.5 py-2 rounded-full ${
                activeSection === item.id ? 'text-white' : ''
              }`}
            >
              {item.label}
              {activeSection === item.id && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#2F7BFF] rounded-full shadow-[0_0_8px_#2F7BFF]" />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: CTA action and mobile hamburger */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('join')}
            data-cursor="magnetic"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-[#F5F5F2] text-[14px] font-display font-semibold tracking-tight transition-all duration-200 shadow-sm"
          >
            <span>Join the chapter</span>
            <span aria-hidden="true">→</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#A1A1AA] hover:text-white border border-white/10"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#07080B]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-1 font-display text-2xl font-semibold tracking-tight text-[#A1A1AA]">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2 border-b border-white/5 hover:text-white ${
                  activeSection === item.id ? 'text-[#2F7BFF] font-semibold' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button
            onClick={() => {
              onNavigate('join');
              setMobileMenuOpen(false);
            }}
            className="w-full py-3.5 rounded-full bg-white text-black text-base font-display font-semibold"
          >
            Join the chapter →
          </button>
        </div>
      )}
    </header>
  );
}
