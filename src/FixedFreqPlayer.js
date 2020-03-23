import React from "react"
import DSP from "./dsp"
import Plot from 'react-plotly.js'

class FixedFreqPlayer extends React.Component {
  constructor() {
    super()
    this.state = {
      aArr: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      aIdx: 10,
      fArr: [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25],
      fIdx: 0,
      bufferSize: 8192, // FFT
      sampleRate: 44100,
      numPoints: 1000,
    }
  }

  getTimeDomainData() {
    var _x = new Float64Array(this.state.sampleRate).fill(0)
    var _y = new Float64Array(this.state.sampleRate).fill(0)

    let a = this.state.aArr[this.state.aIdx]
    let f = this.state.fArr[this.state.fIdx]

    for (let i = 0; i < this.state.sampleRate; ++i) {
      _x[i] = i/this.state.sampleRate
      _y[i] = a * Math.sin(2 * Math.PI * f * _x[i])
    }

    return ({
      x: _x,
      y: _y
    })
  }

  handleClick(event) {
    if (event.target.id === "inca") {
      this.setState((prevState) => {
        return {
          aIdx: prevState.aIdx >= prevState.aArr.length - 1 ? prevState.aIdx : prevState.aIdx + 1
        }
      })
    } else if (event.target.id === "deca") {
      this.setState((prevState) => {
        return {
          aIdx: prevState.aIdx <= 0 ? prevState.aIdx : prevState.aIdx - 1
        }
      })
    } else if (event.target.id === "incf") {
      this.setState((prevState) => {
        return {
          fIdx: prevState.fIdx >= prevState.fArr.length - 1 ? prevState.fIdx : prevState.fIdx + 1
        }
      })
    } else if (event.target.id === "decf") {
      this.setState((prevState) => {
        return {
          fIdx: prevState.fIdx <= 0 ? prevState.fIdx : prevState.fIdx - 1
        }
      })
    }
  }

  stopAudio() {
    // console.log(window.AudioContext)
  }

  startAudio() {
    var arr = this.getTimeDomainData().y
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    var buf = new Float32Array(arr.length)
    for (var i = 0; i < arr.length; i++) buf[i] = arr[i]
    var buffer = context.createBuffer(1, buf.length, context.sampleRate)
    buffer.copyToChannel(buf, 0)
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
  }

  playAudio() {
    // this.stopAudio();
    this.startAudio();
  }

  render() {
    var timeData = this.getTimeDomainData()
    var fft = new DSP.FFT(this.state.bufferSize, this.state.sampleRate)
    fft.forward(timeData.y.slice(0, this.state.bufferSize))
    var fy = fft.spectrum
    var fx = Array(fy.length).fill(0)

    for (let i = 0; i < fx.length; ++i) {
      fx[i] = this.state.sampleRate / this.state.bufferSize * i
      // fy[i] = fy[i] * -1 * Math.log((fft.bufferSize/2 - i) * (0.5/fft.bufferSize/2)) * fft.bufferSize
    }

    var fmax = 825

    return (
      <div className="app-container">
        <div className="row text-center app-row">
          <div className="col-md text-center">
            <div className="text-data">Amplitude<br/>{this.state.aArr[this.state.aIdx]}</div>
            <button id="inca" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="deca" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
          <div className="col-md text-center">
            <div className="text-data">Frequency(Hz)<br/>{this.state.fArr[this.state.fIdx]}</div>
            <button id="incf" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="decf" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
          <div className="col-sm text-center">
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
              layout={ {width: 480, height: 320, yaxis: {range: [-1, 1]}, title: 'Frequency Domain', margin: 0} }
            />
          </div>
        </div>
      </div>
    )
  }
}

export default FixedFreqPlayer
