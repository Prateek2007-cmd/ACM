import { ArrowUpRight, Building2, Globe, Mail, MapPin } from 'lucide-react';
import { BRAND, EXTERNAL, PENDING } from '../data/brand';

/** Contact: only verified destinations, with unpublished chapter channels marked as coming soon. */
export default function ContactSection() {
  return (
    <section id="contact" className="relative min-h-screen py-28 px-6 lg:px-12 z-20" aria-label="Contact the chapter">
      <div className="section-content max-w-7xl mx-auto space-y-24">
        {/* Lockup */}
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="eyebrow-label text-[#5C5C66] flex items-center justify-center gap-3">
            <span className="text-[#2F7BFF]">06 / CONTACT</span>
            <span className="text-white/20">/</span>
            <span>CHAPTER CHANNELS</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-display font-extrabold text-[#F5F5F2] tracking-tight leading-[0.92]">
              Reach the <br />
              <span className="font-serif-italic text-[#6EA8FF] text-5xl sm:text-7xl md:text-8xl lg:text-[9.5rem] font-normal">
                chapter team.
              </span>
            </h2>
            <p className="text-xl sm:text-2xl font-display font-medium text-[#A1A1AA] tracking-tight pt-2">
              {BRAND.chapter} · <span className="text-[#F5F5F2]">{BRAND.college}</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {BRAND.pillars.map((p) => (
              <span key={p} className="px-3.5 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/90">
                {p.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="eyebrow-label text-[#2F7BFF] block">VERIFIED CHANNELS</span>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#F5F5F2] tracking-tight">Where the chapter is online</h3>
            <p className="text-sm sm:text-base text-[#A1A1AA] font-light leading-relaxed max-w-2xl mx-auto">
              The chapter’s own mailbox and social handles are not published yet. Until they are, these are the
              official places the chapter is connected to.
            </p>
          </div>

          <ul className="contact-primary" aria-label="Chapter channels">
            <li className="contact-card">
              <span className="contact-icon" aria-hidden="true"><Mail size={20} strokeWidth={1.8} /></span>
              <span className="contact-label">Chapter email</span>
              {PENDING.email
                ? <a href={`mailto:${PENDING.email}`} className="contact-value" data-cursor="magnetic">{PENDING.email}</a>
                : <span className="contact-value contact-pending">Coming soon</span>}
              <div className="contact-actions">
                {PENDING.email
                  ? <a href={`mailto:${PENDING.email}`} className="contact-btn contact-btn-solid" data-cursor="magnetic">Write an email</a>
                  : <span className="contact-btn">To be published by the chapter</span>}
              </div>
            </li>

            <li className="contact-card">
              <span className="contact-icon" aria-hidden="true"><Globe size={20} strokeWidth={1.8} /></span>
              <span className="contact-label">ACM — the society</span>
              <a href={EXTERNAL.acm} target="_blank" rel="noopener noreferrer" className="contact-value" data-cursor="magnetic">acm.org</a>
              <div className="contact-actions">
                <a href={EXTERNAL.acmAbout} target="_blank" rel="noopener noreferrer" className="contact-btn contact-btn-solid" data-cursor="magnetic">
                  About ACM <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </li>

            <li className="contact-card">
              <span className="contact-icon" aria-hidden="true"><Building2 size={20} strokeWidth={1.8} /></span>
              <span className="contact-label">College</span>
              <a href={EXTERNAL.vce} target="_blank" rel="noopener noreferrer" className="contact-value" data-cursor="magnetic">vce.ac.in</a>
              <div className="contact-actions">
                <a href={EXTERNAL.vceActivities} target="_blank" rel="noopener noreferrer" className="contact-btn contact-btn-solid" data-cursor="magnetic">
                  Campus activities <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </div>
            </li>
          </ul>

          <div className="contact-secondary">
            <a href={EXTERNAL.acmIndia} target="_blank" rel="noopener noreferrer" className="contact-gh" data-cursor="magnetic">
              <MapPin size={18} strokeWidth={1.8} aria-hidden="true" />
              <span className="contact-gh-label">ACM India</span>
              <span className="contact-gh-value">india.acm.org</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>

          <p className="contact-note">
            <strong>Address:</strong> {BRAND.address}. <br />
            <strong>Not published yet:</strong> chapter email, social handles, faculty advisor and office bearers.
            These are marked <em>Coming soon</em> rather than guessed — once the chapter confirms them they go here.
          </p>
        </div>
      </div>
    </section>
  );
}
