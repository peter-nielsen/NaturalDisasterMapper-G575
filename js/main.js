/* Script by Jacob P. Hrubecky, David J. Waro, Peter Nielsen, 2017 */

function initialize(){
	getData();
};

// Title
$("#title").append("Natural Disaster Mapper");



// sets map element and its properties
function createMap() {

	var mymap = L.map('mapid', {
		//layers: [totalEventsOverlay]
	}).setView([37.0866, -115.00], 5);

	mymap.setMaxBounds([
		[0, -200],
		[75, -20],
	]).setMinZoom(3);

	// tile layer
	L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	}).addTo(mymap);

		//add navigation bar to the map
	L.control.navbar().addTo(mymap);

	// 1. getData(mymap);
	layers(mymap);
	getOverlayData(mymap);

}; // close to createMap



// function to add the different geojson layers
function layers(mymap) {

	// var events = new L.GeoJSON.AJAX("data/county_events.geojson");
	// events.addTo(mymap);

	var states = new L.GeoJSON.AJAX("data/states_excluding_SW.geojson", {style: statesStyle});
	states.addTo(mymap).bringToBack();

	var swStates = new L.GeoJSON.AJAX("data/sw_states.geojson", {style: swStyle});
	swStates.addTo(mymap).bringToFront();

	var counties = new L.GeoJSON.AJAX("data/counties.geojson", {style: swStyle}).bringToBack();

	var events = $.ajax("data/County_events.geojson", {
		dataType: "json",
		success: function(response){

			// creating an array of attributes
			var attributes = processData(response);

			// call function to create proportional symbols
			createPropSymbols(response, mymap, attributes);
			createSequenceControls(mymap, attributes);
			createLegend(mymap, attributes);
		}
	});


	mymap.on('zoomend', function (e) {
		console.log("zoom: " + mymap.getZoom());
	    changeLayers(mymap, swStates, counties);
	});
}; // close to layers function




function changeLayers(mymap, swStates, counties) {
	if (mymap.getZoom() >= 7) {
		mymap.removeLayer(swStates);
		counties.addTo(mymap).bringToBack();
	} else if (mymap.getZoom() < 7) {
		mymap.removeLayer(counties);
		swStates.addTo(mymap).bringToBack();
	};
};


// assigns the respected geojsons to the apropriate variables
function getData(mymap) {

	d3.queue()
			.defer(d3.json, "data/state_events.geojson") // load attributes from csv
			.defer(d3.json, "data/county_events.geojson")
			.defer(d3.csv, "data/county_events.csv")
			.defer(d3.json, "data/counties.geojson")
			.defer(d3.json, "data/sw_states.geojson")
			.defer(d3.json, "data/states_excluding_SW.geojson")
			.await(callback);

	// if (mymap.getZoom() >= 7) {
	// 		eventLayer = "data/county_events.geojson";
	// } else if (mymap.getZoom() < 7 ) {
	// 		eventLayer = "data/state_events.geojson";
	// }

}; // close to getData

function callback(error, csvData){
    createMap();
 		stateGraph('data/state_events.csv');
};

// styling for more SW Region
function swStyle() {
	return {
		fillColor: 'white',
		weight: 2,
		opacity: 1,
		color: 'white',
		fillOpacity: 0,
	};
};

// styling for more opaque geojson
function statesStyle() {
	return {
		fillColor: 'gray',
		weight: 2,
		opacity: 1,
		color: 'white',
		fillOpacity: 0.7
	};
};


function events(){

};

