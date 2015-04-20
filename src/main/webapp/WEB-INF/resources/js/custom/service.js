app.service('CustomerService', function ($http, $q) {
    this.getCustomers = function () {
        var d = $q.defer();

        $http.get('customer/customers/retrieve')
            .success(function (response) {
                d.resolve(response);
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    };

    this.deleteCustomer = function (id) {
        var d = $q.defer();

        $http.delete('customer/delete/' + id)
            .success(function (response) {
                d.resolve(response);
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    };

    this.saveCustomer = function (customer) {
        var d = $q.defer();

        $http.post('customer/save', customer)
            .success(function (response) {
                d.resolve(response);
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    };
});

app.service('SchoolService', function ($http, $q, APP_CONFIG) {
    this.getSchools = function () {
        var d = $q.defer();
		
		// actual rest url: http://localhost:8080/AuthServer/api/schools
        $http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/resources/schools.json')
            .success(function (response) {
                d.resolve(response);
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    };
    
    this.getSchoolProfile = function (schoolId) {
        var d = $q.defer();
		
		// actual rest url: http://localhost:8080/AuthServer/api/schools/schoolId
        $http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/resources/school.json')
            .success(function (response) {
                d.resolve(response);
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    };
    
    this.rateSchool = function (schoolId, value) {
        var d = $q.defer();
		
      	var data = 'rating=' + value;
		// call school rating API
        $http.post(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/schools/'+schoolId+'/ratings', data, {
        		headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    		})
            .success(function (response) {
                d.resolve(response);
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    };
    
    this.followSchool = function(schoolId, userId){
    	var d = $q.defer();
		
		var sc_id = schoolId.split("-");
    	var s_id= sc_id[0];
    	
      	var data = 'schoolId=' + s_id + '&userId=' + userId;
		// call school rating API
        $http.post(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/schools/'+schoolId+'/follows', data, {
        		headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    		})
            .success(function (response) {
                d.resolve(response);
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    
    };
    
});


app.service('AuthenticationService', function ($http, $q, $rootScope, $location, localStorageService, APP_CONFIG) {

	var userRoleRouteMap = {
        'ROLE_ADMIN': [ '/admin/users', '/school/listing', '/schools/profile/:schoolId', '/authError' ],
        'ROLE_USER': [ '/school/listing', '/schools/profile/:schoolId' , '/authError']
    };

	this.redirectToUrlAfterLogin =  { url: '/' };
	
	this.saveAttemptUrl = function() {
        this.redirectToUrlAfterLogin.url = $location.path();
    };
    
    this.redirectToAttemptedUrl = function() {
      	$location.path(this.redirectToUrlAfterLogin.url);
    };
	
    this.login = function (username, password) {
        var d = $q.defer();
        
		var data = 'username=' + username + '&password=' + password;
		
        $http.post(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/user/authenticate', data, {
        		headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    		})
            .success(function (data) {
            
            	var authToken = data.token;
				$rootScope.authToken = authToken;
				
				localStorageService.set('localStorageToken', authToken);
				
				// now fetch the user 
				$http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/user/me')
		            .success(function (user) {
		            
		            	$rootScope.user = user;
		            	
		            	console.log(user);
		            	
		            	localStorageService.set('localStorageUser', user);
		            	
		                d.resolve();
		            })
		            .error(function () {
		                d.reject();
		            });

                d.resolve();
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    };

    this.logout = function () {
        var d = $q.defer();

        $http.get('j_spring_security_logout')
            .success(function () {
                localStorageService.remove('localStorageUser');
                localStorageService.remove('localStorageToken');
                
                delete $rootScope.user;
				delete $rootScope.authToken;

                d.resolve();
            })
            .error(function () {
                d.reject();
            });

        return d.promise;
    };
    
    this.userHasRole = function(role){
        if ($rootScope.user && $rootScope.user.roles[role]) {
            return true;
        }
        return false;
    };
    
    this.isUrlAccessibleForUser =  function (route) {
            for (var i = 0; i < userRole.length; i++) {
                var role = userRole[i];
                var validUrlsForRole = userRoleRouteMap[role];
                if (validUrlsForRole) {
                    for (var j = 0; j < validUrlsForRole.length; j++) {
                        if (validUrlsForRole[j] == route)
                            return true;
                    }
                }
            }
            return false;
     };
});

app.service('UserService', function ($http, $q, $rootScope, $location, localStorageService, APP_CONFIG) {

    this.createUser = function (newUser) {
        var d = $q.defer();
        
        var dataObj = {
				username : newUser.email,
				password : newUser.password,
				firstName : newUser.fname,
				lastName : newUser.lname,
				userType : newUser.userType,
				schoolName : newUser.schoolName
		};
		
        $http.post(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/users', dataObj)
            .success(function (data) {
                var authToken = data.token;
				$rootScope.authToken = authToken;
						
				localStorageService.set('localStorageToken', authToken);
				
				// now fetch the user 
				$http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/user/me')
				    .success(function (user) {
				         
				       	$rootScope.user = user;
				           	
				       	localStorageService.set('localStorageUser', user);
				            	
				        d.resolve();
				    })
				     .error(function () {
				        d.reject();
				    });
		
		       d.resolve();
		      })
		      .error(function () {
		                d.reject();
		      });
		
		return d.promise;
	 };
	 
	 this.getUsers = function(){
	 	var d = $q.defer();
	 	$http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/users')
	 		.success(function (users) {
	 		
		        d.resolve(users);
			})
			.error(function () {
			    d.reject();
			});
	 	return d.promise;
	 };
	 
	 this.verifyUser = function(token){
	 	var d = $q.defer();
	 	$http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/users/confirm_email?token='+token)
	 		.success(function (data) {
                var authToken = data.token;
				$rootScope.authToken = authToken;
						
				localStorageService.set('localStorageToken', authToken);
				
				// now fetch the user 
				$http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/user/me')
				    .success(function (user) {
				         
				       	$rootScope.user = user;
				           	
				       	localStorageService.set('localStorageUser', user);
				            	
				        d.resolve();
				    })
				     .error(function () {
				        d.reject();
				    });
		
		        d.resolve();
		      })
		      .error(function () {
		                d.reject();
		      });
		
	 	return d.promise;
	 };
	 
	 this.forgetPassword = function(email) {
	 	var d = $q.defer();
	 	$http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/users/'+email+'/forget_password_email')
	 		.success(function (response) {
	 			var authToken = response.token;
				$rootScope.authToken = authToken;
				localStorageService.set('localStorageToken', authToken);
		        d.resolve(response);
			})
			.error(function () {
			    d.reject();
			});
	 	return d.promise;
	 };
	 
	 this.resetPassword = function(token) {
	 	var d = $q.defer();
	 	$http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/users/forget_password?token='+token)
	 		.success(function (response) {
	 			var authToken = response.token;
				$rootScope.authToken = authToken;
						
				localStorageService.set('localStorageToken', authToken);
				
				// now fetch the user 
				$http.get(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/user/me')
				    .success(function (user) {
				         
				       	$rootScope.user = user;
				           	
				       	localStorageService.set('localStorageUser', user);
				            	
				        d.resolve();
				    })
				     .error(function () {
				        d.reject();
				    });
		
		        d.resolve();
			})
			.error(function () {
			    d.reject();
			});
	 	return d.promise;
	 };
	
	this.updatePassword = function(updatePwd){
		var d = $q.defer();
		
		var data = 'password=' + updatePwd.password;
		
		$http.post(APP_CONFIG.url+':'+APP_CONFIG.port+'/AuthServer/api/users/'+$rootScope.user.userId+'/password', data, {
        		headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
    		})
	 		.success(function (response) {
	 			var authToken = response.token;
				$rootScope.authToken = authToken;
				localStorageService.set('localStorageToken', authToken);
		        d.resolve(response);
			})
			.error(function () {
			    d.reject();
			});
	 	return d.promise;
		
	};

});

app.service('ErrorHandler', function ($rootScope, $timeout) {

    this.appError = function(err){
    	 $rootScope.errors = [];
    	 $rootScope.errors.push(err);
    	 
    	 $timeout(function(){
         	  $rootScope.errors = [];
       	 }, 5000);
    }
    
    this.loginError = function(err){
    	 $rootScope.loginerrors = [];
    	 $rootScope.loginerrors.push(err);
    	 
    	 $timeout(function(){
         	  $rootScope.loginerrors = [];
       	 }, 5000);
    }


});

app.service('Base64Service', function () {
    var keyStr = "ABCDEFGHIJKLMNOP" +
        "QRSTUVWXYZabcdef" +
        "ghijklmnopqrstuv" +
        "wxyz0123456789+/" +
        "=";
    this.encode = function (input) {
        var output = "",
            chr1, chr2, chr3 = "",
            enc1, enc2, enc3, enc4 = "",
            i = 0;

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        }

        return output;
    };

    this.decode = function (input) {
        var output = "",
            chr1, chr2, chr3 = "",
            enc1, enc2, enc3, enc4 = "",
            i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        }
    };
});