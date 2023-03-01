const form = document.getElementById("movie-form");

form.addEventListener("submit", (event) => {
  event.preventDefault(); // Prevent the form from submitting normally

  console.log(event.target);
  const formData = new FormData(event.target);

  const data = Object.fromEntries(formData.entries());
  console.log(data);

  fetch("/api/poster", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((response) => {
      console.log(response);
      const errorMessage = document.getElementById("error-message");
      const resultMessage = document.getElementById("result-message");
      if (response.error) {
        errorMessage.innerHTML = response.error;
        errorMessage.style.display = "";
        resultMessage.style.display = "none";
      } else {
        resultMessage.innerHTML = `${response.message} ${JSON.stringify(
          response
        )}`;
        resultMessage.style.display = "";
        errorMessage.style.display = "none";
        rebuildTable(data.title, data.year, response);
      }
    })
    .catch((error) => console.error(error));
});

function rebuildTable(title, year, data) {
  const id = `${title.toLowerCase().replace(/ /g, "-")}-${year}`;
  const row =
    document.querySelector(`tr[data-id="${id}"]`) ||
    document.createElement("tr");
  row.setAttribute("data-id", id);

  let [tdTitle, tdYear, tdImg] = [...row.children];
  if (!tdTitle) tdTitle = document.createElement("td");
  if (!tdYear) tdYear = document.createElement("td");
  if (!tdImg) tdImg = document.createElement("td");

  tdTitle.textContent = title;
  tdYear.textContent = year;
  if (data.poster)
    tdImg.innerHTML = `<img class="poster" src="${data.poster}" />`;

  if (!row.parentNode) document.querySelector("tbody").appendChild(row);
  if (!row.parentNode && !tdStreaming.textContent) return;
  row.innerHTML = "";
  [tdTitle, tdYear, tdImg].forEach((td) => row.appendChild(td));
}
