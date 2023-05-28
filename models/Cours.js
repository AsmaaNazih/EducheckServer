const mongoose= require('mongoose');
const {Binary} = require("mongodb");

const CoursSchema = mongoose.Schema({
  name: {
      required: true,
      type: String
  },
  uniName: {
      required: true,
      type: String
  },
  pathName: {
      required: true,
      type: String
  },
  pathType: {
      required: true,
      type: String
  },
 credit: {
      required: true,
      type: String
 },
 profName: {
      required: false,
      type: String
 }
});


module.exports = mongoose.model('Cours', CoursSchema); // on ajoute cette Schema dnas la base de donnee