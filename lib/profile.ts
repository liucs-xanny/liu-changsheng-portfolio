import profileData from "@/data/profile.json";

export type Education = { id: string; school: string; degree: string; time: string; detail: string; hidden?: boolean };
export type ProfileMetric = { id: string; value: string; label: string; hidden?: boolean };
export type Experience = { id: string; type: "award" | "research" | "campus"; time: string; title: string; detail: string; hidden?: boolean };
export type Profile = {
  name: string;
  englishName: string;
  headline: string;
  directions: string[];
  location: string;
  phone: string;
  email: string;
  portraits: { formal: string; practice: string };
  about: { heading: string; introduction: string; industries: string; interests: string };
  education: Education[];
  language: { title: string; detail: string };
  metrics: ProfileMetric[];
  tags: string[];
  experiences: Experience[];
  resume: { src: string; label: string };
};

export const profile = profileData as Profile;
