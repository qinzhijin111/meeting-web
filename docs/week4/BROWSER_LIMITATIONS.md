
# Week 4 Browser and Device Limitations

## Camera Devices

The browser detected both the integrated camera and NVIDIA Broadcast virtual camera during testing.

NVIDIA Broadcast appeared in the device list but could not provide a usable video stream on the test machine.

The application displays a visible camera error when an unavailable device is selected.

## Browser Permissions

Camera and microphone behavior depends on browser permission settings.

If permission is blocked, the application displays a visible error instead of a blank page.

Users may need to update the browser site permissions before enabling the device again.

## Device Availability

Full device-switch testing depends on having multiple working microphones or cameras available on the test machine.

Virtual devices may appear in the browser device list even when their supporting application is not running or correctly configured.

## Mobile Layout

The application was tested using a narrow mobile-size browser viewport.

Native iOS and Android applications are not part of the current project scope.
