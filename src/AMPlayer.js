import React from "react"
import DSP from "./dsp"
import Plot from 'react-plotly.js'

class AMPlayer extends React.Component {
  constructor() {
    super()
    this.state = {
      aArr: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      aIdx: 10,
      fArr: [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25],
      fIdx: 0,
      aCIdx: 10,
      fC: 2000,
      bufferSize: 8192, // FFT
      sampleRate: 44100,
      numPoints: 1000,
    }
  }

  getTimeDomainData() {
    let _x = new Float64Array(this.state.sampleRate).fill(0)
    let _yD = new Float64Array(this.state.sampleRate).fill(0)
    let _yC = new Float64Array(this.state.sampleRate).fill(0)
    let _y = new Float64Array(this.state.sampleRate).fill(0)

    let a = this.state.aArr[this.state.aIdx]
    let f = this.state.fArr[this.state.fIdx]
    let aC = this.state.aArr[this.state.aCIdx]
    let fC = this.state.fC

    for (let i = 0; i < this.state.sampleRate; ++i) {
      _x[i] = i/this.state.sampleRate
      _yD[i] = a * Math.sin(2 * Math.PI * f * _x[i])
    }

    for (let i = 0; i < this.state.sampleRate; ++i) {
      _yC[i] = aC * Math.sin(2 * Math.PI * fC * _x[i])
    }

    if (aC !== 0) {
      for (let i = 0; i < this.state.sampleRate; ++i) {
        _y[i] = (1 + _yD[i]/aC) * _yC[i] / 2
      }
    } else {
      _y = _yC
    }

    return ({
      x: _x,
      yD: _yD,
      yC: _yC,
      y: _y,
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
    } else if (event.target.id === "incac"){
      this.setState((prevState) => {
        return {
          aCIdx: prevState.aCIdx >= prevState.aArr.length - 1 ? prevState.aCIdx : prevState.aCIdx + 1
        }
      })
    } else if (event.target.id === "decac") {
      this.setState((prevState) => {
        return {
          aCIdx: prevState.aCIdx <= 0 ? prevState.aCIdx : prevState.aCIdx - 1
        }
      })
    } else if (event.target.id === "incfc") {
      this.setState((prevState) => {
        return {
          fC: prevState.fC >= 2000 ? prevState.fC : prevState.fC + 100
        }
      })
    } else if (event.target.id === "decfc") {
      this.setState((prevState) => {
        return {
          fC: prevState.fC <= 400 ? prevState.fC : prevState.fC - 100
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

    var fmax = 2625

    return (
      <div className="app-container">
        <div className="row text-center app-row">
          <div className="col-md text-center">
            <div className="text-data">Data Amplitude<br/>{this.state.aArr[this.state.aIdx]}</div>
            <button id="inca" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="deca" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
          <div className="col-md text-center">
            <div className="text-data">Data Frequency(Hz)<br/>{this.state.fArr[this.state.fIdx]}</div>
            <button id="incf" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="decf" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
          <div className="col-md text-center">
            <div className="text-data">Carrier Amplitude<br/>{this.state.aArr[this.state.aCIdx  ]}</div>
            <button id="incac" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="decac" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
          <div className="col-md text-center">
            <div className="text-data">Carrier Frequency(Hz)<br/>{this.state.fC}</div>
            <button id="incfc" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>+</button>
            <button id="decfc" type="button" className="btn btn-dark" onClick={event => this.handleClick(event)}>-</button>
          </div>
        </div>
        <div className="row text-center app-row">
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
                  y: timeData.yD.slice(0, this.state.numPoints-1),
                }
              ]}
              layout={ {width: 480, height: 320, title: 'Data Wave (Time Domain)', yaxis: {range: [-1, 1]}, margin: 0} }
            />
          </div>
          <div className="col-md text-center">
            <Plot
              data={[
                {
                  x: timeData.x.slice(0, this.state.numPoints-1),
                  y: timeData.yC.slice(0, this.state.numPoints-1),
                }
              ]}
              layout={ {width: 480, height: 320, title: 'Carrier Wave (Time Domain)', yaxis: {range: [-1, 1]}, margin: 0} }
            />
          </div>
          <div className="col-md text-center">
            <Plot
              data={[
                {
                  x: timeData.x.slice(0, this.state.numPoints-1),
                  y: timeData.y.slice(0, this.state.numPoints-1),
                }
              ]}
              layout={ {width: 480, height: 320, title: 'AM Wave (Time Domain)', yaxis: {range: [-1, 1]}, margin: 0} }
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
              layout={ {width: 480, height: 320, title: 'AM Wave (Frequency Domain)', margin: 0} }
            />
          </div>
        </div>
      </div>
    )
  }
}

export default AMPlayer
