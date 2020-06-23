/* jshint esversion: 8 */
import React from "react";
import DSP from "./dsp";
import Plot from 'react-plotly.js';
import * as filter from "./filter";

class AudioCompressor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      quality: 4,
      compressed: false,
      audio: null,
      timeData: new Float32Array(0),
      playing: false,
      chunkSize: 4096,
      originalSourceReady: false,
      compressedSourceReady: false,
      generatingCompressedAudio: false,
      generatedCompressedAudio: false,
      compressedLoadingProgress: "",
      v: props.v,
    };
    this.onFileChange = this.onFileChange.bind(this);
    this.loadOriginalSource = this.loadOriginalSource.bind(this);
    this.loadCompressedSource = this.loadCompressedSource.bind(this);
    this.loadCompressedSourceCallback = this.loadCompressedSourceCallback.bind(this);
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
  }

  componentWillReceiveProps(props) {
    this.setState({ v: props.v });
    console.log(props.v)

    if (this.compressedGainNode) {
      this.compressedGainNode.gain.value = props.v / 100;
    }

    if (this.audio) {
      this.audio.volume = props.v / 100;
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
    // if it's playing, pause the audio
    if (this.state.playing) { this.stopPlaying(); }

    // if there are sources, disconnect them
    // if (this.source) { this.source.disconnect(); }
    // if (this.analyser) { this.analyser.disconnect(); }
    if (this.compressedSource) { this.compressedSource.disconnect(); }
    if (this.compressedGainNode) { this.compressedGainNode.disconnect(); }

    // if there's an audio aka file uploaded, delete it
    if (this.audio) {
      this.audio.removeEventListener('canplaythrough', this.loadOriginalSource, true);
      this.audio = null;
    }
    // if (this.audioStream) { this.audioStream = null; }
  }

  onFileChange(event) {
    if (event.target.files[0]) {
      if (this.state.playing) { this.stopPlaying(); }
      if (this.audio) {
        this.audio.removeEventListener('canplaythrough', this.loadOriginalSource, true);
        this.audio = null;
      }
      this.setState({ originalSourceReady: false, compressedSourceReady: false, generatedCompressedAudio: false, compressedLoadingProgress: "" });
      this.audioFile = event.target.files[0];

      // read from file and create a HTML5 audio element
      this.audioURL = URL.createObjectURL(this.audioFile);
      this.audio = new Audio(this.audioURL);
      this.audio.volume = this.state.v / 100;
      this.audio.addEventListener('canplaythrough', this.loadOriginalSource, true);
      this.audio.load()
    }
  }

  // can't create media stream source if the audio is not loaded
  loadOriginalSource() {
    // this.audioStream = this.audio.captureStream();
    // this.source = this.audioContext.createMediaStreamSource(this.audioStream);
    // this.analyser = this.audioContext.createAnalyser();
    // this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
    // this.freqArray = new Float32Array(this.analyser.frequencyBinCount);
    // this.source.connect(this.analyser);
    this.audio.muted = this.state.compressed;
    this.setState({ originalSourceReady: true });
  }

  loadCompressedSource() {
    if (!this.audio) {
      alert("Please upload an audio file!");
    } else if (this.audioFile) {
      if (!this.state.generatedCompressedAudio) {
        if (!this.state.generatingCompressedAudio) {
          var fileReader = new FileReader();
          fileReader.onload = this.loadCompressedSourceCallback;
          fileReader.readAsArrayBuffer(this.audioFile);
        } else {
          alert("Please wait until compression finishes.");
        }
      } else {
        alert("Compressed audio already generated.");
      }
    } else {
      alert("No audio file")
    }
  }

  async loadCompressedSourceCallback(event) {
    this.setState({ generatingCompressedAudio: true });
    await new Promise(resolve => setTimeout(resolve, 0));
    var arrayBuffer = event.target.result;
    console.log(arrayBuffer)
    this.audioContext.decodeAudioData(arrayBuffer, async (audioBuffer) => {
      var audioData = audioBuffer.getChannelData(0);
      var compressedAudioData = new Float32Array(audioData.length);
      // Process audio data as chunks
      for (let i = 0; i < audioData.length / this.state.chunkSize; ++i) {
        if (i % 64 === 0) {
          this.setState({ compressedLoadingProgress: (i / (audioData.length / this.state.chunkSize) * 100).toFixed(2) + "%" });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        var start = i * this.state.chunkSize;
        var segmentSize = Math.min(audioData.length - start, this.state.chunkSize);
        var tempArray = new Float32Array(this.state.chunkSize).fill(0);
        for (let j = 0; j < segmentSize; ++j) { tempArray[j] = audioData[start + j]; }

        // Apply FFT to the chunk
        var fft = new DSP.FFT(this.state.chunkSize, this.audioContext.sampleRate);
        fft.forward(tempArray);
        var fy = fft.spectrum;
        var fr = fft.real;
        var fi = fft.imag;
        var fx = fy.map((v, i) => i);
        fx.sort((a, b) => {
          if (fy[a] > fy[b]) { return -1; }
          else if (fy[a] < fy[b]) { return 1; }
          else { return 0; }
        });

        // Reconstruct signal from FFT
        var quality = this.state.quality;
        var segment = new Float32Array(segmentSize).fill(0);

        // Better version with Inverse Fast Fourier Transform
        var fr2 = new Float32Array(fr.length).fill(0);
        var fi2 = new Float32Array(fi.length).fill(0);
        for (let j = 0; j < quality; ++j) {
          fr2[fx[j]] = fr[fx[j]];
          fi2[fx[j]] = fi[fx[j]];
          fr2[fr.length-fx[j]] = fr[fr.length-fx[j]];
          fi2[fi.length-fx[j]] = fi[fi.length-fx[j]];
        }
        segment = fft.inverse(fr2, fi2);
        if (segment.length !== segmentSize) { segment = segment.slice(0, segmentSize); }
        compressedAudioData.set(segment, start);
      }
      this.compressedAudioBuffer = this.audioContext.createBuffer(1, compressedAudioData.length, this.audioContext.sampleRate);
      this.compressedAudioBuffer.getChannelData(0).set(compressedAudioData);
      // this.compressedAudioBuffer.copyToChannel(compressedAudioData, 0);
      this.setState({ compressedSourceReady: true, compressedLoadingProgress: "100%", generatingCompressedAudio: false, generatedCompressedAudio: true });
    }, reason => {
      console.log(reason)
    });
  }

  onQualityChange(event) {
    if (this.state.generatedCompressedAudio) {
      if (this.state.playing) { this.stopPlaying(); }
      this.compressedAudioBuffer = null;
      this.setState({
        quality: event.target.value,
        generatedCompressedAudio: false,
        compressedSourceReady: false,
        compressedLoadingProgress: ""
      });
    } else if (this.state.generatingCompressedAudio) {
      alert("Generating compressed audio, please change this later");
    } else {
      this.setState({ quality: event.target.value });
    }
  }

  tick() {
    this.rafId = requestAnimationFrame(this.tick);
    // if the audio is playing, get data from audio
    if (this.state.playing) {
      // this.analyser.getFloatTimeDomainData(this.dataArray);
      // this.analyser.getFloatFrequencyData(this.freqArray);
      // this.setState({
      //   timeData: this.dataArray,
      //   freqData: this.freqArray,
      // });
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
      return;
    } else if (!this.state.compressedSourceReady && this.state.generatingCompressedAudio) {
      alert("Please wait for compressed audio finishes generating");
      return;
    } else if (!this.state.compressedSourceReady && !this.state.generatingCompressedAudio) {
      // alert("Please generate compressed audio")
      this.loadCompressedSource()
      return;
    }

    this.compressedSource = this.audioContext.createBufferSource();
    this.compressedSource.buffer = this.compressedAudioBuffer;
    this.compressedGainNode = this.audioContext.createGain();
    this.compressedSource.connect(this.compressedGainNode);
    this.compressedGainNode.connect(this.audioContext.destination);
    if (this.state.compressed) {
      this.compressedGainNode.gain.value = this.state.v / 100;
    } else {
      this.compressedGainNode.gain.value = 0;
    }
    this.compressedSource.start();
    this.audio.play();
    this.setState({ playing: true });
  }

  stopPlaying() {
    // pause and reset audio to 0.0s
    this.audio.pause();
    this.audio.currentTime = 0.0;
    this.compressedSource.stop();
    this.compressedSource.disconnect();
    this.compressedGainNode.disconnect();
    this.setState({ playing: false });
  }

  togglePlaying() {
    if (this.state.playing) {
      this.stopPlaying();
    } else {
      this.startPlaying();
    }
  }

  startCompress() {
    // When uncompressed -> compressed, mute the HTML5 audio and unmute the gain node
    if (this.compressedSource) { this.compressedGainNode.gain.value = this.state.v / 100; }
    if (this.audio) { this.audio.muted = true; }
    this.setState({ compressed: true });
  }

  stopCompress() {
    // When compressed -> umcompressed, unmute the HTML5 audio and mute the gain node
    if (this.compressedSource) { this.compressedGainNode.gain.value = 0; }
    if (this.audio) { this.audio.muted = false; }
    this.setState({ compressed: false });
  }

  toggleCompress() {
    if (this.state.compressed) {
      this.stopCompress();
    } else {
      this.startCompress();
    }
  }

  render() {
    return (
      <div className="container" style={{margin: "auto"}}>
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
        <div className="row justify-content-center app-row">
          <div className="col-sm align-self-center" style={{maxWidth: "150px"}}>
            <div className="text-data">Quality:</div>
          </div>
          <div className="col-sm" style={{maxWidth: "150px"}}>
            <select className="form-control text-data" id="compress-quality-dropdown-menu" onChange={event => this.onQualityChange(event)} value={this.state.quality} style={{width: "auto"}}>
              <option value={1} className="text-data">1</option>
              <option value={2} className="text-data">2</option>
              <option value={4} className="text-data">4</option>
              <option value={8} className="text-data">8</option>
              <option value={16} className="text-data">16</option>
              <option value={32} className="text-data">32</option>
              <option value={64} className="text-data">64</option>
              <option value={128} className="text-data">128</option>
              <option value={256} className="text-data">256</option>
            </select>
          </div>
        </div>
        {
        // <div className="row app-row">
        //   <div className="col-md text-center">
        //     <button type="button" className="btn btn-dark" onClick={this.loadCompressedSource}>
        //       <div className="text-btn">Generate Compressed Audio</div>
        //     </button>
        //   </div>
        // </div>
        }
        <div className="row app-row">
          <div className="col-md text-center">
          {
            this.audio
            ? <div>
                <div>
                {
                  this.state.originalSourceReady
                  ? <div className="text-data">Original Audio Ready!</div>
                  : <div className="text-data">Loading Original Source</div>
                }
                </div>
                <div>
                {
                  this.state.generatedCompressedAudio
                  ? <div className="text-data">Compressed Audio Ready!</div>
                  : this.state.generatingCompressedAudio
                    ? <div className="text-data">Loading Compressed Source</div>
                    : <div className="text-data">Please Generate Compressed Audio</div>
                }
                </div>
                <div className="text-data">{this.state.compressedSourceReady ? "" : this.state.compressedLoadingProgress}</div>
              </div>
            : <div className="text-data">Please upload an audio file</div>
          }
          </div>
        </div>
        <div className="row justify-content-center app-row">
          <div className="col-sm" style={{maxWidth: "200px"}}>
            <button type="button" className="btn btn-dark" onClick={event => this.togglePlaying()}>
              <div className="text-btn">{this.state.compressedSourceReady ? (this.state.playing ? 'Stop Playing' : 'Start Playing') : "Generate Audio"}</div>
            </button>
          </div>
          <div className="col-sm" style={{maxWidth: "200px"}}>
            <button type="button" className="btn btn-dark" onClick={event => this.toggleCompress()}>
              <div className="text-btn">{this.state.compressed ? 'Play Original' : 'Play Compressed'}</div>
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default AudioCompressor
