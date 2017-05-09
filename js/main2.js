
function initialize(){
	getData();
};


// Title
$("#title").append("Natural Disaster Mapper");

/////////////////////// global layers //////////////////////////////////////////
var states = new L.GeoJSON.AJAX("data/states_excluding_SW.geojson", {style: statesStyle});
var swStates = new L.GeoJSON.AJAX("data/sw_states.geojson", {style: swStyle});
var counties = new L.GeoJSON.AJAX("data/counties.geojson", {style: countyStyle}).bringToBack();
var basemap = L.tileLayer('https://api.mapbox.com/styles/v1/djwaro/cj2a22xj1001m2tpeuqgavppe/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZGp3YXJvIiwiYSI6ImNpdXJwYnRidTAwOWgyeXJ2ZnJ6ZnVtb3AifQ.1ajSBLNXDrHg6M7PE_Py_A', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
});

/////////////////////// global variables ///////////////////////////////////////
var activeField;
var attributes;
var sauce;
var mymap;
//chart width and height

var width = 310;
var height = 175;
//scales
var x = d3.scaleLinear()
    .range([0, width -74])
    .domain([2000, 2016]);
var y = d3.scaleLinear()
    .range([0, height-27])
    .domain([600, 0]);

// assigns the respected geojsons to the apropriate variables
function getData(mymap) {

	d3.queue()
			.defer(d3.csv, "data/state_events.csv") // load attributes from csv
			.defer(d3.csv, "data/county_events.csv")
			.defer(d3.json, "data/state_events.geojson")
			.defer(d3.json, "data/county_events.geojson")
			.await(callback);
}; // close to getData

// callback for data viz
function callback(error, csvData, county_eventsCSV, state_eventsJSON, county_eventsJSON){
    createMap(state_eventsJSON, county_eventsJSON, csvData, county_eventsCSV);
    stateGraph(csvData, county_eventsCSV);
    //countyGraph(csvData, county_eventsCSV, 'Amador')
    createDropdown(csvData, county_eventsCSV);
};


// sets map element and its properties
function createMap(state_eventsJSON, county_eventsJSON, csvData, county_eventsCSV) {

	// create map, map div, and map's initial view
	mymap = L.map('mapid', {
	}).setView([35.50, -108.50], 5);

	// set map boundaries
	mymap.setMaxBounds([
		[0, -160],
		[75, -20],
	]).setMinZoom(3);

	// tile layer
	basemap.addTo(mymap);

	// add navigation bar to the map
	L.control.navbar().addTo(mymap);

	swStates = new L.GeoJSON.AJAX("data/sw_states.geojson", {style: swStyle});
	swStates.addTo(mymap).bringToFront();

	// add state borders
	states = new L.GeoJSON.AJAX("data/states_excluding_SW.geojson", {style: statesStyle});
	states.addTo(mymap).bringToBack();

	// when the map zooms, change between showing the counties
	mymap.on('zoomend', function (e) {
		changeLayers(mymap);
	});
	layers(mymap, state_eventsJSON, county_eventsJSON, csvData, county_eventsCSV);

}; // close to createMap


// styling for SW Region with out a fill
function swStyle() {
		return {
				fillColor: 'white',
				weight: 3,
				opacity: 1,
				color: 'gray',
				fillOpacity: 0,
		};
};


// styling for SW Region with out a fill
function countyStyle() {
		return {
				fillColor: 'white',
				weight: 1,
				opacity: 1,
				color: 'gray',
				fillOpacity: 0,
		};
};


// styling for non-SW region that is more opaque
function statesStyle() {
		return {
				fillColor: 'gray',
				weight: 2,
				opacity: 1,
				color: 'gray',
				fillOpacity: 0.7
		};
};

// Changes layers based on the zoome level
function changeLayers(mymap) {
	if (mymap.getZoom() >= 6) {
		//mymap.removeLayer(swStates);
		swStates.bringToBack();
		counties.addTo(mymap).bringToBack();
	} else if (mymap.getZoom() < 6) {
		mymap.removeLayer(counties);
		//swStates.bringToBack();
	};
};


