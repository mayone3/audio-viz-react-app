import React from "react"
import DSP from "./dsp"
import Plot from 'react-plotly.js'
import * as filter from "./filter"

class FixedFreqPlayer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      aList: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      aIdx: 10,
      fIdx: 49,
      f: 440,
      bufferSize: 65536, // FFT
      sampleRate: 65536,
      numPoints: 1000,
      noiseAIdx: 10,
      noiseList: ['NONE', 'WHITE', 'PINK'],
      noiseType: 0,
      filterList: ['NONE', 'LOWPASS', 'HIGHPASS', 'BANDPASS', 'BELL'],
      filterType: 0,
      filterCutoff: 500,
      filterBandwidth: 100,
      audioContext: new AudioContext(),
      audioSource: null,
      x: new Float64Array(65536),
      y: new Float64Array(65536),
      noise: new Float64Array(65536),
      w: props.w,
      h: props.h,
    }
  }

  componentDidMount() {
    var _x = this.state.x.map((v, i) => i/this.state.sampleRate)
    var _y = this.state.y.map((v, i) => this.state.aList[this.state.aIdx] * Math.sin(2 * Math.PI * this.state.f * _x[i]))
    this.setState({ x: _x, y: _y })
  }

  componentWillReceiveProps(props) {
    this.setState({ w: props.w, h: props.h });
  }

  getTimeDomainData() {
    let _x = this.state.x
    let _y = this.state.y
    let _amp = Math.max((this.state.aList[this.state.aIdx]+this.state.aList[this.state.noiseAIdx]*(this.state.noiseType!==0)),1)
    _y = _y.map((v,i)=>(v+this.state.noise[i])/_amp)
    _y = filter.IIRFilter(this.state.filterType, _y, this.state.sampleRate, this.state.filterCutoff, this.state.filterBandwidth)
    return ({ x: _x, y: _y })
  }

  updateSignal(event) {
    var _aIdx = this.state.aIdx
    var _fIdx = this.state.fIdx
    var _f = this.state.f

    if (event.target.id === "inc-a") {
      _aIdx = _aIdx >= this.state.aList.length - 1 ? _aIdx : _aIdx + 1
    } else if (event.target.id === "dec-a") {
      _aIdx = _aIdx <= 0 ? _aIdx : _aIdx - 1
    } else if (event.target.id === "inc-f") {
      _fIdx = _fIdx >= 88 ? _fIdx : _fIdx + 1
      _f = Math.pow(2, (_fIdx-49)/12) * 440
    } else if (event.target.id === "dec-f") {
      _fIdx = _fIdx <= 1 ? _fIdx : _fIdx - 1
      _f = Math.pow(2, (_fIdx-49)/12) * 440
    }

    let _y = new Float64Array(this.state.bufferSize)
    _y = _y.map((v, i) => this.state.aList[_aIdx] * Math.sin(2 * Math.PI * _f * this.state.x[i]))
    this.setState({ aIdx:_aIdx, fIdx:_fIdx, f:_f, y: _y })
  }

  updateNoise(event) {
    var _noiseAIdx = this.state.noiseAIdx
    var _noiseType = this.state.noiseType
    var _noise = this.state.noise

    if (event.target.id === "inc-noisea") {
      _noiseAIdx = _noiseAIdx >= this.state.aList.length - 1 ? _noiseAIdx : _noiseAIdx + 1
    } else if (event.target.id === "dec-noisea") {
      _noiseAIdx = _noiseAIdx <= 1 ? _noiseAIdx : _noiseAIdx - 1
    } else if (event.target.id === "next-noise") {
      _noiseType = (_noiseType + 1) % (this.state.noiseList.length)
      if (_noiseType === 0) {
        _noise = _noise.map(x => 0)
      } else if (_noiseType === 1) {
        _noise = _noise.map(x => (Math.random() - 0.5) * 2)
      } else if (_noiseType === 2) {
        _noise = _noise.map(x => (Math.random() - 0.5) * 2)
        let _noise1 = filter.IIRFilter(1, _noise, this.state.sampleRate, 39, 0)
        let _noise2 = filter.IIRFilter(1, _noise, this.state.sampleRate, 399, 0)
        let _noise3 = filter.IIRFilter(1, _noise, this.state.sampleRate, 3990, 0)
        _noise = _noise.map((v, i) => _noise1[i]+0.7*_noise2[i]+0.4*_noise3[i])
        let r = Math.max(..._noise)
        _noise = _noise.map(x => x/r)
      }
    } else if (event.target.id === "prev-noise") {
      _noiseType = (_noiseType > 0) ? (_noiseType - 1) : (this.state.noiseList.length - 1)
      if (_noiseType === 0) {
        _noise = _noise.map(x => 0)
      } else if (_noiseType === 1) {
        _noise = _noise.map(x => (Math.random() - 0.5) * 2)
      } else if (_noiseType === 2) {
        _noise = _noise.map(x => (Math.random() - 0.5) * 2)
        let _noise1 = filter.IIRFilter(1, _noise, this.state.sampleRate, 39, 0)
        let _noise2 = filter.IIRFilter(1, _noise, this.state.sampleRate, 399, 0)
        let _noise3 = filter.IIRFilter(1, _noise, this.state.sampleRate, 3990, 0)
        _noise = _noise.map((v, i) => _noise1[i]+0.7*_noise2[i]+0.4*_noise3[i])
        let r = Math.max(..._noise)
        _noise = _noise.map(x => x/r)
      }
    }

    if (_noiseType !== 0) {
      let r = Math.max(..._noise)
      _noise = _noise.map(x => x/r*this.state.aList[_noiseAIdx])
    }

    this.setState({ noiseAIdx: _noiseAIdx, noiseType: _noiseType, noise:_noise })
  }

  updateFilter(event) {
    var _filterType = this.state.filterType
    var _filterCutoff = this.state.filterCutoff
    var _filterBandwidth = this.state.filterBandwidth

    if (event.target.id === "next-filter") {
    _filterType = (_filterType + 1) % (this.state.filterList.length)
    } else if (event.target.id === "prev-filter") {
    _filterType = (_filterType > 0) ? (_filterType - 1) : (this.state.filterList.length - 1)
    } else if (event.target.id === "inc-cutoff") {
      if (_filterCutoff === 1) { _filterCutoff = 50 } else { _filterCutoff = _filterCutoff >= 2000 ? _filterCutoff : _filterCutoff + 50 }
    } else if (event.target.id === "dec-cutoff") {
      _filterCutoff = _filterCutoff <= 100 ? 100 : _filterCutoff - 50
    } else if (event.target.id === "inc-bw") {
      if (_filterBandwidth === 1) { _filterBandwidth = 50 } else { _filterBandwidth = _filterBandwidth >= 1000 ? _filterBandwidth : _filterBandwidth + 50 }
    } else if (event.target.id === "dec-bw") {
      _filterBandwidth = _filterBandwidth <= 50 ? 50 : _filterBandwidth - 50
    }

    this.setState({ filterType: _filterType, filterCutoff: _filterCutoff, filterBandwidth: _filterBandwidth})
  }

  handleClick(event) {
    this.updateSignal(event)
    this.updateNoise(event)
    this.updateFilter(event)
  }

  stopAudio() {
    if (this.state.audioSource !== null) {
      this.state.audioSource.stop()
    }
  }

  startAudio() {
    let arr = this.getTimeDomainData().y
    let buf = new Float32Array(arr.length)
    for (var i = 0; i < arr.length; i++) buf[i] = arr[i]
    let audioBuffer = this.state.audioContext.createBuffer(1, buf.length, this.state.sampleRate)
    audioBuffer.copyToChannel(buf, 0)
    let audioSource = this.state.audioContext.createBufferSource()
    audioSource.buffer = audioBuffer
    audioSource.connect(this.state.audioContext.destination)
    audioSource.start(0)
    this.state.audioSource = audioSource
  }

  playAudio() {
    this.stopAudio();
    this.startAudio();
  }

  render() {
    var timeData = this.getTimeDomainData()
    var x = timeData.x;
    var y = timeData.y;
    var n = this.state.numPoints;

    var fft = new DSP.FFT(this.state.bufferSize, this.state.sampleRate)
    fft.forward(timeData.y.slice(0, this.state.bufferSize))
    var fy = fft.spectrum
    var fx = Array(fy.length).fill(0)

    for (let i = 0; i < fx.length; ++i) {
      fx[i] = this.state.sampleRate / this.state.bufferSize * i
      // fy[i] = fy[i] * -1 * Math.log((fft.bufferSize/2 - i) * (0.5/fft.bufferSize/2)) * fft.bufferSize
      // fy[i] = Math.log(fy[i])
    }

    var fmax = Math.max(2125, this.state.f + 525)

    var timeDomainData = [{ x: x.slice(0, n-1), y: y.slice(0, n-1) }];
    var freqDomainData = [{
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

    console.log('window resized to: ', this.state.w, 'x', this.state.h);
    console.log('plot resized to: ', w, 'x', h);

    return (
      <div className="container">
        <div className="row app-row">
          <div className="col-sm">
            <div className="row justify-content-center">
              <div className="col-sm-6 col">
                <div className="text-data">Amplitude<br/>{this.state.aList[this.state.aIdx]}</div>
                <button id="dec-a" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="inc-a" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>
              <div className="col-sm-6 col">
                <div className="text-data">Frequency(Hz)<br/>{this.state.f.toFixed(2)}</div>
                <button id="dec-f" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="inc-f" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>
            </div>
          </div>
          <div className="col-sm">
            <div className="row justify-content-center">
              <div className="col-sm-6 col">
                <div className="text-data">Noise Amplitude<br/>{this.state.aList[this.state.noiseAIdx]}</div>
                <button id="dec-noisea" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="inc-noisea" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>
              <div className="col-sm-6 col">
                <div className="text-data">Noise Type<br/>{this.state.noiseList[this.state.noiseType]}</div>
                <button id="prev-noise" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">←</div>
                </button>
                <button id="next-noise" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">→</div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="row app-row">
          <div className="col-sm">
            <div className="row justify-content-center">

              <div className="col-sm-4 col">
                <div className="text-data">Filter Type<br/>{this.state.filterList[this.state.filterType]}</div>
                <button id="prev-filter" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">←</div>
                </button>
                <button id="next-filter" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">→</div>
                </button>
              </div>

              <div className="col-sm-4 col">
                <div className="text-data">Filter Cutoff (Hz)<br/>{this.state.filterCutoff}</div>
                <button id="dec-cutoff" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="inc-cutoff" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>

              <div className="col-sm-4 col">
                <div className="text-data">Filter Bandwidth (Hz)<br/>{this.state.filterBandwidth}</div>
                <button id="dec-bw" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">-</div>
                </button>
                <button id="inc-bw" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>
                  <div className="text-btn">+</div>
                </button>
              </div>

            </div>
          </div>
        </div>

        <div className="row app-row justify-content-center">
          <div className="col-sm col-auto">
            <button className="btn btn-dark" onClick={event => this.playAudio(event)}>
              <div className="text-btn">play</div>
            </button>
          </div>
        </div>

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

export default FixedFreqPlayer
