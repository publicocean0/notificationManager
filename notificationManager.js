/*
 * Visit Github page[Browser-push](https://lahiiru.github.io/browser-push) for guide lines.
 */
 // push id, web service url
 
var NotificationManager=function(applicationServerPublicKey,pushId,wsURL,options){
'use strict';
if (typeof (options)!='object') options={};

var debug=options.debug||false;
let isSubscribed = false;


function ajax(url,method) {
       
       return new Promise(function(onsuccess,onerror){
        var xhr;
         
        if(typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
        else {
            var versions = ["MSXML2.XmlHttp.5.0", 
                            "MSXML2.XmlHttp.4.0",
                            "MSXML2.XmlHttp.3.0", 
                            "MSXML2.XmlHttp.2.0",
                            "Microsoft.XmlHttp"]
 
             for(var i = 0, len = versions.length; i < len; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break;
                }
                catch(e){}
             } // end for
        }
         
        xhr.onreadystatechange = ensureReadiness;
         
        function ensureReadiness() {
            if(xhr.readyState < 4 || xhr.status !== 200) {
                onerror(xhr.status,xhr.readyState);
                return;
            }
             
            
 
            // all is well  
            if(xhr.readyState === 4) {
                onsuccess(xhr);
            }           
        }
         
        xhr.open(method, url, true);
        xhr.send('');
	});
    }
 


if (debug) console.log('WebPush script injected.');

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








// For safari
function requestPermissions(func) {
    return new Promise(function(onsuccess,onerror){
    window.safari.pushNotification.requestPermission(wsURL, pushId, options.userId?{userId:options.userId}:{}, function(subscription) {
        if (debug) console.log(subscription);
        if(c.permission === 'granted') {
			isSubscribed = true;
			func(subscription.deviceToken);
            onsuccess({result:'subscribed',id:pushId,subscription:subscription});
        }
        else if(c.permission === 'denied') {
            onerror({result:'denied',id:pushId})
        }
    });
});
}

function nonSafariInit(onsuccess,onerror){
	var swRegistration = null;
		function subscribeUser(onsuccess,onerror) {
		 return new Promise(function(onsuccess,onerror){ 
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
		});
	}

	function unsubscribeUser(onsuccess,onerror) {
		return new Promise(function(onsuccess,onerror){ 
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
	});
	}
	
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        if (debug) console.log('Service Worker and Push is supported');
      
        navigator.serviceWorker.register(options.serviceWorkerName||'sw.js').then(function(swReg) {
           if (debug) console.log('Service Worker is registered', swReg);
            swRegistration = swReg;
            onsuccess({result:'initialized',id:pushId,subscribe:function(){
			if (!isSubscribed) return subscribeUser();
			else  return Promise.reject({result:'already_subscribed',id:pushId})
		},unsubscribe:function(){
			 if (isSubscribed) return unsubscribeUser(_o||options.onsuccess,_e||options.onerror);
			 else return Promise.reject({result:'not_subscribed',id:pushId})
			
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
    var token=null;
    if(pResult.permission === 'default') {
        //request permission
        onsuccess({result:'initialized',id:pushId,subscribe:function(){
			if (!isSubscribed) {
				return requestPermissions(function(t){
				 token=t;	
				});
			}
			else return Promise.reject({result:'already_subscribed',id:pushId})
		},unsubscribe:function(){
			 if (isSubscribed) return new Promise(function(ons,oner){
				 ajax(wsURL+'/v1/devices/'+token+'/registrations/'+pushId,'DELETE').then(x => ons({result:'unsubscribed',id:pushId})).catch(err => oner({result:'internal',details:err,id:pushId}));
			 });
			 else return Promise.reject({result:'not_supported',id:pushId})
			
		}
		,isSubcribed:function(){return isSubscribed}
		})
        
    } else if (pResult.permission === 'granted') {
        if (debug) console.log("Permission for " + pushId + " is " + pResult.permission);
        token = pResult.deviceToken;
        isSubscribed = true;
        // Show subscription for debug
        if (debug) console.log('Subscription details:',token);
        onsuccess({result:'initialized',id:pushId,subscribe:function(){
			if (!isSubscribed) return requestPermissions();
			else return Promise.reject({result:'already_subscribed',id:pushId})
		},unsubscribe:function(){
				 if (isSubscribed) return new Promise(function(ons,oner){
				 ajax(wsURL+'/1.0/devices/'+token+'/registrations/'+pushId,'DELETE').then(x => ons({result:'unsubscribed',id:pushId})).catch(err => oner({result:'internal',details:err,id:pushId}));
			 });
		
		
			 else return Promise.reject({result:'not_supported',id:pushId})
			
		}
		,isSubcribed:function(){return isSubscribed}
		})
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
