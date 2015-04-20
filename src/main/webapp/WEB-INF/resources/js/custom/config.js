app.config([ '$routeProvider', '$httpProvider', function($routeProvider, $httpProvider, ErrorHandler) {
	
	// ========= Global setting for all POST request ================
	
	// $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
	
	// ========== CORS ===========
  	
  	$httpProvider.defaults.useXDomain = true;
  	delete $httpProvider.defaults.headers.common['X-Requested-With'];

	// ======= router configuration =============

	$routeProvider
		.when('/', {
			templateUrl: 'resources/html/partials/view/main.html'
		})
		.when('/schools/listing', {
			controller: 'SchoolListController',
			templateUrl: 'resources/html/partials/view/school_listing.html'
		})
		.when('/schools/profile/:schoolId', {
			controller: 'SchoolController',
			templateUrl: 'resources/html/partials/view/school_profile.html'
		})
		.when('/forum', {
			templateUrl: 'resources/html/partials/view/forum.html'
		})
		.when('/users/confirm_email', {
			controller: 'UserController',
			templateUrl: 'resources/html/partials/view/main.html'
		})
		.when('/users/forget_password', {
			controller: 'PasswordController',
			templateUrl: 'resources/html/partials/view/main.html'
		})
		.when('/admin/users', {
			controller: 'AdminController',
			templateUrl: 'resources/html/partials/view/user_admin.html'
		})
		.when('/login', {
			templateUrl: 'resources/html/partials/view/login.html'
		})
		.otherwise({ redirectTo : "/"});
	
	// ======== http configuration ===============
	
	//configure $http to view a login whenever a 401 unauthorized response arrives
    $httpProvider.responseInterceptors.push(function ($rootScope, $q) {
        return function (promise) {
            return promise.then(
                //success -> don't intercept
                function (response) {
                    return response;
                },
                //error -> if 401 save the request and broadcast an event
                function (response) {
                    if (response.status === 401) {
                        var deferred = $q.defer(),
                            req = {
                                config: response.config,
                                deferred: deferred
                            };
                        
                        $rootScope.requests401.push(req);
                        
                        if($('#loginModal').hasClass('in')){
                        	ErrorHandler.loginError({code:"LOGIN_FAILURE", message:"Invalid Username or Password!"});
                        }else{
                        	ErrorHandler.loginError({code:"LOGIN_REQUIRED", message:"Login is required for this action!"});
                        }
                        
                        $rootScope.$broadcast('event:loginRequired');
                        return deferred.promise;
                    }
                    else if (response.status === 403){
                    	var d = $q.defer();
                    	
                    	return d.promise;
                    }
                    return $q.reject(response);
                }
            );
        };
    });
    
    /* Registers auth token interceptor, auth token is passed by header */
	$httpProvider.interceptors.push(function ($q, $rootScope, $location) {
		        return {
		        	'request': function(config) {
		        		
		        		var isRestCall = config.url.indexOf('api') > -1;
		        		if (isRestCall && angular.isDefined($rootScope.authToken)) {
		        			var authToken = $rootScope.authToken;
		        			config.headers['X-Auth-Token'] = authToken;
		        		}
		        		return config || $q.when(config);
		        	}
		        };
	});

}]);

/*Initialize Facebook SDK*/
app.config(function(FacebookProvider) {
     FacebookProvider.init('1440329576259312');
 });
 
 /*Initialize Google SDK*/
 app.config(['GooglePlusProvider', function(GooglePlusProvider) {
     GooglePlusProvider.init({
        clientId: '858505712451-ua9j1qcir35raoujchmugm5he5ukvbhq.apps.googleusercontent.com',
        apiKey: 'AIzaSyCJOOZG0AMoxcDs8mnCVME-2lQ76c__sBg'
     });
}]);



  