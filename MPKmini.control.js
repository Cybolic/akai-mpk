loadAPI(1);

host.defineController("Akai", "MPKmini", "1.0", "DDCE8F80-4858-11E2-BCFD-0800200C9A66");
// "F0 7E 00 06 02 47 72 00 19 00 01 00 03 00 7F 7F 7F 7F 00 4B 01 00 09 00 09 00 02 03 09 00 08 09 07 02 F7";

host.defineSysexIdentityReply("F0 7E 00 06 02 47 7C 00 19 00 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? F7");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["MPK mini"], ["MPK mini"]);

// Config

  // Set default
var VISUAL_FEEDBACK = true;

// End Config

var CHANNEL0 = 176;
var CHANNEL10 = 185;
var PROGCHANGE = 201;

// List of CCs and PCs of the Pads:
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
var toggleMacro = CC.PAD08;
var nextMap = CC.PAD04;

// CC & PB 2 - Transport and Track
var stop = CC.PAD13;
var play = CC.PAD14;
var rec = CC.PAD15;
var od = CC.PAD16;
var toggleArmCursorTrack = CC.PAD09;
var toggleSoloCursorTrack = CC.PAD10;
var toggleMuteCursorTrack = CC.PAD11;

// PC & PB 1 - Preset Navigation
var previousPreset = PC.PAD05;
var nextPreset = PC.PAD01;
var previousPresetCategory = PC.PAD06;
var nextPresetCategory = PC.PAD02;
var previousPresetCreator = PC.PAD07;
var nextPresetCreator = PC.PAD03;
var toggleMacro2 = PC.PAD08;
var nextMap2 = PC.PAD04;

// PC & PB 2 - GUI Navigation
var note = PC.PAD09;
var automation = PC.PAD10;
var mixer = PC.PAD11;
var device = PC.PAD12;
var inspector = PC.PAD13;
var perspective = PC.PAD14;
var project = PC.PAD15;
var browser = PC.PAD16;

// State and Value Variables
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
var isMacroOn = true;
var macroHasChanged = false;
var macro = [];
var param = [];
//var	nextParameterPageEnabled = true;
//var	prevParameterPageEnabled = true;
var paraPage = 0;
var paraPageOld = 42;

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
	padTrans.set(Math.round(offset/8), 1);
}


