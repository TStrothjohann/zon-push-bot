function HelpMessage(callback) {
  
  var message = {
    text: "Ich kann Ihnen zurzeit Redaktionsempfehlungen und die Serie Fischer im Recht anbieten...",
    quick_replies: [
      {
        "content_type":"text",
        "title":"Fischer im Recht",
        "payload":"fresh-fischer"
      },
      {
        "content_type":"text",
        "title":"Redaktionsempfehlungen",
        "payload":"fresh-news"
      },
      {
        "content_type":"text",
        "title":"Rezepte",
        "payload":"fresh-rezepte"
      },
      {
        "content_type":"text",
        "title":"ZEIT Campus",
        "payload":"fresh-campus"
      }
    ]
  };

  callback(message);

}

module.exports = HelpMessage;