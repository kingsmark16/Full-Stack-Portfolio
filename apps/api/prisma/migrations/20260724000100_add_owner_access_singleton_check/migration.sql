ALTER TABLE "owner_access"
ADD CONSTRAINT "OwnerAccess_singletonKey_check"
CHECK ("singletonKey" = 1);
