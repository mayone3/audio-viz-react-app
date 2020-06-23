/* jshint esversion: 8 */
import React from "react";
import ReactDOM from "react-dom";

import DSP from "./dsp";
import AMPlayer from "./AMPlayer";
import FMPlayer from "./FMPlayer";
import FixedFreqPlayer from "./FixedFreqPlayer";
import MultiFreqPlayer from "./MultiFreqPlayer";
import Microphone from "./Microphone";
import AudioCompressor from "./AudioCompressor";

import './App.css';

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      appList: [
        'Fixed Frequency Player',
        'Multi Frequency Player',
        'AM Player',
        'FM Player',
        'Microphone',
        'Audio Compressor',
      ],
      currApp: 0,
      w: window.innerWidth,
      h: window.innerHeight,
      v: 30,
    };
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  getCurrApp() {
    switch (this.state.currApp) {
      case 0: return <FixedFreqPlayer w={this.state.w} h={this.state.h} v={this.state.v} />;
      case 1: return <MultiFreqPlayer w={this.state.w} h={this.state.h} v={this.state.v} />;
      case 2: return <AMPlayer w={this.state.w} h={this.state.h} v={this.state.v} />;
      case 3: return <FMPlayer w={this.state.w} h={this.state.h} v={this.state.v} />;
      case 4: return <Microphone w={this.state.w} h={this.state.h} v={this.state.v} />;
      case 5: return <AudioCompressor v={this.state.v} />;
      // case 6: return <AudioCompressor2 w={this.state.w} h={this.state.h} />;
      default: return <div>ERROR</div>;
    }
  }

  handleClick(event) {
    if (event.target.id === "button-next-app") {
      this.setState((prevState) => {
        let nextApp = (prevState.currApp + 1) % (prevState.appList.length)
        return { currApp: nextApp }
      });
    } else if (event.target.id === "button-prev-app") {
      this.setState((prevState) => {
        let nextApp = (prevState.currApp > 0) ? (prevState.currApp - 1) : (prevState.appList.length - 1)
        return { currApp: nextApp }
      });
    }
  }

  handleResize() {
    this.setState({ w: window.innerWidth, h: window.innerHeight });
  }

  render() {
    return (
      <div className="text-center">
        <div className="container" style={{paddingTop: "20px", margin: "auto"}}>
          <div className="row app-row justify-content-center">
          {
            /*
            <div className="col-4 align-self-center app-button" style={{padding: "0px 10px"}}>
              <button id="button-prev-app" className="btn btn-dark" onClick={(event) => this.handleClick(event)}>
                <div className="text-btn">prev</div>
              </button>
            </div>
            <div className="col-4 align-self-center">
              <div className="text-app-name">{this.state.appList[this.state.currApp]}</div>
            </div>
            <div className="col-4 align-self-center app-button" style={{padding: "0px 10px"}}>
              <button id="button-next-app" className="btn btn-dark" onClick={(event) => this.handleClick(event)}>
                <div className="text-btn">next</div>
              </button>
            </div>
            */
          }
            <div className="col-md">
              <select className="text-data" onChange={e => this.setState({currApp: parseInt(e.target.value)})}>
                <option value="0">Fixed Frequency Player</option>
                <option value="1">Multi Frequency Player</option>
                <option value="2">AM Player</option>
                <option value="3">FM Player</option>
                <option value="4">Microphone</option>
                <option value="5">Audio Compressor</option>
              </select>
            </div>
          </div>
          <div className="row app-row justify-content-center">
            <div className="col-md">
              <div className="text-data">Volume</div>
              <input type="range" onChange={event => this.setState({ v: event.target.value })} value={this.state.v} min="0" max="100" step="1"/>
            </div>
          </div>
        </div>

        {this.getCurrApp()}
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById("root")
);
