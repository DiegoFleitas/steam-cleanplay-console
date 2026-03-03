const floatingButton = document.querySelector('.floating-button') as HTMLElement | null;
const modal = document.querySelector('.modal') as HTMLElement | null;
const closeButton = document.querySelector('.close-button') as HTMLElement | null;

let isFirstClick = true;

floatingButton?.addEventListener('click', () => {
  if (isFirstClick && modal) {
    modal.style.display = 'flex';
    isFirstClick = false;
  }
});

closeButton?.addEventListener('click', () => {
  if (modal) modal.style.display = 'none';
});

window.addEventListener('contextmenu', (event: Event) => {
  event.preventDefault();
  if (modal) modal.style.display = 'none';
  isFirstClick = true;
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
