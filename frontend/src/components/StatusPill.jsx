import React from 'react';
import { statusPillClass } from '../lib/format';

export default function StatusPill({ status }) {
  return (
    <span className={statusPillClass(status)}>
      <span className="dot" />
      {status}
    </span>
  );
}
