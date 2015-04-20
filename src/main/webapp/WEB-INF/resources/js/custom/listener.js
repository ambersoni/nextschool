app.run(function ($rootScope, $http, $location, $routeParams, $anchorScroll, Base64Service, AuthenticationService, UserService, localStorageService, editableOptions, ErrorHandler) {

    editableOptions.theme = 'bs3';

    $rootScope.errors = [];
    $rootScope.loginerrors = [];
    $rootScope.requests401 = [];
    $rootScope.navigateTo = "/main";

    $rootScope.$on('$routeChangeSuccess', function (event, next, current) {
        $rootScope.user = localStorageService.get('localStorageUser');
        
        if($location.path() === '/admin/users' && !AuthenticationService.userHasRole('ROLE_ADMIN')){
        	$location.path('/main');
        }
      	
    });

    /**
     * Holds all the requests which failed due to 401 response.
     */
    $rootScope.$on('event:loginRequired', function () {
		// open login modal whenever login is required        
        $('#loginModal').modal({show:true});
    });
    
    /**
     * On reset password call
     */
    $rootScope.$on('event:resetPassword', function () {
		// open login modal whenever login is required        
        $('#resetPwdModal').modal({show:true});
    });
    
    

    /**
     * On 'event:loginConfirmed'
     */
    $rootScope.$on('event:loginConfirmed', function () {
    	$('#loginModal').modal('hide');
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove();    
		$rootScope.loginerrors=[];	
		
		 var i,
            requests = $rootScope.requests401,
            retry = function (req) {
                $http(req.config).then(function (response) {
                    req.deferred.resolve(response);
                });
            };

        for (i = 0; i < requests.length; i += 1) {
            retry(requests[i]);
        }

        $rootScope.requests401 = [];
        $rootScope.errors = [];
		
         AuthenticationService.redirectToAttemptedUrl();
    });

    /**
     * On 'event:loginRequest' send credentials to the server.
     */
    $rootScope.$on('event:loginRequest', function (event, username, password) {
        // set the basic authentication header that will be parsed in the next request and used to authenticate
        //$http.defaults.headers.common['Authorization'] = 'Basic ' + Base64Service.encode(username + ':' + password);
		$rootScope.loginerrors = [];
        AuthenticationService.login(username, password).then(
            function success() {
            	
                $rootScope.$broadcast('event:loginConfirmed');

                console.log("You have been successfully logged in.")
            },
            function error() {
            	ErrorHandler.loginError({ code: "LOGIN_FAILED", message: "Invalid Username or Password. Please try again!" });
            });
    });

    /**
     * On 'logoutRequest' invoke logout on the server.
     */
    $rootScope.$on('event:logoutRequest', function () {
        $http.defaults.headers.common.Authorization = null;

        AuthenticationService.logout().then(
            function success() {
                $rootScope.user = localStorageService.get('localStorageUser');

                console.log("You have been successfully logged out.")
            },
            function error() {
                ErrorHandler.appError({ code: "LOGOUT_FAILED", message: "Oooooops something went wrong, please try again" });
            })
    });
    
    /**
     * On 'signupRequest' invoke signup on the server.
     */
    $rootScope.$on('event:signupRequest', function (event, newUser) {

        UserService.createUser(newUser).then(
            function success() {
                $rootScope.user = localStorageService.get('localStorageUser');
                
                $rootScope.$broadcast('event:loginConfirmed');

                console.log("You have been successfully signed up.")
            },
            function error() {
                ErrorHandler.appError({ code: "SIGNUP_FAILED", message:"Error while creating user. Please try later!"});
            })
    });
    
     /**
     * On 'event:verifyUserRequest' send credentials to the server.
     */
    $rootScope.$on('event:verifyUserRequest', function (event, token) {
        UserService.verifyUser(token).then(
            function success() {
            	
                $rootScope.$broadcast('event:loginConfirmed');

                console.log("You have been successfully logged in.")
            },
            function error() {
            	ErrorHandler.appError({code:"VERIFICATION_FAILED", message:"User cannot be verified!"});
            });
    });
    
     /**
     * On 'event:forgetPasswordRequest' 
     */
    $rootScope.$on('event:forgetPasswordRequest', function (event, email) {
        UserService.forgetPassword(email).then(
            function success() {
            	$('#forgetPwdModal').modal('hide');
				$('body').removeClass('modal-open');
				$('.modal-backdrop').remove();   
            	console.log("You will receive an email with password reset link in sometime!.");
            },
            function error() {
            	ErrorHandler.loginError({code:"VERIFICATION_FAILED", message:"No Account exists for this email."});
            });
    });
    
    /**
     * On 'event:resetPasswordRequest' 
     */
    $rootScope.$on('event:resetPasswordRequest', function (event, token) {
        UserService.resetPassword(token).then(
            function success() {
                console.log("Reset Password call successful!")
                $rootScope.$broadcast('event:resetPassword');
            },
            function error() {
            	ErrorHandler.appError({code:"PASSWORD_RESET_FAILED", message:"Error while resetting password!"});
            });
    });
    
    /**
     * On update password event
     */
    $rootScope.$on('event:updatePasswordEvent', function (event, updatePwd) {
    	UserService.updatePassword(updatePwd).then(
    		function success() {
                console.log("You have been successfully reset you password.")
                
                $('#resetPwdModal').modal('hide');
				$('body').removeClass('modal-open');
				$('.modal-backdrop').remove();  
				
            },
            function error() {
            	ErrorHandler.appError({code:"PASSWORD_RESET_FAILED", message:"Error while resetting password!"});
            });
    });
});