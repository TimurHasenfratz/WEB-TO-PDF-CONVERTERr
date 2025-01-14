const puppeteer = require('puppeteer');
const pdfPoppler = require('pdf-poppler');
const path = require('path');
const fs = require('fs');

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

    // Combine the user-provided CSS with the fixed CSS
    const combinedCSS = `${css}`;
    await page.addStyleTag({ content: combinedCSS });

    // Remove lazy loading
    const removeLazyLoadingScript = `
      function removeLazyLoading() {
        const lazyImages = document.querySelectorAll('img[loading], img[data-src], img[data-lazy], img.lazyload');
        lazyImages.forEach(img => {
          if (img.hasAttribute('loading')) {
            img.removeAttribute('loading');
          }
          if (img.hasAttribute('data-src')) {
            img.setAttribute('src', img.getAttribute('data-src'));
            img.removeAttribute('data-src');
          }
        });
      }
      removeLazyLoading();
    `;
    await page.evaluate(removeLazyLoadingScript);

    // If custom JS provided, execute it
    if (js) {
      await page.evaluate(js);
    }

    const pdfPath = '/tmp/example.pdf';
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });

    // Convert PDF to Image (for preview)
    const opts = {
      format: 'png',
      out_dir: '/tmp',
      out_prefix: 'example',
      page: 1
    };
    await pdfPoppler.convert(pdfPath, opts);

    const imagePath = path.join(opts.out_dir, `${opts.out_prefix}-1.png`);

    // Read the image and PDF as buffers
    const pdfBuffer = fs.readFileSync(pdfPath);
    const imageBuffer = fs.readFileSync(imagePath);

    // Clean up
    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        pdfBuffer: pdfBuffer.toString('base64'),  // Return the PDF as base64
        previewImage: imageBuffer.toString('base64') // Return the image as base64
      }),
      isBase64Encoded: true // Important to mark the response as base64
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error generating PDF' })
    };
  }
};
