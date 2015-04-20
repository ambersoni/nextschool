app.directive('fieldFocus', function ($timeout) {
    return {
        scope: {
            trigger: '@fieldFocus'
        },
        link: function (scope, element) {
            scope.$watch('trigger', function () {
                $timeout(function () {
                    element[0].focus();
                });
            });
        }
    };
});

app.directive('fieldHasError', function ($timeout) {
    return {
        restrict: "A",
        link: function (scope, element) {
            $timeout(function () {
                var input = element.find('input[data-ng-model]');
                if (input) {
                    scope.$watch(function () {
                        return (input.hasClass('ng-invalid') && input.hasClass('ng-dirty'));
                    }, function (isInvalid) {
                        element.toggleClass('has-error', isInvalid);
                    });
                }
            });
        }
    };
});

app.directive('vTicker', function($timeout) {
	return {
		restrict: "A",
		link: function($scope, element, attributes) {
		   $scope.$watch("school.events", function() {
				$timeout(function () {
				   $(element).bootstrapNews({
					            newsPerPage: 3,
					            autoplay: true,
					            navigation:false,
								pauseOnHover:true,
					            direction: 'up',
					            newsTickerInterval: 5000,
					});          
				}, 0);
		   });
		}
		
	};
});

app.directive('setNgAnimate', ['$animate', function ($animate) {
    return {
        link: function ($scope, $element, $attrs) {
            $scope.$watch( function() {
                return $scope.$eval($attrs.setNgAnimate, $scope);
            }, function(valnew, valold){
                console.log('Directive animation Enabled: ' + valnew);
                $animate.enabled(!!valnew, $element);
            });
        }
    };
}]);

/* muut directive for discussion forum*/
app.directive('muut', [function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs, ctrl) {
                var url = attrs.muut;
                $(element).append('<a class="muut" href="' + url + '">Forum</a>');
                $(element).muut(url);
    
            }
        }
}]);

/* pretty photo directive*/
app.directive('prettyp', function(){
  return function(scope, element, attrs) {
    $("[rel^='prettyPhoto']").prettyPhoto({deeplinking: false, social_tools: false});
  }
});

/* Directive for Role Based Access*/
app.directive('allowAccess', ['AuthenticationService', 'removeElement', function (AuthenticationService, removeElement) {
    return{
        restrict: 'A',
        link: function (scope, element, attributes) {
            var hasAccess = false;
            var allowedAccess = attributes.allowAccess.split(" ");
            for (i = 0; i < allowedAccess.length; i++) {
                if (AuthenticationService.userHasRole(allowedAccess[i])) {
                    hasAccess = true;
                    break;
                }
            }
            if (!hasAccess) {
                angular.forEach(element.children(), function (child) {
                    removeElement(child);
                });
                removeElement(element);
            }
        }
    }
}]);

