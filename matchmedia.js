/* jj.matchmedia v0.0.1
  Heavily modified code from:
  | (c) 2014 Jason Kulatunga, Inc. 
  | http://analogj.mit-license.org/
 */
'use strict';

angular.module("jj.matchmedia", []).
    provider('matchmedia', function (){

        ///////////////////////////////////////////////////////////////////////
        // Configuration
        ///////////////////////////////////////////////////////////////////////
        /**
         *
         * these settings can be changed by injecting matchmediaProvider into
         * the config function of your module and
         * changing the matchmediaProvider.rules with your own rule key value
         * pairs E.G.

         *  angular.module('app').config(['matchmediaProvider', function (matchmediaProvider) {
         *      matchmediaProvider.rules.phone = "(max-width: 500px)";
         *      matchmediaProvider.rules.desktop: = "(max-width: 1500px)";
         *  }]);
         *
         * default values taken from twitter bootstrap :
         * https://github.com/twitter/bootstrap/blob/master/less/responsive-utilities.less
         */
        var matchmedia = {
            rules: {
                print : "print",
                screen : "screen",
                phone : "(max-width: 767px)",
                tablet : "(min-width: 768px) and (max-width: 979px)",
                desktop : "(min-width: 979px)",
                portrait : "(orientation: portrait)",
                landscape : "(orientation: landscape)",
                retina: "only screen and (min-device-pixel-ratio: 2), " +
                        "only screen and (min-resolution: 192dpi), " +
                        "only screen and (min-resolution: 2dppx)"
            }
        };

        matchmedia.$get = ['$window','mmSafeApply', 'logger', function($window, safeApply, logger) {
            ///////////////////////////////////////////////////////////////////////
            // Private Methods
            ///////////////////////////////////////////////////////////////////////
            function createSafeListener(cb, $scope){
                return function(mediaQueryList){
                    safeApply(function() {
                        cb(mediaQueryList);
                    }, $scope);
                };
            }

            function capitalize(str) {
                return str.substr(0, 1) + str.substr(1);
            }

            ///////////////////////////////////////////////////////////////////////
            // Public Methods
            ///////////////////////////////////////////////////////////////////////
            // should never be called directly, but is available for custom calls.

            // expose the ruleset so our directive can know about them.
            var matchmediaService = { _rules: Object.keys(matchmedia.rules) };

            /**
             * @param {string} query media query to listen on.
             * @param {function(mediaQueryList)} listener Function to call when the media query is matched.
             * @returns {function()} Returns a deregistration function for this listener.
             */
            matchmediaService.on = function(query, listener, $scope) {
                var mediaQueryList, handler, supportsMatchMedia;
                supportsMatchMedia = ($window.matchMedia !== undefined && 
                                        !!$window.matchMedia('all').addListener);
                if (supportsMatchMedia) {
                    mediaQueryList = $window.matchMedia(query);
                    handler = createSafeListener(listener, $scope);
                    mediaQueryList.addListener(handler);

                    // immediately return the current mediaQueryList;
                    handler(mediaQueryList);

                    return function() {
                        mediaQueryList.removeListener(handler);
                    };
                }
            };
            /**
             * @param {string} query media query to test.
             * @returns {mediaQueryList} Returns a boolean.
             */
            matchmediaService.is = function(query) {
                return $window.matchMedia(query).matches;
            };

            ///////////////////////////////////////////////////////////////////////
            // Aliased Methods
            ///////////////////////////////////////////////////////////////////////
            Object.keys(matchmedia.rules).forEach(function(rule) {
                matchmediaService['on' + capitalize(rule)] = function(listener, $scope) {
                    return matchmediaService.on(matchmedia.rules[rule], listener, $scope);
                };

                matchmediaService['is' + capitalize(rule)] = function() {
                    return matchmediaService.is(matchmedia.rules[rule]);
                };
            });
            return matchmediaService;
        }];
        return matchmedia;
    })
    .factory('mmSafeApply', ['$rootScope', function($rootScope) {
        return function(fn, $scope) {
            $scope = $scope || $rootScope;
            var phase = $scope.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn) {
                    $scope.$eval(fn);
                }
            } else {
                if (fn) {
                    $scope.$apply(fn);
                } else {
                    $scope.$apply();
                }
            }
        };
    }])