app.controller('MainController', function ($rootScope, $scope, $location, AuthenticationService, localStorageService, Facebook, GooglePlus, SchoolService, ErrorHandler) {
	
	$scope.fbLoginStatus = 'disconnected';
    $scope.fbIsReady = false;
    
    $scope.gLoggedIn = false;
    $scope.linkedinLoggedIn = false;
    
    $scope.sending_password_reset_email = false;
    
	$scope.newUser = {
		userType:'Parent'
	};
	
	$scope.credentials = {};
	
	$scope.routeIs = function(routeName) {
    	return $location.path() === routeName;
  	};
  	
    $scope.openLoginModal = function () {
    	$scope.clearModalErrors();
    	$scope.credentials = {};
    	
    	$('#signupModal').modal('hide');
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove(); 
		
		//$scope.signupForm.$setPristine();
		
        $('#loginModal').modal({show:true});
    };
    
    
    $scope.logout = function () {
        if($scope.fbLoginStatus === 'connected'){
        	 $scope.fbLogout();
        }else if ($scope.gLoggedIn){
        	$scope.googleLogout();
        }else if($scope.linkedinLoggedIn){
        	$scope.linkedinLogout();
        }        
        else{
	        $scope.$emit('event:logoutRequest');
        }
        $location.path("/main");
    };

    $scope.login = function (credentials) {
    
		AuthenticationService.saveAttemptUrl();
    
        $scope.$emit('event:loginRequest', credentials.username, credentials.password);

    };
    
    
     $scope.register = function () {
     	
     	$scope.newUser = {};
     	$scope.newUser.userType = 'Parent';
     	
     	AuthenticationService.saveAttemptUrl(); 
    	
		$('#loginModal').modal('hide');
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove();
		
		//$scope.loginForm.$setPristine();    
		    
       	$('#signupModal').modal('show');
       	AuthenticationService.redirectToAttemptedUrl();
      
    };
   
    
    $scope.signup = function (newUser) {
    
    	console.log(newUser);
    
		$('#signupModal').modal('hide');
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove(); 
		
		AuthenticationService.saveAttemptUrl();   
		    
        $scope.$emit('event:signupRequest', newUser);

    };
    
    $scope.openForgetPasswordModal = function (){
    	$scope.clearModalErrors();
    	$scope.sending_password_reset_email = false;
    	
    	AuthenticationService.saveAttemptUrl(); 
    	
    	$('#loginModal').modal('hide');
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove();
		
		$('#forgetPwdModal').modal('show');
		
       	AuthenticationService.redirectToAttemptedUrl();
		
    };
    
    $scope.forgetPassword = function(email){
    
    	$scope.sending_password_reset_email = true;
    	$scope.$emit('event:forgetPasswordRequest', email);
    }
    
    $scope.updatePassword = function(updatePwd){
    	$scope.$emit('event:updatePasswordEvent', updatePwd);
    }
    
    $scope.clearModalErrors = function(){
    	$rootScope.loginerrors=[];	
    };
    
    
    $scope.fbLogin = function () {
        Facebook.login(function(response) {
          $scope.fbLoginStatus = response.status;
          $scope.fbMe();
        }, {scope: 'email'});
    };
    
    $scope.fbLogout = function() {
        Facebook.logout(function() {
          $scope.$apply(function() {
            //$rootScope.user   = {};
            delete $rootScope.user;
            localStorageService.remove('localStorageUser');
            $scope.fbLoginStatus = 'disconnected';
          });
        });
      }
          
    $scope.fbRemoveAuth = function () {
        Facebook.api({
              method: 'Auth.revokeAuthorization'
        }, function(response) {
              Facebook.getLoginStatus(function(response) {
                $scope.fbLoginStatus = response.status;
              });
         });
    };
    
    $scope.fbMe = function () {
         Facebook.api('/me', function(response) {
              $rootScope.user = response;
              
              $rootScope.user.userId = response.email;
              $rootScope.user.roles = {"ROLE_USER":true};
              localStorageService.set('localStorageUser', response);
              $rootScope.$broadcast('event:loginConfirmed');
              
              console.log($rootScope.user);
         });
    };
    
    $scope.$watch(function() {
               return Facebook.isReady();
            }, function(newVal) {
              if (newVal) {
                  $scope.fbIsReady = true;
              }
            }
    );
    
    $scope.googleLogin = function () {
        GooglePlus.login().then(function (authResult) {
            console.log(authResult);
            $scope.gLoggedIn = true;
            
            GooglePlus.getUser().then(function (user) {
                $rootScope.user = user;
                $rootScope.user.userId = user.email;
                $rootScope.user.roles = {"ROLE_USER":true};
                
              	localStorageService.set('localStorageUser', user);
              	$rootScope.$broadcast('event:loginConfirmed');
              	console.log(user);
            });
        }, function (err) {
            console.log(err);
        });
    };
   	
   	$scope.googleLogout = function () {
        GooglePlus.logout().then(function (response) {
            console.log(response);
            $scope.gLoggedIn = false;
            
            delete $rootScope.user;
        	localStorageService.remove('localStorageUser');
        	$scope.linkedinLoggedIn = false;
        }, function (err) {
            console.log(err);
        });
    };
    
   $scope.linkedinLogin = function(){
   		IN.User.authorize(function(){
	       $scope.getLinkedInData();
	    });
   } 
    
   $scope.getLinkedInData = function() {
		IN.API.Profile("me").fields(
					[ "id", "firstName", "lastName", "email-address",
							"publicProfileUrl" ]).result(function(result) {
							
				var inUser = {};
				
				inUser.userId = result.values[0].emailAddress;
				inUser.name = result.values[0].firstName;
				inUser.roles = {"ROLE_USER":true};
				
				$rootScope.user  = inUser;
          		localStorageService.set('localStorageUser', inUser);
            	$rootScope.$broadcast('event:loginConfirmed');	
            	$scope.linkedinLoggedIn = true;		
            	
            	console.log(inUser);
				
			}).error(function(err) {
				$scope.error = err;
			});
	};
	
  	//logout and go to login screen
	$scope.linkedinLogout = function() {
		IN.User.logout();
		delete $rootScope.user;
        localStorageService.remove('localStorageUser');
        $scope.linkedinLoggedIn = false;
	};
	
	$scope.isAdmin = function(){
		return AuthenticationService.userHasRole('ROLE_ADMIN');
	};
	
	$scope.getSchoolListing = function () {
    	$scope.schools = [];
    	$scope.totalSchools=null;
        SchoolService.getSchools().then(
            function success(response) {
                $rootScope.searchedSchools = response;
                $scope.totalSchoolsSearched=$rootScope.searchedSchools.length;
                $location.path("/schools/listing");
            },
            function error() {
                ErrorHandler.appError("Error fetching school list. Please try again!");
         });

        
    };
    
});

