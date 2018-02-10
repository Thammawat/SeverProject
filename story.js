const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// create a schema
var storySchema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    title: String,
    created_at: Date,
    updated_at: Date
  });
  
  // the schema is useless so far
  // we need to create a model using it
  var Story = mongoose.model('Story', storySchema);
  
  // make this available to our users in our Node applications
  module.exports = Story;