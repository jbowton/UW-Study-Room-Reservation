/**
 * Name: Jadon Bowton
 * Date: 6/4/2023
 * Section: CSE 154 AC
 *
 * This is the Node.js file that handles all endpoint requests and updates, or checks
 * server side databases based on users actions. With this file, users can make room
 * reservations, get all the history associated with their account, view all study rooms
 * avaliable, view all reservations at a certain time and date, or search fors study rooms
 * based on their description, type, or room number.
 */

'use strict';

const express = require('express');
const app = express();
const multer = require('multer');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const cors = require('cors');
const SERVER_CODE = 500;
const CLIENT_CODE = 400;
const CLIENT_ERROR = 'Missing one or more parameters';
const SERVER_ERROR = 'Something went wrong. Please try again later';
let loggedIn;

app.use(cors());

// for application/x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));

// for application/json
app.use(express.json());

// for multipart/form-data (required with FormData)
app.use(multer().none());

/**
 * This endpoint gets all study rooms that match a search query from the server.
 * If no search is present then all rooms are shown.
 */
app.get('/library/rooms/:filter?', async (req, res) => {
  let query = '';
  if (req.params.filter) {
    query = 'SELECT room_num, capacity, description FROM rooms WHERE ' +
            'description LIKE ? OR capacity LIKE ? OR room_num LIKE ? OR type LIKE ?' +
            'ORDER BY room_num ASC';
  } else {
    query = 'SELECT room_num, img, type FROM rooms ORDER BY room_num ASC';
  }
  try {
    let results = '';
    let db = await getDBConnection();
    if (req.params.filter) {
      results = await db.all(query, ['%' + req.params.filter + '%',
                                     '%' + req.params.filter + '%',
                                     '%' + req.params.filter + '%',
                                     '%' + req.params.filter + '%']);
    } else {
      results = await db.all(query);
    }
    await db.close();
    res.json(results);
  } catch (err) {
    res.type('text').status(SERVER_CODE);
    res.send(SERVER_ERROR);
  }
});

/**
 * This endpoint gets room information for a specific study room
 */
app.get('/library/room/:room', async (req, res) => {
  let room = req.params.room;
  if (!room) {
    res.status(CLIENT_ERROR);
    res.type("text").send("No room parameter provided");
  } else {
    const query = 'SELECT * FROM rooms WHERE room_num = ?';
    try {
      let db = await getDBConnection();
      let results = await db.all(query, [room]);
      await db.close();
      res.json(results);
    } catch (err) {
      res.type('text').status(SERVER_CODE);
      res.send(SERVER_ERROR);
    }
  }

});

/**
 * This endpoint handles user login and makes sure that the user exists and that
 * their email and password match within the database.
 */
app.post('/library/login', async (req, res) => {
  let user = req.body.email.toLowerCase();
  let checkMatch = 'SELECT id, name, username FROM users WHERE username = ? AND key = ?';
  if (user && req.body.key) {
    try {
      let db = await getDBConnection();
      if (await checkUser('username', user)) {
        let result = await db.get(checkMatch, [user, req.body.key]);
        await db.close();
        if (result) {
          loggedIn = true;
          res.json(result);
        } else {
          res.type('text').status(CLIENT_CODE);
          res.send('Username or password does not match');
        }
      } else {
        res.type('text').status(CLIENT_CODE);
        res.send('An account with that email does not exist');
      }
    } catch (err) {
      res.type('text').status(SERVER_CODE);
      res.send(SERVER_ERROR);
    }
  } else {
    res.type('text').status(CLIENT_CODE);
    res.send(CLIENT_ERROR);
  }
});

/**
 * This endpoint handles the creation of a new user and makes sure the user doesn't already
 * exist. Updates the server side information on success.
 */
