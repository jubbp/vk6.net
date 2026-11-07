// Infrastructure status (demonstration): the report form opens in a dialog, preselecting the
// item whose button was pressed. Nothing is sent anywhere.
(() => {
  const dlg = document.getElementById('report-dialog');
  if (!dlg || !dlg.showModal) return;
  const form = dlg.querySelector('form');
  const done = dlg.querySelector('.rd-done');
  const send = form.querySelector('[type="submit"]');
  document.querySelectorAll('[data-report]').forEach((b) => b.addEventListener('click', () => {
    form.reset();
    done.hidden = true;
    send.hidden = false;
    form.item.value = b.dataset.report;
    dlg.showModal();
    (b.dataset.report ? form.querySelector('[name="kind"]') : form.item).focus();
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    done.hidden = false;
    send.hidden = true;
  });
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
