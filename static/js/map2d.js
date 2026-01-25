// Leaflet map setup for Map2D page

document.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map2d');
    if (!mapElement) {
        console.warn('Map2D container not found.');
        return;
    }

    if (typeof L === 'undefined') {
        console.error('Leaflet failed to load. Check network access to unpkg.com.');
        return;
    }

    console.log('Initializing Map2D...');

    const initialView = { coords: [20, 0], zoom: 2.25 };

    const map = L.map(mapElement, {
        scrollWheelZoom: true,
        worldCopyJump: true,
        zoomControl: true,
        attributionControl: true
    }).setView(initialView.coords, initialView.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.control.scale().addTo(map);

    // Titiler COG layer configuration
    const titilerBase = window.TITILER_BASE || 'http://localhost:8000';
    // Prefer a public HTTP prefix if provided, else use local container mount
    const httpPrefix = window.COG_HTTP_PREFIX || '';
    const localPrefix = window.COG_LOCAL_PATH_PREFIX || '/data';
    
    let rasterLayer = null;

    function loadRasterLayer(variable) {
        // Remove old layer if exists
        if (rasterLayer) {
            map.removeLayer(rasterLayer);
        }

        // Build COG path for Titiler: public HTTP URL if available, else local mount path
        const cogUrl = httpPrefix
            ? `${httpPrefix}/${variable}.tif`
            : `${localPrefix}/${variable}.tif`;
        // Rescale from data range (-1.5 to +1.5) to 0-255 for visualization
        // nodata=0 makes pixels with value 0 fully transparent
        const tileUrl = `${titilerBase}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}@1x.png?url=${encodeURIComponent(cogUrl)}&rescale=-1.5,1.5&colormap_name=viridis&nodata=0&return_mask=true`;

        rasterLayer = L.tileLayer(tileUrl, {
            tileSize: 256,
            opacity: 0.8,
            crossOrigin: true,
            attribution: `COG: ${variable} via Titiler`,
            zIndex: 50
        });

        rasterLayer.on('tileerror', (e) => {
            console.warn(`Raster tile error for ${variable}:`, e);
        });

        rasterLayer.addTo(map);
        console.log(`Loaded raster layer: ${variable}`);
    }

    // Variable selector event listener
    const variableSelector = document.getElementById('variable-selector');
    if (variableSelector) {
        variableSelector.addEventListener('change', (e) => {
            loadRasterLayer(e.target.value);
        });
        
        // Load initial variable
        loadRasterLayer(variableSelector.value);
    }

    // Opacity slider event listener
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value) / 100;
            opacityValue.textContent = e.target.value;
            if (rasterLayer) {
                rasterLayer.setOpacity(opacity);
            }
        });
    }

    const markers = L.layerGroup().addTo(map);

    function placeMarker(latlng) {
        markers.clearLayers();
        L.marker(latlng)
            .addTo(markers)
            .bindPopup(`Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`)
            .openPopup();
    }

    map.on('click', (event) => {
        placeMarker(event.latlng);
    });

    // Simple reset control
    const resetControl = L.control({ position: 'topright' });
    resetControl.onAdd = function () {
        const button = L.DomUtil.create('button', 'map-reset-btn');
        button.type = 'button';
        button.title = 'Reset view';
        button.textContent = 'Reset view';

        L.DomEvent.on(button, 'click', (ev) => {
            L.DomEvent.stopPropagation(ev);
            map.setView(initialView.coords, initialView.zoom);
            markers.clearLayers();
        });

        return button;
    };
    resetControl.addTo(map);

    // Invalidate size after render to avoid blank tiles when hidden/first load
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    console.log('Map2D ready.');
});
