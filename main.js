'use strict';

$(document).ready(() => {

  var apiURL = 'https://api.wunderground.com/api/d32ba52127cb11ec/';
  var currentConditions;
  var fourDayForecast;
  fetchFromAPI('autoip', 'autoip')

  $('#search').click(update);
  $('#location').on('keypress', (e) => {
    if (e.charCode === 13) update();
  });
  $('#show-temp').click(showTemp);
  $('#show-pop').click(showPop);

  function update() {
    let location = getLocation();
    console.log('location:', location);
    fetchFromAPI(location, 'current');
    fetchFromAPI(location, 'forecast');
    $('#location').focus();
  }

  function fetchFromAPI(location, type) {
    if (isNaN(+location) && location !== 'autoip') {
       location = location.slice(-2).replace(/ /, '_') + '/' + location.slice(0,-4);
    }
    var path;
    if (type === 'current') {
      path = 'geolookup/conditions/q/';
    } else if (type === 'forecast') {
      path = 'forecast/q/';
    } else if (type === 'autoip') {
      path = 'geolookup/q/';
    }
    console.log('fetching from:', apiURL + path + location + ".json"); // DEBUG
    $.ajax({
      url: apiURL + path + location + ".json", // assuming zipcode for now
      dataType: "jsonp",
      success: (parsed_json) => {
        try {

          if (type === 'current') {
            currentConditions = parsed_json;
            updateCurrentWeather();
          } else if (type === 'forecast') {
            fourDayForecast = parsed_json['forecast']['simpleforecast']['forecastday'];
            updateWeatherForecast();
          } else if (type === 'autoip') {
            // intialize by ip address
            let city = parsed_json['location']['city'];
            let state = parsed_json['location']['state'];
            $('#location').val( city + ', ' + state );
            update();
          }

        } catch (e) {
          console.log('ERROR:', e)
          alert('invalid location');
        }
      },
      error: (promise, status, error) => {
        console.log("promise:", promise, " status:", status, " error:", error);
      }
    });
  }

  function updateCurrentWeather(location) {
    console.log('CURRENT CONDITIONS:', currentConditions);
    var city = currentConditions['location']['city'];
    var state = currentConditions['location']['state'];
    var time = currentTime();
    var temp_f = currentConditions['current_observation']['temp_f'];
    var feelslike_f = currentConditions['current_observation']['feelslike_f'];
    var icon_url = currentConditions['current_observation']['icon_url'];

    temp_f = Math.round(+temp_f);
    feelslike_f = Math.round(+feelslike_f);

    $('#city').empty().text(city + ', ' + state);
    $('#time').empty().text('at ' + time);
    $('#current-temp').empty().text(temp_f);
    $('#feels-like').empty().text(feelslike_f);
    $('#icon').empty().append( $('<img>').attr('src', icon_url) );
  }

  function updateWeatherForecast(location) {
    console.log('4-DAY FORECAST:', fourDayForecast);

    fourDayForecast = fourDayForecast.map((day) => {
      var weather = {};
      weather.low = day.low;
      weather.high = day.high;
      weather.icon = day.icon;
      weather.precip_prob = day.pop;
      weather.icon_url = day.icon_url;
      weather.day = day.date.monthname_short + ' ' + day.date.day;
      return weather;
    });

    showTemp.call($('#show-temp'));
    console.log('modified 4-day forecast:', fourDayForecast);
  }

  function showTemp() {
    $(this).addClass('btn-primary');
    $(this).siblings().removeClass('btn-primary');
    fourDayForecast.forEach((day, i) => {
      let $temps = $('<div>').addClass('bar');
      $temps.text('low: ' + day.low.fahrenheit + ', high: ' + day.high.fahrenheit);
      $('#day' + (i+1)).empty().append( $temps );
    });
  }

  function showPop() {
    $(this).addClass('btn-primary');
    $(this).siblings().removeClass('btn-primary');
    fourDayForecast.forEach((day, i) => {
      let $pop = $('<div>').addClass('bar');
      $pop.text(day.precip_prob + '% Chance');
      $('#day' + (i+1)).empty().append( $pop );
    });
  }

  function getLocation() {
    return $('#location').val();
  } 

  function currentTime() {
    var now = new Date();
    var hr = now.getHours();
    var min = ('00' + now.getMinutes()).slice(-2);
    return hr + ":" + min + " (your time)";
  }
});