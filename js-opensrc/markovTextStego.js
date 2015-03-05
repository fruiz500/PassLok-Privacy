//edit by F. Ruiz in lines 15-16. Original matchPattern was filtering out accented characters

/**
 * markovTextStego.js (port from Hernan Moraldo's Python implementation)
 *
 * @author Jackson Thuraisamy
 * @version 0.1.0 (2013-12-27)
 */
var MarkovTextStego = function () {
  var stego = this;

  // Configure options.
  this.lineDelimiter = '!|!'; // MUST NOT HAVE ANY ALPHABETICAL CHARACTERS!
  this.punctuationList = ['.', '.', '.', '.', '.', '.', '.', '.', '?', '!'];
//  this.matchPattern = /([^\W_][\w\.\?\-\\\/\u2019':&]*[^\W_])|[^\W_]|([:;=]\-?['*\(\)\[\]\\\/DdFPp$Ss0OoXx]+)/g;
	this.matchPattern = /[^";:,.?!…“”‘’„‚«»‹›—–―¿¡\\\s\(\)]+/g;				//less aggressive filter, by F. Ruiz

  this.BitField = function (data) {
    var self = this;
    var bitStack = '';
    var bitQueue =  '';
    var remainingBytes = data;

    /**
     * Return total length of BitField as number of bits.
     *
     * @return {number} The number of bits in this BitField.
     */
    this.length = function () {
      return (bitStack.length + remainingBytes.length * 8 + bitQueue.length);
    };

    /**
     * Return all data in this BitField that are stored as bytes.
     *
     * @return {array} A byte array.
     */
    this.getAllBytes = function () {
      if ((bitStack.length) || (bitQueue.length)) {
        console.warn("Cannot get all bytes from BitField; " +
                     "some are not stored as bytes");
      }
      return remainingBytes;
    };

    /**
     * Pop bytes from data and push them to bits cache.
     *
     * @private
     * @param {number} numBytes The number of bytes to pop.
     */
    var popBytes = function (numBytes) {
      if (remainingBytes.length < numBytes) {
        console.warn("Too many bytes specified.");
        numBytes = remainingBytes.length;
      }
      for (var i = 1; i <= numBytes; i++) {
        var byte = remainingBytes.shift();
        var bits = ('00000000' + byte.toString(2)).slice(-8);
        bitStack += bits;
      }
    };

    /**
     * Get at least the number of specified bits ready in bitStack.
     *
     * @private
     * @param {number} numBits The number of bits to get ready.
     */
    var getBitsReady = function (numBits) {
      if (self.length() < numBits) {
        console.warn("Too many bits specified, capping to total length.");
        numBits = self.length();
      } else {
        while (bitStack.length < numBits) {
          var numBytes = Math.ceil((numBits - bitStack.length) / 8.0);
          numBytes = Math.min(remainingBytes.length, numBytes);
          popBytes(numBytes);
          // If there are no remaining bytes, move all bits from bitQueue
          // to bitStack.
          if (remainingBytes.length === 0) {
            bitStack += bitQueue;
            bitQueue = "";
          }
        }
      }
    };

    /**
     * Return the number of specified bits.
     *
     * @param {number} numBits The number of bits to return.
     * @return {string} The bits that have been returned.
     */
    this.getBits = function (numBits) {
      getBitsReady(numBits);
      return bitStack.substr(0, numBits);
    };

    /**
     * Pop the number of specified bits.
     *
     * @param {number} numBits The number of bits to return.
     * @return {string} The bits that have been popped.
     */
    this.popBits = function (numBits) {
      getBitsReady(numBits);
      var retrievedBits = bitStack.substr(0, numBits);
      bitStack = bitStack.slice(numBits);
      return retrievedBits;
    };

    /**
     * Push bits into this BitField.
     *
     * @param {string} The bits to be pushed into this BitField.
     */
    this.pushBits = function (bits) {
      bitStack = bits + bitStack;
      while (bitStack.length >= 8) {
        var i = bitStack.length - 8;
        remainingBytes.unshift(parseInt(bitStack.slice(i), 2));
        bitStack = bitStack.substr(0, i);
      }
    };

    /**
     * Enqueue bits into this BitField.
     *
     * @param {string} The bits to be enqueued into this BitField.
     */
    this.enqueueBits = function (bits) {
      bitQueue += bits;
      while (bitQueue.length >= 8) {
        var i = 8;
        remainingBytes.push(parseInt(bitQueue.substr(0, i), 2));
        bitQueue = bitQueue.slice(i);
      }
    };
  };

  this.NGramModelException = function (message) {
    this.message = message;
  };

  this.NGramModel = function (n) {
    if (n === undefined) {
      n = 2;
    }

    // Initialise private instance variables.
    var model = {};
    var corpus = [];

    // Initialise public instance variables.
    this.n = n;
    this.busy = 0;

    /**
     * Given an array of words, compute the probability for each unique word
     * (case-insensitive) represented as a fraction.
     *
     * @private
     * @param {array} An array of words.
     * @return {array} An array of probabilities for each word.
     */
     var computeProbabilities = function (words) {
      var probabilities = {};
      for (var i = 0; i < words.length; i++) {
        var wordLC = words[i].toLowerCase();
        if (probabilities.hasOwnProperty(wordLC)) {
          probabilities[wordLC][1][0] += 1;
        } else {
          probabilities[wordLC] = [words[i], [1, words.length]];
        }
      }
      // Get an array of the values.
      var values = [];
      for (var probability in probabilities) {
        if (!probabilities.hasOwnProperty(probability)) {
          continue;
        }
        values.push(probabilities[probability]);
      }
      return values;
    };

    /**
     * Given an array of word probabilities, return an array containing each
     * word in the number of times it occurred.
     *
     * @private
     * @param {array} An array of word probabilities from computeProbabilities.
     * @return {array} An array of words.
     */
    var probabilitiesToWordList = function (wordProbabilities) {
      var words = [];
      for (var i = 0; i < wordProbabilities.length; i++) {
        for (var j = 0; j < wordProbabilities[i][1][0]; j++) {
          words.push(wordProbabilities[i][0]);
        }
      }
      return words;
    };


    /**
     * Create an n-gram model.
     *
     * @param {array} newCorpus An array of corpus strings.
     * @return {object} The n-gram model.
     */
    this.import = function (newCorpus) {
      // Set messages instance variable.
      corpus = corpus.concat(newCorpus);
      // Set status.
      this.busy = 1;
      // Split messages into word-splitted lines.
      var i, j, k;
      var lines = [];
      for (i = 0; i < corpus.length; i++) {
        var message_lines = corpus[i].split(/\n|\,|\.(?=\s)|\!|\?/);
        for (j = 0; j < message_lines.length; j++) {
          var trimmed_line = message_lines[j].replace(/^[\s\t]*/, '')
                                             .replace(/[\s\t]*$/, '');
          if (trimmed_line.length > 0) {
            var splitted_line = trimmed_line.match(stego.matchPattern);
            if (splitted_line === null) {
              continue;
            }
            if (splitted_line.length >= n) {
              lines.push([].concat([stego.lineDelimiter],
                                   splitted_line,
                                   [stego.lineDelimiter]));
            }
          }
        }
      }
      // Create map of n-grams.
      var ngrams = {};
      var ngram;
      for (i = 0; i < lines.length; i++) {
        // Process n-grams for each line.
        for (j = 0; j < (lines[i].length - 1); j++) {
          // Create n-gram key.
          if (j < n) {
            ngram = [];
            for (k = 0; k < (n - j); k++) {
              ngram.push(lines[i][0]);
            }
            ngram = ngram.concat(lines[i].slice(1)).slice(0, n);
          } else {
            ngram = lines[i].slice((j + 1) - n).slice(0, n);
          }
          // Lowercase words in n-gram key.
          for (k = 0; k < ngram.length; k++) {
            ngram[k] = ngram[k].toLowerCase();
          }
          // Add value(s) to keys.
          if (ngrams.hasOwnProperty(ngram)) {
            ngrams[ngram].push(lines[i][j + 1]);
          } else {
            ngrams[ngram] = [lines[i][j + 1]];
          }
        }
      }
      // Map n-grams to probabilities.
      var numProbabilities = 0;
      for (ngram in ngrams) {
        // Skip elements that are not ngrams.
        if (!ngrams.hasOwnProperty(ngram)) {
          continue;
        }
        var wordProbabilities = computeProbabilities(ngrams[ngram]);
        numProbabilities += wordProbabilities.length;
        ngrams[ngram] = wordProbabilities;
      }
      // Set status.
      this.busy = 0;
      // Check model for errors.
      if (Object.keys(ngrams).length === 0) {
        throw new stego.NGramModelException(
          'No n-grams were constructed.');
      } else if (numProbabilities <= Object.keys(ngrams).length) {
        throw new stego.NGramModelException(
          'All n-grams have only one outcome.');
      }
      // Set model instance variable.
      if (Object.keys(model).length === 0) {
        model = ngrams;
      }
      // Return n-grams model.
      return ngrams;
    };

    /**
     * Update the n-gram model with new corpus strings.
     *
     * @param {array} newCorpus An array of strings.
     * @return {object} The n-gram model.
     */
    this.update = function (newCorpus) {
      // Throw exception if model was not created.
      if (Object.keys(model).length === 0) {
        throw new stego.NGramModelException(
          'Cannot update a model that has no existing corpus.');
      }
      // Create a model from only the corpus update.
      var updateModel = this.import(newCorpus);
      // Merge updateModel with model.
      for (var ngram in updateModel) {
        // Skip elements that are not ngrams.
        if (model.hasOwnProperty(ngram)) {
          var wordListOriginal = probabilitiesToWordList(model[ngram]);
          var wordListNew = probabilitiesToWordList(updateModel[ngram]);
          var mergedWordList = [].concat(wordListOriginal, wordListNew);
          model[ngram] = computeProbabilities(mergedWordList);
        } else {
          model[ngram] = updateModel[ngram];
        }
      }
      // Return model.
      return model;
    };

    /**
     * Return the n-gram model object.
     *
     * @return {object} The n-gram model.
     */
    this.getModel = function () {
      return model;
    };

    /**
     * Return the corpus array.
     *
     * @return {array} The corpus array.
     */
    this.getCorpus = function () {
      return corpus;
    };
  };

  this.CodecException = function (message) {
    this.message = message;
  };

  this.Codec = function (ngramModel) {
    if (ngramModel === undefined) {
      console.error('Please specify a NGramModel to create a Codec instance.');
      return;
    }

    // Singleton design pattern.
    if (arguments.callee._singletonInstance) {
      return arguments.callee._singletonInstance;
    }
    arguments.callee._singletonInstance = this;

    // Initialise private instance variables.
    var self = this;

    // Initialise public instance variables.
    this.busy = 0;     // 0 = Ready. 1 = Busy.
    this.progress = 0.0;

    /**
     * Change the NGramModel to a different one.
     *
     * @param {NGramModel} newModel
     */
    this.setModel = function (newModel) {
      ngramModel = newModel;
      return ngramModel;
    };

    /*************************************************************************
     * Encoder Methods
     *************************************************************************/
    /**
     * Encode steganographic layer on top of data.
     *
     * @param {string}     data          Data to be encoded.
     * @return {string}    Encoded data.
     */
    this.encode = function (data) {
      // Throw exception if data is empty.
      if (data.length === 0) {
        throw new stego.CodecException('No input data was specified.');
      }
      // Initialise counter.
      var i;
      // Set status.
      this.busy = 1;
      // Set default start word.
      var startWord = [];
      for (i = 0; i < ngramModel.n; i++) {
        startWord.push(stego.lineDelimiter);
      }
      // Create ordinal(char) array of data.
      var dataByteArray = [];
      for (i = 0; i < data.length; i++) {
        dataByteArray.push(data.charCodeAt(i));
      }
      // Encode length of data first.
      var dataLength = dataByteArray.length;
      var dataLengthByteArray = [];
      for (i = 0; i < 4; i++) {
        var byte = dataLength % 256;
        dataLength = (dataLength - byte) / 256;
        dataLengthByteArray.push(byte);
      }
      var dataLengthBitField = new stego.BitField(dataLengthByteArray);
      var dataLengthWordList = encodeBitsToWordList(dataLengthBitField,
                                                    startWord);
      // Encode data.
      var dataBitField = new stego.BitField(dataByteArray);
      var dataWordList = encodeBitsToWordList(dataBitField,
                                              this.startWord);
      // Merge word lists.
      var wordList = [].concat(dataLengthWordList, dataWordList);
      // Add extra words to complete last sentence.
      if (wordList[wordList.length - 1] !== stego.lineDelimiter) {
        var extraWords = finishSentence(wordList[wordList.length - 1],
                                        this.startWord);
        wordList = wordList.concat(extraWords);
      }
      // Convert word list to text.
      var text = wordListToText(wordList);
      // Set status.
      this.busy = 0;
      // Return text.
      return text;
    };

    /**
     * Encode bits to a word list.
     *
     * @private
     * @param {BitField}   bitField
     * @param {array}      startWord
     * @return {array}     An array of words.
     */
    var encodeBitsToWordList = function (bitField, startWord) {
      var words = [];
      var bitRange = ['0', '1'];
      var totalBits = bitField.length();
      var word, wordRange, bitRange2, numBits;
      while (true) {
        // Encode one word.
        wordRange = encodeBitsToWord(bitField, bitRange, startWord);
        word = wordRange[0];
        bitRange = wordRange[1];
        words.push(word);
        // Determine next start word.
        if (word == stego.lineDelimiter) {
          startWord = [];
          for (var i = 0; i < ngramModel.n; i++) {
            startWord.push(stego.lineDelimiter);
          }
        } else {
          startWord = startWord.slice(1);
          startWord.push(word.toLowerCase());
        }
        self.startWord = startWord;
        // Optimisation: remove start of range when identical in both fields.
        bitRange2 = removeCommonBitsFromRange(bitRange);
        numBits = bitRange[0].length - bitRange2[0].length;
        bitField.popBits(numBits);
        bitRange = bitRange2;
        // Set progress.
        self.progress = (totalBits - bitField.length()) / totalBits;
        // Exit when bitField is empty or bitRange has a width of 0.
        if ((bitField.length() === 0) ||
           ((bitField.length() === 1) && (bitRange[0][0] == bitRange[1][0]))) {
          break;
        }
      }
      // Set progress.
      self.progress = 1.0;
      // Return word list.
      return words;
    };

    /**
     * Encode bits to a word.
     *
     * @private
     * @param {BitField}   bitField
     * @param {array[2]}   bitRange
     * @param {array}      startWord
     * @return {array}     An array with the format: [word, bitRange].
     */
    var encodeBitsToWord = function (bitField, bitRange, startWord) {
      // Get probabilities for the start word.
      var wordProbabilities = ngramModel.getModel()[startWord];
      // Compute word ranges.
      var wordRanges = computeWordRanges(bitRange, wordProbabilities,
                                         bitField.length());
      // Seek the right partition for the bits.
      var precision = wordRanges[0][1][0].length;
      var bits = bitField.getBits(precision);
      // Find best word.
      for (var i = 0; i < wordRanges.length; i++) {
        if ((parseInt(wordRanges[i][1][0], 2) <= parseInt(bits, 2)) &&
            (parseInt(wordRanges[i][1][1], 2) >= parseInt(bits, 2))) {
          return wordRanges[i];
        }
      }
    };

    /**
     * Convert a list of words to a text string.
     *
     * @private
     * @param {array} wordList A list of words.
     * @return {string} Text string representing the joined wordList.
     */
    var wordListToText = function (wordList) {
      var text = [];
      var lastWord = stego.lineDelimiter;
      // Iterate through each word in wordList.
      for (var i = 0; i < wordList.length; i++) {
        // Insert first word of sentence (capitalised).
        if ((lastWord == stego.lineDelimiter) &&
            (wordList[i] != stego.lineDelimiter)) {
          text.push(wordList[i][0].toUpperCase() + wordList[i].slice(1));
        }
        // Insert remaining words of sentence.
        if ((text.length > 0) && (lastWord != stego.lineDelimiter)) {
          // Insert word.
          if (wordList[i] != stego.lineDelimiter) {
            text.push(wordList[i]);
          }
          // Insert punctuation.
          if (wordList[i] == stego.lineDelimiter) {
            var j = Math.floor(Math.random() *
                               stego.punctuationList.length);
            var punctuationMark = stego.punctuationList[j];
            text[text.length - 1] += punctuationMark;
          }
        }
        // Set last word.
        lastWord = wordList[i];
      }
      // Return text as a string.
      return text.join(' ');
    };

    /**
     * Finish a sentence given a start word.
     *
     * @private
     * @param {string} startWord
     * @param {string} priorWord
     * @return {array} An array of words that complete the sentence.
     */
    var finishSentence = function (startWord, priorWord) {
      var currentWord = startWord;
      // Lowercase prior words.
      for (var i = 0; i < priorWord.length; i++) {
        priorWord[i] = priorWord[i].toLowerCase();
      }
      var wordList = priorWord;
      while (currentWord !== stego.lineDelimiter) {
        var wordProbabilities = ngramModel.getModel()[priorWord];
        rndWP = Math.floor(Math.random() * wordProbabilities.length);
        currentWord = wordProbabilities[rndWP][0];
        if (currentWord === stego.lineDelimiter) {
          // Add current word to word list.
          wordList.push(currentWord);
        } else {
          // Add current word to word list.
          wordList.push(currentWord);
          // Set new prior word.
          priorWord = wordList.slice(-ngramModel.n);
          // Lowercase prior words.
          for (i = 0; i < priorWord.length; i++) {
            priorWord[i] = priorWord[i].toLowerCase();
          }
        }
      }
      // Return rest of sentence.
      return wordList.slice(ngramModel.n);
    };

    /*************************************************************************
     * Decoder Methods
     *************************************************************************/
    /**
     * Decode steganographic layer from text.
     *
     * @param {string}  text  The encoded data.
     * @return {string}       The original data.
     */
    this.decode = function (text) {
      // Reset number of decoded words.
      this.numDecodedWords = 0;
      // Set status.
      this.busy = 1;
      // Convert text to a word list.
      var wordList = textToWordList(text);
      // Determine length of data.
      var dataLength = 0;
      var priorWord = [];
      for (var i = 0; i < ngramModel.n; i++) {
        priorWord.push(stego.lineDelimiter);
      }
      var bitField = decodeWordListToBitField(wordList, priorWord, 4 * 8);
      var dataLengthByteArray = bitField.getAllBytes().reverse();
      for (i = 0; i < dataLengthByteArray.length; i++) {
        dataLength = dataLength * 256 + dataLengthByteArray[i];
      }
      // Decode data.
      var dataWordList = wordList.slice(this.numDecodedWords + 1);
      bitField = decodeWordListToBitField(dataWordList,
                                          this.startWord,
                                          dataLength * 8);
      var dataByteArray = bitField.getAllBytes();
      // Set status.
      this.busy = 0;
      // Return data as a string.
      var data = '';
      for (i = 0; i < dataByteArray.length; i++) {
        data += String.fromCharCode(dataByteArray[i]);
      }
      return data;
    };

    /**
     * Decode a list of words to a BitField.
     *
     * @private
     * @param {array} wordList
     * @param {array[ngramModel.n]} priorWord
     * @param {number} maxBits The maximum size of the BitField.
     * @return {BitField}
     */
    var decodeWordListToBitField = function (wordList, priorWord, maxBits) {
      var bitRange = ['0', '1'];
      var bitField = new stego.BitField([]);
      var i, j;
      var originalMaxBits = maxBits;
      // Compute bit range for each word.
      for (i = 0; i < wordList.length; i++) {
        bitRange = decodeWordToBitRange(wordList[i],
                                        bitRange,
                                        priorWord,
                                        maxBits - bitField.length());
        // Determine priorWord for next iteration.
        priorWord.push(wordList[i].toLowerCase());
        priorWord = priorWord.slice(-ngramModel.n);
        if (priorWord[priorWord.length - 1] === stego.lineDelimiter) {
          priorWord = [];
          for (j = 0; j < ngramModel.n; j++) {
            priorWord.push(stego.lineDelimiter);
          }
        }
        // Throw exception if prior word is invalid n-gram.
        if (ngramModel.getModel().hasOwnProperty(priorWord) === false) {
          throw new stego.CodecException(
            JSON.stringify(priorWord) + ' is an invalid n-gram.');
        }
        self.startWord = priorWord;
        // Simplify bit range, and add bits to BitField.
        var bitRange2 = removeCommonBitsFromRange(bitRange);
        var numBitsRemoved = bitRange[0].length - bitRange2[0].length;
        if ((numBitsRemoved + bitField.length()) > maxBits) {
          numBitsRemoved = maxBits - bitField.length();
        }
        bitField.enqueueBits(bitRange[0].slice(0, numBitsRemoved));
        bitRange = bitRange2;
        // Set progress.
        self.progress = bitField.length() / originalMaxBits;
        // Exit loop when the bitField has reached maxmium length.
        if (bitField.length() === maxBits) {
          break;
        }
        // Exit loop when the bit range refers to only one number.
        if ((bitField.length() === (maxBits - 1)) &&
            (bitRange[0][0] === bitRange[1][0])) {
            bitField.enqueueBits(bitRange[0][0]);
          break;
        }
      }
      // Set progress.
      self.progress = 1.0;
      self.numDecodedWords = i;
      // Return BitField.
      return bitField;
    };

    /**
     * Decode a word to a bit range.
     *
     * @private
     * @param {string}                   word
     * @param {array[2]}                 bitRange
     * @param {array[ngramModel.n]} priorWord
     * @param {number}                   maxBits
     */
    var decodeWordToBitRange = function (word, bitRange, priorWord, maxBits) {
      // Get probabilities for the prior word.
      var wordProbabilities = ngramModel.getModel()[priorWord];
      // Compute word ranges.
      var wordRanges = computeWordRanges(bitRange, wordProbabilities,
                                         maxBits);
      // Return best range.
      for (var i = 0; i < wordRanges.length; i++) {
        if (wordRanges[i][0].toLowerCase() === word) {
          return wordRanges[i][1];
        }
      }
    };

    /**
     * Convert a text string to a list of words.
     *
     * @private
     * @param {string} text A string of encoded text.
     * @return {array}      A list of words.
     */
    var textToWordList = function (text) {
      // Define word list.
      var textMatcher = new RegExp(stego.matchPattern.source + '|\\.|\\!|\\?',
                                   'g');
      var wordList = text.match(textMatcher);
      // Replace punctuation and convert words to lowercase.
      for (var i = 0; i < wordList.length; i++) {
        if (stego.punctuationList.indexOf(wordList[i]) !== -1) {
          wordList[i] = stego.lineDelimiter;
        } else {
          wordList[i] = wordList[i].toLowerCase();
        }
      }
      // Return word list.
      return wordList;
    };

    /*************************************************************************
     * Common Helper Methods
     *************************************************************************/
    /**
     * Compute a list of word ranges.
     *
     * @private
     * @param {array[2]} bitRange A pair of binary numbers telling what the
     *                            range to subdivide is.
     * @param {array} wordProbabilities A list of words in this format:
     *                                  [word, [numerator, denominator]].
     * @param {number} The maximum length allowed for the range, in bits.
     * @return {array} An array where each element is in this format:
     *                 [word, bitRange]
     */
    var computeWordRanges = function (bitRange, wordProbabilities, maxBits) {
      var denominator = wordProbabilities[0][1][1];
      bitRange = addDigitsToRange(bitRange, denominator, maxBits);
      var integerRange = [parseInt(bitRange[0], 2),
                          parseInt(bitRange[1], 2)];
      var maxDigits = bitRange[0].length;
      // Compute word ranges (float).
      var currentLength = integerRange[1] - integerRange[0];
      var step = currentLength / denominator;
      var base = integerRange[0];
      var start = 0;
      var wordRanges1 = [];
      var i, end;
      for (i = 0; i < wordProbabilities.length; i++) {
          end = start + wordProbabilities[i][1][0] * step;
          wordRanges1.push([wordProbabilities[i][0], [start, end]]);
          start = end;
      }
      wordRanges1[wordRanges1.length - 1][1][1] = integerRange[1] - base;
      // Distribute the actual integer ranges as well as possible.
      start = 0;
      var wordRanges2 = [];
      var newWordRange;
      for (i = 0; i < wordRanges1.length; i++) {
        if (wordRanges1[i][1][1] >= start) {
          newWordRange = [wordRanges1[i][0], [start + base,
                          Math.floor(wordRanges1[i][1][1]) + base]];
          wordRanges2.push(newWordRange);
          start = newWordRange[1][1] - base + 1;
        }
      }
      // Convert integers to binary.
      var zeroPad = new Array(1 + maxDigits).join('0');
      for (i = 0; i < wordRanges2.length; i++) {
        wordRanges2[i][1][0] = (zeroPad + wordRanges2[i][1][0].toString(2))
                               .slice(-maxDigits);
        wordRanges2[i][1][1] = (zeroPad + wordRanges2[i][1][1].toString(2))
                               .slice(-maxDigits);
      }
      // Return word ranges.
      return wordRanges2;
    };

    /**
     * Add digits to binary range.
     *
     * @private
     * @param {array[2]} bitRange A binary range representing a subdivision.
     * @param {number} desiredLength The desired width of the range.
     * @param {number} maxDigits The maximum number of digits to have.
     * @return {array[2]} An updated binary range.
     */
    var addDigitsToRange = function (bitRange, desiredLength, maxDigits) {
      var integerRange = [parseInt(bitRange[0], 2),
                          parseInt(bitRange[1], 2)];
      var currentLength = integerRange[1] - integerRange[0] + 1;
      // Return bitRange if its length is equal or greater than desired.
      if (currentLength >= desiredLength) {
        return bitRange;
      }
      var numExtraDigits = Math.ceil(Math.log(desiredLength / currentLength) /
                                     Math.log(2));
      // Reduce the number of extra digits if it surpasses the given max.
      if (bitRange[0].length + numExtraDigits > maxDigits) {
        numExtraDigits = maxDigits - bitRange[0].length;
      }
      // Add extra digits onto bitRange.
      bitRange[0] += new Array(1 + numExtraDigits).join('0');
      bitRange[1] += new Array(1 + numExtraDigits).join('1');
      // Return updated bitRange.
      return bitRange;
    };

    /**
     * Remove common bits from a binary range.
     *
     * @private
     * @param {array[2]} bitRange A binary range representing a subdivision.
     * @return {array[2]} An updated binary range.
     */
    var removeCommonBitsFromRange = function (bitRange) {
      var bitRange2 = bitRange.slice(0);
      while ((bitRange2[0].length > 1) &&
             (bitRange2[0][0] === bitRange2[1][0])) {
        bitRange2 = [bitRange2[0].slice(1), bitRange2[1].slice(1)];
      }
      return bitRange2;
    };
  };
};