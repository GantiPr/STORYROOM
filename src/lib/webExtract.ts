import * as cheerio from 'cheerio';

export async function fetchAndExtractReadableText(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.5",
      "accept-encoding": "gzip, deflate, br",
      "dnt": "1",
      "connection": "keep-alive",
      "upgrade-insecure-requests": "1",
    },
  });

  if (!res.ok) {
    // Return a graceful fallback instead of throwing
    console.warn(`Fetch failed (${res.status}) for ${url}`);
    return {
      title: new URL(url).hostname,
      text: `Unable to access content from ${url} (${res.status} error). This site may block automated requests.`
    };
  }

  const html = await res.text();
  
  try {
    const $ = cheerio.load(html);
    
    // Extract title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  new URL(url).hostname;
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();
    
    // Try to find main content areas
    let contentText = '';
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'main',
      '.story-content', // Medium-specific
      '.post-body'      // Common blog selector
    ];
    
    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > contentText.length) {
        contentText = content;
      }
    }
    
    // Fallback to body if no specific content area found
    if (!contentText || contentText.length < 100) {
      contentText = $('body').text();
    }
    
    // Clean up the text
    let cleanText = contentText
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')     // Limit consecutive newlines
      .trim();
    
    // Limit length for API efficiency
    if (cleanText.length > 15000) {
      cleanText = cleanText.substring(0, 15000) + '...';
    }
    
    return { 
      title: title || url, 
      text: cleanText || `Content extracted from ${url} but appears to be empty or inaccessible.`
    };
    
  } catch (error) {
    console.warn("HTML parsing failed:", error);
    return parseHtmlFallback(html, url);
  }
}

// Fallback HTML parser for when cheerio fails
function parseHtmlFallback(html: string, url: string): { title: string; text: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || url;

  // Remove script and style tags
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags and decode entities
  let text = cleanHtml.replace(/<[^>]*>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/\n{3,}/g, '\n\n');

  return { title, text: text.slice(0, 10000) }; // Limit length
}
