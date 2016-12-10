function FeedItemCarroussel(feedurl, request, parseString, callback) {
  this.data = {};

  request.get(feedurl, function(err, data){      
    if(err){console.log(err)}
    parseString(data.body, function (err, result) {
      var feedItem = result.rss.channel[0].item[0];
      var feedItem2 = result.rss.channel[0].item[1];
      var feedItem3 = result.rss.channel[0].item[2];
      var imgPath = feedItem.enclosure[0].$.url.replace("original__180x120", "wide__506×262__desktop");
      var imgPath2 = feedItem2.enclosure[0].$.url.replace("original__180x120", "wide__506×262__desktop");
      var imgPath3 = feedItem3.enclosure[0].$.url.replace("original__180x120", "wide__506×262__desktop");

      var messageObject = {
            attachment: {
              type: "template",
              payload: {
                template_type: "generic",
                elements: [{
                  title: feedItem.title[0],
                  subtitle: feedItem.description[0],
                  item_url: feedItem.link[0],
                  image_url: imgPath,             
                  buttons: [{
                    type: "web_url",
                    url: feedItem.link[0],
                    title: "Zum Artikel"
                  }, {
                    type: "postback",
                    title: "Abo beenden",
                    payload: "subscribe-news-off"
                  }],
                },
                {
                  title: feedItem2.title[0],
                  subtitle: feedItem2.description[0],
                  item_url: feedItem2.link[0],
                  image_url: imgPath2,               
                  buttons: [{
                    type: "web_url",
                    url: feedItem2.link[0],
                    title: "Zum Artikel"
                  }, {
                    type: "postback",
                    title: "Abo beenden",
                    payload: "subscribe-news-off"
                  }],
                },
                {
                  title: feedItem3.title[0],
                  subtitle: feedItem3.description[0],
                  item_url: feedItem3.link[0],
                  image_url: imgPath3,             
                  buttons: [{
                    type: "web_url",
                    url: feedItem3.link[0],
                    title: "Zum Artikel"
                  }, {
                    type: "postback",
                    title: "Abo beenden",
                    payload: "subscribe-news-off"
                  }],
                }]
              }
            }
          } //End of Message Object
        this.data = messageObject;
        callback(messageObject);          
    });
  }) 
}


module.exports = FeedItemCarroussel;