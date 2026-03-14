self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/auth/login": [
    "static/chunks/pages/auth/login.js"
  ],
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/api/v1/:path*"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/analytics",
    "/api/auth/[...nextauth]",
    "/assignments",
    "/auth/login",
    "/auth/register",
    "/chat",
    "/classes",
    "/lessons",
    "/levels",
    "/live-classes",
    "/quizzes",
    "/resources",
    "/subjects",
    "/users"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()