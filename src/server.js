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
  model: { type: String, required: true }
});

const Chat = mongoose.model('Chat', chatSchema);

// Routes
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ id: -1 });
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chats' });
  }
});

app.get('/api/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findOne({ id: req.params.id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ chat });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching chat' });
  }
});

app.post('/api/chats', async (req, res) => {
  try {
    const chat = new Chat(req.body);
    await chat.save();
    res.status(201).json({ id: chat.id });
  } catch (error) {
    res.status(500).json({ error: 'Error creating chat' });
  }
});

app.put('/api/chats', async (req, res) => {
  try {
    const chat = await Chat.findOneAndUpdate(
      { id: req.body.id },
      req.body,
      { new: true }
    );
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ id: chat.id });
  } catch (error) {
    res.status(500).json({ error: 'Error updating chat' });
  }
});

app.delete('/api/chats/:id', async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ id: req.params.id });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting chat' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 