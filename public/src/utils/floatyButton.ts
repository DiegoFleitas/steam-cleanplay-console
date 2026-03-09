const floatingButton = document.querySelector('.floating-button') as HTMLElement | null;
const modal = document.querySelector('.modal') as HTMLElement | null;
const closeButton = document.querySelector('.close-button') as HTMLElement | null;

const openModal = () => {
  if (modal) modal.style.display = 'flex';
};

const closeModal = () => {
  if (modal) modal.style.display = 'none';
};

floatingButton?.addEventListener('click', () => {
  if (!modal) return;
  const isOpen = modal.style.display === 'flex';
  if (isOpen) {
    closeModal();
  } else {
    openModal();
  }
});

closeButton?.addEventListener('click', () => {
  closeModal();
});

// Close when right-clicking anywhere
window.addEventListener('contextmenu', (event: Event) => {
  event.preventDefault();
  closeModal();
});

// Close when clicking the dark backdrop (but not the content)
modal?.addEventListener('click', (event: MouseEvent) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Close on Escape key
window.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

const draggableButton = document.getElementById('draggable-button');

let isDragging = false;
let dragX = 0;
let dragY = 0;

draggableButton?.addEventListener('mousedown', (event: MouseEvent) => {
  isDragging = true;
  dragX = event.offsetX;
  dragY = event.offsetY;
});

draggableButton?.addEventListener('mouseup', () => {
  isDragging = false;
});

draggableButton?.addEventListener('mousemove', (event: MouseEvent) => {
  if (isDragging && draggableButton) {
    const x = event.clientX - dragX;
    const y = event.clientY - dragY;
    draggableButton.style.left = `${x}px`;
    draggableButton.style.top = `${y}px`;
  }
});
