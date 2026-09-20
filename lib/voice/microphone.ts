export async function prepareMicrophone(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return
  }

  let stream: MediaStream | null = null
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    })
  } catch (reason) {
    const name = reason instanceof DOMException ? reason.name : ''
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new Error('Microphone access is blocked. Allow it for Vurenn in your browser settings, then try again.')
    }
    if (name === 'NotFoundError') {
      throw new Error('No microphone was found on this device.')
    }
    throw new Error('Vurenn could not start your microphone. Check the device and try again.')
  } finally {
    stream?.getTracks().forEach((track) => track.stop())
  }
}
