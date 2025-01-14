const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  const { url, css, js } = JSON.parse(event.body);

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL is required' })
    };
  }

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Apply custom CSS if provided
    if (css) {
      await page.addStyleTag({ content: css });
    }

    // Execute custom JavaScript if provided
    if (js) {
      await page.evaluate(js);
    }

    // Define the path for the preview image
    const previewImagePath = path.join('/tmp', 'example-1.png');

    // Take a screenshot of the page
    await page.screenshot({ path: previewImagePath });

    await browser.close();

    // Read the image file as a buffer
    const imageBuffer = fs.readFileSync(previewImagePath);

    return {
      statusCode: 200,
      body: JSON.stringify({ previewImage: imageBuffer.toString('base64') }),
      isBase64Encoded: true // Important to mark the response as base64
    };
  } catch (error) {
    console.error('Error generating preview:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error generating preview' })
    };
  }
};