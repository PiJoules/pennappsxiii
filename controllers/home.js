/**
 * GET /
 * Home page.
 */

exports.index = function(req, res, next) {
	res.render('home', {
		title: 'Home',
	});
}

exports.getLandingPage = function(req, res) {
  // if a user is logged in, redirect to the homepage
	if (req.user){
		return res.redirect('/home');
	} else {
		res.render('landing_page', {
			title: 'CashStrapped'
		});
	}
};