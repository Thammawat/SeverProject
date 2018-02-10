const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// create a schema
var userSchema = new Schema({
    name: String,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    admin: Boolean,
    location: String,
    meta: {
      age: Number,
      website: String
    },
    created_at: Date,
    stories : [{ type: Schema.Types.ObjectId, ref: 'Story' }],
    updated_at: Date
  });
  
  // the schema is useless so far
  // we need to create a model using it
  var User = mongoose.model('User', userSchema);
  
  // make this available to our users in our Node applications
  module.exports = User;