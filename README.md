# notificationManager
Push API

<pre>
var m=new NotificationManager(applicationServerPublicKey,pushId,wsURL,onsuccess(event){
if (event.result=='initialized') { 

if (!event.isSubscribed()) event.subscribe().then(...);
else event.unsubscribe().then (...)



}

},onerror:function(event){

},{...options...});

where options are:
debug:false|true
userId:a basic value
serviceWorkerName:
<pre>
