import zipfile
import xml.etree.ElementTree as ET

def read_docx(path):
    try:
        doc = zipfile.ZipFile(path)
        xml_content = doc.read('word/document.xml')
        tree = ET.XML(xml_content)
        namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        paragraphs = tree.findall('.//w:p', namespace)
        
        text = []
        for p in paragraphs:
            texts = [node.text for node in p.findall('.//w:t', namespace) if node.text]
            if texts:
                text.append("".join(texts))
            else:
                text.append("")
                
        return "\n".join(text)
    except Exception as e:
        return str(e)

print(read_docx(r'e:\CNTT\Project\ServiceDesk\Trinhbay\My_ML.docx'))
