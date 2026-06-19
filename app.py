import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = "{http://www.w3.org/2005/Atom}"

def clean_html_to_plain_text(html_content):
    """
    Strips HTML tags and normalizes whitespace to produce clean plain text.
    """
    # Replace link tags with just their text or standard format
    # For tweet formatting, we don't necessarily want <a href="...">text</a> to keep the markup.
    # Just the text is fine, as we will include the main release note link anyway.
    text = re.sub(r'<[^>]+>', '', html_content)
    # Clean up whitespace and newlines
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_release_notes(xml_data):
    """
    Parses the Atom XML feed data and extracts individual release note updates.
    """
    root = ET.fromstring(xml_data)
    releases = []
    
    # Atom entries
    entries = root.findall(f"{ATOM_NS}entry")
    
    for entry in entries:
        # Extract basic entry details
        title_el = entry.find(f"{ATOM_NS}title")
        id_el = entry.find(f"{ATOM_NS}id")
        updated_el = entry.find(f"{ATOM_NS}updated")
        
        entry_title = title_el.text.strip() if title_el is not None else "Unknown Date"
        entry_id = id_el.text.strip() if id_el is not None else ""
        entry_updated = updated_el.text.strip() if updated_el is not None else ""
        
        # Get alternate link
        entry_link = ""
        for link_el in entry.findall(f"{ATOM_NS}link"):
            if link_el.get("rel") == "alternate":
                entry_link = link_el.get("href")
                break
        
        # Get content HTML
        content_el = entry.find(f"{ATOM_NS}content")
        content_html = content_el.text if content_el is not None else ""
        
        if not content_html:
            continue
            
        # Split updates by <h3> tags.
        # Format is typically: <h3>Type</h3> <p>Description...</p>
        parts = re.split(r'<h3>(.*?)</h3>', content_html)
        
        if len(parts) <= 1:
            # Fallback if no <h3> tags found
            plain_text = clean_html_to_plain_text(content_html)
            releases.append({
                "id": f"{entry_id}_0",
                "date": entry_title,
                "link": entry_link,
                "updated": entry_updated,
                "type": "Update",
                "description": content_html,
                "plain_text": plain_text
            })
        else:
            # parts[0] is content before the first h3 (usually empty)
            update_idx = 0
            for i in range(1, len(parts), 2):
                if i + 1 < len(parts):
                    update_type = parts[i].strip()
                    update_desc = parts[i+1].strip()
                    
                    if not update_desc:
                        continue
                        
                    # Re-wrap in h3-less description if we want, or just pass as-is.
                    # We pass the description segment.
                    plain_text = clean_html_to_plain_text(update_desc)
                    
                    releases.append({
                        "id": f"{entry_id}_{update_idx}",
                        "date": entry_title,
                        "link": entry_link,
                        "updated": entry_updated,
                        "type": update_type,
                        "description": update_desc,
                        "plain_text": plain_text
                    })
                    update_idx += 1
                    
    return releases

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    try:
        # Fetch the RSS feed
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
            
        releases = parse_release_notes(xml_data)
        return jsonify({
            "status": "success",
            "count": len(releases),
            "releases": releases
        })
    except Exception as e:
        app.logger.error(f"Error fetching/parsing feed: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve release notes: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
