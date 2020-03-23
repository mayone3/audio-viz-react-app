import React from "react"
import ReactDOM from "react-dom"

import DSP from "./dsp"
import AMPlayer from "./AMPlayer"
import FMPlayer from "./FMPlayer"
import FixedFreqPlayer from "./FixedFreqPlayer"
import MultiFreqPlayer from "./MultiFreqPlayer"

import './App.css'

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      appList: [
        'Fixed Frequency Player',
        'Multi Frequency Player',
        'AM Player',
        'FM Player',
      ],
      currApp: 3
    }
  }

  getCurrApp() {
    if (this.state.appList[this.state.currApp] === 'Fixed Frequency Player') {
      return <FixedFreqPlayer />
    } else if (this.state.appList[this.state.currApp] === 'Multi Frequency Player') {
      return <MultiFreqPlayer />
    } else if (this.state.appList[this.state.currApp] === 'AM Player') {
      return <AMPlayer />
    } else if (this.state.appList[this.state.currApp] === 'FM Player') {
      return <FMPlayer />
    } else {
      return <div>ERROR</div>
    }
  }

  handleClick(event) {
    console.log("clicked")
    if (event.target.id === "button-next-app") {
      this.setState((prevState) => {
        let nextApp = (prevState.currApp + 1) % (prevState.appList.length)
        return {
          currApp: nextApp
        }
      });
    } else if (event.target.id === "button-prev-app") {
      this.setState((prevState) => {
        let nextApp = (prevState.currApp > 0) ? (prevState.currApp - 1) : (prevState.currApp + prevState.appList.length - 1)
        return {
          currApp: nextApp
        }
      });
    }
  }

  render() {
    return (
      <div>
        <div className="container">
          <div className="row website-header">
            <div className="col-sm text-center">
              <button id="button-prev-app" className="btn btn-dark" onClick={(event) => this.handleClick(event)}>
                <div className="text-btn">prev</div>
              </button>
            </div>
            <div className="col-lg text-center">
              <div className="app-name">{this.state.appList[this.state.currApp]}</div>
            </div>
            <div className="col-sm text-center">
              <button id="button-next-app" className="btn btn-dark" onClick={(event) => this.handleClick(event)}>
                <div className="text-btn">next</div>
              </button>
            </div>
          </div>
          {this.getCurrApp()}
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById("root")
);
