// netlify/functions/generate-preview.js
exports.handler = async function(event, context) {
    const { url, css, js } = JSON.parse(event.body);
    
    // Hier implementierst du die Logik zur Generierung der Vorschau
    // Zum Beispiel ein Bild oder HTML-Rendering (dies ist ein Platzhalter)
    const previewImage = 'https://example.com/preview.png';
  
    return {
      statusCode: 200,
      body: JSON.stringify({ previewImage })
    };
  };
  