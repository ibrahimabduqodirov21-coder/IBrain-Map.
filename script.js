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
// ----- ТЕСТЫ -----
const quizData = [
    {
        q: "Какая из стран мира самая большая по площади?",
        options: ["Канада", "США", "Россия"],
        correct: 2
    },
    {
        q: "В какой стране живет больше всего людей?",
        options: ["В США", "В Китае", "В России"],
        correct: 1
    },
    {
        q: "Какое географическое положение считается более выгодным?",
        options: ["С выходом к Океану", "Внутри материка", "Быть отдельным островом"],
        correct: 0
    },
    {
        q: "Каких стран сейчас большинство?",
        options: ["Республик", "Монархий", "Их одинаковое количество"],
        correct: 0
    },
    {
        q: "На чём основана аграрная экономика?",
        options: ["На развитии промышленности", "На развитии транспорта", "На сельском хозяйстве"],
        correct: 2
    },
    {
        q: "Как называется соотношение отраслей?",
        options: ["Структура хозяйства", "Экономический баланс", "Равная экономика"],
        correct: 0
    },
    {
        q: "Правильная последовательность развития экономики:",
        options: [
            "Аграрная → постиндустриальная → индустриальная",
            "Постиндустриальная → индустриальная → аграрная",
            "Аграрная → индустриальная → постиндустриальная"
        ],
        correct: 2
    },
    {
        q: "Что преобладает в наиболее развитых странах?",
        options: ["Сельское хозяйство", "Услуги", "Заводы"],
        correct: 1
    },
    {
        q: "В каких странах основу экономики составляет сельское хозяйство?",
        options: ["В бедных", "В развитых", "Во всех"],
        correct: 0
    },
    {
        q: "От чего зависит богатство страны?",
        options: ["От населения", "От производства товаров и услуг"],
        correct: 1
    }
];

let index = 0;

const quizBox = document.getElementById("quiz-box");
const questionEl = document.getElementById("quiz-question");
const optionsEl = document.getElementById("quiz-options");

document.getElementById("start-test").onclick = () => {
    index = 0;
    quizBox.classList.remove("hidden");
    loadQuestion();
};

document.getElementById("close-quiz").onclick = () => {
    quizBox.classList.add("hidden");
};

function loadQuestion() {
    const q = quizData[index];
    questionEl.innerText = q.q;

    optionsEl.innerHTML = "";

    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.style.display = "block";
        btn.style.width = "100%";
        btn.style.margin = "5px 0";
        btn.style.padding = "10px";
        btn.style.borderRadius = "8px";
        btn.style.border = "1px solid #444";
        btn.style.background = "#f0f0f0";

        btn.onclick = () => checkAnswer(i, btn);

        optionsEl.appendChild(btn);
    });
}

function checkAnswer(i, btn) {
    const correct = quizData[index].correct;
    const allButtons = optionsEl.querySelectorAll("button");

    // МАНЪИ БОРИ ДУЮМИ ЗАДАН
    allButtons.forEach(b => b.disabled = true);

    if (i === correct) {
        btn.style.background = "#4CAF50"; // САБЗ
        btn.style.color = "white";
    } else {
        btn.style.background = "#ff3b3b"; // СУРХ
        btn.style.color = "white";

        // Ҷавоби дуруст → САБЗ
        allButtons[correct].style.background = "#4CAF50";
        allButtons[correct].style.color = "white";
    }

    // Баъди 1.5 секунд саволи нав
    setTimeout(() => {
        index++;
        if (index >= quizData.length) {
            questionEl.innerText = "Тест закончен!";
            optionsEl.innerHTML = "";
        } else {
            loadQuestion();
        }
    }, 1500);
}
// ----- ТЕСТЫ ИСТОРИЯ -----
const historyQuizData = [
    { q: "В каком году распался СССР?", options: ["1989", "1991", "1993"], correct: 1 },
    { q: "Какая страна стала независимой в 1991 году?", options: ["Таджикистан", "Вьетнам", "Гана"], correct: 0 },
    { q: "Когда была провозглашена независимость Индии?", options: ["1947", "1950", "1945"], correct: 0 },
    { q: "В каком году образовалась Литва после распада СССР?", options: ["1990", "1991", "1992"], correct: 0 },
    { q: "Какой год считается концом Второй мировой войны?", options: ["1945", "1944", "1946"], correct: 0 },
    { q: "В каком году Югославия разделилась на независимые государства?", options: ["1990-1992", "1989-1991", "1995-1997"], correct: 0 },
    { q: "Какая африканская страна стала независимой в 1960 году?", options: ["Нигерия", "Египет", "Тунис"], correct: 0 },
    { q: "В каком году была образована Республика Косово?", options: ["2008", "2006", "2004"], correct: 0 },
    { q: "Когда была провозглашена независимость Южного Судана?", options: ["2011", "2009", "2013"], correct: 0 },
    { q: "Какая страна объявила независимость от Великобритании в 1948 году?", options: ["Израиль", "Пакистан", "Индия"], correct: 0 }
];

let historyIndex = 0;

const historyBtn = document.getElementById("start-history-test");

historyBtn.onclick = () => {
    historyIndex = 0;
    quizBox.classList.remove("hidden");
    loadHistoryQuestion();
};

function loadHistoryQuestion() {
    const q = historyQuizData[historyIndex];
    questionEl.innerText = q.q;

    optionsEl.innerHTML = "";

    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.style.display = "block";
        btn.style.width = "100%";
        btn.style.margin = "5px 0";
        btn.style.padding = "10px";
        btn.style.borderRadius = "8px";
        btn.style.border = "1px solid #444";
        btn.style.background = "#f0f0f0";

        btn.onclick = () => checkHistoryAnswer(i, btn);

        optionsEl.appendChild(btn);
    });
}

function checkHistoryAnswer(i, btn) {
    const correct = historyQuizData[historyIndex].correct;
    const allButtons = optionsEl.querySelectorAll("button");

    // блокируем все кнопки
    allButtons.forEach(b => b.disabled = true);

    if (i === correct) {
        btn.style.background = "#4CAF50"; // зеленый
        btn.style.color = "white";
    } else {
        btn.style.background = "#ff3b3b"; // красный
        btn.style.color = "white";

        // показываем правильный ответ
        allButtons[correct].style.background = "#4CAF50";
        allButtons[correct].style.color = "white";
    }

    setTimeout(() => {
        historyIndex++;
        if (historyIndex >= historyQuizData.length) {
            questionEl.innerText = "Тест закончен!";
            optionsEl.innerHTML = "";
        } else {
            loadHistoryQuestion();
        }
    }, 1500);
}
