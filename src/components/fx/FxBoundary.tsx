import { Component, type ReactNode } from 'react';

/** Any visual effect that fails (no WebGL, lost context, driver bug) degrades to `fallback` instead of breaking the page. */
export default class FxBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.info('[fx] effect disabled:', (err as Error)?.message); }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}
