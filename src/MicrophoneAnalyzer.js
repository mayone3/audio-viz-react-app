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
      outputConnected: false,
      w: props.w,
      h: props.h,
      v: props.v,
    };
    this.tick = this.tick.bind(this);
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 8192;
    this.analyser.smoothingTimeConstant = 0.25;
    this.source = this.audioContext.createMediaStreamSource(this.props.audio);
    this.source.connect(this.analyser);
    this.gainNode = this.audioContext.createGain();
    this.source.connect(this.gainNode);
    this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.dataArrayUint8 = new Uint8Array(this.analyser.frequencyBinCount);
    this.freqArray = new Float32Array(this.analyser.frequencyBinCount);
    this.rafId = requestAnimationFrame(this.tick);
  }

  componentDidMount() {
    // this.analyser = this.audioContext.createAnalyser();
    // // this.analyser.fftSize = 2048;
    // this.analyser.smoothingTimeConstant = 0.25;
    // this.source = this.audioContext.createMediaStreamSource(this.props.audio);
    // this.source.connect(this.analyser);
    // this.gainNode = this.audioContext.createGain();
    // this.source.connect(this.gainNode);
    // this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
    // this.freqArray = new Float32Array(this.analyser.frequencyBinCount);
    // this.rafId = requestAnimationFrame(this.tick);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
    this.source.disconnect();
    this.analyser.disconnect();
  }

  componentWillReceiveProps(props) {
    this.setState({ w: props.w, h: props.h, v: props.v });
  }

  tick() {
    this.rafId = requestAnimationFrame(this.tick);

    // this.analyser.getFloatTimeDomainData(this.dataArray);
    this.analyser.getByteTimeDomainData(this.dataArrayUint8);
    this.analyser.getFloatFrequencyData(this.freqArray);

    for (var i = 0, imax = this.dataArray.length; i < imax; i++) {
      this.dataArray[i] = (this.dataArrayUint8[i] - 128) * 0.0078125;
    }

    this.setState({
      timeData: this.dataArray,
      freqData: this.freqArray
    });

    if (this.props.muted === false) {
      this.gainNode.gain.value = this.state.v / 100;
      this.gainNode.connect(this.audioContext.destination);
      this.setState({ outputConnected: true });
    } else if (this.state.outputConnected) {
      this.gainNode.gain.value = this.state.v / 100;
      this.gainNode.disconnect(this.audioContext.destination);
      this.setState({ outputConnected: false });
    }
  }

  render() {
    var _tx = this.state.timeData.map((v, i) => i / this.audioContext.sampleRate);
    var _ty = this.state.timeData;
    var _fx = this.state.freqData.map((v, i) => i / this.analyser.frequencyBinCount * this.audioContext.sampleRate / 2);
    var _fy = this.state.freqData;

    var timeDomainData = [{ x: _tx, y: _ty }];
    var freqDomainData = [{ x: _fx, y: _fy }];

    /* Layouts for plots */
    var w, h, fontSize;

    if (this.state.w >= 1200) {
      w = 570;
      fontSize = 10;
    } else if (this.state.w >= 992) {
      w = 480;
      fontSize = 9;
    } else if (this.state.w >= 768) {
      w = 360;
      fontSize = 8;
    } else if (this.state.w >= 576) {
      w = 540;
      fontSize = 10;
    } else {
      w = this.state.w - 20;
      fontSize = Math.min(10, this.state.w / 40);
    }

    h = w * 3 / 8 + 120;

    var timeDomainLayout = {
      width: w,
      height: h,
      title: 'Time Domain',
      yaxis: {range: [-1, 1]},
      margin: 0,
      font: {size: fontSize},
    };

    var freqDomainLayout = {
      width: w,
      height: h,
      title: 'Frequency Domain',
      margin: 0,
      font: {size: fontSize},
    };

    return (
      <div>
        <div className="row">
          <div className="col-sm plot-col">
            <Plot data={timeDomainData} layout={timeDomainLayout} config={{ responsive: 1 }} />
          </div>
          <div className="col-sm plot-col">
            <Plot data={freqDomainData} layout={freqDomainLayout} config={{ responsive: 1 }} />
          </div>
        </div>
      </div>
    )
  }
}

export default MicrophoneAnalyzer
