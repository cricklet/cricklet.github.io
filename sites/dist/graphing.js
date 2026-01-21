"use strict";
(() => {
  // node_modules/decimal.js/decimal.mjs
  var EXP_LIMIT = 9e15;
  var MAX_DIGITS = 1e9;
  var NUMERALS = "0123456789abcdef";
  var LN10 = "2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058";
  var PI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789";
  var DEFAULTS = {
    // These values must be integers within the stated ranges (inclusive).
    // Most of these values can be changed at run-time using the `Decimal.config` method.
    // The maximum number of significant digits of the result of a calculation or base conversion.
    // E.g. `Decimal.config({ precision: 20 });`
    precision: 20,
    // 1 to MAX_DIGITS
    // The rounding mode used when rounding to `precision`.
    //
    // ROUND_UP         0 Away from zero.
    // ROUND_DOWN       1 Towards zero.
    // ROUND_CEIL       2 Towards +Infinity.
    // ROUND_FLOOR      3 Towards -Infinity.
    // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
    // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
    // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
    // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
    // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
    //
    // E.g.
    // `Decimal.rounding = 4;`
    // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
    rounding: 4,
    // 0 to 8
    // The modulo mode used when calculating the modulus: a mod n.
    // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
    // The remainder (r) is calculated as: r = a - n * q.
    //
    // UP         0 The remainder is positive if the dividend is negative, else is negative.
    // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
    // FLOOR      3 The remainder has the same sign as the divisor (Python %).
    // HALF_EVEN  6 The IEEE 754 remainder function.
    // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
    //
    // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
    // division (9) are commonly used for the modulus operation. The other rounding modes can also
    // be used, but they may not give useful results.
    modulo: 1,
    // 0 to 9
    // The exponent value at and beneath which `toString` returns exponential notation.
    // JavaScript numbers: -7
    toExpNeg: -7,
    // 0 to -EXP_LIMIT
    // The exponent value at and above which `toString` returns exponential notation.
    // JavaScript numbers: 21
    toExpPos: 21,
    // 0 to EXP_LIMIT
    // The minimum exponent value, beneath which underflow to zero occurs.
    // JavaScript numbers: -324  (5e-324)
    minE: -EXP_LIMIT,
    // -1 to -EXP_LIMIT
    // The maximum exponent value, above which overflow to Infinity occurs.
    // JavaScript numbers: 308  (1.7976931348623157e+308)
    maxE: EXP_LIMIT,
    // 1 to EXP_LIMIT
    // Whether to use cryptographically-secure random number generation, if available.
    crypto: false
    // true/false
  };
  var inexact;
  var quadrant;
  var external = true;
  var decimalError = "[DecimalError] ";
  var invalidArgument = decimalError + "Invalid argument: ";
  var precisionLimitExceeded = decimalError + "Precision limit exceeded";
  var cryptoUnavailable = decimalError + "crypto unavailable";
  var tag = "[object Decimal]";
  var mathfloor = Math.floor;
  var mathpow = Math.pow;
  var isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
  var isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i;
  var isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;
  var isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
  var BASE = 1e7;
  var LOG_BASE = 7;
  var MAX_SAFE_INTEGER = 9007199254740991;
  var LN10_PRECISION = LN10.length - 1;
  var PI_PRECISION = PI.length - 1;
  var P = { toStringTag: tag };
  P.absoluteValue = P.abs = function() {
    var x = new this.constructor(this);
    if (x.s < 0) x.s = 1;
    return finalise(x);
  };
  P.ceil = function() {
    return finalise(new this.constructor(this), this.e + 1, 2);
  };
  P.clampedTo = P.clamp = function(min2, max2) {
    var k, x = this, Ctor = x.constructor;
    min2 = new Ctor(min2);
    max2 = new Ctor(max2);
    if (!min2.s || !max2.s) return new Ctor(NaN);
    if (min2.gt(max2)) throw Error(invalidArgument + max2);
    k = x.cmp(min2);
    return k < 0 ? min2 : x.cmp(max2) > 0 ? max2 : new Ctor(x);
  };
  P.comparedTo = P.cmp = function(y) {
    var i, j, xdL, ydL, x = this, xd = x.d, yd = (y = new x.constructor(y)).d, xs = x.s, ys = y.s;
    if (!xd || !yd) {
      return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
    }
    if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;
    if (xs !== ys) return xs;
    if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;
    xdL = xd.length;
    ydL = yd.length;
    for (i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i) {
      if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
    }
    return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
  };
  P.cosine = P.cos = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.d) return new Ctor(NaN);
    if (!x.d[0]) return new Ctor(1);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
    Ctor.rounding = 1;
    x = cosine(Ctor, toLessThanHalfPi(Ctor, x));
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
  };
  P.cubeRoot = P.cbrt = function() {
    var e, m, n, r, rep, s, sd, t, t3, t3plusx, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    external = false;
    s = x.s * mathpow(x.s * x, 1 / 3);
    if (!s || Math.abs(s) == 1 / 0) {
      n = digitsToString(x.d);
      e = x.e;
      if (s = (e - n.length + 1) % 3) n += s == 1 || s == -2 ? "0" : "00";
      s = mathpow(n, 1 / 3);
      e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));
      if (s == 1 / 0) {
        n = "5e" + e;
      } else {
        n = s.toExponential();
        n = n.slice(0, n.indexOf("e") + 1) + e;
      }
      r = new Ctor(n);
      r.s = x.s;
    } else {
      r = new Ctor(s.toString());
    }
    sd = (e = Ctor.precision) + 3;
    for (; ; ) {
      t = r;
      t3 = t.times(t).times(t);
      t3plusx = t3.plus(x);
      r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);
      if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
        n = n.slice(sd - 3, sd + 1);
        if (n == "9999" || !rep && n == "4999") {
          if (!rep) {
            finalise(t, e + 1, 0);
            if (t.times(t).times(t).eq(x)) {
              r = t;
              break;
            }
          }
          sd += 4;
          rep = 1;
        } else {
          if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
            finalise(r, e + 1, 1);
            m = !r.times(r).times(r).eq(x);
          }
          break;
        }
      }
    }
    external = true;
    return finalise(r, e, Ctor.rounding, m);
  };
  P.decimalPlaces = P.dp = function() {
    var w, d = this.d, n = NaN;
    if (d) {
      w = d.length - 1;
      n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;
      w = d[w];
      if (w) for (; w % 10 == 0; w /= 10) n--;
      if (n < 0) n = 0;
    }
    return n;
  };
  P.dividedBy = P.div = function(y) {
    return divide(this, new this.constructor(y));
  };
  P.dividedToIntegerBy = P.divToInt = function(y) {
    var x = this, Ctor = x.constructor;
    return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
  };
  P.equals = P.eq = function(y) {
    return this.cmp(y) === 0;
  };
  P.floor = function() {
    return finalise(new this.constructor(this), this.e + 1, 3);
  };
  P.greaterThan = P.gt = function(y) {
    return this.cmp(y) > 0;
  };
  P.greaterThanOrEqualTo = P.gte = function(y) {
    var k = this.cmp(y);
    return k == 1 || k === 0;
  };
  P.hyperbolicCosine = P.cosh = function() {
    var k, n, pr, rm, len, x = this, Ctor = x.constructor, one = new Ctor(1);
    if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
    if (x.isZero()) return one;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
    Ctor.rounding = 1;
    len = x.d.length;
    if (len < 32) {
      k = Math.ceil(len / 3);
      n = (1 / tinyPow(4, k)).toString();
    } else {
      k = 16;
      n = "2.3283064365386962890625e-10";
    }
    x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);
    var cosh2_x, i = k, d8 = new Ctor(8);
    for (; i--; ) {
      cosh2_x = x.times(x);
      x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
    }
    return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
  };
  P.hyperbolicSine = P.sinh = function() {
    var k, pr, rm, len, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
    Ctor.rounding = 1;
    len = x.d.length;
    if (len < 3) {
      x = taylorSeries(Ctor, 2, x, x, true);
    } else {
      k = 1.4 * Math.sqrt(len);
      k = k > 16 ? 16 : k | 0;
      x = x.times(1 / tinyPow(5, k));
      x = taylorSeries(Ctor, 2, x, x, true);
      var sinh2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
      for (; k--; ) {
        sinh2_x = x.times(x);
        x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
      }
    }
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(x, pr, rm, true);
  };
  P.hyperbolicTangent = P.tanh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(x.s);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 7;
    Ctor.rounding = 1;
    return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
  };
  P.inverseCosine = P.acos = function() {
    var x = this, Ctor = x.constructor, k = x.abs().cmp(1), pr = Ctor.precision, rm = Ctor.rounding;
    if (k !== -1) {
      return k === 0 ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0) : new Ctor(NaN);
    }
    if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);
    Ctor.precision = pr + 6;
    Ctor.rounding = 1;
    x = new Ctor(1).minus(x).div(x.plus(1)).sqrt().atan();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(2);
  };
  P.inverseHyperbolicCosine = P.acosh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
    if (!x.isFinite()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
    Ctor.rounding = 1;
    external = false;
    x = x.times(x).minus(1).sqrt().plus(x);
    external = true;
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.ln();
  };
  P.inverseHyperbolicSine = P.asinh = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite() || x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
    Ctor.rounding = 1;
    external = false;
    x = x.times(x).plus(1).sqrt().plus(x);
    external = true;
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.ln();
  };
  P.inverseHyperbolicTangent = P.atanh = function() {
    var pr, rm, wpr, xsd, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    xsd = x.sd();
    if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);
    Ctor.precision = wpr = xsd - x.e;
    x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);
    Ctor.precision = pr + 4;
    Ctor.rounding = 1;
    x = x.ln();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(0.5);
  };
  P.inverseSine = P.asin = function() {
    var halfPi, k, pr, rm, x = this, Ctor = x.constructor;
    if (x.isZero()) return new Ctor(x);
    k = x.abs().cmp(1);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (k !== -1) {
      if (k === 0) {
        halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
        halfPi.s = x.s;
        return halfPi;
      }
      return new Ctor(NaN);
    }
    Ctor.precision = pr + 6;
    Ctor.rounding = 1;
    x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return x.times(2);
  };
  P.inverseTangent = P.atan = function() {
    var i, j, k, n, px, t, r, wpr, x2, x = this, Ctor = x.constructor, pr = Ctor.precision, rm = Ctor.rounding;
    if (!x.isFinite()) {
      if (!x.s) return new Ctor(NaN);
      if (pr + 4 <= PI_PRECISION) {
        r = getPi(Ctor, pr + 4, rm).times(0.5);
        r.s = x.s;
        return r;
      }
    } else if (x.isZero()) {
      return new Ctor(x);
    } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
      r = getPi(Ctor, pr + 4, rm).times(0.25);
      r.s = x.s;
      return r;
    }
    Ctor.precision = wpr = pr + 10;
    Ctor.rounding = 1;
    k = Math.min(28, wpr / LOG_BASE + 2 | 0);
    for (i = k; i; --i) x = x.div(x.times(x).plus(1).sqrt().plus(1));
    external = false;
    j = Math.ceil(wpr / LOG_BASE);
    n = 1;
    x2 = x.times(x);
    r = new Ctor(x);
    px = x;
    for (; i !== -1; ) {
      px = px.times(x2);
      t = r.minus(px.div(n += 2));
      px = px.times(x2);
      r = t.plus(px.div(n += 2));
      if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--; ) ;
    }
    if (k) r = r.times(2 << k - 1);
    external = true;
    return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
  };
  P.isFinite = function() {
    return !!this.d;
  };
  P.isInteger = P.isInt = function() {
    return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
  };
  P.isNaN = function() {
    return !this.s;
  };
  P.isNegative = P.isNeg = function() {
    return this.s < 0;
  };
  P.isPositive = P.isPos = function() {
    return this.s > 0;
  };
  P.isZero = function() {
    return !!this.d && this.d[0] === 0;
  };
  P.lessThan = P.lt = function(y) {
    return this.cmp(y) < 0;
  };
  P.lessThanOrEqualTo = P.lte = function(y) {
    return this.cmp(y) < 1;
  };
  P.logarithm = P.log = function(base) {
    var isBase10, d, denominator, k, inf, num, sd, r, arg = this, Ctor = arg.constructor, pr = Ctor.precision, rm = Ctor.rounding, guard = 5;
    if (base == null) {
      base = new Ctor(10);
      isBase10 = true;
    } else {
      base = new Ctor(base);
      d = base.d;
      if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);
      isBase10 = base.eq(10);
    }
    d = arg.d;
    if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
      return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
    }
    if (isBase10) {
      if (d.length > 1) {
        inf = true;
      } else {
        for (k = d[0]; k % 10 === 0; ) k /= 10;
        inf = k !== 1;
      }
    }
    external = false;
    sd = pr + guard;
    num = naturalLogarithm(arg, sd);
    denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
    r = divide(num, denominator, sd, 1);
    if (checkRoundingDigits(r.d, k = pr, rm)) {
      do {
        sd += 10;
        num = naturalLogarithm(arg, sd);
        denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
        r = divide(num, denominator, sd, 1);
        if (!inf) {
          if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
            r = finalise(r, pr + 1, 0);
          }
          break;
        }
      } while (checkRoundingDigits(r.d, k += 10, rm));
    }
    external = true;
    return finalise(r, pr, rm);
  };
  P.minus = P.sub = function(y) {
    var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.d) {
      if (!x.s || !y.s) y = new Ctor(NaN);
      else if (x.d) y.s = -y.s;
      else y = new Ctor(y.d || x.s !== y.s ? x : NaN);
      return y;
    }
    if (x.s != y.s) {
      y.s = -y.s;
      return x.plus(y);
    }
    xd = x.d;
    yd = y.d;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (!xd[0] || !yd[0]) {
      if (yd[0]) y.s = -y.s;
      else if (xd[0]) y = new Ctor(x);
      else return new Ctor(rm === 3 ? -0 : 0);
      return external ? finalise(y, pr, rm) : y;
    }
    e = mathfloor(y.e / LOG_BASE);
    xe = mathfloor(x.e / LOG_BASE);
    xd = xd.slice();
    k = xe - e;
    if (k) {
      xLTy = k < 0;
      if (xLTy) {
        d = xd;
        k = -k;
        len = yd.length;
      } else {
        d = yd;
        e = xe;
        len = xd.length;
      }
      i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;
      if (k > i) {
        k = i;
        d.length = 1;
      }
      d.reverse();
      for (i = k; i--; ) d.push(0);
      d.reverse();
    } else {
      i = xd.length;
      len = yd.length;
      xLTy = i < len;
      if (xLTy) len = i;
      for (i = 0; i < len; i++) {
        if (xd[i] != yd[i]) {
          xLTy = xd[i] < yd[i];
          break;
        }
      }
      k = 0;
    }
    if (xLTy) {
      d = xd;
      xd = yd;
      yd = d;
      y.s = -y.s;
    }
    len = xd.length;
    for (i = yd.length - len; i > 0; --i) xd[len++] = 0;
    for (i = yd.length; i > k; ) {
      if (xd[--i] < yd[i]) {
        for (j = i; j && xd[--j] === 0; ) xd[j] = BASE - 1;
        --xd[j];
        xd[i] += BASE;
      }
      xd[i] -= yd[i];
    }
    for (; xd[--len] === 0; ) xd.pop();
    for (; xd[0] === 0; xd.shift()) --e;
    if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);
    y.d = xd;
    y.e = getBase10Exponent(xd, e);
    return external ? finalise(y, pr, rm) : y;
  };
  P.modulo = P.mod = function(y) {
    var q, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);
    if (!y.d || x.d && !x.d[0]) {
      return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
    }
    external = false;
    if (Ctor.modulo == 9) {
      q = divide(x, y.abs(), 0, 3, 1);
      q.s *= y.s;
    } else {
      q = divide(x, y, 0, Ctor.modulo, 1);
    }
    q = q.times(y);
    external = true;
    return x.minus(q);
  };
  P.naturalExponential = P.exp = function() {
    return naturalExponential(this);
  };
  P.naturalLogarithm = P.ln = function() {
    return naturalLogarithm(this);
  };
  P.negated = P.neg = function() {
    var x = new this.constructor(this);
    x.s = -x.s;
    return finalise(x);
  };
  P.plus = P.add = function(y) {
    var carry, d, e, i, k, len, pr, rm, xd, yd, x = this, Ctor = x.constructor;
    y = new Ctor(y);
    if (!x.d || !y.d) {
      if (!x.s || !y.s) y = new Ctor(NaN);
      else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);
      return y;
    }
    if (x.s != y.s) {
      y.s = -y.s;
      return x.minus(y);
    }
    xd = x.d;
    yd = y.d;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (!xd[0] || !yd[0]) {
      if (!yd[0]) y = new Ctor(x);
      return external ? finalise(y, pr, rm) : y;
    }
    k = mathfloor(x.e / LOG_BASE);
    e = mathfloor(y.e / LOG_BASE);
    xd = xd.slice();
    i = k - e;
    if (i) {
      if (i < 0) {
        d = xd;
        i = -i;
        len = yd.length;
      } else {
        d = yd;
        e = k;
        len = xd.length;
      }
      k = Math.ceil(pr / LOG_BASE);
      len = k > len ? k + 1 : len + 1;
      if (i > len) {
        i = len;
        d.length = 1;
      }
      d.reverse();
      for (; i--; ) d.push(0);
      d.reverse();
    }
    len = xd.length;
    i = yd.length;
    if (len - i < 0) {
      i = len;
      d = yd;
      yd = xd;
      xd = d;
    }
    for (carry = 0; i; ) {
      carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
      xd[i] %= BASE;
    }
    if (carry) {
      xd.unshift(carry);
      ++e;
    }
    for (len = xd.length; xd[--len] == 0; ) xd.pop();
    y.d = xd;
    y.e = getBase10Exponent(xd, e);
    return external ? finalise(y, pr, rm) : y;
  };
  P.precision = P.sd = function(z) {
    var k, x = this;
    if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);
    if (x.d) {
      k = getPrecision(x.d);
      if (z && x.e + 1 > k) k = x.e + 1;
    } else {
      k = NaN;
    }
    return k;
  };
  P.round = function() {
    var x = this, Ctor = x.constructor;
    return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
  };
  P.sine = P.sin = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
    Ctor.rounding = 1;
    x = sine(Ctor, toLessThanHalfPi(Ctor, x));
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
  };
  P.squareRoot = P.sqrt = function() {
    var m, n, sd, r, rep, t, x = this, d = x.d, e = x.e, s = x.s, Ctor = x.constructor;
    if (s !== 1 || !d || !d[0]) {
      return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
    }
    external = false;
    s = Math.sqrt(+x);
    if (s == 0 || s == 1 / 0) {
      n = digitsToString(d);
      if ((n.length + e) % 2 == 0) n += "0";
      s = Math.sqrt(n);
      e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);
      if (s == 1 / 0) {
        n = "5e" + e;
      } else {
        n = s.toExponential();
        n = n.slice(0, n.indexOf("e") + 1) + e;
      }
      r = new Ctor(n);
    } else {
      r = new Ctor(s.toString());
    }
    sd = (e = Ctor.precision) + 3;
    for (; ; ) {
      t = r;
      r = t.plus(divide(x, t, sd + 2, 1)).times(0.5);
      if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
        n = n.slice(sd - 3, sd + 1);
        if (n == "9999" || !rep && n == "4999") {
          if (!rep) {
            finalise(t, e + 1, 0);
            if (t.times(t).eq(x)) {
              r = t;
              break;
            }
          }
          sd += 4;
          rep = 1;
        } else {
          if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
            finalise(r, e + 1, 1);
            m = !r.times(r).eq(x);
          }
          break;
        }
      }
    }
    external = true;
    return finalise(r, e, Ctor.rounding, m);
  };
  P.tangent = P.tan = function() {
    var pr, rm, x = this, Ctor = x.constructor;
    if (!x.isFinite()) return new Ctor(NaN);
    if (x.isZero()) return new Ctor(x);
    pr = Ctor.precision;
    rm = Ctor.rounding;
    Ctor.precision = pr + 10;
    Ctor.rounding = 1;
    x = x.sin();
    x.s = 1;
    x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);
    Ctor.precision = pr;
    Ctor.rounding = rm;
    return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
  };
  P.times = P.mul = function(y) {
    var carry, e, i, k, r, rL, t, xdL, ydL, x = this, Ctor = x.constructor, xd = x.d, yd = (y = new Ctor(y)).d;
    y.s *= x.s;
    if (!xd || !xd[0] || !yd || !yd[0]) {
      return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd ? NaN : !xd || !yd ? y.s / 0 : y.s * 0);
    }
    e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
    xdL = xd.length;
    ydL = yd.length;
    if (xdL < ydL) {
      r = xd;
      xd = yd;
      yd = r;
      rL = xdL;
      xdL = ydL;
      ydL = rL;
    }
    r = [];
    rL = xdL + ydL;
    for (i = rL; i--; ) r.push(0);
    for (i = ydL; --i >= 0; ) {
      carry = 0;
      for (k = xdL + i; k > i; ) {
        t = r[k] + yd[i] * xd[k - i - 1] + carry;
        r[k--] = t % BASE | 0;
        carry = t / BASE | 0;
      }
      r[k] = (r[k] + carry) % BASE | 0;
    }
    for (; !r[--rL]; ) r.pop();
    if (carry) ++e;
    else r.shift();
    y.d = r;
    y.e = getBase10Exponent(r, e);
    return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
  };
  P.toBinary = function(sd, rm) {
    return toStringBinary(this, 2, sd, rm);
  };
  P.toDecimalPlaces = P.toDP = function(dp, rm) {
    var x = this, Ctor = x.constructor;
    x = new Ctor(x);
    if (dp === void 0) return x;
    checkInt32(dp, 0, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
    return finalise(x, dp + x.e + 1, rm);
  };
  P.toExponential = function(dp, rm) {
    var str, x = this, Ctor = x.constructor;
    if (dp === void 0) {
      str = finiteToString(x, true);
    } else {
      checkInt32(dp, 0, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
      x = finalise(new Ctor(x), dp + 1, rm);
      str = finiteToString(x, true, dp + 1);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
  };
  P.toFixed = function(dp, rm) {
    var str, y, x = this, Ctor = x.constructor;
    if (dp === void 0) {
      str = finiteToString(x);
    } else {
      checkInt32(dp, 0, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
      y = finalise(new Ctor(x), dp + x.e + 1, rm);
      str = finiteToString(y, false, dp + y.e + 1);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
  };
  P.toFraction = function(maxD) {
    var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r, x = this, xd = x.d, Ctor = x.constructor;
    if (!xd) return new Ctor(x);
    n1 = d0 = new Ctor(1);
    d1 = n0 = new Ctor(0);
    d = new Ctor(d1);
    e = d.e = getPrecision(xd) - x.e - 1;
    k = e % LOG_BASE;
    d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);
    if (maxD == null) {
      maxD = e > 0 ? d : n1;
    } else {
      n = new Ctor(maxD);
      if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
      maxD = n.gt(d) ? e > 0 ? d : n1 : n;
    }
    external = false;
    n = new Ctor(digitsToString(xd));
    pr = Ctor.precision;
    Ctor.precision = e = xd.length * LOG_BASE * 2;
    for (; ; ) {
      q = divide(n, d, 0, 1, 1);
      d2 = d0.plus(q.times(d1));
      if (d2.cmp(maxD) == 1) break;
      d0 = d1;
      d1 = d2;
      d2 = n1;
      n1 = n0.plus(q.times(d2));
      n0 = d2;
      d2 = d;
      d = n.minus(q.times(d2));
      n = d2;
    }
    d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
    n0 = n0.plus(d2.times(n1));
    d0 = d0.plus(d2.times(d1));
    n0.s = n1.s = x.s;
    r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];
    Ctor.precision = pr;
    external = true;
    return r;
  };
  P.toHexadecimal = P.toHex = function(sd, rm) {
    return toStringBinary(this, 16, sd, rm);
  };
  P.toNearest = function(y, rm) {
    var x = this, Ctor = x.constructor;
    x = new Ctor(x);
    if (y == null) {
      if (!x.d) return x;
      y = new Ctor(1);
      rm = Ctor.rounding;
    } else {
      y = new Ctor(y);
      if (rm === void 0) {
        rm = Ctor.rounding;
      } else {
        checkInt32(rm, 0, 8);
      }
      if (!x.d) return y.s ? x : y;
      if (!y.d) {
        if (y.s) y.s = x.s;
        return y;
      }
    }
    if (y.d[0]) {
      external = false;
      x = divide(x, y, 0, rm, 1).times(y);
      external = true;
      finalise(x);
    } else {
      y.s = x.s;
      x = y;
    }
    return x;
  };
  P.toNumber = function() {
    return +this;
  };
  P.toOctal = function(sd, rm) {
    return toStringBinary(this, 8, sd, rm);
  };
  P.toPower = P.pow = function(y) {
    var e, k, pr, r, rm, s, x = this, Ctor = x.constructor, yn = +(y = new Ctor(y));
    if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));
    x = new Ctor(x);
    if (x.eq(1)) return x;
    pr = Ctor.precision;
    rm = Ctor.rounding;
    if (y.eq(1)) return finalise(x, pr, rm);
    e = mathfloor(y.e / LOG_BASE);
    if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
      r = intPow(Ctor, x, k, pr);
      return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
    }
    s = x.s;
    if (s < 0) {
      if (e < y.d.length - 1) return new Ctor(NaN);
      if ((y.d[e] & 1) == 0) s = 1;
      if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
        x.s = s;
        return x;
      }
    }
    k = mathpow(+x, yn);
    e = k == 0 || !isFinite(k) ? mathfloor(yn * (Math.log("0." + digitsToString(x.d)) / Math.LN10 + x.e + 1)) : new Ctor(k + "").e;
    if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);
    external = false;
    Ctor.rounding = x.s = 1;
    k = Math.min(12, (e + "").length);
    r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);
    if (r.d) {
      r = finalise(r, pr + 5, 1);
      if (checkRoundingDigits(r.d, pr, rm)) {
        e = pr + 10;
        r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);
        if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
          r = finalise(r, pr + 1, 0);
        }
      }
    }
    r.s = s;
    external = true;
    Ctor.rounding = rm;
    return finalise(r, pr, rm);
  };
  P.toPrecision = function(sd, rm) {
    var str, x = this, Ctor = x.constructor;
    if (sd === void 0) {
      str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    } else {
      checkInt32(sd, 1, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
      x = finalise(new Ctor(x), sd, rm);
      str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
    }
    return x.isNeg() && !x.isZero() ? "-" + str : str;
  };
  P.toSignificantDigits = P.toSD = function(sd, rm) {
    var x = this, Ctor = x.constructor;
    if (sd === void 0) {
      sd = Ctor.precision;
      rm = Ctor.rounding;
    } else {
      checkInt32(sd, 1, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
    }
    return finalise(new Ctor(x), sd, rm);
  };
  P.toString = function() {
    var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    return x.isNeg() && !x.isZero() ? "-" + str : str;
  };
  P.truncated = P.trunc = function() {
    return finalise(new this.constructor(this), this.e + 1, 1);
  };
  P.valueOf = P.toJSON = function() {
    var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
    return x.isNeg() ? "-" + str : str;
  };
  function digitsToString(d) {
    var i, k, ws, indexOfLastWord = d.length - 1, str = "", w = d[0];
    if (indexOfLastWord > 0) {
      str += w;
      for (i = 1; i < indexOfLastWord; i++) {
        ws = d[i] + "";
        k = LOG_BASE - ws.length;
        if (k) str += getZeroString(k);
        str += ws;
      }
      w = d[i];
      ws = w + "";
      k = LOG_BASE - ws.length;
      if (k) str += getZeroString(k);
    } else if (w === 0) {
      return "0";
    }
    for (; w % 10 === 0; ) w /= 10;
    return str + w;
  }
  function checkInt32(i, min2, max2) {
    if (i !== ~~i || i < min2 || i > max2) {
      throw Error(invalidArgument + i);
    }
  }
  function checkRoundingDigits(d, i, rm, repeating) {
    var di, k, r, rd;
    for (k = d[0]; k >= 10; k /= 10) --i;
    if (--i < 0) {
      i += LOG_BASE;
      di = 0;
    } else {
      di = Math.ceil((i + 1) / LOG_BASE);
      i %= LOG_BASE;
    }
    k = mathpow(10, LOG_BASE - i);
    rd = d[di] % k | 0;
    if (repeating == null) {
      if (i < 3) {
        if (i == 0) rd = rd / 100 | 0;
        else if (i == 1) rd = rd / 10 | 0;
        r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 5e4 || rd == 0;
      } else {
        r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 || (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
      }
    } else {
      if (i < 4) {
        if (i == 0) rd = rd / 1e3 | 0;
        else if (i == 1) rd = rd / 100 | 0;
        else if (i == 2) rd = rd / 10 | 0;
        r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
      } else {
        r = ((repeating || rm < 4) && rd + 1 == k || !repeating && rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 1e3 | 0) == mathpow(10, i - 3) - 1;
      }
    }
    return r;
  }
  function convertBase(str, baseIn, baseOut) {
    var j, arr = [0], arrL, i = 0, strL = str.length;
    for (; i < strL; ) {
      for (arrL = arr.length; arrL--; ) arr[arrL] *= baseIn;
      arr[0] += NUMERALS.indexOf(str.charAt(i++));
      for (j = 0; j < arr.length; j++) {
        if (arr[j] > baseOut - 1) {
          if (arr[j + 1] === void 0) arr[j + 1] = 0;
          arr[j + 1] += arr[j] / baseOut | 0;
          arr[j] %= baseOut;
        }
      }
    }
    return arr.reverse();
  }
  function cosine(Ctor, x) {
    var k, len, y;
    if (x.isZero()) return x;
    len = x.d.length;
    if (len < 32) {
      k = Math.ceil(len / 3);
      y = (1 / tinyPow(4, k)).toString();
    } else {
      k = 16;
      y = "2.3283064365386962890625e-10";
    }
    Ctor.precision += k;
    x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));
    for (var i = k; i--; ) {
      var cos2x = x.times(x);
      x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
    }
    Ctor.precision -= k;
    return x;
  }
  var divide = /* @__PURE__ */ function() {
    function multiplyInteger(x, k, base) {
      var temp, carry = 0, i = x.length;
      for (x = x.slice(); i--; ) {
        temp = x[i] * k + carry;
        x[i] = temp % base | 0;
        carry = temp / base | 0;
      }
      if (carry) x.unshift(carry);
      return x;
    }
    function compare(a, b, aL, bL) {
      var i, r;
      if (aL != bL) {
        r = aL > bL ? 1 : -1;
      } else {
        for (i = r = 0; i < aL; i++) {
          if (a[i] != b[i]) {
            r = a[i] > b[i] ? 1 : -1;
            break;
          }
        }
      }
      return r;
    }
    function subtract2(a, b, aL, base) {
      var i = 0;
      for (; aL--; ) {
        a[aL] -= i;
        i = a[aL] < b[aL] ? 1 : 0;
        a[aL] = i * base + a[aL] - b[aL];
      }
      for (; !a[0] && a.length > 1; ) a.shift();
    }
    return function(x, y, pr, rm, dp, base) {
      var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0, yL, yz, Ctor = x.constructor, sign2 = x.s == y.s ? 1 : -1, xd = x.d, yd = y.d;
      if (!xd || !xd[0] || !yd || !yd[0]) {
        return new Ctor(
          // Return NaN if either NaN, or both Infinity or 0.
          !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN : (
            // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
            xd && xd[0] == 0 || !yd ? sign2 * 0 : sign2 / 0
          )
        );
      }
      if (base) {
        logBase = 1;
        e = x.e - y.e;
      } else {
        base = BASE;
        logBase = LOG_BASE;
        e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
      }
      yL = yd.length;
      xL = xd.length;
      q = new Ctor(sign2);
      qd = q.d = [];
      for (i = 0; yd[i] == (xd[i] || 0); i++) ;
      if (yd[i] > (xd[i] || 0)) e--;
      if (pr == null) {
        sd = pr = Ctor.precision;
        rm = Ctor.rounding;
      } else if (dp) {
        sd = pr + (x.e - y.e) + 1;
      } else {
        sd = pr;
      }
      if (sd < 0) {
        qd.push(1);
        more = true;
      } else {
        sd = sd / logBase + 2 | 0;
        i = 0;
        if (yL == 1) {
          k = 0;
          yd = yd[0];
          sd++;
          for (; (i < xL || k) && sd--; i++) {
            t = k * base + (xd[i] || 0);
            qd[i] = t / yd | 0;
            k = t % yd | 0;
          }
          more = k || i < xL;
        } else {
          k = base / (yd[0] + 1) | 0;
          if (k > 1) {
            yd = multiplyInteger(yd, k, base);
            xd = multiplyInteger(xd, k, base);
            yL = yd.length;
            xL = xd.length;
          }
          xi = yL;
          rem = xd.slice(0, yL);
          remL = rem.length;
          for (; remL < yL; ) rem[remL++] = 0;
          yz = yd.slice();
          yz.unshift(0);
          yd0 = yd[0];
          if (yd[1] >= base / 2) ++yd0;
          do {
            k = 0;
            cmp = compare(yd, rem, yL, remL);
            if (cmp < 0) {
              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);
              k = rem0 / yd0 | 0;
              if (k > 1) {
                if (k >= base) k = base - 1;
                prod = multiplyInteger(yd, k, base);
                prodL = prod.length;
                remL = rem.length;
                cmp = compare(prod, rem, prodL, remL);
                if (cmp == 1) {
                  k--;
                  subtract2(prod, yL < prodL ? yz : yd, prodL, base);
                }
              } else {
                if (k == 0) cmp = k = 1;
                prod = yd.slice();
              }
              prodL = prod.length;
              if (prodL < remL) prod.unshift(0);
              subtract2(rem, prod, remL, base);
              if (cmp == -1) {
                remL = rem.length;
                cmp = compare(yd, rem, yL, remL);
                if (cmp < 1) {
                  k++;
                  subtract2(rem, yL < remL ? yz : yd, remL, base);
                }
              }
              remL = rem.length;
            } else if (cmp === 0) {
              k++;
              rem = [0];
            }
            qd[i++] = k;
            if (cmp && rem[0]) {
              rem[remL++] = xd[xi] || 0;
            } else {
              rem = [xd[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] !== void 0) && sd--);
          more = rem[0] !== void 0;
        }
        if (!qd[0]) qd.shift();
      }
      if (logBase == 1) {
        q.e = e;
        inexact = more;
      } else {
        for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
        q.e = i + e * logBase - 1;
        finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
      }
      return q;
    };
  }();
  function finalise(x, sd, rm, isTruncated) {
    var digits, i, j, k, rd, roundUp, w, xd, xdi, Ctor = x.constructor;
    out: if (sd != null) {
      xd = x.d;
      if (!xd) return x;
      for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
      i = sd - digits;
      if (i < 0) {
        i += LOG_BASE;
        j = sd;
        w = xd[xdi = 0];
        rd = w / mathpow(10, digits - j - 1) % 10 | 0;
      } else {
        xdi = Math.ceil((i + 1) / LOG_BASE);
        k = xd.length;
        if (xdi >= k) {
          if (isTruncated) {
            for (; k++ <= xdi; ) xd.push(0);
            w = rd = 0;
            digits = 1;
            i %= LOG_BASE;
            j = i - LOG_BASE + 1;
          } else {
            break out;
          }
        } else {
          w = k = xd[xdi];
          for (digits = 1; k >= 10; k /= 10) digits++;
          i %= LOG_BASE;
          j = i - LOG_BASE + digits;
          rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
        }
      }
      isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));
      roundUp = rm < 4 ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
      (i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
      if (sd < 1 || !xd[0]) {
        xd.length = 0;
        if (roundUp) {
          sd -= x.e + 1;
          xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
          x.e = -sd || 0;
        } else {
          xd[0] = x.e = 0;
        }
        return x;
      }
      if (i == 0) {
        xd.length = xdi;
        k = 1;
        xdi--;
      } else {
        xd.length = xdi + 1;
        k = mathpow(10, LOG_BASE - i);
        xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
      }
      if (roundUp) {
        for (; ; ) {
          if (xdi == 0) {
            for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
            j = xd[0] += k;
            for (k = 1; j >= 10; j /= 10) k++;
            if (i != k) {
              x.e++;
              if (xd[0] == BASE) xd[0] = 1;
            }
            break;
          } else {
            xd[xdi] += k;
            if (xd[xdi] != BASE) break;
            xd[xdi--] = 0;
            k = 1;
          }
        }
      }
      for (i = xd.length; xd[--i] === 0; ) xd.pop();
    }
    if (external) {
      if (x.e > Ctor.maxE) {
        x.d = null;
        x.e = NaN;
      } else if (x.e < Ctor.minE) {
        x.e = 0;
        x.d = [0];
      }
    }
    return x;
  }
  function finiteToString(x, isExp, sd) {
    if (!x.isFinite()) return nonFiniteToString(x);
    var k, e = x.e, str = digitsToString(x.d), len = str.length;
    if (isExp) {
      if (sd && (k = sd - len) > 0) {
        str = str.charAt(0) + "." + str.slice(1) + getZeroString(k);
      } else if (len > 1) {
        str = str.charAt(0) + "." + str.slice(1);
      }
      str = str + (x.e < 0 ? "e" : "e+") + x.e;
    } else if (e < 0) {
      str = "0." + getZeroString(-e - 1) + str;
      if (sd && (k = sd - len) > 0) str += getZeroString(k);
    } else if (e >= len) {
      str += getZeroString(e + 1 - len);
      if (sd && (k = sd - e - 1) > 0) str = str + "." + getZeroString(k);
    } else {
      if ((k = e + 1) < len) str = str.slice(0, k) + "." + str.slice(k);
      if (sd && (k = sd - len) > 0) {
        if (e + 1 === len) str += ".";
        str += getZeroString(k);
      }
    }
    return str;
  }
  function getBase10Exponent(digits, e) {
    var w = digits[0];
    for (e *= LOG_BASE; w >= 10; w /= 10) e++;
    return e;
  }
  function getLn10(Ctor, sd, pr) {
    if (sd > LN10_PRECISION) {
      external = true;
      if (pr) Ctor.precision = pr;
      throw Error(precisionLimitExceeded);
    }
    return finalise(new Ctor(LN10), sd, 1, true);
  }
  function getPi(Ctor, sd, rm) {
    if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
    return finalise(new Ctor(PI), sd, rm, true);
  }
  function getPrecision(digits) {
    var w = digits.length - 1, len = w * LOG_BASE + 1;
    w = digits[w];
    if (w) {
      for (; w % 10 == 0; w /= 10) len--;
      for (w = digits[0]; w >= 10; w /= 10) len++;
    }
    return len;
  }
  function getZeroString(k) {
    var zs = "";
    for (; k--; ) zs += "0";
    return zs;
  }
  function intPow(Ctor, x, n, pr) {
    var isTruncated, r = new Ctor(1), k = Math.ceil(pr / LOG_BASE + 4);
    external = false;
    for (; ; ) {
      if (n % 2) {
        r = r.times(x);
        if (truncate(r.d, k)) isTruncated = true;
      }
      n = mathfloor(n / 2);
      if (n === 0) {
        n = r.d.length - 1;
        if (isTruncated && r.d[n] === 0) ++r.d[n];
        break;
      }
      x = x.times(x);
      truncate(x.d, k);
    }
    external = true;
    return r;
  }
  function isOdd(n) {
    return n.d[n.d.length - 1] & 1;
  }
  function maxOrMin(Ctor, args, n) {
    var k, y, x = new Ctor(args[0]), i = 0;
    for (; ++i < args.length; ) {
      y = new Ctor(args[i]);
      if (!y.s) {
        x = y;
        break;
      }
      k = x.cmp(y);
      if (k === n || k === 0 && x.s === n) {
        x = y;
      }
    }
    return x;
  }
  function naturalExponential(x, sd) {
    var denominator, guard, j, pow2, sum2, t, wpr, rep = 0, i = 0, k = 0, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
    if (!x.d || !x.d[0] || x.e > 17) {
      return new Ctor(x.d ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0 : x.s ? x.s < 0 ? 0 : x : 0 / 0);
    }
    if (sd == null) {
      external = false;
      wpr = pr;
    } else {
      wpr = sd;
    }
    t = new Ctor(0.03125);
    while (x.e > -2) {
      x = x.times(t);
      k += 5;
    }
    guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
    wpr += guard;
    denominator = pow2 = sum2 = new Ctor(1);
    Ctor.precision = wpr;
    for (; ; ) {
      pow2 = finalise(pow2.times(x), wpr, 1);
      denominator = denominator.times(++i);
      t = sum2.plus(divide(pow2, denominator, wpr, 1));
      if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
        j = k;
        while (j--) sum2 = finalise(sum2.times(sum2), wpr, 1);
        if (sd == null) {
          if (rep < 3 && checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
            Ctor.precision = wpr += 10;
            denominator = pow2 = t = new Ctor(1);
            i = 0;
            rep++;
          } else {
            return finalise(sum2, Ctor.precision = pr, rm, external = true);
          }
        } else {
          Ctor.precision = pr;
          return sum2;
        }
      }
      sum2 = t;
    }
  }
  function naturalLogarithm(y, sd) {
    var c, c0, denominator, e, numerator, rep, sum2, t, wpr, x1, x2, n = 1, guard = 10, x = y, xd = x.d, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
    if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
      return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
    }
    if (sd == null) {
      external = false;
      wpr = pr;
    } else {
      wpr = sd;
    }
    Ctor.precision = wpr += guard;
    c = digitsToString(xd);
    c0 = c.charAt(0);
    if (Math.abs(e = x.e) < 15e14) {
      while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
        x = x.times(y);
        c = digitsToString(x.d);
        c0 = c.charAt(0);
        n++;
      }
      e = x.e;
      if (c0 > 1) {
        x = new Ctor("0." + c);
        e++;
      } else {
        x = new Ctor(c0 + "." + c.slice(1));
      }
    } else {
      t = getLn10(Ctor, wpr + 2, pr).times(e + "");
      x = naturalLogarithm(new Ctor(c0 + "." + c.slice(1)), wpr - guard).plus(t);
      Ctor.precision = pr;
      return sd == null ? finalise(x, pr, rm, external = true) : x;
    }
    x1 = x;
    sum2 = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
    x2 = finalise(x.times(x), wpr, 1);
    denominator = 3;
    for (; ; ) {
      numerator = finalise(numerator.times(x2), wpr, 1);
      t = sum2.plus(divide(numerator, new Ctor(denominator), wpr, 1));
      if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
        sum2 = sum2.times(2);
        if (e !== 0) sum2 = sum2.plus(getLn10(Ctor, wpr + 2, pr).times(e + ""));
        sum2 = divide(sum2, new Ctor(n), wpr, 1);
        if (sd == null) {
          if (checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
            Ctor.precision = wpr += guard;
            t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
            x2 = finalise(x.times(x), wpr, 1);
            denominator = rep = 1;
          } else {
            return finalise(sum2, Ctor.precision = pr, rm, external = true);
          }
        } else {
          Ctor.precision = pr;
          return sum2;
        }
      }
      sum2 = t;
      denominator += 2;
    }
  }
  function nonFiniteToString(x) {
    return String(x.s * x.s / 0);
  }
  function parseDecimal(x, str) {
    var e, i, len;
    if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
    if ((i = str.search(/e/i)) > 0) {
      if (e < 0) e = i;
      e += +str.slice(i + 1);
      str = str.substring(0, i);
    } else if (e < 0) {
      e = str.length;
    }
    for (i = 0; str.charCodeAt(i) === 48; i++) ;
    for (len = str.length; str.charCodeAt(len - 1) === 48; --len) ;
    str = str.slice(i, len);
    if (str) {
      len -= i;
      x.e = e = e - i - 1;
      x.d = [];
      i = (e + 1) % LOG_BASE;
      if (e < 0) i += LOG_BASE;
      if (i < len) {
        if (i) x.d.push(+str.slice(0, i));
        for (len -= LOG_BASE; i < len; ) x.d.push(+str.slice(i, i += LOG_BASE));
        str = str.slice(i);
        i = LOG_BASE - str.length;
      } else {
        i -= len;
      }
      for (; i--; ) str += "0";
      x.d.push(+str);
      if (external) {
        if (x.e > x.constructor.maxE) {
          x.d = null;
          x.e = NaN;
        } else if (x.e < x.constructor.minE) {
          x.e = 0;
          x.d = [0];
        }
      }
    } else {
      x.e = 0;
      x.d = [0];
    }
    return x;
  }
  function parseOther(x, str) {
    var base, Ctor, divisor, i, isFloat, len, p, xd, xe;
    if (str.indexOf("_") > -1) {
      str = str.replace(/(\d)_(?=\d)/g, "$1");
      if (isDecimal.test(str)) return parseDecimal(x, str);
    } else if (str === "Infinity" || str === "NaN") {
      if (!+str) x.s = NaN;
      x.e = NaN;
      x.d = null;
      return x;
    }
    if (isHex.test(str)) {
      base = 16;
      str = str.toLowerCase();
    } else if (isBinary.test(str)) {
      base = 2;
    } else if (isOctal.test(str)) {
      base = 8;
    } else {
      throw Error(invalidArgument + str);
    }
    i = str.search(/p/i);
    if (i > 0) {
      p = +str.slice(i + 1);
      str = str.substring(2, i);
    } else {
      str = str.slice(2);
    }
    i = str.indexOf(".");
    isFloat = i >= 0;
    Ctor = x.constructor;
    if (isFloat) {
      str = str.replace(".", "");
      len = str.length;
      i = len - i;
      divisor = intPow(Ctor, new Ctor(base), i, i * 2);
    }
    xd = convertBase(str, base, BASE);
    xe = xd.length - 1;
    for (i = xe; xd[i] === 0; --i) xd.pop();
    if (i < 0) return new Ctor(x.s * 0);
    x.e = getBase10Exponent(xd, xe);
    x.d = xd;
    external = false;
    if (isFloat) x = divide(x, divisor, len * 4);
    if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
    external = true;
    return x;
  }
  function sine(Ctor, x) {
    var k, len = x.d.length;
    if (len < 3) {
      return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
    }
    k = 1.4 * Math.sqrt(len);
    k = k > 16 ? 16 : k | 0;
    x = x.times(1 / tinyPow(5, k));
    x = taylorSeries(Ctor, 2, x, x);
    var sin2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
    for (; k--; ) {
      sin2_x = x.times(x);
      x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
    }
    return x;
  }
  function taylorSeries(Ctor, n, x, y, isHyperbolic) {
    var j, t, u, x2, i = 1, pr = Ctor.precision, k = Math.ceil(pr / LOG_BASE);
    external = false;
    x2 = x.times(x);
    u = new Ctor(y);
    for (; ; ) {
      t = divide(u.times(x2), new Ctor(n++ * n++), pr, 1);
      u = isHyperbolic ? y.plus(t) : y.minus(t);
      y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
      t = u.plus(y);
      if (t.d[k] !== void 0) {
        for (j = k; t.d[j] === u.d[j] && j--; ) ;
        if (j == -1) break;
      }
      j = u;
      u = y;
      y = t;
      t = j;
      i++;
    }
    external = true;
    t.d.length = k + 1;
    return t;
  }
  function tinyPow(b, e) {
    var n = b;
    while (--e) n *= b;
    return n;
  }
  function toLessThanHalfPi(Ctor, x) {
    var t, isNeg = x.s < 0, pi = getPi(Ctor, Ctor.precision, 1), halfPi = pi.times(0.5);
    x = x.abs();
    if (x.lte(halfPi)) {
      quadrant = isNeg ? 4 : 1;
      return x;
    }
    t = x.divToInt(pi);
    if (t.isZero()) {
      quadrant = isNeg ? 3 : 2;
    } else {
      x = x.minus(t.times(pi));
      if (x.lte(halfPi)) {
        quadrant = isOdd(t) ? isNeg ? 2 : 3 : isNeg ? 4 : 1;
        return x;
      }
      quadrant = isOdd(t) ? isNeg ? 1 : 4 : isNeg ? 3 : 2;
    }
    return x.minus(pi).abs();
  }
  function toStringBinary(x, baseOut, sd, rm) {
    var base, e, i, k, len, roundUp, str, xd, y, Ctor = x.constructor, isExp = sd !== void 0;
    if (isExp) {
      checkInt32(sd, 1, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
    } else {
      sd = Ctor.precision;
      rm = Ctor.rounding;
    }
    if (!x.isFinite()) {
      str = nonFiniteToString(x);
    } else {
      str = finiteToString(x);
      i = str.indexOf(".");
      if (isExp) {
        base = 2;
        if (baseOut == 16) {
          sd = sd * 4 - 3;
        } else if (baseOut == 8) {
          sd = sd * 3 - 2;
        }
      } else {
        base = baseOut;
      }
      if (i >= 0) {
        str = str.replace(".", "");
        y = new Ctor(1);
        y.e = str.length - i;
        y.d = convertBase(finiteToString(y), 10, base);
        y.e = y.d.length;
      }
      xd = convertBase(str, 10, base);
      e = len = xd.length;
      for (; xd[--len] == 0; ) xd.pop();
      if (!xd[0]) {
        str = isExp ? "0p+0" : "0";
      } else {
        if (i < 0) {
          e--;
        } else {
          x = new Ctor(x);
          x.d = xd;
          x.e = e;
          x = divide(x, y, sd, rm, 0, base);
          xd = x.d;
          e = x.e;
          roundUp = inexact;
        }
        i = xd[sd];
        k = base / 2;
        roundUp = roundUp || xd[sd + 1] !== void 0;
        roundUp = rm < 4 ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2)) : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 || rm === (x.s < 0 ? 8 : 7));
        xd.length = sd;
        if (roundUp) {
          for (; ++xd[--sd] > base - 1; ) {
            xd[sd] = 0;
            if (!sd) {
              ++e;
              xd.unshift(1);
            }
          }
        }
        for (len = xd.length; !xd[len - 1]; --len) ;
        for (i = 0, str = ""; i < len; i++) str += NUMERALS.charAt(xd[i]);
        if (isExp) {
          if (len > 1) {
            if (baseOut == 16 || baseOut == 8) {
              i = baseOut == 16 ? 4 : 3;
              for (--len; len % i; len++) str += "0";
              xd = convertBase(str, base, baseOut);
              for (len = xd.length; !xd[len - 1]; --len) ;
              for (i = 1, str = "1."; i < len; i++) str += NUMERALS.charAt(xd[i]);
            } else {
              str = str.charAt(0) + "." + str.slice(1);
            }
          }
          str = str + (e < 0 ? "p" : "p+") + e;
        } else if (e < 0) {
          for (; ++e; ) str = "0" + str;
          str = "0." + str;
        } else {
          if (++e > len) for (e -= len; e--; ) str += "0";
          else if (e < len) str = str.slice(0, e) + "." + str.slice(e);
        }
      }
      str = (baseOut == 16 ? "0x" : baseOut == 2 ? "0b" : baseOut == 8 ? "0o" : "") + str;
    }
    return x.s < 0 ? "-" + str : str;
  }
  function truncate(arr, len) {
    if (arr.length > len) {
      arr.length = len;
      return true;
    }
  }
  function abs(x) {
    return new this(x).abs();
  }
  function acos(x) {
    return new this(x).acos();
  }
  function acosh(x) {
    return new this(x).acosh();
  }
  function add(x, y) {
    return new this(x).plus(y);
  }
  function asin(x) {
    return new this(x).asin();
  }
  function asinh(x) {
    return new this(x).asinh();
  }
  function atan(x) {
    return new this(x).atan();
  }
  function atanh(x) {
    return new this(x).atanh();
  }
  function atan2(y, x) {
    y = new this(y);
    x = new this(x);
    var r, pr = this.precision, rm = this.rounding, wpr = pr + 4;
    if (!y.s || !x.s) {
      r = new this(NaN);
    } else if (!y.d && !x.d) {
      r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
      r.s = y.s;
    } else if (!x.d || y.isZero()) {
      r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
      r.s = y.s;
    } else if (!y.d || x.isZero()) {
      r = getPi(this, wpr, 1).times(0.5);
      r.s = y.s;
    } else if (x.s < 0) {
      this.precision = wpr;
      this.rounding = 1;
      r = this.atan(divide(y, x, wpr, 1));
      x = getPi(this, wpr, 1);
      this.precision = pr;
      this.rounding = rm;
      r = y.s < 0 ? r.minus(x) : r.plus(x);
    } else {
      r = this.atan(divide(y, x, wpr, 1));
    }
    return r;
  }
  function cbrt(x) {
    return new this(x).cbrt();
  }
  function ceil(x) {
    return finalise(x = new this(x), x.e + 1, 2);
  }
  function clamp(x, min2, max2) {
    return new this(x).clamp(min2, max2);
  }
  function config(obj) {
    if (!obj || typeof obj !== "object") throw Error(decimalError + "Object expected");
    var i, p, v, useDefaults = obj.defaults === true, ps = [
      "precision",
      1,
      MAX_DIGITS,
      "rounding",
      0,
      8,
      "toExpNeg",
      -EXP_LIMIT,
      0,
      "toExpPos",
      0,
      EXP_LIMIT,
      "maxE",
      0,
      EXP_LIMIT,
      "minE",
      -EXP_LIMIT,
      0,
      "modulo",
      0,
      9
    ];
    for (i = 0; i < ps.length; i += 3) {
      if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
      if ((v = obj[p]) !== void 0) {
        if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
        else throw Error(invalidArgument + p + ": " + v);
      }
    }
    if (p = "crypto", useDefaults) this[p] = DEFAULTS[p];
    if ((v = obj[p]) !== void 0) {
      if (v === true || v === false || v === 0 || v === 1) {
        if (v) {
          if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
            this[p] = true;
          } else {
            throw Error(cryptoUnavailable);
          }
        } else {
          this[p] = false;
        }
      } else {
        throw Error(invalidArgument + p + ": " + v);
      }
    }
    return this;
  }
  function cos(x) {
    return new this(x).cos();
  }
  function cosh(x) {
    return new this(x).cosh();
  }
  function clone(obj) {
    var i, p, ps;
    function Decimal2(v) {
      var e, i2, t, x = this;
      if (!(x instanceof Decimal2)) return new Decimal2(v);
      x.constructor = Decimal2;
      if (isDecimalInstance(v)) {
        x.s = v.s;
        if (external) {
          if (!v.d || v.e > Decimal2.maxE) {
            x.e = NaN;
            x.d = null;
          } else if (v.e < Decimal2.minE) {
            x.e = 0;
            x.d = [0];
          } else {
            x.e = v.e;
            x.d = v.d.slice();
          }
        } else {
          x.e = v.e;
          x.d = v.d ? v.d.slice() : v.d;
        }
        return;
      }
      t = typeof v;
      if (t === "number") {
        if (v === 0) {
          x.s = 1 / v < 0 ? -1 : 1;
          x.e = 0;
          x.d = [0];
          return;
        }
        if (v < 0) {
          v = -v;
          x.s = -1;
        } else {
          x.s = 1;
        }
        if (v === ~~v && v < 1e7) {
          for (e = 0, i2 = v; i2 >= 10; i2 /= 10) e++;
          if (external) {
            if (e > Decimal2.maxE) {
              x.e = NaN;
              x.d = null;
            } else if (e < Decimal2.minE) {
              x.e = 0;
              x.d = [0];
            } else {
              x.e = e;
              x.d = [v];
            }
          } else {
            x.e = e;
            x.d = [v];
          }
          return;
        }
        if (v * 0 !== 0) {
          if (!v) x.s = NaN;
          x.e = NaN;
          x.d = null;
          return;
        }
        return parseDecimal(x, v.toString());
      }
      if (t === "string") {
        if ((i2 = v.charCodeAt(0)) === 45) {
          v = v.slice(1);
          x.s = -1;
        } else {
          if (i2 === 43) v = v.slice(1);
          x.s = 1;
        }
        return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
      }
      if (t === "bigint") {
        if (v < 0) {
          v = -v;
          x.s = -1;
        } else {
          x.s = 1;
        }
        return parseDecimal(x, v.toString());
      }
      throw Error(invalidArgument + v);
    }
    Decimal2.prototype = P;
    Decimal2.ROUND_UP = 0;
    Decimal2.ROUND_DOWN = 1;
    Decimal2.ROUND_CEIL = 2;
    Decimal2.ROUND_FLOOR = 3;
    Decimal2.ROUND_HALF_UP = 4;
    Decimal2.ROUND_HALF_DOWN = 5;
    Decimal2.ROUND_HALF_EVEN = 6;
    Decimal2.ROUND_HALF_CEIL = 7;
    Decimal2.ROUND_HALF_FLOOR = 8;
    Decimal2.EUCLID = 9;
    Decimal2.config = Decimal2.set = config;
    Decimal2.clone = clone;
    Decimal2.isDecimal = isDecimalInstance;
    Decimal2.abs = abs;
    Decimal2.acos = acos;
    Decimal2.acosh = acosh;
    Decimal2.add = add;
    Decimal2.asin = asin;
    Decimal2.asinh = asinh;
    Decimal2.atan = atan;
    Decimal2.atanh = atanh;
    Decimal2.atan2 = atan2;
    Decimal2.cbrt = cbrt;
    Decimal2.ceil = ceil;
    Decimal2.clamp = clamp;
    Decimal2.cos = cos;
    Decimal2.cosh = cosh;
    Decimal2.div = div;
    Decimal2.exp = exp;
    Decimal2.floor = floor;
    Decimal2.hypot = hypot;
    Decimal2.ln = ln;
    Decimal2.log = log;
    Decimal2.log10 = log10;
    Decimal2.log2 = log2;
    Decimal2.max = max;
    Decimal2.min = min;
    Decimal2.mod = mod;
    Decimal2.mul = mul;
    Decimal2.pow = pow;
    Decimal2.random = random;
    Decimal2.round = round;
    Decimal2.sign = sign;
    Decimal2.sin = sin;
    Decimal2.sinh = sinh;
    Decimal2.sqrt = sqrt;
    Decimal2.sub = sub;
    Decimal2.sum = sum;
    Decimal2.tan = tan;
    Decimal2.tanh = tanh;
    Decimal2.trunc = trunc;
    if (obj === void 0) obj = {};
    if (obj) {
      if (obj.defaults !== true) {
        ps = ["precision", "rounding", "toExpNeg", "toExpPos", "maxE", "minE", "modulo", "crypto"];
        for (i = 0; i < ps.length; ) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
      }
    }
    Decimal2.config(obj);
    return Decimal2;
  }
  function div(x, y) {
    return new this(x).div(y);
  }
  function exp(x) {
    return new this(x).exp();
  }
  function floor(x) {
    return finalise(x = new this(x), x.e + 1, 3);
  }
  function hypot() {
    var i, n, t = new this(0);
    external = false;
    for (i = 0; i < arguments.length; ) {
      n = new this(arguments[i++]);
      if (!n.d) {
        if (n.s) {
          external = true;
          return new this(1 / 0);
        }
        t = n;
      } else if (t.d) {
        t = t.plus(n.times(n));
      }
    }
    external = true;
    return t.sqrt();
  }
  function isDecimalInstance(obj) {
    return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
  }
  function ln(x) {
    return new this(x).ln();
  }
  function log(x, y) {
    return new this(x).log(y);
  }
  function log2(x) {
    return new this(x).log(2);
  }
  function log10(x) {
    return new this(x).log(10);
  }
  function max() {
    return maxOrMin(this, arguments, -1);
  }
  function min() {
    return maxOrMin(this, arguments, 1);
  }
  function mod(x, y) {
    return new this(x).mod(y);
  }
  function mul(x, y) {
    return new this(x).mul(y);
  }
  function pow(x, y) {
    return new this(x).pow(y);
  }
  function random(sd) {
    var d, e, k, n, i = 0, r = new this(1), rd = [];
    if (sd === void 0) sd = this.precision;
    else checkInt32(sd, 1, MAX_DIGITS);
    k = Math.ceil(sd / LOG_BASE);
    if (!this.crypto) {
      for (; i < k; ) rd[i++] = Math.random() * 1e7 | 0;
    } else if (crypto.getRandomValues) {
      d = crypto.getRandomValues(new Uint32Array(k));
      for (; i < k; ) {
        n = d[i];
        if (n >= 429e7) {
          d[i] = crypto.getRandomValues(new Uint32Array(1))[0];
        } else {
          rd[i++] = n % 1e7;
        }
      }
    } else if (crypto.randomBytes) {
      d = crypto.randomBytes(k *= 4);
      for (; i < k; ) {
        n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 127) << 24);
        if (n >= 214e7) {
          crypto.randomBytes(4).copy(d, i);
        } else {
          rd.push(n % 1e7);
          i += 4;
        }
      }
      i = k / 4;
    } else {
      throw Error(cryptoUnavailable);
    }
    k = rd[--i];
    sd %= LOG_BASE;
    if (k && sd) {
      n = mathpow(10, LOG_BASE - sd);
      rd[i] = (k / n | 0) * n;
    }
    for (; rd[i] === 0; i--) rd.pop();
    if (i < 0) {
      e = 0;
      rd = [0];
    } else {
      e = -1;
      for (; rd[0] === 0; e -= LOG_BASE) rd.shift();
      for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;
      if (k < LOG_BASE) e -= LOG_BASE - k;
    }
    r.e = e;
    r.d = rd;
    return r;
  }
  function round(x) {
    return finalise(x = new this(x), x.e + 1, this.rounding);
  }
  function sign(x) {
    x = new this(x);
    return x.d ? x.d[0] ? x.s : 0 * x.s : x.s || NaN;
  }
  function sin(x) {
    return new this(x).sin();
  }
  function sinh(x) {
    return new this(x).sinh();
  }
  function sqrt(x) {
    return new this(x).sqrt();
  }
  function sub(x, y) {
    return new this(x).sub(y);
  }
  function sum() {
    var i = 0, args = arguments, x = new this(args[i]);
    external = false;
    for (; x.s && ++i < args.length; ) x = x.plus(args[i]);
    external = true;
    return finalise(x, this.precision, this.rounding);
  }
  function tan(x) {
    return new this(x).tan();
  }
  function tanh(x) {
    return new this(x).tanh();
  }
  function trunc(x) {
    return finalise(x = new this(x), x.e + 1, 1);
  }
  P[Symbol.for("nodejs.util.inspect.custom")] = P.toString;
  P[Symbol.toStringTag] = "Decimal";
  var Decimal = P.constructor = clone(DEFAULTS);
  LN10 = new Decimal(LN10);
  PI = new Decimal(PI);

  // graphing.ts
  function add2(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
  }
  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }
  function scale(v, s) {
    return [v[0] * s, v[1] * s];
  }
  function midpoint(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }
  function distance(a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  function direction(a, b) {
    const d = subtract(b, a);
    const len = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
    return [d[0] / len, d[1] / len];
  }
  function isVec2(v) {
    return Array.isArray(v) && v.length === 2 && isNumber(v[0]) && isNumber(v[1]);
  }
  function isLine(v) {
    return Array.isArray(v) && v.length === 4 && isNumber(v[0]) && isNumber(v[1]) && isNumber(v[2]) && isNumber(v[3]);
  }
  function isArc(v) {
    return Array.isArray(v) && v.length === 5 && isNumber(v[0]) && isNumber(v[1]) && isNumber(v[2]) && isNumber(v[3]) && isNumber(v[4]);
  }
  function addMinimalToGraph(graph, minimal) {
    let nextPointId = Math.max(...Object.keys(graph.points).map(Number), 0) + 1;
    let nextCurveId = Math.max(...Object.keys(graph.curves).map(Number), 0) + 1;
    const addPoint = (point) => {
      const id = nextPointId++;
      graph.points[id] = point;
      return id;
    };
    const findOrAddPoint = (point) => {
      for (const [id2, p] of Object.entries(graph.points)) {
        if (distance(p, point) < 1e-14) {
          return Number(id2);
        }
      }
      const id = nextPointId++;
      graph.points[id] = point;
      return id;
    };
    for (const item of minimal) {
      if (isVec2(item)) {
        addPoint(item);
      } else if (isLine(item)) {
        let start = findOrAddPoint([item[0], item[1]]);
        let end = findOrAddPoint([item[2], item[3]]);
        graph.curves[nextCurveId++] = { type: "line", start, end };
      } else if (isArc(item)) {
        let start = findOrAddPoint([item[0], item[1]]);
        let end = findOrAddPoint([item[2], item[3]]);
        graph.curves[nextCurveId++] = { type: "arc", start, end, bulge: item[4] };
      }
    }
    return graph;
  }
  function isPositionedLine(obj) {
    return obj?.type === "line" && isVec2(obj.start) && isVec2(obj.end);
  }
  function isPositionedArc(obj) {
    return obj?.type === "arc" && isVec2(obj.start) && isVec2(obj.end) && isNumber(obj.bulge);
  }
  function isPositionedSegments(data) {
    if (!Array.isArray(data)) {
      return null;
    }
    for (const item of data) {
      if (!isPositionedLine(item) && !isPositionedArc(item)) {
        return null;
      }
    }
    return data;
  }
  function addPositionedSegmentsToGraph(graph, segments) {
    let nextPointId = Math.max(...Object.keys(graph.points).map(Number), 0) + 1;
    let nextCurveId = Math.max(...Object.keys(graph.curves).map(Number), 0) + 1;
    const findOrAddPoint = (point) => {
      for (const [id2, p] of Object.entries(graph.points)) {
        if (distance(p, point) < 1e-14) {
          return Number(id2);
        }
      }
      const id = nextPointId++;
      graph.points[id] = point;
      return id;
    };
    for (const seg of segments) {
      const start = findOrAddPoint(seg.start);
      const end = findOrAddPoint(seg.end);
      if (seg.type === "line") {
        graph.curves[nextCurveId++] = { type: "line", start, end };
      } else {
        graph.curves[nextCurveId++] = { type: "arc", start, end, bulge: seg.bulge };
      }
    }
    return graph;
  }
  function indexOfMatchingBracket(text, openBracket, closeBracket, startIndex) {
    let depth = 0;
    for (let i = startIndex; i < text.length; i++) {
      if (text[i] === openBracket) {
        depth++;
      } else if (text[i] === closeBracket) {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
    return void 0;
  }
  function extractFirstPositionedSegments(text) {
    console.log(text);
    const firstBracketIndex = text.indexOf("[");
    const matchingBracketIndex = indexOfMatchingBracket(text, "[", "]", firstBracketIndex);
    if (matchingBracketIndex == null) {
      return null;
    }
    try {
      const segments = JSON.parse(text.slice(firstBracketIndex, matchingBracketIndex + 1));
      console.log(segments);
      if (!isPositionedSegments(segments)) {
        return null;
      }
      const remainder = text.slice(matchingBracketIndex + 1);
      return { segments, remainder };
    } catch (e) {
      return null;
    }
  }
  function extractGraph(text) {
    const defaultResult = {
      graph: { points: {}, curves: {} },
      remainder: text
    };
    const firstBracketIndex = text.indexOf("{");
    if (firstBracketIndex === -1) {
      return defaultResult;
    }
    const matchingBracketIndex = indexOfMatchingBracket(text, "{", "}", firstBracketIndex);
    if (matchingBracketIndex == null) {
      return defaultResult;
    }
    const graphText = text.slice(firstBracketIndex, matchingBracketIndex + 1);
    const graph = asGraph(JSON.parse(graphText));
    if (graph == null) {
      return defaultResult;
    }
    const remainder = text.replace(graphText, "");
    return { graph, remainder };
  }
  function parseMinimal(text) {
    const result = [];
    let processedText = text;
    const additionBlockRegex = /\(\s*\+\s*([-\d\.]+),?\s*([-\d\.]+)\s*([-\d\.]+),?\s*([-\d\.]+)\s*\)/g;
    processedText = processedText.replace(additionBlockRegex, (match, x1, y1, x2, y2) => {
      const vec1 = [parseFloat(x1), parseFloat(y1)];
      const vec2 = [parseFloat(x2), parseFloat(y2)];
      const sum2 = add2(vec1, vec2);
      return `${sum2[0]}, ${sum2[1]}`;
    });
    console.log(processedText);
    for (const line of processedText.split("\n")) {
      let trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith("//")) {
        continue;
      }
      trimmed = trimmed.replace(/[\[\],]/g, " ");
      const parts = trimmed.split(" ").filter((v) => v != "" && v != null).map(Number);
      if (parts.length === 2 || parts.length === 4 || parts.length === 5) {
        result.push(parts);
      }
    }
    return result;
  }
  function isNumber(n) {
    return typeof n === "number" && !isNaN(n);
  }
  function asNumber(n) {
    if (typeof n === "string") {
      return Number(n);
    }
    return n;
  }
  function asGraph(data) {
    if (data.points == null) {
      console.log("data.points is null");
      return null;
    }
    for (const _pointId of Object.keys(data.points)) {
      const pointId = Number(_pointId);
      const point = data.points[pointId];
      if (!Array.isArray(point) || point.length !== 2) {
        return null;
      }
    }
    for (const _curveId of Object.keys(data.curves)) {
      const curveId = Number(_curveId);
      const curve = data.curves[curveId];
      if (curve.type === "line") {
        if (!isNumber(curve.start) || !isNumber(curve.end)) {
          return null;
        }
      } else if (curve.type === "arc") {
        if (!isNumber(curve.start) || !isNumber(curve.end) || !isNumber(curve.bulge)) {
          return null;
        }
      } else {
        return null;
      }
    }
    return data;
  }
  function isInView(_x, _y) {
    const x = _x instanceof Decimal ? _x.toNumber() : _x;
    const y = _y instanceof Decimal ? _y.toNumber() : _y;
    return x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
  }
  function drawPoint(ctx2, x, y) {
    if (isInView(x, y)) {
      ctx2.beginPath();
      ctx2.arc(x, y, 3, 0, Math.PI * 2);
      ctx2.fill();
    }
  }
  function drawDecimalLine(ctx2, startX, startY, endX, endY) {
    const d_canvasWidth = new Decimal(canvasWidth);
    const d_canvasHeight = new Decimal(canvasHeight);
    let t0 = new Decimal(0);
    let t1 = new Decimal(1);
    const dx = endX.minus(startX);
    const dy = endY.minus(startY);
    const p = [dx.neg(), dx, dy.neg(), dy];
    const q = [
      startX,
      d_canvasWidth.minus(startX),
      startY,
      d_canvasHeight.minus(startY)
    ];
    for (let i = 0; i < 4; i++) {
      const p_i = p[i];
      const q_i = q[i];
      if (p_i.isZero()) {
        if (q_i.isNegative()) {
          return;
        }
      } else {
        const r = q_i.div(p_i);
        if (p_i.isNegative()) {
          t0 = Decimal.max(t0, r);
        } else {
          t1 = Decimal.min(t1, r);
        }
      }
    }
    if (t0.greaterThan(t1)) {
      return;
    }
    const clipStartX = startX.plus(t0.times(dx));
    const clipStartY = startY.plus(t0.times(dy));
    const clipEndX = startX.plus(t1.times(dx));
    const clipEndY = startY.plus(t1.times(dy));
    ctx2.beginPath();
    ctx2.moveTo(clipStartX.toNumber(), clipStartY.toNumber());
    ctx2.lineTo(clipEndX.toNumber(), clipEndY.toNumber());
    ctx2.stroke();
  }
  var BULGE_STRAIGHT_LINE_THRESHOLD = 1e-6;
  var canvas = document.getElementById("drawing-canvas");
  var ctx = canvas.getContext("2d");
  var textarea = document.getElementById("input-text");
  var normalizedTextarea = document.getElementById(
    "normalized-text"
  );
  var cursorOverlayEl = null;
  document.getElementById("reset-button").addEventListener("click", function() {
    zoomLevel = 1;
    dataOffsetX = 0;
    dataOffsetY = 0;
    drawGraph();
    saveGraphData();
  });
  var filteredVertexIds = /* @__PURE__ */ new Set();
  var url = new URL(window.location.href);
  var fileId = url.searchParams.get("file_id") ?? Math.random().toString(36).substring(2);
  var outputFormat = "js";
  document.getElementById("format-toggle").addEventListener("click", function() {
    outputFormat = outputFormat === "js" ? "rust" : "js";
    this.textContent = `Format: ${outputFormat.toUpperCase()}`;
    drawGraph();
  });
  var zoomLevel = 1;
  var dataOffsetX = 0;
  var dataOffsetY = 0;
  var dataScale = 1;
  var isDragging = false;
  var lastMouseX = 0;
  var lastMouseY = 0;
  var dataWidth = 100;
  var dataHeight = 100;
  var dataCenterX = 0;
  var dataCenterY = 0;
  var finalDataWidth = 100;
  var finalDataHeight = 100;
  var margin = 30;
  var canvasWidth = canvas.width / window.devicePixelRatio;
  var canvasHeight = canvas.height / window.devicePixelRatio;
  var availableWidth = canvasWidth - margin * 2;
  var availableHeight = canvasHeight - margin * 2;
  var canvasCenterX = canvasWidth / 2;
  var canvasCenterY = canvasHeight / 2;
  function transformDataX(dataX) {
    const d_dataX = new Decimal(dataX);
    const d_dataCenterX = new Decimal(dataCenterX);
    const d_dataOffsetX = new Decimal(dataOffsetX);
    const d_canvasCenterX = new Decimal(canvasCenterX);
    const d_dataScale = new Decimal(dataScale);
    const x = d_dataX.minus(d_dataCenterX).plus(d_dataOffsetX);
    return d_canvasCenterX.plus(x.times(d_dataScale));
  }
  function transformDataY(dataY) {
    const d_dataY = new Decimal(dataY);
    const d_dataCenterY = new Decimal(dataCenterY);
    const d_dataOffsetY = new Decimal(dataOffsetY);
    const d_canvasCenterY = new Decimal(canvasCenterY);
    const d_dataScale = new Decimal(dataScale);
    const y = d_dataY.minus(d_dataCenterY).plus(d_dataOffsetY);
    return d_canvasCenterY.minus(y.times(d_dataScale));
  }
  function screenToData(screenX, screenY) {
    const dataX = dataCenterX - dataOffsetX + (screenX - canvasCenterX) / dataScale;
    const dataY = dataCenterY - dataOffsetY + (canvasCenterY - screenY) / dataScale;
    return [dataX, dataY];
  }
  var MIN_ZOOM = 0.1;
  var MAX_ZOOM = 1e15;
  var ZOOM_MULTIPLIER = 1.1;
  var SHIFT_ZOOM_MULTIPLIER = 10;
  var SHIFT_ZOOM_WHEEL_MULTIPLIER = 2;
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
  function resizeCanvas() {
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    drawGraph();
  }
  var minimalisticExample = `
// Points (x y)
1.1649 -3.3265
2.2611 -2.2679
2.9646 -5.1902

// Lines (x1 y1 x2 y2)
1.1649 -3.3265 2.2611 -2.2679
2.9646 -5.1902 4.0608 -4.1315
1.1649 -3.3265 1.6678 -3.8473
2.2611 -2.2679 2.9737 -3.0058
2.9737 -3.0058 3.7544 -3.8142
3.7544 -3.8142 4.0608 -4.1315
1.6678 -3.8473 2.3768 -4.5815
2.3768 -4.5815 2.9646 -5.1902

// Arcs (x1 y1 x2 y2 bulge)
1.4528 -4.5088 1.6678 -3.8473 -0.1039
1.6678 -3.8473 2.9737 -3.0058 -0.2432
2.9737 -3.0058 4.0771 -3.2851 -0.1732
4.0771 -3.2851 3.7544 -3.8142 -0.0717
3.7544 -3.8142 2.3768 -4.5815 -0.1879
2.3768 -4.5815 1.4528 -4.5088 -0.1079
`;
  function resetZoomAndPan() {
    zoomLevel = 1;
    dataOffsetX = 0;
    dataOffsetY = 0;
  }
  function loadGraphData() {
    const savedData = window.localStorage.getItem(fileId);
    resetZoomAndPan();
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        textarea.value = data.text;
        if (data.view) {
          zoomLevel = data.view.zoomLevel;
          dataOffsetX = data.view.dataOffsetX;
          dataOffsetY = data.view.dataOffsetY;
        }
      } catch (e) {
        textarea.value = savedData;
      }
      drawGraph();
    } else {
      textarea.value = minimalisticExample;
      drawGraph();
    }
  }
  function saveGraphData() {
    const data = {
      text: textarea.value,
      view: {
        zoomLevel,
        dataOffsetX,
        dataOffsetY
      }
    };
    window.localStorage.setItem(fileId, JSON.stringify(data));
  }
  function arcSegmentToArcDef(segment) {
    const { start, end, bulge } = segment;
    const chordMidpoint = midpoint(start, end);
    if (Math.abs(bulge) < BULGE_STRAIGHT_LINE_THRESHOLD) {
      return {
        center: chordMidpoint,
        startAngle: 0,
        endAngle: 0,
        angle: 0,
        radius: Infinity,
        bulgeSign: 0
      };
    }
    const chordLength = distance(start, end);
    const sagitta = chordLength / 2 * bulge;
    const angle = Math.atan(bulge) * 4;
    const half\u03B8 = Math.abs(angle) / 2;
    const radius = chordLength / (2 * Math.sin(half\u03B8));
    const chordDir = direction(start, end);
    const perpendicular = [-chordDir[1], chordDir[0]];
    const center = add2(
      chordMidpoint,
      scale(
        perpendicular,
        bulge < 0 ? -radius * Math.abs(Math.cos(half\u03B8)) : radius * Math.abs(Math.cos(half\u03B8))
      )
    );
    const startAngle = Math.atan2(start[1] - center[1], start[0] - center[0]);
    const endAngle = Math.atan2(end[1] - center[1], end[0] - center[0]);
    return {
      center,
      startAngle,
      endAngle,
      angle,
      radius,
      bulgeSign: Math.sign(bulge)
    };
  }
  function tessellateArc2D(arc, numPoints = 20) {
    const arcDef = arcSegmentToArcDef(arc);
    const {
      center,
      angle: deltaAngle,
      startAngle,
      endAngle,
      radius,
      bulgeSign
    } = arcDef;
    if (Math.abs(deltaAngle) < BULGE_STRAIGHT_LINE_THRESHOLD) {
      return [arc.start, arc.end];
    }
    const vpoints = [];
    let startAng = startAngle;
    let endAng = endAngle;
    if (bulgeSign > 0) {
      if (endAng < startAng) {
        endAng += 2 * Math.PI;
      }
    } else {
      if (startAng < endAng) {
        startAng += 2 * Math.PI;
      }
    }
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const angle = startAng * (1 - t) + endAng * t;
      const x = center[0] + radius * Math.cos(angle);
      const y = center[1] + radius * Math.sin(angle);
      vpoints.push([x, y]);
    }
    return vpoints;
  }
  function fixJavascriptUnquotedKeys(inputText) {
    const jsonText = inputText.replace(
      /([{,]\s*)([a-zA-Z0-9_$][a-zA-Z0-9_$]*)\s*:/g,
      '$1"$2":'
    );
    return jsonText;
  }
  function removeTrailingCommasBeforeAllClosingBracesOrBrackets(input) {
    return input.replace(/,\s*\]/g, "]").replace(/,\s*\}/g, "}");
  }
  function removeTrailingSemicolonsFromJSON(input) {
    return input.replace(/;\s*$/, "");
  }
  function replaceSingleQuotesWithDoubleQuotes(input) {
    return input.replace(/'/g, '"');
  }
  function removeCommentsFromJSON(input) {
    const lines = input.split("\n");
    const processedLines = lines.map((line) => {
      const commentIndex = line.indexOf("//");
      if (commentIndex >= 0) {
        return line.substring(0, commentIndex);
      }
      return line;
    });
    return processedLines.join("\n");
  }
  function parseText(text) {
    try {
      text = text.trim();
      text = removeLogPrefixes(text);
      text = removeCommentsFromJSON(text);
      text = replaceSingleQuotesWithDoubleQuotes(
        removeTrailingSemicolonsFromJSON(
          removeTrailingCommasBeforeAllClosingBracesOrBrackets(
            fixJavascriptUnquotedKeys(text)
          )
        )
      );
      const graphExtraction = extractGraph(text);
      let restText = graphExtraction.remainder;
      let graph = graphExtraction.graph;
      console.log(graphExtraction);
      const positionedSegmentsExtraction = extractFirstPositionedSegments(restText);
      console.log(positionedSegmentsExtraction);
      if (positionedSegmentsExtraction) {
        graph = addPositionedSegmentsToGraph(graph, positionedSegmentsExtraction.segments);
        restText = positionedSegmentsExtraction.remainder;
      }
      return addMinimalToGraph(graph, parseMinimal(restText));
    } catch (e) {
      return null;
    }
  }
  function removeLogPrefixes(input) {
    const lines = input.split("\n");
    const processedLines = lines.map((line) => {
      let processed = line.replace(
        /^(?:INFO|ERROR|DEBUG|WARN|TRACE)\s+[\w\/\-\.]+:\d+(?::\d+)?\s+/,
        ""
      );
      processed = processed.replace(/arcol_rust.js:[\d:]+/, "");
      return processed;
    });
    return processedLines.join("\n");
  }
  var redrawTimeout = void 0;
  function triggerRedraw() {
    clearTimeout(redrawTimeout);
    redrawTimeout = setTimeout(function() {
      drawGraph();
      saveGraphData();
    }, 1);
  }
  function drawGraph() {
    ctx.clearRect(
      0,
      0,
      canvas.width / window.devicePixelRatio,
      canvas.height / window.devicePixelRatio
    );
    try {
      let resolvePoint2 = function(pointId) {
        if (data?.points && data.points[pointId]) {
          return data.points[pointId];
        } else {
          console.error(`Could not resolve point ID: ${pointId}`);
          return null;
        }
      };
      var resolvePoint = resolvePoint2;
      let data = parseText(textarea.value);
      if (data == null) {
        return;
      }
      if (Array.isArray(data.curves)) {
        const curvesRecord = {};
        data.curves.forEach((curve, index) => {
          curvesRecord[index] = curve;
        });
        data.curves = curvesRecord;
      }
      updateNormalizedFormat(data);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      if (data.points) {
        Object.values(data.points).forEach((point) => {
          minX = Math.min(minX, point[0]);
          maxX = Math.max(maxX, point[0]);
          minY = Math.min(minY, point[1]);
          maxY = Math.max(maxY, point[1]);
        });
      }
      if (data.curves) {
        Object.values(data.curves).forEach((curve) => {
          const startPoint = resolvePoint2(curve.start);
          const endPoint = resolvePoint2(curve.end);
          if (startPoint && endPoint) {
            minX = Math.min(minX, startPoint[0], endPoint[0]);
            maxX = Math.max(maxX, startPoint[0], endPoint[0]);
            minY = Math.min(minY, startPoint[1], endPoint[1]);
            maxY = Math.max(maxY, startPoint[1], endPoint[1]);
          }
        });
      }
      dataWidth = maxX - minX;
      dataHeight = maxY - minY;
      dataCenterX = minX + dataWidth / 2;
      dataCenterY = minY + dataHeight / 2;
      const paddingFactor = 0.3;
      const paddingAmount = Math.max(dataWidth, dataHeight) * paddingFactor;
      minX = minX - paddingAmount;
      maxX = maxX + paddingAmount;
      minY = minY - paddingAmount;
      maxY = maxY + paddingAmount;
      const adjustedDataWidth = maxX - minX;
      const adjustedDataHeight = maxY - minY;
      const useSquareAspectRatio = true;
      if (useSquareAspectRatio) {
        const maxDimension = Math.max(adjustedDataWidth, adjustedDataHeight);
        if (adjustedDataWidth < maxDimension) {
          const diff = maxDimension - adjustedDataWidth;
          minX -= diff / 2;
          maxX += diff / 2;
        }
        if (adjustedDataHeight < maxDimension) {
          const diff = maxDimension - adjustedDataHeight;
          minY -= diff / 2;
          maxY += diff / 2;
        }
      }
      finalDataWidth = maxX - minX;
      finalDataHeight = maxY - minY;
      canvasWidth = canvas.width / window.devicePixelRatio;
      canvasHeight = canvas.height / window.devicePixelRatio;
      availableWidth = canvasWidth - margin * 2;
      availableHeight = canvasHeight - margin * 2;
      dataScale = zoomLevel * Math.min(
        availableWidth / finalDataWidth,
        availableHeight / finalDataHeight
      );
      canvasCenterX = canvasWidth / 2;
      canvasCenterY = canvasHeight / 2;
      ctx.strokeStyle = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--d-border");
      ctx.lineWidth = 0.5;
      ctx.fillStyle = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--point-color");
      const existingLabels = [];
      if (data.points) {
        for (const [id, point] of Object.entries(data.points)) {
          const x = transformDataX(point[0]).toNumber();
          const y = transformDataY(point[1]).toNumber();
          drawPoint(ctx, x, y);
          ctx.fillStyle = getComputedStyle(
            document.documentElement
          ).getPropertyValue("--text-color");
          ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
          const idLabelText = `${id}`;
          drawLabel(ctx, idLabelText, x + 8, y - 4, x, y, existingLabels);
          const coordLabelText = `(${point[0].toFixed(2)}, ${point[1].toFixed(2)})`;
          drawLabel(ctx, coordLabelText, x + 8, y + 12, x, y, existingLabels);
          ctx.fillStyle = getComputedStyle(
            document.documentElement
          ).getPropertyValue("--point-color");
        }
      }
      if (data.curves) {
        Object.entries(data.curves).forEach(([curveId, curve]) => {
          const startPoint = resolvePoint2(curve.start);
          const endPoint = resolvePoint2(curve.end);
          if (!startPoint || !endPoint) {
            console.error("Couldn't resolve points for curve:", curve);
            return;
          }
          const startX = transformDataX(startPoint[0]);
          const startY = transformDataY(startPoint[1]);
          const endX = transformDataX(endPoint[0]);
          const endY = transformDataY(endPoint[1]);
          ctx.fillStyle = getComputedStyle(
            document.documentElement
          ).getPropertyValue("--point-color");
          ctx.beginPath();
          ctx.arc(startX.toNumber(), startY.toNumber(), 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(endX.toNumber(), endY.toNumber(), 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = getComputedStyle(
            document.documentElement
          ).getPropertyValue("--text-color");
          ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
          const startCoordText = `(${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)})`;
          const endCoordText = `(${endPoint[0].toFixed(2)}, ${endPoint[1].toFixed(2)})`;
          drawLabel(
            ctx,
            startCoordText,
            startX.toNumber() + 8,
            startY.toNumber() + 12,
            startX.toNumber(),
            startY.toNumber(),
            existingLabels
          );
          drawLabel(
            ctx,
            endCoordText,
            endX.toNumber() + 8,
            endY.toNumber() + 12,
            endX.toNumber(),
            endY.toNumber(),
            existingLabels
          );
          if (curve.type === "line") {
            ctx.strokeStyle = getComputedStyle(
              document.documentElement
            ).getPropertyValue("--line-color");
            ctx.lineWidth = 0.5;
            drawDecimalLine(ctx, startX, startY, endX, endY);
            const midX = (startX.toNumber() + endX.toNumber()) / 2;
            const midY = (startY.toNumber() + endY.toNumber()) / 2;
            ctx.fillStyle = getComputedStyle(
              document.documentElement
            ).getPropertyValue("--text-color");
            ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
            drawLabel(ctx, curveId, midX, midY, midX, midY, []);
          } else if (curve.type === "arc") {
            ctx.strokeStyle = getComputedStyle(
              document.documentElement
            ).getPropertyValue("--arc-color");
            ctx.lineWidth = 0.5;
            const arcDef = arcSegmentToArcDef({
              type: "arc",
              start: startPoint,
              end: endPoint,
              bulge: curve.bulge
            });
            if (arcDef.radius === Infinity || Math.abs(arcDef.angle) < BULGE_STRAIGHT_LINE_THRESHOLD) {
              drawDecimalLine(ctx, startX, startY, endX, endY);
              const midX = (startX.toNumber() + endX.toNumber()) / 2;
              const midY = (startY.toNumber() + endY.toNumber()) / 2;
              ctx.fillStyle = getComputedStyle(
                document.documentElement
              ).getPropertyValue("--text-color");
              ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
              drawLabel(ctx, curveId, midX, midY, midX, midY, []);
            } else {
              const points = tessellateArc2D(
                {
                  type: "arc",
                  start: startPoint,
                  end: endPoint,
                  bulge: curve.bulge
                },
                50
              );
              for (let i = 0; i < points.length - 1; i++) {
                drawDecimalLine(ctx, transformDataX(points[i][0]), transformDataY(points[i][1]), transformDataX(points[i + 1][0]), transformDataY(points[i + 1][1]));
              }
              const midPointIndex = Math.floor(points.length / 2);
              const midX = transformDataX(points[midPointIndex][0]).toNumber();
              const midY = transformDataY(points[midPointIndex][1]).toNumber();
              ctx.fillStyle = getComputedStyle(
                document.documentElement
              ).getPropertyValue("--text-color");
              ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
              drawLabel(ctx, curveId, midX, midY, midX, midY, []);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error parsing or drawing:", error);
      ctx.fillStyle = "red";
      ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Error: " + error.message, 20, 30);
    }
    drawScale();
  }
  function drawScale() {
    const scaleX = 20;
    let scaleY = canvasHeight - 20;
    const pixelsPerDataUnit = dataScale;
    const scaleUnits = [
      { value: 1e-15, name: "1fm", color: "#B00020" },
      // Darker Red
      { value: 1e-14, name: "10fm", color: "#C8381C" },
      { value: 1e-12, name: "1pm", color: "#E07018" },
      { value: 1e-11, name: "10pm", color: "#F8A814" },
      { value: 1e-9, name: "1nm", color: "#D4AA00" },
      // Darker Yellow
      { value: 1e-8, name: "10nm", color: "#8F9C00" },
      { value: 1e-6, name: "1\u03BCm", color: "#4A8F00" },
      { value: 1e-5, name: "10\u03BCm", color: "#058200" },
      { value: 1e-4, name: "0.1mm", color: "#007500" },
      // Darker Green
      { value: 1e-3, name: "1mm", color: "#006020" },
      { value: 0.01, name: "1cm", color: "#004B40" },
      { value: 0.1, name: "10cm", color: "#003660" },
      { value: 1, name: "1m", color: "#002180" },
      // Darker Blue
      { value: 10, name: "10m", color: "#2850E0" },
      { value: 100, name: "100m", color: "#5028C8" },
      { value: 1e3, name: "1km", color: "#7800B0" },
      { value: 1e4, name: "10km", color: "#A00098" }
    ];
    let bestScaleIndex = 0;
    let minDiff = Infinity;
    const targetPixels = 100;
    for (let i = 0; i < scaleUnits.length; i++) {
      const scale2 = scaleUnits[i];
      const scalePixels = scale2.value * pixelsPerDataUnit;
      const diff = Math.abs(scalePixels - targetPixels);
      if (diff < minDiff) {
        minDiff = diff;
        bestScaleIndex = i;
      }
    }
    const scalesToShow = [];
    if (bestScaleIndex > 0) {
      scalesToShow.push(scaleUnits[bestScaleIndex - 1]);
    }
    scalesToShow.push(scaleUnits[bestScaleIndex]);
    if (bestScaleIndex < scaleUnits.length - 1) {
      scalesToShow.push(scaleUnits[bestScaleIndex + 1]);
    }
    for (const scale2 of scalesToShow) {
      const scaleLength = scale2.value * pixelsPerDataUnit;
      const cappedLength = Math.min(scaleLength, canvasWidth - scaleX * 2);
      if (cappedLength < 2) continue;
      ctx.strokeStyle = scale2.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scaleX, scaleY);
      ctx.lineTo(scaleX + cappedLength, scaleY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(scaleX, scaleY - 4);
      ctx.lineTo(scaleX, scaleY + 4);
      if (scaleLength < canvasWidth - scaleX * 2) {
        ctx.moveTo(scaleX + cappedLength, scaleY - 4);
        ctx.lineTo(scaleX + cappedLength, scaleY + 4);
      }
      ctx.stroke();
      ctx.fillStyle = scale2.color;
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(scale2.name, scaleX + cappedLength / 2, scaleY - 8);
      scaleY -= 25;
    }
    ctx.textAlign = "left";
  }
  function doRectanglesOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
  }
  function findNonOverlappingPosition(labelRect, existingLabels, labelText) {
    for (let existing of existingLabels) {
      if (existing.text === labelText) {
        return null;
      }
    }
    const offsets = [
      { x: 0, y: 0 },
      { x: 16, y: -16 },
      { x: -16, y: -16 },
      { x: 16, y: 16 },
      { x: -16, y: 16 },
      { x: 20, y: 0 },
      { x: -20, y: 0 },
      { x: 0, y: -20 },
      { x: 0, y: 20 }
    ];
    for (let offset of offsets) {
      const newRect = {
        x: labelRect.x + offset.x,
        y: labelRect.y + offset.y,
        width: labelRect.width,
        height: labelRect.height,
        text: labelText
        // Store the text with the rectangle
      };
      let overlap = false;
      for (let existingLabel of existingLabels) {
        if (doRectanglesOverlap(newRect, existingLabel)) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        return newRect;
      }
    }
    return { ...labelRect, text: labelText };
  }
  function updateNormalizedFormat(data) {
    const normalizedTextarea2 = document.getElementById(
      "normalized-text"
    );
    const filteredData = {
      points: {},
      curves: {}
    };
    if (filteredVertexIds.size > 0) {
      const relevantCurveIds = /* @__PURE__ */ new Set();
      Object.entries(data.curves || {}).forEach(([curveId, curve]) => {
        const startId = typeof curve.start === "number" ? curve.start : null;
        const endId = typeof curve.end === "number" ? curve.end : null;
        if (startId == null || endId == null) {
          return;
        }
        if (filteredVertexIds.has(asNumber(startId)) || filteredVertexIds.has(asNumber(endId))) {
          relevantCurveIds.add(asNumber(curveId));
        }
      });
      const relevantVertexIds = new Set(filteredVertexIds);
      Object.entries(data.curves || {}).forEach(([curveId, curve]) => {
        if (relevantCurveIds.has(asNumber(curveId))) {
          if (typeof curve.start === "number")
            relevantVertexIds.add(curve.start);
          if (typeof curve.end === "number") relevantVertexIds.add(curve.end);
        }
      });
      relevantVertexIds.forEach((id) => {
        if (data.points[id]) {
          filteredData.points[id] = data.points[id];
        }
      });
      relevantCurveIds.forEach((id) => {
        filteredData.curves[id] = data.curves[id];
      });
    } else {
      filteredData.points = data.points;
      filteredData.curves = data.curves;
    }
    normalizedTextarea2.value = outputFormat === "js" ? formatJsObject(filteredData) : formatRustObject(filteredData);
  }
  function isSimpleArray(arr) {
    if (arr.length > 2) return false;
    for (const item of arr) {
      if (typeof item === "object" && item !== null) {
        return false;
      }
    }
    return true;
  }
  function isSimpleObject(obj) {
    const keys = Object.keys(obj);
    if (keys.length > 4) return false;
    if (keys.includes("type") && (keys.includes("start") || keys.includes("end"))) {
      return true;
    }
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        return false;
      }
    }
    return true;
  }
  function shouldRemoveQuotes(key) {
    if (/^\d+$/.test(key)) {
      return true;
    }
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) && !key.includes("-") && !key.includes(" ")) {
      return true;
    }
    return false;
  }
  function formatRustObject(obj) {
    let rustCode = "let mut network = PlanarNetwork::empty();\n\n";
    function formatFloat(num) {
      const n = typeof num === "number" ? num : parseFloat(num);
      return Number.isInteger(n) ? `${n}.0` : n.toString();
    }
    const pointMap = /* @__PURE__ */ new Map();
    Object.entries(obj.points || {}).forEach(([id, point]) => {
      rustCode += `let p${id} = network.set_point(VertexId(${id}), vec2d![${formatFloat(point[0])}, ${formatFloat(point[1])}]);
`;
      pointMap.set(JSON.stringify(point), asNumber(id));
    });
    rustCode += "\n";
    Object.entries(obj.curves || {}).forEach(([curveId, curve]) => {
      const startId = curve.start;
      const endId = curve.end;
      if (curve.type === "line") {
        rustCode += `network.set_line(CurveId(${curveId}), p${startId}, p${endId});
`;
      } else if (curve.type === "arc") {
        rustCode += `network.set_arc(CurveId(${curveId}), p${startId}, p${endId}, ${formatFloat(curve.bulge)});
`;
      }
    });
    return rustCode;
  }
  function formatJsObject(obj, indent = 0) {
    if (obj === null) return "null";
    const indentStr = " ".repeat(indent);
    const innerIndentStr = " ".repeat(indent + 2);
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";
      if (isSimpleArray(obj)) {
        const items = obj.map((item) => formatJsObject(item, 0)).join(", ");
        return `[ ${items} ]`;
      } else {
        const items = obj.map((item) => `${innerIndentStr}${formatJsObject(item, indent + 2)}`).join(",\n");
        return `[
${items}
${indentStr}]`;
      }
    } else if (typeof obj === "object") {
      const keys = Object.keys(obj);
      if (keys.length === 0) return "{}";
      if (isSimpleObject(obj)) {
        const properties = keys.map((key) => {
          const value = formatJsObject(obj[key], 0);
          return shouldRemoveQuotes(key) ? `${key}: ${value}` : `"${key}": ${value}`;
        }).join(", ");
        return `{ ${properties} }`;
      } else {
        const properties = keys.map((key) => {
          const value = formatJsObject(obj[key], indent + 2);
          return `${innerIndentStr}${shouldRemoveQuotes(key) ? key : `"${key}"`}: ${value}`;
        }).join(",\n");
        return `{
${properties}
${indentStr}}`;
      }
    } else if (typeof obj === "string") {
      return `"${obj}"`;
    } else {
      return String(obj);
    }
  }
  function drawLabel(ctx2, text, x, y, pointX, pointY, existingLabels) {
    const labelMetrics = ctx2.measureText(text);
    let labelRect = {
      x,
      y,
      width: labelMetrics.width,
      height: 12,
      text
    };
    const adjustedLabelRect = findNonOverlappingPosition(
      labelRect,
      existingLabels,
      text
    );
    if (adjustedLabelRect) {
      if (adjustedLabelRect.x !== labelRect.x || adjustedLabelRect.y !== labelRect.y) {
        ctx2.strokeStyle = getComputedStyle(
          document.documentElement
        ).getPropertyValue("--text-color");
        ctx2.lineWidth = 0.5;
        ctx2.beginPath();
        ctx2.moveTo(pointX, pointY);
        ctx2.lineTo(adjustedLabelRect.x, adjustedLabelRect.y);
        ctx2.stroke();
      }
      ctx2.fillText(text, adjustedLabelRect.x, adjustedLabelRect.y);
      existingLabels.push(adjustedLabelRect);
      return true;
    }
    return false;
  }
  function init() {
    const canvasContainer = canvas.parentElement;
    if (canvasContainer) {
      if (getComputedStyle(canvasContainer).position === "static") {
        canvasContainer.style.position = "relative";
      }
      cursorOverlayEl = document.createElement("div");
      cursorOverlayEl.style.position = "absolute";
      cursorOverlayEl.style.top = "10px";
      cursorOverlayEl.style.right = "10px";
      cursorOverlayEl.style.padding = "6px 8px";
      cursorOverlayEl.style.borderRadius = "4px";
      cursorOverlayEl.style.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      cursorOverlayEl.style.background = "var(--input-bg-color)";
      cursorOverlayEl.style.color = "var(--text-color)";
      cursorOverlayEl.style.border = "1px solid var(--canvas-border)";
      cursorOverlayEl.style.pointerEvents = "none";
      cursorOverlayEl.style.whiteSpace = "nowrap";
      cursorOverlayEl.style.display = "none";
      canvasContainer.appendChild(cursorOverlayEl);
    }
    function updateCursorOverlayFromClient(clientX, clientY) {
      if (!cursorOverlayEl) return;
      const rect = canvas.getBoundingClientRect();
      const cursorX = clientX - rect.left;
      const cursorY = clientY - rect.top;
      const [dataX, dataY] = screenToData(cursorX, cursorY);
      cursorOverlayEl.textContent = `x: ${dataX.toFixed(6)}, y: ${dataY.toFixed(6)}`;
    }
    normalizedTextarea.addEventListener("click", function() {
      this.select();
    });
    textarea.addEventListener("keydown", function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        let lineStart = text.lastIndexOf("\n", start - 1) + 1;
        if (lineStart === -1) lineStart = 0;
        let lineEnd = text.indexOf("\n", end);
        if (lineEnd === -1) lineEnd = text.length;
        const selectedText = text.substring(lineStart, lineEnd);
        const lines = selectedText.split("\n");
        const allCommented = lines.every((line) => line.trim().startsWith("//"));
        let newText;
        if (allCommented) {
          newText = lines.map((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("//")) {
              const commentStart = line.indexOf("//");
              const afterComment = line.substring(commentStart + 2);
              return line.substring(0, commentStart) + (afterComment.startsWith(" ") ? afterComment.substring(1) : afterComment);
            }
            return line;
          }).join("\n");
        } else {
          newText = lines.map((line) => {
            if (line.trim() === "") return line;
            return line.replace(/^(\s*)/, "$1// ");
          }).join("\n");
        }
        textarea.value = text.substring(0, lineStart) + newText + text.substring(lineEnd);
        textarea.selectionStart = lineStart;
        textarea.selectionEnd = lineStart + newText.length;
        triggerRedraw();
      }
    });
    document.addEventListener("keydown", function(e) {
      if (document.activeElement === textarea) {
        return;
      }
      let multiplier = e.shiftKey ? SHIFT_ZOOM_MULTIPLIER : ZOOM_MULTIPLIER;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomLevel = Math.min(MAX_ZOOM, zoomLevel * multiplier);
        drawGraph();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomLevel = Math.max(MIN_ZOOM, zoomLevel / multiplier);
        drawGraph();
      }
    });
    canvas.addEventListener("mousedown", function(e) {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("mousemove", function(e) {
      if (cursorOverlayEl) {
        cursorOverlayEl.style.display = "block";
        updateCursorOverlayFromClient(e.clientX, e.clientY);
      }
      if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        dataOffsetX += deltaX / dataScale;
        dataOffsetY -= deltaY / dataScale;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        drawGraph();
        saveGraphData();
      }
    });
    canvas.addEventListener("mouseup", function() {
      isDragging = false;
      canvas.style.cursor = "default";
    });
    canvas.addEventListener("mouseleave", function() {
      isDragging = false;
      canvas.style.cursor = "default";
      if (cursorOverlayEl) cursorOverlayEl.style.display = "none";
    });
    canvas.addEventListener("mouseenter", function() {
      canvas.style.cursor = "grab";
      if (cursorOverlayEl) cursorOverlayEl.style.display = "block";
    });
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      setTheme(e.matches ? "dark" : "light");
      drawGraph();
    });
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "visible") {
        setTimeout(resizeCanvas, 1);
      }
    });
    window.addEventListener("focus", function() {
      setTimeout(resizeCanvas, 1);
    });
    resizeCanvas();
    textarea.addEventListener("input", function() {
      triggerRedraw();
    });
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("file_id", fileId);
    window.history.replaceState({}, "", newUrl);
    loadGraphData();
    window.addEventListener("resize", function() {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawGraph();
    });
    textarea.addEventListener("input", function() {
      triggerRedraw();
    });
    document.getElementById("format-input").addEventListener("input", function(e) {
      const input = e.target.value.trim();
      if (!input) {
        filteredVertexIds.clear();
      } else {
        filteredVertexIds = new Set(
          input.split(/[\s,]+/).map((id) => parseInt(id.trim())).filter((id) => !isNaN(id))
        );
      }
      drawGraph();
    });
    canvas.addEventListener("wheel", function(e) {
      e.preventDefault();
      const multiplier = e.shiftKey ? SHIFT_ZOOM_WHEEL_MULTIPLIER : ZOOM_MULTIPLIER;
      if (e.deltaY < 0 || e.shiftKey && e.deltaX < 0) {
        zoomLevel = Math.min(MAX_ZOOM, zoomLevel * multiplier);
      } else if (e.deltaY > 0 || e.shiftKey && e.deltaX > 0) {
        zoomLevel = Math.max(MIN_ZOOM, zoomLevel / multiplier);
      }
      const rect = canvas.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const [dataX, dataY] = screenToData(cursorX, cursorY);
      const newDataScale = zoomLevel * Math.min(
        availableWidth / finalDataWidth,
        availableHeight / finalDataHeight
      );
      dataOffsetX = (cursorX - canvasCenterX) / newDataScale - (dataX - dataCenterX);
      dataOffsetY = (canvasCenterY - cursorY) / newDataScale - (dataY - dataCenterY);
      dataScale = newDataScale;
      drawGraph();
      saveGraphData();
      if (cursorOverlayEl) {
        cursorOverlayEl.style.display = "block";
        updateCursorOverlayFromClient(e.clientX, e.clientY);
      }
    });
  }
  document.addEventListener("DOMContentLoaded", function() {
    init();
  });
})();
/*! Bundled license information:

decimal.js/decimal.mjs:
  (*!
   *  decimal.js v10.5.0
   *  An arbitrary-precision Decimal type for JavaScript.
   *  https://github.com/MikeMcl/decimal.js
   *  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
   *  MIT Licence
   *)
*/
