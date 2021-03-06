// Having an issue where the auto-complete City field and the map do not
// load together. Issue may be with order of scripts and could be fixed
// with  jQuery $( document ).ready

// this function creates a new marker (point) (do we need to return it?)

// while a user has not clicked 'save point' change the marker lat-lng to the most recently clicked area on the map

let map;
let centerMap;
const addMarker = (props) => {
  new google.maps.Marker({
    position: props.coords,
    map: map,
    content: props.infoWindow
  });
};

function initMap() {
  window.navigator.geolocation.getCurrentPosition(
    (geoLocPos) => {
      const { latitude, longitude } = geoLocPos.coords;

      // getCurrentPosition is successful
      map = new google.maps.Map(document.getElementById('map'), {
        center: {
          lat: latitude,
          lng: longitude,
        },
        zoom: 13,
      });

      // event listener for user clicking on map
      map.addListener('click', function (event) {
        addMarker({ coords: event.latLng });

        const { lat, lng } = event.latLng;
        $('#point-latitude').attr('value', lat);
        $('#point-longitude').attr('value', lng);
      });

    },

    () => {
      // if getCurrentPosition is not successful (if user blocks location tracking)
      map = new google.maps.Map(document.getElementById('map'), {
        center: {
          lat: 0,
          lng: 0,
        },
        zoom: 1,
      });
    }
  );
}



$(document).ready(() => {
  // get all marker for single map

  const mapId = $('#point-form').data('mapid');
  $.get(`/api/pin/${mapId}`).then(({ pins }) => {

    for (const marker of pins) {
      centerMap = {
        lat: Number(marker.latitude),
        lng: Number(marker.longitude),
      };
      const coords = {
        lat: Number(marker.latitude),
        lng: Number(marker.longitude),
      };
      const infoWindow = new google.maps.InfoWindow({
        position: { lat: Number(marker.latitude), lng: Number(marker.longitude) },
        map: map,
        content: `<p style="font-weight: bold; text-align: center; margin-bottom: 2px">${marker.title}</p>
        <img class="infoWindow" src="${marker.image_url}" width="75" height="75">
        `
      });
      addMarker({ coords, infoWindow });
    }


  });

});


// create map
$('.new-map').submit(function (event) {
  event.preventDefault();
  $('.title-error').remove();
  $('.description-error').remove();
  $('.city-error').remove();
  const titleText = $('#new-title-text').val();
  const descriptionText = $('#new-description-text').val();
  const cityText = $('#new-city-text').val();
  const imgText = $('#new-image-URL').val();
console.log(imgText)
  if (titleText === '') {
    return $('#new-title-container').append(
      $('<p>').addClass('title-error').text("Title can't be blank")
    );
  } else if (descriptionText === '') {
    return $('#new-description-container').append(
      $('<p>').addClass('description-error').text('Description is missing')
    );
  } else if (cityText === '') {
    return $('#new-city-container').append(
      $('<p>').addClass('city-error').text("City is can't be blank")
    );
  } else if(imgText === '') {
    document.getElementById('new-image-URL').value = 'https://picsum.photos/200/300';
  }
  const serializedData = $(this).serialize();
  $.post('/api/map/new', serializedData).then(({ mapID }) => {
    console.log('mapID', mapID);
    window.location.href = window.location.origin + '/api/map/' + mapID;
  });
});

// Create new pin
$('#point-form').submit(function (event) {
  event.preventDefault();
  $('.pin-title-error').remove();
  $('.pin-desc-error').remove();
  $('.pin-lat-long-error').remove();
  const pinTitleText = $('#point-title').val();
  const pinDescText = $('#point-description').val();
  const pinImgText = $('#point-image').val();
  const pinLatText = $('#point-latitude').val();
  const pinLongText = $('#point-longitude').val();

  if (pinTitleText === '') {
    return $('#pin-title-container').append(
      $('<p>').addClass('pin-title-error').text("Title can't be blank")
    );
  } else if (pinDescText === '') {
    return $('#pin-description-container').append(
      $('<p>').addClass('pin-desc-error').text("Description can't be blank")
    );
  } else if (pinImgText === '') {
    // pinImgText = 'https://thumbs.dreamstime.com/b/no-image-available-icon-flat-vector-no-image-available-icon-flat-vector-illustration-132482953.jpg';
    return document.getElementById("point-image").value = 'https://www.coburns.com/images/no-image.png?width=500&height=500&mode=max'
  } else if (pinLatText === '' || pinLongText === '') {
    return $('#pin-image-container').append(
      $('<p>')
        .addClass('pin-lat-long-error')
        .text('Please select a point on map')
    );
  }
  const serializedData = $(this).serialize();
  console.log(serializedData);
  const mapId = $('#point-form').data('mapid');

  $.post(`/api/pin/${mapId}`, serializedData).then((response) => {
    $('.markers').append(`
    <li>
          <div>${this.title.value}</div>
          <div>${this.description.value}</div>
          <div>
            <button class="edit-point-control"
              data-pindata=${[
                response.id,
                mapId,
                this.latitude.value,
                this.longitude.value,
              ]}>Edit</button>
            <button class="delete-point-control" data-pinid=${
              response.id
            }>DELETE</button>
          </div>
        </li>
    `);
    listenForEditControl();
    window.location.href = `/api/map/${mapId}`;
  });
  $(this).children('input').val('');
});

