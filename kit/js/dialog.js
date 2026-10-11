// Dialog (spec §8): a thin wrapper around a native <dialog>.
// showModal() makes the rest of the page inert, which traps focus; this adds
// focus-in on open, Escape through a single close path, and focus return.

export class Dialog {
  constructor(dialog, { onRequestClose } = {}) {
    this.dialog = dialog;
    this.trigger = null;
    this.onRequestClose = onRequestClose ?? (() => this.close());
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.onRequestClose();
    });
    // A click on the backdrop (the dialog element itself) closes it.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) this.onRequestClose();
    });
  }

  get isOpen() {
    return this.dialog.open;
  }

  open({ trigger = document.activeElement, focus } = {}) {
    this.trigger = trigger;
    if (!this.dialog.open) this.dialog.showModal();
    document.documentElement.classList.add('has-dialog');
    (focus ?? this.dialog.querySelector('[autofocus], h1, h2, button'))?.focus({ preventScroll: true });
  }

  close() {
    if (!this.dialog.open) return;
    this.dialog.close();
    if (!document.querySelector('dialog[open]')) document.documentElement.classList.remove('has-dialog');
    if (this.trigger?.isConnected) this.trigger.focus({ preventScroll: true });
    this.trigger = null;
  }
}
