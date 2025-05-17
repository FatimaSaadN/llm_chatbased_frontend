const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/luxury-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Chat Schema
const chatSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  lastMessage: { type: String, required: true },
  time: { type: String, required: true },
  messages: [{
    role: { type: String, required: true },
    content: { type: String, required: true },
    time: { type: String, required: true }
  }],
  model: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);

// Middleware to update timestamps
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Routes
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 });
    res.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Error fetching chats' });
  }
});

app.get('/api/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findOne({ id: parseInt(req.params.id) });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ chat });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Error fetching chat' });
  }
});

app.post('/api/chats', async (req, res) => {
  try {
    const { id, title, lastMessage, time, messages, model } = req.body;
    
    // Validate required fields
    if (!title || !lastMessage || !messages || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const chat = new Chat({
      id: id || Date.now(),
      title,
      lastMessage,
      time,
      messages,
      model
    });

    await chat.save();
    res.status(201).json({ id: chat.id });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Error creating chat' });
  }
});

app.put('/api/chats', async (req, res) => {
  try {
    const { id, title, lastMessage, time, messages, model } = req.body;
    
    // Validate required fields
    if (!id || !title || !lastMessage || !messages || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const chat = await Chat.findOneAndUpdate(
      { id: parseInt(id) },
      {
        title,
        lastMessage,
        time,
        messages,
        model,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ id: chat.id });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Error updating chat' });
  }
});

app.delete('/api/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ id: parseInt(req.params.id) });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Error deleting chat' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 