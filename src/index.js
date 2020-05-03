/* jshint esversion: 8 */
import React from "react";
import ReactDOM from "react-dom";

import DSP from "./dsp";
import AMPlayer from "./AMPlayer";
import FMPlayer from "./FMPlayer";
import FixedFreqPlayer from "./FixedFreqPlayer";
import FixedFreqPlayer2 from "./FixedFreqPlayer2";
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
      currApp: 5,
      w: window.innerWidth,
      h: window.innerHeight,
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
      case 0: return <FixedFreqPlayer2 w={this.state.w} h={this.state.h} />;
      case 1: return <MultiFreqPlayer w={this.state.w} h={this.state.h} />;
      case 2: return <AMPlayer w={this.state.w} h={this.state.h} />
      case 3: return <FMPlayer w={this.state.w} h={this.state.h} />
      case 4: return <Microphone w={this.state.w} h={this.state.h} />
      case 5: return <AudioCompressor w={this.state.w} h={this.state.h} />
      default: return <div>ERROR</div>
    }
  }

  handleClick(event) {
    if (event.target.id === "button-next-app" || event.target.id === "text-next-app") {
      this.setState((prevState) => {
        let nextApp = (prevState.currApp + 1) % (prevState.appList.length)
        return { currApp: nextApp }
      });
    } else if (event.target.id === "button-prev-app" || event.target.id === "text-prev-app") {
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
      <div className="website-top-level">
        <div className="container" style={{margin: "auto"}}>
          <div className="row justify-content-center" style={{padding: "10px 0px"}}>
            <div className="col-xs-4 align-self-center app-button">
              <button id="button-prev-app" className="btn btn-dark" onClick={(event) => this.handleClick(event)}>
                <div id="text-prev-app" className="text-btn">prev</div>
              </button>
            </div>
            <div className="col-xs-4 align-self-center" style={{padding: "0px 20px", width: "300px"}}>
              <div className="text-data">{this.state.appList[this.state.currApp]}</div>
            </div>
            <div className="col-xs-4 align-self-center app-button">
              <button id="button-next-app" className="btn btn-dark" onClick={(event) => this.handleClick(event)}>
                <div id="text-next-app" className="text-btn">next</div>
              </button>
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
