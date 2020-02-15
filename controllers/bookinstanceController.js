var BookInstance = require('../models/bookinstance');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var hbs = require("hbs");
var Book = require('../models/book');
var async = require("async");

hbs.registerHelper("if_meh_eq", function(a, b, opts) {
    let compA = a.toString();
    let compB = b.toString();
    if (compA === compB)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

hbs.registerHelper("if_eq", function(a, b, opts) {
    if (a === b)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

hbs.registerHelper("if_neq", function(a, b, opts) {
    if (a !== b)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

hbs.registerHelper("if_less_than", function(a, b, opts) {
    if (a < b - 1)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

hbs.registerHelper("if_ex", function(a, opts) {
    if (typeof a !== "undefined")
        return opts.fn(this);
    else
        return opts.inverse(this);
});

hbs.registerHelper("check_with_all", function(a, array, opts){
    const reducer = (acc, cur) => {
        return a.toString() === cur._id.toString() || acc;
    }
    const value = array.reduce(reducer, false);
    if (value)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

hbs.registerHelper("each_sort_name", (array, sortBy, opts) => {
    array = array.sort((a, b) => {
        let textA = a[sortBy].toUpperCase();
        let textB = b[sortBy].toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    })
    let string = ""
    for (var i = 0; i<array.length; i++) {
        string += opts.fn(array[i]);
    }
    return string;
    
})

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate("book")
    .exec((err, list_bookinstances) => {
        if (err) {return next(err);}
        res.render("bookinstance_list", 
        {title: "Book Instance List", bookinstance_list: list_bookinstances})
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function(err, bookinstance) {
        if (err) {return next(err); }
        if (bookinstance == null ) {
            var err = new Error("Book copy not found");
            err.status = 404;
            return next(err);
        }
        res.render("bookinstance_detail", {title: "Copy " + bookinstance.book.title, bookinstance: bookinstance});
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res) {
    Book.find({}, "title")
    .exec(function(err, books) {
        if (err) {return next(err);}
        res.render("bookinstance_form", {title: "Create BookInstance", book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {
    BookInstance.findById(req.params.id)
    .exec(function(err, results) {
        if (err) {return next(err);}
        if (results == null) {
            var err = new Error("Book not found");
            err.status = 404;
            return next(err);
        }
        res.render("bookinstance_delete", {title: "Delete Book Instance", bookinstance: results});
    })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findById(req.body.bookinstanceid)
    .exec(function(err, results) {
        if (err) {return next(err); }
        else {
            BookInstance.findByIdAndRemove(req.body.bookinstanceid, function(err) {
                if (err) {return next(err);}
                res.redirect("/catalog/bookinstances");
            })
        }
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        bookInstance: function(callback) {
            BookInstance.findById(req.params.id)
              .populate("book")
              .exec(callback);
        },
        books: function(callback) {
            Book.find(callback);
        }
    }, 
    function(err, results) {
        if (err) {return next(err);}
        if (results == null) {
            var err = new Error("Book copy not found");
            err.status = 404;
            return next(err);
        }
        res.render("bookinstance_form", {title: "Update BookInstance", book_list: results.books, bookinstance: results.bookInstance});
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    (req, res, next) => {
        const errors = validationResult(req);
        var bookinstance = new BookInstance(
            { book: req.body.book,
              imprint: req.body.imprint,
              status: req.body.status,
              due_back: req.body.due_back,
              _id: req.params.id
             });
        if (!errors.isEmpty()) {
            async.parallel({
                bookInstance: function(callback) {
                    BookInstance.findById(req.params.id)
                      .populate("book")
                      .exec(callback);
                },
                books: function(callback) {
                    Book.find(callback);
                }
            }, function(err, results) {
                if (err) {return next(err);}
                res.render("bookinstance_form", {title: "Update BookInstance", book_list: results.books, bookinstance: results.bookInstance, errors: errors.array()});
            })
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, the_book) {
                if (err) {return next(err)}
                res.redirect(the_book.url);
            })
        }
    }
]