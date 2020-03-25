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
      noiseType: 1,
      filterList: ['NONE', 'LOWPASS', 'HIGHPASS', 'BANDPASS', 'BELL'],
      filterType: 0,
      filterCutoff: 600,
      filterBandwidth: 100,
      audioContext: null,
      audioSource: null,
    }
  }

  componentDidMount() {
    this.setState({
      audioContext: new AudioContext()
    })
  }

  componentDidUpdate() {
    this.playAudio()
  }

  getTimeDomainData() {
    let _x = new Float64Array(this.state.sampleRate).fill(0)
    let _y = new Float64Array(this.state.sampleRate).fill(0)

    for (let i = 0; i < this.state.sampleRate; ++i) {
      _x[i] = i/this.state.sampleRate
      for (let freqIndex = 0; freqIndex < this.state.f.length; ++freqIndex) {
        _y[i] += this.state.a[freqIndex] * Math.sin(2 * Math.PI * this.state.f[freqIndex] * _x[i])
      }
    }

    // let r = Math.max(Math.abs(Math.max(..._y)), Math.abs(Math.min(..._y)))
    let r = 0
    for (let i = 0; i < this.state.a.length; ++i) {
      if (this.state.a[i] !== 0) {
        r += 1
      }
    }

    for (let i = 0; i < _y.length; ++i) {
      _y[i] /= r
    }

    _y = this.addNoise(_y)
    _y = this.addFilter(_y)

    return ({
      x: _x,
      y: _y
    })
  }

  addNoise(signal) {
    if (this.state.noiseType !== 0) {
      let noise = new Float64Array(signal.length).fill(0)
      noise = noise.map(x => (Math.random() - 0.5) * 2 * this.state.aList[this.state.noiseAIdx])
      if (this.state.noiseType === 2) {
        let noise1 = filter.IIRFilter(1, noise, this.state.sampleRate, 39, 0)
        let noise2 = filter.IIRFilter(1, noise, this.state.sampleRate, 399, 0).map(x => 0.7*x)
        let noise3 = filter.IIRFilter(1, noise, this.state.sampleRate, 3990, 0).map(x => 0.4*x)

        for (let i = 0; i < signal.length; ++i) {
          noise[i] = noise1[i] + noise2[i] + noise3[i]
        }
      }

      for (let i = 0; i < signal.length; ++i) {signal[i] += noise[i]}

      if (this.state.aList[this.state.aIdx] + this.state.aList[this.state.noiseAIdx] > 1.0) {
        for (let i = 0; i < signal.length; ++i) {
          signal[i] /= (this.state.aList[this.state.aIdx] + this.state.aList[this.state.noiseAIdx])
        }
      }
    }

    return signal
  }

  addFilter(signal) {
    if (this.state.filterType !== 0) {
      signal = filter.IIRFilter(this.state.filterType, signal, this.state.sampleRate, this.state.filterCutoff, this.state.filterBandwidth)
    }
    return signal
  }

  handleChange(event) {
    let id = event.target.id.slice(10)
    let _a = this.state.a
    _a[id] = event.target.value

    this.setState({
      a: _a
    })
  }

  handleClick(event) {
    if (event.target.id === "inc-noisea") {
      this.setState((prevState) => {
        return {
          noiseAIdx: prevState.noiseAIdx >= prevState.aList.length - 1 ? prevState.noiseAIdx : prevState.noiseAIdx + 1
        }
      })
    } else if (event.target.id === "dec-noisea") {
      this.setState((prevState) => {
        return {
          noiseAIdx: prevState.noiseAIdx <= 0 ? prevState.noiseAIdx : prevState.noiseAIdx - 1
        }
      })
    } else if (event.target.id === "next-noise") {
      this.setState((prevState) => {
        return {
          noiseType: (prevState.noiseType + 1) % (prevState.noiseList.length)
        }
      })
    } else if (event.target.id === "prev-noise") {
      this.setState((prevState) => {
        return {
          noiseType: (prevState.noiseType > 0) ? (prevState.noiseType - 1) : (prevState.noiseList.length - 1)
        }
      })
    } else if (event.target.id === "next-filter") {
      this.setState((prevState) => {
        return {
          filterType: (prevState.filterType + 1) % (prevState.filterList.length)
        }
      })
    } else if (event.target.id === "prev-filter") {
      this.setState((prevState) => {
        return {
          filterType: (prevState.filterType > 0) ? (prevState.filterType - 1) : (prevState.filterList.length - 1)
        }
      })
    } else if (event.target.id === "inc-cutoff") {
      this.setState((prevState) => {
        let nextCutoff
        if (prevState.filterCutoff == 1) {
          nextCutoff = 50
        } else {
          nextCutoff = prevState.filterCutoff >= 2000 ? prevState.filterCutoff : prevState.filterCutoff + 50
        }
        return {
          filterCutoff: nextCutoff
        }
      })
    } else if (event.target.id === "dec-cutoff") {
      this.setState((prevState) => {
        return {
          filterCutoff: prevState.filterCutoff <= 100 ? 100 : prevState.filterCutoff - 50
        }
      })
    } else if (event.target.id === "inc-bw") {
      this.setState((prevState) => {
        let nextCutoff
        if (prevState.filterBandwidth == 1) {
          nextCutoff = 50
        } else {
          nextCutoff = prevState.filterBandwidth >= 1000 ? prevState.filterBandwidth : prevState.filterBandwidth + 50
        }
        return {
          filterBandwidth: nextCutoff
        }
      })
    } else if (event.target.id === "dec-bw") {
      this.setState((prevState) => {
        return {
          filterBandwidth: prevState.filterBandwidth <= 50 ? 50 : prevState.filterBandwidth - 50
        }
      })
    }
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
      <div className="app-container">
        <div className="row text-center app-row">
          <div className="col-sm">
            <div className="text-key">C<sub>4</sub></div>
            <input id="multifreq-0" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[0]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">C#<sub>4</sub></div>
            <input id="multifreq-1" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[1]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">D<sub>4</sub></div>
            <input id="multifreq-2" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[2]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">D#<sub>4</sub></div>
            <input id="multifreq-3" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[3]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">E<sub>4</sub></div>
            <input id="multifreq-4" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[4]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">F<sub>4</sub></div>
            <input id="multifreq-5" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[5]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">F#<sub>4</sub></div>
            <input id="multifreq-6" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[6]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">G<sub>4</sub></div>
            <input id="multifreq-7" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[7]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">G#<sub>4</sub></div>
            <input id="multifreq-8" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[8]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">A<sub>4</sub></div>
            <input id="multifreq-9" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[9]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">A#<sub>4</sub></div>
            <input id="multifreq-10" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[10]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
            <div className="text-key">B<sub>4</sub></div>
            <input id="multifreq-11" className="custom-range no-border vslider" type="range" onChange={event => this.handleChange(event)} value={this.state.a[11]} min="0.0" max="1.0" step="0.1" orientation="vertical" />
          </div>
          <div className="col-sm">
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