app.post('/library/users/new', async (req, res) => {
  let email = req.body.email.toLowerCase();
  const len = 7;
  if (email && req.body.key && req.body.name) {
    if (email.length > len && email.substr(email.length - len) === '@uw.edu') {
      try {
        let db = await getDBConnection();
        if (!await checkUser('username', email)) {
          let insert = 'INSERT INTO users (name, username, key) VALUES (?, ?, ?)';
          let result = await db.run(insert, [req.body.name, email, req.body.key]);
          await db.close();
          res.json(result);
        } else {
          await db.close();
          res.type('text').status(CLIENT_CODE);
          res.send('User with email ' + String(email) + ' already exists');
        }
      } catch (err) {
        res.type('text').status(SERVER_CODE);
        res.send(SERVER_ERROR);
      }
    } else {
      res.type('text').status(CLIENT_CODE);
      res.send('Email must be in format @uw.edu');
    }
  } else {
    res.type('text').status(CLIENT_CODE);
    res.send(CLIENT_ERROR);
  }
});

/**
 * This endpoint gets all reserved rooms or a specific room based on whether a user is
 * trying to reserve a specific room.
 */
app.get('/library/reserved/:room?/:id?', async (req, res) => {
  let room = req.params.room;
  let id = req.params.id;
  try {
    let db = await getDBConnection();
    let response = '';
    let query = '';
    if (room && id) {
      query = getRoomResQuery();
      response = await db.all(query, room, id);
    } else {
      query = getAllResQuery();
      response = await db.all(query);
    }
    await db.close();
    res.json(response);
  } catch (err) {
    res.type('text').status(SERVER_CODE);
    res.send(SERVER_ERROR);
  }
});

/**
 * This endpoint gets user information: including their reservation history and account
 * information if the user is logged in.
 */
app.get('/library/user/:name/:id/:username', async (req, res) => {
  let name = req.params.name;
  let id = req.params.id;
  let username = req.params.username;
  if (name && id && username) {
    const query = getUserQuery();
    if (loggedIn) {
      try {
        let db = await getDBConnection();
        let response = await db.all(query, [id, name, username]);
        await db.close();
        res.json(response);
      } catch (err) {
        res.type('text').status(SERVER_CODE);
        res.send(SERVER_ERROR);
      }
    } else {
      res.type('text').status(CLIENT_CODE);
      res.send('User is not logged in.');
    }
  } else {
    res.type('text').status(CLIENT_CODE);
    res.send(CLIENT_ERROR);
  }
});

/**
 * This endpoint makes a reservation for a study room and updates their user history.
 * Sends back a confirmation code on success;
 */
app.post('/library/reserve', async (req, res) => {
  let start = req.body.start;
  let end = req.body.end;
  let id = req.body.id;
  let roomNum = req.body.room_num;
  let date = req.body.date;
  if (start && end && roomNum && id && date) {
    loggedIn = true;
    if (loggedIn && await checkUser('id', id)) {
      try {
        let code = await genCode();
        let result = await updateRes(id, roomNum, start, end, date, code);
        if (result.lastID) {
          code = String(code);
          res.type('text').send(code);
        }
      } catch (err) {
        res.type('text').status(SERVER_CODE);
        res.send(SERVER_ERROR);
      }
    } else {
      res.type('text').status(CLIENT_CODE);
      res.send('User is not logged in or user does not exist.');
    }
  } else {
    res.type('text').status(CLIENT_CODE);
    res.send(CLIENT_ERROR);
  }
});

/**
 * This helper function updates the server and inputs a new reservation for a user.
 * @param {String} id - The users id
 * @param {String} roomNum - The room number being reserved
 * @param {String} start - The start time for the reservation
 * @param {String} end - The end time for the reservation
 * @param {String} date - The date of the reservation
 * @param {String} code - The confirmation code of the reservation
 * @returns {JSON} - Returns the information associated with the reservation
 */
async function updateRes(id, roomNum, start, end, date, code) {
  try {
    let insertReserved = insertRes();
    let insertHistory = insertHis();
    let db = await getDBConnection();
    await db.run(insertReserved, [roomNum, start, end, code, date]);
    let result = await db.run(insertHistory, [id, roomNum, code, date]);
    return result;
  } catch (err) {
    return err;
  }
}

