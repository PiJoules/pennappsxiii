var constants = require('../helpers/constants');

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

			var expenses_data = {
				total: 0.0
			}

			var category_data = {
				'Other': { name: 'Other', total: 0.0, transactions: [] }
			};

			for (var i = 0; i < constants.BUDGET_CATEGORIES.length; i++) {
				category_data[constants.BUDGET_CATEGORIES[i]] = { name: constants.BUDGET_CATEGORIES[i], total: 0.0, transactions: [] };
			}

			for (var i = 0; i < response.transactions.length; i++) {
				var trans = response.transactions[i];
				if (trans.category) {
					var cat = trans.category[0];
					category_data[cat].transactions.push(trans);
				} else {
					category_data.Other.transactions.push(trans);
				}
			}

			for (var category in category_data) {
				var total = 0.0;

				if (!category_data.hasOwnProperty(category)) continue;

				var single_category_data = category_data[category];
				for (var i = 0; i < single_category_data.transactions.length; i++) {
					var trans = single_category_data.transactions[i];
					if (trans.amount) {
						total += trans.amount;
					}
				}
				single_category_data.total = total;
				expenses_data.total += total;
			}

			console.log(category_data);
			console.log(expenses_data);

			return res.render('home', {
				title: 'Home',
				category_data: category_data,
				expenses_data: expenses_data
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