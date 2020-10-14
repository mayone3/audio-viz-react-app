/* jshint esversion: 8 */
import React from "react";
import DSP from "./dsp";
import Plot from 'react-plotly.js';

class AMPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aList: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      aIdx: 10,
      fArr: [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25],
      f: 100,
      aCIdx: 10,
      fC: 1000,
      bufferSize: 65536, // FFT
      sampleRate: 65536,
      numPoints: 1000,
      w: props.w,
      h: props.h,
      v: props.v,
    };
    this.startAudio = this.startAudio.bind(this);
    this.stopAudio = this.stopAudio.bind(this);
  }

  componentDidMount() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  componentWillUnmount() {
    this.stopAudio();
  }

  componentWillReceiveProps(props) {
    this.setState({ w: props.w, h: props.h, v: props.v });
  }

  getTimeDomainData() {
    let _x = new Float64Array(this.state.bufferSize).fill(0);
    let _yD = new Float64Array(this.state.bufferSize).fill(0);
    let _yC = new Float64Array(this.state.bufferSize).fill(0);
    let _y = new Float64Array(this.state.bufferSize).fill(0);

    let a = this.state.aList[this.state.aIdx];
    let f = this.state.f;
    let aC = this.state.aList[this.state.aCIdx];
    let fC = this.state.fC;

    for (let i = 0; i < this.state.bufferSize; ++i) {
      _x[i] = i/this.state.sampleRate;
      _yD[i] = a * Math.sin(2 * Math.PI * f * _x[i]);
    }

    for (let i = 0; i < this.state.bufferSize; ++i) {
      _yC[i] = aC * Math.sin(2 * Math.PI * fC * _x[i]);
    }

    if (aC !== 0) {
      for (let i = 0; i < this.state.bufferSize; ++i) {
        _y[i] = (1 + _yD[i]/aC) * _yC[i] / 2;
      }
    } else {
      _y = _yC;
    }

    return ({
      x: _x,
      yD: _yD,
      yC: _yC,
      y: _y,
    });
  }

  handleClick(event) {
    if (event.target.id === "inca") {
      this.setState((prevState) => { return { aIdx: prevState.aIdx >= prevState.aList.length - 1 ? prevState.aIdx : prevState.aIdx + 1 }; });
    } else if (event.target.id === "deca") {
      this.setState((prevState) => { return { aIdx: prevState.aIdx <= 0 ? prevState.aIdx : prevState.aIdx - 1 }; });
    } else if (event.target.id === "incf") {
      this.setState((prevState) => { return { f: prevState.f >= 800 ? prevState.f : prevState.f + 50 }; });
    } else if (event.target.id === "decf") {
      this.setState((prevState) => { return { f: prevState.f <= 50 ? prevState.f : prevState.f - 50 }; });
    } else if (event.target.id === "incac"){
      this.setState((prevState) => { return { aCIdx: prevState.aCIdx >= prevState.aList.length - 1 ? prevState.aCIdx : prevState.aCIdx + 1 }; });
    } else if (event.target.id === "decac") {
      this.setState((prevState) => { return { aCIdx: prevState.aCIdx <= 1 ? prevState.aCIdx : prevState.aCIdx - 1 }; });
    } else if (event.target.id === "incfc") {
      this.setState((prevState) => { return { fC: prevState.fC >= 2000 ? prevState.fC : prevState.fC + 100 }; });
    } else if (event.target.id === "decfc") {
      this.setState((prevState) => { return { fC: prevState.fC <= 400 ? prevState.fC : prevState.fC - 100 }; });
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
    audioBuffer.getChannelData(0).set(buf);
    this.audioSource = this.audioContext.createBufferSource();
    this.audioSource.buffer = audioBuffer;
    let gainNode = this.audioContext.createGain();
    gainNode.gain.value = this.state.v / 100;
    this.audioSource.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    this.audioSource.start(0);
  }

  playAudio() {
    this.stopAudio();
    this.startAudio();
  }

  resetDefault() {
    this.setState({
      aIdx: 10,
      aCIdx: 10,
      f: 100,
      fC: 1000,
    })
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
    var amWaveTimeDomainData = [{ x: x.slice(0, n-1), y: y.slice(0, n-1) }];
    var amWaveFreqDomainData = [{
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

    var amWaveTimeDomainLayout = {
      width: w,
      height: h,
      title: 'AM Wave (Time Domain)',
      yaxis: {range: [-1, 1]},
      margin: 0,
      font: {size: fontSize},
    };

    var amWaveFreqDomainLayout = {
      width: w,
      height: h,
      title: 'AM Wave (Frequency Domain)',
      margin: 0,
      font: {size: fontSize},
    };

    console.log('window resized to: ', this.state.w, 'x', this.state.h);
    console.log('plot resized to: ', w, 'x', h);

    return (
      <div className="container" style={{margin: "auto"}}>
        <div className="row app-row">
          <div className="col-sm">
            <div className="row justify-content-center">
              <div className="col-sm col-auto">
                <div className="text-data">Data<br/>Amplitude<br/>{this.state.aList[this.state.aIdx]}</div>
                <button id="deca" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="inca" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>
              <div className="col-sm col-auto">
                <div className="text-data">Data<br/>Frequency(Hz)<br/>{this.state.f}</div>
                <button id="decf" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="incf" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>
            </div>
          </div>
          <div className="col-sm">
            <div className="row justify-content-center">
              <div className="col-sm col-auto">
                <div className="text-data">Carrier<br/>Amplitude<br/>{this.state.aList[this.state.aCIdx]}</div>
                <button id="decac" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="incac" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>
              <div className="col-sm col-auto">
                <div className="text-data">Carrier<br/>Frequency(Hz)<br/>{this.state.fC}</div>
                <button id="decfc" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="incfc" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="row app-row">
          <div className="col-sm">
            <button className="btn btn-dark" onClick={event => this.playAudio(event)}>
              <div className="text-btn">play audio</div>
            </button>
          </div>
        </div>
        <div className="row app-row">
          <div className="col-sm">
            <button className="btn btn-dark" onClick={event => this.resetDefault(event)}>
              <div className="text-btn">reset</div>
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
            <Plot data={amWaveTimeDomainData} layout={amWaveTimeDomainLayout} config={{ responsive: 1 }} />
          </div>
          <div className="col-sm plot-col">
            <Plot data={amWaveFreqDomainData} layout={amWaveFreqDomainLayout} config={{ responsive: 1 }} />
          </div>
        </div>
      </div>
    )
  }
}

export default AMPlayer