// build an attributes array for the data
function processData(data){

  // empty array to hold attributes
  var attributes = [];

  // properties of the first feature in the dataset
  var properties = data.features[0].properties;

  // push each attribute name into attributes array
  for (var attribute in properties){

    // // only take attributes with population values
    // if (attribute.indexOf("Avalanche") > -1){
    //   attributes.push(attribute);
    // } else if (attribute.indexOf("Blizzard") > -1){
    //   attributes.push(attribute);
		// } else if (attribute.indexOf("Drought") > -1){
    //   attributes.push(attribute);
		// } else if (attribute.indexOf("Excessive_Heat") > -1){
    //   attributes.push(attribute);
		// } else if (attribute.indexOf("Extreme_Cold") > -1){
    //   attributes.push(attribute);
		// } else if (attribute.indexOf("Tornado") > -1){
    //   attributes.push(attribute);
		// } else if (attribute.indexOf("Wildfire") > -1){
    //   attributes.push(attribute);
		// } else
		if (attribute.indexOf("Total") > -1){
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
    pointToLayer: function(feature, latlng){
      return pointToLayer(feature, latlng, attributes);
    }
  }).addTo(mymap);

  // call search function
  search(mymap, data, proportionalSymbols)

}; // close to createPropSymbols



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
  options.radius = calcPropRadius((attValue) * 2);

  // assign the marker with the options styling and using the latlng repsectively
  var layer = L.circleMarker(latlng, options);

	// creates a new popup object
  var popup = new Popup(feature.properties, layer, options.radius);

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
		click: function(){
			// click function code
		}
  });

  // return the circle marker to the L.geoJson pointToLayer option
  return layer;

}; // close to pointToLayer function




//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {

  //scale factor to adjust symbol size evenly
  var scaleFactor = 10;

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
      mymap.setView(latlng, 8);

    } // close to moveToLocation
  }); // close to var searchLayer

  // add the control to the map
  mymap.addControl(searchLayer);

}; // close to search function




// Create new sequence controls
function createSequenceControls(mymap, attributes, index){

  // position the sequence control in the bottom left of the map
  var SequenceControl = L.Control.extend({
    options: {
      position: 'bottomleft'
    },

    onAdd: function (mymap) {

      // create the control container div with a particular class name
      var container = L.DomUtil.create('div', 'sequence-control-container');

      //creates range input element (slider)
      $(container).append('<input class="range-slider" type="range">');

      //add forward and reverse buttons
      $(container).append('<button class="skip" id="reverse" title="Reverse"><b><</b></button>');
      $(container).append('<button class="skip" id="forward" title="Forward"><b>></b></button>');

      //turn off any mouse event listeners on the sequence control
      $(container).on('mousedown dblclick', function(e){
        L.DomEvent.stopPropagation(e);
      });

      return container;

    } // close to onAdd
  }); // close to var SequenceControl

  // add the Sequence Control to the map
  mymap.addControl(new SequenceControl());

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

    // update the proportional symbols based off of the skip buttons clicked
    updatePropSymbols(mymap, attributes[index]);

  }); // close to '.skip' click function

}; // close to createSequenceControls function


// var to create a dropdown menu
function dropdown(mymap, attributes) {

	var dropdown = L.DomUtil.create('div', 'dropdown');
	dropdown.innerHTML = 'Select an Event<select><option value="stateTotalEventsLayer">Total Events</option><option>Avalanche</option>'+
	'<option>Blizzard</option><option value="stateDroughtsLayer">Drought</option><option>Excessive Heat</option>'+
	'<option>Extreme Cold/ Wind Chill</option><option>Tornado</option><option value="statesWildfiresLayer">Wildfire</option></select>';



	$("#left-pane").append(dropdown);

}


