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
      muted: true
    };
  }

  async getMicrophone() {
    const audio = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    this.setState({ audio: audio });
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
            <button id="mic-toggle-microphone" type="button" className="btn btn-dark text-btn" onClick={event => this.toggleMicrophone()}>
              {this.state.audio ? 'Stop Microphone' : 'Start Microphone'}
            </button>
          </div>
        </div>
        <div className="row text-center app-row">
          <div className="col-md text-center">
            <button id="mic-toggle-playing" type="button" className="btn btn-dark text-btn" onClick={event => this.toggleMute()}>
              {this.state.muted ? 'Unmute' : 'Mute'}
            </button>
          </div>
        </div>
        {this.state.audio ? <MicrophoneAnalyzer audio={this.state.audio} muted={this.state.muted} /> : <div></div>}
      </div>
    )
  }
}

export default Microphone