app.controller('SchoolListController', function ($rootScope, $scope, $q, $location,  $anchorScroll, SchoolService, Geocoder, localStorageService, ErrorHandler) {
	
	$scope.schools = $rootScope.searchedSchools;
    $scope.totalSchools = $rootScope.totalSchoolsSearched;
	$scope.followBtnHtml = '<i class="glyphicon glyphicon-heart pull-left"></i> Follow School';
	$scope.following = false;
	$scope.distance="5";
	
	$scope.distanceSliderOptions = {       
        from: 0,
        to: 10,
        step: 1,
        smooth: true,
        dimension: " km",
        css: {
          background: {"background-color": "silver"},
          before: {"background-color": "smokewhite"},
          default: {"background-color": "white"},
          after: {"background-color": "smokewhite"},
          pointer: {"background-color": "#939393"}          
        },
        callback: function(value, elt) {
            console.log(value);
            if(!localStorageService.get('userLocation')){
            	$scope.openLocationModal();
            }else{
            	console.log('Calling REST API search school within given radius!');
            }	
        }				      
      };
    
    
    $scope.followSchool = function(event, school) {
    		$rootScope.loginerrors = [];
			if(!$rootScope.user){
				$rootScope.loginerrors.push({code: "LOGIN_REQUIRED", message: "Login is required for this action!" });
			    $rootScope.$broadcast('event:loginRequired');
			    return;
			}
		
			SchoolService.followSchool(school.sid, $rootScope.user.userId).then(
	            function success(response) {
	            	event.target.innerHTML = '<i class="glyphicon glyphicon-ok pull-left"></i> Following';
	            	school.following = true;
	            	
					console.log('Successfully followed school..!!')
	            },
	            function error() {
	                ErrorHandler.appError("Error while following the school. Please try again!");
	         });
			
		};
    
    $scope.reviewSchool = function(e, school){
    	var schoolUrl = school.profileUrl + '#disqus_thread';
    	$location.path(schoolUrl);
		console.log("Path changed to : "+$location.path());    	
    };
    
    $scope.openLocationModal = function () {
    	 $('#locModal').modal({show:true});
    };
    
    $scope.saveUserLocation = function (address){
    	// Call geocoding API and save into $localStorage;
    	 
    	 $('#locModal').modal('hide');
		 $('body').removeClass('modal-open');
		 $('.modal-backdrop').remove();  
    		
    	 var d = $q.defer();
    	 Geocoder.latLngForAddress(address).then(
    	 	function (response) {
    			  console.log("Geocode for location = "+response);
    	 		  $rootScope.loc = {};
    	 		  $rootScope.loc.latitude = response.lat;
    			  $rootScope.loc.longitude = response.lng;
    			  localStorageService.set('userLocation', response);
    			  
				  // Call REST API to fetch all schools within given radius    			  
    			  console.log('Calling REST API search school within given radius!');
    			  
                  d.resolve(response);
            },
            function () {
                d.reject();
            }
    	 );
    	 return d.promise;
    };
    
    $scope.uniqueItems = function (data, key) {
	    var result = [];
	    
	    if(key === 'gradeRange'){
	    	if(data){	    
			    for (var i = 0; i < data.length; i++) {
			        var gradeRange = data[i][key];
			 		
			 		for(var j = 0; j < gradeRange.length; j++){
			 			if (result.indexOf(gradeRange[j]) == -1) {
			            	result.push(gradeRange[j]);
			        	}
			 		}
			    }
	    	}
		        
		}else{
			if(data){	    
			    for (var i = 0; i < data.length; i++) {
			        var value = data[i][key];
			 
			        if (result.indexOf(value) == -1) {
			            result.push(value);
			        }
			        
			    }
	    	}
		}
	    
	    
	    return result;
	};
    
    $scope.useCities = {};
    $scope.useAreas = {};
    $scope.useBoards = {};
    $scope.useGradeRange = {};
    
    // Watch the areas that are selected
    $scope.$watch(function () {
        return {
            schools: $scope.schools,
            useCities:$scope.useCities,
            useAreas: $scope.useAreas,
            useBoards: $scope.useBoards,
            useGradeRange : $scope.useGradeRange
        }
    }, function (value) {
        var selected;
        
        $scope.count = function (prop, value) {
            return function (el) {
                return el[prop] == value;
            };
        };
        
        $scope.arrCount = function (prop, value) {
            return function (el) {
                return el[prop].indexOf(value)>-1;
            };
        };
    
    	// Apply Area filter logic
		$scope.areas = $scope.uniqueItems($scope.schools, 'area');
        var filterAfterAreas = [];        
        selected = false;
        
        for (var j in $scope.schools) {
            var p = $scope.schools[j];
            for (var i in $scope.useAreas) {
                if ($scope.useAreas[i]) {
                    selected = true;
                    if (i == p.area) {
                        filterAfterAreas.push(p);
                        break;
                    }
                }
            }        
        }
        if (!selected) {
            filterAfterAreas = $scope.schools;
        }
        
        // Apply Board filter logic
        $scope.boards = $scope.uniqueItems($scope.schools, 'board');
        var filterAfterBoards = [];        
        selected = false;
        
        for (var j in filterAfterAreas) {
            var p = filterAfterAreas[j];
            for (var i in $scope.useBoards) {
                if ($scope.useBoards[i]) {
                    selected = true;
                    if (i == p.board) {
                        filterAfterBoards.push(p);
                        break;
                    }
                }
            }       
        }
        if (!selected) {
            filterAfterBoards = filterAfterAreas;
        }
        
         // Apply City filter logic
		$scope.cities = $scope.uniqueItems($scope.schools, 'city');
        var filterAfterCities = [];        
        selected = false;
        
        for (var j in filterAfterBoards) {
            var p = filterAfterBoards[j];
            for (var i in $scope.useCities) {
                if ($scope.useCities[i]) {
                    selected = true;
                    if (i == p.city) {
                        filterAfterCities.push(p);
                        break;
                    }
                }
            }        
        }
        if (!selected) {
            filterAfterCities = filterAfterBoards;
        }
        
          // Apply Grade Range filter logic
		$scope.gradeRange = $scope.uniqueItems($scope.schools, 'gradeRange');
        var filterAfterGradeRange = [];        
        selected = false;
        
        for (var j in filterAfterCities) {
            var p = filterAfterCities[j];
            for (var i in $scope.useGradeRange) {
                if ($scope.useGradeRange[i]) {
                    selected = true;
                    if (p.gradeRange.indexOf(i) > -1) {
                        filterAfterGradeRange.push(p);
                        break;
                    }
                }
            }        
        }
        if (!selected) {
            filterAfterGradeRange = filterAfterCities;
        }
        
        $scope.filteredSchools = filterAfterGradeRange;        
    }, true);
	
    
});


