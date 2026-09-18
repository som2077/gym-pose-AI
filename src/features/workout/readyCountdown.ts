/** Requires a fresh stable pose after every loss, pause or new request. */
export class ReadyCountdown {
  private requested = false;
  private readySince: number | null = null;
  private previous: number | null = null;
  request() {
    this.cancel();
    this.requested = true;
  }
  cancel() {
    this.requested = false;
    this.readySince = null;
    this.previous = null;
  }
  update(
    ready: boolean,
    now: number,
  ): { value: number | null; changed: boolean; start: boolean } {
    if (!this.requested || !ready) {
      this.readySince = null;
      const changed = this.previous !== null;
      this.previous = null;
      return { value: null, changed, start: false };
    }
    this.readySince ??= now;
    const elapsed = now - this.readySince;
    const value =
      elapsed < 800
        ? null
        : Math.max(0, 3 - Math.floor((elapsed - 800) / 1000));
    // Never jump straight to Go if the JS thread was suspended.
    if (
      value !== null &&
      ((this.previous === null && value !== 3) ||
        (this.previous !== null && value < this.previous - 1))
    ) {
      this.readySince = now;
      this.previous = null;
      return { value: null, changed: true, start: false };
    }
    const changed = value !== this.previous;
    this.previous = value;
    if (value === 0) this.cancel();
    return { value, changed, start: value === 0 };
  }
}
