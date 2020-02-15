var Genre = require('../models/genre');
var Book = require("../models/book");
var async = require("async");

const validator = require("express-validator");

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    Genre.find()
    .sort([["name", "ascending"]])
    .exec(function(err, list_genres){
        if (err) {
            return next(err);
        }
        res.render("genre_list", {title: "Genre List", genre_list: list_genres});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
            .exec(callback);
        },
        genre_books: function(callback) {
            Book.find({"genre": req.params.id})
            .exec(callback);
        }
    }, function(err, results) {
        if (err) {return next(err); }
        if (results.genre == null) {
            var err = new Error("Genre Not Found");
            err.status = 404;
            return next(err);
        }
        res.render("genre_detail", {title: "Genre Detail", 
        genre: results.genre, genre_books: results.genre_books});
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render("genre_form", {title: "Create Genre"});
};

// Handle Genre create on POST.
exports.genre_create_post = [
    validator.body("name", "Genre name required").isLength({min: 1}).trim(),
    validator.sanitizeBody("name").escape(),
    (req, res, next) => {
        const errors = validator.validationResult(req);
        var genre = new Genre(
            { name: req.body.name }
        );
        if (!errors.isEmpty()) {
            res.render("genre_form", {title: "Create Genre", genre: genre, 
            errors: errors.array()})
        } else {
            Genre.findOne({"name": req.body.name})
            .exec(function(err, found_genre) {
                if(err) {return next(err);}
                if (found_genre) {
                    res.redirect(found_genre.url);
                } else {
                    genre.save(function(err) {
                        if (err) {return next(err);}
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
]

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id)
            .exec(callback);
        },
        books: function(callback){
            Book.find({"genre": req.params.id})
            .exec(callback);
        }
    }, function(err, results) {
        if (err) {return next(err); }
        if (results == null) {
            var err = new Error("Genre not found");
            err.status = 404;
            return next(err);
        }
        res.render("genre_delete", {title: "Delete Genre", genre: results.genre, books: results.books})
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
    async.parallel({
        genre: function(callback){
            Genre.findById(req.body.genreid)
            .exec(callback);
        },
        books: function(callback){
            Book.find({"genre": req.body.genreid})
            .exec(callback);
        }
    }, function(err, results) {
        if (err) {return next(err);}
        if (results.books.length > 0) {
            res.render("genre_delete", {title: "Delete Genre", genre: results.genre, book: results.book});
            return;
        } else {
            Genre.findByIdAndRemove(req.body.genreid, function (err, results){
                if (err) {return next(err);}
                res.redirect("/catalog/genres")
            })
        }
    })
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
        Genre.findById(req.params.id)
        .exec(function(err, results) {
            if (err) {return next(err);}
            if (results == null) {
                var err = new Error("Genre Not Found");
                err.status = 404;
                return next(err);
            }
            res.render("genre_form", {title: "Update Genre", genre: results});
        })
};

// Handle Genre update on POST.
exports.genre_update_post = [
    validator.body("name", "Genre name required").isLength({min: 1}).trim(),
    validator.sanitizeBody("name").escape(),
    (req, res, next) => {
        const errors = validator.validationResult(req);
        var genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });
        if (!errors.isEmpty()) {
            Genre.findById(req.params.id).exec({
                function(err, results) {
                if (err) {return next(err);}
                res.render("genre_form", {title: "Update Genre", genre: results, errors: errors.array()})
                }
            });
        } else {
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, the_genre) {
                if (err) {return next(err);}
                res.redirect(the_genre.url);
            })
        }
    }
]