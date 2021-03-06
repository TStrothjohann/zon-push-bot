'use strict';
// ?wt_zmc=sm.int.zonaudev.facebook.ref.zeitde.me_bot.link.x&utm_medium=sm&utm_source=facebook_zonaudev_int&utm_campaign=ref&utm_content=zeitde_me_bot_link_x
const 
  bodyParser = require('body-parser'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  request = require('request'),
  fs = require('fs'),
  parseString = require('xml2js').parseString;

var ButtonMessage = require("./message_types/ButtonMessage.js");
var FeedItemCarroussel = require("./message_types/FeedItemCarroussel.js");
var HelpMessage = require("./message_types/HelpMessage.js");
var NewsMessage = require("./message_types/NewsMessage.js");
var Sequelize = require('sequelize');
var sequelize = new Sequelize(process.env.DATABASE_URL);
var User = sequelize.import(__dirname + "/models/User.js");
var Subscription = sequelize.import(__dirname + "/models/Subscription.js");
  Subscription.belongsTo(User);
  User.hasMany(Subscription);
  sequelize.sync()
    .then(function(){
      console.log('connected to database');
    })

var feedList = {
  'subscribe-news': 'http://newsfeed.zeit.de/administratives/wichtige-nachrichten/rss-spektrum-flavoured',
  'subscribe-fischer': 'http://newsfeed.zeit.de/serie/fischer-im-recht/rss-spektrum-flavoured',
  'subscribe-campus': 'http://newsfeed.zeit.de/campus/index/rss-spektrum-flavoured',
  'subscribe-receipes': 'http://newsfeed.zeit.de/thema/kochrezept/rss-spektrum-flavoured',
  'subscribe-gehaltsprotokoll': 'http://newsfeed.zeit.de/serie/das-anonyme-gehaltsprotokoll/rss-spektrum-flavoured',
  'subscribe-10-nach-8': '',
  'subscribe-gesellschaftskritik': '',
  'subscribe-junglinks': '',

}

//Neues Abo: 1. in Feedlist, 2. Abomöglichkeit z.B. QuickReply in Help,
//3. (optional) Sende-Eintrag in sendnews oder broadcast
//4. Subscription Payload -> saveSubscriber
//5. Abbestellen-Eintrag 
//X. Ping in der app, ping in Zapier 

//'subscribe-teilchen' WP-Blog 
//deutschlandkarte
// deutschlandkarte
// jungundlinks
// fischerimrecht
// störungsmelder
// fünfvoracht
// beziehungen
// daswarmeinerettung
// gestrandetin
// martenstein
// indersprechstunde
// betaquiz
// globaldrugsurvey
// kiyaksdeutschstunde
// derneuemann
// ichhabeeinentraum
// sonntagsessen


var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

const APP_SECRET = process.env.MESSENGER_APP_SECRET;
const VALIDATION_TOKEN = process.env.MESSENGER_VALIDATION_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = process.env.SERVER_URL;

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL. 
 * 
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will 
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

app.post('/new-item', function(req, res){
  if(req.param('ping')){
    broadcastNews(false, 'subscribe-news', 1);
    console.log('broadcasted news');        
  }
  if(req.param('fischer')){
    broadcastNews(false, 'subscribe-fischer', 1);
    console.log('broadcasted fischer');
  }
  if(req.param('campus')){
    broadcastNews(false, 'subscribe-campus', 1);
    console.log('broadcasted campus');
  }
  if(req.param('rezepte')){
    broadcastNews(false, 'subscribe-receipes', 1);
    console.log('broadcasted receipes');
  }
  if(req.param('gehaltsprotokolle')){
    broadcastNews(false, 'subscribe-gehaltsprotokoll', 1);
    console.log('broadcasted gehaltsprotokolle');
  }
  res.sendStatus(200);
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the 
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger' 
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam, 
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message' 
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some 
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've 
 * created. If we receive a message with an attachment (image, video, audio), 
 * then we'll simply confirm that we've received the attachment.
 * 
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s", 
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
      switch (quickReplyPayload) {
        case 'fresh-fischer':
          sendNewsMessage(senderID, "subscribe-fischer", 2);
          break;

        case 'fresh-news':
          sendNewsMessage(senderID, "subscribe-news", 3);
          break;

        case 'fresh-rezepte':
          sendNewsMessage(senderID, "subscribe-receipes", 3);
          break;

        case 'fresh-campus':
          sendNewsMessage(senderID, "subscribe-campus", 3);
          break;

        default:
          sendTextMessage(senderID, "Tapped handled quick reply");        
      }

    
    return;
  }

  if (messageText) {
    messageText = messageText.toLowerCase();
    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;

      case 'gif':
        sendGifMessage(senderID);
        break;

      case 'audio':
        sendAudioMessage(senderID);
        break;

      case 'video':
        sendVideoMessage(senderID);
        break;

      case 'file':
        sendFileMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      case 'quick reply':
        sendQuickReply(senderID);
        break;        

      case 'read receipt':
        sendReadReceipt(senderID);
        break;        

      case 'typing on':
        sendTypingOn(senderID);
        break;        

      case 'typing off':
        sendTypingOff(senderID);
        break;        

      case 'account linking':
        sendAccountLinking(senderID);
        break;

      case 'news':
        sendNewsMessage(senderID, "subscribe-news", 3);
        break;

      case 'fischer':
        sendNewsMessage(senderID, "subscribe-fischer", 3);
        break;

      case 'rezepte'
        sendNewsMessage(senderID, "subscribe-receipes", 3);
        break;

      case 'campus'
        sendNewsMessage(senderID, "subscribe-campus", 3);
        break;

      case 'gehaltsprotokoll'
        sendNewsMessage(senderID, "subscribe-gehaltsprotokoll", 3);
        break;

      case 'hilfe'
        sendQuickHelp(senderID);
        break;

      case 'broadcast':
        broadcastNews(senderID, 'subscribe-news', 3);
        broadcastNews(senderID, 'subscribe-fischer', 1);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  switch (payload) {
    case "subscribe-fischer":
      saveSubscriber(payload, senderID);
      break;

    case "subscribe-news":
      saveSubscriber(payload, senderID);
      break;

    case "subscribe-campus":
      saveSubscriber(payload, senderID);
      break;

    case "subscribe-gehaltsprotokoll":
      saveSubscriber(payload, senderID);
      break;

    case "subscribe-receipes":
      saveSubscriber(payload, senderID);
      break;

    case "subscribe-news-off":
      stopSubscription(senderID, "subscribe-news");
      break;
    
    case "subscribe-fischer-off":
      stopSubscription(senderID, "subscribe-fischer");
      break;

    case "subscribe-campus-off":
      stopSubscription(senderID, "subscribe-campus");
      break;

    case "subscribe-gehaltsprotokoll-off":
      stopSubscription(senderID, "subscribe-gehaltsprotokoll");
      break;

    case "subscribe-receipes-off":
      stopSubscription(senderID, "subscribe-receipes");
      break;

    case "get-started":
      sendQuickHelp(senderID);
      break;

    case "help_postback":
      sendQuickHelp(senderID);
      break;


  }  



  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

}

function addASubscription(user, subscription){
  var answer = "Ihr Abo wurde gespeichert.";
  Subscription
    .upsert({ 
      name: subscription,
      active: true,
      interval: "daily",
      userId: user
    },{
      where: {
        name: subscription,
        userId: user
      }
    })
    .then(function(subscr){
      sendTextMessage(user, answer);
    })
}


function saveSubscriber(subscription, user) {
  User
    .findOrCreate({
      where: {pcuid: user}
    }).then(function(u){
      addASubscription(u[0].dataValues.id, subscription);
    })
}

function getRecipients(subscription, callback) {
  Subscription
    .findAll({
      attributes: ['userId'],
      where: {
        name: subscription,
        active: true,
        userId: {$not: null}
      }
    })
    .then(function(subscr){
      var recipientIDs = [];
      for (var i = 0; i < subscr.length; i++) {
        recipientIDs.push(subscr[i].userId.toString());
      }
      
      User.findAll({
        where: {
          id: {
            $in: recipientIDs
          }
        }
      }).then(function(recipients){
        callback(recipients);
      })
    })
}

function stopSubscription(user, subscription){
  User.findOne({ where: { pcuid: user } })
    .then(function(subscriber){
      Subscription.findAll({ 
        where: {
          userId: subscriber.dataValues.id,
          name: subscription
        } 
      }).then(function(subscr){
        for (var i = 0; i < subscr.length; i++) {
          subscr[i].setDataValue('active', false);
          subscr[i].save().then(function(s){
            sendTextMessage(user, "Das Abo ist deaktiviert.")
          })
        }
      })
    })
}
/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "/assets/allofus480.mov"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a file using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/assets/test.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var message = new ButtonMessage(recipientId);
  callSendAPI(message.data);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",        
          timestamp: "1428444852", 
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Action",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Comedy",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Drama",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  };

  callSendAPI(messageData);
}


function sendQuickHelp(recipientId) {
  
  new HelpMessage(function(data){
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: data
    }

    callSendAPI(messageData);  
  })
};

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendNewsMessage(recipientId, subscription, items) {

  new NewsMessage(subscription, feedList[subscription], items, request, parseString, function(data){
    var messageData = {
     recipient: {
        id: recipientId
      },
      message: data
    };

    callSendAPI(messageData);
  })

}

