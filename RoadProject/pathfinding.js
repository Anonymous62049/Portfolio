class PriorityQueue{ //Will be updated to a min heap at some point
    constructor(){
        this.queue = [];
    }
    enqueue(element, priority){
        this.queue.push({element, priority});
        this.queue.sort((a, b) => a.priority - b.priority); //Sort ascending
    }
    dequeue(){
        if(this.isEmpty()) return null;
        return this.queue.shift().element;
    }
    isEmpty(){
        return this.queue.length === 0;
    }
    clear(){
        this.queue = [];
    }
}
var mapCoords = [-33.9130293,151.2];
var mapRadius = 20000;
var map = L.map('map').setView(mapCoords, 11); //Initialises Map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
}).addTo(map); //Adds the map imagery to the map
var latitudeOffset = mapRadius / 111000; // 111 km per degree latitude
var longitudeOffset = mapRadius / (111000 * Math.cos(mapCoords[0] * Math.PI / 180));

// Calculate the square's corners
var squareCorners = [
    [mapCoords[0] + latitudeOffset, mapCoords[1] - longitudeOffset], // Top-left
    [mapCoords[0] + latitudeOffset, mapCoords[1] + longitudeOffset], // Top-right
    [mapCoords[0] - latitudeOffset, mapCoords[1] + longitudeOffset], // Bottom-right
    [mapCoords[0] - latitudeOffset, mapCoords[1] - longitudeOffset]  // Bottom-left
];

// Create a square (polygon) and add it to the map
var square = L.polygon(squareCorners, {
    color: '#2396e8',      // Border color of the square
    fillColor: '#2396e880', // Fill color of the square
    fillOpacity: 0.5   // Fill opacity of the square
}).addTo(map);
var edges;
const edgeMap = new Map();
var nodes;
var destination;
var startNode;
var nextRoads = new PriorityQueue();
$.getJSON('./RoadProject/nodes.json', function(data){ //Load the node JSON data
    nodes = data.features;
});
$.getJSON('./RoadProject/edges.json', function(data) { // Load the edges JSON data
    edges = data.features;
    loadEdgeMap(); //Fills hashmap with roads
    loadQueue(nodes[50].geometry.coordinates.toString()); //Loads roads connected to starting node into priority queue
});