// Controller for School profile page
app.controller('SchoolController', function ($rootScope, $scope, $http, $routeParams, $document, SchoolService, ErrorHandler) {

	$scope.rate = null;
	$scope.max = 10;
	$scope.isReadonly = $rootScope.user === null;
	$scope.map= null;
	$scope.followBtnHtml = '<i class="glyphicon glyphicon-heart pull-left"></i> Follow School';
	$scope.following = false;
	
    $scope.init= function () {    
    	$scope.schoolId = $routeParams.schoolId;
    	var s_id = $scope.schoolId.split("-");
    	$scope.disqus_id= s_id[0];
        SchoolService.getSchoolProfile($scope.schoolId).then(
            function success(response) {
                $scope.school = response;
                $scope.rate=response.totalRating;
                
		        $scope.initMap();
		        
            },
            function error() {
                ErrorHandler.appError("Error initializing school page. Please refresh the page or try again.");
         });

        
    };
   
    $scope.rateSchool = function (rate) {
    	if($rootScope.user && !$rootScope.user.active){
    			ErrorHandler.appError("Your account has not been activated!");
			    return;
		}
    
        SchoolService.rateSchool($scope.schoolId, rate).then(
            function success(response) {
            	$scope.isReadonly = !$scope.isReadonly;
				console.log('Successfully submitted school rating!!')
            },
            function error() {
                ErrorHandler.appError("Error while rating the school. Please try again!");
         });

        
    };
    
    $scope.updateSchool = function(school){
    	console.log('Successfully updated school');
    };
    
     $scope.hoveringOver = function(value) {
	    $scope.overStar = value;
	    $scope.percent = 100 * (value / $scope.max);
	  };
	
	  $scope.ratingStates = [
	    {stateOn: 'glyphicon-ok-sign', stateOff: 'glyphicon-ok-circle'},
	    {stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'},
	    {stateOn: 'glyphicon-heart', stateOff: 'glyphicon-ban-circle'},
	    {stateOn: 'glyphicon-heart'},
	    {stateOff: 'glyphicon-off'}
	  ];
	  
	  $scope.tabs = [
			{
				"heading": "Home",
				"active": true,
				"template":"resources/html/partials/view/school_profile_tab_home.html"
			},
			{
				"heading": "Fees",
				"active": false,
				"template":"resources/html/partials/view/school_profile_tab_fees.html"
			},
			{
				"heading": "Gallery",
				"active": false,
				"template":"resources/html/partials/view/school_profile_tab_gallery.html"
			},
			{
				"heading": "Faculty",
				"active": false,
				"template":"resources/html/partials/view/school_profile_tab_faculty.html"
			},
			{
				"heading": "Honours & Awards",
				"active": false,
				"template":"resources/html/partials/view/school_profile_tab_honour-awards.html"
			}
		];
		
		$scope.scrollToReview = function(){
		    var duration = 2000; //milliseconds
		    var offset = 30; 
		    var disqusDiv = angular.element(document.getElementById('disqus_thread'));
		    $document.scrollToElement(disqusDiv, offset, duration);
		};
		
		$scope.followSchool = function(event) {
			if(!$rootScope.user || !$rootScope.user.active){
				if(!$rootScope.user){
					$rootScope.loginerrors.push({code: "LOGIN_REQUIRED", message: "Login is required for this action!" });
				    $rootScope.$broadcast('event:loginRequired');
				}else{
					ErrorHandler.appError("Your account has not been activated!");
				}
			    return;
			}
		
			SchoolService.followSchool($scope.schoolId, $rootScope.user.userId).then(
	            function success(response) {
	            	$scope.followBtnHtml = '<i class="glyphicon glyphicon-ok pull-left"></i> Following';
	            	$scope.following = true;
	            	
					console.log('Successfully followed school..!!')
	            },
	            function error() {
	                ErrorHandler.appError("Error while following the school. Please try again!");
	         });
			
		};
		
		
		$scope.openCarouselModal = function (event) {
			$('#carouselmodal').modal({show:true});
	    	event.preventDefault();
    	};
    	
    	$scope.initMap = function(){
    			$scope.map = {center: {latitude: $scope.school.lat, longitude: $scope.school.lng }, zoom: 14 };
        		$scope.options = {scrollwheel: true};
        		$scope.marker = {
		            coords: {
		                latitude: $scope.school.lat,
		                longitude: $scope.school.lng
		            },
		            show: false,
		            id: 0
		        };
		
		        $scope.windowOptions = {
		            visible: false
		        };
		
		        $scope.onClick = function() {
		            $scope.windowOptions.visible = !$scope.windowOptions.visible;
		        };
		
		        $scope.closeClick = function() {
		            $scope.windowOptions.visible = false;
		        };
		
		        $scope.markerTitle = $scope.school.name;
    	
    	};
    	
    	

		
});


// Controller for User
app.controller('UserController', function ($scope, $rootScope, $routeParams ) {
    var token = $routeParams.token;
    
    if(token){
	    $rootScope.$broadcast('event:verifyUserRequest', token);
    }
});

// Controller for Password
app.controller('PasswordController', function ($scope, $rootScope, $routeParams ) {
    var token = $routeParams.token;
    
    if(token){
	    $rootScope.$broadcast('event:resetPasswordRequest', token);
    }
});

// Controller for Admin
app.controller('AdminController', function ($scope, UserService) {
 	
 	var vm = this;
 	vm.users = null;
 	
 	vm.roles  = [
	    {role: 'ROLE_ADMIN'},
	    {role: 'ROLE_SCHOOL_ADMIN'},
	    {role: 'ROLE_USER'}
     ];
 	
 	vm.getUsers = function(){
 		UserService.getUsers().then(
	 		function(users){
	 			vm.users =  users;
	 			//console.log(users);
	 		},
	 		function(errors){
	 			console.log('Error loading users for Admin!');
	 		});
	 		
 	};
 	
 	vm.showRole = function(user){
 		
 		var selected = [];
	    angular.forEach(vm.roles, function(item) {
		    if(item.role === user.roles[0]){
		    	selected.push(item);
		    }
		});
	    return selected.length ? selected[0].role : 'Not set';
 	};
 	
 	vm.getStatus = function(user){
 		if(user.active){
 			return "Active";
 		}else{
 			return "InActive";
 		}
 	};
 	
 	// remove user
	vm.removeUser = function(index) {
	    vm.users.splice(index, 1);
	    console.log('Calling REST API to delete a user from repository!')
	};
	
	vm.saveUser = function(data, user) {
	   user.roles = [];
	   user.roles.push(data.role.role);
	   console.log('Call update user API!');
	 };
    
    // add user
	  vm.addUser = function() {
		    /*$scope.inserted = {
		      id: $scope.users.length+1,
		      name: '',
		      status: null,
		      group: null 
		    };*/
		    //$scope.users.push($scope.inserted);
		     console.log('Call add user API!');
	  };
	  
});

// Controller for typeahead search box
app.controller('TypeaheadCtrl', function ($scope, $http) {

 	  // Any function returning a promise object can be used to load values asynchronously
	  $scope.getMovies = function(val) {
	    return $http.get('http://api.themoviedb.org/3/search/movie', {
	      params: {
	        query: val,
	        api_key:'470fd2ec8853e25d2f8d86f685d2270e'
	      }
	    }).then(function(response){
	      return response.data.results.map(function(item){
	        return item.original_title;
	      });
	    });
	  };
    
});


app.controller('CustomerController', function ($rootScope, $scope, CustomerService) {
    $scope.init = function () {
        CustomerService.getCustomers().then(
            function success(response) {
                $scope.customers = response;
            },
            function error() {
                $rootScope.errors.push({ code: "CUSTOMERS_GET_FAILURE", message: "Oooooops something went wrong, please try again" });
            });
    };

    $scope.delete = function (id) {
        CustomerService.deleteCustomer(id).then(
            function success(response) {
                if (response) {
                    angular.forEach($scope.customers, function (customer, index) {
                        if (id == customer.id) {
                            $scope.customers.splice(index, 1);

                            console.info("Customer " + id + " has been deleted.")
                        }
                    });
                }
                else {
                    console.error("Customer " + id + " was unable to be deleted.")
                }
            },
            function error() {
                $rootScope.errors.push({ code: "CUSTOMER_DELETE_FAILURE", message: "Oooooops something went wrong, please try again" });
            });
    };

    $scope.save = function (id) {
        angular.forEach($scope.customers, function (customer) {
                if (id == customer.id) {
                    CustomerService.saveCustomer(customer).then(
                        function success(response) {
                            if (response) {
                                console.info("Customer " + id + " has been saved.")
                            }
                            else {
                                console.error("Customer " + id + " was unable to be saved.")
                            }
                        });
                }
            },
            function error() {
                $rootScope.errors.push({ code: "CUSTOMER_SAVE_FAILURE", message: "Oooooops something went wrong, please try again" });
            });
    };
});