Component({
  properties: {
    dailyContent: {
      type: Object,
      value: null
    },
    contentSourceText: {
      type: String,
      value: '离线内容'
    },
    contentChecks: {
      type: Object,
      value: {}
    }
  },

  data: {},

  methods: {
    onPlayAudio(e) {
      const { text } = e.currentTarget.dataset;
      this.triggerEvent('playaudio', { text });
    },

    onToggleCheck(e) {
      const { key, type } = e.currentTarget.dataset;
      this.triggerEvent('togglecheck', { key, type });
    }
  }
});
