function HelpMessage(callback) {
  
  var message = {
    text: "Ich kann Ihnen zurzeit Redaktionsempfehlungen," +
    " neue Artikel aus ZEIT Campus Online, die Serie Fischer im Recht" + 
    "und Rezepte aus dem ZEIT Magazin anbieten. Diese Auswahl können Sie über den Punkt " +
    "Hilfe in Menü jederzeit aufrufen. Wenn Sie bei einem Artikel auf 'Abonnieren' klicken, " +
    "schicke ich Ihnen eine Messenger-Nachricht, sobald ein neuer Artikel der Serie online geht.",
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