function init()
{
	// Create Preferences, DocState and Visual Notifications:
	docState = host.getDocumentState();
	prefs = host.getPreferences();
	notif = host.getNotificationSettings();

	notif.setShouldShowChannelSelectionNotifications(true);
	notif.setShouldShowDeviceLayerSelectionNotifications(true);
	notif.setShouldShowDeviceSelectionNotifications(true);
	notif.setShouldShowMappingNotifications(true);
	notif.setShouldShowPresetNotifications(true);
	notif.setShouldShowSelectionNotifications(true);
	notif.setShouldShowTrackSelectionNotifications(true);
	notif.setShouldShowValueNotifications(true);

	// Seupt the Pref and docState Controls:
	padTrans = docState.getNumberSetting("Pad Transpose", "Settings", -5, 5, 1, "Bank Steps", 0);
	padTrans.addValueObserver(1, function(value){
		//println(value);
		if (Math.round(value*8) != padShift) {
			padShift = Math.round(value*8);
			setNoteTable(padTranslation, padShift);
		}
	});
	knobModeEnum = ["Macros", "Device Map"];
	knobMode = docState.getEnumSetting("Knobs", "Settings", knobModeEnum, "Macros");
	knobMode.addValueObserver(function(value){
		//println(value);
	});

	visualCuesEnum = ["On", "Off"];
	visualCues = docState.getEnumSetting("Additional Visual Cues", "Settings", visualCuesEnum, "On");
	visualCues.addValueObserver(function(value){
		value === "On" ? VISUAL_FEEDBACK = true : VISUAL_FEEDBACK = false;
		//println(value);
	});

	// Set up Midi Inputs
	host.getMidiInPort(0).setMidiCallback(onMidi);
	MPKminiKeys = host.getMidiInPort(0).createNoteInput("MPKmini Keys", "?0????");
	MPKminiPads = host.getMidiInPort(0).createNoteInput("MPKmini Pads", "?9????");

	MPKminiKeys.setShouldConsumeEvents(false);
	MPKminiPads.setShouldConsumeEvents(false);

	setNoteTable(padTranslation, 0);

	// Setup Views and Callbacks:

	application = host.createApplication();
	transport = host.createTransport();
	//cursorTrack = host.createCursorTrack(0, 0);
	cursorTrack = host.createEditorTrackSelection(true,0, 8);
	//cursorDevice = cursorTrack.getPrimaryDevice();
	cursorDevice = cursorTrack.createEditorDeviceSelection(true);

	//cursorTrack.addNoteObserver(function(on, key, velo){
	//	println(key);
	//});
	//
	//cursorTrack.addVuMeterObserver(129, 1, true, function(value){
	//	println(value);
	//});

	cursorTrack.getSolo().addValueObserver(function(on)
	{
		isSoloOn = on;
		soloHasChanged = true;
	});
	cursorTrack.getArm().addValueObserver(function(on)
	{
		println(on);
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
		//println(on);
		playHasChanged = true;
	});
	transport.addIsRecordingObserver(function(on)
	{
		isRecordOn = on;
		//println(on);
		recordHasChanged = true;
	});
	transport.addOverdubObserver(function(on)
	{
		isOverdubOn = on;
		overdubHasChanged = true;
	});

	//cursorDevice.addPresetNameObserver(50, "None", function(on)
	//{
	//	presetName = on;
	//	if (presetHasChanged) {
	//		showParameter = "preset";
	//		presetHasChanged = false;
	//	}
	//});
	//cursorDevice.addPresetCategoryObserver(50, "None", function(on)
	//{
	//	presetCategory = on;
	//	if (categoryHasChanged) {
	//		showParameter = "category";
	//		categoryHasChanged = false;
	//	}
	//});
	//cursorDevice.addPresetCreatorObserver(50, "None", function(on)
	//{
	//	presetCreator = on;
	//	if (creatorHasChanged) {
	//		showParameter = "creator";
	//		creatorHasChanged = false;
	//	}
	//});
	//cursorDevice.addNameObserver(50, "None", function(on)
	//{
	//	deviceName = on;
	//	if (deviceHasChanged) {
	//		showParameter = "device";
	//		deviceHasChanged = false;
	//	}
	//});

	//cursorDevice.addPageNamesObserver(function(on){
	//})

	cursorDevice.addSelectedPageObserver(0, function(on){
		paraPage = on;
	})

	//cursorDevice.addNextParameterPageEnabledObserver(function(on){
	//	println(on);
	//	nextParameterPageEnabled = on;
	//})
	//
	//cursorDevice.addPreviousParameterPageEnabledObserver(function(on){
	//	println(on);
	//	prevParameterPageEnabled = on;
	//})

	//cursorTrack.addNameObserver(50, "None", function(on)
	//{
	//	trackName = on;
	//	if (trackHasChanged) {
	//		showParameter = "track";
	//		trackHasChanged = false;
	//	}
	//});


	for ( var p = 0; p < 8; p++)
	{
		macro[p] = cursorDevice.getMacro(p);
		macro[p].getAmount().setIndication(isMacroOn);
		param[p] = cursorDevice.getParameter(p);
		param[p].setIndication(!isMacroOn);
	}

	// Show the Bitwig Logo on the Pads :-)
	sendNoteOn(9, 36, 1);
	sendNoteOn(9, 39, 1);
	sendNoteOn(9, 41, 1);
	sendNoteOn(9, 42, 1);

	sendNoteOn(9, 45, 1);
	sendNoteOn(9, 46, 1);
	sendNoteOn(9, 48, 1);
	sendNoteOn(9, 51, 1);
}

