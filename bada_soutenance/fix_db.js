const mongoose = require("mongoose");
const _ = require("lodash");
var ObjectID = require("mongodb").ObjectID;
module.exports = (function() {
  mongoose
    .connect("mongodb://localhost:27017/BADA", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => console.log("Connexion à MongoDB réussie !"))
    .catch(() => console.log("Connexion à MongoDB échouée !"));

  let db = mongoose.connection;
  let to_fix = [
    "LES_ETUDIANTS",
    "LES_PROFESSEURS",
    "LES_ENSEIGNEMENTS",
    "LES_SEANCES",
    "MATIERES",
    "SALLES",
    "GROUPES"
  ];
  //   let to_fix = ["LES_ETUDIANTS"];
  _.map(to_fix, doc => {
    db.collection(doc).find({}, (err, data) => {
      data.toArray((e, tab) => {
        _.map(tab, row => {
          _.map(row, (val, attr, i) => {
            if (_.isArray(val)) {
              if (_.isArray(val[0])) return;
              let v_old = val[0];
              let v_new = isNaN(v_old) ? v_old : Number(v_old);
              row[attr] = attr == "DATE" ? new Date(v_new) : v_new;
            }
          });
          let _id = _.clone(row._id);
          delete row._id;
          db.collection(doc).update({ _id: _id }, { $set: row }, function(
            err,
            result
          ) {
            if (err) {
              console.log("Error updating object: " + err);
              res.send({ error: "An error has occurred" });
            } else {
              console.log("" + result + " document(s) updated");
            }
          });
        });
      });
    });
  });
})();
