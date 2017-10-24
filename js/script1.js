window.onload = function(){

  'use strict';

  var
    divLog = document.getElementById('log'),
	  divLog1 = document.getElementById('log1'),
	  divLog2 = document.getElementById('log2'),
	  divLog3 = document.getElementById('log3'),
	  divLog4 = document.getElementById('log4'),
	  divLog5 = document.getElementById('log5'),
	  divLog6 = document.getElementById('log6'),
	  divLog7 = document.getElementById('log7'),
	  divLog8 = document.getElementById('log8'),
    divInputs = document.getElementById('inputs'),
    divOutputs = document.getElementById('outputs'),
    midiAccess,
    checkboxMIDIInOnChange,
    checkboxMIDIOutOnChange,
    activeInputs = {},
    activeOutputs = {};
var context = new AudioContext(),
    oscillators = {};

  if(navigator.requestMIDIAccess !== undefined){
    navigator.requestMIDIAccess({sysex: true}).then(

      function onFulfilled(access){
        midiAccess = access;

        // create list of all currently connected MIDI devices
        showMIDIPorts();

        // update the device list when devices get connected, disconnected, opened or closed
        midiAccess.onstatechange = function(e){
          var port = e.port;
          var div = port.type === 'input' ? divInputs : divOutputs;
          var listener = port.type === 'input' ? checkboxMIDIInOnChange : checkboxMIDIOutOnChange;
          var activePorts = port.type === 'input' ? activeInputs : activeOutputs;
          var checkbox = document.getElementById(port.type + port.id);
          var label;

          // device disconnected
          if(port.state === 'disconnected'){
            port.close();
            label = checkbox.parentNode;
            checkbox.nextSibling.nodeValue = port.name + ' (' + port.state + ', ' +  port.connection + ')';
            checkbox.disabled = true;
            checkbox.checked = false;
            delete activePorts[port.type + port.id];

          // new device connected
          }else if(checkbox === null){
            label = document.createElement('label');
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = port.type + port.id;
            checkbox.addEventListener('change', listener, false);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(port.name + ' (' + port.state + ', ' +  port.connection + ')'));
            div.appendChild(label);
            div.appendChild(document.createElement('br'));

          // device opened or closed
          }else if(checkbox !== null){
            label = checkbox.parentNode;
            checkbox.disabled = false;
            checkbox.nextSibling.nodeValue = port.name + ' (' + port.state + ', ' +  port.connection + ')';
          }
        };
      },

      function onRejected(e){
        divInputs.innerHTML = e.message;
        divOutputs.innerHTML = '';
      }
    );
  }

  // browsers without WebMIDI API or Jazz plugin
  else{
    divInputs.innerHTML = 'No access to MIDI devices: browser does not support WebMIDI API, please use the WebMIDIAPIShim together with the Jazz plugin';
    divOutputs.innerHTML = '';
  }


  function showMIDIPorts(){
    var
      html,
      checkbox,
      checkboxes,
      inputs, outputs,
      i, maxi;

    inputs = midiAccess.inputs;
    html = '<h4>midi inputs:</h4>';
    inputs.forEach(function(port){
      //console.log('in', port.name, port.id);
      html += '<label><input type="checkbox" id="' + port.type + port.id + '">' + port.name + ' (' + port.state + ', ' +  port.connection + ')</label><br>';
    });
    divInputs.innerHTML = html;

    outputs = midiAccess.outputs;
    html = '<h4>midi outputs:</h4>';
    outputs.forEach(function(port){
      //console.log('out', port.name, port.id);
      html += '<label><input type="checkbox" id="' + port.type + port.id + '">' + port.name + ' (' + port.state + ', ' +  port.connection + ')</label><br>';
    });
    divOutputs.innerHTML = html;

    checkboxes = document.querySelectorAll('#inputs input[type="checkbox"]');
    for(i = 0, maxi = checkboxes.length; i < maxi; i++){
      checkbox = checkboxes[i];
      checkbox.addEventListener('change', checkboxMIDIInOnChange, false);
    }

    checkboxes = document.querySelectorAll('#outputs input[type="checkbox"]');
    for(i = 0, maxi = checkboxes.length; i < maxi; i++){
      checkbox = checkboxes[i];
      checkbox.addEventListener('change', checkboxMIDIOutOnChange, false);
    }
  }


	function extractMidiCommand(data) {
    var raw = data[0];
    var cmd = data[0] >> 4;
    var channel = data[0] & 0xf;
    var type = data[0] & 0xf0;
    var data1 = data[1];
    var data2 = data[2];
    var frequency = cmd === 8 || cmd === 9 ? midiNoteToStandardFrequency(data1 - 69): null;
    var note = cmd === 8 || cmd === 9 ? midiNoteNumberToNote(data1): null;
    var cmdName = '';
    switch (cmd){
        case 8:
            cmdName = 'noteOff';
            break;
        case 9:
            cmdName = 'noteOn';
            break;
        case 11:
            cmdName = `controller.${controllerObject[data1]}`;
            break; 
		case 12:
            cmdName = `Progam Change`;
            break;
		case 13:
            cmdName = 'AfterTouch';
            break;
        case 14:
            cmdName = 'pitchBend';
            break;
        default:
            cmdName = 'unknown';
    }
    var midiCommand = {
        raw: raw,
        cmd: cmd, 
        channel: channel +1, 
        type: type, 
        data1: data1, 
        data2: data2,
        frequency: frequency,
        note: note,
        cmdName: cmdName,
    };
    return midiCommand;
}
	function extractMidiRealtime(data) {
    var realtimeMessage = '';
    switch (data[0]){
        case 248:
            realtimeMessage = 'Clock';
            break;
        case 250:
            realtimeMessage = 'Start';
            break;
        case 251:
            realtimeMessage = 'Continue';
            break;
        case 252:
            realtimeMessage = 'Stop';
            break;
        case 254:
            realtimeMessage = 'ActiveSensing';
            break;
        case 255:
            realtimeMessage = 'SystemReset';
            break;
        default:
            realtimeMessage = 'Udefined';
    }
    return realtimeMessage;
}
	function midiNoteToStandardFrequency(note) {
    return 440 * Math.pow(2, (note)/12);
}
function midiNoteNumberToNote(noteNumber) {
    var note = `${noteArray[noteNumber % 12]}${Math.floor((noteNumber / 12)-2)}`;
    console.log(note, noteNumber);
	divLog7.innerHTML = note + ' ' + noteNumber + '<br>' + divLog7.innerHTML;
    return note;
    
}
const noteArray = ['C', 'C#', 'D', 'D#',	'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const controllerObject = {
    '1' : 'ModWheel',
    '2' : 'BreathController',
    '4' : 'FootController',
    '7' : 'Volume',
    '8' : 'Balance',
    '9' : 'Pan',
    '11' : 'ExpressionController'
    
}
	
  // handle incoming MIDI messages
  function inputListener(midimessageEvent){
   
var frequency = midiNoteToFrequency(midimessageEvent.data[1]);
	  
	   var port, portId,
      data = midimessageEvent.data,
      type = data[0],
      data1 = data[1],
      data2 = data[2];
var tarimai = extractMidiCommand(data);
    // do something graphical with the incoming midi data
    divLog.innerHTML = type + ' ' + data1 + ' ' + data2  + '<br>' + divLog.innerHTML;

    for(portId in activeOutputs){
      if(activeOutputs.hasOwnProperty(portId)){
        port = activeOutputs[portId];
        port.send(data);
      }
    }
	  
	   if (tarimai.cmd === 9 && midimessageEvent.data[2] > 0) {
        playNote(tarimai.frequency);
		   
    }
 
    if (tarimai.cmd === 8 || midimessageEvent.data[2] === 0) {
        stopNote(tarimai.frequency);
    }
	  
	  if(midimessageEvent.data.length > 1) {
        console.log(extractMidiCommand(midimessageEvent.data));
		  divLog1.innerHTML = "Fre:  " + tarimai.frequency + '<br>' + divLog1.innerHTML;
		  divLog2.innerHTML = "CCName: " + tarimai.cmdName + '<br>' + divLog2.innerHTML;
		  divLog3.innerHTML = "Channel:  " + tarimai.channel + '<br>' + divLog3.innerHTML;  
		  divLog4.innerHTML = "CINdex:  " + tarimai.cmd + '<br>' + divLog4.innerHTML;
		  divLog5.innerHTML = "p1:  " + tarimai.data1 + '<br>' + divLog5.innerHTML;
		  divLog6.innerHTML = "p2:  " + data2 + '<br>' + divLog6.innerHTML;
    }else if(event.data[0] > 248){//ignore clock for now
		 
        console.log(extractMidiRealtime(midimessageEvent.data));
		divLog8.innerHTML = extractMidiRealtime(midimessageEvent.data) + '<br>' + divLog8.innerHTML;
		 
    }
	  
	  
  }


  checkboxMIDIInOnChange = function(){
    // port id is the same a the checkbox id
    var id = this.id;
    var port = midiAccess.inputs.get(id.replace('input', ''));
    if(this.checked === true){
      activeInputs[id] = port;
      // implicitly open port by adding an onmidimessage listener
      port.onmidimessage = inputListener;
    }else{
      delete activeInputs[id];
      port.close();
    }
  };


  checkboxMIDIOutOnChange = function(){
    // port id is the same a the checkbox id
    var id = this.id;
    var port = midiAccess.outputs.get(id.replace('output', ''));
    if(this.checked === true){
      activeOutputs[id] = port;
      port.open();
    }else{
      delete activeOutputs[id];
      port.close();
    }
  };

	
 
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
        .then(success, failure);
}
 
function success (midi) {
    var inputs = midi.inputs.values();
    // inputs is an Iterator
 
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message call the onMIDIMessage function
        //input.value.onmidimessage = onMIDIMessage;
    }
}
 
function failure () {
    console.error('No access to your midi devices.')
}
 /*
function onMIDIMessage (message) {
    var frequency = midiNoteToFrequency(message.data[1]);
 
    if (message.data[0] === 144 && message.data[2] > 0) {
        playNote(frequency);
    }
 
    if (message.data[0] === 128 || message.data[2] === 0) {
        stopNote(frequency);
    }
}
 */
function midiNoteToFrequency (note) {
    return Math.pow(2, ((note - 69) / 12)) * 440;
}
 
function playNote (frequency) {
    oscillators[frequency] = context.createOscillator();
    oscillators[frequency].frequency.value = frequency;
    oscillators[frequency].connect(context.destination);
    oscillators[frequency].start(context.currentTime);
}
 
function stopNote (frequency) {
    oscillators[frequency].stop(context.currentTime);
    oscillators[frequency].disconnect();
}
	
	
	
};


