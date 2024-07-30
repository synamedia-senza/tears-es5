const ENCRYPTED_TEST_VIDEO = "https://storage.googleapis.com/wvmedia/cenc/h264/tears/tears.mpd";
const WIDEVINE = "https://proxy.uat.widevine.com/proxy";

window.addEventListener("load", function() {
  senza.init().then(function() {
    senza.uiReady();
  });
});

document.addEventListener("keydown", function(event) {
  senza.lifecycle.getState().then(function(currentState) {
    if (currentState === "background" || currentState === "inTransitionToBackground") {
      senza.lifecycle.moveToForeground();
    } else {
      senza.remotePlayer.load(ENCRYPTED_TEST_VIDEO).then(function() {
        senza.remotePlayer.play();
      });
    }
  });
}, false);

hs.remotePlayer.addEventListener("license-request", function(event) {
  console.log("Got license-request event");
  const requestBuffer = event?.detail?.licenseRequest;
  const requestBufferStr = String.fromCharCode.apply(null, new Uint8Array(requestBuffer));
  console.log("License request in base64:", requestBufferStr);

  const decodedLicenseRequest = window.atob(requestBufferStr); // from base 64
  const licenseRequestBytes = Uint8Array.from(decodedLicenseRequest, function(l) {
    return l.charCodeAt(0);
  });

  getLicenseFromServer(licenseRequestBytes.buffer, function(res) {
    console.log("Writing response to platform ", res.code, res.responseBody);
    event.writeLicenseResponse(res.code, res.responseBody);
  });
});

function getLicenseFromServer(licenseRequest, callback) {
  console.log("Requesting license From Widevine server");
  var xhr = new XMLHttpRequest();
  xhr.open("POST", WIDEVINE, true);
  xhr.setRequestHeader("Content-Type", "application/octet-stream");
  xhr.responseType = "arraybuffer";
  xhr.onload = function() {
    callback({code: xhr.status, responseBody: xhr.response});
  };
  xhr.send(licenseRequest);
}