/**
 * Helper function to get the query for inserting a new reservation into the reserved
 * table to keep track of users reservations.
 * @returns {String} - Returns the query.
 */
function insertRes() {
  let query = 'INSERT INTO reserved (room_num, start_time, ' +
              'end_time, confirm_num, date) VALUES (?, ?, ?, ?, ?)';
  return query;
}

/**
 * Helper function to get the query for inserting a new reservation into the history
 * table to keep track of a users reservations.
 * @returns {String} - Returns the query.
 */
function insertHis() {
  let query = 'INSERT INTO history (id, room_num, confirm_num, date)' +
              'VALUES (?, ?, ?, ?)';
  return query;
}

/**
 * This endpoint checks to make sure a user exists in the datebase and returns false
 * if not
 * @param {String} category - The category on the the sever that should be checked against
 * @param {String} placeholder - The id or username to be cross referenced
 * @returns {boolean} - Returns true or false depending on if the user exists.
 */
async function checkUser(category, placeholder) {
  let query = '';
  if (category === 'id') {
    query = 'SELECT id FROM users WHERE id = ?';
  } else {
    query = 'SELECT username FROM users WHERE username = ?';
  }
  try {
    let db = await getDBConnection();
    let user = await db.get(query, [placeholder]);
    if (user) {
      return true;
    }
  } catch (err) {
    return err;
  }
}

/**
 * This function generates a 6 digit confirmation code and verifies that it doesn't
 * already exist.
 * @returns {String} - Returns a 6 digit string
 */
async function genCode() {
  const add = 100000;
  const multiply = 900000;
  let code = Math.round(Math.floor(add + Math.random() * multiply));
  const query = 'SELECT confirm_num FROM history WHERE confirm_num = ?';
  try {
    let db = await getDBConnection();
    let result = await db.all(query, [code]);
    await db.close();
    if (result.length !== 0) {
      return await genCode();
    }
    return code;
  } catch (err) {
    return err;
  }
}

/**
 * This helper function gets the query string for a specific user when information
 * about the user need to be fetched.
 * @returns {String} - Returns the query for a specific username;
 */
function getUserQuery() {
  let query = 'SELECT h.room_num, h.date, h.confirm_num, r.start_time, r.end_time' +
              ' FROM history h, reserved r JOIN users ON users.id = ? AND users.name = ?' +
              ' AND h.confirm_num = r.confirm_num AND users.username = ?' +
              ' AND users.id = h.id';
  return query;
}

/**
 * This helper function gets the query for reserved rooms when a user is trying to
 * reserve a specific room.
 * @returns {String} - The room reservation query for a specfic room.
 */
function getRoomResQuery() {
  let query = 'SELECT r.room_num, r.start_time, r.end_time, r.confirm_num, r.date, ' +
              'm.capacity, h.id FROM reserved r, rooms m, history h WHERE ' +
              '(r.room_num = ? OR h.id = ?) AND r.room_num = m.room_num AND ' +
              'h.confirm_num = r.confirm_num ' +
              'ORDER BY r.room_num ASC';
  return query;
}

/**
 * This helper function gets the query for all reserved rooms that are present on the database.
 * @returns {String} - The reservation query for all reserved rooms
 */
function getAllResQuery() {
  let query = 'SELECT r.room_num, r.start_time, r.end_time, r.confirm_num, r.date, ' +
              'm.capacity, h.id FROM reserved r, rooms m, history h WHERE ' +
              'r.room_num = m.room_num AND h.confirm_num = r.confirm_num ' +
              'ORDER BY r.room_num ASC';
  return query;
}

/**
 * This function establishes a connection between node and the database
 * @returns {sqlite3.Database} - The data base to make updates and queries on
 */
async function getDBConnection() {
  try {
    const db = await sqlite.open({
      filename: 'library.db',
      driver: sqlite3.Database
    });
    return db;
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    throw err;
  }
}

app.use(express.static('public'));
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});