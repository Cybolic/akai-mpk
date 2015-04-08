loadAPI(1);

host.defineController("Akai", "MPK225", "1.0", "3ffb1b50-dd54-11e4-8830-0800200c9a66");
host.defineSysexIdentityReply("f0 7e ?? 06 02 47 23 00 19 00 ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? ?? F7");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Akai MPK225 MIDI 1"], ["Akai MPK225 MIDI 1"]);

var LOWEST_CC = 1;
var HIGHEST_CC = 119;

var DEVICE_START_CC = 20;
var DEVICE_END_CC = 27;

var CC =
{
	LOOP : 114,
	REW  : 115,
	FF   : 116,
	STOP : 117,
	PLAY : 118,
	REC  : 119,

	K1 : 50,
	K2 : 51,
	K3 : 52,
	K4 : 53,
	K5 : 54,
	K6 : 55,
	K7 : 56,
	K8 : 57,

	S1A : 28,
	S2A : 29,
	S3A : 30,
	S4A : 31,

	S1B : 75,
	S2B : 76,
	S3B : 77,
	S4B : 78,

	S1C : 106,
	S2C : 107,
	S3C : 108,
	S4C : 109

};

var STATUS = {
  ControllerBankA : 177,
  ControllerBankB : 178,
  ControllerBankC : 179
};

var isShift = false;
var isPlay = false;
var encoderId = 0;

function init()
{
	host.getMidiInPort(0).setMidiCallback(onMidi);
	host.getMidiInPort(0).setSysexCallback(onSysex);
	host.getMidiOutPort(0).setShouldSendMidiBeatClock(true);
    MPK225Keys = host.getMidiInPort(0).createNoteInput("Keys", "?0????");
	MPK225Pads = host.getMidiInPort(0).createNoteInput("Pads", "?9????");

	MPK225Keys.setShouldConsumeEvents(false);
	MPK225Pads.setShouldConsumeEvents(false);

	MPK225Keys.assignPolyphonicAftertouchToExpression(0, NoteExpression.TIMBRE_UP, 5);

	// Notifications:
	host.getNotificationSettings().setShouldShowSelectionNotifications(true);
	host.getNotificationSettings().setShouldShowChannelSelectionNotifications(true);
	host.getNotificationSettings().setShouldShowTrackSelectionNotifications(true);
	host.getNotificationSettings().setShouldShowDeviceSelectionNotifications(true);
	host.getNotificationSettings().setShouldShowDeviceLayerSelectionNotifications(true);
	host.getNotificationSettings().setShouldShowPresetNotifications(true);
	host.getNotificationSettings().setShouldShowMappingNotifications(true);
	host.getNotificationSettings().setShouldShowValueNotifications(true);

	// sections
	transport = host.createTransport();
	application = host.createApplication();
	cursorTrack = host.createCursorTrack(2, 0);
	cursorDevice = cursorTrack.getPrimaryDevice();

	transport.addIsPlayingObserver(function(on)
	{
		isPlay = on;
	});

	for ( var p = 0; p < 8; p++)
	{
		cursorDevice.getMacro(p).getAmount().setIndication(true);
		cursorDevice.getParameter(p).setIndication(true);
		cursorDevice.getParameter(p).setLabel("P" + (p + 1));
	}
}


function onMidi(status, data1, data2)
{
	var pressed = data2 > 64; // ignore button release
	var index;

	printMidi(status, data1, data2);

	if (isChannelController(status))
	{

		switch (status)
		{
			case STATUS.ControllerBankA:
				if (data1 >= CC.K5 && data1 < CC.K5 + 8)
				{
				 cursorDevice.getMacro(data1 - CC.K5).getAmount().inc(data2 > 64 ? data2-128 : data2, 128);
				}
				switch (data1)
				{
				case CC.K1:
					cursorTrack.getVolume().inc(data2 > 64 ? data2-128 : data2, 128);
					break;
				case CC.K2:
					cursorTrack.getPan().inc(data2 > 64 ? data2-128 : data2, 127);
					break;
				case CC.K3:
					cursorTrack.getSend(0).inc(data2 > 64 ? data2-128 : data2, 128);
					break;
				case CC.K4:
					cursorTrack.getSend(1).inc(data2 > 64 ? data2-128 : data2, 128);
					break;
				}
				break;
			case STATUS.ControllerBankB:
				if (data1 >= CC.K1 && data1 < CC.K1 + 8)
				{
				 cursorDevice.getParameter(data1 - CC.K1).inc(data2 > 64 ? data2-128 : data2, 128);
				}
				break;
			case STATUS.ControllerBankC:
				if (data1 >= CC.K1 && data1 < CC.K1 + 8)
				{
				 cursorDevice.getMacro(data1 - CC.K1).getAmount().inc(data2 > 64 ? data2-128 : data2, 128);
				}
				break;
		}

		switch (data1)
		{
		case CC.S1A:
		case CC.S1B:
		case CC.S1C:
			isShift = pressed;
			break;
		}

		if (pressed)
		{
			switch (data1)
			{
			case CC.LOOP:
				if (isShift) { transport.returnToArrangement(); } else { transport.toggleLoop(); }
				break;
			case CC.PLAY:
				if (isShift) { transport.returnToArrangement(); } else { transport.play(); }
				break;
			case CC.STOP:
				if (isShift) { transport.resetAutomationOverrides(); } else { transport.stop(); }
				break;
			case CC.REC:
				if (isShift) { cursorTrack.getArm().toggle(); } else { transport.record(); }
				break;
			case CC.REW:
				if (isShift) { cursorTrack.selectPrevious(); } else { transport.rewind(); }
				break;
			case CC.FF:
				if (isShift) { cursorTrack.selectNext(); } else { transport.fastForward(); }
				break;
			case CC.S1A:
			case CC.S1B:
			case CC.S1C:
				isShift = pressed;
				break;
			case CC.S2A:
				if (isShift) { cursorDevice.switchToPreviousPreset(); } else { cursorDevice.switchToNextPreset(); }
				break;
			case CC.S2B:
				if (isShift) { cursorDevice.previousParameterPage(); } else { cursorDevice.nextParameterPage(); }
				break;
			case CC.S3A:
				if (isShift) { cursorDevice.switchToPreviousPresetCategory(); } else { cursorDevice.switchToNextPresetCategory(); }
				break;
			case CC.S3B:
				if (isShift) { cursorDevice.selectPrevious(); } else { cursorDevice.selectNext(); }
				break;
			case CC.S4A:
				if (isShift) { cursorDevice.switchToPreviousPresetCreator(); } else { cursorDevice.switchToNextPresetCreator(); }
				break;
			case CC.S4B:
				if (isShift) { cursorTrack.getMute().toggle(); } else { cursorTrack.getSolo().toggle(); }
				break;
			}
		}
	}
}

function onSysex(data)
{
	// printSysex(data);
}

function exit()
{

}
