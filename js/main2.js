
function initialize(){
	getData();
};


// Title
$("#title").append("Natural Disaster Mapper");

/////////////////////// global layers //////////////////////////////////////////
var states = new L.GeoJSON.AJAX("data/states_excluding_SW.geojson", {style: statesStyle});
var swStates = new L.GeoJSON.AJAX("data/sw_states.geojson", {style: swStyle});
var counties = new L.GeoJSON.AJAX("data/counties.geojson", {style: countyStyle}).bringToBack();
var statesJson = new L.GeoJSON.AJAX("data/state_events.geojson");
var countiesJson = new L.GeoJSON.AJAX("data/county_events.geojson");
var basemap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

/////////////////////// global variables ///////////////////////////////////////
var activeField;
var attributes;
var sauce;
var mymap;

// assigns the respected geojsons to the apropriate variables
function getData(mymap) {
	d3.queue()
			.defer(d3.csv, "data/state_events.csv") // load attributes from csv
			.defer(d3.csv, "data/county_events.csv")
			.await(callback);
}; // close to getData


// callback for data viz
function callback(error, csvData){
    createMap();
		stateGraph(csvData);
};


// sets map element and its properties
function createMap() {

	// create map, map div, and map's initial view
	mymap = L.map('mapid', {
	}).setView([37.0866, -115.00], 5);

	// set map boundaries
	mymap.setMaxBounds([
		[0, -200],
		[75, -20],
	]).setMinZoom(3);

	// tile layer
	basemap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	}).addTo(mymap);

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

	layers(mymap);

}; // close to createMap


// styling for SW Region with out a fill
function swStyle() {
		return {
				fillColor: 'white',
				weight: 3,
				opacity: 1,
				color: 'white',
				fillOpacity: 0,
		};
};


// styling for SW Region with out a fill
function countyStyle() {
		return {
				fillColor: 'white',
				weight: 1,
				opacity: 1,
				color: 'white',
				fillOpacity: 0,
		};
};


