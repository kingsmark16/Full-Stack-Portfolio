-- Keep the singleton profile and ordered public content within the model rules.
ALTER TABLE "Profile"
ADD CONSTRAINT "Profile_singletonKey_default_check"
CHECK ("singletonKey" = 'default');

ALTER TABLE "Skill"
ADD CONSTRAINT "Skill_displayOrder_nonnegative_check"
CHECK ("displayOrder" >= 0);

ALTER TABLE "Experience"
ADD CONSTRAINT "Experience_displayOrder_nonnegative_check"
CHECK ("displayOrder" >= 0);

ALTER TABLE "Experience"
ADD CONSTRAINT "Experience_current_endMonth_check"
CHECK (
  ("current" = true AND "endMonth" IS NULL)
  OR ("current" = false AND "endMonth" IS NOT NULL)
);

ALTER TABLE "Education"
ADD CONSTRAINT "Education_displayOrder_nonnegative_check"
CHECK ("displayOrder" >= 0);

ALTER TABLE "Education"
ADD CONSTRAINT "Education_current_endYear_check"
CHECK (
  ("current" = true AND "endYear" IS NULL)
  OR ("current" = false AND "endYear" IS NOT NULL)
);

ALTER TABLE "Certification"
ADD CONSTRAINT "Certification_displayOrder_nonnegative_check"
CHECK ("displayOrder" >= 0);

ALTER TABLE "Service"
ADD CONSTRAINT "Service_displayOrder_nonnegative_check"
CHECK ("displayOrder" >= 0);

ALTER TABLE "Project"
ADD CONSTRAINT "Project_displayOrder_nonnegative_check"
CHECK ("displayOrder" >= 0);
