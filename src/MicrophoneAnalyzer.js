import React from "react";
import DSP from "./dsp";
import Plot from 'react-plotly.js';
import * as filter from "./filter";

class MicrophoneAnalyzer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timeData: new Float32Array(0),
      freqData: new Float32Array(0),
      outputConnected: false
    };
    this.tick = this.tick.bind(this);
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  componentDidMount() {
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 16384;
    this.analyser.smoothingTimeConstant = 0.25;
    // this.IIRFilter = this.audioContext.createIIRFilter(feedforward, feedback);
    this.source = this.audioContext.createMediaStreamSource(this.props.audio);
    this.source.connect(this.analyser);
    this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.freqArray = new Float32Array(this.analyser.frequencyBinCount);
    this.rafId = requestAnimationFrame(this.tick);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
    this.source.disconnect();
    this.analyser.disconnect();
  }

  tick() {
    this.rafId = requestAnimationFrame(this.tick);

    this.analyser.getFloatTimeDomainData(this.dataArray);
    this.analyser.getFloatFrequencyData(this.freqArray);
    this.setState({
      timeData: this.dataArray,
      freqData: this.freqArray
    });

    if (this.props.muted === false) {
      this.source.connect(this.audioContext.destination);
      this.setState({ outputConnected: true });
    } else if (this.state.outputConnected) {
      this.source.disconnect(this.audioContext.destination);
      this.setState({ outputConnected: false });
    }
  }

  render() {
    var _tx = this.state.timeData.map((v, i) => i / this.audioContext.sampleRate);
    var _ty = this.state.timeData;
    var _fx = this.state.freqData.map((v, i) => i / this.analyser.frequencyBinCount * this.audioContext.sampleRate / 2);
    var _fy = this.state.freqData;

    return (
      <div>
        <div className="row text-center app-row">
          <div className="col-md text-center">
            <Plot
              data={[{ x: _tx, y: _ty }]}
              layout={ {width: 480, height: 320, yaxis: {range: [-1.1, 1.1]}, title: 'Time Domain', margin: 0} }
            />
          </div>
          <div className="col-md text-center">
            <Plot
              data={[{ x: _fx, y: _fy }]}
              layout={ {width: 480, height: 320, title: 'Frequency Domain', margin: 0} }
            />
          </div>
        </div>
      </div>
    )
  }
}

export default MicrophoneAnalyzer