// styling for non-SW region that is more opaque
function statesStyle() {
		return {
				fillColor: 'gray',
				weight: 2,
				opacity: 1,
				color: 'white',
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
function layers(mymap) {

	var events = $.ajax("data/state_events.geojson", {
		dataType: "json",
		success: function(response){

			//marker style options are set to a variable
			var geojsonMarkerOptions = {
				fillColor: "#00FFCC",
		    color: "#000",
		    weight: 1,
		    opacity: 1,
		    fillOpacity: 0.7
			};

			//geoJSON layer with leaflet is created to add data to the map
			var stateTotalEventsLayer = L.geoJson(response, {
				//pointToLayer is used to change the marker features to circle markers,
				pointToLayer: function (feature, latlng) {
					return L.circleMarker (latlng, geojsonMarkerOptions);
				}
			});

			//function to size the overlay data according to total events
			stateTotalEventsLayer.eachLayer(function(layer){
				//total events property is set to props
				var props = layer.feature.properties.Total_Events_2000;
				// the radius is calculated using the calcPropSymbols function
				var radius = calcPropRadius(props);
				//the radius is set to the data layer
				layer.setRadius(radius);
			});

			//geoJSON layer with leaflet is created to add data to the map
			var stateAvalanchesLayer = L.geoJson(response, {
				//pointToLayer is used to change the marker features to circle markers,
				pointToLayer: function (feature, latlng) {
					return L.circleMarker (latlng, geojsonMarkerOptions);
				}
			});

			//function to size the overlay data according to wildfires
			stateAvalanchesLayer.eachLayer(function(layer){
				// wildfire event
				var b = layer.feature.properties.Avalanche_2000;
				// the radius is calculated using the calcPropSymbols function
				var radius3 = calcPropRadius(b);
				//the radius is set to the data layer
				layer.setRadius(radius3);
			});

			//geoJSON layer with leaflet is created to add data to the map
			var stateBlizzardsLayer = L.geoJson(response, {
				//pointToLayer is used to change the marker features to circle markers,
				pointToLayer: function (feature, latlng) {
					return L.circleMarker (latlng, geojsonMarkerOptions);
						}
			});

			//function to size the overlay data according to wildfires
			stateBlizzardsLayer.eachLayer(function(layer){
				// wildfire event
				var c = layer.feature.properties.Blizzard_2000;
				// the radius is calculated using the calcPropSymbols function
				var radius4 = calcPropRadius(c);
				//the radius is set to the data layer
				layer.setRadius(radius4);
			});

			//geoJSON layer with leaflet is created to add data to the map
			var stateDroughtsLayer = L.geoJson(response, {
				//pointToLayer is used to change the marker features to circle markers,
				pointToLayer: function (feature, latlng) {
					return L.circleMarker (latlng, geojsonMarkerOptions);
						}
			});

			//function to size the overlay data according to wildfires
			stateDroughtsLayer.eachLayer(function(layer){
				// wildfire event
				var a = layer.feature.properties.Drought_2000;
				// the radius is calculated using the calcPropSymbols function
				var radius2 = calcPropRadius(a);
				//the radius is set to the data layer
				layer.setRadius(radius2);
			});

			//geoJSON layer with leaflet is created to add data to the map
			var stateExcessiveHeatLayer = L.geoJson(response, {
				//pointToLayer is used to change the marker features to circle markers,
				pointToLayer: function (feature, latlng) {
					return L.circleMarker (latlng, geojsonMarkerOptions);
						}
			});

			//function to size the overlay data according to Excessive Heat Events
			stateExcessiveHeatLayer.eachLayer(function(layer){
				// wildfire event
				var d = layer.feature.properties.Excessive_Heat_2000;
				// the radius is calculated using the calcPropSymbols function
				var radius5 = calcPropRadius(d);
				//the radius is set to the data layer
				layer.setRadius(radius5);
			});

			//geoJSON layer with leaflet is created to add data to the map
			var stateExtremeColdLayer = L.geoJson(response, {
				//pointToLayer is used to change the marker features to circle markers,
				pointToLayer: function (feature, latlng) {
					return L.circleMarker (latlng, geojsonMarkerOptions);
						}
			});

			//function to size the overlay data according to wildfires
			stateExtremeColdLayer.eachLayer(function(layer){
				// wildfire event
				var e = layer.feature.properties.Extreme_Cold_2000;
				// the radius is calculated using the calcPropSymbols function
				var radius6 = calcPropRadius(e);
				//the radius is set to the data layer
				layer.setRadius(radius6);
			});

			//geoJSON layer with leaflet is created to add data to the map
			var stateTornadosLayer = L.geoJson(response, {
				//pointToLayer is used to change the marker features to circle markers,
				pointToLayer: function (feature, latlng) {
					return L.circleMarker (latlng, geojsonMarkerOptions);
					}
			});

			//function to size the overlay data according to wildfires
			stateTornadosLayer.eachLayer(function(layer){
					// tornado event
					var f = layer.feature.properties.Tornado_2000;
					// the radius is calculated using the calcPropSymbols function
					var radius7 = calcPropRadius(f);
					//the radius is set to the data layer
					layer.setRadius(radius7);

			});

			//geoJSON layer with leaflet is created to add data to the map
			var stateWildfiresLayer = L.geoJson(response, {
				//pointToLayer is used to change the marker features to circle markers,
				pointToLayer: function (feature, latlng) {
					return L.circleMarker (latlng, geojsonMarkerOptions);
						}
			});

			//function to size the overlay data according to wildfires
			stateWildfiresLayer.eachLayer(function(layer){
				// wildfire event
				var mops = layer.feature.properties.Wildfire_2000;
				// the radius is calculated using the calcPropSymbols function
				var radius1 = calcPropRadius(mops);
				//the radius is set to the data layer
				layer.setRadius(radius1);
			});


			//leaflet overlay control to add the overlay data
			var totalEventsOverlay = {
			"<span class = 'overlayText'>State Total Events</span>": stateTotalEventsLayer
			};
			var avalanches = {
			"<span class = 'overlayText'>Avalanches</span>": stateAvalanchesLayer
			};
			var blizzards = {
			"<span class = 'overlayText'>Blizzards</span>": stateBlizzardsLayer
			};
			var droughts = {
			"<span class = 'overlayText'>Droughts</span>": stateDroughtsLayer
			};
			var excessiveHeat = {
			"<span class = 'overlayText'>Droughts</span>": stateExcessiveHeatLayer
			};
			var extremeCold = {
			"<span class = 'overlayText'>Droughts</span>": stateExtremeColdLayer
			};
			var tornados = {
			"<span class = 'overlayText'>Droughts</span>": stateTornadosLayer
			};
			var wildfires = {
			"<span class = 'overlayText'>Wildfires</span>": stateWildfiresLayer
			};

			// call to create the dropdown menu
			dropdown(mymap, attributes);

			$(".dropdown select").on("change", function(g) {

					var targetLayer = g.target.value;

					if (targetLayer == 'stateTotalEventsLayer') {
							activeLayer = stateTotalEventsLayer;
							activeField = "Total_Events";
							mymap.eachLayer(function (layer) {
    							mymap.removeLayer(layer);
							});
							baseLayers(mymap);
							mymap.addLayer(activeLayer);
							attributes = processData(response, activeField);
							//console.log("asdfas: " + stateTotalEventsLayer.Location);
							updateLegend(mymap, attributes[sauce]);
					} else if (targetLayer == 'stateAvalanchesLayer') {
							activeLayer = stateAvalanchesLayer;
							activeField = "Avalanche";
							mymap.eachLayer(function (layer) {
    							mymap.removeLayer(layer);
							});
							baseLayers(mymap);
							mymap.addLayer(activeLayer);
							attributes = processData(response, activeField);
							updateLegend(mymap, attributes[sauce]);
					} else if (targetLayer == 'stateBlizzardsLayer') {
							activeLayer = stateBlizzardsLayer;
							activeField = "Blizzard";
							mymap.eachLayer(function (layer) {
    							mymap.removeLayer(layer);
							});
							baseLayers(mymap);
							mymap.addLayer(activeLayer);
							attributes = processData(response, activeField);
							updateLegend(mymap, attributes[sauce]);
					} else if (targetLayer == 'stateDroughtsLayer') {
							activeLayer = stateDroughtsLayer;
							activeField = "Drought";
							mymap.eachLayer(function (layer) {
    							mymap.removeLayer(layer);
							});
							baseLayers(mymap);
							mymap.addLayer(activeLayer);
							attributes = processData(response, activeField);
							updateLegend(mymap, attributes[sauce]);
					} else if (targetLayer == 'stateExcessiveHeatLayer') {
							activeLayer = stateExcessiveHeatLayer;
							activeField = "Excessive_Heat"
							mymap.eachLayer(function (layer) {
    							mymap.removeLayer(layer);
							});
							baseLayers(mymap);
							mymap.addLayer(activeLayer);
							attributes = processData(response, activeField);
							updateLegend(mymap, attributes[sauce]);
					} else if (targetLayer == 'stateExtremeColdLayer') {
							activeLayer = stateExtremeColdLayer;
							activeField = "Extreme_Cold";
							mymap.eachLayer(function (layer) {
    							mymap.removeLayer(layer);
							});
							baseLayers(mymap);
							mymap.addLayer(activeLayer);
							attributes = processData(response, activeField);
							updateLegend(mymap, attributes[sauce]);
					} else if (targetLayer == 'stateTornadosLayer') {
							activeLayer = stateTornadosLayer;
							activeField = "Tornado";
							mymap.eachLayer(function (layer) {
    							mymap.removeLayer(layer);
							});
							baseLayers(mymap);
							mymap.addLayer(activeLayer);
							attributes = processData(response, activeField);
							updateLegend(mymap, attributes[sauce]);
					} else if (targetLayer == 'stateWildfiresLayer') {
							activeLayer = stateWildfiresLayer;
							activeField = "Wildfire";
							mymap.eachLayer(function (layer) {
    							mymap.removeLayer(layer);
							});
							baseLayers(mymap);
							mymap.addLayer(activeLayer);
							attributes = processData(response, activeField);
							updateLegend(mymap, attributes[sauce]);
					};
			});

			activeField = "Total_Events";
			// creating an array of attributes
			attributes = processData(response, activeField);
			// call function to create proportional symbols
			createPropSymbols(response, mymap, attributes);
			createSequenceControls(mymap, attributes);
			createLegend(mymap, attributes);
		}
	});
	//events.addTo(mymap);

}; // close to layers function


// function to create the Proportional Symbols map legend
function createLegend(mymap, attributes){

      $('#section-3').append('<div id="temporal-legend" >');

      // start attribute legend svg string
      var svg = '<svg id="attribute-legend" width="200px" height="150px">';

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
      $('#section-3').append(svg);

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
      // subtract one because all pop growths will be at 1._ _ attributes, so we
      // want more variation
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
        click: function(){
						// click content
        }
      }); // close to layer.on
    }; // close to if statement
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
};


