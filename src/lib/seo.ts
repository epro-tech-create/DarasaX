export const SITE_URL = "https://www.darasax.com";
export const SITE_TITLE = "DarasaX — DIT Notes, Past Papers & Class Timetables";
export const SITE_DESCRIPTION = "Organize your DIT BENG24COE notes, assignments, class timetable and past papers with DarasaX. Built for students, class representatives and lecturers.";

export function isPublicSite() {
  return (process.env.APP_ROLE || process.env.NEXT_PUBLIC_APP_ROLE || "student") === "student";
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "DarasaX", url: `${SITE_URL}/`, inLanguage: ["en", "sw"] },
    { "@type": "WebApplication", "@id": `${SITE_URL}/#app`, name: "DarasaX", url: `${SITE_URL}/`, description: SITE_DESCRIPTION,
      applicationCategory: "EducationalApplication", operatingSystem: "Web", featureList: ["Lecture notes", "Class timetables", "Assignments", "Past papers", "Class material sharing"] },
  ],
};
