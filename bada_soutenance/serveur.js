const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.json());

// Allow CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// Connexion to mongoDb
mongoose
  .connect("mongodb://localhost:27017/BADA", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

let db = mongoose.connection;
// Routes
//require('./routes/Groupes')(app,db);

app.post("/", async function(req, res) {
  let params = req.body;
  var groupe = await db
    .collection("LES_SEANCES")
    .find({
      DATE: {
        $gte: new Date(params.date.start),
        $lte: new Date(params.date.end)
      }
    })
    .toArray(async function(err, dota) {
      let data = _.cloneDeep(dota);
      for (let i = 0; i < data.length; i++) {
        const seance = data[i];
        let enseignement = await db
          .collection("LES_ENSEIGNEMENTS")
          .findOne({ CODE: seance.ENSEIGNEMENT });
        data[i]["MATIERE"] = enseignement;
        for (let j = 0; j < seance.LES_RESSOURCES.UNE_RESSOURCE.length; j++) {
          const r = seance.LES_RESSOURCES.UNE_RESSOURCE[j];
          if (r.TYPE) {
            let collec =
              (r.TYPE[0] == "PROF" ? "LES_PROFESSEUR" : r.TYPE[0]) + "S";

            let rez = await db
              .collection(collec)
              .findOne({ CODE: Number(r.CODE_RESSOURCE[0]) });
            if (rez) {
              data[i][collec] = rez;
            }
          }
        }
      }
      if (params.professeur)
        data = _.filter(data, s => {
          if (s.LES_PROFESSEURS) {
            if (s.LES_PROFESSEURS.CODE == params.professeur) return true;
            return false;
          }
          return false;
        });
      res.send(data);
    });
});
app.get("/profs", function(req, res) {
  var groupe = db
    .collection("LES_PROFESSEURS")
    .find()
    .toArray(function(err, data) {
      res.send(data);
    });
});
app.get("/etudiants", function(req, res) {
  var groupe = db
    .collection("LES_ETUDIANTS")
    .find()
    .toArray(function(err, data) {
      res.send(data);
    });
});
app.get("/matieres", function(req, res) {
  var groupe = db
    .collection("MATIERES")
    .find()
    .toArray(function(err, data) {
      res.send(data);
    });
});

app.get("/login/:code", function(req, res) {
  var groupes = [];
  db.collection("GROUPES")
    .find({
      "LES_ETUDIANTS_DU_GROUPE.UN_CODE_ETUDIANT": req.params.code
    })
    .toArray((err, data) => {
      data.forEach(element => {
        groupes.push(element.CODE);
        if (groupes.length == data.length) res.send(groupes);
      });
    });
});

app.get("/seance/:code", function(req, res) {
  var arrayFinal = [];
  var ressources = [];
  var enseignements = [];

  db.collection("LES_SEANCES")
    .find({
      "LES_RESSOURCES.UNE_RESSOURCE.CODE_RESSOURCE": req.params.code
    })
    .toArray((err, ressources) => {
      ressources.forEach(element => {
        db.collection("LES_ENSEIGNEMENTS")
          .find({
            CODE: element.ENSEIGNEMENT
          })
          .toArray(function(err, result) {
            var heure_string = element.HEURE[0];
            var date_start = new Date(element.DATE[0]);
            var duree_string = element.DUREE[0];

            if (heure_string.length > 3) {
              var heure_debut = heure_string.substring(0, 2);
              var minutes_debut = heure_string.substring(2, 4);
            } else {
              var heure_debut = heure_string.substring(0, 1);
              var minutes_debut = heure_string.substring(1, 3);
            }

            date_start.setHours(heure_debut, minutes_debut);

            if (duree_string.length > 3) {
              var duree_heure = duree_string.substring(0, 2);
              var duree_minutes = duree_string.substring(2, 4);
            } else {
              var duree_heure = duree_string.substring(0, 1);
              var duree_minutes = duree_string.substring(1, 3);
            }

            var date_fin = new Date(date_start);
            date_fin.setHours(date_fin.getHours() + parseInt(duree_heure));
            date_fin.setMinutes(
              date_fin.getMinutes() + parseInt(duree_minutes)
            );

            var reponse = {
              Id: 5,
              Subject: result[0]["NOM"][0],
              StartTime: new Date(date_start),
              EndTime: new Date(date_fin),
              IsAllDay: false,
              Status: "Completed",
              Priority: "High",
              IsReadonly: true
            };

            arrayFinal.push(reponse);
            if (arrayFinal.length == ressources.length) res.send(arrayFinal);
          });
      });
    });
});

app.use((req, res, next) => {
  res.json({ message: "Votre requête a bien été reçue !" });
  next();
});

app.listen(process.env.PORT || "3012", function() {
  console.log("Example app listening on port 3012 !");
});
module.exports = app;
