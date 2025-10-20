#!/usr/bin/env python3
"""
Script to fetch sowpods.txt, filter for 5-letter words, and save to sowpods_5.txt
"""

import urllib.request
import os
from pathlib import Path

def fetch_and_filter_sowpods():
    """Fetch sowpods.txt and filter for 5-letter words in lowercase"""
    
    # URL to fetch from
    url = "https://web.mit.edu/jesstess/www/sowpods.txt"
    
    # Output directory
    output_dir = Path("public/wordlists")
    output_file = output_dir / "sowpods_5.txt"
    
    # Create directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Fetching {url}...")
    
    try:
        # Fetch the file
        with urllib.request.urlopen(url) as response:
            content = response.read().decode('utf-8')
        
        print(f"Downloaded {len(content)} bytes")
        
        # Split into lines and filter
        lines = content.strip().split('\n')
        print(f"Total words in sowpods: {len(lines)}")
        
        # Filter for 5-letter words and convert to lowercase
        five_letter_words = []
        for word in lines:
            word = word.strip().lower()
            if len(word) == 5 and word.isalpha():
                five_letter_words.append(word)
        
        print(f"Found {len(five_letter_words)} 5-letter words")
        
        # Sort and remove duplicates
        five_letter_words = sorted(set(five_letter_words))
        print(f"After deduplication: {len(five_letter_words)} unique words")
        
        # Write to output file
        with open(output_file, 'w', encoding='utf-8') as f:
            for word in five_letter_words:
                f.write(word + '\n')
        
        print(f"✓ Successfully saved to {output_file}")
        print(f"File size: {os.path.getsize(output_file)} bytes")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    fetch_and_filter_sowpods()

