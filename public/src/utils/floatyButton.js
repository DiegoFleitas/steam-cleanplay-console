const floatingButton = document.querySelector(".floating-button");
const modal = document.querySelector(".modal");
const closeButton = document.querySelector(".close-button");
const textArea = document.querySelector("#text");

let isFirstClick = true;

floatingButton.addEventListener("click", () => {
  if (isFirstClick) {
    modal.style.display = "flex";
    isFirstClick = false;
  }
});

closeButton.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  modal.style.display = "none";
  isFirstClick = true;
});

const draggableButton = document.getElementById("draggable-button");

let isDragging = false;
let dragX = 0;
let dragY = 0;

draggableButton.addEventListener("mousedown", (event) => {
  isDragging = true;
  dragX = event.offsetX;
  dragY = event.offsetY;
});

draggableButton.addEventListener("mouseup", () => {
  isDragging = false;
});

draggableButton.addEventListener("mousemove", (event) => {
  if (isDragging) {
    const x = event.clientX - dragX;
    const y = event.clientY - dragY;
    draggableButton.style.left = `${x}px`;
    draggableButton.style.top = `${y}px`;
  }
});
