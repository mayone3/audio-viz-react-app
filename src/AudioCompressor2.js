/* jshint esversion: 8 */
import React from "react";
import DSP from "./dsp";
import Plot from 'react-plotly.js';
import * as filter from "./filter";

class AudioCompressor2 extends React.Component {
  constructor() {
    super();
    this.state = {
      quality: 4,
      timeData: new Float32Array(0),
      playing: false,
      compressed: false,
      chunkSize: 4096,
    };
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.audio.src = "https://cors-anywhere.herokuapp.com/https://file-examples.com/wp-content/uploads/2017/11/file_example_WAV_1MG.wav";
    // this.audio.src = "marching_illini.wav";
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
  }

  onQualityChange(event) {
    this.setState({ quality: event.target.value });
  }

  tick() {
    this.rafId = requestAnimationFrame(this.tick);
    // if the audio is playing, get data from audio
    if (!this.state.playing) {
      return;
    }
    // reset the audio if finished
    if (this.audio.currentTime >= this.audio.duration) {
      this.stopPlaying();
    }
    // FFT

  }

  startPlaying() {
    console.log(this.audio);
    this.audio.play();
    this.setState({ playing: true });
  }

  stopPlaying() {
    this.audio.pause();
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

  }

  stopCompress() {

  }

  toggleCompress() {

  }

  render() {
    return (
      <div>
        <button type="button" className="btn btn-dark" onClick={event => this.togglePlaying()}>
          <div className="text-btn">{this.state.playing ? 'Stop Playing' : 'Start Playing'}</div>
        </button>
      </div>
    )
  }
}

export default AudioCompressor2
