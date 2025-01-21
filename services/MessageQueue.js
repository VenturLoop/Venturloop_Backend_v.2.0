import Bull from 'bull';
import Message from '../models/message.js';

export class MessageQueue {
  constructor() {
    this.messageQueue = new Bull('message-queue', process.env.REDIS_URL);
    this.initialize();
  }

  initialize() {
    this.messageQueue.process(async (job) => {
      const { message, attempts } = job.data;
      
      try {
        // Attempt to deliver message
        await this.deliverMessage(message);
        return { success: true };
      } catch (error) {
        // If max retries reached, mark as failed
        if (attempts >= 3) {
          await Message.findByIdAndUpdate(message._id, { status: 'failed' });
          throw new Error('Max delivery attempts reached');
        }
        // Otherwise, retry
        throw error;
      }
    });
  }

  async addToQueue(message) {
    await this.messageQueue.add({
      message,
      attempts: 0
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }
} 