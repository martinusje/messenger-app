var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('MAPP.db');

db.serialize(function() {

  db.run("CREATE TABLE if not exists messages (id integer primary key, time text, msg text, usr text, usrid integer)");
  db.run("CREATE TABLE if not exists userInfo (id integer primary key, usr text, usrid integer, pwd text)");
  var stmt = db.prepare("INSERT INTO userInfo (usr, usrid, pwd) VALUES (?,?,?)");
      stmt.run("Martijn Verhoeven", "1", "Martijn123!");
      stmt.run("Joost van der Weerd", "2", "Joost123!");
  stmt.finalize();
});

db.close();