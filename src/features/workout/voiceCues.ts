/** Native-independent speech scheduler. No backlog of outdated coaching. */
export type VoiceCue = {
  id: string;
  text: string;
  priority: number;
  cooldownMs?: number;
  once?: boolean;
};
export type SpeechPort = {
  stop: () => Promise<void>;
  prepare?: (language: string) => Promise<boolean>;
  speak: (
    text: string,
    language: string,
    done: () => void,
    error: () => void,
  ) => void;
};

export class VoiceCuePlayer {
  private owner: symbol | null = null;
  private revision = 0;
  private pending: Promise<void> = Promise.resolve();
  private current: VoiceCue | null = null;
  private currentDeadline = 0;
  private spoken = new Map<string, number>();
  private seen = new Set<string>();
  private notify: (text: string, error?: boolean) => void = () => {};
  constructor(
    private readonly speech: SpeechPort,
    private readonly now = Date.now,
  ) {}
  activate(owner: symbol, notify: (text: string, error?: boolean) => void) {
    this.cancel();
    this.owner = owner;
    this.notify = notify;
    this.spoken.clear();
    this.seen.clear();
  }
  cancel(owner?: symbol) {
    if (owner && owner !== this.owner) return;
    this.revision++;
    this.current = null;
    this.pending = this.pending.then(() => this.speech.stop()).catch(() => {});
  }
  release(owner: symbol) {
    if (this.owner !== owner) return;
    this.cancel(owner);
    this.owner = null;
    this.notify = () => {};
  }
  say(owner: symbol, cue: VoiceCue, language: string, audible = true): boolean {
    if (owner !== this.owner) return false;
    const now = this.now();
    if (cue.once && this.seen.has(cue.id)) return false;
    if (now - (this.spoken.get(cue.id) ?? -Infinity) < (cue.cooldownMs ?? 6000))
      return false;
    if (cue.once) this.seen.add(cue.id);
    // Recover if the native engine never delivers a completion callback.
    if (now >= this.currentDeadline) this.current = null;
    if (this.current && this.current.priority > cue.priority) return false;
    this.spoken.set(cue.id, now);
    this.notify(cue.text);
    if (!audible) return true;
    this.current = cue;
    this.currentDeadline = now + Math.max(5000, cue.text.length * 150);
    const revision = ++this.revision;
    this.pending = this.pending
      .then(async () => {
        if (revision !== this.revision) return;
        await this.speech.stop();
        if (revision !== this.revision || this.owner !== owner) return;
        const done = () => {
          if (revision === this.revision) this.current = null;
        };
        const available = this.speech.prepare
          ? await this.speech.prepare(language)
          : true;
        if (revision !== this.revision || this.owner !== owner) return;
        if (!available) {
          this.current = null;
          this.notify(cue.text, true);
          return;
        }
        this.speech.speak(cue.text, language, done, () => {
          if (revision !== this.revision) return;
          done();
          this.notify(cue.text, true);
        });
      })
      .catch(() => {
        if (revision !== this.revision) return;
        this.current = null;
        this.notify(cue.text, true);
      });
    return true;
  }
}
