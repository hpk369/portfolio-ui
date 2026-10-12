// RecordedLabel (spec §8). Every replay says what it is, so nothing poses as live.
//   source "recorded"  → "Recorded run · <date> · <model>"
//   source "synthetic" → "Sample replay · synthetic data · not a real run"

const DATE_FORMAT = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

export function recordedLabelText(replay) {
  if (replay.source === 'recorded') {
    if (!replay.recorded_at || !replay.model) {
      throw new Error(`Replay "${replay.id}" is recorded but has no recorded_at or model.`);
    }
    const date = DATE_FORMAT.format(new Date(`${replay.recorded_at}T00:00:00Z`));
    return `Recorded run · ${date} · ${replay.model}`;
  }
  if (replay.source === 'synthetic') {
    return 'Sample replay · synthetic data · not a real run';
  }
  throw new Error(`Replay "${replay.id}" has unknown source "${replay.source}".`);
}

export function createRecordedLabel(replay) {
  const el = document.createElement('p');
  el.className = 'recorded-label meta-label';
  el.dataset.source = replay.source;
  el.textContent = recordedLabelText(replay);
  return el;
}
