/**
 * Icon set — line icons drawn inline as SVG.
 * 16px default, currentColor stroke. Avoids dependency on a font library.
 */

export function Icon({ name, size = 16, ...rest }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  };
  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="2" y="2" width="5" height="6" rx="1" />
          <rect x="9" y="2" width="5" height="3.5" rx="1" />
          <rect x="2" y="10" width="5" height="4" rx="1" />
          <rect x="9" y="7.5" width="5" height="6.5" rx="1" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...props}>
          <path d="M2 13h12" />
          <path d="M4 11V7" />
          <path d="M7.5 11V4" />
          <path d="M11 11V8.5" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...props}>
          <path d="M2 3h12" />
          <path d="M4 7.5h8" />
          <path d="M6.5 12h3" />
        </svg>
      );
    case 'map':
      return (
        <svg {...props}>
          <path d="M2 4l4-1.5 4 1.5 4-1.5v10l-4 1.5-4-1.5-4 1.5z" />
          <path d="M6 2.5v11" />
          <path d="M10 4v11" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...props}>
          <path d="M3 2h7l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
          <path d="M10 2v3h3" />
          <path d="M5 8h6M5 11h4" />
        </svg>
      );
    case 'download':
      return (
        <svg {...props}>
          <path d="M8 2v8" />
          <path d="M5 7l3 3 3-3" />
          <path d="M2.5 13h11" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...props}>
          <path d="M8 3v10M3 8h10" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...props}>
          <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.5 9.5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1L12 4" />
          <path d="M7 7v5M9 7v5" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...props}>
          <path d="M11 2.5l2.5 2.5L6 12.5 3 13l.5-3z" />
        </svg>
      );
    case 'close':
      return (
        <svg {...props}>
          <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props}>
          <path d="M3 8l3.5 3.5L13 4.5" strokeWidth={2} />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...props}>
          <path d="M9.5 3.5L5 8l4.5 4.5" />
          <path d="M5 8h8" />
        </svg>
      );
    case 'arrow-up':
      return (
        <svg {...props}>
          <path d="M8 12V4" />
          <path d="M4.5 7.5L8 4l3.5 3.5" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 2H3v12h6" />
          <path d="M11 5l3 3-3 3" />
          <path d="M14 8H6" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...props}>
          <path d="M8 1.5C5.5 1.5 4 3.4 4 5.6c0 3.5 4 8.4 4 8.4s4-4.9 4-8.4C12 3.4 10.5 1.5 8 1.5z" />
          <circle cx="8" cy="5.6" r="1.5" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...props}>
          <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M4 12l2-2" />
        </svg>
      );
    case 'spinner':
      return (
        <svg {...props} className="spin">
          <path d="M8 1.5a6.5 6.5 0 1 1-6.5 6.5" strokeWidth={2} />
        </svg>
      );
    default:
      return null;
  }
}
