var map = L.map('map').setView([37.8, -96], 4);

// Set the base map using Esri World Gray Canvas
var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(map);

// Fetch the polygon data (US States)
fetch('data/USStates.geojson')
    .then(response => response.json())  // Parse the response as JSON
    .then(statesData => {
        console.log('States Data:', statesData);

        // Add the GeoJSON data to the map with a default gray placeholder color
        L.geoJson(statesData, {
            style: {
                fillColor: '#f0f0f0', // Light gray placeholder
                weight: 1.2,  // Thin gray border
                opacity: 1,  // Full opacity for the border
                color: '#808080',  // Gray border color
                fillOpacity: 0.7  // Semi-transparent fill inside polygons
            }
        }).addTo(map);

        // Fetch and process the correctional facilities data
        fetch('data/2020US_corrections.geojson')
            .then(response => response.json())  // Parse the response as JSON
            .then(prisonData => {
                console.log('Prison Data:', prisonData);

                // Object to store correctional facility counts per state
                const statePointCounts = {};

                // Convert point data into a Turf.js feature collection
                const pointFeatures = prisonData.features.map(feature => 
                    turf.point([feature.geometry.coordinates[0], feature.geometry.coordinates[1]])
                );
                const pointCollection = turf.featureCollection(pointFeatures);

                // Loop through each state polygon and count points within using Turf.js
                statesData.features.forEach(function (state) {
                    const stateName = state.properties.NAME;
                    const statePolygon = turf.multiPolygon(state.geometry.coordinates); // Ensure it's a MultiPolygon
                    const pointsWithin = turf.pointsWithinPolygon(pointCollection, statePolygon);
                    statePointCounts[stateName] = pointsWithin.features.length;
                });

                // Function to style states based on the number of correctional facilities
                function style(feature) {
                    const stateName = feature.properties.NAME;
                    const facilityCount = statePointCounts[stateName] || 0;
                    return {
                        fillColor: getColor(facilityCount),  
                        weight: 0.5,  // Thin gray border
                        opacity: 1,  
                        color: '#808080',  // Gray border color
                        fillOpacity: 0.7  
                    };
                }

                // Function to determine color based on facility count
                function getColor(count) {
                    return count > 250 ? '#253494' :
                           count > 100 ? '#2c7fb8' :
                           count > 50  ? '#41b6c4' :
                           count > 25  ? '#a1dab4' :
                                         '#ffffcc';
                }

                // Add the GeoJSON data (states) with choropleth styling
                L.geoJson(statesData, {
                    style: style,
                    onEachFeature: function (feature, layer) {
                        // Add interactivity: popup on hover and click
                        layer.bindPopup(`<b>State:</b> ${feature.properties.NAME}<br><b>Facilities:</b> ${statePointCounts[feature.properties.NAME] || 0}`);
                        layer.on('mouseover', function (e) {
                            var layer = e.target;
                            layer.setStyle({
                                weight: 4,
                                color: '#666',
                                fillOpacity: 0.9
                            });
                            layer.bindTooltip(
                                `<b>${feature.properties.NAME}</b><br>Correctional Facilities: ${statePointCounts[feature.properties.NAME] || 0}`,
                                { permanent: false, direction: "top", offset: [0, -10] }
                            ).openTooltip();
                        });
                        layer.on('mouseout', function (e) {
                            var layer = e.target;
                            layer.setStyle({
                                weight: 0.5,
                                color: '#808080',
                                fillOpacity: 0.7
                            });
                            layer.closeTooltip();
                        });
                    }
                }).addTo(map);

                // Add legend
                var legend1 = L.control({ position: 'bottomleft' });

                legend1.onAdd = function (map) {
                 var div = L.DomUtil.create('div', 'legend1'); // Using legend1 class
                 var grades = [0, 25, 50, 100, 250];

                div.innerHTML = '<b>No. of Facilities</b><br>';

              for (var i = 0; i < grades.length; i++) {
                  div.innerHTML +=
               `<div style="display: flex; align-items: center; margin-bottom: 3px;">
                <i style="background:${getColor(grades[i] + 1)}; width: 20px; height: 20px; display: inline-block;"></i>
                <span style="margin-left: 8px;">${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] : '+'}</span>
                    </div>`;
              }

            return div;
            
        };

                legend1.addTo(map);

            })
            .catch(error => console.error('Error loading point data:', error));
    })
    .catch(error => console.error('Error loading polygon data:', error));
