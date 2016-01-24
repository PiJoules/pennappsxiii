var geocoder;
var map;
var dealsMap;

var dealsMarkers = [];

var auth = {
    consumerKey: "afUNacv8KuTBj9EynqAuIQ",
    consumerSecret: "YrryIBhOqGwz6Wa7EgIiOodGd4M",
    accessToken: "g8DUAF8u1_zrTOg7cf0AZftHLrsBWqHl",
    accessTokenSecret: "sn4_a6NR7zfj4ec8VfGEWX5JgXM",
    serviceProvider: {
        signatureMethod: "HMAC-SHA1"
    }
};

function getBusinesses(near, callback){
	/**
     * Sort by the average prices of deals from the business
     */
    function sortByPrice(businesses){
        function avgOptionsPrice(options){
            var sum = 0;
            options.forEach(function(option){
                sum += option.price;
            });
            return sum / options.length;
        }

        function avgDealPrice(deals){
            var sum = 0;
            deals.forEach(function(deal){
                sum += avgOptionsPrice(deal.options);
            });
            return sum / deals.length;
        }

        businesses.sort(function(a, b){
            return avgDealPrice(a.deals) - avgDealPrice(b.deals);
        });
    }

    var accessor = {
        consumerSecret: auth.consumerSecret,
        tokenSecret: auth.accessTokenSecret
    };	

    parameters = [
        ['location', near],
        ['limit', 20],
        ['deals_filter', true],
        ['callback', 'cb'],
        ['oauth_consumer_key', auth.consumerKey],
        ['oauth_consumer_secret', auth.consumerSecret],
        ['oauth_token', auth.accessToken],
        ['oauth_signature_method', 'HMAC-SHA1']
    ];

    var message = {
        'action': 'http://api.yelp.com/v2/search',
        'method': 'GET',
        'parameters': parameters
    };

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);

    var parameterMap = OAuth.getParameterMap(message.parameters);
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature)

    $.ajax({
        'url': message.action,
        'data': parameterMap,
        'cache': true,
        'dataType': 'jsonp',
        'jsonpCallback': 'cb',
        'success': function(data, textStats, XMLHttpRequest) {
            // data as json
            var businesses = data.businesses;
            sortByPrice(businesses);
            callback(businesses);
        }
    });
}

function setDealsMapOnAll(map) {
  for (var i = 0; i < dealsMarkers.length; i++) {
    dealsMarkers[i].setMap(map);
  }
}

function clearDealsMapMarkers() {
  setDealsMapOnAll(null);
}

function deleteDealsMapMarkers() {
  clearDealsMapMarkers();
  dealsMarkers = [];
}

function initMap() {
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('category-transactions-map'), {
		// San Francisco default
		center: {lat: 37.773972, lng: 	-122.431297},
		zoom: 8,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});

	dealsMap = new google.maps.Map(document.getElementById('deals-map'), {
		// San Francisco default
		center: {lat: 37.773972, lng: 	-122.431297},
		zoom: 8,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});

	var input = /** @type {!HTMLInputElement} */(document.getElementById('pac-input'));

	dealsMap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

	var autocomplete = new google.maps.places.Autocomplete(input);
	autocomplete.bindTo('bounds', dealsMap);

	autocomplete.addListener('place_changed', function() {
		var place = autocomplete.getPlace();
		if (!place.geometry) {
		  return;
		}

		deleteDealsMapMarkers();

		getBusinesses(place.formatted_address, function(businesses){
			for (var i = 0; i < businesses.length; i++) {
				var business = businesses[i];

				var latLng = null;
				if (business.location && business.location.coordinate && business.location.coordinate.latitude && business.location.coordinate.longitude) {
					latLng = new google.maps.LatLng(business.location.coordinate.latitude, business.location.coordinate.longitude);
				}

				if (!latLng) {
					continue;
				}

				var marker = new google.maps.Marker({
					position: latLng,
					map: dealsMap
				});
				dealsMarkers.push(marker);

				var address = null;
				if (business.location && business.location.address && business.location.address.length > 0) {
					address = business.location.address[0];
				}

				var content = '<div class="info-window"> <b>Business: </b>' + business.name + '</br>';
				if (address){
					content += '<b>Location: </b>' + address + '</br>';		
				}
				content += '<b>Deals: </b></br>';
				for (var j = 0; j < business.deals.length; j++){
					if (j + 1 == business.deals.length){
						content += '<p>' + business.deals[j].title + '</p>';
					} else {
						content += '<p>' + business.deals[j].title + '</p></br>';
					}
				}
				if (business.url){
					content += '<b>Website: </b> <a target="_blank" href=' + business.url + '>Click Here</a>';
				}
				content += '</div>';
				marker.info = new google.maps.InfoWindow({
				  content: content
				});

				google.maps.event.addListener(marker, 'click', function() {
				  this.info.open(dealsMap, this);
				});
			}

			// If the place has a geometry, then present it on a map.
			if (place.geometry.viewport) {
			  dealsMap.fitBounds(place.geometry.viewport);
			} else {
			  dealsMap.setCenter(place.geometry.location);
			  dealsMap.setZoom(17);  // Why 17? Because it looks good.
			}
		});
	});
}

$(document).ready(function() {
	$('[data-toggle="tooltip"]').tooltip();

	if (user === undefined){
		console.log('Something went wrong.');
	} else {
		if (!user.plaid_access_token){
			$('#plaid-link-button').addClass('btn btn-primary btn-lg btn-link-bank');
			$('#plaid-link-button').text('Link Account');
		} else {
			$('#plaid-link-button').addClass('btn btn-primary btn-sm');
			$('#plaid-link-button').text('Update Bank Credentials');
		}
	}

	var markers = [];

	var hideSpinner = function(){
		$('#loading-home-spinner').addClass('hidden');
		$('#loading-home').removeClass('hidden');
	}

	setTimeout(hideSpinner, 1000);

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
	    if (markers.length > 0) {
		    var bounds = new google.maps.LatLngBounds();
			for(i = 0 ;i < markers.length; i++) {
				bounds.extend(markers[i].getPosition());
			}

			if (markers.length > 0 && bounds.getNorthEast().equals(bounds.getSouthWest())) {
		       var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
		       var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
		       bounds.extend(extendPoint1);
		       bounds.extend(extendPoint2);
		    }

			map.fitBounds(bounds);
		}
	});

	$('.openDealsModal').on('click', function(){
		$('#dealsModal').modal('show');
	});

	$('#dealsModal').on('shown.bs.modal', function () {
	    google.maps.event.trigger(dealsMap, "resize");
	    dealsMap.setCenter(new google.maps.LatLng(37.773972, -122.431297));
	});
});