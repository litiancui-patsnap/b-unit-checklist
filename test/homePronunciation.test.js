const assert = require('assert');

let capturedPage = null;
let audioSrc = '';
let playCount = 0;
let toastTitle = '';

global.Page = (page) => {
  capturedPage = page;
};

global.wx = {
  createInnerAudioContext() {
    return {
      set src(value) {
        audioSrc = value;
      },
      get src() {
        return audioSrc;
      },
      onError() {},
      stop() {},
      play() {
        playCount += 1;
      }
    };
  },
  showToast({ title }) {
    toastTitle = title;
  }
};

require('../pages/home/home.js');

const page = {
  ...capturedPage,
  audioContext: null,
  data: {
    config: {
      aiService: {
        enabled: false,
        baseUrl: ''
      }
    }
  },
  setData(patch) {
    Object.assign(this.data, patch);
  }
};

page.playPronunciation({
  currentTarget: {
    dataset: {
      text: 'Hi, I am Alex. Nice to meet you.',
      src: 'https://cdn.example.com/speech/intro_1.m4a'
    }
  }
});

assert.strictEqual(audioSrc, 'https://cdn.example.com/speech/intro_1.m4a');
assert.strictEqual(playCount, 1);

audioSrc = '';
playCount = 0;

page.playPronunciation({
  detail: {
    text: 'Component audio event.',
    src: 'https://cdn.example.com/speech/component.m4a'
  }
});

assert.strictEqual(audioSrc, 'https://cdn.example.com/speech/component.m4a');
assert.strictEqual(playCount, 1);

audioSrc = '';
playCount = 0;
toastTitle = '';

page.playPronunciation({
  currentTarget: {
    dataset: {
      text: 'Could I see the menu, please?'
    }
  }
});

setTimeout(() => {
  assert.strictEqual(audioSrc, '');
  assert.strictEqual(playCount, 0);
  assert.strictEqual(toastTitle, '请先配置发音服务');
  console.log('home pronunciation tests passed');
}, 0);
