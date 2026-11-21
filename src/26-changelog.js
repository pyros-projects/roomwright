/* ========================= 8f CONTENT: changelog ====================== */
// CHANGELOG.md is the one source. tools/build.sh puts its text into the game as CHANGELOG_MD, and this reads it:
// a version starts with "## 0.3: Its name (2026-11-21)" or "(in progress)", an entry with "- ", and a line that
// starts with two spaces continues the entry above it. Everything else in the file is for readers of the file.
// A "## " line that is not written that way becomes a version without a number, which the content check reports.
const CHANGES = (() => {
  const out = [];
  for (const line of CHANGELOG_MD.split('\n')) {
    const head = line.match(/^## (\S+?): (.*?)(?: \((in progress|\d{4}-\d\d-\d\d)\))?\s*$/), last = out[out.length - 1];
    if (head) out.push({ v: head[1], name: head[2], date: head[3] || '', items: [] });
    else if (line.startsWith('## ')) out.push({ v: '', name: line.slice(3).trim(), date: '', items: [] });
    else if (last && line.startsWith('- ')) last.items.push(line.slice(2).trim());
    else if (last && last.items.length && /^ {2,}\S/.test(line)) last.items[last.items.length - 1] += ' ' + line.trim();
  }
  return out;
})();
