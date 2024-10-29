/**
 * Name: Jadon Bowton
 * Date: 6/4/2023
 * Section: CSE 154 AC
 *
 * This is the javascript that handles the functionality on the quiet quarters
 * reservation side of the website. With this file, users can reserve a study room,
 * filter study rooms by time & date, descriptions, change view modes, preview different
 * rooms, reserve a specific room, view account information, and view all previous
 * reservations. This also handles the home page where information about quiet quarters
 * is present.
 */

'use strict';
(function() {

  window.addEventListener('load', init);
  let name;

  /**
   * This function runs when the page has loaded. Once the page has loaded,
   * the users information is gotten, the navigation bar is set up, the img slider
   * begins its animation, all study rooms are present upon the reserve page,
   * the filter queries are activated, and the sign out functionality is set up.
   */
  function init() {
    getUser();
    setNavBar();
    setImgSlider();
    getAll();
    compact();
    signOut();
  }

  /**
   * This function sets up the filters on the reserve page. This allows the filter
   * buttons and search inputs to be clickable and handles their information upon
   * a search.
   */
  function compact() {
    let checkbox = id('compact');
    let searchBar = id('search-bar');
    let timeBtn = id('choose');
    let natural = id('avail-filter');
    let clear = id('clear');
    id('time').value = '09:00';
    id('submit').addEventListener('click', submit);
    id('confirm').addEventListener('click', accept);
    clear.addEventListener('click', clearInput);
    searchBar.addEventListener('input', executeSearch);
    timeBtn.addEventListener('click', filterTime);
    natural.addEventListener('click', availFilter);
    checkbox.addEventListener('click', handleCheck);
  }

  /**
   * This function checks date and time search input and ensures its existence.
   * If not or if its not within open business hours, then a message is displayed.
   * Otherwise the chosen time is confirmed.
   */
  function accept() {
    let start = id('start-time').value;
    let end = id('end-time').value;
    let date = id('date').value;
    id('confirm-error').textContent = '';
    if (start && end && date) {
      let startFinal = getFinalTime(start);
      let endFinal = getFinalTime(end);
      let final = 'Time: ' + startFinal + ' to ' + endFinal + ' on ' + date;
      let invalid = 'Selected time ' + final + ' is not withing open business hours. ' +
                    'Quiet Quarter hours are 9:00 AM to 9:00 PM. Please choose another time.';
      if (checkRange(start) && checkRange(end)) {
        changeAccept(final);
      } else {
        handleError(invalid, 'confirm-error');
      }
    } else {
      const missing = 'Time and Date required for this type of query.';
      handleError(missing, 'confirm-error');
    }
  }

  /**
   * This function creates a full time including appending AM or PM to it
   * @param {String} time - Time in HH:MM format
   * @returns {String} - Returns time in HH:MM AM/PM format
   */
  function getFinalTime(time) {
    let hours = getHours(time);
    let minutes = getMinutes(time);
    let final = convertTime(hours, minutes);
    return final;
  }

  /**
   * This function confirms a reservation before submitted it locking it in. This
   * makes sure a user can't change the reservation before submitting unless they
   * close out of the room forcing them to re confirm.
   * @param {String} time - The full reservation time in HH:MM AM/PM to HH:MM AM/PM on yyyy-mm-dd
   */
  function changeAccept(time) {
    enableDisable(false, true);
    id('date').classList.add('hide');
    id('end-time').classList.add('hide');
    id('start-time').classList.add('hide');
    id('confirmed').classList.remove('hide');
    let labels = qsa('#reserve-panel label');
    for (let i = 0; i < labels.length; i++) {
      labels[i].classList.add('hide');
    }
    id('confirmed').textContent = time;
  }

  /**
   * This function hides or unhides the time and date input boxes or error messages
   * upon a confirmation of a reservation.
   */
  function rePick() {
    enableDisable(true, false);
    id('end-time').classList.remove('hide');
    id('start-time').classList.remove('hide');
    id('date').classList.remove('hide');
    id('confirmed').classList.add('hide');
    let labels = qsa('#reserve-panel label');
    for (let i = 0; i < labels.length; i++) {
      labels[i].classList.remove('hide');
    }
    id('confirmed').textContent = '';
  }

  /**
   * Enables and disables the reserve inputs and buttons
   * @param {boolean} statusT - True or false based on if the input / button needs to be disabled
   * @param {boolean} statusF - True or false based on if the input / button needs to be disabled
   */
  function enableDisable(statusT, statusF) {
    id('start-time').disabled = statusF;
    id('end-time').disabled = statusF;
    id('date').disabled = statusF;
    id('submit').disabled = statusT;
    id('confirm').disabled = statusF;
  }

  /**
   * This function hides or shows a success or error message based on a successful
   * or unsuccessful reservation
   * @param {String} message - The message that will be displayed
   * @param {String} section - The HTML element where the message will be displayed
   * @param {String} status - The class that makes the message be an error or success message
   */
  function handleMessage(message, section, status) {
    id('loading').classList.add('hide');
    id(section).className = status;
    id(section).textContent = message;
    id(section).classList.remove('hide');
  }

  /**
   * This function handles an invalid time request. Upon a check from the reserved
   * rooms from the database. If one matches, then this function displays a message
   * that the time has already been booked.
   * @param {String} time - The time that the user tried to reserve a study room for.
   * @param {String} section - The HTML element where the message will be displayed
   */
  function handleInvalid(time, section) {
    id('loading').classList.add('hide');
    id(section).className = 'error';
    id(section).textContent = 'Selected time ' + time + ' is in a range that' +
                              ' has already been booked by someone else or you ' +
                              'already have a reservation during that time';
    id(section).classList.remove('hide');
    rePick();
  }

  /**
   * This function submits a requested reservation once a user has confirmed the
   * reservation and then submitted it. It then handles the result and gives the user
   * a confirmation number upon success.
   */
  async function submit() {
    let startFinal = getFinalTime(id('start-time').value);
    let endFinal = getFinalTime(id('end-time').value);
    let bottom = qs('#reserve-panel > div:not(.close, #room-reference)');
    let roomNum = qs('#reserve-panel .room-num').textContent;
    let date = id('date').value;
    let result = '';
    try {
      let userId = localStorage.getItem("id");
      bottom.classList.add('hide');
      id('loading').classList.remove('hide');
      let response = await updateStatus(roomNum, userId);
      if (response.length !== 0) {
        if (!check(response, startFinal, endFinal, date)) {
          result = await makeRequest(startFinal, endFinal, roomNum, userId, date);
          reserveRoomResult(result);
        } else {
          let final = 'Time: ' + startFinal + ' to ' + endFinal + ' on ' + date;
          handleInvalid(final, 'confirm-error');
        }
      } else {
        result = await makeRequest(startFinal, endFinal, roomNum, userId, date);
        reserveRoomResult(result);
      }
      bottom.classList.remove('hide');
    } catch (err) {
      handleMessage(result, 'confirm-error', 'error');
    }
  }

  /**
   * This function handles the result after a room has been reserved, updating
   * the users history, updating all currently reserved rooms to check the current
   * time against newly made reservations.
   * @param {JSON} result - 6 digit confirmation code from a reservation.
   */
  function reserveRoomResult(result) {
    getAll();
    getUser();
    id('compact').checked = false;
    handleResult(result);
  }

  /**
   * This helper function that formats the start times, end times to validate
   * reservations against a query or requested reservation.
   * @param {JSON} response - JSON
   * @param {String} startFinal - start time in HH:MM AM/PM format
   * @param {String} endFinal - end time in HH:MM AM/PM format
   * @param {String} date - date in yyyy-mm-dd
   * @returns {boolean} - Returns true if there is a confliction otherwise
   * returns false.
   */
  function check(response, startFinal, endFinal, date) {
    let zoneSplitOne = startFinal.split(' ');
    let zoneSplitTwo = endFinal.split(' ');
    let timeStart = zoneSplitOne[0];
    let timeEnd = zoneSplitTwo[0];
    let timeSplitOne = timeStart.split(':');
    let timeSplitTwo = timeEnd.split(':');
    return checkAllTimes(response, timeSplitOne, timeSplitTwo, zoneSplitOne, zoneSplitTwo, date);
  }

  /**
   * this function handles success or fail when a user trys to make a reservation.
   * If reserve was a success and the code is 6 digits long, then it displays the code
   * to the user.
   * @param {JSON} result - The 6 digit confirmation code.
   */
  function handleResult(result) {
    const len = 6;
    if (result.length === len && result) {
      id('submit').disabled = true;
      id('confirm').disabled = true;
      handleMessage(
        'Success, booking made. Confirmation code is: ' + result,
        'confirm-error',
        'success'
      );
    } else {
      handleMessage(
        "Booking made, can't retrieve confirmation code.",
        'confirm-error',
        'error'
      );
      rePick();
    }
  }

  /**
   * This function makes a request to the reservation endpoint. Once a reservation time
   * is validated, this function is called.
   * @param {String} startFinal - Start time for a reservation
   * @param {String} endFinal - end time for a reservation
   * @param {Integer} roomNum - room number for the room to reserve
   * @param {Integer} userId - the users' id
   * @param {String} date - the date of the reservation
   * @returns {JSON} - Returns the generated confirmation code upon success.
   */
  async function makeRequest(startFinal, endFinal, roomNum, userId, date) {
    let data = new FormData();
    data.append("start", startFinal);
    data.append("end", endFinal);
    data.append("room_num", roomNum);
    data.append("id", userId);
    data.append("date", date);
    try {
      let result = await fetch('/library/reserve', {method: 'POST', body: data});
      await statusCheck(result);
      result = await result.text();
      return result;
    } catch (err) {
      return err;
    }
  }

  /**
   * This function checks start time and end time for a new reservation request
   * and ensures that the selected reservation times does not fall within another
   * reservation or that other reservations do not fall within the selected time.
   * @param {JSON} response - JSON data containing reservation information
   * @param {array} timeSplitOne - Array with HH as one value and MM as the other
   * @param {array} timeSplitTwo - Array with HH as one value and MM as the other
   * @param {array} startFinal - Array with HH:MM as one value and AM/PM as the other
   * @param {array} endFinal - Array with HH:MM as one value and AM/PM as the other
   * @param {String} date - date in yyyy-mm-dd
   * @returns {boolean} - Returns true or false based on if the requested
   * reservation is a valid one.
   */
  function checkAllTimes(response, timeSplitOne, timeSplitTwo, startFinal, endFinal, date) {
    let otherResponse = getRange(startFinal, endFinal, date, response);
    for (let i = 0; i < response.length; i++) {
      let midStart = getStartTime(response[i]);
      let endStart = getEndTime(response[i]);
      if (validate(response[i], timeSplitOne, startFinal, date) ||
          validate(response[i], timeSplitTwo, endFinal, date) ||
          validate(otherResponse, midStart[0].split(':'), midStart, response[i].date) ||
          validate(otherResponse, endStart[0].split(':'), endStart, response[i].date)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Creates a new JSON object with a start time, end time, and date for a reservation.
   * @param {String} start - Start time in HH:MM AM/PM format.
   * @param {String} end - End time in HH:MM AM/PM format
   * @param {String} date - Date in yyyy-mm-dd format.
   * @param {String} response - All reserved rooms that match the time range.
   * @returns {JSON} - Returns the newly created object holding the reservation information.
   */
  function getRange(start, end, date, response) {
    let obj = {
      "start_time": start[0] + ' ' + start[1],
      "end_time": end[0] + ' ' + end[1],
      "date": date,
      "capacity": response.capacity
    };
    return obj;
  }

  /**
   * This function splits a start time by the start time and AM or PM value of the time.
   * @param {JSON} res - JSON object that contains start time, and end time values for
   * a reservation.
   * @returns {array} - Array holding start time as one value and AM or PM value as the other.
   */
  function getStartTime(res) {
    let mid = res.start_time;
    mid = mid.split(' ');
    return mid;
  }

  /**
   * This function splits a end time by the end time and AM or PM value of the time.
   * @param {JSON} res - JSON object that contains start time, and end time values for
   * a reservation.
   * @returns {array} - Array holding end time as one value and AM or PM value as the other.
   */
  function getEndTime(res) {
    let mid = res.end_time;
    mid = mid.split(' ');
    return mid;
  }

  /**
   * This function validates a middle time based on a start and end time,
   * checking if the middle time falls in the range between the start and end.
   * @param {JSON} response - JSON object that holds information about a reservation
   * during a time and date.
   * @param {Array} timeSplit - Array with value HH and MM
   * @param {String} time - Full time string in HH:MM AM/PM format.
   * @param {String} date - A date in yyyy-mm-dd format
   * @returns {Boolean} - Returns true or false depending on if a time falls in
   * between two times and if the dates match and if the type of room is not a commons room.
   */
  function validate(response, timeSplit, time, date) {
    let resDate = response.date;
    let start = response.start_time.split(' ');
    let end = response.end_time.split(' ');
    let startFull = start[0];
    let endFull = end[0];
    startFull = startFull.split(':');
    endFull = endFull.split(':');
    return (
      (date === resDate) &&
      checkTime(time, start, end, endFull, startFull, timeSplit) &&
      (response.capacity !== '')
    );
  }

  /**
   * This function checks if a requested time falls within a reservation range of
   * a reservation that has already been made.
   * @param {array} time - The middle time check in HH:MM AM/PM format
   * @param {array} start - The start range in HH:MM AM/PM format
   * @param {array} end - The end range in HH:MM AM/PM format
   * @param {array} endFull - The full time of the end range with values HH and MM
   * @param {array} startFull - The full time of the start range with values HH and MM
   * @param {array} timeSplit - The full time of the middle time with values HH and MM
   * @returns {boolean} - Returns true if the time check overlaps an already made reservation.
   */
  function checkTime(time, start, end, endFull, startFull, timeSplit) {
    let middleHour = parseInt(timeSplit[0]);
    let startHour = parseInt(startFull[0]);
    let endHour = parseInt(endFull[0]);
    let middleMin = parseInt(timeSplit[1]);
    let startMin = parseInt(startFull[1]);
    let endMin = parseInt(endFull[1]);
    if (time[1] === start[1] && time[1] === end[1]) {
      return checkSameZones(middleHour, startHour, endHour, middleMin, startMin, endMin);
    } else if (time[1] > start[1] && time[1] === end[1]) {
      return checkDifZones(middleHour, endHour, middleMin, endMin);
    }
  }

  /**
   * This function checks if a time is within a time range of an already made
   * reservation and if the time zones are the same between the times.
   * @param {String} middleHour - The HH of a time to check
   * @param {String} startHour - The HH of the start range within a time
   * @param {String} endHour - The HH of the end range within a time
   * @param {String} middleMin - The MM of a time to check
   * @param {String} startMin - The MM of the start range within a time
   * @param {String} endMin - The MM of the end range within a time
   * @returns {boolean} - returns true if the time is already booked
   */
  function checkSameZones(middleHour, startHour, endHour, middleMin, startMin, endMin) {
    const hour = 12;
    if (middleHour % hour > startHour % hour && middleHour < endHour) {
      return true;
    } else if (startHour === middleHour && middleHour === endHour) {
      if (middleMin >= startMin && middleMin <= endMin) {
        return true;
      }
    } else if (startHour === middleHour && middleHour < endHour) {
      if (middleMin >= startMin) {
        return true;
      }
    } else if (middleHour > startHour && middleHour === endHour) {
      if (middleMin <= endMin) {
        return true;
      }
    }
  }

  /**
   * This function checks if a time is within a time range of an already made
   * reservation and if the time zones are different between the times.
   * @param {String} middleHour - The HH of a time to check
   * @param {String} endHour - The HH of the end range within a time
   * @param {String} middleMin - The MM of a time to check
   * @param {String} endMin - The MM of the end range within a time
   * @returns {boolean} - returns true if the time is already booked
   */
  function checkDifZones(middleHour, endHour, middleMin, endMin) {
    const hour = 12;
    if ((middleHour % hour) < (endHour % hour)) {
      return true;
    } else if (middleHour === endHour && middleHour === hour) {
      if (middleMin <= endMin) {
        return true;
      }
    }
  }

  /**
   * This function makes a request to the server based on a search or lack their of
   * and handles the information populating the reserve page with rooms that
   * match the query.
   */
  async function executeSearch() {
    let query = this.value.trim();
    let endpoint = '';
    const message = "Can't filter rooms at this time. Try again later.";
    if (query !== '') {
      endpoint = '/library/rooms/' + query;
    } else {
      endpoint = '/library/rooms/';
    }
    try {
      let response = await fetch(endpoint);
      await statusCheck(response);
      response = await response.json();
      handleNatural(response);
    } catch (err) {
      handleError(message, 'filter-error');
    }
  }

  /**
   * This function makes a request to the server for rooms that have natural light.
   * and handles the information by populating the study rooms.
   */
  async function availFilter() {
    const endpoint = '/library/rooms/natural';
    const message = "Can't filter by natural light right now. Try again later.";
    try {
      let response = await fetch(endpoint);
      await statusCheck(response);
      response = await response.json();
      handleNatural(response);
      if (id('avail-filter').classList.contains('filter')) {
        id('avail-filter').classList.remove('filter');
        clearInput();
      } else {
        id('avail-filter').classList.add('filter');
      }
    } catch (err) {
      handleError(message, 'filter-error');
    }
  }

  /**
   * This function handles the fiter query button click that filters for rooms
   * that have natural light, hiding all rooms that don't have natural light.
   * @param {JSON} response - The JSON array that contains the rooms that have
   * natural light.
   */
  function handleNatural(response) {
    let rooms = qsa('#reserve > article:not(.bigger)');
    for (let i = 0; i < rooms.length; i++) {
      rooms[i].classList.add('hide');
    }
    for (let i = 0; i < response.length; i++) {
      let roomNum = response[i].room_num;
      let room = id('room-' + roomNum);
      room = room.parentElement.parentElement.parentElement;
      room.classList.remove('hide');
    }
  }

  /**
   * This function clears filter and search query input when the user
   * clicks the clear filter button. Then it repopulates the reserve page with
   * all rooms from the server.
   */
  function clearInput() {
    id('compact').checked = false;
    id('time').value = '';
    id('filter-date').value = '';
    id('search-bar').value = '';
    id('filter-error').textContent = '';
    id('filter-error').classList.add('hide');
    id('avail-filter').classList.remove('filter');
    getAll();
  }

  /**
   * This function removes all rooms from the reserve page.
   */
  function removeAll() {
    let rooms = qsa('#reserve > article:not(.bigger)');
    for (let i = 0; i < rooms.length; i++) {
      id('reserve').removeChild(rooms[i]);
    }
  }

  /**
   * This function checks to make sure that a time is within the business hours
   * of quiet quarters which is 9:00 AM to 9:00 PM.
   * @param {String} hour - The hour value of a time.
   * @param {String} min - The minute value of a time.
   * @returns {Boolean} - True or False depending on if the time is within the
   * business hour range.
   */
  function checkRange(hour, min) {
    hour = parseInt(hour);
    const start = 9;
    const end = 21;
    min = parseInt(min);
    if (hour < end && hour > start) {
      return true;
    } else if (hour === end) {
      if (min === 0) {
        return true;
      }
    } else if (hour === start) {
      return true;
    }
  }

  /**
   * This function filters rooms based on search queries. If a user searchs by
   * date and time, then the amount of rooms reserved at that date / time are shown.
   */
  async function filterTime() {
    id('filter-error').textContent = '';
    let time = id('time').value;
    let hours = getHours(time);
    let minutes = getMinutes(time);
    let final = convertTime(hours, minutes);
    let date = id('filter-date').value;
    let invalid = 'Selected time ' + time + ' is not within open business hours. ' +
                 'Quiet Quarter hours are 9:00 AM to 9:00 PM. Please choose another time.';
    let missing = 'Must filter by time and date.';
    if (date && time) {
      if (checkRange(hours, minutes)) {
        let response = await updateStatus();
        setGreen();
        handleHour(response, final, date);
        let dots = qsa('.reserved');
        let reserved = dots.length + ' rooms reserved at this time.';
        handleError(reserved, 'filter-error');
      } else {
        handleError(invalid, 'filter-error');
      }
    } else {
      handleError(missing, 'filter-error');
    }
  }

  /**
   * This function gets the minutes value from a time in HH:MM format.
   * @param {String} time - The time to get the minutes value from.
   * @returns {String} - Return the minutes value.
   */
  function getMinutes(time) {
    let timeSplit = time.split(':');
    let minutes = timeSplit[1];
    return minutes;
  }

  /**
   * This function gets the hour value from a time in HH:MM format.
   * @param {String} time - The time to get the hour value from.
   * @returns {String} - Return the hours value.
   */
  function getHours(time) {
    let timeSplit = time.split(':');
    let hours = timeSplit[0];
    return hours;
  }

  /**
   * This function converts 24 hour time into 12 hour time with format
   * HH:MM AM/PM.
   * @param {String} hours - The hour in 24 hour time.
   * @param {String} minutes - The minutes of the time to convert.
   * @returns {String} - The converted time in 12 hour time.
   */
  function convertTime(hours, minutes) {
    const hour = 12;
    let zone = '';
    if (hours > hour) {
      zone = 'PM';
      hours -= hour;
    } else if (hours < hour) {
      zone = 'AM';
      if (hours === 0) {
        hours = hour;
      } else if (hours[1] === 0) {
        hours = hours[1];
      }
    } else {
      zone = 'PM';
    }
    let final = hours + ':' + minutes + ' ' + zone;
    return final;
  }

  /**
   * This function displays a message within a section. This message could be anything
   * including error information.
   * @param {String} message - This is the message that needs to be displayed.
   * @param {String} section - The section where the information needs to be displayed.
   */
  function handleError(message, section) {
    id(section).textContent = message;
    id(section).classList.remove('hide');
    id(section).className = 'error';
  }

  /**
   * This function changes the view of all study rooms from regular to compact,
   * Allowing the user to see all study rooms in one view.
   */
  function handleCheck() {
    if (this.checked) {
      let rooms = qsa('.room');
      let sections = qsa('.left');
      id('reserve').classList.add('compact');
      for (let i = 0; i < rooms.length; i++) {
        rooms[i].classList.remove('room');
        rooms[i].classList.add('long');
        sections[i].classList.remove('left');
        sections[i].classList.add('reverse');
      }
    } else {
      let rooms = qsa('.long');
      let sections = qsa('.reverse');
      id('reserve').classList.remove('compact');
      for (let i = 0; i < rooms.length; i++) {
        rooms[i].classList.add('room');
        rooms[i].classList.remove('long');
        sections[i].classList.add('left');
        sections[i].classList.remove('reverse');
      }
    }
  }

  /**
   * This function handles when a user clicks the sign out button and sends them
   * back to the login page.
   */
  function signOut() {
    let out = id('sign-out');
    out.addEventListener('click', () => {
      logOut();
    });
  }

  /**
   * This function logs out a user and returns them to the login page.
   */
  function logOut() {
    let email = localStorage.getItem("email");
    localStorage.clear();
    localStorage.setItem("username", email);
    window.location.replace("index.html");
  }

  /**
   * This function gets the user information upon login and updates their information
   * based on their account.
   */
  function getUser() {
    let userId = localStorage.getItem("id");
    name = localStorage.getItem("name");
    let username = localStorage.getItem("email");
    getUserInfo(userId, name, username);
    handleAccount(name, username);
  }

  /**
   * This function sets the user's welcome message, user's email, and user's name.
   * @param {String} user - The user's name.
   * @param {String} email - The user's email.
   */
  function handleAccount(user, email) {
    let userEmail = id('user-email');
    let userName = id('user-name');
    let top = qs('#top p');
    top.textContent = 'Welcome ' + user;
    userEmail.textContent = 'Email / Username: ' + email;
    userName.textContent = 'Name: ' + user;
  }

  /**
   * This function makes a request to get all the reserved rooms or all reserved rooms
   * that match a room number.
   * @param {String} room - The room number of the room to get reservation info on.
   * @param {String} id - The users id.
   * @returns {JSON} - Returns the JSON data containing the information upon a successful
   * fetch.
   */
  async function updateStatus(room, id) {
    let endpoint = '';
    if (room) {
      endpoint = '/library/reserved/' + room + '/' + id;
    } else {
      endpoint = '/library/reserved/';
    }
    const message = 'Error retrieving reservations. Try again later.';
    try {
      let result = await fetch(endpoint);
      await statusCheck(result);
      result = await result.json();
      return result;
    } catch (err) {
      handleError(message, 'filter-error');
    }
  }

  /**
   * This function makes a request to get a users historical information based on the user id,
   * user's name, and username. If an error occurs the user is logged out.
   * @param {String} userId - Users id.
   * @param {String} user - Users name.
   * @param {String} username - Users email.
   */
  async function getUserInfo(userId, user, username) {
    let endpoint = '/library/user/';
    try {
      let response = await fetch(endpoint + user + '/' + userId + '/' + username);
      await statusCheck(response);
      response = await response.json();
      handleUserInfo(response);
    } catch (err) {
      logOut();
    }
  }

  /**
   * This function handles user history information making all reservation history
   * viewable for the user including information containing the date, room number,
   * confirmation number, reservation time, and total reservations.
   * @param {JSON} res - The JSON data containing information for a users history.
   */
  function handleUserInfo(res) {
    let history = id('history');
    let totalReserves = id('user-reserves');
    totalReserves.textContent = 'Total Reservations: ' + res.length;
    if (res.length > 0) {
      history.innerHTML = '';
      for (let i = 0; i < res.length; i++) {
        let article = gen('article');
        article.classList.add('card');
        let room = gen('p');
        room.textContent = 'Room #' + res[i].room_num;
        let date = gen('p');
        date.textContent = 'Date: ' + res[i].date;
        let times = gen('p');
        times.textContent = res[i].start_time + ' to ' + res[i].end_time;
        let confirm = gen('p');
        confirm.textContent = 'Confirmation #' + res[i].confirm_num;
        article.appendChild(room);
        article.appendChild(date);
        article.appendChild(times);
        article.appendChild(confirm);
        history.prepend(article);
      }
    } else {
      let noHistory = gen('p');
      noHistory.textContent = name + ' has not made any reservations yet.';
      history.appendChild(noHistory);
    }
  }

  /**
   * This function checks all reservations and compares them to the users
   * current time / selected time & the users current date / selected date and if
   * the users time / date match a reservation from the response, then the status of
   * that room will be changed to reserved.
   * @param {JSON} response - The JSON data containing all reserved rooms.
   * @param {String} time - The selected or users current filter time.
   * @param {String} date - The selected or users current filter date.
   */
  function handleHour(response, time, date) {
    time = time.split(' ');
    let full = time[0];
    let timeSplit = full.split(':');
    let dateCheck = '';
    if (!date) {
      dateCheck = getDate();
    } else {
      dateCheck = date;
    }
    for (let i = 0; i < response.length; i++) {
      if (validate(response[i], timeSplit, time, dateCheck)) {
        changeStatus(response[i].room_num);
      }
    }
  }

  /**
   * This function gets the current date in yyyy-mm-dd format.
   * @returns {String} - Returns the current date.
   */
  function getDate() {
    let date = new Date();
    let year = date.toLocaleString("default", {year: "numeric"});
    let month = date.toLocaleString("default", {month: "2-digit"});
    let day = date.toLocaleString("default", {day: "2-digit"});
    let formattedDate = year + "-" + month + "-" + day;
    return formattedDate;
  }

  /**
   * This function changes the status of study room from avaliable to reserved.
   * @param {String} roomNum - The room number of the room that needs status changing.
   */
  function changeStatus(roomNum) {
    let sibling = id('room-' + roomNum);
    let status = sibling.nextSibling.nextSibling;
    status.classList.replace('open', 'reserved');
  }

  /**
   * This function makes the navigation bar buttons clickable and triggers their
   * actions when they are clicked.
   */
  function setNavBar() {
    let btns = qsa('header nav ol li');
    for (let i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', handleNavClick);
    }
  }

  /**
   * This helper function handles when a user clicks on a nav button: hiding content,
   * showing content, animating elements, and changing content.
   */
  function handleNavClick() {
    moveSelected(this);
    let id = getPage(this);
    changeContent(id);
  }

  /**
   * This function initiates the img slider on the home page if the home page is
   * viewable, otherwise it stops the animation.
   * @param {HTMLElement} hide - The HTML element that is hidden.
   * @param {HTMLElement} show - The HTML element that is shown.
   */
  function fixSlider(hide, show) {
    if (hide.id === 'home') {
      let slider = qsa('.img-section');
      for (let i = 0; i < slider.length; i++) {
        slider[i].style.animation = 'none';
      }
    } else if (show.id === 'home') {
      setImgSlider();
    }
  }

  /**
   * This function initates the animation of the home page imgs after a 1 second pause.
   */
  function setImgSlider() {
    let slider = qsa('.img-section');
    const oneSec = 1000;
    setTimeout(() => {
      for (let i = 0; i < slider.length; i++) {
        slider[i].style.animation = 'travel 70s linear infinite';
      }
    }, oneSec);
  }

  /**
   * This function hides the preview page and shows the new page that has just been
   * clicked from the nav bar.
   * @param {String} section - The id of the page that needs to be viewable.
   */
  function changeContent(section) {
    let hide = qs('main .active');
    let show = id(section);
    hide.classList.add('hide');
    hide.classList.remove('active');
    show.classList.remove('hide');
    show.classList.add('active');
    fixSlider(hide, show);
  }

  /**
   * This function changes the content of the header article
   * of each page based on which nav button has been clicked.
   * @param {HTMLElement} btn - The HTML element that has just been clicked.
   * @returns {String} - The HTML id of the newly viewable section
   */
  function getPage(btn) {
    let idValue = '';
    let searchBox = id('filter');
    let header = qs('#top > p');
    if (btn.value === 0) {
      qs('main').style.backgroundColor = '#caaeff';
      idValue = 'home';
      searchBox.classList.add('hide');
      header.textContent = 'Welcome ' + name;
    } else if (btn.value === 1) {
      idValue = 'reserve';
      qs('main').style.backgroundColor = 'white';
      searchBox.classList.remove('hide');
      header.textContent = '';
    } else if (btn.value === 2) {
      qs('main').style.backgroundColor = 'white';
      idValue = 'history';
      searchBox.classList.add('hide');
      header.textContent = name + "'s History";
    } else if (btn.value === 3) {
      qs('main').style.backgroundColor = 'white';
      idValue = 'account';
      searchBox.classList.add('hide');
      header.textContent = name + "'s Account";
    }
    return idValue;
  }

  /**
   * This function moves the underline bar in the nav bar when a user clicks on
   * a new section.
   * @param {HTMLElement} button - The button that was just clicked.
   */
  function moveSelected(button) {
    let underline = qs('#underline');
    let old = qs('.active');
    old.classList.remove('active');
    button.classList.add('active');
    const fullLength = 100;
    underline.style.transform = 'translate3d(' + button.value * fullLength + '%,0,0)';
  }

  /**
   * This function makes a request to the endpoint that gets every single study room
   * in the database and populates them on the website. This funtion updates a room
   * and its status based on the users current time;
   */
  async function getAll() {
    const endpoint = 'library/rooms';
    let message = "Can't retrieve study rooms at this time. Try again later.";
    try {
      let results = await fetch(endpoint);
      await statusCheck(results);
      results = await results.json();
      removeAll();
      await handleAll(results);
      let response = await updateStatus();
      let time = new Date().toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
      handleHour(response, time);
    } catch (err) {
      handleError(message, 'filter-error');
    }
  }

  /**
   * This function adds all the study rooms avaliable on the website to the reserve
   * page of the website.
   * @param {JSON} results - The JSON array that contains every single room and their
   * respective information.
   */
  function handleAll(results) {
    let reserveSection = id('reserve');
    let bigView = id('preview');
    for (let i = 0; i < results.length; i++) {
      let article = gen('article');
      article.classList.add('room');
      article = makeSections(article, results[i]);
      reserveSection.insertBefore(article, bigView);
    }
    setReserveBtns();
  }

  /**
   * This function edits the HTML article element that holds all the information
   * for a study room.
   * @param {HTMLElement} article - The HTML element to add all the information to.
   * @param {JSON} result - JSON data for the specific room that holds all the information.
   * @returns {HTMLElement} - The final edited HTML element that contains all the newly
   * added information
   */
  function makeSections(article, result) {
    let left = gen('section');
    let right = gen('section');
    left.classList.add('left');
    right.classList.add('right');
    let leftSection = makeLeft(left, result);
    let rightSection = makeRight(right);
    article.appendChild(leftSection);
    article.appendChild(rightSection);
    return article;
  }

  /**
   * This function makes the left portion for each room which contain the small
   * img for each room.
   * @param {HTMLElement} section - The HTML element to add the img to.
   * @param {JSON} result - The JSON data containing information about a specific room.
   * @returns {HTMLElement} - The newly edited HTML element that contains the small img.
   */
  function makeLeft(section, result) {
    let img = gen('img');
    img.classList.add('room-pic');
    img.src = '/img/' + result.img;
    img.alt = 'room ' + result.room_num;
    section.appendChild(img);
    let div = gen('div');
    div.classList.add('container');
    div = makeTop(div, result);
    section.appendChild(div);
    return section;
  }

  /**
   * This function makes the top portion of each study room item. Creates the part
   * that contians the room type, room number, room icon, and room circl status icon.
   * @param {HTMLElement} div - The HTML div Element that will contain the room
   * information.
   * @param {JSON} result - JSON data that contains information for a specific room
   * on the site.
   * @returns {HTMLElement} - Returns the newly edited HTML Element that contains
   * information about the room.
   */
  function makeTop(div, result) {
    let room = gen('p');
    room.textContent = result.type + '#';
    div.appendChild(room);
    let roomNum = gen('p');
    roomNum.classList.add('room-num');
    roomNum.textContent = result.room_num;
    roomNum.id = 'room-' + result.room_num;
    div.appendChild(roomNum);
    let icon = gen('img');
    if (result.type === 'Commons') {
      icon.src = '/icons/commons.png';
      icon.alt = 'commons icon';
    } else if (result.type === 'Team') {
      icon.src = '/icons/teams.png';
      icon.alt = 'teams icon';
    } else if (result.type === 'Single') {
      icon.src = '/icons/individual.png';
      icon.alt = 'individual icon';
    } else {
      icon.src = '/icons/individual.png';
      icon.alt = 'individual icon';
    }
    div.appendChild(icon);
    let circle = gen('div');
    circle.classList.add('circle');
    circle.classList.add('open');
    div.appendChild(circle);
    return div;
  }

  /**
   * This function makes all status' on the page open and unreserved. Necessary
   * so newly reserved ones can be updated.
   */
  function setGreen() {
    let dots = qsa('.reserved');
    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.replace('reserved', 'open');
    }
  }

  /**
   * This function creates the right section that contains the reserve and preview
   * button for each study room.
   * @param {HTMLElement} section - The HTML element that will contain the buttons.
   * @returns {HTMLElement} - THe edited HTML element that contains the buttons.
   */
  function makeRight(section) {
    let div = gen('div');
    div.classList.add('container');
    let btnOne = gen('button');
    btnOne.classList.add('preview');
    btnOne.textContent = 'Preview';
    let btnTwo = gen('button');
    btnTwo.classList.add('reserve');
    btnTwo.textContent = 'Reserve';
    div.appendChild(btnOne);
    div.appendChild(btnTwo);
    section.appendChild(div);
    return section;
  }

  /**
   * This function sets up the buttons for every preview, reserve, and X close button
   * on the page.
   */
  function setReserveBtns() {
    addFunctionality('.preview', preview);
    addFunctionality('.reserve', reserve);
    let closeBtn = qsa('.exe');
    for (let i = 0; i < closeBtn.length; i++) {
      closeBtn[i].addEventListener('click', close);
    }
  }

  /**
   * This function removes functionality fron either the reserve or preview buttons
   * @param {String} query - The buttons that need to remove functionality
   * @param {Function} func - The function to remove from a button click
   */
  function removeFunctionality(query, func) {
    let btns = qsa('#reserve ' + query);
    for (let i = 0; i < btns.length; i++) {
      btns[i].removeEventListener('click', func);
    }
  }

  /**
   * This function adds functionality to either the reserve or preview buttons
   * @param {String} query - The buttons that need functionality
   * @param {Function} func - The function to attach to a button click
   */
  function addFunctionality(query, func) {
    let btns = qsa('#reserve ' + query);
    for (let i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', func);
    }
  }

  /**
   * This function makes the reserve panel for a specific room viewable when a user
   * clicks reserve for that room.
   */
  function reserve() {
    removeFunctionality('.preview', preview);
    id('reserve-panel').classList.remove('hide');
    let reference = this.parentElement.parentElement.parentElement;
    let roomNum = reference.querySelector('.room-num');
    let room = reference.querySelector('.container p:not(.room-num)');
    id('title').textContent = 'Reserve ' + room.textContent;
    qs('#reserve-panel .room-num').textContent = roomNum.textContent;
  }

  /**
   * This function handles when a user closes the reserve section for a specific
   * room. Disables the submit button and enables the confirm button. Resets a users
   * chosen date and time on close and removes any errors;
   */
  function close() {
    id('start-time').disabled = false;
    id('end-time').disabled = false;
    id('date').disabled = false;
    id('submit').disabled = true;
    id('confirm').disabled = false;
    id('start-time').value = '';
    id('end-time').value = '';
    id('date').value = '';
    id('date').classList.remove('hide');
    id('start-time').classList.remove('hide');
    id('end-time').classList.remove('hide');
    id('confirmed').textContent = '';
    id('confirm-error').textContent = '';
    id('confirm-error').classList.add('hide');
    id('confirmed').classList.add('hide');
    let labels = qsa('#reserve-panel label');
    for (let i = 0; i < labels.length; i++) {
      labels[i].classList.remove('hide');
    }
    addFunctionality('.preview', preview);
    addFunctionality('.reserve', reserve);
    this.parentElement.parentElement.classList.add('hide');
  }

  /**
   * This function gets makes a request for information including
   * description, capacity, img for a specific study room.
   */
  async function preview() {
    removeFunctionality('.reserve', reserve);
    let reference = this.parentElement.parentElement.parentElement;
    let room = reference.querySelector('.room-num');
    let roomNum = room.textContent;
    const endpoint = '/library/room/';
    const message = "Can't get information for this room. Try again later.";
    try {
      let result = await fetch(endpoint + roomNum);
      await statusCheck(result);
      result = await result.json();
      handleGetRoom(result[0]);
    } catch (err) {
      handleError(message, 'preview-error');
    }
  }

  /**
   * This function updates the preview section when a user clicks on the preview button
   * for a specific room. Populates the preview room with that specific room's capacity,
   * description, current status, and picture;
   * @param {JSON} result - The json data containing information for a specific room.
   */
  function handleGetRoom(result) {
    let previewEl = qs('#reserve #preview');
    let replacePic = id('big-pic');
    let status = id('status');
    let description = id('description');
    let capacity = id('capacity');
    replacePic.src = '/img/' + result.img;
    replacePic.alt = 'room ' + result.room_num + ' big';
    if (result.capacity === "") {
      capacity.textContent = 'Capacity: unlimited';
    } else {
      capacity.textContent = 'Capacity: ' + result.capacity;
    }
    description.textContent = 'Amenities: ' + result.description;
    let roomSign = id('room-' + result.room_num).nextSibling.nextSibling;
    if (roomSign.classList.contains('open')) {
      status.textContent = 'Status: Currently Open';
      status.classList.remove('red');
      status.classList.add('green');
    } else if (roomSign.classList.contains('reserved')) {
      status.textContent = 'Status: Currently Reserved';
      status.classList.remove('green');
      status.classList.add('red');
    }
    previewEl.classList.remove('hide');
  }

  /**
   * Checks the result of the fetch and its status code.
   * @param {JSOn} res - The JSON object that needs to be validated
   * @returns {JSON} - Returns the JSON object if it's status is validated.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * Selects an element based on its id.
   * @param {String} id - Id of element to select.
   * @returns {HTMLElement} - Returns a specific element depending on its id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Selects a list of elements based on a query.
   * @param {String} elements - Specifies the elements to be selected
   * @returns {DOMList} - Returns a list of all elements matching the given query.
   */
  function qsa(elements) {
    return document.querySelectorAll(elements);
  }

  /**
   * Helper function to select a specifc HTML element.
   * @param {String} element - Specifies the element to be selected
   * @returns {HTMLElement} - Returns a HTML element based on the query
   */
  function qs(element) {
    return document.querySelector(element);
  }

  /**
   * Helper function to generates a new HTML element.
   * @param {String} element - DOM Element to be created.
   * @returns {HTMLElement} - Returns a HTML element based on a query.
   */
  function gen(element) {
    return document.createElement(element);
  }

})();