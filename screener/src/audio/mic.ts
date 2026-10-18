// Mic lifecycle for one screening screen: start -> stop (deletes the recording) -> dispose (releases the recorder).
// Every step runs through one queue, so stop never reaches the native recorder after release (ERR-021),
// and the recording file is always deleted before release: we keep metering numbers, never audio.
// No expo imports here, so jest can drive it with a fake recorder.

export type MicRecorder = {
  prepareToRecordAsync(): Promise<void>;
  record(): void;
  stop(): Promise<void>;
  release(): void;
  readonly uri: string | null;
};

export type MicDeps = {
  recorder: MicRecorder;
  /** Permission + audio mode; throws if the mic can't be used. */
  setup: () => Promise<void>;
  deleteFile: (uri: string) => void;
  now: () => number;
  warn: (msg: string, e: unknown) => void;
};

export function createMic({ recorder, setup, deleteFile, now, warn }: MicDeps) {
  let state: 'off' | 'recording' | 'released' = 'off';
  let chain: Promise<unknown> = Promise.resolve();

  // Runs fn after every earlier step; a failed step never blocks the ones after it.
  function enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const p = chain.then(fn);
    chain = p.catch(() => undefined);
    return p;
  }

  async function stopNow() {
    if (state !== 'recording') return;
    state = 'off';
    try {
      await recorder.stop();
    } catch (e) {
      warn('mic stop failed', e);
    }
    dropFile();
  }

  function dropFile() {
    try {
      if (recorder.uri) deleteFile(recorder.uri);
    } catch (e) {
      warn('could not delete the recording', e);
    }
  }

  return {
    /** Resolves with the mic start time (for the settle window), or null if the screen was left meanwhile. */
    start: () => enqueue(async () => {
      if (state !== 'off') return null;
      await setup();
      if (state !== 'off') return null;
      await recorder.prepareToRecordAsync();
      if (state !== 'off') return null;
      recorder.record();
      state = 'recording';
      return now();
    }),
    /** Safe to call any number of times, and after dispose. Never rejects. */
    stop: () => enqueue(stopNow),
    /** Call once on unmount: stops, deletes the recording, then releases. Never rejects. */
    dispose: () => {
      const p = enqueue(async () => {
        await stopNow();
        dropFile(); // also covers a start that prepared a file and then backed out
        state = 'released';
        try {
          recorder.release();
        } catch (e) {
          warn('mic release failed', e);
        }
      });
      // A start still in flight sees state !== 'off' after its next await and backs out.
      if (state === 'off') state = 'released';
      return p;
    },
    get state() { return state; },
  };
}
