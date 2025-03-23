//define access token
mapboxgl.accessToken = "pk.eyJ1IjoiYW9jaHJpc3Rlc2VuIiwiYSI6ImNtNzVzM3ozNzAxMzMycnB1Ymswd3pxdmgifQ.OXmeKBE7RZ3VT88AiV93Nw";

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-79.39, 43.65], 
    zoom: 11
});

map.on('load', () => 
    // Fetch collision data
   fetch('https://yourusername.github.io/repo-name/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(data => {
        console.log('GeoJSON Loaded:', data);
        // Use the data in your map
    })
    .catch(error => console.error('Error loading GeoJSON:', error)));

        // Add collision points to the map
        map.addSource('collisions', {
            type: 'geojson',
            data: collision_data
        });

        map.addLayer({
            id: 'collision-points',
            type: 'circle',
            source: 'collisions',
            paint: {
                'circle-radius': 5,
                'circle-color': '#FF0000'
            }
        });

        // Compute bounding box & hex grid
        const bbox = turf.bbox(collision_data);
        const hexGrid = turf.hexGrid(bbox, 0.5, { units: 'kilometers' });

        // Count collisions in each hex
        hexGrid.features.forEach(hex => {
            let count = turf.pointsWithinPolygon(collision_data, hex).features.length;
            hex.properties.collision_count = count;
        });

        // Define color scale
        function getColor(count) {
            return count > 20 ? '#800026' :
                count > 15 ? '#BD0026' :
                count > 10 ? '#E31A1C' :
                count > 5  ? '#FC4E2A' :
                count > 2  ? '#FD8D3C' :
                count > 0  ? '#FEB24C' :
                '#FFFFFF';
        }

        // Assign colors to hexes
        hexGrid.features.forEach(hex => {
            hex.properties.fill = getColor(hex.properties.collision_count);
        });

        // Add hex grid to the map
        map.addSource('hex-grid', {
            type: 'geojson',
            data: hexGrid
        });

        map.addLayer({
            id: 'hex-layer',
            type: 'fill',
            source: 'hex-grid',
            paint: {
                'fill-color': ['get', 'fill'],
                'fill-opacity': 0.6,
                'fill-outline-color': '#000000'
            }
        });

        // Add Popup on Click
        map.on('click', 'hex-layer', (e) => {
            const count = e.features[0].properties.collision_count;
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>Collisions:</strong> ${count}`)
                .addTo(map);
        });

        // Change cursor to pointer when hovering over a hex
        map.on('mouseenter', 'hex-layer', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'hex-layer', () => {
            map.getCanvas().style.cursor = '';
        });
    })
    .catch(error => console.error("Error loading GeoJSON:", error)));
