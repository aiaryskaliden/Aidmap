"""Cache public official research pages for reproducible local inspection."""
import json, pathlib, urllib.request, concurrent.futures, re
from html.parser import HTMLParser
root=pathlib.Path(__file__).resolve().parents[1]
target=root/"tmp"/"research";target.mkdir(parents=True,exist_ok=True)
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[];self.skip=0
 def handle_starttag(self,tag,attrs):
  if tag in ("script","style"):self.skip+=1
 def handle_endtag(self,tag):
  if tag in ("script","style"):self.skip=max(0,self.skip-1)
 def handle_data(self,data):
  if not self.skip and data.strip():self.parts.append(re.sub(r"\s+"," ",data.strip()))
urls={}
for u in json.loads((root/"docs/research/legacy-core-snapshot.json").read_text(encoding="utf-8")):
 for s in u["sources"]:urls.setdefault(s["url"],u["id"]+"-"+s["id"])
extra={
 "harvard-first":"https://college.harvard.edu/admissions/apply/first-year-applicants",
 "harvard-requirements":"https://college.harvard.edu/admissions/apply/application-requirements",
 "yale-essays":"https://admissions.yale.edu/essay-topics",
 "yale-selection":"https://admissions.yale.edu/what-yale-looks-for",
 "princeton-checklist":"https://admission.princeton.edu/apply/application-checklist",
 "princeton-questions":"https://admission.princeton.edu/apply/princeton-specific-questions",
 "princeton-paper":"https://admission.princeton.edu/apply/graded-written-paper",
 "mit-checklist":"https://mitadmissions.org/apply/firstyear/deadlines-requirements/",
 "mit-essays":"https://mitadmissions.org/apply/firstyear/essays-activities-academics/",
 "mit-selection":"https://mitadmissions.org/apply/process/what-we-look-for/",
 "amherst-first":"https://www.amherst.edu/admission/apply/firstyear",
 "amherst-writing":"https://www.amherst.edu/admission/apply/firstyear/writing-supplement",
 "dartmouth-selection":"https://admissions.dartmouth.edu/glossary-term/what-we-look",
 "dartmouth-essays":"https://admissions.dartmouth.edu/apply-dartmouth/writing-supplement",
 "brown-checklist":"https://admission.brown.edu/first-year/application-checklist",
 "brown-apply":"https://admission.brown.edu/first-year/how-apply",
 "brown-selection":"https://admission.brown.edu/international/admission-criteria",
 "bowdoin-apply":"https://www.bowdoin.edu/admissions/apply/",
 "bowdoin-aid":"https://www.bowdoin.edu/student-aid/apply-for-aid/international-students.html",
}
for name,url in extra.items():urls[url]=name
def fetch(item):
 url,name=item
 path=target/f"{name}.txt"
 if path.exists():return {"url":url,"file":path.name,"status":"cached"}
 if url.lower().endswith(".pdf"):return {"url":url,"status":"pdf skipped"}
 try:
  req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
  response=urllib.request.urlopen(req,timeout=18)
  html=response.read().decode("utf-8",errors="replace")
  parser=Text();parser.feed(html)
  path.write_text(url+"\n"+"\n".join(parser.parts),encoding="utf-8")
  return {"url":url,"file":path.name,"status":response.status}
 except Exception as e:return {"url":url,"status":str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(fetch,urls.items()))
(target/"index.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
print(json.dumps({"pages":len(results),"read":sum(r["status"] in (200,"cached") for r in results),"failures":[r for r in results if r["status"] not in (200,"cached","pdf skipped")]},indent=2))
