// 1. Танзимоти асосии харита
const map = L.map('map', {
    attributionControl: false,
    minZoom: 2,
    maxZoom: 12,
    maxBounds: [[-85, -180], [85, 180]],
    worldCopyJump: false
}).setView([30, 20], 3);

// 2. Қабати харита (Light Theme)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    noWrap: true
}).addTo(map);

const searchMarkers = L.layerGroup().addTo(map);
const slider = document.getElementById('time-slider');
const bubble = document.getElementById('year-bubble');
let geojsonLayer;

// 3. БАЗАИ МАЪЛУМОТИ ТАЪРИХӢ
// Соли пайдоиши давлатҳои нав ё мустақил
const countryHistory = {
    // Собиқ СССР (1991)
    "Tajikistan": 1991, "Uzbekistan": 1991, "Kazakhstan": 1991, "Kyrgyzstan": 1991,
    "Turkmenistan": 1991, "Russia": 1991, "Ukraine": 1991, "Belarus": 1991,
    "Moldova": 1991, "Armenia": 1991, "Azerbaijan": 1991, "Georgia": 1991,
    "Estonia": 1991, "Latvia": 1991, "Lithuania": 1991,

    // Югославияи собиқ ва Аврупо
    "Slovakia": 1993, "Czech Rep.": 1993, "Slovenia": 1991, "Croatia": 1991,
    "Bosnia and Herz.": 1992, "North Macedonia": 1991, "Serbia": 2006,
    "Montenegro": 2006, "Kosovo": 2008,

    // Осиё ва Африқо (истиқлолият пас аз соли 1940)
    "South Sudan": 2011, "Eritrea": 1993, "Namibia": 1990, "Israel": 1948,
    "India": 1947, "Pakistan": 1947, "Bangladesh": 1971, "Vietnam": 1945,
    "Indonesia": 1945, "Philippines": 1946, "Jordan": 1946, "Libya": 1951,
    "Morocco": 1956, "Tunisia": 1956, "Ghana": 1957, "Guinea": 1958,
    "Nigeria": 1960, "Somalia": 1960, "Congo": 1960, "Cyprus": 1960,
    "Algeria": 1962, "Jamaica": 1962, "Kenya": 1963, "Malaysia": 1957,
    "Singapore": 1965, "Guyana": 1966, "Botswana": 1966, "Angola": 1975,
    "Mozambique": 1975, "Suriname": 1975, "Papua New Guinea": 1975,
    "Belize": 1981, "Timor-Leste": 2002
};

// Рӯйхати ҷумҳуриҳои Шӯравӣ
const ussrList = ["Tajikistan", "Uzbekistan", "Kazakhstan", "Kyrgyzstan", "Turkmenistan", "Russia", "Ukraine", "Belarus", "Moldova", "Armenia", "Azerbaijan", "Georgia", "Estonia", "Latvia", "Lithuania"];

// 4. Рангҳо
function getCountryStyle(name) {
    const specialColors = {
        "Tajikistan": "#ff0000", "Kyrgyzstan": "#0000ff", "Uzbekistan": "#27ae60",
        "Russia": "#9b59b6", "Kazakhstan": "#f1c40f", "USSR": "#cc0000"
    };
    if (specialColors[name]) return specialColors[name];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 60%, 70%)`;
}

// 5. Функсияи боргузорӣ ва Филтри таърихӣ
async function loadMapData(year) {
    if (geojsonLayer) map.removeLayer(geojsonLayer);

    const response = await fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson');
    const data = await response.json();

    geojsonLayer = L.geoJson(data, {
        filter: function(feature) {
            const name = feature.properties.name;
            const birthYear = countryHistory[name];

            // Мантиқ: Агар давлат то ин сол вуҷуд надошт ва қисми СССР ҳам набуд - нишон надеҳ
            if (birthYear && year < birthYear) {
                if (year < 1991 && ussrList.includes(name)) return true; // Нишон додани СССР
                return false; // Пинҳон кардани давлатҳои дигар
            }
            return true;
        },
        style: function(feature) {
            let name = feature.properties.name;
            if (year < 1991 && ussrList.includes(name)) name = "USSR";

            return {
                fillColor: getCountryStyle(name),
                weight: 1,
                color: '#666',
                fillOpacity: 0.6
            };
        },
        onEachFeature: function(feature, layer) {
            let name = feature.properties.name;
            if (year < 1991 && ussrList.includes(name)) name = "Иттиҳоди Шӯравӣ (СССР)";

            layer.bindTooltip(name, { sticky: true });

            layer.on('mouseover', function (e) {
                e.target.setStyle({ weight: 3, color: '#000', fillOpacity: 0.8 });
                e.target.bringToFront();
            });

            layer.on('mouseout', function (e) {
                geojsonLayer.resetStyle(e.target);
            });

            layer.on('click', function (e) {
                map.fitBounds(e.target.getBounds());
            });
        }
    }).addTo(map);
}

// 6. Ҷустуҷӯ
async function searchCountry() {
    const query = document.getElementById('country-search').value;
    if (!query) return;

    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const data = await res.json();

    if (data.length > 0) {
        searchMarkers.clearLayers();
        map.flyTo([data[0].lat, data[0].lon], 5);
        L.marker([data[0].lat, data[0].lon]).addTo(searchMarkers).bindPopup(query).openPopup();
    }
}

// 7. Слайдер
slider.oninput = function() {
    const val = this.value;
    bubble.innerText = val;
    const percent = (val - this.min) / (this.max - this.min);
    bubble.style.left = `calc(${percent * 100}% + (${10 - percent * 20}px))`;
};

slider.onchange = function() {
    loadMapData(this.value);
};

// Оғози харита дар соли ҷорӣ
loadMapData(2026);