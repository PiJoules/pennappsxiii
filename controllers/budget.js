var _ = require('lodash');
var async = require('async');
var plaid = require('plaid');
var User = require('../models/User');

/*
 * Plaid client
 */
var plaidClient = new plaid.Client(process.env.PLAID_CLIENT_ID,
                                   process.env.PLAID_SECRET,
                                   plaid.environments.tartan);

exports.getBudget = function(req, res, next) {
	return res.render('budget', {
		title: 'Budget',
	});
}

exports.updateBudget = function(req, res, next) {
	User.findById(req.user.id, function(err, user) {
	    if (err) {
	      return next(err);
	    }

	    if (req.body.totalBudget) {
	    	user.totalBudget = req.body.totalBudget;
	    }

	    user.save(function(err){
	    	if (err) {
				return next(err);
			}
			req.flash('success', { msg: 'Budget information updated.' });
			res.redirect('/budget');
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