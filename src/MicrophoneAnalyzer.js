import React from "react"
import DSP from "./dsp"
import Plot from 'react-plotly.js'
import * as filter from "./filter"

class MicrophoneAnalyzer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      timeData: new Float32Array(0),
      freqData: new Float32Array(0)
    }
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    // this.IIRFilter = this.audioContext.createIIRFilter();

    this.source = this.audioContext.createMediaStreamSource(this.props.audio);
    this.source.connect(this.analyser);

    this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.freqArray = new Float32Array(this.analyser.frequencyBinCount);

    this.rafId = requestAnimationFrame(this.tick);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
    this.analyser.disconnect();
    this.source.disconnect();
  }

  tick() {
    this.analyser.getFloatTimeDomainData(this.dataArray);
    this.analyser.getFloatFrequencyData(this.freqArray);
    this.setState({ timeData: this.dataArray, freqData: this.freqArray });
    this.rafId = requestAnimationFrame(this.tick);
  }

  render() {
    var _tx = this.state.timeData.map((v, i) => i / 44100)
    var _ty = this.state.timeData
    var _fx = this.state.freqData.map((v, i) => i / 1024 * 22050)
    var _fy = this.state.freqData

    return (
      <div className="row text-center app-row">
        <div className="col-md text-center">
          <Plot
            data={[{ x: _tx, y: _ty }]}
            layout={ {width: 480, height: 320, yaxis: {range: [-1.1, 1.1]}, title: 'Time Domain (s)', margin: 0} }
          />
        </div>
        <div className="col-md text-center">
        <Plot
          data={[{ x: _fx, y: _fy }]}
          layout={ {width: 480, height: 320, title: 'Frequency Domain (Hz)', margin: 0} }
        />
        </div>
      </div>
    )
  }
}

export default MicrophoneAnalyzer
