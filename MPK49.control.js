//////////////////////////////////////////////////////
////        encoders can send nrpn, but it's broken. on fast movements, an encoder sends less data, 
////        which means, much less and delayed change of parameter values in the app.
////        only works like expected when moving encoders very slowly
////        -> check nrpn behaviour on apc40
/////////////////////////////////////////////////////////////////////////////////////////////////////

loadAPI(1);

host.defineController("Akai", "MPK49", "1.0", "B8A86DCE-F608-4A49-8CA1-789A87C2F765");
host.defineSysexIdentityReply("F0 7E 00 06 02 47 6B 00 19 00 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? F7");
host.defineMidiPorts(1, 1);

// //////////////// Bank A/B/C: channel0/1/2 (status 176/177/178)
var CC =
{
	REW : 115,
	FF : 116,
	STOP : 117,
	PLAY : 118,
	REC : 119,
	K1 : 22, // encoders
	F1 : 12, // sliders
	S1 : 32, // buttons /
	S2 : 33,
	S3 : 34,
	S4 : 35,
	S5 : 36,
	S6 : 37,
	S7 : 38,
	S8 : 39
// ////////////
};

var isShift = false;
var isPlay = false;
// //////////////////////////////////////////////////////
function init()
{
	host.getMidiInPort(0).createNoteInput("MPK49 Keyboard", "80????", "90????", "B001??", "B040??", "D0????", "E0????");
	host.getMidiInPort(0).createNoteInput("MPK49 Pads", "81????", "91????", "D1????");
	host.getMidiInPort(0).setMidiCallback(onMidi);

	// /////////////////////////////////////////////////// sections
	transport = host.createTransportSection();
	application = host.createApplicationSection();
	trackBank = host.createTrackBankSection(8, 2, 0);
	cursorTrack = host.createCursorTrackSection(2, 0);
	cursorDevice = host.createCursorDeviceSection(8);

	primaryInstrument = cursorTrack.getPrimaryInstrument();

	transport.addIsPlayingObserver(function(on)
	{
		isPlay = on;
	});

	for ( var p = 0; p < 8; p++)
	{
		var macro = primaryInstrument.getMacro(p).getAmount();
		var parameter = cursorDevice.getParameter(p);
		var track = trackBank.getTrack(p);
		macro.setIndication(true);
		parameter.setIndication(true);
		parameter.setLabel("P" + (p + 1));
		track.getVolume().setIndication(true);
		track.getPan().setIndication(true);
		track.getSend(0).setIndication(true);
		track.getSend(1).setIndication(true);
	}
}

