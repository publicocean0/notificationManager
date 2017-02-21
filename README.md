# pushManager
Push API

<pre>
var m=new NotificationManager(applicationServerPublicKey,pushId,wsURL,onsuccess(event){
if (event.result=='initialized') { 

if (!event.isSubscribed()) event.subscribe().then(...);
else event.unsubscribe().then (...)



}

},onerror:function(event){

});
<pre>
