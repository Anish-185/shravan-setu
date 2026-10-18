// Mic lifecycle with a fake recorder that behaves like expo-audio's native one after release (ERR-021):
// any call on a released recorder rejects with "Cannot use shared object that was already released".
import { createMic } from '../mic';

function fakeRecorder({ stopFails = false } = {}) {
  const calls: string[] = [];
  const misuse: string[] = []; // calls made after release: the bug this guards against
  const deleted: string[] = [];
  let released = false;
  let uri: string | null = null;
  const guard = (name: string) => {
    calls.push(name);
    if (released) {
      misuse.push(name);
      throw new Error('Cannot use shared object that was already released');
    }
  };
  const recorder = {
    async prepareToRecordAsync() { guard('prepare'); await tick(); uri = 'file:///cache/rec.m4a'; },
    record() { guard('record'); },
    async stop() { guard('stop'); await tick(); if (stopFails) throw new Error('native stop failed'); },
    release() { guard('release'); released = true; },
    get uri() { return uri; },
  };
  const warnings: string[] = [];
  const mic = createMic({
    recorder,
    setup: async () => { calls.push('setup'); await tick(); },
    deleteFile: (u) => { deleted.push(u); },
    now: () => 42,
    warn: (msg) => { warnings.push(msg); },
  });
  return { mic, calls, misuse, deleted, warnings };
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

test('finishing a test: stop on save, release on leaving; stop runs once, file deleted', async () => {
  const f = fakeRecorder();
  expect(await f.mic.start()).toBe(42);
  f.mic.stop(); // ResultStep onSave, not awaited (as in the screen)
  await tick();
  await f.mic.dispose(); // Done -> router.back() -> unmount
  expect(f.calls).toEqual(['setup', 'prepare', 'record', 'stop', 'release']);
  expect(f.misuse).toEqual([]);
  expect(f.deleted.length).toBeGreaterThan(0);
  expect(f.warnings).toEqual([]);
});

test('leaving the screen mid-test: stop, delete the recording, then release', async () => {
  const f = fakeRecorder();
  await f.mic.start();
  await f.mic.dispose();
  expect(f.calls).toEqual(['setup', 'prepare', 'record', 'stop', 'release']);
  expect(f.deleted).toContain('file:///cache/rec.m4a');
  expect(f.misuse).toEqual([]);
});

test('leaving right after the result: stop and dispose in the same tick never touch a released recorder', async () => {
  const f = fakeRecorder();
  await f.mic.start();
  const a = f.mic.stop();
  const b = f.mic.dispose();
  const c = f.mic.stop(); // a late stop after dispose is a no-op
  await Promise.all([a, b, c]);
  expect(f.calls.filter((x) => x === 'stop')).toHaveLength(1);
  expect(f.calls[f.calls.length - 1]).toBe('release');
  expect(f.misuse).toEqual([]);
});

test('leaving while the mic is still starting: never records, prepared file deleted, released', async () => {
  const f = fakeRecorder();
  const started = f.mic.start();
  await f.mic.dispose();
  expect(await started).toBeNull();
  expect(f.calls).not.toContain('record');
  expect(f.calls).not.toContain('stop');
  expect(f.calls[f.calls.length - 1]).toBe('release');
  expect(f.misuse).toEqual([]);
});

test('a native stop failure is logged, not left unhandled, and release still happens', async () => {
  const f = fakeRecorder({ stopFails: true });
  await f.mic.start();
  await expect(f.mic.dispose()).resolves.toBeUndefined();
  expect(f.warnings).toEqual(['mic stop failed']);
  expect(f.calls[f.calls.length - 1]).toBe('release');
  expect(f.deleted).toContain('file:///cache/rec.m4a');
});

test('a failed start (e.g. permission denied) rejects to the caller and does not block dispose', async () => {
  const released: boolean[] = [];
  const mic = createMic({
    recorder: { prepareToRecordAsync: async () => {}, record: () => {}, stop: async () => {}, release: () => { released.push(true); }, uri: null },
    setup: async () => { throw new Error('Microphone permission denied'); },
    deleteFile: () => {}, now: () => 0, warn: () => {},
  });
  await expect(mic.start()).rejects.toThrow('permission denied');
  await mic.dispose();
  expect(released).toEqual([true]);
});
