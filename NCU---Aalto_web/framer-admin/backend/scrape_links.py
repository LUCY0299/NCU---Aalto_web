import urllib.request
import re

req = urllib.request.Request('https://crowded-pictogram-488999.framer.app/', headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # Find all a tags
    links = re.findall(r'<a[^>]+href=[\"\'](.*?)[\"\'][^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
    seen = set()
    for href, text in links:
        if href.startswith('http') and 'framer' in href: continue
        clean_text = re.sub(r'<[^>]+>', '', text).strip()
        if clean_text and href not in seen:
            print(f'{clean_text} -> {href}')
            seen.add(href)
except Exception as e:
    print(f'Error: {e}')
