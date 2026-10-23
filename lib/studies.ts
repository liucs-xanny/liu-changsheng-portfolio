import studiesData from "@/data/studies.json";

export type Study = {
  id: string;
  title: string;
  category: string;
  src: string;
  thumbnail?: string;
  hidden?: boolean;
};

export const studies = (studiesData as Study[]).filter((study) => !study.hidden);
