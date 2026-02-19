(function () {
  const inputEl = document.getElementById('rruleInput');
  const validateBtn = document.getElementById('validateBtn');
  const clearBtn = document.getElementById('clearBtn');

  const previewBtn = document.getElementById('previewBtn');
  const dtstartInput = document.getElementById('dtstartInput');
  const countInput = document.getElementById('countInput');
  const occurrencesEl = document.getElementById('occurrences');

  const statusEl = document.getElementById('status');
  const normalizedEl = document.getElementById('normalized');
  const detailsEl = document.getElementById('details');

  function setStatus(kind, text) {
    statusEl.classList.remove('good', 'bad');
    if (kind) statusEl.classList.add(kind);
    statusEl.textContent = text;
  }

  function normalizeRRule(raw) {
    if (!raw) return "";

    let s = raw.trim().replace(/\r\n|\r|\n/g, ';');
    const parts = s.split(';').map(p => p.trim()).filter(Boolean);

    const normParts = parts.map(part => {
      const eq = part.indexOf('=');
      if (eq === -1) return part.toUpperCase();

      const key = part.slice(0, eq).trim().toUpperCase();
      const valueRaw = part.slice(eq + 1).trim();

      const value = valueRaw
        .split(',')
        .map(v => v.trim().toUpperCase())
        .join(',');

      return `${key}=${value}`;
    });

    return normParts.join(';');
  }

  function ensureLib() {
    if (!window.rrule || typeof window.rrule.rrulestr !== 'function') {
      throw new Error('rrule library not found. Ensure ./vendor/rrule.min.js is present and loaded.');
    }
    return window.rrule;
  }

  // Format a JS Date as a floating DTSTART string: YYYYMMDDTHHMMSS (no Z suffix).
  // This matches the datetime-local input semantics (local, not UTC).
  function formatDtstart(date) {
    const pad = (x) => String(x).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `DTSTART:${yyyy}${mm}${dd}T${hh}${mi}${ss}`;
  }

  // Parse datetime-local (YYYY-MM-DDTHH:mm or with seconds) as LOCAL time.
  function parseDateTimeLocal(value) {
    if (!value) return null;

    // Allow "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
    const m = value.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (!m) return null;

    const year = Number(m[1]);
    const monthIndex = Number(m[2]) - 1; // JS months are 0-based
    const day = Number(m[3]);
    const hour = Number(m[4]);
    const minute = Number(m[5]);
    const second = m[6] ? Number(m[6]) : 0;

    return new Date(year, monthIndex, day, hour, minute, second, 0);
  }

  function parseRuleOrThrow() {
    const raw = inputEl.value;
    const normalized = normalizeRRule(raw);

    normalizedEl.textContent = normalized || '—';
    detailsEl.textContent = '—';

    if (!normalized) {
      throw new Error('Empty input. Provide an RRULE like: FREQ=WEEKLY;BYDAY=MO,WE,FR');
    }

    const rrule = ensureLib();
    const ruleObj = rrule.rrulestr(normalized); // throws if invalid

    const asString = (typeof ruleObj.toString === 'function') ? ruleObj.toString() : String(ruleObj);
    const rruleOnly = asString.startsWith('RRULE:') ? asString.slice('RRULE:'.length) : asString;

    detailsEl.textContent =
      'Parsed successfully.\n' +
      `Library serialization: ${rruleOnly}\n` +
      `Type: ${ruleObj && ruleObj.constructor ? ruleObj.constructor.name : typeof ruleObj}`;

    return { normalized, ruleObj };
  }

  function validate() {
    occurrencesEl.textContent = '—';
    try {
      parseRuleOrThrow();
      setStatus('good', 'VALID');
    } catch (err) {
      setStatus('bad', 'INVALID');
      detailsEl.textContent = (err && err.message) ? err.message : String(err);
    }
  }

  function preview() {
    occurrencesEl.textContent = '—';

    let normalized, ruleObj;
    try {
      ({ normalized, ruleObj } = parseRuleOrThrow());
      setStatus('good', 'VALID');
    } catch (err) {
      setStatus('bad', 'INVALID');
      detailsEl.textContent = (err && err.message) ? err.message : String(err);
      return;
    }

    const nRaw = Number(countInput.value);
    const n = Number.isFinite(nRaw) ? Math.max(1, Math.min(200, Math.floor(nRaw))) : 10;

    const dtstart =
      parseDateTimeLocal(dtstartInput.value) ||
      new Date();

    // Build a combined DTSTART+RRULE string and parse it with rrulestr so that
    // ordinal weekday constructs like BYDAY=1TH,3TH are preserved exactly.
    // Rebuilding via new RRule(ruleObj.options) is not safe for such constructs.
    const rrule = ensureLib();
    const dtstartStr = formatDtstart(dtstart);
    const combined = `${dtstartStr}\nRRULE:${normalized}`;
    const ruleForPreview = rrule.rrulestr(combined);

    // Generate next N occurrences, safely bounded.
    const dates = ruleForPreview.all((date, i) => i < n);

    if (!dates.length) {
      occurrencesEl.textContent = '(No occurrences generated)';
      return;
    }

    // Display in local time ISO-ish, plus timezone offset hint.
    const lines = dates.map((d, idx) => {
      const pad = (x) => String(x).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${idx + 1}. ${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} (local)`;
    });

    occurrencesEl.textContent = lines.join('\n');
  }

  function clear() {
    inputEl.value = '';
    dtstartInput.value = '';
    countInput.value = '10';
    setStatus('', '—');
    normalizedEl.textContent = '—';
    detailsEl.textContent = '—';
    occurrencesEl.textContent = '—';
    inputEl.focus();
  }

  validateBtn.addEventListener('click', validate);
  previewBtn.addEventListener('click', preview);
  clearBtn.addEventListener('click', clear);

  inputEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') validate();
  });

  setStatus('', '—');
})();
