import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 40, textAlign: 'center',
          color: 'var(--ink-3)', fontFamily: 'var(--font-sans)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--bg-3)', border: '1px solid var(--border-2)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 16px', fontSize: 24,
          }}>⚠</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-1)', marginBottom: 6 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