// Deal with the incoming Midi:
function onMidi(status, msg, val)
{
	var lowerKnobs = msg - CC.K1 + 4;
	var upperKnobs = msg - CC.K1 - 4;

	//printMidi(status, msg, val);

	if (status == CHANNEL0 && msg >= CC.K1 && msg < CC.K1 + 4)
	{
		getEncoderTarget("lower", lowerKnobs, val);
	}
	else if (status == CHANNEL0 && msg >= CC.K5 && msg < CC.K5 + 4)
	{
		getEncoderTarget("upper", upperKnobs, val);
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
			case toggleMacro2:
				isMacroOn = !isMacroOn;
				toggleKnobs();
				macroHasChanged = true;
				showParameter = "macro";
				break;
			case nextMap2:
				if (!isMacroOn) {
					nextParameterPageEnabled ? cursorDevice.nextParameterPage() : cursorDevice.setParameterPage(0);
				}
				break;

			// PC & PB 2
			case inspector:
				application.toggleInspector();
				break;
			case perspective:
				application.nextPerspective();
				break;
			case project:
				application.nextProject();
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
				cursorDevice.selectPrevious();
				deviceHasChanged = true;
				paraPage = 0;
				paraPage = 42;
				break;
			case devPageDown:
				cursorDevice.selectNext();
				deviceHasChanged = true;
				paraPage = 0;
				paraPage = 42;
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
			case toggleMacro:
				isMacroOn = !isMacroOn;
				toggleKnobs();
				macroHasChanged = true;
				showParameter = "macro";
				break;
			case nextMap:
				if (!isMacroOn) {
					if (paraPage == paraPageOld) {
						cursorDevice.setParameterPage(0);
						paraPageOld = 42
					}
					else {
						cursorDevice.nextParameterPage();
						paraPageOld = paraPage;
					}
					//nextParameterPageEnabled ? cursorDevice.nextParameterPage() : cursorDevice.setParameterPage(0);
				}
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
				cursorTrack.getArm().set(true);
				//cursorTrack.getArm().toggle();
				showParameter = "arm";
				break;
			case toggleSoloCursorTrack:
				//cursorTrack.getSolo().toggle();
				showParameter = "solo";
				break;
			case toggleMuteCursorTrack:
				//cursorTrack.getMute().toggle();
				showParameter = "mute";
				break;
		}
	}
	else if (status == CHANNEL10 && val == 0) // do sth when button released
	{
		// These are workarounds for the fact that the pads overwrite their lighted state on release
		// So we have to re-send the light on message...
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

// Sending out Midi to the Controller
function flush()
{
	if (VISUAL_FEEDBACK && showParameter)
	{

		switch (showParameter) {
			//case "track":
			//		showParameter = "none";
			//		host.showPopupNotification("Track: " + trackName);
			//	break;
			//case "device":
			//		showParameter = "none";
			//		host.showPopupNotification("Device: " + deviceName);
			//	break;
			case "padshift":
				if (padshiftHasChanged) {
					showParameter = "none";
					host.showPopupNotification("Pad Bank: " + padShift/8);
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
			case "macro":
				if (macroHasChanged) {
					showParameter = "none";
					host.showPopupNotification((isMacroOn ? "Macro Mode" : "Device Mapping Mode"));
				}
			//case "preset":
			//		showParameter = "none";
			//		host.showPopupNotification("Preset: " + presetName);
			//	break;
			//case "category":
			//		showParameter = "none";
			//		host.showPopupNotification("Category: " + presetCategory);
			//	break;
			//case "creator":
			//		showParameter = "none";
			//		host.showPopupNotification("Creator: " + presetCreator);
				//break;
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

// Function to toggle the Knobs between Macro and Device Mapping:
function toggleKnobs () {
	//println(isMacroOn);
	for ( var p = 0; p < 8; p++)
	{
		macro[p].getAmount().setIndication(isMacroOn);
		param[p].setIndication(!isMacroOn);
	}
}

// Function to deal with the Knobs:
function getEncoderTarget(row, knob, val)
{
	if (isMacroOn) {
		return macro[knob].getAmount().set(val, 128);
	}
	else {
		return param[knob].set(val, 128);
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
