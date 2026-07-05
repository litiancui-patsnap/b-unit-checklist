Component({
  properties: {
    loading: {
      type: Boolean,
      value: false
    },
    error: {
      type: String,
      value: ''
    }
  },

  methods: {
    onRetry() {
      this.triggerEvent('retry');
    }
  }
});
