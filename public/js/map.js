function initializeMap(apikey, coordinates = [75.3433, 19.8762]) {
    const map = L.map('map').setView([coordinates[1], coordinates[0]], 12); // [lat, lng]

    L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${apikey}`, {
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>'
    }).addTo(map);

    const marker = L.marker([coordinates[1], coordinates[0]]).addTo(map);

    marker.bindPopup(`<h3>${listingLocation }</h3><p>Exact location will be provided after Booking</p>`).openPopup();
}