function broadcastNews(recipientID, subscription, items) {

  var feedUrl = feedList[subscription] || feedList['subscribe-news'];

  function sendBroadcast(recipients, data){
    console.log(recipients);
    for (var i = 0; i < recipients.length; i++) {
      var bulkMessageData = {
        recipient: {
          id: recipients[i].dataValues.pcuid
        },
        
        message: data
      };
      callSendAPI(bulkMessageData);
    }
  }


  new FeedItemCarroussel(feedUrl, items, subscription, request, parseString, function(data){
    getRecipients(subscription, function(recipients){
      sendBroadcast(recipients, data);
      var successMessage = "Broadcast verschickt.";
      if(recipientID){
        sendTextMessage(recipientID, successMessage);
      }      
    });
  })
}

// broadcastNews("my-user-pcuid", "my-shiny-subscription", 1);

function getRSS(){
  request.get("http://newsfeed.zeit.de/administratives/wichtige-nachrichten/rss-spektrum-flavoured", function(err, data){
    
    if(err){console.log(err)}
    parseString(data.body, function (err, result) {
      var newsItem = result.rss.channel[0].item[0];

      var imgPath = newsItem.enclosure[0].$.url.replace("original__180x120", "wide__506×262__desktop");
        var bulkMessageData = {
          recipient: {
            id: "recipients"
          },
          message: {
            title: newsItem.title[0],
            text: newsItem.description[0],
            item_url: newsItem.link[0],
            image_url: imgPath
          }
        };

        console.log(bulkMessageData);
    });
  })
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;