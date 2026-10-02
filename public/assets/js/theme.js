// Farbmodus vor dem ersten Zeichnen setzen, damit niemand ein weißes Aufblitzen sieht.
// Gespeicherte Wahl gewinnt, sonst folgt die Seite dem System.
(function () {
  var t = null;
  try {
    t = localStorage.getItem('ilpomodoro.theme');
  } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  document.documentElement.classList.add('js');
})();
