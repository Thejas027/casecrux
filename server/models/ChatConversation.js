const mongoose = require("mongoose");

const chatConversationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  context: {
    documentIds: [{ type: mongoose.Schema.Types.ObjectId }],
    summaryIds: [{ type: mongoose.Schema.Types.ObjectId }],
    categories: [String],
    summariesCount: { type: Number, default: 0 },
    recentSummaries: [{
      id: String,
      type: String,
      title: String,
      preview: String
    }]
  },
  settings: {
    language: { type: String, default: 'en' },
    autoTranslate: { type: Boolean, default: false }
  },
  messageCount: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Update lastActivity on any changes
chatConversationSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

const ChatConversation = mongoose.model("ChatConversation", chatConversationSchema);

module.exports = ChatConversation;
