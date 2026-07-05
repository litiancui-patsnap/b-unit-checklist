Component({
  properties: {
    reviewQueue: {
      type: Array,
      value: []
    }
  },

  data: {},

  methods: {
    onMarkReview(e) {
      const { date, id, mastered } = e.currentTarget.dataset;
      this.triggerEvent('markreview', { date, id, mastered });
    }
  }
});
