$(document).on('ready', function(){
	var budgetForm = $('#budgetForm');
	var categoryForm = $('#addCategoryForm')
	var categoriesList = $('#categories');
	var categoryBudget = $('#categoryBudget');
	var categoryModal = $('#addCategoryModal');
	var totalBudgetInput = $('#totalBudget');
	var budgetPeriodList = $('#budgetPeriod');
	var budgetList = $('#budgetList');

	var budgetData = {
		budgets: user.budgets
	}

	if (user.budgetPeriod) {
		budgetPeriodList.find('option[value=' + user.budgetPeriod + ']').prop('selected', true);
	}

	var addBudgetToList = function(budget) {
		var elId = 'category-' + budget.categoryName.replace(/\ /g, '_');
		var removeId = 'remove-' + budget.categoryName.replace(/\ /g, '_');
		budgetList.append(
			'<div class="budget-item col-sm-4 no-margin-left" id="' + elId + '">' +
				'<h5>' + budget.categoryName + '</h5>' +
				'<p>$' + budget.amount + '</p>' +
				'<p class="cursor" id="' + removeId + '"> Remove <i class="fa fa-close"></i></p>' +
			'</div>'
		);

		$('#' + removeId).on('click', function(){
			for (var i = 0; i < budgetData.budgets.length; i++) {
				if (budgetData.budgets[i].categoryName == budget.categoryName) {
					budgetData.budgets.splice(i, 1);
				}
			}
			$('#' + elId).remove();
		});
	}

	if (user && user.budgets) {
		for (var i = 0; i < user.budgets.length; i++) {
			var budget = user.budgets[i];
			var budgetJSON = {
				categoryName: budget.categoryName,
				amount: budget.amount
			}
			addBudgetToList(budgetJSON);
		}
	}	

	var categoryExistsInUserBudget = function(cat){
		for (var i = 0; i < budgetData.budgets.length; i++){
			if (budgetData.budgets[i].categoryName == cat) {
				return true;
			}
		}
		return false;
	}

	$('#openAddCategoryModal').on('click', function(e){
		e.preventDefault();

		categoryBudget.val(1);
		categoriesList.empty();
		for (var i = 0; i < budgetCategories.length; i++){
			var cat = budgetCategories[i];
			var exists = categoryExistsInUserBudget(cat);
			if (!exists) {
				categoriesList.append('<option value=' + encodeURIComponent(cat) + '>' + cat + '</option>');
			}
		}
	});

	categoryForm.on('submit', function(e){
		e.preventDefault();

		var category = decodeURIComponent(categoriesList.find(":selected").text());
		var amount = categoryBudget.val();

		var budget = { 
			categoryName: category, 
			amount: amount 
		}

		budgetData.budgets.push(budget);
		addBudgetToList(budget);

		categoryModal.modal('hide');
	});

	budgetForm.on('submit', function(e){
		e.preventDefault();

		var totalBudget = totalBudgetInput.val();
		var budgetPeriod = budgetPeriodList.find('option:selected').val();

		$.post('/budget/update', { totalBudget: totalBudget, budgetPeriod: budgetPeriod, budgets: budgetData.budgets })
		.done(function(data){
			$('#flash-message').text('Budget settings updated!');
			$('#flash').show();
		});
	});

});