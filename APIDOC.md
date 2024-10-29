<!--
  Name: Dean Shaw & Jadon Bowton
  Date: 6/5/2023
  Section: CSE 154 AC

  This is the APIDOC file that describes our 7 endpoints and what they do. With our
  endpoints, a user can login, create an account, get user history, get reserved rooms
  matching a room number and user id, reserve a room, get information about a specific room,
  get all rooms matching a filter or all rooms.
-->
# Study Room API Documentation
The Study Room API provides information about the various study rooms avaliable at
the specified library along with information regarding the amenities within the study room
and if the room is already reserved as well as if said user already has a booking
in a specific time slot

## Get a list of all study rooms in this service.
**Request Format:** /library/rooms/:filter? `filter` is an optional parameter

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Return a list of all of the Study Rooms that you can reserve, there picture,
and their room type.

**Example Request:** /library/rooms/

**Example Response:**
```JSON
[
  {
    "room-num": "1",
    "img": "single-01.jpeg",
    "type": "single"
  },
  {
    "room-num": "2",
    "img": "single-02.jpeg",
    "type": "single"
  }

]
```

**Error Handling:**
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Something went wrong. Please try again later.`

## Lookup a Rooms Information on click of room card
**Request Format:** /library/room/:room

**Request Type:** GET

**Returned Data Format**: JSON

**Description:** Given a room number from clicking on a specific card,
returns information for that specific room to display additional information.

**Example Request:** /library/room/2

**Example Response:**
```json
{
    "room": "2",
    "img": "commons-02.jpeg",
    "capacity": "none",
    "description": "Computers, Outlets, Printing, Scanner, Whiteboards",
    "type": "Commons"
}
```
**Error Handling:**
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Something went wrong. Please try again later.`

## Login to account
**Request Format:** /library/login with POST parameters `user` and `key`

**Request Type:** POST

**Returned Data Format**: JSON

**Description:** Checks a valid login from a user and ensures that the user exists
and the password and email match.

**Example Request:** /library/login with POST parameters `email=dshaw16@uw.edu` and `key=dtest`

**Example Response:**

```JSON
{
    "id": "1",
    "name": "dean",
    "username": "dshaw16@uw.edu"
}
```
**Error Handling:**
- Possible 400 errors (all plain text):
  - If user does not exist, returns with message: `An account with that email does not exist`
  - If email(username) and password do not match:`Username or password does not match`
- Possible 500 errors (all plain text):
  - If something else goes wrong on the server, returns an error with the message: `Something went wrong. Please try again later.`


## Create new account
**Request Format:** /library/users/new with POST parameters of `email` and `key` adn `name`

**Request Type**: POST

**Returned Data Format**: JSON

**Description:** Given a valid `username` with @uw.edu, a `password` and a `name` from a user, the users account will be created.

**Example Request:** /library/users/new with POST parameters of `email=jbowton@uw.edu` and `key=jtest` and `name=jadon`

**Example Response:**
```JSON
{
  "stmt": {},
  "lastID": 13,
  "changes": 1
}
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If user trys to create an account with email not ending in @uw.edu: `Email must be in format @uw.edu`
  - If a user with the inputed email already exists returns: `User with email {email} already exists`
  - If a user doesn't provide either an email, key, or name: `Missing one or more parameters`
- Possible 500 errors (all plain text):
  - Something goes wrong on the server side: `Something went wrong. Please try again later`

## Get all reserved rooms, or get reserved rooms for a specific room number and user id
**Request Format:** /library/reserved/:room?/:id?

**Request Type**: GET

**Returned Data Format**: JSON

**Description:** Given an optional parameter of both a room and id, returns a list of
all reservations under that room and all reservations under that user. If either parameter
is not given, then returns with all reserved rooms.

**Example Request:** /library/reserved/1/1

**Example Response:**
```JSON
  {
    "room_num": 2,
    "start_time": "09:00 AM",
    "end_time": "10:00 AM",
    "confirm_num": 146889,
    "date": "2023-06-05",
    "capacity": "",
    "id": 1
  },
  {
    "room_num": 5,
    "start_time": "01:00 PM",
    "end_time": "02:00 PM",
    "confirm_num": 567987,
    "date": "2023-06-05",
    "capacity": "",
    "id": 1
  }
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - None as parameters are optional and won't impact behavior
- Possible 500 errors (all plain text):
  - Something goes wrong on the server side: `Something went wrong. Please try again later`

## Gets account information for a user including historical reservations
**Request Format:** /library/user/:name/:id/:username

**Request Type**: GET

**Returned Data Format**: JSON

**Description:** Gets all reservations tied to the logged in user in order to populate
the history tab

**Example Request:** /library/user/jadon/2/jbowton@uw.edu

**Example Response:**
```JSON
  {
    "room_num": 2,
    "date": "2023-06-05",
    "confirm_num": 146889,
    "start_time": "09:00 AM",
    "end_time": "10:00 AM"
  },
  {
    "room_num": 2,
    "date": "2023-06-05",
    "confirm_num": 657893,
    "start_time": "01:00 PM",
    "end_time": "02:00 PM"
  },
    {
    "room_num": 3,
    "date": "2023-06-06",
    "confirm_num": 290202,
    "start_time": "04:00 PM",
    "end_time": "04:30 PM"
  }
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If username, userid, or users name aren't provided: `Missing one or more parameters`;
  - If the user is not logged in: `User is not logged in.`
- Possible 500 errors (all plain text):
  - Something goes wrong on the server side: `Something went wrong. Please try again later`

## Reserves a specific room and inserts new info into the database
**Request Format:** /library/reserve with POST parameters `id`, `room_num`, `date`, `start`, and `end`

**Request Type**: POST

**Returned Data Format**: Plain Text

**Description:** Reserves a specific room that the user has chosen and returns a 6
digit confimation code that is unique to that reservation and user.

**Example Request:** /library/user/ with `id=1`, `room_num=8`, `date=2023-06-05`, `start=9:00 AM`, `end=10:30 AM`

**Example Response:**
```
142159
```

**Error Handling:**
- Possible 400 (invalid request) errors (all plain text):
  - If id, room_num, start, end, or date are missing: `Missing one or more parameters`;
  - If the user is not logged in or their userId is not in the db: `User is not logged in or user does not exist.`
- Possible 500 errors (all plain text):
  - Something goes wrong on the server side: `Something went wrong. Please try again later`
