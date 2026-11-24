// Behaviours kept out of index.html so the page needs no inline scripts
// (CSP script-src has no 'unsafe-inline').

export const formatStatusText = (text: string): string =>
  text.replace(/(?<!\n)#\s+/g, '\n# ').trim();

const initPasteFormatter = (): void => {
  const input = document.getElementById('input-players') as HTMLTextAreaElement | null;
  if (!input) return;

  input.addEventListener('paste', (event: ClipboardEvent) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    input.value = formatStatusText(text);
  });

  window.addEventListener('load', () => {
    input.value = formatStatusText(input.value);
  });
};

// Add blinking-cursor class to the DataTables search input once it exists.
const initSearchInputCaret = (): void => {
  document.addEventListener('DOMContentLoaded', () => {
    const interval = setInterval(() => {
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput) {
        searchInput.classList.add('blinking-cursor');
        setTimeout(() => (searchInput as HTMLElement).focus(), 0);
        clearInterval(interval);
      }
    }, 100);
  });
};

initPasteFormatter();
initSearchInputCaret();
