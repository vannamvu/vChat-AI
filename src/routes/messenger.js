const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const MessengerService = require('../services/MessengerService');
const ConversationService = require('../services/ConversationService');

// Webhook verification
router.get('/', (req, res) => {
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook handler for receiving messages
router.post('/', async (req, res) => {
  const body = req.body;

  // Verify webhook signature
  if (!verifyWebhookSignature(req)) {
    console.log('❌ Invalid webhook signature');
    return res.sendStatus(403);
  }

  if (body.object === 'page') {
    // Process each entry
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];
      console.log('📨 Received webhook event:', JSON.stringify(webhookEvent, null, 2));

      // Get sender PSID
      const senderPsid = webhookEvent.sender.id;

      if (webhookEvent.message) {
        await handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        await handlePostback(senderPsid, webhookEvent.postback);
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Verify webhook signature
function verifyWebhookSignature(req) {
  const signature = req.get('x-hub-signature-256');
  
  if (!signature) {
    console.log('⚠️ No signature found in request');
    return false;
  }

  const signatureHash = signature.split('sha256=')[1];
  const expectedHash = crypto
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return signatureHash === expectedHash;
}

// Handle incoming messages
async function handleMessage(senderPsid, message) {
  try {
    console.log(`💬 Processing message from ${senderPsid}:`, message.text);

    // Get or create customer
    const customer = await ConversationService.getOrCreateCustomer(senderPsid);
    
    // Get or create conversation
    const conversation = await ConversationService.getOrCreateConversation(customer._id, senderPsid);

    // Add message to conversation
    await ConversationService.addMessage(conversation._id, {
      text: message.text || '',
      attachments: message.attachments || [],
      sender: 'customer',
      messageId: message.mid
    });

    // Process message and get response
    const response = await MessengerService.processMessage(message.text, customer, conversation);

    if (response) {
      // Send response back to user
      await MessengerService.sendMessage(senderPsid, response);

      // Add bot response to conversation
      await ConversationService.addMessage(conversation._id, {
        text: response.text || '',
        attachments: response.attachments || [],
        sender: 'bot'
      });
    }

  } catch (error) {
    console.error('❌ Error handling message:', error);
    
    // Send generic error message
    await MessengerService.sendMessage(senderPsid, {
      text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ với chúng tôi qua hotline: 0971.735.735'
    });
  }
}

// Handle postback (button clicks, quick replies)
async function handlePostback(senderPsid, postback) {
  try {
    console.log(`🔘 Processing postback from ${senderPsid}:`, postback.payload);

    const customer = await ConversationService.getOrCreateCustomer(senderPsid);
    const conversation = await ConversationService.getOrCreateConversation(customer._id, senderPsid);

    // Process postback and get response
    const response = await MessengerService.processPostback(postback.payload, customer, conversation);

    if (response) {
      await MessengerService.sendMessage(senderPsid, response);

      // Add bot response to conversation
      await ConversationService.addMessage(conversation._id, {
        text: response.text || '',
        attachments: response.attachments || [],
        sender: 'bot'
      });
    }

  } catch (error) {
    console.error('❌ Error handling postback:', error);
    
    await MessengerService.sendMessage(senderPsid, {
      text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
    });
  }
}

module.exports = router;