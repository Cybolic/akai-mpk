loadAPI(1);

host.defineController("Akai", "MPKmini", "1.0", "DDCE8F80-4858-11E2-BCFD-0800200C9A66");
// "F0 7E 00 06 02 47 72 00 19 00 01 00 03 00 7F 7F 7F 7F 00 4B 01 00 09 00 09 00 02 03 09 00 08 09 07 02 F7";

host.defineSysexIdentityReply("F0 7E 00 06 02 47 7C 00 19 00 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? F7");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["MPK mini"], ["MPK mini"]);

// Config

  // Set default
var VISUAL_FEEDBACK = true;

  // Check if a config file is available, if yes, use the values there instead:
try {
	load("MPKmini.config.js");
} catch(e) {
	//Nothing to do here
}

// End Config

var CC =
{
	K1 : 13,
	K5 : 17,
	PAD01 : 20,
	PAD02 : 21,
	PAD03 : 22,
	PAD04 : 23,
	PAD05 : 24,
	PAD06 : 25,
	PAD07 : 26,
	PAD08 : 27,
	PAD09 : 28,
	PAD10 : 29,
	PAD11 : 30,
	PAD12 : 31,
	PAD13 : 35,
	PAD14 : 36,
	PAD15 : 37,
	PAD16 : 38
};
var PC =
{
	PAD01 : 0,
	PAD02 : 1,
	PAD03 : 2,
	PAD04 : 3,
	PAD05 : 4,
	PAD06 : 5,
	PAD07 : 6,
	PAD08 : 7,
	PAD09 : 8,
	PAD10 : 9,
	PAD11 : 10,
	PAD12 : 11,
	PAD13 : 12,
	PAD14 : 13,
	PAD15 : 14,
	PAD16 : 15
};

// CC & PB 1 - Navigation and Transpose + Mapping
var cursorTrackUp = CC.PAD05;
var cursorTrackDown = CC.PAD01;
var devPageUp = CC.PAD06;
var devPageDown = CC.PAD02;
var shiftPadsUp = CC.PAD07;
var shiftPadsDown = CC.PAD03;
var mapMacro = CC.PAD08;

// CC & PB 2 - Transport and Track
var stop = CC.PAD13;
var play = CC.PAD14;
var rec = CC.PAD15;
var od = CC.PAD16;
var toggleArmCursorTrack = CC.PAD09;
var toggleSoloCursorTrack = CC.PAD10;
var toggleMuteCursorTrack = CC.PAD11;

// PC & PB 1 - Preset Navigation
var previousPreset = PC.PAD06;
var nextPreset = PC.PAD02;
var previousPresetCategory = PC.PAD07;
var nextPresetCategory = PC.PAD03;
var previousPresetCreator = PC.PAD08;
var nextPresetCreator = PC.PAD04;

// PC & PB 2 - GUI Navigation
var note = PC.PAD09;
var automation = PC.PAD10;
var mixer = PC.PAD11;
var device = PC.PAD12;
var perspective = PC.PAD13;
var zoomIn = PC.PAD14;
var zoomOut = PC.PAD15;
var browser = PC.PAD16;


var isMapMacroPressed = false;
var padShift = 0;
var padshiftHasChanged = true;


var isRecordOn = false;
var recordHasChanged = false;
var isPlayOn = false;
var playHasChanged = false;
var isOverdubOn = false;
var overdubHasChanged = false;
var isSoloOn = false;
var soloHasChanged = false;
var isArmOn = false;
var armHasChanged = false;
var isMuteOn = false;
var muteHasChanged = false;
var presetName = "";
var presetHasChanged = false;
var presetCategory = "";
var categoryHasChanged = false;
var presetCreator = "";
var creatorHasChanged = false;
var deviceName = "";
var deviceHasChanged = false;
var trackName = "";
var trackHasChanged = false;

//var valueChanged = false;
var showParameter = "";

var padTranslation = initArray(0, 128);


function setNoteTable(table, offset) {
  for (var i = 0; i < 128; i++)
	{
		table[i] = offset + i;
		if (table[i] < 0 || table[i] > 127) {
			table[i] = -1;
		}
	}
	MPKminiPads.setKeyTranslationTable(padTranslation);
}


