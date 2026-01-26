import { onRequestOptions as __moderate_review_ts_onRequestOptions } from "C:\\Users\\alama\\OneDrive\\Documents\\GitHub\\halal-bites-finder\\functions\\moderate-review.ts"
import { onRequestPost as __moderate_review_ts_onRequestPost } from "C:\\Users\\alama\\OneDrive\\Documents\\GitHub\\halal-bites-finder\\functions\\moderate-review.ts"

export const routes = [
    {
      routePath: "/moderate-review",
      mountPath: "/",
      method: "OPTIONS",
      middlewares: [],
      modules: [__moderate_review_ts_onRequestOptions],
    },
  {
      routePath: "/moderate-review",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__moderate_review_ts_onRequestPost],
    },
  ]