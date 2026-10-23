export const SITE_URL = "https://www.darasax.com";
export const SITE_TITLE = "DarasaX | University Student Activities & Learning Materials";
export const SITE_DESCRIPTION = "DarasaX helps universities manage student activities, learning materials, assignments, timetables and announcements in one connected academic platform.";

export function isPublicSite() {
  return (process.env.APP_ROLE || process.env.NEXT_PUBLIC_APP_ROLE || "student") === "student";
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "DarasaX", alternateName: ["Darasax", "Darasa X"], description: SITE_DESCRIPTION, url: `${SITE_URL}/`, inLanguage: ["en", "sw"] },
    { "@type": "WebApplication", "@id": `${SITE_URL}/#app`, name: "DarasaX", url: `${SITE_URL}/`, description: SITE_DESCRIPTION,
      applicationCategory: "EducationalApplication", operatingSystem: "Web", audience: { "@type": "EducationalAudience", educationalRole: ["student", "teacher", "administrator"] }, featureList: ["University student activities", "Learning materials", "Timetables", "Assignments", "Announcements", "Past papers"] },
  ],
};
