"""Read-only research helper. Downloads public institutional PDFs to ignored tmp."""
import concurrent.futures, pathlib, urllib.request, subprocess
from pypdf import PdfReader
root=pathlib.Path(__file__).resolve().parents[1]/"tmp"/"pdfs"
root.mkdir(parents=True,exist_ok=True)
files={
 "harvard":("https://bpb-us-e1.wpmucdn.com/sites.harvard.edu/dist/6/210/files/2025/06/HarvardUniversity_CDS_2024-2025.pdf",[7,8,9]),
 "yale":("https://oir.yale.edu/sites/default/files/yale_cds_2025-26_md_20260616.pdf",[9,10]),
 "princeton":("https://ir.princeton.edu/document/606",[8,9]),
 "amherst":("https://www.amherst.edu/system/files/C.%20First-Time%20First-Year%20Admission%202025-26_0.pdf",[1,2]),
 "dartmouth":("https://www.dartmouth.edu/oir/pdfs/cds_2025-26.pdf",[7]),
 "bowdoin":("https://www.bowdoin.edu/ir/pdf/bowdoin-cds_2025-2026.pdf",[13,14,16]),
 "brown":("https://oir.brown.edu/sites/default/files/2020-04/CDS_2024_2025.pdf",[7,8,9]),
}
def fetch(item):
 name,(url,pages)=item
 try:
  target=root/f"{name}.pdf"
  if not target.exists(): target.write_bytes(urllib.request.urlopen(url,timeout=35).read())
  doc=PdfReader(target)
  for p in pages:
   subprocess.run(["pdftoppm","-f",str(p+1),"-l",str(p+1),"-singlefile","-scale-to","1500","-png",str(target),str(root/f"{name}-{p}")],check=True,capture_output=True)
  (root/f"{name}.txt").write_text("\n".join(p.extract_text(extraction_mode="layout") for p in doc.pages),encoding="utf-8")
  return f"{name}: {len(doc.pages)} pages saved"
 except Exception as e:return f"{name}: {type(e).__name__}: {e}"
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for result in pool.map(fetch,files.items()):print(result)
