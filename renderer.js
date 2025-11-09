const input = {
  country: document.getElementById("countryInput"),
  tripName: document.getElementById("tripName"),
  tripCountry: document.getElementById("tripCountry"),
  tripDate: document.getElementById("tripDate"),
  tripNote: document.getElementById("tripNote")
};
const btn = {
  search: document.getElementById("searchBtn"),
  clear: document.getElementById("clearBtn"),
  addTrip: document.getElementById("addTripBtn")
};
const ui = {
  status: document.getElementById("statusBar"),
  history: document.getElementById("history"),
  info: document.getElementById("countryInfo"),
  tripList: document.getElementById("tripList"),
  filePath: document.getElementById("filePath")
};

let editingIndex = null;

const Country = {
  async fetchInfo(name) {
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${name}`);
      const data = await res.json();
      if (!data || !data[0]) throw new Error("Country not found");
      const c = data[0];
      return {
        name: c.name.common,
        capital: c.capital?.[0] || "-",
        region: c.region,
        subregion: c.subregion,
        timezone: c.timezones?.[0] || "-",
        population: c.population,
        area: c.area,
        currencies: Object.values(c.currencies || {}).map(cur => cur.name).join(", "),
        languages: Object.values(c.languages || {}).join(", "),
        map: c.maps.googleMaps,
        flag: c.flags.png,
        coat: c.coatOfArms?.png || null
      };
    } catch {
      return null;
    }
  },
  renderCard(data) {
    ui.info.innerHTML = `
      <div class="country-card">
        <div class="flag-row">
          <img src="${data.flag}" alt="Flag of ${data.name}" />
          ${data.coat ? `<img src="${data.coat}" alt="Coat of Arms" style="width:100px;height:auto;">` : ""}
        </div>
        <h3>${data.name}</h3>
        <div class="info-grid">
          <div><strong>Capital:</strong> ${data.capital}</div>
          <div><strong>Region:</strong> ${data.region}</div>
          <div><strong>Subregion:</strong> ${data.subregion}</div>
          <div><strong>Timezone:</strong> ${data.timezone}</div>
          <div><strong>Languages:</strong> ${data.languages}</div>
          <div><strong>Currencies:</strong> ${data.currencies}</div>
          <div><strong>Area:</strong> ${data.area.toLocaleString()} km²</div>
          <div><strong>Population:</strong> ${data.population.toLocaleString()}</div>
          <div><a href="${data.map}" target="_blank">View on Google Maps</a></div>
        </div><br>
        <div class="actions">
          <button onclick="addTripHandler('${data.name}')">Add to Itinerary</button>
        </div>
      </div>
    `;
  }
};

function showStatus(msg) {
  ui.status.textContent = msg;
}
function userSuccess(msg) {
  alert("✅ " + msg);
  showStatus(msg);
}
function userFail(msg) {
  alert("❌ " + msg);
  showStatus(msg);
}

function updateHistory(name) {
  const maxHistory = 10;
  const btn = document.createElement("button");
  btn.textContent = name;
  btn.onclick = () => searchCountry(name);
  ui.history.prepend(btn);
  const allButtons = ui.history.querySelectorAll("button");
  if (allButtons.length > maxHistory) {
    allButtons[allButtons.length - 1].remove();
  }
}

async function searchCountry(name) {
  showStatus("Searching...");
  const data = await Country.fetchInfo(name);
  if (!data) return userFail("Country not found.");
  Country.renderCard(data);
  updateHistory(data.name);
  showStatus("Search complete.");
}

btn.search.onclick = () => {
  const name = input.country.value.trim();
  if (!name) return userFail("Please enter a country name.");
  searchCountry(name);
};
btn.clear.onclick = () => {
  input.country.value = "";
  ui.info.innerHTML = "";
  showStatus("Cleared.");
};

function addTripHandler(name) {
  input.tripCountry.value = name;
  input.tripName.value = `Trip to ${name}`;
  input.tripDate.value = "";
  input.tripNote.value = "";
  editingIndex = null;
  document.querySelector('[data-target="itinerarySection"]').click();
  input.tripDate.focus();
  showStatus(`Ready to add trip for ${name}. Please enter a date.`);
}

input.tripName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btn.addTrip.click();
});

function displayTrips() {
  const trips = window.storage.readData();
  ui.tripList.innerHTML = "";
  trips.forEach((trip, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="trip-flag">
        <img src="${trip.flag}" alt="Flag" />
        ${trip.coat ? `<img src="${trip.coat}" alt="Coat of Arms">` : ""}
      </div>
      <div class="trip-body">
        <div class="trip-title">${trip.title}</div>
        <div class="info-grid">
          <div><strong>Country:</strong> ${trip.country}</div>
          <div><strong>Date:</strong> ${trip.date}</div>
          <div><strong>Note:</strong> ${trip.note || "-"}</div>
          <div><strong>Capital:</strong> ${trip.capital}</div>
          <div><strong>Region:</strong> ${trip.region}</div>
          <div><strong>Subregion:</strong> ${trip.subregion}</div>
          <div><strong>Timezone:</strong> ${trip.timezone}</div>
          <div><strong>Languages:</strong> ${trip.languages}</div>
          <div><strong>Currencies:</strong> ${trip.currencies}</div>
          <div><strong>Area:</strong> ${trip.area.toLocaleString()} km²</div>
          <div><strong>Population:</strong> ${trip.population.toLocaleString()}</div>
          <div><a href="${trip.map}" target="_blank">View Map</a></div>
        </div>
      </div>
      <div class="trip-controls">
        <button class="edit" onclick="updateTrip(${i})">Edit</button>
        <button class="delete" onclick="deleteTrip(${i})">Delete</button>
      </div>
    `;
    ui.tripList.appendChild(li);
  });
}

