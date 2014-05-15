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

var cursorTrackUp = CC.PAD05;
var cursorTrackDown = CC.PAD01;
var devPageUp = CC.PAD06;
var devPageDown = CC.PAD02;
var shiftPadsUp = CC.PAD07;
var shiftPadsDown = CC.PAD03;
var mapMacro = CC.PAD16;
var stop = CC.PAD14;
var rec = CC.PAD15;
var od = CC.PAD16;
var note = CC.PAD09;
var automation = CC.PAD10;
var mixer = CC.PAD11;
var device = CC.PAD12;
var previousPreset = PC.PAD06;
var nextPreset = PC.PAD02;
var previousPresetCategory = PC.PAD07;
var nextPresetCategory = PC.PAD03;
var previousPresetCreator = PC.PAD08;
var nextPresetCreator = PC.PAD04;
var toggleSoloCursorTrack = PC.PAD01;
var toggleArmCursorTrack = PC.PAD05;

var isMapMacroPressed = false;
var padShift = 0;

var isSoloOn = false;
var isArmOn = false;
var presetName = "";
var presetCategory = "";
var presetCreator = "";
var deviceName = "";
var trackName = "";


function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);
	MPKminiKeys = host.getMidiInPort(0).createNoteInput("MPKmini Keys", "?0????");
	MPKminiPads = host.getMidiInPort(0).createNoteInput("MPKmini Pads", "?9????");
	
	MPKminiKeys.setShouldConsumeEvents(false);
	MPKminiPads.setShouldConsumeEvents(false);

	// /////////////////////////////////////////////// host sections

	application = host.createApplication();
	transport = host.createTransport();
	cursorTrack = host.createCursorTrack(2, 0);
	cursorDevice = cursorTrack.getPrimaryDevice();
	cursorTrack.getSolo().addValueObserver(function(on)
	{
		//sendNoteOn(9, 40, on ? 1 : 0);
		//sendMidi(201, 0, on ? 1 : 0);
		isSoloOn = on;
	});
	cursorTrack.getArm().addValueObserver(function(on)
	{
		isArmOn = !on;
	});
	cursorDevice.addPresetNameObserver(50, "None", function(on)
	{
		presetName = on;
	});
	cursorDevice.addPresetCategoryObserver(50, "None", function(on)
	{
		presetCategory = on;
	});
	cursorDevice.addPresetCreatorObserver(50, "None", function(on)
	{
		presetCreator = on;
	});
	cursorDevice.addNameObserver(50, "None", function(on)
	{
		deviceName = on;
	});
	cursorTrack.addNameObserver(50, "None", function(on)
	{
		trackName = on;
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

function exit()
{
}

function onMidi(status, data1, data2)
{
	var msg = data1;
	var val = data2;
	var buttonPressed = val > 0;
	var CHANNEL0 = 176;
	var CHANNEL10 = 185;
	var NOTE10 = 153;
	var PROGCHANGE = 201;
	var lowerKnobs = msg - CC.K1 + 4;
	var upperKnobs = msg - CC.K1 - 4;

//	printMidi(status, msg, val);

	if (status == CHANNEL10 && msg == mapMacro) isMapMacroPressed = val > 0;

	if (status == CHANNEL0 && msg >= CC.K1 && msg < CC.K1 + 4)
	{
		isMapMacroPressed ? val == 127 ? cursorDevice.getMacro(msg - CC.K1 + 4).getModulationSource().toggleIsMapping() : getEncoderTarget("lower", lowerKnobs, val) : getEncoderTarget("lower", lowerKnobs, val);
	}
	if (status == NOTE10 && msg >= 36 && msg <= 51)
	{
		//cursorTrack.playNote(msg + padShift, val);
	}
	else if (status == CHANNEL0 && msg >= CC.K5 && msg < CC.K5 + 4)
	{
		isMapMacroPressed ? val == 127 ? cursorDevice.getMacro(msg - CC.K5).getModulationSource().toggleIsMapping() : getEncoderTarget("upper", upperKnobs, val) : getEncoderTarget("upper", upperKnobs, val);
	}
	else if (status == PROGCHANGE && msg >= PC.PAD01 && msg <= PC.PAD16)
	{
		switch (msg)
		{
			case toggleArmCursorTrack:
				cursorTrack.getArm().toggle();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Arm " + (isArmOn ? "On" : "Off"));
				break;
			case toggleSoloCursorTrack:
				cursorTrack.getSolo().toggle();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Solo " + (isSoloOn ? "On" : "Off"));
				break;
			case previousPreset:
				cursorDevice.switchToPreviousPreset();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Preset: " + presetName);
				break;
			case nextPreset:
				cursorDevice.switchToNextPreset();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Preset: " + presetName);
				break;
			case previousPresetCategory:
				cursorDevice.switchToPreviousPresetCategory();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Category: " + presetCategory);
				break;
			case nextPresetCategory:
				cursorDevice.switchToNextPresetCategory();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Category: " + presetCategory);
				break;
			case previousPresetCreator:
				cursorDevice.switchToPreviousPresetCreator();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Creator: " + presetCreator);
				break;
			case nextPresetCreator:
				cursorDevice.switchToNextPresetCreator();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Creator: " + presetCreator);
				break;
			case toggleArmCursorTrack + 8:
				cursorTrack.getArm().toggle();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Arm " + (isArmOn ? "On" : "Off"));
				break;
			case toggleSoloCursorTrack + 8:
				cursorTrack.getSolo().toggle();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Solo " + (isSoloOn ? "On" : "Off"));
				break;
			case previousPreset + 8:
				cursorDevice.switchToPreviousPreset();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Preset: " + presetName);
				break;
			case nextPreset + 8:
				cursorDevice.switchToNextPreset();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Preset: " + presetName);
				break;
			case previousPresetCategory + 8:
				cursorDevice.switchToPreviousPresetCategory();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Category: " + presetCategory);
				break;
			case nextPresetCategory + 8:
				cursorDevice.switchToNextPresetCategory();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Category: " + presetCategory);
				break;
			case previousPresetCreator + 8:
				cursorDevice.switchToPreviousPresetCreator();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Creator: " + presetCreator);
				break;
			case nextPresetCreator + 8:
				cursorDevice.switchToNextPresetCreator();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Creator: " + presetCreator);
				break;
		}
	}
	else if (status == CHANNEL10 && val > 0) // do sth when button is pressed, ignore button release
	{
		switch (msg)
		{
			case mapMacro:
				break;
			case stop:
				// transport.stop();
				break;
			case rec:
				// transport.record();
				break;
			case od:
				// transport.toggleOverdub();
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
			case shiftPadsUp:
				if (padShift < 88)
				{
					padShift += 8;
					if(VISUAL_FEEDBACK) host.showPopupNotification("Pads Shifted: " + padShift);
				}
				break;
			case shiftPadsDown:
				if (padShift > -40)
				{
					padShift -= 8;
					if(VISUAL_FEEDBACK) host.showPopupNotification("Pads Shifted: " + padShift);
				}
				break;
			case devPageUp:
				cursorDevice.switchToDevice(DeviceType.ANY,ChainLocation.PREVIOUS);
				if(VISUAL_FEEDBACK) host.showPopupNotification("Device: " + deviceName);
				break;
			case devPageDown:
				cursorDevice.switchToDevice(DeviceType.ANY,ChainLocation.NEXT);
				if(VISUAL_FEEDBACK) host.showPopupNotification("Device: " + deviceName);
				break;
			case cursorTrackUp:
				cursorTrack.selectPrevious();
				if(VISUAL_FEEDBACK) host.showPopupNotification("Track: " + trackName);
				break;
			case cursorTrackDown:
				cursorTrack.selectNext();
				break;
		}
	}
}
function onSysex(data)
{
	// printSysex(data);
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