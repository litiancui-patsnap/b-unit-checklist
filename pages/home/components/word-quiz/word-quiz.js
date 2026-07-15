Component({
  properties: {
    quizQuestions: {
      type: Array,
      value: []
    },
    quizAnswers: {
      type: Object,
      value: {}
    },
    currentQuizIndex: {
      type: Number,
      value: 0
    },
    quizScore: {
      type: Number,
      value: 0
    },
    quizAnswered: {
      type: Boolean,
      value: false
    }
  },

  data: {
    currentQuestion: null,
    isLastQuestion: false
  },

  observers: {
    'quizQuestions, currentQuizIndex': function(questions, index) {
      if (questions && questions.length > 0 && index >= 0 && index < questions.length) {
        this.setData({
          currentQuestion: questions[index],
          isLastQuestion: index === questions.length - 1
        });
      } else {
        this.setData({
          currentQuestion: null,
          isLastQuestion: false
        });
      }
    }
  },

  methods: {
    onSelectOption(e) {
      const { index } = e.currentTarget.dataset;
      this.triggerEvent('selectoption', { index });
    },

    onNextQuestion() {
      this.triggerEvent('nextquestion');
    },

    onGenerateQuiz() {
      this.triggerEvent('generatequiz');
    },

    onPlayAudio(e) {
      const { text } = e.currentTarget.dataset;
      this.triggerEvent('playaudio', { text });
    }
  }
});