function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);
	MPKminiKeys = host.getMidiInPort(0).createNoteInput("MPKmini Keys", "?0????");
	MPKminiPads = host.getMidiInPort(0).createNoteInput("MPKmini Pads", "?9????");

	MPKminiKeys.setShouldConsumeEvents(false);
	MPKminiPads.setShouldConsumeEvents(false);

	setNoteTable(padTranslation, 0);

	// /////////////////////////////////////////////// host sections

	application = host.createApplication();
	transport = host.createTransport();
	cursorTrack = host.createCursorTrack(0, 0);
	cursorDevice = cursorTrack.getPrimaryDevice();

	cursorTrack.getSolo().addValueObserver(function(on)
	{
		isSoloOn = on;
		soloHasChanged = true;
	});
	cursorTrack.getArm().addValueObserver(function(on)
	{
		isArmOn = on;
		armHasChanged = true;
	});
	cursorTrack.getMute().addValueObserver(function(on)
	{
		isMuteOn = on;
		muteHasChanged = true;
	});

	transport.addIsPlayingObserver(function(on)
	{
		isPlayingOn = on;
		println(on);
		playHasChanged = true;
	});
	transport.addIsRecordingObserver(function(on)
	{
		isRecordOn = on;
		println(on);
		recordHasChanged = true;
	});
	transport.addOverdubObserver(function(on)
	{
		isOverdubOn = on;
		overdubHasChanged = true;
	});

	cursorDevice.addPresetNameObserver(50, "None", function(on)
	{
		presetName = on;
		if (presetHasChanged) {
			showParameter = "preset";
			presetHasChanged = false;
		}
	});
	cursorDevice.addPresetCategoryObserver(50, "None", function(on)
	{
		presetCategory = on;
		if (categoryHasChanged) {
			showParameter = "category";
			categoryHasChanged = false;
		}
	});
	cursorDevice.addPresetCreatorObserver(50, "None", function(on)
	{
		presetCreator = on;
		if (creatorHasChanged) {
			showParameter = "creator";
			creatorHasChanged = false;
		}
	});
	cursorDevice.addNameObserver(50, "None", function(on)
	{
		deviceName = on;
		if (deviceHasChanged) {
			showParameter = "device";
			deviceHasChanged = false;
		}
	});
	cursorTrack.addNameObserver(50, "None", function(on)
	{
		trackName = on;
		if (trackHasChanged) {
			showParameter = "track";
			trackHasChanged = false;
		}
	});


	for ( var p = 0; p < 8; p++)
	{
		var macro = cursorDevice.getMacro(p);
		macro.getAmount().setIndication(true);
	}

	// ////bitwig logo;)
	sendNoteOn(9, 36, 1);
	sendNoteOn(9, 39, 1);
	sendNoteOn(9, 41, 1);
	sendNoteOn(9, 42, 1);

	sendNoteOn(9, 45, 1);
	sendNoteOn(9, 46, 1);
	sendNoteOn(9, 48, 1);
	sendNoteOn(9, 51, 1);
}


var CHANNEL0 = 176;
var CHANNEL10 = 185;
var PROGCHANGE = 201;

function onMidi(status, msg, val)
{
	var lowerKnobs = msg - CC.K1 + 4;
	var upperKnobs = msg - CC.K1 - 4;

	//printMidi(status, msg, val);

	if (status == CHANNEL10 && msg == mapMacro)
	{
		isMapMacroPressed = val > 0;
		if(isMapMacroPressed) host.showPopupNotification("MapMacro: On");
		else host.showPopupNotification("MapMacro: Off");
	}

	if (status == CHANNEL0 && msg >= CC.K1 && msg < CC.K1 + 4)
	{
		isMapMacroPressed ? val == 127 ? cursorDevice.getMacro(msg - CC.K1 + 4).getModulationSource().toggleIsMapping() : getEncoderTarget("lower", lowerKnobs, val) : getEncoderTarget("lower", lowerKnobs, val);
	}
	else if (status == CHANNEL0 && msg >= CC.K5 && msg < CC.K5 + 4)
	{
		isMapMacroPressed ? val == 127 ? cursorDevice.getMacro(msg - CC.K5).getModulationSource().toggleIsMapping() : getEncoderTarget("upper", upperKnobs, val) : getEncoderTarget("upper", upperKnobs, val);
	}
	else if (status == PROGCHANGE && msg >= PC.PAD01 && msg <= PC.PAD16)
	{
		switch (msg)
		{
			// PC & PB 1
			case previousPreset:
				cursorDevice.switchToPreviousPreset();
				presetHasChanged = true;
				break;
			case nextPreset:
				cursorDevice.switchToNextPreset();
				presetHasChanged = true;
				break;
			case previousPresetCategory:
				cursorDevice.switchToPreviousPresetCategory();
				categoryHasChanged = true;
				break;
			case nextPresetCategory:
				cursorDevice.switchToNextPresetCategory();
				categoryHasChanged = true;
				break;
			case previousPresetCreator:
				cursorDevice.switchToPreviousPresetCreator();
				creatorHasChanged = true;
				break;
			case nextPresetCreator:
				cursorDevice.switchToNextPresetCreator();
				creatorHasChanged = true;
				break;

			// PC & PB 2
			case perspective:
				application.nextPerspective();
				break;
			case zoomIn:
				application.zoomIn();
				break;
			case zoomOut:
				application.zoomOut();
				break;
			case browser:
				application.toggleBrowserVisibility();
				break;
			case note:
				application.toggleNoteEditor();
				break;
			case automation:
				application.toggleAutomationEditor();
				break;
			case mixer:
				application.toggleMixer();
				break;
			case device:
				application.toggleDevices();
				break;


		}
	}
	else if (status == CHANNEL10 && val > 0) // do sth when button is pressed, ignore button release
	{
		switch (msg)
		{
			// CC & PB 1
			case devPageUp:
				cursorDevice.switchToDevice(DeviceType.ANY,ChainLocation.PREVIOUS);
				deviceHasChanged = true;
				break;
			case devPageDown:
				cursorDevice.switchToDevice(DeviceType.ANY,ChainLocation.NEXT);
				deviceHasChanged = true;
				break;
			case cursorTrackUp:
				cursorTrack.selectPrevious();
				trackHasChanged = true;
				break;
			case cursorTrackDown:
				cursorTrack.selectNext();
				trackHasChanged = true;
				break;
			case shiftPadsUp:
				if (padShift < 88)
				{
					padShift += 8;
					setNoteTable(padTranslation, padShift);
				}
				valueChanged = true;
				showParameter = "padshift";
				break;
			case shiftPadsDown:
				if (padShift > -40)
				{
					padShift -= 8;
					setNoteTable(padTranslation, padShift);
				}
				valueChanged = true;
				showParameter = "padshift";
				break;
			case mapMacro:
				break;

			// CC & PB 2
			case stop:
				transport.stop();
				break;
			case play:
				transport.play();
				break;
			case rec:
				transport.record();
				break;
			case od:
				transport.toggleOverdub();
				break;
			case toggleArmCursorTrack:
				cursorTrack.getArm().toggle();
				showParameter = "arm";
				break;
			case toggleSoloCursorTrack:
				cursorTrack.getSolo().toggle();
				showParameter = "solo";
				break;
			case toggleMuteCursorTrack:
				cursorTrack.getMute().toggle();
				showParameter = "mute";
				break;
		}
	}
	else if (status == CHANNEL10 && val == 0) // do sth when button released
	{
		switch (msg)
		{
			case toggleArmCursorTrack:
				armHasChanged = true;
				break;
			case toggleSoloCursorTrack:
				soloHasChanged = true;
				break;
			case toggleMuteCursorTrack:
				muteHasChanged = true;
				break;
			case play:
				playHasChanged = true;
				break;
			case rec:
				recordHasChanged = true;
				break;
			case od:
				overdubHasChanged = true;
				break;

		}
	}
}
function onSysex(data)
{
	// printSysex(data);
}

