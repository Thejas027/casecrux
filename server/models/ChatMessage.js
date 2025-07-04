const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatConversation',
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  metadata: {
    referencedDocuments: [{ type: mongoose.Schema.Types.ObjectId }],
    translatedFrom: String,
    confidence: Number,
    responseType: String, // 'ai-generated', 'rule-based', 'fallback'
    contextUsed: Boolean,
    processingTime: Number,
    tokens: Number
  },
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: Date
  }]
}, {
  timestamps: true
});

// Index for efficient querying
chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;
