// Helper functions for working with finger bottles
// Finger bottles are special occasion bottles meant to be served on their own
// The isFingers property is stored in the bottle data (Cockpit CMS)

export const useFingers = () => {
  // No localStorage needed - finger status is part of the bottle data itself
  
  // Helper to check if a bottle is marked as a finger bottle
  const isFingers = (bottle: { isFingers?: boolean } | null | undefined): boolean => {
    return bottle?.isFingers === true;
  };

  return {
    isFingers,
  };
};
