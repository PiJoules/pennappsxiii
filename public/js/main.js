var geocoder;
var map;
function initMap() {
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('category-transactions-map'), {
		// San Francisco default
		center: {lat: 37.773972, lng: 	-122.431297},
		zoom: 8,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});
}

$(document).ready(function() {
	$('[data-toggle="tooltip"]').tooltip();
	$('#plaid-link-button').addClass('btn btn-primary btn-sm');

	var markers = [];

	function addInfoWindow(marker, transaction) {
		var category = transaction.category.length > 1 ? transaction.category[1] : transaction.category[0];
		var content =
			'<div>' + 
				'<b>Merchant: </b>' + transaction.name + '</br>' +
				'<b>Amount: </b>$' + transaction.amount + '</br>' +
				'<b>Date: </b>' + transaction.date + '</br>' +
				'<b>Purchase Type: </b>' + category + 
			'</div>'

		marker.info = new google.maps.InfoWindow({
		  content: content
		});

		google.maps.event.addListener(marker, 'mouseover', function() {
		  this.info.open(map, this);
		});

		google.maps.event.addListener(marker, 'mouseout', function() {
		  this.info.close();
		});
	}

	function addMarker(transaction, location, centerHere) {
		centerHere = centerHere || false;
		var marker = new google.maps.Marker({
			position: location,
			map: map
		});
		if (centerHere) {
			map.setCenter(location);
		}
		markers.push(marker);
        addInfoWindow(marker, transaction);
	}

	function addMarkerByAddress(transaction, address, centerHere) {
		centerHere = centerHere || false;
		geocoder.geocode( { 'address': address}, function(results, status) {
	      if (status == google.maps.GeocoderStatus.OK) {
	      	if (centerHere) {
		        map.setCenter(results[0].geometry.location);
	      	}
	        var marker = new google.maps.Marker({
	            map: map,
	            position: results[0].geometry.location
	        });
	        markers.push(marker);
	        addInfoWindow(marker, transaction);
	      } else {
	        console.log("Geocode was not successful for the following reason: " + status);
	      }
	    });
	}

	function setMapOnAll(map) {
	  for (var i = 0; i < markers.length; i++) {
	    markers[i].setMap(map);
	  }
	}

	function clearMarkers() {
	  setMapOnAll(null);
	}

	function deleteMarkers() {
	  clearMarkers();
	  markers = [];
	}

	$('.openMapCategoryModal').on('click', function(){
		deleteMarkers();

		var category_data = $(this).data('category-data');

		var firstResultFound = false;
		for (var i = 0; i < category_data.transactions.length; i++){
			var transaction = category_data.transactions[i];
			if (transaction.amount <= 0) continue;
			if (transaction.meta && transaction.meta.location) {
				if (transaction.meta.location.coordinates && transaction.meta.location.coordinates.lat && transaction.meta.location.coordinates.lon) {
					var latLng = {lat: transaction.meta.location.coordinates.lat, lng: transaction.meta.location.coordinates.lon};
					if (!firstResultFound) {
						addMarker(transaction, latLng, true);
						firstResultFound = true;
					} else {
						addMarker(transaction, latLng);
					}
				} else if ((transaction.meta.location.address || transaction.meta.location.city) && transaction.meta.location.state) {
					var address = '';
					if (transaction.meta.location.address && transaction.meta.location.city) {
						address = transaction.meta.location.address + ', ' + transaction.meta.location.city + ', ' + transaction.meta.location.state;
					} else {
						if (transaction.meta.location.address) address = transaction.meta.location.address + ', ' + transaction.meta.location.state;
						else address = transaction.meta.location.city + ', ' + transaction.meta.location.state;
					}

					if (!firstResultFound) {
						addMarkerByAddress(transaction, address, true);
					} else {
						addMarkerByAddress(transaction, address, false);
					}
				}
			}
		}
		$('#categoryMapModal').modal('show');
	});

	var transactionsTableList = $('#category-transactions-table-list');

	$('.openListCategoryModal').on('click', function(){
		transactionsTableList.empty();

		var category_data = $(this).data('category-data');

		for (var i = 0; i < category_data.transactions.length; i++){
			var transaction = category_data.transactions[i];
			if (transaction.amount <= 0) continue;
			var category = transaction.category.length > 1 ? transaction.category[1] : transaction.category[0];
			var date = new Date(transaction.date);
			var content =
			'<tr>' + 
				'<th>' + transaction.name + '</th>' +
				'<th>$' + transaction.amount + '</th>' +
				'<th>' + transaction.date + '</th>' +
				'<th>' + category + '</th>' +
			'</tr>'

			transactionsTableList.append(content);
		}

		$('#categoryListModal').modal('show');
	});

	$('#categoryMapModal').on('shown.bs.modal', function () {
	    google.maps.event.trigger(map, "resize");
	    var bounds = new google.maps.LatLngBounds();
		for(i = 0 ;i < markers.length; i++) {
			bounds.extend(markers[i].getPosition());
		}

		if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
	       var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
	       var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
	       bounds.extend(extendPoint1);
	       bounds.extend(extendPoint2);
	    }

		map.fitBounds(bounds);
	});
});