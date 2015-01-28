/**
 * App Module Init
 * @type Angular Module
 */
var App = angular.module('oauthApp', []);

App.service('googleService', ['$http', '$rootScope', '$q', function ($http, $rootScope, $q) {
        var clientId = '745568035026.apps.googleusercontent.com',
        apiKey = 'AIzaSyClnGVBmUL-dZ8_UrHQjhqVIPokHJcgHdE',
        scopes = 'https://www.googleapis.com/auth/userinfo.email https://www.google.com/m8/feeds/contacts/default/full',
        deferred = $q.defer();

        this.login = function () {
            console.log("Inside login()");
            gapi.auth.authorize({ 
                client_id: clientId, 
                scope: scopes,
                immediate: false,
                approval_prompt: "force"
            }, this.handleAuthResult);
            return deferred.promise;
        }

        this.handleClientLoad = function () {
            console.log("Inside handleClientLoad()");
            gapi.client.setApiKey(apiKey);
            gapi.auth.init(function () { });
            window.setTimeout(checkAuth, 1);
        };

        this.checkAuth = function() {
            console.log("Inside checkAuth()");
            gapi.auth.authorize({ 
                client_id: clientId, 
                scope: scopes, 
                immediate: true, 
            }, this.handleAuthResult);
        };

        this.handleAuthResult = function(authResult) {
            console.log("Inside handleResult()");
            if (authResult && !authResult.error) {
                var data = [];
                gapi.client.load('oauth2', 'v2', function () {
                    var request = gapi.client.oauth2.userinfo.get();
                    request.execute(function (resp) {
                        data.push(resp.email);
                        data.push(authResult.access_token);
                        deferred.resolve(data);
                    });
                });
            } else {
                deferred.reject('error');
            }
        };

        this.handleAuthClick = function() {
            console.log("Inside handleAuthClick()");
            gapi.auth.authorize({ 
                client_id: clientId, 
                scope: scopes,
                immediate: false,
                approval_prompt: "force"
            }, this.handleAuthResult);
            return false;
        };

        this.makeContactList = function(root){
            var plist = [];
            var contactsList = root.feed.entry;     
            if (contactsList != null && contactsList.length > 0) {
                for (var i = 0; i < contactsList.length; i++) {
                    var contact = contactsList[i];
                    var fname = "";
                    var l = contact.gd$email;
                    var address = null;
                    var emailArr = [];
                    if (l != null && l.length > 0) {
                        var el = l[0];
                        if (el != null) {
                            address = el.address;
                        }
                        if (l.length > 1) {
                            for (var k = 1; k < l.length; k++) {
                                var e = l[k];
                                if (e != null) {
                                    emailArr[k - 1] = e.address;
                                }
                            }
                        }
                    }
                    var lname = "";
                    var dispName = contact.title.$t;
                    if (dispName != null) {
                        var sarr = dispName.split(' ');
                        if (sarr.length > 0) {
                            if (sarr.length >= 1) {
                                fname = sarr[0];
                            }
                            if (sarr.length >= 2) {
                                for (var k = 1; k < sarr.length; k++) {
                                    lname = lname +" "+sarr[k];
                                }
                                lname = lname.trim();
                            }
                        }
                    }
                    var id = contact.id.$t;

                    if (address != null && address.length > 0) {
                        var p = {
                                firstName : "",
                                lastname : "",
                                email : "",
                                displayName : "",
                                otherEmails : [],
                                id : ""
                        }
                        p.firstName = fname;
                        p.lastName = lname;
                        p.email = address;
                        p.displayName = dispName;
                        p.otherEmails = emailArr;
                        p.id = id;
                        plist.push(p);
                    }
                }
            } else {
                console.log("No contacts were obtained from the feed");
            }
            return plist;
        };

        this.disconnectUser = function(access_token){
            var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' +access_token;
            $.ajax({
                type : 'GET',
                url : revokeUrl,
                async : false,
                contentType : "application/json",
                dataType : 'jsonp',
                success : function(nullResponse){
                    console.log("Successfully disconnected access_token");
                },
                error : function(e){
                    console.log("Failed to isconnect access_token");
                    window.location.reload();
                }
            });
        }
    }]);

App.controller('oauthCtrl', ['$scope', 'googleService', '$http', function ($scope, googleService, $http){
    
    $scope.contacts = [];

    $scope.authentify = function () {
        var promise =  googleService.login()
        promise.then(function (data) {
            if(angular.isObject(data) && data[0]!== undefined && data[1]!== undefined){
                console.log(data[0]);
                console.log(data[1]);
                $http.get("https://www.google.com/m8/feeds/contacts/"+data[0]+"/full?alt=json&access_token=" + data[1] + "&max-results=1000&v=3.0")
                .success(function(data, status, headers, config) {
                    console.log("In success");
                    $scope.contacts = googleService.makeContactList(data);
                    // var response = MyFactory.post(contactList);
                    // response.$promise.then(function(data){
                    //     console.log(data);
                    //     console.log("Successfully synched with your google contacts!");
                    //     googleService.disconnectUser(access_token);
                        
                    // });
                })
                .error(function(data, status, headers, config) {
                    console.log("In error");
                    console.log(data);
                    alert("Something went wrong. Please try again.");
                });
            }else{
                alert("Something went wrong. Please try again.");
            }
        }
        , function (err) {
            console.log('Failed: ' + err);
            alert("Something went wrong. Please try again.");
        });
    };
    
}]);