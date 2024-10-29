Library Room Reservation

This is a Node.js application for managing room reservations in a library. Users can log in, create accounts, search for study rooms, view available rooms, and make reservations. The application uses SQLite as the database to store user information and reservation history.

Features:
User registration with UW email verification.
User login with email and password authentication.
Search for study rooms based on various criteria (description, type, capacity).
View all available study rooms and their details.
Reserve study rooms and receive a confirmation code.
View reservation history and details for logged-in users.

Technologies Used:
Node.js: Server-side runtime environment.
Express: Web framework for Node.js.
SQLite: Lightweight database for storing user and reservation data.
Multer: Middleware for handling multipart/form-data, primarily for file uploads.
JavaScript: Programming language used for server-side logic.

Installation:
Clone the repository:
git clone https://github.com/jbowton/UW-Study-Room-Reservation.git
cd UW-Study-Room-Reservation

Install dependencies:
npm install

Set up the database:
Create a file named library.db in the project root or use an existing SQLite database with the appropriate schema.

Start the server:
node app.js
The application will be running on http://localhost:8000