// Middlewares

exports.isUser = function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('danger', 'Please log in.');
        res.redirect('/login');
    }
}

exports.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        next();    
    }
}

// exports.isAdmin = function(req, res, next) {
//     if (req.isAuthenticated() && res.locals.user.admin == 1) {
//         next();
//     } else {
//         req.flash('danger', 'You don\'t have permission to do that.');
//         res.redirect('/users/login');
//     }
// }

exports.secret = "Not so secret key"