// var to create a dropdown menu
function dropdown(mymap, attributes) {

	var dropdown = L.DomUtil.create('div', 'dropdown');
	dropdown.innerHTML = '<select><option value="stateTotalEventsLayer">Total Events</option><option value="stateAvalanchesLayer">Avalanche</option>'+
	'<option value="stateBlizzardsLayer">Blizzard</option><option value="stateDroughtsLayer">Drought</option><option value="stateExcessiveHeatLayer">Excessive Heat</option>'+
	'<option value="stateExtremeColdLayer">Extreme Cold/ Wind Chill</option><option value="stateTornadosLayer">Tornado</option><option value="stateWildfiresLayer">Wildfire</option></select>';

	$("#section-1").append(dropdown);

};


// build an attributes array for the data
function processData(data){

  // empty array to hold attributes
  var attributes = [];

	//console.log("activeField: " + activeField);

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
function createPropSymbols(data, mymap, attributes){

  // create a Leaflet GeoJSON layer and add it to the map
  var proportionalSymbols = L.geoJson(data, {
    pointToLayer: function(feature, latlng, mymap){
      return pointToLayer(feature, latlng, attributes);
    }
  }).addTo(mymap);

  // call search function
  search(mymap, data, proportionalSymbols)

}; // close to createPropSymbols


function clickZoom(e) {
    mymap.setView(e.target.getLatLng(), 6);
};

// funtion to create the search control
function search (mymap, data, proportionalSymbols){

  // new variable search control
  var searchLayer = new L.Control.Search({
    position: 'topright',  // positions the operator in the top left of the screen
    layer: proportionalSymbols,  // use proportionalSymbols as the layer to search through
    propertyName: 'Location',  // search for State name
    marker: false,
    moveToLocation: function (latlng, title, mymap) {

      // set the view once searched to the circle marker's latlng and zoom
      mymap.setView(latlng, 6);

    } // close to moveToLocation
  }); // close to var searchLayer

  // add the control to the map
	//$("#section-2").append(searchLayer.onAdd(mymap));
	$(".search").append(searchLayer.onAdd(mymap));

}; // close to search function


// function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes, layer){

  // determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];

  // create marker options
  var options = {
    fillColor: "#FFD700",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.7
  };

  // For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);

  // calculate the radius and assign it to the radius of the options marker.
  // Multiplied by 10
  options.radius = calcPropRadius(attValue);

  // assign the marker with the options styling and using the latlng repsectively
  var layer = L.circleMarker(latlng, options);

	// creates a new popup object
  var popup = new Popup(feature.properties, layer, options.radius);

	// if (mymap.getZoom() < 7) {
	// 	console.log("should remove the county marker");
	// 	if (feature.properties.Location !== "Arizona" &&
	// 			feature.properties.Location !== "New Mexico" &&
	// 			feature.properties.Location !== "California" &&
	// 			feature.properties.Location !== "Nevada") {
	// 		console.log(feature.properties.Location);
	// 		var a = layer;
	// 		console.log("a: ", a);
	// 		mymap.removeLayer(a);
	// 		return false;
	// 	};
	// };

	// mymap.on('zoomend', function (e) {
	// 	if (feature.properties.Location == "Arizona" && mymap.getZoom() >= 7 ||
	// 			feature.properties.Location == "New Mexico" && mymap.getZoom() >= 7 ||
	// 			feature.properties.Location == "California" && mymap.getZoom() >= 7 ||
	// 			feature.properties.Location == "Nevada" && mymap.getZoom() >= 7) {
	// 		var x = layer;
	// 		mymap.removeLayer(x);
	// 	} else if (feature.properties.Location == "Arizona" && mymap.getZoom() < 7 ||
	// 						 feature.properties.Location == "New Mexico" && mymap.getZoom() < 7 ||
	// 					 	 feature.properties.Location == "California" && mymap.getZoom() < 7 ||
	// 					 	 feature.properties.Location == "Nevada" && mymap.getZoom() < 7) {
	// 		var y = layer;
	// 		mymap.addLayer(y);
	// 	}
	// });

  // add popup to circle marker
  popup.bindToLayer();

  // event listeners to open popup on hover
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
  });

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


