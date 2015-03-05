/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
 
  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;
 
    // And make this class extendable
    Class.extend = arguments.callee;
   
    return Class;
  };
})();

var ReedSolomon = Class.extend({
  
  init: function (nSym) {
    this.nSym = nSym || 10;
    this.codec = new ReedSolomon.Codec();
  },
  
  encode: function (str) {
    
    var data = ReedSolomon.Utils.unpack(str);
    
    var chunkSize = 255 - this.nSym;
    var enc = [];
    
    for (var i = 0; i < data.length; i += chunkSize) {
      var chunk = data.slice(i, i + chunkSize);
      enc = enc.concat(this.codec.encodeMsg(chunk, this.nSym))
    }
    
    return enc;
    
  },
  
  decode: function (data) {
    
    var dec = [];
    
    for (var i = 0; i < data.length; i += 255) {
      var chunk = data.slice(i, i+255);
      dec = dec.concat(this.codec.correctMsg(chunk, this.nSym));
    }
    
    return ReedSolomon.Utils.pack(dec);
    
  }
  
});

ReedSolomon.Utils = {
  
  pack: function (bytes) {
    
    var chars = [];
    
    for(var i = 0, n = bytes.length; i < n; i++) {
      chars.push(String.fromCharCode(bytes[i]));
    }
      
    return chars.join('');
    
  },

  unpack: function (str) {
    
    var bytes = [];
    
    for(var i = 0, n = str.length; i < n; i++) {
      bytes.push(str.charCodeAt(i));
    }
    
    return bytes;
  },
  
  arrayFill: function (size, value) {
    
    return Array.apply(null, new Array(size))
      .map(function () { return value; });
      
  },
  
  sliceStep: function(array, from, to, step) {

    var result = Array.prototype.slice.call(array, from, to);
    
    var final = [];
    
    for (var i = result.length - 1; i >= 0; i--) {
        (i % step === 0) && final.push(result[i]);
    };
    
    final.reverse();
    result = final;

    return result;

  }
  
};

ReedSolomon.GaloisField = Class.extend({

  gfExp: ReedSolomon.Utils.arrayFill(512, 1),
  gfLog: ReedSolomon.Utils.arrayFill(256, 0),

  init: function () {

    var x = 1;

    for (var i = 1; i < 255; i++) {
      x <<= 1;
      if (x & 0x100)  x ^= 0x11d;
      this.gfExp[i] = x;
      this.gfLog[x] = i;
    }

    for (var i = 255; i < 512; i++) {
      this.gfExp[i] = this.gfExp[i - 255];
    }

  },

  mul: function (x, y) {
    if (x == 0 || y == 0) return 0;
    return this.gfExp[this.gfLog[x] + this.gfLog[y]];
  },

  div: function (x, y) {
    if (y == 0) throw 'Division by zero.';
    if (x == 0) return 0;

    return this.gfExp[this.gfLog[x] + 255 - this.gfLog[y]];
  },

  polyScale: function (p, x) {

    var r = [];
    for (var i = 0; i < p.length; i++)
      r.push(this.mul(p[i], x));

    return r;
  },

  polyAdd: function (p, q) {

    var pLen = p.length,
        qLen = q.length,
        maxLen = Math.max(pLen, qLen),
        r = ReedSolomon.Utils.arrayFill(maxLen, 0),
        rLen = r.length;

    for (var i = 0; i < pLen; i++)
      r[i + rLen - pLen] = p[i];

    for (var i = 0; i < qLen; i++)
      r[i + rLen - qLen] ^= q[i];

    return r;

  },

  polyMul: function (p, q) {

    var r = ReedSolomon.Utils.arrayFill(p.length + q.length - 1, 0);

    for (var j = 0; j < q.length; j++) {
      for (var i = 0; i < p.length; i++) {
        r[i + j] ^= this.mul(p[i], q[j]);
      }

    }

    return r;

  },

  polyEval: function (p, x) {

    var y = p[0];

    for (var i = 1; i < p.length; i++)
      y = this.mul(y, x) ^ p[i];

    return y;

  }

});

