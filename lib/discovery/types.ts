export type DiscoveryKind = "profile" | "essay";

export type DiscoveryRecord = {
  id: string;
  kind: DiscoveryKind;
  title: string;
  university: string;
  subject: string | null;
  situation: string;
  theme: string;
  summary: string;
  free: boolean;
  publisher: string;
  sourceUrl: string;
  checkedAt: string;
  notes: string[];
  focusQuestion: string;
};
