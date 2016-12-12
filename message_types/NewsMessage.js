function NewsMessage(feedurl, items, request, parseString, callback) {
  request.get(feedurl, function(err, data){      
    if(err){console.log(err)}
    parseString(data.body, function (err, result) {
      var feedItems = result.rss.channel[0].item
      var messageObject = {};
      messageObject.attachment = {
        type: "template",
        payload: {
          template_type: "generic",
          elements: []
        }
      }

      for (var i = 0; i < items; i++) {     
        var attachmentItem = {
          title: feedItems[i].title[0],
          subtitle: feedItems[i].description[0],
          item_url: feedItems[i].link[0],
          buttons: [{
            type: "web_url",
            url: feedItems[i].link[0],
            title: "Zum Artikel"
          }, {
            type: "postback",
            title: "Abonnieren",
            payload: "subscribe-fischer",
          }],
        };

        if(feedItems[i].enclosure){
          attachmentItem.image_url = feedItems[i].enclosure[0].$.url.replace("original__180x120", "wide__506x262__desktop");
        }

        messageObject.attachment.payload.elements.push(attachmentItem);
      }
      callback(messageObject);
    });
  }) 
}

module.exports = NewsMessage;