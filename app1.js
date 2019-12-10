
const configuration = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
const pc = new RTCPeerConnection(configuration);

// send any ice candidates to the other peer
pc.onicecandidate = ({candidate}) => {
    console.log(candidate);
    // signaling.send({candidate})
    if(candidate){
        let candi = JSON.stringify(candidate)
        database.ref().child('Video/candidate').push({candidate:candi,sender:name});
    }
};

// let the "negotiationneeded" event trigger offer generation
pc.onnegotiationneeded = async () => {
    try {
      await pc.setLocalDescription(await pc.createOffer());
      console.log('onnegotiationneeded**********************offer');
      console.log(pc.localDescription);
      // send the offer to the other peer
    //   signaling.send({desc: pc.localDescription});
    // start();
    let desc = JSON.stringify(pc.localDescription);
    database.ref().child('Video/desc/' + calltoname).push({desc:desc,sender:name});
    } catch (err) {
      console.error(err);
    }
};

// once remote track media arrives, show it in remote video element
const remoteView = document.getElementById('remoteStream');
pc.ontrack = (event) => {
    // don't set srcObject again if it is already set.
    if (remoteView.srcObject) return;
    remoteView.srcObject = event.streams[0];
    remoteView.play();
};

// call start() to initiate
// const config = {audio: true, video: true};
const config = {audio: { 
  // autoGainControl: true,
  // channelCount: 2,
  echoCancellation: true
  // latency: 0,
  // noiseSuppression: true,
  // sampleRate: 48000,
  // sampleSize: 16,
  // volume: 0.9
 }, video: true};
const localView = document.getElementById('localStream');
function start() {
    try {
        // get local stream, show it in self-view and add it to be sent
        navigator.mediaDevices.getUserMedia(config).then((stream)=>{
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          localView.muted = true;
          localView.volume = 0;
          localView.srcObject = stream;
          localView.play();
        });
    } catch (err) {
      console.error(err);
    }
  }

  var name = '';
  var calltoname = '';

  function getName(){
    name = document.getElementById('myname').value;
    console.log(name);
  }

  function getCalltoname() {
    calltoname = document.getElementById('calltoname').value;
    console.log(calltoname);
  }

  function createChanel() {
    if ((name.length> 0) && (calltoname.length >0)){
        // const chanel = pc.createDataChannel('senddata');
        // console.log(chanel);
        start();
    }
  }


  // TODO: Replace the following with your app's Firebase project configuration
var firebaseConfig = {
    // ...
    apiKey: "AIzaSyA2I9XT-HhzcRNgiiNm-9pi5yJY5suq3Ag",
    authDomain: "project6smart2h.firebaseapp.com",
    databaseURL: "https://project6smart2h.firebaseio.com",
    projectId: "project6smart2h",
    storageBucket: "project6smart2h.appspot.com",
    messagingSenderId: "837083928015",
    appId: "1:837083928015:web:6250696a02203b39b0aeba"
  };
  
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

async function configDesc(desc) {
    console.log(desc);
    try {
        if (desc) {
            console.log('connectionSetting********desc');
            // if we get an offer, we need to reply with an answer
            if (desc.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(desc));
                // const stream =
                //   await navigator.mediaDevices.getUserMedia(config);
                //   stream.getTracks().forEach((track) =>
                //   pc.addTrack(track, stream));
                //   localView.srcObject = stream;
                //   localView.play();
                // start();
                await navigator.mediaDevices.getUserMedia(config).then((stream)=>{
                  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
                  localView.muted = true;
                  localView.volume = 0;
                  localView.srcObject = stream;
                  localView.play();
                });
                await pc.setLocalDescription(await pc.createAnswer());
                let descanser = JSON.stringify(pc.localDescription);
                database.ref().child('Video/desc/'+calltoname).push({desc: descanser, sender: name});
                
                // signaling.send({desc: pc.localDescription});
                console.log('offer****************************');
                console.log(pc.localDescription);
            } else if (desc.type === 'answer') {
              await pc.setRemoteDescription(desc);
              console.log('answer *****************************');
            } else {
              console.log('Unsupported SDP type.');
            }
        }
    } catch (err) {
      console.error(err);
    }
  }


  async function configCandicate(candidate) {
    try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
        console.error(err);
    }
  }

  function login() {
    if (name.length>0){
        database.ref('Video/desc/'+name).on('value', (snapshot)=> {
            console.log(snapshot);
            console.log(snapshot.key);
            if (snapshot.key === name) {
                snapshot.forEach((obj)=>{
                        calltoname = obj.val().sender;
                        console.log(calltoname);
                        // console.log(obj.key);
                        configDesc(JSON.parse(obj.val().desc));
                });
            }
        });
        database.ref('Video/desc/'+name).onDisconnect().remove();

        database.ref('Video/candidate').on('value', (snapshot)=> {
            console.log(snapshot);
            console.log(snapshot.key);
                snapshot.forEach((obj)=>{
                        console.log(obj.val().sender);
                        // console.log(obj.key);
                        if (obj.val().sender !== name) {
                             configCandicate(JSON.parse(obj.val().candidate));
                        }
                });
        });
        database.ref('Video/candidate').onDisconnect().remove();
        
        database.ref('Video/'+ name).set({name:name});
        database.ref('Video/'+ name).onDisconnect().remove();
    }

    alert('Đăng ký thành công!')
  }

