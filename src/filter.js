// http://blog.bjornroche.com/2012/08/basic-audio-eqs.html
function IIRFilter(type, x, sampleRate, f, bw) {
  bw = Math.min(bw, f*2)
  var rc, dt, alpha, a0, a1, a2, b0, b1, b2, _a0, ratio
  var y = new Float64Array(x.length)
  rc = 1 / (2 * Math.PI * f)
  dt = 1 / sampleRate

  switch (type) {
    case 1:
      alpha = dt / (rc + dt)
      break;
    case 2:
      alpha = rc / (rc + dt)
      break;
    case 3:
      var rc0 = 1 / (2 * Math.PI * (f+bw/2))
      var rc1 = 1 / (2 * Math.PI * (f-bw/2))
      a0 = dt / (rc0 + dt)
      a1 = rc1 / (rc1 + dt)
      break;
    case 4:
      bw = Math.log((f+bw/2)/(f-bw/2))
      var A = Math.pow(10, 20/40)
      var w0 = 2 * Math.PI * f / sampleRate
      var c = Math.cos(w0)
      var s = Math.sin(w0)
      alpha = s * Math.sinh( Math.log(2)/2 * bw * w0 / s )
      _a0 = 1 + alpha/A;
      a0 = (1 + alpha/A) / _a0;
      a1 = (-2 * c) / _a0;
      a2 = (1 - alpha/A) / _a0;
      b0 = (1 + alpha*A) / _a0
      b1 = (-2 * c) / _a0;
      b2 = (1 - alpha*A) / _a0;
      break;
  }

  switch (type) {
    case 1:
      y[0] = alpha * x[0]
      for (let i = 1; i < x.length; ++i) {
        y[i] = y[i-1] + alpha * (x[i] - y[i-1])
      }
      break;
    case 2:
      y[0] = x[0]
      for (let i = 1; i < x.length; ++i) {
        y[i] = alpha * (y[i-1] + x[i] - x[i-1])
      }
      break;
    case 3:
      y[0] = a0 * x[0]
      for (let i = 1; i < x.length; ++i) {
        y[i] = y[i-1] + a0 * (x[i] - y[i-1])
      }

      x = y.slice()

      y[0] = x[0]
      for (let i = 1; i < x.length; ++i) {
        y[i] = a1 * (y[i-1] + x[i] - x[i-1])
      }
      ratio = Math.max(...y)
      if (ratio >= 1) {y = y.map(value => value/ratio)}
      break;
    case 4:
      y[0] = b0 * x[0]
      y[1] = b0 * x[1] + b1 * x[0] - a1 * y[0]
      for (let i = 2; i < x.length; ++i) {
        y[i] = b0 * x[i] + b1 * x[i-1] + b2 * x[i-2] - a1 * y[i-1] - a2 * y[i-2]
      }
      ratio = Math.max(...y)
      if (ratio >= 1) {y = y.map(value => value/ratio)}
      break;
  }

  return y
}



export {IIRFilter}
