import sys
from weasyprint import HTML

base_url = "http://localhost:3000"
html_file_path = sys.argv[1]
id = sys.argv[2]

# Read the HTML content from the file
with open(html_file_path, 'r') as file:
    html_string = file.read()

html = HTML(string=html_string, base_url=base_url)
result = html.write_pdf(f"pdfs/{id}.pdf")