// add  to favorite map
$('.toggle-fav').click(function () {
  const mapId = $(this).attr('data-mapid');
  console.log('fire');
  $(this).children().toggleClass('far fa-star fas fa-star added');

  const added = $(this).children().hasClass('added');

  if (added) {
    $.post('/api/map/fav', { mapId });
  } else {
    $.post('/api/map/fav/delete', { mapId });
  }
});

// event listener for user clicking Edit Point
let editFormVisible = false;
function listenForEditControl() {
  $('.edit-point-control').on('click', function (event) {
    //if this form is not showing, display it. If it is already showing for another point that was not submitted, keep showing it
    if (!editFormVisible) {
      $('#edit-point-form').slideDown('slow');
      editFormVisible = true;
    }
    // identify the point/pin that was clicked and put all data in pinid button
    let pinData = $(this).data('pindata').split(',');

    const [id, mapId, latitude, longitude] = pinData;
    //populate form with values from selected point to edit
    $('#edit-point-id').val(id);
    $('#edit-point-mapid').val(mapId);
    $('#edit-point-latitude').val(latitude);
    $('#edit-point-longitude').val(longitude);
  });
}

$('.edit-point-control').on('click', function (event) {
  //if this form is not showing, display it. If it is already showing for another point that was not submitted, keep showing it
  console.log('Edit button clicked');
  if (!editFormVisible) {
    $('#edit-point-form').slideDown('slow');
    editFormVisible = true;
  }
  // identify the point/pin that was clicked and put all data in pinid button
  let pinData = $(this).data('pindata').split(',');

  const [id, mapId, latitude, longitude] = pinData;
  //populate form with values from selected point to edit
  $('#edit-point-id').val(id);
  $('#edit-point-mapid').val(mapId);
  $('#edit-point-latitude').val(latitude);
  $('#edit-point-longitude').val(longitude);
});

listenForEditControl();

// Cancel edit form

$('#cancel-edit').click(function () {
  editFormVisible = false;
  $('#edit-point-form').slideUp('slow');
});

// event listener for Submit Edit Point
$('#edit-form').submit(function (event) {
  event.preventDefault();
  editFormVisible = false;
  $('#edit-point-form').slideUp('slow');

  const serializedData = $(this).serialize();
  // how are we getting map id and pin id

  const pinId = $('#edit-point-id').val();
  const mapId = $('#point-form').data('mapid');
  // needs to go to route for pinId, not mapId
  // document.getElementById("#edit-form").reset();
  $.post(`/api/pin/${mapId}/${pinId}`, serializedData).then(() => {
    window.location.href = window.location.origin + '/api/map/' + mapId;
  });
});

$('.delete-point-control').on('click', function (event) {
  const mapId = $('#point-form').data('mapid');
  let pinId = $(this).data('pinid');
  $.post(`/api/pin/${pinId}/delete`).then(() => {
    console.log(mapId);
    window.location.href = window.location.origin + '/api/map/' + mapId;
  });
});

// toggle create marker form
$('.toggle-form').hide();
$('.add-marker').click(function () {
  $('.toggle-form').slideToggle(1000);
});

// delete map
$('.delete-map-btn').click(function () {
  const mapId = $(this).attr('data-mapid');
  $.post(`/api/map/${mapId}/delete`).then((result) => {
    window.location.href = '/api/map/allmaps';
  });
});
