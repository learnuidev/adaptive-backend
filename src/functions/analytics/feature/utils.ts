export const constructFeatureKeyAndWebsiteId = (rawParams: {
  featureKey: string;
  websiteId: string;
}) => `${rawParams.featureKey}-${rawParams.websiteId}`;
