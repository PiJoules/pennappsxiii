/*
 * Plaid client
 */
var plaid = require('plaid');
var plaidClient = new plaid.Client(process.env.PLAID_CLIENT_ID,
                                   process.env.PLAID_SECRET,
                                   plaid.environments.tartan);

/**
 * GET /
 * Home page.
 */

exports.index = function(req, res, next) {
	if (req.user && req.user.plaid_access_token) {
		plaidClient.getConnectUser(req.user.plaid_access_token, function(err, response) {
			if (err) {
				console.log(err);
				req.flash('errors', { msg: 'Unable to get transaction information.' });
				return res.redirect('/home');
			}
			return res.render('home', {
				title: 'Home',
				transactions: response.transactions
			});
		});
	} else {
		return res.render('home', {
			title: 'Home',
		});
	}
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