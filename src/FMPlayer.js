/* jshint esversion: 8 */
import React from "react";
import DSP from "./dsp";
import Plot from 'react-plotly.js';

class FMPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      f: 100, // Baseband Frequency
      fC: 1000, // Carrier Frequency
      fDev: 400, // FM Deviation
      bufferSize: 65536, // FFT
      sampleRate: 65536,
      numPoints: 1000,
      w: props.w,
      h: props.h,
    };
    this.startAudio = this.startAudio.bind(this);
    this.stopAudio = this.stopAudio.bind(this);
  }

  componentDidMount() {
    this.audioContext = new AudioContext();
  }

  componentWillUnmount() {
    this.stopAudio();
  }

  componentWillReceiveProps(props) {
    this.setState({ w: props.w, h: props.h });
  }

  getTimeDomainData() {
    let _x = new Float64Array(this.state.sampleRate).fill(0);
    let _yD = new Float64Array(this.state.sampleRate).fill(0);
    let _yC = new Float64Array(this.state.sampleRate).fill(0);
    let _y = new Float64Array(this.state.sampleRate).fill(0);

    let f = this.state.f;
    let fC = this.state.fC;
    let fDev = this.state.fDev;

    for (let i = 0; i < this.state.sampleRate; ++i) {
      _x[i] = i/this.state.sampleRate;
      _yD[i] = Math.sin(2 * Math.PI * f * _x[i]);
    }

    for (let i = 0; i < this.state.sampleRate; ++i) {
      _yC[i] = Math.sin(2 * Math.PI * fC * _x[i]);
    }

    // return np.cos( 2*np.pi * f_c * ts + (f_dev / f_m) * np.sin( 2*np.pi * f_m * ts ) ).astype(np.float32)
    // y(t) = cos( 2*pi * f_c * t + ( f_dev / f_m ) * sin( 2*pi * f_m * t ) )
    for (let i = 0; i < this.state.sampleRate; ++i) {
      _y[i] = Math.cos(2 * Math.PI * fC * _x[i] + (fDev / f) * Math.sin(2 * Math.PI * f * _x[i]));
    }

    return ({
      x: _x,
      yD: _yD,
      yC: _yC,
      y: _y,
    });
  }

  handleClick(event) {
    if (event.target.id === "incf") {
      this.setState((prevState) => { return { f: prevState.f >= 1000 ? prevState.f : prevState.f + 50 }; });
    } else if (event.target.id === "decf") {
      this.setState((prevState) => { return { f: prevState.f <= 50 ? prevState.f : prevState.f - 50 }; });
    } else if (event.target.id === "incfc") {
      this.setState((prevState) => { return { fC: prevState.fC >= 2000 ? prevState.fC : prevState.fC + 100 }; });
    } else if (event.target.id === "decfc") {
      this.setState((prevState) => { return { fC: prevState.fC <= 200 ? prevState.fC : prevState.fC - 100 }; });
    } else if (event.target.id === "incfdev") {
      this.setState((prevState) => { return { fDev: prevState.fDev >= 800 ? prevState.fDev : prevState.fDev + 25 }; });
    } else if (event.target.id === "decfdev") {
      this.setState((prevState) => { return { fDev: prevState.fDev <= 0 ? prevState.fDev : prevState.fDev - 25 }; });
    }
  }

  stopAudio() {
    if (this.audioSource) {
      this.audioSource.stop();
    }
  }

  startAudio() {
    let arr = this.getTimeDomainData().y;
    let buf = new Float32Array(arr.length);
    for (var i = 0; i < arr.length; i++) { buf[i] = arr[i]; }
    let audioBuffer = this.audioContext.createBuffer(1, buf.length, this.state.sampleRate);
    audioBuffer.copyToChannel(buf, 0);
    this.audioSource = this.audioContext.createBufferSource();
    this.audioSource.buffer = audioBuffer;
    this.audioSource.connect(this.audioContext.destination);
    this.audioSource.start(0);
  }

  playAudio() {
    this.stopAudio();
    this.startAudio();
  }

  render() {
    var timeData = this.getTimeDomainData();
    var x = timeData.x;
    var y = timeData.y;
    var yD = timeData.yD;
    var yC = timeData.yC;
    var n = this.state.numPoints;
    var fft = new DSP.FFT(this.state.bufferSize, this.state.sampleRate);
    fft.forward(timeData.y.slice(0, this.state.bufferSize));
    var fy = fft.spectrum;
    var fx = Array(fy.length).fill(0);

    for (let i = 0; i < fx.length; ++i) {
      fx[i] = this.state.sampleRate / this.state.bufferSize * i;
    }

    var fmax = 2625;

    /* Datas for plots */
    var dataWaveTimeDomainData = [{ x: x.slice(0, n-1), y: yD.slice(0, n-1) }];
    var carrierWaveTimeDomainData = [{ x: x.slice(0, n-1), y: yC.slice(0, n-1) }];
    var fmWaveTimeDomainData = [{ x: x.slice(0, n-1), y: y.slice(0, n-1) }];
    var fmWaveFreqDomainData = [{
      x: fx.slice(0, fmax/(this.state.sampleRate/this.state.bufferSize)),
      y: fy.slice(0, fmax/(this.state.sampleRate/this.state.bufferSize)),
    }];

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

    var dataWaveTimeDomainLayout = {
      width: w,
      height: h,
      title: 'Data Wave (Time Domain)',
      yaxis: {range: [-1, 1]},
      margin: 0,
      font: {size: fontSize},
    };

    var carrierWaveTimeDomainLayout = {
      width: w,
      height: h,
      title: 'Carrier Wave (Time Domain)',
      yaxis: {range: [-1, 1]},
      margin: 0,
      font: {size: fontSize},
    };

    var fmWaveTimeDomainLayout = {
      width: w,
      height: h,
      title: 'FM Wave (Time Domain)',
      yaxis: {range: [-1, 1]},
      margin: 0,
      font: {size: fontSize},
    };

    var fmWaveFreqDomainLayout = {
      width: w,
      height: h,
      title: 'FM Wave (Frequency Domain)',
      margin: 0,
      font: {size: fontSize},
    };

    console.log('window resized to: ', this.state.w, 'x', this.state.h);
    console.log('plot resized to: ', w, 'x', h);

    return (
      <div className="container" style={{margin: "auto"}}>
        <div className="row app-row">
          <div className="col-md">
            <div className="text-data">Baseband Frequency(Hz)</div>
            <div className="text-data">{this.state.f}</div>
            <button id="incf" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="decf" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
          <div className="col-md text-center">
            <div className="text-data">Carrier Frequency(Hz)</div>
            <div className="text-data">{this.state.fC}</div>
            <button id="incfc" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="decfc" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
          <div className="col-md text-center">
            <div className="text-data">FM Deviation(Hz)</div>
            <div className="text-data">{this.state.fDev}</div>
            <button id="incfdev" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="decfdev" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
        </div>
        <div className="row text-center app-row">
          <div className="col-sm text-center">
            <button className="btn btn-dark" onClick={event => this.playAudio(event)}>
              <div className="text-btn">play audio</div>
            </button>
          </div>
        </div>
        <div className="row">
          <div className="col-sm plot-col">
            <Plot data={dataWaveTimeDomainData} layout={dataWaveTimeDomainLayout} config={{ responsive: 1 }} />
          </div>
          <div className="col-sm plot-col">
            <Plot data={carrierWaveTimeDomainData} layout={carrierWaveTimeDomainLayout} config={{ responsive: 1 }} />
          </div>
        </div>
        <div className="row">
          <div className="col-sm plot-col">
            <Plot data={fmWaveTimeDomainData} layout={fmWaveTimeDomainLayout} config={{ responsive: 1 }} />
          </div>
          <div className="col-sm plot-col">
            <Plot data={fmWaveFreqDomainData} layout={fmWaveFreqDomainLayout} config={{ responsive: 1 }} />
          </div>
        </div>
      </div>
    )
  }
}

export default FMPlayer
