/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/cloudflare/dist/globals" />
/// <reference types="@cloudflare/workers-types" />

declare var process: {
  env: { NODE_ENV: "development" | "production" };
};

declare module "@remix-run/cloudflare" {
  import type {
    DataFunctionArgs as RemixDataFunctionArgs,
    SessionStorage,
  } from "@remix-run/cloudflare/dist/index";
  export * from "@remix-run/cloudflare/dist/index";

  export interface AppLoadContext extends Record<string, unknown> {
    env: Env;
    sessionStorage: SessionStorage;
  }

  export interface DataFunctionArgs
    extends Omit<RemixDataFunctionArgs, "context"> {
    context: AppLoadContext;
  }

  export interface ActionArgs extends DataFunctionArgs {}
  export interface LoaderArgs extends DataFunctionArgs {}
}