ReedSolomon.Codec = Class.extend({

  init: function () {

    this.gf = new ReedSolomon.GaloisField();

  },

  generatorPoly: function (nSym) {

    var g = [1];

    for (var i = 0; i < nSym; i++) {
      g = this.gf.polyMul(g, [1, this.gf.gfExp[i]]);
    }

    return g;
  },

  encodeMsg: function (msgIn, nSym) {

    if (msgIn.length + nSym > 255)
      throw 'Message too long.';

    var gen = this.generatorPoly(nSym);
    var msgOut = ReedSolomon.Utils.arrayFill(msgIn.length + nSym, 0);

    for (var i = 0; i < msgIn.length; i++)
      msgOut[i] = msgIn[i];

    for (var i = 0; i < msgIn.length; i++) {
      var coef = msgOut[i];
      if (coef != 0) {
        for (var j = 0; j < gen.length; j++) {
          msgOut[i + j] ^= this.gf.mul(gen[j], coef);
        }
      }
    }

    for (var i = 0; i < msgIn.length; i++)
      msgOut[i] = msgIn[i];

    return msgOut;

  },

  calcSyndromes: function (msg, nSym) {

    var r = [];

    for (var i = 0; i < nSym; i++)
      r.push(this.gf.polyEval(msg, this.gf.gfExp[i]));

    return r;

  },

  correctErrata: function (msg, synd, pos) {

    var q = [1];

    for (var i = 0; i < pos.length; i++) {
      var x = this.gf.gfExp[msg.length - 1 - pos[i]];
      var q = this.gf.polyMul(q, [x, 1]);
    }

    var p = synd.slice(0, pos.length);

    p.reverse();

    p = this.gf.polyMul(p, q);
    p = p.slice(p.length - pos.length, p.length);
    q = ReedSolomon.Utils.sliceStep(q, q.length & 1, q.length, 2);

    for (var i = 0; i < pos.length; i++) {
      var x = this.gf.gfExp[pos[i] + 256 - msg.length];
      var y = this.gf.polyEval(p, x);
      var z = this.gf.polyEval(q, this.gf.mul(x, x));
      msg[pos[i]] ^= this.gf.div(y, this.gf.mul(x, z));
    }

    return msg;

  },


  rsFindErrors: function (synd, nMess) {

    var errPoly = [1], oldPoly = [1];
    var newPoly;

    for (var i = 0; i < synd.length; i++) {

      oldPoly.push(0); var delta = synd[i];

      for (var j = 1; j < errPoly.length; j++) {
        delta ^= this.gf.mul(errPoly[
        errPoly.length - 1 - j], synd[i - j])
      }

      if (delta != 0) {
        
        if (oldPoly.length > errPoly.length) {
          newPoly = this.gf.polyScale(oldPoly, delta);
          oldPoly = this.gf.polyScale(errPoly,
            this.gf.div(1, delta));
          errPoly = newPoly;
        }
        errPoly = this.gf.polyAdd(errPoly,
          this.gf.polyScale(oldPoly, delta));
      }

    }

    var errs = errPoly.length - 1;
    if (errs * 2 > synd.length){
		//error msg added by F. Ruiz
		RSerrorMsg();
      throw 'Too many errors to correct';
	}
    var errPos = [];

    for (var i = 0; i < nMess; i++) {
      if (this.gf.polyEval(errPoly, this.gf.gfExp[255-i]) == 0)
        errPos.push(nMess - 1 - i);
    }

    if (errPos.length != errs)
      return null;

    return errPos;

  },

  forneySyndromes: function (synd, pos, nMess) {

    var fsynd = synd.slice(0);

    for (var i = 0; i < pos.length; i++) {
      
      var x = this.gf.gfExp[nMess - 1 - pos[i]];
      
      for (var j = 0; j < fsynd.length - 1; j++) {
        fsynd[j] = this.gf.mul(fsynd[j], x) ^ fsynd[j + 1]
      }
      
      fsynd.pop();
      
    }

    return fsynd;

  },

  correctMsg: function (msgIn, nSym) {

    if (msgIn.length > 255){
		//error msg added by F. Ruiz
		RSerrorMsg();
      throw 'Message too long'
	}
    var msgOut = msgIn.slice(0);
    var erasePos = [];

    for (var i = 0; i < msgOut.length; i++) {

      if (msgOut[i] < 0)  {
        msgOut[i] = 0;
        erasePos.push(i);
      }

    }

    if (erasePos.length > nSym){
		//error msg added by F. Ruiz
		RSerrorMsg();
      throw 'Too many erasures to correct'
	}
    var synd = this.calcSyndromes(msgOut, nSym);

    if (Math.max.apply(null, synd) == 0) {
      return msgOut.slice(0, msgOut.length-nSym);
    }

    var fsynd = this.forneySyndromes(synd, erasePos, msgOut.length);

    var errPos = this.rsFindErrors(fsynd, msgOut.length);

    if (errPos == null){
		//error msg added by F. Ruiz
		RSerrorMsg();
      throw 'Could not locate error'
	}
    msgOut = this.correctErrata(msgOut, synd,
                  erasePos.concat(errPos));
    
    synd = this.calcSyndromes(msgOut, nSym);

    if (Math.max.apply(null, synd) > 0){
		//error msg added by F. Ruiz
		RSerrorMsg();
      throw 'Could not correct message';
	}
    return msgOut.slice(0, -nSym);

  }

});

//error msg added by F. Ruiz
function RSerrorMsg(){
	var msg = 'Error correction failed. Maybe retry without tags.';
	if(tabLinks['dirTab'].className == ''){
		document.getElementById('mainmsg').innerHTML = msg
	}else{
		document.getElementById('lockmsg').innerHTML = msg
	}
}