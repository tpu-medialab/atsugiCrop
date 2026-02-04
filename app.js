const DATA_BASE_URL = "./data";

const DATASET_CONFIG = {
  shelter: { dir: "shelter", suffix: "避難施設" },
  landmark: { dir: "landmark", suffix: "ランドマーク" },
  station: { dir: "station", suffix: "鉄道駅" },
  emergency_route: { dir: "emergency_route", suffix: "緊急輸送道路" },
  railway: { dir: "railway", suffix: "鉄道" },
  park: { dir: "park", suffix: "公園" },
  border: { dir: "border", suffix: "行政界" },
};

const hashStringToHue = (str) => {
  if (!str) return 210;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

const createTownColorFn = () => {
  const cache = new Map();
  const getColor = (name) => {
    if (!name) return "#CBD5F5";
    if (cache.has(name)) return cache.get(name);
    const hue = hashStringToHue(name);
    const color = `hsl(${hue}, 65%, 70%)`;
    cache.set(name, color);
    return color;
  };
  return getColor;
};

const createStyleFn = (getTownColor, selectedTown) => (feature) => {
  const town = feature.getProperty("TOWN") || "";
  const selected = !selectedTown || town === selectedTown;
  const baseColor = getTownColor(town);

  return {
    visible: selected,
    fillColor: baseColor,
    fillOpacity: selected ? 0.5 : 0.1,
    strokeColor: "#475569",
    strokeWeight: selected ? 2 : 1,
  };
};

const populateTownSelect = (features, selectElement) => {
  const townSet = features.reduce((acc, feature) => {
    const town = feature.getProperty("TOWN");
    if (town) acc.add(town);
    return acc;
  }, new Set());

  Array.from(townSet)
    .sort()
    .forEach((town) => {
      const option = document.createElement("option");
      option.value = town;
      option.textContent = town;
      selectElement.appendChild(option);
    });
};

const setCurrentTownLabel = (townName) => {
  const label = document.getElementById("current-town");
  if (!label) return;
  label.textContent = townName || "なし";
};

const getCurrentTownFromDom = () => {
  const label = document.getElementById("current-town");
  if (!label) return null;
  const text = label.textContent.trim();
  if (!text || text === "なし") return null;
  return text;
};

const fitBoundsToTown = (map, selectedTown) => {
  if (!selectedTown) return;
  const bounds = new google.maps.LatLngBounds();

  map.data.forEach((feature) => {
    const town = feature.getProperty("TOWN") || "";
    if (town === selectedTown) {
      feature.getGeometry().forEachLatLng((latlng) => {
        bounds.extend(latlng);
      });
    }
  });

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds);
  }
};

const getSelectedDatasetKeys = () => {
  const nodes = document.querySelectorAll(".dataset-checkbox:checked");
  return Array.from(nodes).map((el) => el.value);
};


const buildDownloadUrl = (datasetKey, townName) => {
  const cfg = DATASET_CONFIG[datasetKey];
  if (!cfg) return null;
  
  const encodedTown = encodeURIComponent(townName);
  
  return `${DATA_BASE_URL}/${cfg.dir}/${cfg.dir}_${encodedTown}.geojson`;
};
const triggerDownload = (url, fileName) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const checkFileExists = async (url) => {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch (e) {
    return false;
  }
};

const setupDownloadButton = () => {
  const button = document.getElementById("downloadButton");
  if (!button) return;

  button.addEventListener("click", async () => {
    const town = getCurrentTownFromDom();
    const datasetKeys = getSelectedDatasetKeys();

    if (!town) {
      alert("町を選択してください。");
      return;
    }

    if (datasetKeys.length === 0) {
      alert("ダウンロードする項目を選択してください。");
      return;
    }

    const existingItems = [];

    for (const key of datasetKeys) {
      const url = buildDownloadUrl(key, town);
      if (!url) continue;
      const ok = await checkFileExists(url);
      if (ok) {
        existingItems.push({ key, url });
      }
    }

    if (existingItems.length === 0) {
      alert("選択中の町に該当項目はありません。");
      return;
    }

    existingItems.forEach(({ key, url }) => {
      const cfg = DATASET_CONFIG[key] || {};
      const suffix = cfg.suffix || key;
      const fileName = `${town}_${suffix}.geojson`;
      triggerDownload(url, fileName);
    });
  });
};

const createApp = ({
  geoJsonUrl,
  mapElementId,
  townSelectId,
  currentTownLabelSetter,
}) => {
  const getTownColor = createTownColorFn();

  const initDataLayer = (map, onLoaded) => {
    map.data.loadGeoJson(geoJsonUrl, {}, (features) => {
      const bounds = new google.maps.LatLngBounds();

      features.forEach((feature) => {
        feature.getGeometry().forEachLatLng((latlng) => {
          bounds.extend(latlng);
        });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }

      onLoaded(features);
    });
  };

  const attachDataEvents = (map) => {
    const infoWindow = new google.maps.InfoWindow();

    map.data.addListener("mouseover", (event) => {
      map.data.revertStyle();
      map.data.overrideStyle(event.feature, {
        strokeWeight: 3,
        fillOpacity: 0.7,
      });
    });

    map.data.addListener("mouseout", () => {
      map.data.revertStyle();
    });

    map.data.addListener("click", (event) => {
      const town =
        event.feature.getProperty("TOWN") ||
        event.feature.getProperty("N03_003") ||
        event.feature.getProperty("name") ||
        "不明";

      currentTownLabelSetter(town);

      infoWindow.setContent(`<div class="text-sm font-semibold">${town}</div>`);
      infoWindow.setPosition(event.latLng);
      infoWindow.open(map);
    });
  };

  const applyTownFilter = (map, selectedTown) => {
    const styleFn = createStyleFn(getTownColor, selectedTown);
    map.data.setStyle(styleFn);
    fitBoundsToTown(map, selectedTown);
  };

  const init = () => {
    const mapElement = document.getElementById(mapElementId);
    const townSelect = document.getElementById(townSelectId);

    if (!mapElement || !townSelect) {
      console.error("必要なDOM要素が見つかりません");
      return;
    }

    const map = new google.maps.Map(mapElement, {
      center: { lat: 35.443, lng: 139.36 },
      zoom: 21.0,
    });

    attachDataEvents(map);

    initDataLayer(map, (features) => {
      populateTownSelect(features, townSelect);
      applyTownFilter(map, "");
    });

    townSelect.addEventListener("change", (event) => {
      const selectedTown = event.target.value;
      applyTownFilter(map, selectedTown);
    });

    setupDownloadButton();
  };

  return { init };
};

window.initMap = () => {
  const app = createApp({
    geoJsonUrl: "townInfo.geojson",
    mapElementId: "map",
    townSelectId: "townSelect",
    currentTownLabelSetter: setCurrentTownLabel,
  });

  app.init();
};