function updateTrip(index) {
  const trip = window.storage.readData()[index];
  document.getElementById("editTitle").value = trip.title;
  document.getElementById("editDate").value = trip.date;
  document.getElementById("editNote").value = trip.note;
  editingIndex = index;
  document.getElementById("editModal").style.display = "flex";
}

function confirmEdit() {
  const title = document.getElementById("editTitle").value.trim();
  const date = document.getElementById("editDate").value.trim();
  const note = document.getElementById("editNote").value.trim();
  if (!title || !date) return userFail("Please enter title and date.");

  const trips = window.storage.readData();
  const old = trips[editingIndex];
  trips[editingIndex] = { ...old, title, date, note };
  editingIndex = null;
  document.getElementById("editModal").style.display = "none";

  const result = window.storage.saveData(trips);
  if (result.success) {
    userSuccess("Trip updated.");
    displayTrips();
  } else {
    userFail("Failed to update trip.");
  }
}

function closeModal() {
  document.getElementById("editModal").style.display = "none";
  editingIndex = null;
}

function deleteTrip(index) {
  if (!confirm("Delete this trip?")) return;

  const trips = window.storage.readData();
  trips.splice(index, 1); // delete trip by their index
  const result = window.storage.saveData(trips);

  if (result.success) {
    userSuccess("Trip deleted.");
    displayTrips(); // refresh trip list
  } else {
    userFail("Failed to delete trip.");
  }
}

async function saveTrip() {
  const title = input.tripName.value.trim();
  const country = input.tripCountry.value.trim();
  const date = input.tripDate.value.trim();
  const note = input.tripNote.value.trim();
  if (!title || !country || !date) return userFail("Please enter trip title, country, and date.");

  const info = await Country.fetchInfo(country);
  if (!info) return userFail("Country not found.");
  const trip = { title, country, date, note, ...info };
  const trips = window.storage.readData();
  trips.push(trip);
  const result = window.storage.saveData(trips);
  if (result.success) {
    userSuccess("Trip added.");
    input.tripName.value = "";
    input.tripCountry.value = "";
    input.tripDate.value = "";
    input.tripNote.value = "";
    displayTrips();
  } else {
    userFail("Failed to save trip.");
}
}

// hide all section
document.querySelectorAll(".section").forEach(s => s.style.display = "none");

// display landing for the first page
document.getElementById("landingSection").style.display = "block";
document.body.classList.add("landing-bg"); // to active background image

// navigation to change background to different section
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    const target = btn.dataset.target;
    document.getElementById(target).style.display = "block";

    // change background of different section
    if (target === "landingSection") {
      document.body.classList.add("landing-bg");
    } else {
      document.body.classList.remove("landing-bg");
    }
  };
});

ui.filePath.textContent = window.storage.path;
displayTrips();
btn.addTrip.onclick = saveTrip;