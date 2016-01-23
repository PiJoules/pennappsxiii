var _ = require('lodash');
var async = require('async');
var plaid = require('plaid');
var User = require('../models/User');
var constants = require('../helpers/constants');

/*
 * Plaid client
 */
var plaidClient = new plaid.Client(process.env.PLAID_CLIENT_ID,
                                   process.env.PLAID_SECRET,
                                   plaid.environments.tartan);

exports.getBudget = function(req, res, next) {
	return res.render('budget', {
		title: 'Budget',
		budget_categories: constants.BUDGET_CATEGORIES
	});
}

exports.updateBudget = function(req, res) {
	User.findById(req.user.id, function(err, user) {
	    if (err) {
	      response = {
	      	code: 500,
	      	msg: 'Couldn\'t find user.'
	      }
	      return res.send(response);
	    }

	    if (req.body.totalBudget) {
	    	user.totalBudget = req.body.totalBudget;
	    }

	    if (req.body.budgetPeriod) {
	    	user.budgetPeriod = req.body.budgetPeriod;
	    }

	    if (req.body.budgets) {
	    	user.budgets = req.body.budgets;
	    } else {
	    	user.budgets = [];
	    }

	    user.save(function(err){
	    	if (err) {
				response = {
					code: 500,
					msg: 'Couldn\'t save user.'
				}
				return res.send(response);
			}
			response = {
				code: 200,
				msg: 'Budget settings updated.'
			}
			return res.send(response);
	    });
	});
}

exports.authenticatePlaid = function(req, res) {
	var public_token = req.body.public_token;
	plaidClient.exchangeToken(public_token, function(err, response) {
	    if (err != null) {
	    	console.log(err);
			req.flash('errors', { msg: 'Invalid login information.' });
			return res.redirect('/home');
	    } else {
			var access_token = response.access_token;
			User.findById(req.user.id, function(err, user) {
				if (err) {
					req.flash('errors', { msg: 'Unable to find user.' });
					return res.redirect('/home');
				}

				user.plaid_public_token = public_token;
				user.plaid_access_token = access_token;

				user.save(function(err){
					if (err) {
						req.flash('errors', { msg: 'Unable to save account information.' });
					}
					return res.redirect('/home');
				});
			});
	    }
	});
}

exports.authenticateBank = function(req, res) {
	if (!req.body.username || !req.body.password || !req.body.institution) {
		response = {
			code: 400,
			msg: 'Bad parameters.'
		}
		return res.send(response);
	}

	plaidClient.addConnectUser(req.body.institution, {
	  username: req.body.username,
	  password: req.body.password,
	}, function(err, mfaResponse, response){
		if (err != null){
			console.log(err);
			error_response = {
				code: 400,
				msg: 'Invalid login credentials.'
			}

			return res.send(error_response);
		}
		return res.send(response);
	});
}