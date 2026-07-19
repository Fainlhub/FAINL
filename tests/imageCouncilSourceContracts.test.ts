import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string): string =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Beeldraad source contracts', () => {
  const migration = read('supabase/migrations/20260719154142_image_council_database.sql');
  const worker = read('supabase/functions/image-council-worker/index.ts');
  const command = read('supabase/functions/image-council-command/index.ts');
  const queue = read('supabase/functions/_shared/image-council/queue.ts');
  const models = read('supabase/functions/_shared/image-council/env.ts');

  it('keeps the five exact generation branches', () => {
    for (const model of [
      'gemini-3.1-flash-image',
      'gpt-image-2',
      'Qwen/Qwen-Image',
      'Tongyi-MAI/Z-Image-Turbo',
      'stabilityai/stable-diffusion-xl-base-1.0',
    ]) {
      expect(models).toContain(model);
      expect(migration).toContain(model);
    }
  });

  it('keeps the final editor server-owned', () => {
    expect(models).toContain('gemini-3-pro-image');
    expect(worker).toContain('model: editorModel()');
  });

  it('reads exactly one queue message per invocation', () => {
    expect(queue).toContain('pgmq.read(${QUEUE_NAME}, ${visibility}, 1)');
  });

  it('stops non-control work immediately after cancellation', () => {
    expect(command).toContain('.update({ status: "cancel_requested" })');
    expect(worker).toContain('run.status === "cancel_requested" || run.status === "cancelled"');
  });

  it('short-circuits replayed commands before queue dispatch', () => {
    const replayGuard = command.indexOf('if (!commandEvent.inserted)');
    const queueCreation = command.indexOf('queue = new ImageCouncilQueue()');
    expect(replayGuard).toBeGreaterThan(0);
    expect(queueCreation).toBeGreaterThan(replayGuard);
  });

  it('records the polished finalist ids as the final ranking', () => {
    expect(worker).toContain('round: 4');
    expect(worker).toContain('Verified finalist ranking after polish');
  });

  it('caps a run at nine server-settled credits', () => {
    expect(migration).toContain('requested_credits smallint not null default 9 check (requested_credits = 9)');
    expect(migration).toContain('p_actual_credits not between 0 and 9');
  });

  it('keeps image storage private and server-written', () => {
    expect(migration).toContain("'image-council'");
    expect(migration).toContain('set public = false');
    expect(migration).toContain('No authenticated INSERT/UPDATE/DELETE Storage policy exists');
  });

  it('installs the one-minute recovery consumer', () => {
    expect(migration).toContain("'image-council-recovery'");
    expect(migration).toContain("'* * * * *'");
  });
});