// create graph for the initial state view
// create graph for the initial state view
function stateGraph(csvData){
    //array of all year for x values
    var yearsArray = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];
    
    //print info for each item/state in csv file
    for (var row = 0; row < csvData.length; row++){
        console.log(csvData[row]);    
    }
    
    //chart width and height
    var width = window.innerWidth * 0.15;
    var height = window.innerWidth * 0.15;
    
    // svg to contain chart
    var vis = d3.select('#right-pane')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr("class", "chart");

    //scales
    var x = d3.scaleLinear()
        .range([0, width])
        .domain([2000, 2016]);
    
    var y = d3.scaleLinear()
        .range([0, height])
        .domain([600, 0]);

    //axis
    var xAxis = d3.axisBottom()
        .scale(x);
    var yAxis = d3.axisLeft()
        .scale(y);
/*
    //Adding the scales to the chart. placement is tricky.
    vis.append("svg:g")
        .attr("transform", 'translate(30,' + (height-17).toString() + ')')
        .call(xAxis);
    vis.append("svg:g")
        .attr("transform", 'translate(20, 0)')
        .call(yAxis);
*/

    for (var row = 0; row < csvData.length; row++){
        vis.append('polyline')
            .attr('points', (x(2000)).toString() + ',' + (y(csvData[row]['Total_Events_2000'])).toString() + ',' + 
            (x(2001)).toString() + ',' + (y(csvData[row]['Total_Events_2001'])).toString() + ',' + 
            (x(2002)).toString() + ',' + (y(csvData[row]['Total_Events_2002'])).toString() + ',' + 
            (x(2003)).toString() + ',' + (y(csvData[row]['Total_Events_2003'])).toString() + ',' + 
            (x(2004)).toString() + ',' + (y(csvData[row]['Total_Events_2004'])).toString() + ',' + 
            (x(2005)).toString() + ',' + (y(csvData[row]['Total_Events_2005'])).toString() + ',' + 
            (x(2006)).toString() + ',' + (y(csvData[row]['Total_Events_2006'])).toString() + ',' + 
            (x(2007)).toString() + ',' + (y(csvData[row]['Total_Events_2007'])).toString() + ',' + 
            (x(2008)).toString() + ',' + (y(csvData[row]['Total_Events_2008'])).toString() + ',' + 
            (x(2009)).toString() + ',' + (y(csvData[row]['Total_Events_2009'])).toString() + ',' + 
            (x(2010)).toString() + ',' + (y(csvData[row]['Total_Events_2010'])).toString() + ',' + 
            (x(2011)).toString() + ',' + (y(csvData[row]['Total_Events_2011'])).toString() + ',' + 
            (x(2012)).toString() + ',' + (y(csvData[row]['Total_Events_2012'])).toString() + ',' + 
            (x(2013)).toString() + ',' + (y(csvData[row]['Total_Events_2013'])).toString() + ',' + 
            (x(2014)).toString() + ',' + (y(csvData[row]['Total_Events_2014'])).toString() + ',' + 
            (x(2015)).toString() + ',' + (y(csvData[row]['Total_Events_2015'])).toString() + ',' + 
            (x(2016)).toString() + ',' + (y(csvData[row]['Total_Events_2016'])).toString())
            .attr('class', 'lines')
            .style('stroke', function(){
                if (row == 0){
                    return 'red';
                }
                else if (row == 1){
                    return 'orange';
                }
                else if (row == 2){
                    return 'yellow';
                }
                else if (row == 3){
                    return 'green';
                }
                else if (row == 4){
                    return 'blue';
                }
                else{
                    return 'purple';
                }
            });
        
        console.log(csvData[row]['Location']);
    };
    
    // lines for line graph
    /*
    var lines = vis.selectAll('.lines')
        .data(csvData)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr("stroke", "white");
    */
    
    //create array out of only desired values and use them with the y axis generator
    d3.select(".dropdown select")
        .on("change", function(e){//e is undefined right now... figure out why
            console.log(e.target.value);
            updateStateGraph(vis, x, y, e.target.value, csvData);
    })

};

function updateStateGraph(vis, x, y, val, csvData){
    console.log(val, csvData[0]);
    //use dropdown event listener and do something differnt to csvData each time a different dropdown option is selected.
    
}


$(document).ready(initialize);
