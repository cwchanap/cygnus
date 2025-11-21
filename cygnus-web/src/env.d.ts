/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        DB: D1Database;
        CYGNUS_BUCKET: R2Bucket;
        PASSKEY: string;
      };
    };
  }
}