function flush()
{
	if (VISUAL_FEEDBACK && showParameter)
	{

		switch (showParameter) {
			case "track":
					showParameter = "none";
					host.showPopupNotification("Track: " + trackName);
				break;
			case "device":
					showParameter = "none";
					host.showPopupNotification("Device: " + deviceName);
				break;
			case "padshift":
				if (padshiftHasChanged) {
					showParameter = "none";
					host.showPopupNotification("Pads Shifted: " + padShift);
				}
				break;
			case "arm":
				if (armHasChanged) {
				host.showPopupNotification("Arm: " + (isArmOn ? "On" : "Off"));
				}
				break;
			case "solo":
				if (soloHasChanged) {
					showParameter = "none";
					host.showPopupNotification("Solo: " + (isSoloOn ? "On" : "Off"));
				}
				break;
			case "mute":
				if (muteHasChanged) {
					showParameter = "none";
					host.showPopupNotification("Mute: " + (isSoloOn ? "On" : "Off"));
				}
				break;
			case "preset":
					showParameter = "none";
					host.showPopupNotification("Preset: " + presetName);
				break;
			case "category":
					showParameter = "none";
					host.showPopupNotification("Category: " + presetCategory);
				break;
			case "creator":
					showParameter = "none";
					host.showPopupNotification("Creator: " + presetCreator);
				break;
		}
	}
	if (armHasChanged)
	{
		sendMidi(185, 28, isArmOn ? 127 : 0);
		armHasChanged = false;
	}
	if (soloHasChanged)
	{
		sendMidi(185, 29, isSoloOn ? 127 : 0);
		soloHasChanged = false;
	}
	if (muteHasChanged)
	{
		sendMidi(185, 30, isMuteOn ? 127 : 0);
		muteHasChanged = false;
	}
	if (playHasChanged)
	{
		sendMidi(185, 36, isPlayingOn ? 127 : 0);
		playHasChanged = false;
	}
	if (recordHasChanged)
	{
		sendMidi(185, 37, isRecordOn ? 127 : 0);
		recordHasChanged = false;
	}
	if (overdubHasChanged)
	{
		sendMidi(185, 38, isOverdubOn ? 127 : 0);
		overdubHasChanged = false;
	}

}

function getEncoderTarget(row, knob, val)
{
	if (row == "lower")
	{
		return cursorDevice.getMacro(knob).getAmount().set(val, 128);
	}
	else if (row == "upper")
	{
		return cursorDevice.getMacro(knob).getAmount().set(val, 128);
	}
}
function getObserverIndexFunc(index, f)
{
	return function(value)
	{
		f(index, value);
	};
}

function exit()
{
}
