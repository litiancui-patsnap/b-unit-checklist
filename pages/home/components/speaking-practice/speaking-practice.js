Component({
  properties: {
    sceneTemplates: {
      type: Array,
      value: []
    },
    sceneStats: {
      type: Object,
      value: {
        completedLines: 0,
        totalLines: 0
      }
    }
  },

  data: {},

  methods: {
    onToggleSceneLine(e) {
      const { scene, line } = e.currentTarget.dataset;
      this.triggerEvent('togglescene', { scene, line });
    },

    onPlayAudio(e) {
      const { text, src } = e.currentTarget.dataset;
      this.triggerEvent('playaudio', { text, src });
    }
  }
});
