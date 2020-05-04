import React from "react"
import DSP from "./dsp"
import Plot from 'react-plotly.js'
import * as filter from "./filter"

class MultiFreqPlayer extends React.Component {
  constructor() {
    super()
    this.state = {
      a: [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0],
      aList: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      f: [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25],
      bufferSize: 65536, // FFT
      sampleRate: 65536,
      numPoints: 1000,
      noiseAIdx: 1,
      noiseList: ['NONE', 'WHITE', 'PINK'],
      noiseType: 0,
      filterList: ['NONE', 'LOWPASS', 'HIGHPASS', 'BANDPASS', 'BELL'],
      filterType: 0,
      filterCutoff: 600,
      filterBandwidth: 100,
      audioContext: new AudioContext(),
      audioSource: null,
      x: new Float64Array(65536),
      y: new Float64Array(65536),
      noise: new Float64Array(65536),
    }
  }

  componentDidMount() {
    var _x = this.state.x.map((v, i) => i/this.state.sampleRate)
    var _y = new Float64Array(this.state.bufferSize).fill(0)
    var _noise = new Float64Array(this.state.bufferSize).fill(0)
    var _a = this.state.a
    for (let i = 0; i < _y.length; ++i) {
      for (let freqIndex = 0; freqIndex < this.state.f.length; ++freqIndex) {
        _y[i] += _a[freqIndex] * Math.sin(2 * Math.PI * this.state.f[freqIndex] * _x[i])
      }
    }
    var r = 0
    for (let i = 0; i < _a.length; ++i) { r += 1 * (_a[i] !== 0) }
    for (let i = 0; i < _y.length; ++i) { _y[i] /= r }
    this.setState({ x: _x, y: _y, noise:_noise })
  }

  componentDidUpdate() {
    // this.playAudio()
  }

  getTimeDomainData() {
    let _x = this.state.x
    let _y = this.state.y
    let _amp = 1 + this.state.aList[this.state.noiseAIdx]*(this.state.noiseType!==0)
    _y = _y.map((v,i)=>(v+this.state.noise[i])/_amp)
    _y = filter.IIRFilter(this.state.filterType, _y, this.state.sampleRate, this.state.filterCutoff, this.state.filterBandwidth)
    return ({ x: _x, y: _y })
  }

  updateSignal(event) {
    var _y = new Float64Array(this.state.bufferSize).fill(0)
    var _a = this.state.a
    _a[event.target.id.slice(10)] = event.target.value
    for (let i = 0; i < _y.length; ++i) {
      for (let freqIndex = 0; freqIndex < this.state.f.length; ++freqIndex) {
        _y[i] += _a[freqIndex] * Math.sin(2 * Math.PI * this.state.f[freqIndex] * this.state.x[i])
      }
    }
    var r = 0
    for (let i = 0; i < _a.length; ++i) { r += 1 * (_a[i] !== 0) }
    for (let i = 0; i < _y.length; ++i) { _y[i] /= r }
    this.setState({ a: _a, y: _y })
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
    this.updateNoise(event)
    this.updateFilter(event)
  }

  handleChange(event) {
    this.updateSignal(event)
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
    let timeData = this.getTimeDomainData()
    let fft = new DSP.FFT(this.state.bufferSize, this.state.sampleRate)
    fft.forward(timeData.y.slice(0, this.state.bufferSize))
    var fy = fft.spectrum
    var fx = Array(fy.length).fill(0)

    for (let i = 0; i < fx.length; ++i) {
      fx[i] = this.state.sampleRate / this.state.bufferSize * i
      // fy[i] = fy[i] * -1 * Math.log((fft.bufferSize/2 - i) * (0.5/fft.bufferSize/2)) * fft.bufferSize
    }

    var fmax = 725

    return (
      <div className="container">
        <div className="row" style={{marginTop: "5px", marginBottom: "20px"}}>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">C<sub>4</sub></div>
            <input id="multifreq-0" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[0]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">C#<sub>4</sub></div>
            <input id="multifreq-1" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[1]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">D<sub>4</sub></div>
            <input id="multifreq-2" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[2]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">D#<sub>4</sub></div>
            <input id="multifreq-3" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[3]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">E<sub>4</sub></div>
            <input id="multifreq-4" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[4]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">F<sub>4</sub></div>
            <input id="multifreq-5" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[5]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">F#<sub>4</sub></div>
            <input id="multifreq-6" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[6]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">G<sub>4</sub></div>
            <input id="multifreq-7" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[7]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">G#<sub>4</sub></div>
            <input id="multifreq-8" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[8]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">A<sub>4</sub></div>
            <input id="multifreq-9" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[9]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">A#<sub>4</sub></div>
            <input id="multifreq-10" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[10]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">B<sub>4</sub></div>
            <input id="multifreq-11" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[11]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm col-auto" style={{marginBottom: "20px"}}>
            <div className="text-key">C<sub>5</sub></div>
            <input id="multifreq-12" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[12]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
        </div>
        <div className="row text-center app-row">
        <div className="col-md text-center">
          <div className="text-data">Noise Amplitude<br/>{this.state.aList[this.state.noiseAIdx]}</div>
          <button id="dec-noisea" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>-</button>
          <button id="inc-noisea" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>+</button>
        </div>
        <div className="col-md text-center">
          <div className="text-data">Noise Type<br/>{this.state.noiseList[this.state.noiseType]}</div>
          <button id="prev-noise" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>←</button>
          <button id="next-noise" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>→</button>
        </div>
        <div className="col-md text-center">
          <div className="text-data">Filter Type<br/>{this.state.filterList[this.state.filterType]}</div>
          <button id="prev-filter" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>←</button>
          <button id="next-filter" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>→</button>
        </div>
        <div className="col-md text-center">
          <div className="text-data">Filter Cutoff (Hz)<br/>{this.state.filterCutoff}</div>
          <button id="dec-cutoff" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>-</button>
          <button id="inc-cutoff" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>+</button>
        </div>
        <div className="col-md text-center">
          <div className="text-data">Filter Bandwidth (Hz)<br/>{this.state.filterBandwidth}</div>
          <button id="dec-bw" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>-</button>
          <button id="inc-bw" type="button" className="btn btn-dark text-btn" onClick={event => this.handleClick(event)}>+</button>
        </div>
        </div>
        <div className="row text-center app-row">
        {
          // empty row cuz im lazy
        }
        </div>
        <div className="row text-center app-row">
        {
          // empty row cuz im lazy
        }
        </div>
        <div className="row text-center app-row">
          <div className="col-sm">
            <button className="btn btn-dark" onClick={event => this.playAudio(event)}>
              <div className="text-btn">play</div>
            </button>
          </div>
        </div>
        <div className="row text-center app-row">
          <div className="col-md text-center">
            <Plot
              data={[
                {
                  x: timeData.x.slice(0, this.state.numPoints-1),
                  y: timeData.y.slice(0, this.state.numPoints-1),
                }
              ]}
              layout={ {width: 480, height: 320, yaxis: {range: [-1, 1]}, title: 'Time Domain', margin: 0} }
            />
          </div>
          <div className="col-md text-center">
            <Plot
              data={[
                {
                  x: fx.slice(0, fmax/(this.state.sampleRate/this.state.bufferSize)),
                  y: fy.slice(0, fmax/(this.state.sampleRate/this.state.bufferSize))
                }
              ]}
              layout={ {width: 480, height: 320, title: 'Frequency Domain', margin: 0} }
            />
          </div>
        </div>
      </div>
    )
  }
}

export default MultiFreqPlayer
