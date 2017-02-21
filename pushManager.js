/*
 * Visit Github page[Browser-push](https://lahiiru.github.io/browser-push) for guide lines.
 */
 // push id, web service url
 
var NotificationManager=function(applicationServerPublicKey,pushId,wsURL,options){
'use strict';
if (typeof (options)!='object') options={};

var debug=options.debug, browserType=0;
let isSubscribed = false;
let swRegistration = null;

if (debug) console.log('%c WebPush script injected.', 'background: green; color: white; display: block; font-size:20px');

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}





function subscribeUser(onsuccess,onerror) {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    }).then(function(subscription) {
        if (debug) console.log('User is subscribed:', subscription);
     
        isSubscribed = true;
        onsuccess({result:'subscribed',id:pushId,subscription:subscription})
    })
    .catch(function(err) {
    if (debug) console.log('Failed to subscribe the user: ', err);
    onerror({result:'internal',details:err,id:pushId,details:err});
    });
}

function unsubscribeUser(onsuccess,onerror) {
    swRegistration.pushManager.getSubscription().then(function(subscription) {
        if (subscription) {
            return subscription.unsubscribe();
        }
    }).catch(function(error) {
        if (debug) console.log('Error unsubscribing', error);
         onerror({result:'internal',details:error,id:pushId});
    }).then(function() {
        isSubscribed = false;
           if (debug) console.log('User is unsubscribed.');
          onsuccess({result:'unsubscribed',id:pushId});
    });
}

function subscribe() {
    if (isSubscribed) {
        unsubscribeUser();
    } else {
        subscribeUser();
    }
    // Set the initial subscription value
    swRegistration.pushManager.getSubscription().then(function(subscription) {
        isSubscribed = !(subscription === null);
        updateSubscriptionOnServer(subscription);
    });
}

// For safari
function requestPermissions(onsuccess,onerror) {
    window.safari.pushNotification.requestPermission(wsURL, pushId, options.userId?{userId:options.userId}:{}, function(subscription) {
        if (debug) console.log(subscription);
        if(c.permission === 'granted') {
            onsuccess({result:'subscribed',id:pushId,subscription:subscription});
        }
        else if(c.permission === 'denied') {
            onerror({result:'denied',id:pushId})
        }
    });
}

function nonSafariInit(onsuccess,onerror){
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        if (debug) console.log('Service Worker and Push is supported');
      
        navigator.serviceWorker.register('sw.js').then(function(swReg) {
           if (debug) console.log('Service Worker is registered', swReg);
            swRegistration = swReg;
            onsuccess({result:'initialized',id:pushId,subscribe:function(_o,_e){
			if (!isSubscribed) subscribeUser(_o||options.onsuccess,_e||options.onerror);
			else  (_e||options.onerror)({result:'already_subscribed',id:pushId})
		},unsubscribe:function(){
			 if (isSubscribed) unsubscribeUser(_o||options.onsuccess,_e||options.onerror);
			 else (_e||options.onerror)({result:'not_subscribed',id:pushId})
			
		},isSubcribed:function(){return isSubscribed}
		})
        }).catch(function(error) {
			onerror({result:'internal',id:pushId,details:error});
            if (debug) console.error('Service Worker Error', error);
        });
    } else {
       if (debug) console.warn('Push messaging is not supported');
        onerror({result:'unsupported',id:pushId});
    }
}

// For safari
function safariIniti(onsuccess,onerror) {
    var pResult = window.safari.pushNotification.permission(pushId);
    
    if(pResult.permission === 'default') {
        //request permission
        onsuccess({result:'initialized',id:pushId,subscribe:function(_o,_e){
			if (!isSubscribed) requestPermissions(_o||onsuccess,_e||onerror);
			else throw 'already subscribed'
		},unsubscribe:function(){
			 if (isSubscribed) throw 'not supported';
			 else throw 'not subscribed';
			
		}
		,isSubcribed:function(){return isSubscribed}
		})
        
    } else if (pResult.permission === 'granted') {
        if (debug) console.log("Permission for " + pushId + " is " + pResult.permission);
        var token = pResult.deviceToken;
        // Show subscription for debug
        if (debug) console.log('Subscription details:',token);
        onsuccess({result:'granted',id:pushId})
    } else if(pResult.permission === 'denied') {
        if (debug)("Permission for " + pushId + " is " + pResult.permission);
        onerror({result:'denied', id:pushId});
    }
}

/*
 * Call relevant methods.
 */
function init(){
var ua = window.navigator.userAgent,
safariTxt = ua.indexOf ( "Safari" ),
chrome = ua.indexOf ( "Chrome" );
if(chrome ==-1 && safariTxt > 0) {
	var version = ua.substring(0,safariTxt).substring(ua.substring(0,safariTxt).lastIndexOf("/")+1);
    if(parseInt(version, 10) >=7 &&'safari' in window && 'pushNotification' in window.safari){
       	if (debug)  console.log("Safari browser detected.");
        safariIniti(options.onsuccess||function(){},options.onerror||function(){});
    } else {
       	if (debug)  console.log("Safari unsupported version detected.");
       	onerror({result:'unsupported', id:pushId});
    }
}
else {
	if (debug) console.log("Non Safari browser detected.");
	nonSafariInit(options.onsuccess||function(){},options.onerror||function(){});
}
}

init();

}
