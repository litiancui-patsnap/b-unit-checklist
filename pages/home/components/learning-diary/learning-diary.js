Component({
  properties: {
    diaryText: {
      type: String,
      value: ''
    },
    diaryTemplates: {
      type: Array,
      value: []
    },
    diaryTemplateSourceText: {
      type: String,
      value: '离线模板'
    }
  },

  data: {},

  methods: {
    onDiaryInput(e) {
      this.triggerEvent('diaryinput', { value: e.detail.value });
    },

    onDiaryBlur(e) {
      this.triggerEvent('diaryblur', { value: e.detail.value });
    },

    onUseTemplate(e) {
      const { template } = e.currentTarget.dataset;
      this.triggerEvent('usetemplate', { template });
    },

    onPlayAudio(e) {
      const { text, src } = e.currentTarget.dataset;
      this.triggerEvent('playaudio', { text, src });
    }
  }
});
