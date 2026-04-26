// Icon set — inline SVGs, 1.5 stroke, currentColor.
// Keep minimal & consistent.
import React from 'react';

const base = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const I = {
  logo: (p) => (
    <svg {...base} {...p}>
      <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.6 7.1 17.2 8 11.7 4 7.8l5.5-.8L12 2z" strokeWidth="1.4" />
    </svg>
  ),
  dashboard: (p) => (<svg {...base} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>),
  list: (p) => (<svg {...base} {...p}><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>),
  map: (p) => (<svg {...base} {...p}><path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/></svg>),
  chart: (p) => (<svg {...base} {...p}><path d="M3 3v18h18"/><path d="M7 15l4-6 4 4 5-8"/></svg>),
  bell: (p) => (<svg {...base} {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>),
  logs: (p) => (<svg {...base} {...p}><path d="M4 4h10l6 6v10a0 0 0 0 1 0 0H4z"/><path d="M14 4v6h6"/><path d="M8 14h8M8 18h6"/></svg>),
  search: (p) => (<svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>),
  filter: (p) => (<svg {...base} {...p}><path d="M3 5h18l-7 9v5l-4-2v-3L3 5z"/></svg>),
  arrowUp: (p) => (<svg {...base} {...p}><path d="M12 19V5M5 12l7-7 7 7"/></svg>),
  arrowDown: (p) => (<svg {...base} {...p}><path d="M12 5v14M5 12l7 7 7-7"/></svg>),
  arrowRight: (p) => (<svg {...base} {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>),
  arrowLeft: (p) => (<svg {...base} {...p}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>),
  check: (p) => (<svg {...base} {...p}><path d="M5 13l4 4L19 7"/></svg>),
  x: (p) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>),
  plus: (p) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>),
  dot: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>),
  clock: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  pin: (p) => (<svg {...base} {...p}><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>),
  user: (p) => (<svg {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>),
  upvote: (p) => (<svg {...base} {...p}><path d="M12 19V6M6 12l6-6 6 6"/></svg>),
  mail: (p) => (<svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>),
  lock: (p) => (<svg {...base} {...p}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>),
  logout: (p) => (<svg {...base} {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h12"/></svg>),
  settings: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>),
  shield: (p) => (<svg {...base} {...p}><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/></svg>),
  refresh: (p) => (<svg {...base} {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>),
  download: (p) => (<svg {...base} {...p}><path d="M12 4v12M6 10l6 6 6-6"/><path d="M4 20h16"/></svg>),
  sparkle: (p) => (<svg {...base} {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>),
  trend: (p) => (<svg {...base} {...p}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>),
  ping: (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" opacity=".4"/></svg>),
};
