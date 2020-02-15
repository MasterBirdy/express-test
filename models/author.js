var mongoose = require("mongoose");
var moment = require("moment");

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
    {
        first_name: {type: String, required: true, max: 100},
        family_name: {type: String, required: true, max: 100},
        date_of_birth: {type: Date},
        date_of_death: {type: Date}
    }
);

// Virtual for author full name
AuthorSchema
.virtual("name")
.get(function() {
    var fullname = "";
    if (this.first_name && this.family_name) {
        fullname = this.family_name + ", " + this.first_name;
    }
    if (!this.first_name || !this.family_name) {
        fullname = "";
    }
    return fullname;
});

// virtual for author lifespan

AuthorSchema
.virtual("date_of_birth_formatted")
.get(function() {
    return this.date_of_birth ? moment(this.date_of_birth).format("MM-DD-YYYY") : "N/A";
});

AuthorSchema
.virtual("date_of_death_formatted")
.get(function() {
    return this.date_of_death ? moment(this.date_of_death).format("MM-DD-YYYY") : "alive";
});

AuthorSchema
.virtual("date_of_birth_input")
.get(function() {
  return moment(this.date_of_birth).format("YYYY-MM-DD");
})

AuthorSchema
.virtual("date_of_death_input")
.get(function() {
  return moment(this.date_of_death).format("YYYY-MM-DD");
})

AuthorSchema
.virtual("lifespan")
.get(function() {
    return `(${this.date_of_birth ? moment(this.date_of_birth).format("MM-DD-YYYY") : "N/A"} - ${this.date_of_death ? moment(this.date_of_death).format("MM-DD-YYYY") : "alive"})`;
});

AuthorSchema
.virtual("url")
.get(function() {
    return "/catalog/author/" + this._id;
});

module.exports = mongoose.model("Author", AuthorSchema);