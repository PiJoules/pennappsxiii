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
		var numDaysToGet = 0;
		var daysFromStartOfMonth = new Date().getDate();

		switch(req.user.budgetPeriod) {
			case 'weekly':
				numDaysToGet = Math.min(7, daysFromStartOfMonth);
				break;
			case 'monthly':
				numDaysToGet = Math.min(31, daysFromStartOfMonth);
				break;
			default:
				numDaysToGet = Math.min(365, daysFromStartOfMonth);
				break;
		}
		// var daysQuery = numDaysToGet + ' days ago';
		var daysQuery = '1000000 days ago';
		plaidClient.getConnectUser(req.user.plaid_access_token, {
		  gte: daysQuery,
		}, function(err, response) {
			console.log(response);
			if (err) {
				console.log(err);
				req.flash('errors', { msg: 'Unable to get transaction information.' });
				return res.redirect('/home');
			}

			var expenses_data = {
				total: 0.0
			}

			var category_data = {
				'Other': { categoryName: 'Other', total: 0.0, percentOfTotal: 0, transactions: [] }
			};

			for (var i = 0; i < constants.BUDGET_CATEGORIES.length; i++) {
				category_data[constants.BUDGET_CATEGORIES[i]] = { categoryName: constants.BUDGET_CATEGORIES[i], total: 0.0, percentOfTotal: 0, transactions: [] };
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
				var category_budget = null;
				var user_budgets_category = false;
				for (var i = 0; i < req.user.budgets.length; i++){
					if (req.user.budgets[i].categoryName == category) {
						user_budgets_category = true;
						category_budget = req.user.budgets[i];
						break;
					}
				}
				if (!user_budgets_category) {
					category_data[category] = null;
					continue;
				}

				var total = 0.0;

				if (!category_data.hasOwnProperty(category)) continue;

				var single_category_data = category_data[category];
				for (var i = 0; i < single_category_data.transactions.length; i++) {
					var trans = single_category_data.transactions[i];
					if (trans.amount && trans.amount > 0) {
						total += trans.amount;
					}
				}
				single_category_data.total = total;

				var percentOfAll = (total / req.user.totalBudget) * 100;
				single_category_data.percentOfAll = Math.min(percentOfAll, 100);

				var percentOfCategoryBudget = (total / category_budget.amount) * 100;
				single_category_data.percentOfCategoryBudget = Math.min(percentOfCategoryBudget, 100);
				single_category_data.budgetAmount = category_budget.amount;

				expenses_data.total += total;
			}

			return res.render('home', {
				title: 'Home',
				category_data: category_data,
				expenses_data: expenses_data,
				bar_colors: constants.BAR_COLORS
			});
		});
	} else {
		return res.render('home', {
			title: 'Home',
			bar_colors: null
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