// function to add the initial State total events layer
function layers(mymap,state_eventsJSON, county_eventsJSON, csvData, county_eventsCSV) {
	var allLayers = {};

	//marker style options are set to a variable
	var geojsonMarkerOptions = {
		fillColor: "#ffd633",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
	};

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.stateTotalEventsLayer = L.geoJson(state_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
			// event listeners to open popup on hover
		}
	});

	//function to size the overlay data according to total events
	allLayers.stateTotalEventsLayer.eachLayer(function(layer){
		//total events property is set to props
		var props = layer.feature.properties.Total_Events_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius = calcPropRadius(props);
		//the radius is set to the data layer
		layer.setRadius(radius);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.stateAvalanchesLayer = L.geoJson(state_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
		}
	});

	//function to size the overlay data according to wildfires
	allLayers.stateAvalanchesLayer.eachLayer(function(layer){
		// wildfire event
		var b = layer.feature.properties.Avalanche_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius3 = calcPropRadius(b);
		//the radius is set to the data layer
		layer.setRadius(radius3);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.stateBlizzardsLayer = L.geoJson(state_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to wildfires
	allLayers.stateBlizzardsLayer.eachLayer(function(layer){
		// wildfire event
		var c = layer.feature.properties.Blizzard_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius4 = calcPropRadius(c);
		//the radius is set to the data layer
		layer.setRadius(radius4);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.stateDroughtsLayer = L.geoJson(state_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to wildfires
	allLayers.stateDroughtsLayer.eachLayer(function(layer){
		// wildfire event
		var a = layer.feature.properties.Drought_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius2 = calcPropRadius(a);
		//the radius is set to the data layer
		layer.setRadius(radius2);
	});

	//geoJSON layer with leaflet is created to add data to the map
allLayers.stateExcessiveHeatLayer = L.geoJson(state_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to Excessive Heat Events
	allLayers.stateExcessiveHeatLayer.eachLayer(function(layer){
		// wildfire event
		var d = layer.feature.properties.Excessive_Heat_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius5 = calcPropRadius(d);
		//the radius is set to the data layer
		layer.setRadius(radius5);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.stateExtremeColdLayer = L.geoJson(state_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to wildfires
	allLayers.stateExtremeColdLayer.eachLayer(function(layer){
		// wildfire event
		var e = layer.feature.properties.Extreme_Cold_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius6 = calcPropRadius(e);
		//the radius is set to the data layer
		layer.setRadius(radius6);
	});

	//geoJSON layer with leaflet is created to add data to the map
allLayers.stateTornadosLayer = L.geoJson(state_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
			}
	});

	//function to size the overlay data according to wildfires
	allLayers.stateTornadosLayer.eachLayer(function(layer){
			// tornado event
			var f = layer.feature.properties.Tornado_2000;
			// the radius is calculated using the calcPropSymbols function
			var radius7 = calcPropRadius(f);
			//the radius is set to the data layer
			layer.setRadius(radius7);

	});

	//geoJSON layer with leaflet is created to add data to the map
allLayers.stateWildfiresLayer = L.geoJson(state_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to wildfires
	allLayers.stateWildfiresLayer.eachLayer(function(layer){
		// wildfire event
		var mops = layer.feature.properties.Wildfire_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius1 = calcPropRadius(mops);
		//the radius is set to the data layer
		layer.setRadius(radius1);
	});
	//adds in county layer
	allLayers.countyTotalEventsLayer = L.geoJson(county_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
		}
	});

	//function to size the overlay data according to total events
	allLayers.countyTotalEventsLayer.eachLayer(function(layer){
		//total events property is set to props
		var props = layer.feature.properties.Total_Events_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius8 = calcPropRadius(props);
		//the radius is set to the data layer
		layer.setRadius(radius8);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.countyAvalanchesLayer = L.geoJson(county_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
		}
	});

	//function to size the overlay data according to wildfires
	allLayers.countyAvalanchesLayer.eachLayer(function(layer){
		// wildfire event
		var b = layer.feature.properties.Avalanche_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius9 = calcPropRadius(b);
		//the radius is set to the data layer
		layer.setRadius(radius9);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.countyBlizzardsLayer = L.geoJson(county_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to wildfires
	allLayers.countyBlizzardsLayer.eachLayer(function(layer){
		// wildfire event
		var c = layer.feature.properties.Blizzard_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius10 = calcPropRadius(c);
		//the radius is set to the data layer
		layer.setRadius(radius10);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.countyDroughtsLayer = L.geoJson(county_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to wildfires
	allLayers.countyDroughtsLayer.eachLayer(function(layer){
		// wildfire event
		var a = layer.feature.properties.Drought_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius11 = calcPropRadius(a);
		//the radius is set to the data layer
		layer.setRadius(radius11);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.countyExcessiveHeatLayer = L.geoJson(county_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to Excessive Heat Events
	allLayers.countyExcessiveHeatLayer.eachLayer(function(layer){
		// wildfire event
		var d = layer.feature.properties.Excessive_Heat_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius12 = calcPropRadius(d);
		//the radius is set to the data layer
		layer.setRadius(radius12);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.countyExtremeColdLayer = L.geoJson(county_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to wildfires
	allLayers.countyExtremeColdLayer.eachLayer(function(layer){
		// wildfire event
		var e = layer.feature.properties.Extreme_Cold_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius13 = calcPropRadius(e);
		//the radius is set to the data layer
		layer.setRadius(radius13);
	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.countyTornadosLayer = L.geoJson(county_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
			}
	});

	//function to size the overlay data according to wildfires
	allLayers.countyTornadosLayer.eachLayer(function(layer){
			// tornado event
			var f = layer.feature.properties.Tornado_2000;
			// the radius is calculated using the calcPropSymbols function
			var radius14 = calcPropRadius(f);
			//the radius is set to the data layer
			layer.setRadius(radius14);

	});

	//geoJSON layer with leaflet is created to add data to the map
	allLayers.countyWildfiresLayer = L.geoJson(county_eventsJSON, {
		//pointToLayer is used to change the marker features to circle markers,
		pointToLayer: function (feature, latlng) {
			return L.circleMarker (latlng, geojsonMarkerOptions);
				}
	});

	//function to size the overlay data according to wildfires
	allLayers.countyWildfiresLayer.eachLayer(function(layer){
		// wildfire event
		var mops = layer.feature.properties.Wildfire_2000;
		// the radius is calculated using the calcPropSymbols function
		var radius15 = calcPropRadius(mops);
		//the radius is set to the data layer
		layer.setRadius(radius15);
	});


	//leaflet overlay control to add the overlay data
	var totalEventsOverlay = {
	"<span class = 'overlayText'>State Total Events</span>": allLayers.stateTotalEventsLayer //& allLayers.countyTotalEventsLayer
	};
	var avalanches = {
	"<span class = 'overlayText'>Avalanches</span>": allLayers.stateAvalanchesLayer //& allLayers.countyAvalanchesLayer
	};
	var blizzards = {
	"<span class = 'overlayText'>Blizzards</span>": allLayers.stateBlizzardsLayer //& allLayers.countyBlizzardsLayer
	};
	var droughts = {
	"<span class = 'overlayText'>Droughts</span>": allLayers.stateDroughtsLayer //& allLayers.countyDroughtsLayer
	};
	var excessiveHeat = {
	"<span class = 'overlayText'>Droughts</span>": allLayers.stateExcessiveHeatLayer //& allLayers.countyExcessiveHeatLayer
	};
	var extremeCold = {
	"<span class = 'overlayText'>Droughts</span>": allLayers.stateExtremeColdLayer //& allLayers.countyExtremeColdLayer
	};
	var tornados = {
	"<span class = 'overlayText'>Droughts</span>": allLayers.stateTornadosLayer //& allLayers.countyTornadosLayer
	};
	var wildfires = {
	"<span class = 'overlayText'>Wildfires</span>": allLayers.stateWildfiresLayer// & allLayers.countyWildfiresLayer
};

	var activeLayer;

	$("#total-events").on("click", function(e) {

		if (mymap.getZoom() < 6) {
			activeLayer = allLayers.stateTotalEventsLayer;
			activeField = "Total_Events";
			mymap.eachLayer(function (layer) {
					mymap.removeLayer(layer);
			});
			baseLayers(mymap);
			mymap.addLayer(activeLayer);
			attributes = processData(state_eventsJSON, activeField);
			sauce = $('.range-slider').val();
			updateLegend(mymap, attributes[sauce]);
			updatePropSymbols(mymap, attributes[sauce]);
		} else if (mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyTotalEventsLayer;
				activeField = "Total_Events";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}
        stateGraph(csvData);
        createDropdown(csvData, county_eventsCSV);
	});

	$("#avalanches").on("click", function(e) {
		if (mymap.getZoom() < 6) {
				activeLayer = allLayers.stateAvalanchesLayer;
				activeField = "Avalanche";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyAvalanchesLayer;
				activeField = "Avalanche";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}
        stateGraph(csvData);
        createDropdown(csvData, county_eventsCSV);
	});

	$("#blizzards").on("click", function(e) {

		console.log(mymap.getZoom());
		if (mymap.getZoom() < 6) {
			activeLayer = allLayers.stateBlizzardsLayer;
			activeField = "Blizzard";
			mymap.eachLayer(function (layer) {
					mymap.removeLayer(layer);
			});
			baseLayers(mymap);
			mymap.addLayer(activeLayer);
			attributes = processData(state_eventsJSON, activeField);
			sauce = $('.range-slider').val();
			updateLegend(mymap, attributes[sauce]);
			updatePropSymbols(mymap, attributes[sauce]);
            stateGraph(csvData);
		} else if (mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyBlizzardsLayer;
				activeField = "Blizzard";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}
        stateGraph(csvData);
        createDropdown(csvData, county_eventsCSV);
	});

	$("#droughts").on("click", function(e) {
		if (mymap.getZoom() < 6) {
			activeLayer = allLayers.stateDroughtsLayer;
			activeField = "Drought";
			mymap.eachLayer(function (layer) {
					mymap.removeLayer(layer);
			});
			baseLayers(mymap);
			mymap.addLayer(activeLayer);
			attributes = processData(state_eventsJSON, activeField);
			sauce = $('.range-slider').val();
			updateLegend(mymap, attributes[sauce]);
			updatePropSymbols(mymap, attributes[sauce]);
		} else if (mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyDroughtsLayer;
				activeField = "Drought";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}
        stateGraph(csvData);
        createDropdown(csvData, county_eventsCSV);
	});

	$("#excessive-heat").on("click", function(e) {
		if (mymap.getZoom() < 6) {
			activeLayer = allLayers.stateExcessiveHeatLayer;
			activeField = "Excessive_Heat";
			mymap.eachLayer(function (layer) {
					mymap.removeLayer(layer);
			});
			baseLayers(mymap);
			mymap.addLayer(activeLayer);
			attributes = processData(state_eventsJSON, activeField);
			sauce = $('.range-slider').val();
			updateLegend(mymap, attributes[sauce]);
			updatePropSymbols(mymap, attributes[sauce]);
		} else if (mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyExcessiveHeatLayer;
				activeField = "Excessive_Heat";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}
        stateGraph(csvData);
        createDropdown(csvData, county_eventsCSV);
	});

	$("#extreme-cold").on("click", function(e) {
		if (mymap.getZoom() < 6) {
			activeLayer = allLayers.stateExtremeColdLayer;
			activeField = "Extreme_Cold";
			mymap.eachLayer(function (layer) {
					mymap.removeLayer(layer);
			});
			baseLayers(mymap);
			mymap.addLayer(activeLayer);
			attributes = processData(state_eventsJSON, activeField);
			sauce = $('.range-slider').val();
			updateLegend(mymap, attributes[sauce]);
			updatePropSymbols(mymap, attributes[sauce]);
		} else if (mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyExtremeColdLayer;
				activeField = "Extreme_Cold";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}
        stateGraph(csvData);
        createDropdown(csvData, county_eventsCSV);
	});

	$("#tornado").on("click", function(e) {
		if (mymap.getZoom() < 6) {
			activeLayer = allLayers.stateTornadosLayer;
			activeField = "Tornado";
			mymap.eachLayer(function (layer) {
					mymap.removeLayer(layer);
			});
			baseLayers(mymap);
			mymap.addLayer(activeLayer);
			attributes = processData(state_eventsJSON, activeField);
			sauce = $('.range-slider').val();
			updateLegend(mymap, attributes[sauce]);
			updatePropSymbols(mymap, attributes[sauce]);
		} else if (mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyTornadosLayer;
				activeField = "Tornado";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}
        stateGraph(csvData);
        createDropdown(csvData, county_eventsCSV);
	});

	$("#wildfire").on("click", function(e) {
		if (mymap.getZoom() < 6) {
			activeLayer = allLayers.stateWildfiresLayer;
			activeField = "Wildfire";
			mymap.eachLayer(function (layer) {
					mymap.removeLayer(layer);
			});
			baseLayers(mymap);
			mymap.addLayer(activeLayer);
			attributes = processData(state_eventsJSON, activeField);
			sauce = $('.range-slider').val();
			updateLegend(mymap, attributes[sauce]);
			updatePropSymbols(mymap, attributes[sauce]);
		} else if (mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyWildfiresLayer;
				activeField = "Wildfire";
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}
        stateGraph(csvData);
        createDropdown(csvData, county_eventsCSV);
	});

	activeField = "Total_Events";
	// creating an array of attributes
	activeLayer = allLayers.stateTotalEventsLayer;
	attributes = processData(state_eventsJSON, activeField);
	// call function to create proportional symbols
	createPropSymbols(state_eventsJSON, county_eventsJSON, mymap, attributes);
	createSequenceControls(mymap, attributes);
	createLegend(mymap, attributes);

	mymap.eachLayer(function (layer) {
 		 mymap.removeLayer(layer);
  });
  baseLayers(mymap);
  mymap.addLayer(activeLayer);
  attributes = processData(state_eventsJSON, activeField);
  sauce = $('.range-slider').val();
  updateLegend(mymap, attributes[sauce]);
  updatePropSymbols(mymap, attributes[sauce]);


	//function to switch county and state values based on zoom level
	mymap.on('zoomend', function(){
		if (activeField == "Total_Events" && mymap.getZoom() < 6) {
				activeLayer = allLayers.stateTotalEventsLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				console.log("1111");
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Total_Events" && mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyTotalEventsLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				console.log("2222");
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);

		} else if (activeField == "Avalanche" && mymap.getZoom() < 6) {
				activeLayer = allLayers.stateAvalanchesLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Avalanche" && mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyAvalanchesLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Blizzard" && mymap.getZoom() < 6) {
				activeLayer = allLayers.stateBlizzardsLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Blizzard" && mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyBlizzardsLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Drought" && mymap.getZoom() < 6) {
				activeLayer = allLayers.stateDroughtsLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Drought" && mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyDroughtsLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Excessive_Heat" && mymap.getZoom() < 6) {
				activeLayer = allLayers.stateExcessiveHeatLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Excessive_Heat" && mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyExcessiveHeatLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}else if (activeField == "Extreme_Cold" && mymap.getZoom() < 6) {
				activeLayer = allLayers.stateExtremeColdLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Extreme_Cold" && mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyExtremeColdLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}else if (activeField == "Tornado" && mymap.getZoom() < 6) {
				activeLayer = allLayers.stateTornadosLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		} else if (activeField == "Tornado" && mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyTornadosLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}else if (activeField == "Wildfire" && mymap.getZoom() < 6) {
				activeLayer = allLayers.stateWildfiresLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(state_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		}else if (activeField == "Wildfire" && mymap.getZoom() >= 6) {
				activeLayer = allLayers.countyWildfiresLayer;
				mymap.eachLayer(function (layer) {
						mymap.removeLayer(layer);
				});
				baseLayers(mymap);
				mymap.addLayer(activeLayer);
				attributes = processData(county_eventsJSON, activeField);
				sauce = $('.range-slider').val();
				updateLegend(mymap, attributes[sauce]);
				updatePropSymbols(mymap, attributes[sauce]);
		};
	});
}; // close to layers function


// function to create the Proportional Symbols map legend
function createLegend(mymap, attributes){

      // create the control container with a particular class name
      var legendContainer = L.DomUtil.create('div', 'legend-control-container');

      $(legendContainer).append('<div id="temporal-legend" >');
			$('#section-3').append(legendContainer)


      // start attribute legend svg string
      var svg = '<svg id="attribute-legend" width="230px" height="150px">';

      //object to base loop on
      var circles = {
        max: 65,
        mean: 95,
        min: 125
      };

      // loop to add each circle and text to svg string
      for (var circle in circles){

        //c ircle string
        svg += '<circle class="legend-circle" id="' + circle + '" fill="#FFD700" fill-opacity="0" stroke="#000000" cx="70"/>';

        // text string
        svg += '<text id="' + circle + '-text" x="150" y="' + circles[circle] + '"></text>';
      };

      // close svg string
      svg += "</svg>";

			// add attribute legend svg to container
      $(legendContainer).append(svg);

			$('#section-3').append(legendContainer);

  updateLegend(mymap, attributes[0]);

}; // close to createLegend function


// updates the temporal legend with new content
function updateLegend(mymap, attribute){

	var year = attribute.split("_").pop(); // split on the 3rd _

  var eventType = attribute.split("_")[0] + " "; //

	if (attribute.split("_")[1] !== year) {
		eventType = attribute.split("_")[0] + " " + attribute.split("_")[1] + " ";
	}

  // content to be added to the legend
  var legendContent = "<b>Number of " + eventType + "Events in " + year + ".</b>";

  // add in the text to the legend div
  $('#temporal-legend').html(legendContent);

  // get the max, mean, and min values as an object
  var circleValues = getCircleValues(mymap, attribute);

  // searches through circleValues array for instances where key shows up
  for (var key in circleValues){

       //get the radius
       var radius = calcPropRadius(circleValues[key]);

       // assign the cy and r attributes
       $('#' + key).attr({
           cy: 130 - radius,
           r: radius
       });

       // add legend text for the circles
       $('#' + key + '-text').text(Math.round((circleValues[key])));
   };
};

// Calculate the max, mean, and min values for a given attribute
function getCircleValues(mymap, attribute){

  // start with min at highest possible and max at lowest possible number
  var min = Infinity,
      max = -Infinity;

  // for each layer
  mymap.eachLayer(function(layer){
    //get the attribute value
    if (layer.feature){
      var attributeValue = Number(layer.feature.properties[attribute]);

      //test for min
      if (attributeValue < min){
        min = attributeValue;
      };

      //test for max
      if (attributeValue > max){
        max = attributeValue;
      };
    };
  });

  //set mean
  var mean = (max + min) / 2;

  //return values as an object
  return {
    max: max,
    mean: mean,
    min: min
  };
}; // close to getCircleValues


// function creates sequencing controls
function createSequenceControls(mymap, attributes, index) {

	// create a sequence control variable
  var sequencer = L.Control.extend({

    onAdd: function (mymap) {

      // create the control container div with a particular class name
      var container = L.DomUtil.create('div', 'sequence-control-container');

      //creates range input element (slider)
      $("#section-4").append('<input class="range-slider" type="range">');

      //add forward and reverse buttons
      $("#section-4").append('<button class="skip" id="reverse" title="Reverse"><b></b></button>');
      $("#section-4").append('<button class="skip" id="forward" title="Forward"><b>></b></button>');

			$('#reverse').html('<img id="reverseImage" src="img/reverse_button.png" onmouseover="" style="cursor: pointer;">');
    	$('#forward').html('<img id="forwardImage" src="img/forward_button.png" onmouseover="" style="cursor: pointer;">');

      //turn off any mouse event listeners on the sequence control
      $("#section-4").on('mousedown dblclick', function(e){
        L.DomEvent.stopPropagation(e);
      });

      return container;

    } // close to onAdd
  }); // close to var SequenceControl

  // add the Sequence Control to the map
  mymap.addControl(new sequencer());

	//set slider attributes
  $('.range-slider').attr({
    max: 16,
    min: 0,
    value: 0,
    step: 1
  });

  // input listener for slider
  $('.range-slider').on('input', function(){
    // get the new index value
    var index = $(this).val();
		var number;
		if (index < 10) {
			number = 200 + index;
		} else if (index >= 10) {
			number = 20 + index;
		}
		attributes[index] = activeField+"_"+number;
    // update the proportional symbols based off of the slider
    updatePropSymbols(mymap, attributes[index]);
  });

  // when the skip button is clicked
  $('.skip').click(function(){
    // get the old index value
    var index = $('.range-slider').val();
    // if forward button is clicked
    if ($(this).attr('id') == 'forward'){
      // increment index
      index++;
      // if past the last attribute, wrap around to first attribute
      index = index > 16 ? 0 : index;
    } else if ($(this).attr('id') == 'reverse'){ // if reverse button is clicked
      // decrement index
      index--;
      // if past the first attribute, wrap around to last attribute
      index = index < 0 ? 16 : index;
    };

    // update slider
    $('.range-slider').val(index);

		var number = 2000 + index;
		attributes[index] = activeField+"_"+number;
		sauce = index;
		//console.log("attributes[index]: " + attributes[index]);

    // update the proportional symbols based off of the skip buttons clicked
    updatePropSymbols(mymap, attributes[index]);

  }); // close to '.skip' click function
};


// function to resize proportional symbols according to new attribute values
function updatePropSymbols(mymap, attribute){

  // for each layer of the map
  mymap.eachLayer(function(layer){
    // if the layer contains both the layer feature and properties with attributes
    if (layer.feature && layer.feature.properties[attribute]){
			// access feature properties

      var props = layer.feature.properties;

      var attValue = Number(props[attribute]);
      // radius
      var radius = calcPropRadius(attValue);
      // set the updated radius to the layer
      layer.setRadius(radius);
      // new Popup
      var popup = new Popup(props, layer, radius);
      //add popup to circle marker
      popup.bindToLayer();
      //event listeners to open popup on hover
      layer.on({
        mouseover: function(){
          this.openPopup();
        },
        mouseout: function(){
          this.closePopup();
        },
        click: function(e){
            clickZoom(e);
        }

      }); // close to layer.on
    }
		// close to if statement
  }); // close to eachLayer function
  updateLegend(mymap, attribute); // update the temporal-legend
}; // close to updatePropSymbols function


// adds the baseLayers back to the map after all layers have been removed by
// the dropdown event listener
function baseLayers(mymap) {
		basemap.addTo(mymap);
		states.addTo(mymap).bringToBack();
		swStates.addTo(mymap).bringToFront();

		if (mymap.getZoom() >= 6) {
			mymap.addLayer(counties);
		};

		mymap.on('zoomend', function (e) {
			changeLayers(mymap, swStates, counties);
		});
}; //close to baseLayers


// build an attributes array for the data
function processData(data){

  // empty array to hold attributes
  var attributes = [];

  // properties of the first feature in the dataset
  var properties = data.features[0].properties;

  // push each attribute name into attributes array
  for (var attribute in properties){

    // only use total events to start
		if (attribute.indexOf(activeField) > -1){
      attributes.push(attribute);
		};

  }; // close to for loop

  // return the array of attributes that meet the if statement to be pushed
  return attributes;

}; // close to processData


// add circle markers for point features to the map
function createPropSymbols(state_eventsJSON, county_eventsJSON, mymap, attributes){

  // create a Leaflet GeoJSON layer and add it to the map
  var proportionalSymbols = L.geoJson(state_eventsJSON, {
    pointToLayer: function(feature, latlng, mymap){
      return pointToLayer(feature, latlng, attributes);
    }
  }).addTo(mymap);
//creates searchable countySymbols layer
	var countySymbols = L.geoJson(county_eventsJSON, {
    pointToLayer: function(feature, latlng, mymap){
      return pointToLayer(feature, latlng, attributes);
    }
  }).addTo(mymap);

  // call search function
  search(mymap, proportionalSymbols, countySymbols);
//removes county symbols because we only want to display the states at map initialization
	mymap.removeLayer(countySymbols);

}; // close to createPropSymbols


function clickZoom(e) {
  console.log(e.target.feature.properties['Location']);
	if (mymap.getZoom() < 6) {
        mymap.setView(e.target.getLatLng(), 6);
	} else {
		mymap.setView(e.target.getLatLng(), 8);
  }
};

// funtion to create the search control
function search (mymap, proportionalSymbols, countySymbols){
  // new variable search control
  var searchLayer = new L.Control.Search({
    position: 'topright',  // positions the operator in the top left of the screen
    layer: L.featureGroup([proportionalSymbols,countySymbols]), // use proportionalSymbols as theand countySymbols layer to search through
    propertyName: 'Location',  // search for State name
    marker: false,
    moveToLocation: function (latlng, title, mymap) {
      // set the view once searched to the circle marker's latlng and zoom
      mymap.setView(latlng, 7);
			searchPopup(latlng, title, mymap);
    }// close to moveToLocation
  }); // close to moveToLocation

	//function to add a popup when area is searched
	function searchPopup  (latlng, title, mymap){
		console.log('popup');
		var searchPopup = L.popup()
		.setLatLng(latlng)
		.setContent(title)
		.openOn(mymap)
	};

	$("#tab2-1").append(searchLayer.onAdd(mymap));

}; // close to search function


// function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){

  // determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];

  // create marker options
  var options = {
    fillColor: "#ffd633",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };
		var layer = L.circleMarker(latlng, options);
  // For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);
  // calculate the radius and assign it to the radius of the options marker.
	var radius = calcPropRadius(attValue);
	layer.setRadius(radius);
  // assign the marker with the options styling and using the latlng repsectively

var props = feature.properties;
	// creates a new popup object
	var popup = new Popup(props, layer, radius);
	//add popup to circle marker
	popup.bindToLayer();

  // return the circle marker to the L.geoJson pointToLayer option
  return layer;

}; // close to pointToLayer function


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {

  //scale factor to adjust symbol size evenly
  var scaleFactor = 25;

  //area based on attribute value and scale factor
  var area = attValue * scaleFactor;

  //radius calculated based on area
  var radius = Math.sqrt(area/Math.PI);

  // return the radius of the circle
  return radius;

}; // close to calcPropRadius


// OOM Popup constructor function
function Popup(properties, layer, radius){

  // creating the Popup object that can then be used more universally
  this.properties = properties;
  this.layer = layer;
  this.content = "<p><b>Location:</b> " + this.properties.Location + "</p>";

  this.bindToLayer = function(){
    this.layer.bindPopup(this.content, {
      offset: new L.Point(0,-radius),
      closeButton: false
    });
  }; // close to bindToLayer
}; // close to Popup function


function createDropdown(csvData, county_eventsCSV){
    var attrArray =[];
        for (var j = 0; j < county_eventsCSV.length; j++){
            attrArray.push(county_eventsCSV[j]['County']);
        }

    //add select element
    var dropdown = d3.select("#section-2")
        .append("select")
        .style('position', 'absolute')
        .style('top', 0)
        .style('left', '15px')
        //.attr("class", "dropdown")
        .on("change", function(){
            countyGraph(csvData, county_eventsCSV, this.value);
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select a County for its Individual Graph");

    //add attr name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d + " " + county_eventsCSV[attrArray.indexOf(d)]['State'] });


}

// grpah to show counties data
function countyGraph(csvData, county_eventsCSV, county){
    $('.chart').fadeIn(1000);
    $('.lines').fadeIn(1000);
    $('.title').fadeIn(1000);

		if (activeField == "Total_Events") {
			activeField = "Total Events";
		} else if (activeField == "Excessive_Heat") {
			activeField = "Excessive Heat";
		} else if (activeField == "Extreme_Cold") {
			activeField = "Extreme Cold";
		};

    var title1 = d3.select('#section-1')
        .html('<br>' + activeField + ' By County</br>2000-2016')
        .attr('class', 'title1')
        .style('font-family', 'Helvetica, sans-serif')
        .style('text-align', 'center')
        .style('font-weight', 'bold');

				if (activeField == "Total Events") {
					activeField = "Total_Events";
				} else if (activeField == "Excessive Heat") {
					activeField = "Excessive_Heat";
				} else if (activeField == "Extreme Cold") {
					activeField = "Extreme_Cold";
				};

    var vis1 = d3.select('#section-1')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr("class", "chart1");

    var yScale = d3.scaleLinear()
        .range([0, height-27])
        .domain([70, 0]);

    var xAxis = d3.axisBottom()
        .scale(x);
    var yAxis = d3.axisLeft()
        .scale(yScale);

    // Adding the scales to the chart.
    vis1.append("svg:g")
        .attr("transform", 'translate(28,' + (height-20).toString() + ')')
        .call(xAxis);
    vis1.append("svg:g")
        .attr("transform", 'translate(28, 6)')
        .call(yAxis);

    $('.chart1').fadeIn();

    //get the correct county row
    for (var i = 0; i < county_eventsCSV.length; i++){
        if (county_eventsCSV[i]['County'].toString() == county.toString()){
            var row = i;
        }
    }
    console.log(county_eventsCSV[203]['County']);

    //county line
    var lines = vis1.append('polyline')
        .attr('points', (x(2000)).toString() + ',' + (y(county_eventsCSV[row][activeField.toString() + '_2000'])).toString() + ',' +
        (x(2001)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2001'])).toString() + ',' +
        (x(2002)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2002'])).toString() + ',' +
        (x(2003)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2003'])).toString() + ',' +
        (x(2004)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2004'])).toString() + ',' +
        (x(2005)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2005'])).toString() + ',' +
        (x(2006)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2006'])).toString() + ',' +
        (x(2007)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2007'])).toString() + ',' +
        (x(2008)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2008'])).toString() + ',' +
        (x(2009)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2009'])).toString() + ',' +
        (x(2010)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2010'])).toString() + ',' +
        (x(2011)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2011'])).toString() + ',' +
        (x(2012)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2012'])).toString() + ',' +
        (x(2013)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2013'])).toString() + ',' +
        (x(2014)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2014'])).toString() + ',' +
        (x(2015)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2015'])).toString() + ',' +
        (x(2016)).toString() + ',' + (yScale(county_eventsCSV[row][activeField.toString() + '_2016'])).toString())
        .attr('class', 'lines1')
        .attr('transform', 'translate(28,6)')
        .attr('id', function(){
            return county_eventsCSV[row]['County'] + '_County';
        })
        .style('stroke', 'green');



    var row2;
    var avg;
    console.log(county_eventsCSV[row]['State']);

    //determine which row of csv is the correct state
    if (county_eventsCSV[row]['State'] == 'AZ'){
        row2 = 2;
        avg = 15;
    }
    else if (county_eventsCSV[row]['State'] == 'CO'){
        row2 = 5;
        avg = 64;
    }
    else if (county_eventsCSV[row]['State'] == 'CA'){
        row2 = 0;
        avg = 58;
    }
    else if (county_eventsCSV[row]['State'] == 'NV'){
        row2 = 1;
        avg = 16;
    }
    else if (county_eventsCSV[row]['State'] == 'UT'){
        row2 = 4;
        avg = 29;
    }
    else if (county_eventsCSV[row]['State'] == 'NM'){
        row2 = 3;
        avg = 33;
    }
    console.log(row2 + '   ' + avg);
    console.log((csvData[row2][activeField.toString() + '_2000']/avg));
    //average state line
    var lines = vis1.append('polyline')
        .attr('points', (x(2000)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2000']/avg)).toString() + ',' +
        (x(2001)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2001']/avg)).toString() + ',' +
        (x(2002)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2002']/avg)).toString() + ',' +
        (x(2003)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2003']/avg)).toString() + ',' +
        (x(2004)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2004']/avg)).toString() + ',' +
        (x(2005)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2005']/avg)).toString() + ',' +
        (x(2006)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2006']/avg)).toString() + ',' +
        (x(2007)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2007']/avg)).toString() + ',' +
        (x(2008)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2008']/avg)).toString() + ',' +
        (x(2009)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2009']/avg)).toString() + ',' +
        (x(2010)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2010']/avg)).toString() + ',' +
        (x(2011)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2011']/avg)).toString() + ',' +
        (x(2012)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2012']/avg)).toString() + ',' +
        (x(2013)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2013']/avg)).toString() + ',' +
        (x(2014)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2014']/avg)).toString() + ',' +
        (x(2015)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2015']/avg)).toString() + ',' +
        (x(2016)).toString() + ',' + (y(csvData[row2][activeField.toString() + '_2016']/avg)).toString())
        .attr('class', 'lines1')
        .attr('transform', 'translate(28,6)')
        .attr('id', function(){
            return (csvData[row2]['Location'] + '_County_Average').toString();
        })
        .style('stroke', function(){
            if (row2 == 0){
                return '#7fc97f';
            }
            else if (row2 == 1){
                return '#ff4d4d';
            }
            else if (row2 == 2){
                return '#fdc086';
            }
            else if (row2 == 3){
                return '#ffff99';
            }
            else if (row2 == 4){
                return 'blue';
            }
            else{
                return '#386cb0';
            }
        });

    $('.lines1').fadeIn(1000);

    //create label for tooltip
    var tooltip = d3.select('#section-1').append('div')
    		.attr('class', 'tooltip')
            .style('opacity', 0);

    d3.selectAll('.lines1')
        .on('mouseover', highlight)
        .on('mouseout', dehighlight);

					createDropdown(csvData, county_eventsCSV);
}

// create graph for the initial state view
function stateGraph(csvData, county_eventsCSV){
    //chart title
    $('.lines').fadeOut(1000);
    $('.lines1').fadeOut(1000);
    $('.chart1').fadeOut(1000);
    $('.title1').fadeOut(1000);
    $('.lines').fadeOut(1000);

    //createDropdown(csvData, county_eventsCSV);
		if (activeField == "Total_Events") {
			activeField = "Total Events";
		} else if (activeField == "Excessive_Heat") {
			activeField = "Excessive Heat";
		} else if (activeField == "Extreme_Cold") {
			activeField = "Extreme Cold";
		};

    //title
    var title = d3.select('#section-1')
        .html('<br><b>' + activeField + ' By State</br>2000-2016</b>')
        .attr('class','title')
        .style('font-family', 'Verdana, sans-serif')
				.style('top', 70)
        .style('text-align', 'center')
        .style('font-weight', 'bold');

    $('.title').fadeIn(1000);

		if (activeField == "Total Events") {
			activeField = "Total_Events";
		} else if (activeField == "Excessive Heat") {
			activeField = "Excessive_Heat";
		} else if (activeField == "Extreme Cold") {
			activeField = "Extreme_Cold";
		};

    // svg to contain chart
    var vis = d3.select('#section-1')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr("class", "chart");

    $('.chart').fadeIn(1000);


    //axis
    var xAxis = d3.axisBottom()
        .tickFormat(d3.format("d"))
        .scale(x);
    var yAxis = d3.axisLeft()
        .scale(y);

    // Adding the scales to the chart.
    vis.append("svg:g")
        .attr("transform", 'translate(27,' + (height-20).toString() + ')')
        .call(xAxis);
    vis.append("svg:g")
        .attr("transform", 'translate(27, 6)')
        .call(yAxis);
    console.log(activeField);
    for (var row = 0; row < csvData.length; row++){
        var lines = vis.append('polyline')
            .attr('points', (x(2000)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2000'])).toString() + ',' +
            (x(2001)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2001'])).toString() + ',' +
            (x(2002)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2002'])).toString() + ',' +
            (x(2003)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2003'])).toString() + ',' +
            (x(2004)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2004'])).toString() + ',' +
            (x(2005)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2005'])).toString() + ',' +
            (x(2006)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2006'])).toString() + ',' +
            (x(2007)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2007'])).toString() + ',' +
            (x(2008)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2008'])).toString() + ',' +
            (x(2009)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2009'])).toString() + ',' +
            (x(2010)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2010'])).toString() + ',' +
            (x(2011)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2011'])).toString() + ',' +
            (x(2012)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2012'])).toString() + ',' +
            (x(2013)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2013'])).toString() + ',' +
            (x(2014)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2014'])).toString() + ',' +
            (x(2015)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2015'])).toString() + ',' +
            (x(2016)).toString() + ',' + (y(csvData[row][activeField.toString() + '_2016'])).toString())
            .attr('class', 'lines')
            .attr('transform', 'translate(28,6)')
            .attr('id', function(){
                return csvData[row]['Location']
            })
            .style('display', 'none')
            .style('stroke', function(){
                if (row == 0){
                    return '#7fc97f';
                }
                else if (row == 1){
                    return '#ff4d4d';
                }
                else if (row == 2){
                    return '#feb24c';
                }
                else if (row == 3){
                    return '#ffff99';
                }
                else if (row == 4){
                    return 'blue';
                }
                else{
                    return 'turquoise';
                }
            });
        $('.lines').fadeIn(1000);

        console.log(csvData[row]['Location']);
    };

    //create label for tooltip
    var tooltip = d3.select('#section-1').append('div')
    		.attr('class', 'tooltip')
            .style('opacity', 0);

    //what happends when lines are moused over
    vis.selectAll('.lines')
        .on('mouseover', highlight)
        .on("mouseout", dehighlight);

}


// unhighlight a line when not over it
function dehighlight(){
    if (this.id.includes(' ')) {
        this.id = (this.id).replace(/ /gi, '_');
    }
    d3.select('#'+ (this.id).toString())
        .style("stroke-width", "3.5");
    d3.select('.tooltip')
        .style("opacity", 0);
}


// highlight the state or county line when over its line
function highlight(){
    console.log("id: " + this.id);
    d3.select('#' + (this.id).toString())
        .style("stroke-width", "6");

    if (this.id.includes('_')) {
        this.id = (this.id).replace(/_/gi, ' ');
    }

    d3.select('.tooltip')
        .style("opacity", 1)
        .html('<b>' + this.id + '</b>');
};


$(document).ready(initialize);
