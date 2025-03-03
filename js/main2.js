var map2 = L.map('map2').setView([52.707309, -112.862840], 3.25);

// Set the base map using Esri World Gray Canvas
var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(map2);

// Fetch the state prison population data
fetch('data/state_prison_pop.geojson')
    .then(response => response.json())
    .then(prisonData => {
        console.log('State Prison Population Data:', prisonData);

        // Function to calculate prison population rate per 100,000 residents
        function getPrisonRate(feature) {
            const totalPop = feature.properties.POPULATION || 1; // Avoid division by zero
            const prisonPop = feature.properties.TOT_POP || 0;
            return Math.round((prisonPop / totalPop) * 100000); // Round to the nearest whole number
        }

        // Function to style states based on prison population rate
        function style(feature) {
            const rate = getPrisonRate(feature);
            return {
                fillColor: getColor(rate),  
                weight: 0.7,  // Thin gray border
                opacity: 1,  
                color: '#808080',  // Gray border color
                fillOpacity: 0.7  
            };
        }

        // Function to determine color based on prison population rate
        function getColor(rate) {
            return rate > 600 ? '#8b0000' : // Dark Red
                   rate > 400 ? '#b22222' : // Firebrick
                   rate > 200 ? '#e6550d' : // Orange-Red
                   rate > 100 ? '#fdae61' : // Orange
                   rate > 50  ? '#fee08b' : // Yellow-Orange
                                '#ffffcc';  // Light Yellow
        }

        // Add the GeoJSON data with calculated prison rates
        L.geoJson(prisonData, {
            style: style,
            onEachFeature: function (feature, layer) {
                const prisonPop = feature.properties.TOT_POP;
                const totalPop = feature.properties.POPULATION;
                const rate = getPrisonRate(feature);
        
                // Format the numbers with commas
                const formattedPrisonPop = prisonPop > 1000 ? prisonPop.toLocaleString() : prisonPop;
                const formattedTotalPop = totalPop > 1000 ? totalPop.toLocaleString() : totalPop;
                const formattedRate = rate > 1000 ? rate.toLocaleString() : rate;
        
                layer.bindPopup(
                    `<b>State:</b> ${feature.properties.STATE_NAME}<br>
                     <b>Prison Population:</b> ${formattedPrisonPop}<br>
                     <b>Total Population:</b> ${formattedTotalPop}<br>
                     <b>Rate per 100,000:</b> ${formattedRate}` // Display formatted numbers with commas
                );
            }
        }).addTo(map2);

        // Add legend
        var legend2 = L.control({ position: 'bottomleft' });

            legend2.onAdd = function (map2) {
            var div = L.DomUtil.create('div', 'legend2'); // Using legend2 class
            var grades = [0, 50, 100, 200, 400, 600];

            div.innerHTML = '<b>Population Rate<br>per 100,000</b><br>';  // Break title into two lines

            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    `<div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <i style="background:${getColor(grades[i] + 1)}; width: 20px; height: 20px; display: inline-block;"></i>
                        <span style="margin-left: 8px;">${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] : '+'}</span>
                    </div>`;
            }

            return div;
        };

        legend2.addTo(map2);


        // Add instruction text to the top-right corner of the map without a box
        var instructions = L.control({ position: 'topright' });

        instructions.onAdd = function (map2) {
            var div = L.DomUtil.create('div', 'instructions');
            div.innerHTML = 'Click on a state for incarceration data'; // Text without bold or box
            div.style.fontSize = '14px'; // Set font size
            div.style.fontFamily = 'Georgia, serif'; // Set font family
            div.style.color = '#8b0000'; // Set text color
            div.style.padding = '0'; // Remove padding
            div.style.backgroundColor = 'transparent'; // Make background transparent
            div.style.boxShadow = 'none'; // Remove box shadow
            div.style.textAlign = 'left'; // Align text to the left
            return div;
        };

        instructions.addTo(map2);
    })
    .catch(error => console.error('Error loading state prison population data:', error));
