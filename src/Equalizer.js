/* jshint esversion: 8 */
import React from "react"
import DSP from "./dsp"
import Plot from 'react-plotly.js'
import * as filter from "./filter"

class Equalizer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      minBoost: -10.0,
      maxBoost: 10.0,
      numNodes: 10,
      freqs: [32, 64, 125, 256, 512, 1024, 2048, 4096, 8192, 16384],
      gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      playing: false,
      timeData: new Float32Array(0),
      timeData2: new Float32Array(0),
      freqData: new Float32Array(0),
      freqData2: new Float32Array(0),
      w: props.w,
      h: props.h,
      v: props.v,
    }
    this.onFileChange = this.onFileChange.bind(this);
    this.onGainChange = this.onGainChange.bind(this);
    this.resetGains = this.resetGains.bind(this);
    this.loadOriginalSource = this.loadOriginalSource.bind(this);
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
    this.createAudioFile();

    this.rafId = requestAnimationFrame(this.tick);
  }

  createAudioFile() {
    this.audioURL = require('./marching_illini_11s.wav')
    this.audio = new Audio(this.audioURL);
    console.log(this.audio);
    this.audio.addEventListener('canplaythrough', this.loadOriginalSource, true);

    var request = new XMLHttpRequest();
    request.open('GET', this.audioURL, true);
    request.responseType = 'blob';
    var that = this;
    request.onload = function() {
      that.audioFile = new File([request.response], "marching_illini.wav")
      that.setState({ originalSourceReady: true })
    }
    request.send()

    this.audio.muted = true;
  }

  componentWillReceiveProps(props) {
    this.setState({ w: props.w, h: props.h, v: props.v });
    console.log(props.v)

    if (this.gainNode) {
      this.gainNode.gain.value = props.v / 100;
    }

    if (this.eqNodes[0]) {
      console.log(this.eqNodes)
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
  }

  onFileChange(event) {
    if (event.target.files[0]) {
      if (this.state.playing) {
        this.stopPlaying();
      }

      if (this.audio) {
        this.audio.removeEventListener('canplaythrough', this.loadOriginalSource, true);
        this.audio = null;
      }

      this.setState({ originalSourceReady: false });

      this.audioFile = event.target.files[0];

      this.audioURL = URL.createObjectURL(this.audioFile);
      this.audio = new Audio(this.audioURL);
      this.audio.muted = true;
      this.audio.addEventListener('canplaythrough', this.loadOriginalSource, true);
      this.audio.load()
    }
  }

  loadOriginalSource() {
    console.log("canplaythrough")
    console.log(this)
    this.audioStream = this.audio.captureStream();
    this.source = this.audioContext.createMediaStreamSource(this.audioStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.1;

    this.analyserOriginal = this.audioContext.createAnalyser();
    this.analyserOriginal.smoothingTimeConstant = 0.1;

    this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.dataArray2 = new Float32Array(this.analyser.frequencyBinCount);
    this.freqArray = new Float32Array(this.analyser.frequencyBinCount);
    this.freqArray2 = new Float32Array(this.analyser.frequencyBinCount);

    this.eqNodes = []
    this.eqParams = []

    var headNode = this.source;
    headNode.connect(this.analyserOriginal)

    for (let i = 0; i < this.state.numNodes; ++i) {
      var eqNode = this.audioContext.createBiquadFilter();

      eqNode.type = "peaking"
      eqNode.frequency.value = this.state.freqs[i]
      eqNode.gain.value = this.state.gains[i]

      headNode.connect(eqNode)
      headNode = eqNode
      this.eqNodes.push(eqNode)
    }

    headNode.connect(this.analyser)

    this.gainNode = this.audioContext.createGain();
    headNode.connect(this.gainNode)
    this.gainNode.gain.value = this.state.v / 100;
    this.gainNode.connect(this.audioContext.destination);


    this.setState({ originalSourceReady: true });
  }

  tick() {
    this.rafId = requestAnimationFrame(this.tick);
    // if the audio is playing, get data from audio
    if (this.state.playing) {
      this.analyser.getFloatTimeDomainData(this.dataArray);
      this.analyserOriginal.getFloatTimeDomainData(this.dataArray2);
      this.analyser.getFloatFrequencyData(this.freqArray);
      this.analyserOriginal.getFloatFrequencyData(this.freqArray2);
      this.setState({
        timeData: this.dataArray,
        timeData2: this.dataArray2,
        freqData: this.freqArray,
        freqData2: this.freqArray2,
      });
      // reset the audio if finished
      if (this.audio.currentTime === this.audio.duration) {
        this.stopPlaying();
      }
    }
  }

  startPlaying() {
    if (!this.audio) {
      alert("Please upload an audio file!");
      return;
    } else if (!this.state.originalSourceReady) {
      alert("Please wait for audio ready");
    }

    this.audio.play();
    this.setState({ playing: true })
  }

  stopPlaying() {
    this.audio.pause();
    this.audio.currentTime = 0.0;
    this.setState({ playing: false });
  }

  togglePlaying() {
    if (this.state.playing) {
      this.stopPlaying();
    } else {
      this.startPlaying();
    }
  }

  onGainChange(event) {
    let i = event.target.id.split("-")[1]
    // console.log(event.target.value)
    let newGains = this.state.gains
    newGains[i] = event.target.value
    this.setState({ gains: newGains })

    if (this.eqNodes) {
      this.eqNodes[i].gain.value = event.target.value
      // console.log(this.eqNodes[i])
    }
  }

  resetGains() {
    let newGains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    this.setState({ gains: newGains })
    if (this.eqNodes) {
      for (let i = 0; i < 10; ++i) {
        this.eqNodes[i].gain.value = 0
      }
      // console.log(this.eqNodes[i])
    }
  }

  render() {

    var _tx = this.state.timeData.map((v, i) => i / this.audioContext.sampleRate);
    var _ty = this.state.timeData;
    var _tx2 = this.state.timeData2.map((v, i) => i / this.audioContext.sampleRate);
    var _ty2 = this.state.timeData2;
    var _fx = this.state.freqData.map((v, i) => i / this.analyser.frequencyBinCount * this.audioContext.sampleRate / 2);
    var _fy = this.state.freqData;
    var _fx2 = this.state.freqData2.map((v, i) => i / this.analyser.frequencyBinCount * this.audioContext.sampleRate / 2);
    var _fy2 = this.state.freqData2;

    var timeDomainData = [
      {
        x: _tx,
        y: _ty,
        name: 'Equalized',
        line: {
          color: 'rgb(255, 0, 0)',
          width: 1
        }
      },
      {
        x: _tx2,
        y: _ty2,
        name: 'Original',
        line: {
          color: 'rgb(127, 127, 127)',
          width: 1
        }
      }
    ];
    var freqDomainData = [
      {
        x: _fx,
        y: _fy,
        name: 'Equalized',
        line: {
          color: 'rgb(255, 0, 0)',
          width: 1
        }
      },
      {
        x: _fx2,
        y: _fy2,
        name: 'Original',
        line: {
          color: 'rgb(127, 127, 127)',
          width: 1
        }
      }
    ];

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
      xaxis: {
        type: 'log',
        autorange: true,
      },
    };

    return (
      <div className="container">

        <div className="row justify-content-center app-row">
          <div className="col-xs text-center">
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text text-data">Upload</span>
              </div>
              <div className="custom-file">
                <label id="input-file-label" className="custom-file-label text-data" style={{width: "auto"}}>
                  {this.audioFile ? this.audioFile.name : "Choose File"}
                </label>
                <input
                  className="custom-file-input"
                  type="file"
                  accept="audio/wav"
                  style={{width: "auto"}}
                  onChange={event => this.onFileChange(event)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row no-gutters" style={{maxWidth: "800px", margin: "auto", paddingTop:"30px", paddingBottom: "30px"}}>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[0]}</div>
            <input id="band-0" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[0]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">32</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[1]}</div>
            <input id="band-1" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[1]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">64</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[2]}</div>
            <input id="band-2" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[2]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">128</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[3]}</div>
            <input id="band-3" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[3]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">256</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[4]}</div>
            <input id="band-4" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[4]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">512</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[5]}</div>
            <input id="band-5" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[5]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">1k</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[6]}</div>
            <input id="band-6" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[6]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">2k</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[7]}</div>
            <input id="band-7" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[7]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">4k</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[8]}</div>
            <input id="band-8" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[8]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">8k</div>
          </div>
          <div className="col-sm">
            <div className="text-key-eq">{this.state.gains[9]}</div>
            <input id="band-9" className="custom-range no-border vslider2" type="range" onChange={event => this.onGainChange(event)} value={this.state.gains[9]} min={this.state.minBoost} max={this.state.maxBoost} step="0.1" orientation="vertical" />
            <div className="text-key-eq">16k</div>
          </div>
        </div>

        <div className="row app-row">
          <div className="col-sm col-auto">
            <button type="button" className="btn btn-dark" onClick={event => this.togglePlaying()}>
              <div className="text-btn">{this.state.playing ? 'Stop Playing' : 'Start Playing'}</div>
            </button>
          </div>
        </div>

        <div className="row app-row">
          <div className="col-sm col-auto">
            <button type="button" className="btn btn-dark" onClick={event => this.resetGains()}>
              <div className="text-btn">Reset</div>
            </button>
          </div>
        </div>

        {
          this.state.playing ?
          <div className="row">
            <div className="col-sm plot-col">
              <Plot data={timeDomainData} layout={timeDomainLayout} config={{ responsive: 1 }} />
            </div>
            <div className="col-sm plot-col">
              <Plot data={freqDomainData} layout={freqDomainLayout} config={{ responsive: 1 }} />
            </div>
          </div> :
          <div className="row">
            <div className="col-sm plot-col">
              <Plot data={timeDomainData} layout={timeDomainLayout} config={{ responsive: 1 }} />
            </div>
            <div className="col-sm plot-col">
              <Plot data={freqDomainData} layout={freqDomainLayout} config={{ responsive: 1 }} />
            </div>
          </div>
        }


      </div>
    )
  }
}

export default Equalizer
