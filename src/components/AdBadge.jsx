import React, { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';

const AdBadge = ({ targetUrl }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisible) return null;

  return (
    <aside
      className={`lam-ad-badge ${isHovered ? 'is-hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Recomendación"
    >
      <button className="lam-ad-close" onClick={() => setIsVisible(false)} aria-label="Cerrar recomendación">
        <X size={14} />
      </button>
      <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="lam-ad-link">
        <img src="/img/krustyburger.jpeg" alt="" loading="lazy" />
        <div>
          <span>También te puede gustar</span>
          <h3>Krusty Burger <ExternalLink size={14} aria-hidden="true" /></h3>
          <p>Conocé su propuesta y pedí en línea.</p>
        </div>
      </a>
    </aside>
  );
};

export default AdBadge;
