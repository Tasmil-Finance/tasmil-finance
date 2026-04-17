// @ts-check
const { defineConfig } = require("@kubb/core");
const { pluginOas } = require("@kubb/plugin-oas");
const { pluginClient } = require("@kubb/plugin-client");
const { pluginTs } = require("@kubb/plugin-ts");
const { pluginReactQuery } = require("@kubb/plugin-react-query");
const fs = require("node:fs");

function toKebabCase(str) {
  if (!str || typeof str !== "string") return str;
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

const config = defineConfig({
  input: {
    path: (() => {
      const fixedSpecPath = "./temp-openapi-backend.json";
      if (fs.existsSync(fixedSpecPath)) return fixedSpecPath;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:6756";
      return `${backendUrl.replace(/\/$/, "")}/api-json`;
    })(),
  },

  output: {
    path: "./src/gen-backend",
    clean: true,
    write: true,
    format: false,
  },

  hooks: {
    done: ['echo "✓ Backend API generation completed"'],
  },

  plugins: [
    pluginOas({
      output: { path: "./schemas" },
      validate: false,
      serverIndex: 0,
      contentType: "application/json",
    }),

    pluginTs({
      output: { path: "./types" },
      transformers: {
        name: (name, type) => {
          if (!name) return name;
          return type === "file" ? toKebabCase(name) : name;
        },
      },
    }),

    pluginClient({
      output: { path: "./client" },
      importPath: "@/lib/kubb-backend-client",
      transformers: {
        name: (name, type) => {
          if (!name) return name;
          return type === "file" ? toKebabCase(name) : name;
        },
      },
    }),

    pluginReactQuery({
      output: { path: "./hooks" },
      transformers: {
        name: (name, type) => {
          if (!name) return name;
          return type === "file" ? toKebabCase(name) : name;
        },
      },
    }),
  ],
});

module.exports = config;
