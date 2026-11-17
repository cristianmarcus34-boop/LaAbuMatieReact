import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Flame, Sparkles } from 'lucide-react';

const AdBadge = ({ targetUrl }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-[9999] ad-float-animation"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        bottom: 'clamp(12px, 3vh, 32px)',
        left: 'clamp(12px, 3vw, 32px)',
        maxWidth: 'min(100% - 24px, 420px)',
        width: '100%',
      }}
    >
      <div className="relative group">

        {/* 🔥 BOTÓN DE CERRAR */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-3 -right-3 z-[10000] bg-black/80 backdrop-blur-md text-white rounded-full p-1.5 shadow-xl hover:bg-red-500 hover:scale-110 hover:shadow-red-500/50 transition-all duration-300 border border-white/20"
          aria-label="Cerrar"
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        {/* 🔥 CONTENEDOR PRINCIPAL (con padding extra para que el badge no se corte) */}
        <div className="relative pt-4 pl-3 sm:pt-5 sm:pl-4">

          {/* 🔥 BADGE "NUEVO" - REPOSICIONADO */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 sm:-top-2 sm:left-4 sm:translate-x-0 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[8px] sm:text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-lg shadow-orange-500/50 border border-white/30 flex items-center gap-1.5 animate-pulse">
            <Sparkles size={12} className="sm:w-[14px] sm:h-[14px]" />
            Nuevo
            <span className="hidden sm:inline-block w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </div>

          {/* 🔥 CONTENEDOR CON BORDE ANIMADO */}
          <div className={`relative p-[2px] overflow-hidden rounded-[28px] bg-white/10 backdrop-blur-md shadow-2xl transition-all duration-500 w-full ${isHovered ? 'shadow-orange-500/30 scale-[1.02]' : 'shadow-black/20'}`}>

            {/* Borde animado */}
            <div className="absolute inset-[-1000%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ff4500_0%,#ff8c00_25%,#ffd700_50%,#ff8c00_75%,#ff4500_100%)] opacity-60" />

            {/* 🔥 ENLACE PRINCIPAL */}
            <a 
              href={targetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative flex items-center gap-3 sm:gap-4 md:gap-5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-3 sm:p-3.5 md:p-4 pr-4 sm:pr-5 md:pr-7 rounded-[26px] no-underline transition-all duration-500 hover:bg-white/95 dark:hover:bg-gray-900/95 w-full"
            >
              {/* 🔥 IMAGEN */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 border-2 border-white/50 group-hover:border-orange-400 transition-all duration-300">
                <img 
                  src="/img/krustyburger.jpeg" 
                  alt="Krusty Burger App"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
              </div>

              {/* 🔥 TEXTO */}
              <div className="flex flex-col relative min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.25em] font-mono truncate">
                    ¡Pedí ahora! | ¡Hacé tu pedido!
                  </span>
                </div>

                <h3 className="text-sm sm:text-base md:text-base font-black text-gray-900 dark:text-white flex items-center gap-1 sm:gap-2 m-0 tracking-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  <span className="truncate">Krusty Burger</span>
                  <ExternalLink 
                    size={13} 
                    className="sm:w-[14px] sm:h-[14px] md:w-[15px] md:h-[15px] text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0" 
                    strokeWidth={2.5}
                  />
                </h3>
                
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                  <Flame size={11} className="sm:w-[12px] sm:h-[12px] md:w-[13px] md:h-[13px] text-orange-500 animate-pulse flex-shrink-0" />
                  <p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                    La mejor burger de Springfield
                  </p>
                </div>
              </div>

              {/* 🔥 EFECTO SHINE */}
              <div className="absolute top-0 -inset-full h-full w-1/2 z-20 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:animate-shine" />
            </a>
          </div>
        </div>
      </div>

      {/* 🔥 ESTILOS GLOBALES */}
      <style>{`
        @keyframes ad-float {
          0%, 100% { 
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 10px 30px rgba(255, 69, 0, 0.1));
          }
          50% { 
            transform: translateY(-10px) scale(1.02);
            filter: drop-shadow(0 20px 40px rgba(255, 69, 0, 0.25));
          }
        }

        @keyframes shine {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 150%; opacity: 0; }
        }

        @keyframes fadeInSlideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }

        .ad-float-animation {
          animation: 
            fadeInSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards,
            ad-float 4.5s infinite ease-in-out 1s;
        }

        .group:hover .animate-shine {
          animation: shine 0.7s forwards;
        }

        /* 🔥 Móviles muy pequeños */
        @media (max-width: 380px) {
          .ad-float-animation {
            bottom: 8px;
            left: 8px;
            max-width: calc(100% - 16px);
          }
          .ad-float-animation a {
            padding: 8px 12px;
            gap: 8px;
          }
          .ad-float-animation .w-12 {
            width: 36px;
            height: 36px;
          }
          .ad-float-animation h3 {
            font-size: 12px;
          }
        }

        /* 🔥 Tablets */
        @media (min-width: 641px) and (max-width: 1024px) {
          .ad-float-animation {
            bottom: 20px;
            left: 20px;
            max-width: 380px;
          }
        }

        /* 🔥 Modo oscuro */
        @media (prefers-color-scheme: dark) {
          .ad-float-animation a {
            background: rgba(17, 17, 17, 0.95) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdBadge;