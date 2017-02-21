# pushManager
Push API

<pre>
var m=new NotificationManager(applicationServerPublicKey,pushId,wsURL,onsuccess(event){
if (event.result=='initialized') { 

event.subscribe();
}

},onerror:function(event){

});
<pre>
