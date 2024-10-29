CREATE TABLE users (
  "id"	INTEGER,
  "name"	TEXT,
  "username"	TEXT,
  "key"	TEXT,
  PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE rooms (
  "room_num" INTEGER,
  "capacity" INTEGER,
  "img" TEXT,
  "description" TEXT,
  "type" TEXT,
  PRIMARY KEY("room_num")
);

CREATE TABLE history (
  "id" INTEGER,
  "room_num" INTEGER,
  "date" DATETIME DEFAULT (datetime('now', 'localtime')),
  "confirm_num"	INTEGER,
  PRIMARY KEY("confirm_num"),
  FOREIGN KEY("id") REFERENCES "users"("id"),
  FOREIGN KEY("room_num") REFERENCES "rooms"("room_num")
);

CREATE TABLE reserved (
  "room_num" INTEGER,
  "start_time" TEXT,
  "end_time" TEXT,
  "confirm_num" INTEGER,
  "date" TEXT,
  PRIMARY KEY("confirm_num"),
  FOREIGN KEY("room_num") REFERENCES "rooms"("room_num")
);