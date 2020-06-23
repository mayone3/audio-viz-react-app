import React from "react";
import DSP from "./dsp";
import Plot from 'react-plotly.js';
import * as filter from "./filter";

import MicrophoneAnalyzer from "./MicrophoneAnalyzer";

class Microphone extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterList: ['NONE', 'LOWPASS', 'HIGHPASS', 'BANDPASS', 'BELL'],
      filterType: 0,
      audio: null,
      audioData: new Uint8Array(0),
      muted: true,
      w: props.w,
      h: props.h,
      v: props.v,
    };
  }

  componentWillReceiveProps(props) {
    this.setState({ w: props.w, h: props.h, v: props.v });
  }

  componentWillUnmount() {
    if (this.state.audio) {
      this.stopMicrophone();
    }
  }

  async getMicrophone() {
    // console.log("getMicrophone() start");
    // console.log(navigator.mediaDevices === undefined)
    // console.log(navigator.mediaDevices)
    // const audio = await navigator.mediaDevices.getUserMedia({
    //   audio: true,
    //   video: false
    // })
    // console.log(audio)
    // this.setState({ audio: audio });
    // console.log("getMicrophone() finish");

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = function(constraints) {

        // First get ahold of the legacy getUserMedia, if present
        var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.getUserMedia;

        // Some browsers just don't implement it - return a rejected promise with an error
        // to keep a consistent interface
        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
        return new Promise(function(resolve, reject) {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }
    }

    const microphone = this

    await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    })
    .then(function(stream) {
      console.log(stream)
      microphone.setState({ audio: stream });
    })
    .catch(function(err) {
      console.log(err)
    })
  }

  stopMicrophone() {
    this.state.audio.getTracks().forEach(track => track.stop());
    this.setState({ audio: null });
  }

  toggleMicrophone() {
    if (this.state.audio) {
      this.stopMicrophone();
    } else {
      this.getMicrophone();
    }
  }

  toggleMute() {
    if (this.state.muted) {
      this.setState({ muted: false });
    } else {
      this.setState({ muted: true });
    }
  }

  render() {
    return (
      <div className="app-container">
        <div className="row text-center app-row">
          <div className="col-md text-center">
            <button id="mic-toggle-microphone" type="button" className="btn btn-dark" onClick={event => this.toggleMicrophone()}>
              <div className="text-btn">{this.state.audio ? 'Stop Microphone' : 'Start Microphone'}</div>
            </button>
          </div>
        </div>
        <div className="row text-center app-row">
          <div className="col-md text-center">
            <button id="mic-toggle-playing" type="button" className="btn btn-dark" onClick={event => this.toggleMute()}>
              <div className="text-btn">{this.state.muted ? 'Unmute Echo' : 'Mute Echo'}</div>
            </button>
          </div>
        </div>
        {this.state.audio ? <MicrophoneAnalyzer audio={this.state.audio} muted={this.state.muted} w={this.state.w} h={this.state.h} v={this.state.v} /> : <div></div>}
      </div>
    )
  }
}

export default Microphone
