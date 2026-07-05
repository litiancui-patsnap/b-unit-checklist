Component({
  properties: {
    today: {
      type: String,
      value: ''
    },
    learningGoalText: {
      type: String,
      value: ''
    },
    intensityText: {
      type: String,
      value: ''
    },
    complete: {
      type: Boolean,
      value: false
    },
    progress: {
      type: Number,
      value: 0
    },
    planTotalMinutes: {
      type: Number,
      value: 0
    },
    streak: {
      type: Number,
      value: 0
    },
    reminderEnabled: {
      type: Boolean,
      value: false
    },
    reminderTime: {
      type: String,
      value: ''
    }
  },

  data: {},

  methods: {}
});