function loadQueue(startCoords){ //Queues starting roads
    edgeMap.get(startCoords).forEach((road) =>{
        nextRoads.enqueue(road, road.properties.length);
    });
}
var visited = new Map();
var roadsToShow = [];
var found = false;
function dijkstraShortestPath(){ //Finds shortest path
    for(let i = 0; i <= 1; i++){ //To speed up animation
        if(found) return;
        road = nextRoads.dequeue();
        if(!road) return;
        roadsToShow.push(road); //Adds road to the array to be displayed on the map
        var roadCoords = road.geometry.coordinates;
        var endCoords = roadCoords[roadCoords.length - 1][0] + "," + roadCoords[roadCoords.length - 1][1]; //Gets last pair of coordinates
        var endNode = visited.get(endCoords);
        if(endNode){ //If the node has been visited
            requestAnimationFrame(() => {showRoad(cityRoadsLayer, 'blue', roadsToShow)}); //Show road
            requestAnimationFrame(dijkstraShortestPath);
            return;
        }
        var roadStart = visited.get(roadCoords[0][0] + "," + roadCoords[0][1]); //Gets the node the road started at
        var distance = roadStart ? roadStart[1] + road.properties.length : road.properties.length; //Gets the total distance from the start point to the end of the road
        var path = roadStart ? [...roadStart[0], road] : [road]; //Gets and updates the path that's been taken to get to the node at the end of the road
        visited.set(endCoords,[path, distance]);
        if(endCoords == destination.geometry.coordinates){ //If destination is reached
            found = true;
            for(let i = 0; i < path.length; i++) requestAnimationFrame(() => {showRoad(shortestPathLayer, 'red', path, 3, 0)}); //Show shortest path
            return;
        }
        edgeMap.get(endCoords).forEach((newRoad) => { //Queue roads connecting to the node at the end of the current road
            roadCoords = newRoad.geometry.coordinates;
            if(road.id != newRoad.id) nextRoads.enqueue(newRoad, ((distance + newRoad.properties.length) / document.getElementById('shortDist').value)
            + document.getElementById('euclDist').value * getEuclidianDistance(roadCoords[roadCoords.length - 1], destination.geometry.coordinates) 
            + document.getElementById('turns').value * (Math.abs(getCoordsAngle(roadCoords[roadCoords.length - 1], path[path.length - 1].geometry.coordinates[0]))
            - Math.abs(getCoordsAngle(path[path.length - 1].geometry.coordinates[path[path.length - 1].geometry.coordinates.length - 2], path[path.length - 1].geometry.coordinates[path[path.length - 1].geometry.coordinates.length - 1])))
            - document.getElementById('roadLength').value * newRoad.properties.length);
        });
        requestAnimationFrame(() => {showRoad(cityRoadsLayer, 'blue', roadsToShow)}); //Show road
        requestAnimationFrame(dijkstraShortestPath);
    }
}
var cityRoadsLayer = L.layerGroup().addTo(map);
var shortestPathLayer = L.layerGroup().addTo(map);
function showRoad(layer, color, arr, thickness = 1, z_index = 1){ //Displays line on map
    var road = arr.pop();
    L.geoJSON(road, {
        style: {color: color, weight:  thickness, zIndex: z_index}
    }).addTo(layer);
}
function loadEdgeMap(){
    for(let i = 0; i < edges.length; i++){
        var coords = edges[i].geometry.coordinates; //The coordinate array for the road
        //Return the value in the hashmap for the first set of coordinates in the list. These coordinates will correspond to a node at the start of the road
        var node = edgeMap.get(coords[0][0] + "," + coords[0][1]); 
        if(node) node.push(edges[i]); //Append the new edge to the edges already at those coordinates
        edgeMap.set(coords[0][0] + "," + coords[0][1], node ? node : [edges[i]]); //Update edgemap
        //Return the value in the hashmap for the last set of coordinates in the list. These coordinates will correspond to a node at the end of the road
        node = edgeMap.get(coords[coords.length - 1][0] + "," + coords[coords.length - 1][1]);
        if(node) node.push(edges[i]);
        edgeMap.set(coords[coords.length - 1][0] + "," + coords[coords.length - 1][1], node ? node : [edges[i]]);
    }
}
var greenIcon = new L.Icon({ //Design for green start marker
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
var redIcon = new L.Icon({ //Design for red start marker
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
var settingPoint;
var startMarker;
var endMarker;
map.on('click', function(e){ //Sets start and end markers
    if(settingPoint == "") return;
    var coord = e.latlng;
    var closestNode = getClosestNode(coord.lat, coord.lng);
    document.body.classList = "";
    if(settingPoint == 'start') {
        nextRoads.clear();
        loadQueue(closestNode.geometry.coordinates.toString());
        if(startMarker != null) map.removeLayer(startMarker);
        startNode = closestNode;
        startMarker = L.marker([closestNode.geometry.coordinates[1], closestNode.geometry.coordinates[0]], {
            icon: greenIcon
        }).addTo(map);
        settingPoint = "";
        return;
    }
    else if(settingPoint =='end') destination = closestNode;
    if(endMarker != null) map.removeLayer(endMarker);
    endMarker = L.marker([closestNode.geometry.coordinates[1], closestNode.geometry.coordinates[0]], {
        icon: redIcon
    }).addTo(map);
    settingPoint = "";
});
function getClosestNode(lat, lng){ //Gets node closest to coordinates
    var closestNode;
    var smallestDist = Infinity;
    nodes.forEach((node) => {
        var difference = getEuclidianDistance(node.geometry.coordinates, [lng, lat]);
        if(difference < smallestDist){
            smallestDist = difference;
            closestNode = node;
        }
    });
    return closestNode;
}
function getEuclidianDistance(coordsA, coordsB){ //Gets distance between two coords using coordinates
    return Math.abs(coordsB[0] - coordsA[0] + coordsB[1] - coordsA[1]) > 0 ? Math.sqrt(Math.pow(coordsB[0] - coordsA[0], 2) + Math.pow(coordsB[1] - coordsA[1], 2)) : 0;
}
function getCoordsAngle(coordsA, coordsB){ //Gets angle between two coords
    return (Math.atan2(coordsA[0] - coordsB[0], coordsA[1] - coordsB[1])) * 180 / Math.PI;
}
function resetMap(){
    if(roadsToShow.length != 0 && !found){
        alert("Cannot reset while running");
        return;
    };
    map.removeLayer(cityRoadsLayer);
    map.removeLayer(shortestPathLayer);
    cityRoadsLayer = L.layerGroup().addTo(map);
    shortestPathLayer = L.layerGroup().addTo(map);
    found = false;
    nextRoads.clear();
    loadQueue(startNode.geometry.coordinates.toString());
    visited = new Map();
    roadsToShow = [];
    map.removeLayer(startMarker);
    map.removeLayer(endMarker);
}
function showHideLayer(layer, object){
    if(!object.checked) map.removeLayer(layer);
    else layer.addTo(map);
}
var prevStartDistFactor = 100;
var prevEuclidianFactor = 700;
var prevTurnsFactor = 0.007;
var prevLengthFactor = 0.005;
changeMode();
function changeMode(){
    shortDist = document.getElementById("shortDist");
    euclDist = document.getElementById("euclDist");
    turns = document.getElementById("turns");
    roadLength = document.getElementById("roadLength");
    if(document.getElementById("a*").checked){
        document.getElementById("factors").style.visibility = "visible"
        shortDist.value = prevStartDistFactor;
        euclDist.value = prevEuclidianFactor;
        turns.value = prevTurnsFactor;
        roadLength.value = prevLengthFactor;
    }
    else{
        document.getElementById("factors").style.visibility = "hidden";
        prevStartDistFactor = shortDist.value;
        prevEuclidianFactor = euclDist.value;
        prevTurnsFactor = turns.value;
        prevLengthFactor = roadLength.value;
        shortDist.value = 1;
        euclDist.value = 0;
        turns.value = 0;
        roadLength.value = 0;
    }
}