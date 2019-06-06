var routes = [{
	name: 'home',
	path: '/',
	url: './index.html',
	on: {
		pageInit: function() {
			checkToken();
		}
	},
	beforeEnter: [checkToken],
	tabs: [{
		path: '/',
		id: 'tab-classes',
		templateUrl: './tabs/classes.html',
	}, {
		path: '/tab-week',
		id: 'tab-week',
		templateUrl: './tabs/week.html',
	}, {
		path: '/tab-programming',
		id: 'tab-programming',
		templateUrl: './tabs/programming.html',
	}]
}, {
	name: 'class',
	path: '/class/:classId',
	templateUrl: './pages/class.html',
}]
