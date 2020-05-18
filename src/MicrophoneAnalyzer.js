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

  componentWillReceiveProps(props) {
    this.setState({ w: props.w, h: props.h });
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
