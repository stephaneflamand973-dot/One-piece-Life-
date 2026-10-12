import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app = readFileSync('src/ui/app.mjs', 'utf8');
const html = readFileSync('index.html', 'utf8');
const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
const sw = readFileSync('sw.js', 'utf8');

test('écran Vie seul : aucun onglet vide, aucun faux module affiché', () => {
  assert.ok(app.includes('Ma vie'));
  for (const feature of ['Activités', 'Relations', 'Carrière', 'Biens', 'Patrimoine actuel']) {
    assert.ok(!app.includes(feature), 'Élément non implémenté affiché : ' + feature);
  }
  assert.ok(!app.includes('stub-item'));
  assert.ok(!app.includes('data-tab='));
});
test('aucun ancien fichier JS ni CSS dans la nouvelle page', () => {
  assert.ok(!html.includes('src/reboot'));
  assert.ok(!html.includes('app.js'));
  assert.ok(html.includes('app.mjs?v=0.2.0'));
});
test('l’identité de la PWA existante est conservée', () => {
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './');
});
test('ancien cache nettoyé sans toucher au stockage des personnages', () => {
  assert.ok(sw.includes("caches.keys()"));
  assert.ok(sw.includes("self.registration.unregister()"));
  assert.ok(!sw.includes('localStorage'));
});