function exit()
{
}
function onMidi(status, data1, data2)
{
	var index = data1;
	var val = data2;
	var buttonPressed = val > 0;
//	printMidi(status, index, val);

	if (index == CC.S1)
	{
		isShift = val > 0;
	}

	if (buttonPressed)
	{
		if (status == 176) // Control Bank A
		{
			switch (index)
			{
				case CC.S2:
					isShift ? cursorTrack.selectPrevious() : cursorTrack.selectNext();
					break;
				case CC.S3:
					isShift ? cursorDevice.previousParameterPage() : cursorDevice.nextParameterPage();
					break;
				case CC.S4:
					cursorDevice.switchToPreviousPreset();
					break;
				case CC.S5:
					cursorDevice.switchToNextPreset();
					break;
				case CC.S6:
					isShift ? cursorDevice.switchToPreviousPresetCategory() : cursorDevice.switchToNextPresetCategory();
					break;
				case CC.S7:
					isShift ? cursorDevice.switchToPreviousPresetCreator() : cursorDevice.switchToNextPresetCreator();
					break;
				case CC.S8:
					application.nextPerspective();// planned to switch mode / page
					break;
			}
		}
		else if (status == 177) // Control Bank B
		{
			switch (index)
			{
				case CC.S2:
					isShift ? cursorTrack.selectPrevious() : cursorTrack.selectNext();
					break;
				case CC.S3:
					isShift ? trackBank.scrollTracksPageDown() : trackBank.scrollTracksPageUp();
					break;
				case CC.S4:
					cursorDevice.switchToPreviousPreset();
					break;
				case CC.S5:
					cursorDevice.switchToNextPreset();
					break;
				case CC.S6:
					isShift ? cursorDevice.switchToPreviousPresetCategory() : cursorDevice.switchToNextPresetCategory();
					break;
				case CC.S7:
					isShift ? cursorDevice.switchToPreviousPresetCreator() : cursorDevice.switchToNextPresetCreator();
					break;
				case CC.S8:
					application.nextPerspective();// planned to switch mode / page
					break;
			}
		}
		else if (status == 178) // Control Bank C
		{
			switch (index)
			{
				case CC.S2:
					isShift ? cursorTrack.selectPrevious() : cursorTrack.selectNext();
					break;
				case CC.S3:
					isShift ? trackBank.scrollTracksPageDown() : trackBank.scrollTracksPageUp();
					break;
				case CC.S4:
					cursorDevice.switchToPreviousPreset();
					break;
				case CC.S5:
					cursorDevice.switchToNextPreset();
					break;
				case CC.S6:
					isShift ? cursorDevice.switchToPreviousPresetCategory() : cursorDevice.switchToNextPresetCategory();
					break;
				case CC.S7:
					isShift ? cursorDevice.switchToPreviousPresetCreator() : cursorDevice.switchToNextPresetCreator();
					break;
				case CC.S8:
					application.nextPerspective();// planned to switch mode / page
					break;
			}
		}
		switch (index)
		{
			case CC.PLAY:
				isShift ? transport.returnToArrangerment() : isPlay ? transport.restart() : transport.play();
				break;
			case CC.STOP:
				isShift ? transport.resetAutomationOverrides() : transport.stop();
				break;
			case CC.REC:
				isShift ? cursorTrack.getArm().toggle() : transport.record();
				break;
			case CC.REW:
				isShift ? cursorTrack.selectPrevious() : transport.rewind();
				break;
			case CC.FF:
				isShift ? cursorTrack.selectNext() : transport.fastForward();
				break;
		}
	}
	if (status == 176) // Control Bank A
	{
		if (index >= CC.K1 && index < CC.K1 + 8)
		{
			isShift ? primaryInstrument.getMacro(index - CC.K1).getAmount().reset() : primaryInstrument.getMacro(index - CC.K1).getAmount().set(val, 128);
		}
		else if (index >= CC.F1 && index < CC.F1 + 8)
		{
			isShift ? cursorDevice.getParameter(index - CC.F1).reset() : cursorDevice.getParameter(index - CC.F1).set(val, 128);
		}
	}
	else if (status == 177) // Control Bank B
	{
		if (index >= CC.K1 && index < CC.K1 + 8)
		{
			isShift ? trackBank.getTrack(index - CC.K1).getPan().reset() : trackBank.getTrack(index - CC.K1).getPan().set(val, 128);
		}
		else if (index >= CC.F1 && index < CC.F1 + 8)
		{
			isShift ? trackBank.getTrack(index - CC.F1).getVolume().reset() : trackBank.getTrack(index - CC.F1).getVolume().set(val, 128);
		}
	}
	else if (status == 178) // Control Bank C
	{
		if (index >= CC.K1 && index < CC.K1 + 8)
		{
			isShift ? trackBank.getTrack(index - CC.K1).getSend(1).reset() : trackBank.getTrack(index - CC.K1).getSend(1).set(val, 128);
		}
		else if (index >= CC.F1 && index < CC.F1 + 8)
		{
			isShift ? trackBank.getTrack(index - CC.F1).getSend(0).reset() : trackBank.getTrack(index - CC.F1).getSend(0).set(val, 128);
		}
	}
}