//Get data using jquery ajax method
function getOverlayData(mymap, attributes) {

	$.ajax("data/state_events.geojson", {
		dataType: "json",
		success: function (response) {

			//marker style options are set to a variable
			var geojsonMarkerOptions = {
				radius: 10,
				fillColor: "#6495ED",
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

			//leaflet overlay control to add the overlay data
			var totalEventsOverlay = {
			"<span class = 'overlayText'>State Total Events</span>": stateTotalEventsLayer
			};
			var avalanches = {
			"<span class = 'overlayText'>Avalanches</span>": stateAvalanchesLayer
			};
			var droughts = {
			"<span class = 'overlayText'>Droughts</span>": stateDroughtsLayer
			};
			var wildfires = {
			"<span class = 'overlayText'>Wildfires</span>": stateWildfiresLayer
			};



			var layerOptions = {
    		"Total Events": stateTotalEventsLayer,
				"Avalanche": stateAvalanchesLayer,
				"Drought": stateDroughtsLayer,
    		"Wildfire": stateWildfiresLayer,
			};


			//adding the control to the map
			var j = L.control.layers(layerOptions).addTo(mymap);

			// // call to create the dropdown menu
			// dropdown(mymap, attributes);
			//
			// $(".dropdown select").on("change", function(g) {
			// 	console.log("target value: " + g.target.value);
			//
			// 	var milk = g.target.value;
			// 	console.log(milk);
			//
			//
			//
			// 	console.log(stateDroughtsLayer);
			// 	console.log(cabbage);
			// 	console.log(cabbage.Droughts);
			// 	console.log(cabbage.value);
			// 	console.log("boolean: " + g.target.value == cabbage[1]);
			// });

		}

	});
};


// function to create the Proportional Symbols map legend
function createLegend(mymap, attributes){

      $('#left-pane').append('<div id="temporal-legend" >');

      // start attribute legend svg string
      var svg = '<svg id="attribute-legend" width="200px" height="500px">';

      //object to base loop on
      var circles = {
        max: 65,
        mean: 95,
        min: 125
      };

      // loop to add each circle and text to svg string
      for (var circle in circles){

        //c ircle string
        svg += '<circle class="legend-circle" id="' + circle + '" fill="#FFD700" fill-opacity="0.8" stroke="#000000" cx="70"/>';

        // text string
        svg += '<text id="' + circle + '-text" x="150" y="' + circles[circle] + '"></text>';
      };

      // close svg string
      svg += "</svg>";

			// add attribute legend svg to container
      $('#left-pane').append(svg);

  updateLegend(mymap, attributes[0]);

}; // close to createLegend function



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




// updates the temporal legend with new content
function updateLegend(mymap, attribute){

  var year = attribute.split("_")[2]; // split on the 3rd _

	if (year[0] !== "2") {
		year = attribute.split("_")[1];
	}

  var eventType = attribute.split("_")[0] + " "; // split on the 4th _

  // content to be added to the legend
  var legendContent = "<b><br>Number of " + eventType + "Events</br> in " + year + ".</b>";

  // add in the text to the legend div
  $('#temporal-legend').html(legendContent);

  // get the max, mean, and min values as an object
  var circleValues = getCircleValues(mymap, attribute);

  // searches through circleValues array for instances where key shows up
  for (var key in circleValues){

       //get the radius
       var radius = calcPropRadius((circleValues[key]) * 2);

       // assign the cy and r attributes
       $('#' + key).attr({
           cy: 130 - radius,
           r: radius
       });

       // add legend text for the circles
       $('#' + key + '-text').text(Math.round((circleValues[key])));
   };
};




// function to resize proportional symbols according to new attribute values
function updatePropSymbols(mymap, attribute){

  // for each layer of the map
  mymap.eachLayer(function(layer){

    // if the layer contains both the layer feature and properties with attributes
    if (layer.feature && layer.feature.properties[attribute]){

      // access feature properties
      var props = layer.feature.properties;

      // subtract one because all pop growths will be at 1._ _ something, so we
      // want more variation
      var attValue = Number(props[attribute]);

      // multiply by 1000 to give us variation between the originally small growth
      // numbers
      var radius = calcPropRadius(attValue * 2);

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


// create graph for the initial state view
function stateGraph(csvData){
    // svg to contain chart
    var vis = d3.select('#right-pane')
        .append('svg')
        .attr('width', window.innerWidth * 0.15)
        .attr('height', window.innerWidth * 0.15)
        .style('right', window.innerWidth * .01)
        .attr("class", "chart");

    // lines for line graph
    var lines = vis.selectAll('.bars')
        .data(csvData)
        .enter()
        .append()
}

$(document).ready(initialize);
