// Coverage map: one pin per place, popup lists what goes out from there.
(() => {
  const el = document.getElementById('map');
  if (!el || !window.L) return;
  const places = JSON.parse(document.getElementById('map-data').textContent);
  const map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  const icon = L.divIcon({ className: 'pin', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
  const markers = places.map((p) => {
    const box = document.createElement('div');
    const h = document.createElement('strong');
    h.textContent = p.location;
    const ul = document.createElement('ul');
    for (const s of p.services) { const li = document.createElement('li'); li.textContent = s; ul.append(li); }
    box.append(h, ul);
    return L.marker(p.ll, { icon, title: p.location }).bindPopup(box).addTo(map);
  });
  // Start on WA, where most of the network is; interstate pins are a zoom-out away.
  const wa = markers.filter((m) => m.getLatLng().lng < 129);
  map.fitBounds(L.featureGroup(wa.length ? wa : markers).getBounds().pad(0.15));
})();
