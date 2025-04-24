let map;

function addMap(latitude, longitude, city) {
  if (map) {
    map.remove();
  }

  map = L.map('map').setView([latitude, longitude], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.marker([latitude, longitude]).addTo(map)
    .bindPopup(`<b>${city}</b><br>Latitude: ${latitude}<br>Longitude: ${longitude}`)
    .openPopup();
}
