// Stub: the original used @lovable.dev/cloud-auth-js which isn't installed in this
// environment. OAuth sign-in is not used for the gesture/draw functionality.
export const lovable = {
  auth: {
    signInWithOAuth: async (
      _provider: "google" | "apple" | "microsoft",
      _opts?: { redirect_uri?: string; extraParams?: Record<string, string> },
    ) => {
      return { error: new Error("OAuth not configured in this environment") };
    },
  },
};
